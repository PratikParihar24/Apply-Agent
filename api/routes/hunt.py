from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId
from datetime import datetime
import uuid
import queue
import threading
import json
import asyncio
import os
from fastapi import Request
from svix.webhooks import Webhook, WebhookVerificationError
from utils.encryption import decrypt

from core.database import get_db
from core.auth import get_current_user
from agents.resume_processor import ResumeProcessor
from agents.search_agent import SearchAgent
from agents.job_listing_agent import JobListingAgent
from agents.tailor_agent import TailorAgent
from agents.writer_agent import WriterAgent
from agents.sending_agent import SendingAgent
from utils.imap_monitor import check_replies_for_user
from utils.enrichment import enrich_company

router = APIRouter(tags=["hunt"])

# Keep the hunt stream queues in-memory
hunt_queues = {}
resume_processor = ResumeProcessor()

class SearchRequest(BaseModel):
    role: str
    location: str
    max_results: int
    mode: Optional[str] = "job_listings"
    company_size: Optional[str] = "any"
    company_type: Optional[str] = "any"
    writing_style: Optional[str] = "casual"

class SendRequest(BaseModel):
    cover_letter: str
    email_body: str
    subject: str
    tailored_resume: str
    recipient_email: str

@router.get("/api/hunt/preferences")
async def get_hunt_preferences(current_user_id: str = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if user and "hunt_preferences" in user:
        # Convert any potential ObjectID to string if inside (but it should be clean json)
        return user["hunt_preferences"]
    return {}

@router.post("/api/hunt/start")
async def start_hunt(request: SearchRequest, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    main_loop = asyncio.get_running_loop()
    
    # Save the full hunt parameters to the user's MongoDB document
    preferences = {
        "role": request.role,
        "location": request.location,
        "company_size": request.company_size,
        "company_type": request.company_type,
        "mode": request.mode,
        "writing_style": request.writing_style,
        "max_results": request.max_results
    }
    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": {"hunt_preferences": preferences}}
    )
    
    # Fetch active resume to get the summary
    resume = await db.resumes.find_one({"user_id": current_user_id, "is_active": True})
    resume_summary_text = resume.get("summary", "") if resume else ""
    
    job_id = str(uuid.uuid4())
    hunt_queues[job_id] = queue.Queue()
    
    # Create a hunt session document in MongoDB
    hunt_doc = {
        "user_id": current_user_id,
        "role": request.role,
        "location": request.location,
        "mode": request.mode,
        "company_size": request.company_size,
        "company_type": request.company_type,
        "writing_style": request.writing_style,
        "max_results": request.max_results,
        "status": "started",
        "created_at": datetime.utcnow()
    }
    result = await db.hunt_sessions.insert_one(hunt_doc)
    hunt_id = str(result.inserted_id)
    
    def background_search():
        count = 0
        
        def run_db_call(coro):
            future = asyncio.run_coroutine_threadsafe(coro, main_loop)
            return future.result()
        
        async def insert_company(doc):
            await db.companies.insert_one(doc)

        async def update_session():
            await db.hunt_sessions.update_one(
                {"_id": ObjectId(hunt_id)},
                {"$set": {"status": "done"}}
            )

        def on_result(company):
            nonlocal count
            if count < request.max_results:
                company_id = str(uuid.uuid4())
                company["id"] = company_id
                
                # Save to companies collection under this hunt and user
                run_db_call(insert_company({
                    "_id": company_id,
                    "hunt_id": hunt_id,
                    "user_id": current_user_id,
                    "company": company.get("company"),
                    "job_title": company.get("job_title"),
                    "website": company.get("website"),
                    "unverified": company.get("unverified", False),
                    "description": company.get("description"),
                    "company_description": company.get("company_description", ""),
                    "hr_email": company.get("hr_email"),
                    "apply_url": company.get("apply_url"),
                    "source": company.get("source"),
                    "score": company.get("score"),
                    "fit_explanation": company.get("fit_explanation"),
                    "status": "ready",
                    "type": company.get("type", "job_listing" if request.mode == "job_listings" else "cold_outreach")
                }))
                
                hunt_queues[job_id].put(company)
                count += 1

                # Start background enrichment without blocking the stream
                def run_enrichment(comp_dict, comp_id):
                    try:
                        enriched = enrich_company(comp_dict)
                        # Save enriched fields to MongoDB
                        async def update_db_company():
                            await db.companies.update_one(
                                {"_id": comp_id},
                                {"$set": {
                                    "website": enriched.get("website", ""),
                                    "hr_email": enriched.get("hr_email", ""),
                                    "career_page": enriched.get("career_page", ""),
                                    "company_description": enriched.get("company_description", "")
                                }}
                            )
                        run_db_call(update_db_company())
                        
                        # Emit SSE event only if any enrichment found
                        if (enriched.get("website") or enriched.get("hr_email") or 
                            enriched.get("career_page") or enriched.get("company_description")):
                            enrich_event = {
                                "event": "company_enriched",
                                "company_id": comp_id,
                                "website": enriched.get("website", ""),
                                "hr_email": enriched.get("hr_email", ""),
                                "career_page": enriched.get("career_page", ""),
                                "company_description": enriched.get("company_description", "")
                            }
                            hunt_queues[job_id].put(enrich_event)
                    except Exception as ex:
                        print(f"Error in background enrichment: {ex}")

                threading.Thread(target=run_enrichment, args=(company.copy(), company_id)).start()
                
        try:
            if request.mode == "job_listings":
                listing_agent = JobListingAgent()
                listing_agent.search_stream(request.role, request.location, resume_summary_text, on_result)
            else:
                search_agent = SearchAgent()
                search_agent.search_stream(
                    request.role, 
                    request.location, 
                    resume_summary_text, 
                    on_result, 
                    company_type=request.company_type, 
                    company_size=request.company_size
                )
        except Exception as e:
            print(f"Background search error: {e}")
        finally:
            run_db_call(update_session())
            hunt_queues[job_id].put({"status": "done"})


    thread = threading.Thread(target=background_search)
    thread.start()
    
    return {"job_id": job_id, "hunt_id": hunt_id, "status": "started"}


@router.get("/api/hunt/stream/{job_id}")
async def stream_hunt(job_id: str, current_user_id: str = Depends(get_current_user)):
    if job_id not in hunt_queues:
        raise HTTPException(status_code=404, detail="Invalid job_id")
        
    q = hunt_queues[job_id]
    
    async def event_generator():
        while True:
            while q.empty():
                await asyncio.sleep(0.2)
                
            item = q.get()
            if item.get("status") == "done":
                yield f"data: {json.dumps(item)}\n\n"
                break
                
            yield f"data: {json.dumps(item)}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

class GenerateRequest(BaseModel):
    custom_instructions: Optional[str] = None

@router.post("/api/generate/{company_id}")
async def generate_materials(company_id: str, request: GenerateRequest = None, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    company = await db.companies.find_one({"_id": company_id, "user_id": current_user_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    resume = await db.resumes.find_one({"user_id": current_user_id, "is_active": True})
    if not resume:
        raise HTTPException(status_code=400, detail="No active resume found. Please upload one first.")
        
    resume_summary_text = resume.get("summary", "")
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    user_settings = {
        "preferred_llm": user.get("preferred_llm", "auto"),
        "ollama_url": user.get("ollama_url", ""),
        "gemini_api_key": user.get("gemini_api_key", "") # This is safely encrypted in the DB!
    } if user else {}

    candidate_name = user.get("name") if user else None

    # Scrape company description
    company_description = ""
    if company.get("website"):
        try:
            search_agent = SearchAgent()
            company_description = search_agent._scrape_company_description(company.get("website"))
            if company_description:
                await db.companies.update_one(
                    {"_id": company_id, "user_id": current_user_id},
                    {"$set": {"company_description": company_description}}
                )
                company["company_description"] = company_description
        except Exception as e:
            print(f"Warning: Failed to scrape company description: {e}")
            
    tailor_agent = TailorAgent(user_settings)
    tailored_resume = tailor_agent.tailor(company, resume_processor, rewrite=True)
    
    writer_agent = WriterAgent(user_settings)
    
    # Retrieve writing style from the associated hunt session
    writing_style = "casual"
    if company.get("hunt_id"):
        try:
            hunt_session = await db.hunt_sessions.find_one({"_id": ObjectId(company["hunt_id"])})
            if hunt_session:
                writing_style = hunt_session.get("writing_style", "casual")
        except Exception as e:
            print(f"Warning: Failed to fetch hunt session for writing style: {e}")

    custom_inst = request.custom_instructions if request else None
    
    result = writer_agent.write(
        company, 
        resume_summary_text, 
        tailored_resume, 
        company_description=company_description, 
        custom_instructions=custom_inst, 
        candidate_name=candidate_name,
        writing_style=writing_style
    )
    
    cover_letter = result.get("cover_letter", "")
    email_body = result.get("email_body", "")
    subject = result.get("subject", "")
    
    # Save the generated content back to the companies collection
    llm_provider = result.get("llm_provider", "unknown")
    
    # Save the generated content back to the companies collection
    await db.companies.update_one(
        {"_id": company_id, "user_id": current_user_id},
        {"$set": {
            "cover_letter": cover_letter,
            "email_body": email_body,
            "subject": subject,
            "tailored_resume": tailored_resume,
            "llm_provider": llm_provider,
            "status": "generated"
        }}
    )
    
    return {
        "cover_letter": cover_letter,
        "email_body": email_body,
        "subject": subject,
        "tailored_resume": tailored_resume,
        "llm_provider": llm_provider
    }


@router.post("/api/send/{company_id}")
async def send_application(company_id: str, request: SendRequest, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    company = await db.companies.find_one({"_id": company_id, "user_id": current_user_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    # Fetch user for potential personal Resend key
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    user_resend_key = decrypt(user.get("resend_api_key")) if user and user.get("resend_api_key") else None

    sending_agent = SendingAgent()
    try:
        res = sending_agent.send_application(
            company=company,
            cover_letter=request.cover_letter,
            email_body=request.email_body,
            subject=request.subject,
            tailored_resume=request.tailored_resume,
            user_resend_key=user_resend_key,
            user_id=current_user_id
        )
        
        # Save to applications collection
        app_doc = {
            "user_id": current_user_id,
            "company_id": company_id,
            "company_name": company.get("company"),
            "job_title": company.get("job_title"),
            "applied_at": datetime.utcnow(),
            "last_updated": datetime.utcnow(),
            "status": "applied" if res.get("success") else "failed",
            "status_history": [{
                "status": "applied" if res.get("success") else "failed",
                "timestamp": datetime.utcnow(),
                "source": "manual"
            }] if res.get("success") else [],
            "message": res.get("message"),
            "message_id": res.get("message_id"),
            "llm_provider": company.get("llm_provider", "unknown"),
            "cover_letter": request.cover_letter,
            "email_body": request.email_body,
            "subject": request.subject,
            "tailored_resume": request.tailored_resume,
            "website": company.get("website"),
            "hr_email": company.get("hr_email"),
            "apply_url": company.get("apply_url"),
            "fit_explanation": company.get("fit_explanation"),
            "score": company.get("score")
        }
        await db.applications.insert_one(app_doc)
        
        # Update company status to applied
        await db.companies.update_one(
            {"_id": company_id, "user_id": current_user_id},
            {"$set": {"status": "applied"}}
        )
        
        if not res.get("success"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("message"))
            
        return {"success": res["success"], "status": res["message"]}
    except Exception as e:
        # Save failed application
        app_doc = {
            "user_id": current_user_id,
            "company_id": company_id,
            "company_name": company.get("company"),
            "job_title": company.get("job_title"),
            "applied_at": datetime.utcnow(),
            "last_updated": datetime.utcnow(),
            "status": "failed",
            "status_history": [{
                "status": "failed",
                "timestamp": datetime.utcnow(),
                "source": "manual"
            }],
            "message": str(e),
            "llm_provider": company.get("llm_provider", "unknown"),
            "cover_letter": request.cover_letter,
            "email_body": request.email_body,
            "subject": request.subject,
            "tailored_resume": request.tailored_resume,
            "website": company.get("website"),
            "hr_email": company.get("hr_email"),
            "apply_url": company.get("apply_url"),
            "fit_explanation": company.get("fit_explanation"),
            "score": company.get("score")
        }
        await db.applications.insert_one(app_doc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.post("/api/webhooks/resend")
async def resend_webhook(request: Request):
    secret = os.getenv("RESEND_WEBHOOK_SECRET")
    if not secret:
        # If no secret configured, accept but log warning
        print("WARNING: RESEND_WEBHOOK_SECRET not set, accepting webhook unverified.")
        payload = await request.json()
    else:
        headers = request.headers
        payload_bytes = await request.body()
        try:
            wh = Webhook(secret)
            payload = wh.verify(payload_bytes, headers)
        except WebhookVerificationError as e:
            raise HTTPException(status_code=400, detail="Invalid webhook signature")
            
    db = get_db()
    event_type = payload.get("type")
    
    # We care about email.opened and email.clicked
    if event_type in ["email.opened", "email.clicked"]:
        data = payload.get("data", {})
        message_id = data.get("email_id")
        
        if message_id:
            # Update application status to viewed
            result = await db.applications.update_many(
                {"message_id": message_id},
                {
                    "$set": {"status": "viewed", "last_updated": datetime.utcnow()},
                    "$push": {
                        "status_history": {
                            "status": "viewed",
                            "timestamp": datetime.utcnow(),
                            "source": "auto_resend"
                        }
                    }
                }
            )
            if result.modified_count == 0:
                print(f"Webhook received for message_id {message_id} but no matching application found.")
                
    return {"success": True}

class StatusUpdateRequest(BaseModel):
    status: str

@router.get("/api/applications")
async def get_applications(current_user_id: str = Depends(get_current_user)):
    db = get_db()
    cursor = db.applications.find({"user_id": current_user_id}).sort("applied_at", -1)
    apps = await cursor.to_list(length=100)
    for app in apps:
        app["_id"] = str(app["_id"])
        if "applied_at" in app and isinstance(app["applied_at"], datetime):
            app["applied_at"] = app["applied_at"].isoformat()
        if "last_updated" in app and isinstance(app["last_updated"], datetime):
            app["last_updated"] = app["last_updated"].isoformat()
        if "sent_at" in app and isinstance(app["sent_at"], datetime):
            app["applied_at"] = app["sent_at"].isoformat()
        if "status_history" in app:
            for h in app["status_history"]:
                if "timestamp" in h and isinstance(h["timestamp"], datetime):
                    h["timestamp"] = h["timestamp"].isoformat()
    return apps

@router.get("/api/applications/cron")
async def get_applications_cron(current_user_id: str = Depends(get_current_user)):
    db = get_db()
    cursor = db.applications.find(
        {"user_id": current_user_id},
        {"tailored_resume": 0, "cover_letter": 0, "email_body": 0, "fit_explanation": 0}
    ).sort("applied_at", -1)
    apps = await cursor.to_list(length=100)
    for app in apps:
        app["_id"] = str(app["_id"])
        if "applied_at" in app and isinstance(app["applied_at"], datetime):
            app["applied_at"] = app["applied_at"].isoformat()
        if "last_updated" in app and isinstance(app["last_updated"], datetime):
            app["last_updated"] = app["last_updated"].isoformat()
        if "sent_at" in app and isinstance(app["sent_at"], datetime):
            app["applied_at"] = app["sent_at"].isoformat()
        if "status_history" in app:
            for h in app["status_history"]:
                if "timestamp" in h and isinstance(h["timestamp"], datetime):
                    h["timestamp"] = h["timestamp"].isoformat()
    return apps

@router.put("/api/applications/{company_id}/status")
async def update_application_status(company_id: str, request: StatusUpdateRequest, current_user_id: str = Depends(get_current_user)):
    valid_statuses = ["applied", "viewed", "replied", "interview", "rejected"]
    if request.status not in valid_statuses:
        raise HTTPException(status_code=422, detail=f"Invalid status. Must be one of {valid_statuses}")
        
    db = get_db()
    query = {"user_id": current_user_id}
    try:
        query["_id"] = ObjectId(company_id)
    except Exception:
        query["company_id"] = company_id

    app = await db.applications.find_one(query)
    if not app:
        query = {"user_id": current_user_id, "company_id": company_id}
        app = await db.applications.find_one(query)
        if not app:
            raise HTTPException(status_code=404, detail="Application not found")

    await db.applications.update_one(
        {"_id": app["_id"]},
        {
            "$set": {
                "status": request.status,
                "last_updated": datetime.utcnow()
            },
            "$push": {
                "status_history": {
                    "status": request.status,
                    "timestamp": datetime.utcnow(),
                    "source": "manual"
                }
            }
        }
    )
    return {"success": True, "status": request.status}

@router.delete("/api/applications/{application_id}")
async def delete_application(application_id: str, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    query = {"user_id": current_user_id}
    try:
        query["_id"] = ObjectId(application_id)
    except Exception:
        query["company_id"] = application_id
        
    result = await db.applications.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"success": True, "message": "Application deleted successfully"}

@router.post("/api/applications/check-replies")
async def check_replies_endpoint(current_user_id: str = Depends(get_current_user)):
    await check_replies_for_user(current_user_id)
    return {"success": True, "message": "IMAP reply scan completed"}

