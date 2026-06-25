from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
import uuid
import queue
import threading
import json
import asyncio

from core.database import get_db
from core.auth import get_current_user
from agents.resume_processor import ResumeProcessor
from agents.search_agent import SearchAgent
from agents.tailor_agent import TailorAgent
from agents.writer_agent import WriterAgent
from agents.sending_agent import SendingAgent

router = APIRouter(tags=["hunt"])

# Keep the hunt stream queues in-memory
hunt_queues = {}
resume_processor = ResumeProcessor()

class SearchRequest(BaseModel):
    role: str
    location: str
    max_results: int

class SendRequest(BaseModel):
    cover_letter: str
    email_body: str
    subject: str
    tailored_resume: str
    recipient_email: str

@router.post("/api/hunt/start")
async def start_hunt(request: SearchRequest, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    main_loop = asyncio.get_running_loop()
    
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
        "status": "started",
        "created_at": datetime.utcnow()
    }
    result = await db.hunt_sessions.insert_one(hunt_doc)
    hunt_id = str(result.inserted_id)
    
    def background_search():
        search_agent = SearchAgent()
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
                    "hr_email": company.get("hr_email"),
                    "apply_url": company.get("apply_url"),
                    "source": company.get("source"),
                    "score": company.get("score"),
                    "fit_explanation": company.get("fit_explanation"),
                    "status": "ready"
                }))
                
                hunt_queues[job_id].put(company)
                count += 1
                
        try:
            search_agent.search_stream(request.role, request.location, resume_summary_text, on_result)
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

@router.post("/api/generate/{company_id}")
async def generate_materials(company_id: str, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    company = await db.companies.find_one({"_id": company_id, "user_id": current_user_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    resume = await db.resumes.find_one({"user_id": current_user_id, "is_active": True})
    if not resume:
        raise HTTPException(status_code=400, detail="No active resume found. Please upload one first.")
        
    resume_summary_text = resume.get("summary", "")
    
    tailor_agent = TailorAgent()
    tailored_resume = tailor_agent.tailor(company, resume_processor)
    
    writer_agent = WriterAgent()
    result = writer_agent.write(company, resume_summary_text, tailored_resume)
    
    cover_letter = result.get("cover_letter", "")
    email_body = result.get("email_body", "")
    subject = result.get("subject", "")
    
    # Save the generated content back to the companies collection
    await db.companies.update_one(
        {"_id": company_id, "user_id": current_user_id},
        {"$set": {
            "cover_letter": cover_letter,
            "email_body": email_body,
            "subject": subject,
            "tailored_resume": tailored_resume,
            "status": "generated"
        }}
    )
    
    return {
        "cover_letter": cover_letter,
        "email_body": email_body,
        "subject": subject,
        "tailored_resume": tailored_resume
    }

@router.post("/api/send/{company_id}")
async def send_application(company_id: str, request: SendRequest, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    company = await db.companies.find_one({"_id": company_id, "user_id": current_user_id})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    sending_agent = SendingAgent()
    try:
        res = sending_agent.send_application(
            company=company,
            cover_letter=request.cover_letter,
            email_body=request.email_body,
            subject=request.subject,
            tailored_resume=request.tailored_resume
        )
        
        # Save to applications collection
        app_doc = {
            "user_id": current_user_id,
            "company_id": company_id,
            "company_name": company.get("company"),
            "job_title": company.get("job_title"),
            "sent_at": datetime.utcnow(),
            "status": "sent" if res.get("success") else "failed",
            "message": res.get("message")
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
            "sent_at": datetime.utcnow(),
            "status": "failed",
            "message": str(e)
        }
        await db.applications.insert_one(app_doc)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
