from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import shutil
import os
import sys
import json
import uuid
import queue
import threading
import asyncio

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from agents.resume_processor import ResumeProcessor

from agents.search_agent import SearchAgent
from agents.shortlister_agent import ShortlisterAgent
from agents.tailor_agent import TailorAgent
from agents.writer_agent import WriterAgent
from agents.sending_agent import SendingAgent
from core.llm_router import get_active_llm_info

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Server-level variables
hunt_queues = {}
resume_processor = ResumeProcessor()
last_search_results = []
resume_summary_text = ""
resume_sections_data = []

class SearchRequest(BaseModel):
    role: str
    location: str
    max_results: int

class SendRequest(BaseModel):
    cover_letter: str
    email_body: str
    subject: str
    recipient_email: str

@app.post("/api/resume/upload")
def upload_resume(file: UploadFile = File(...)):
    global resume_summary_text, resume_sections_data
    os.makedirs("data", exist_ok=True)
    file_path = "data/resume.pdf"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    result = resume_processor.process(file_path)
    resume_summary_text = result.get("summary", "")
    resume_sections_data = result.get("sections_found", [])
    
    return {
        "success": True,
        "chunks_count": result.get("chunks_count", 0),
        "sections_found": resume_sections_data,
        "summary": resume_summary_text
    }

@app.post("/api/hunt/start")
async def start_hunt(request: SearchRequest):
    global resume_summary_text
    
    job_id = str(uuid.uuid4())
    hunt_queues[job_id] = queue.Queue()
    
    def background_search():
        search_agent = SearchAgent()
        count = 0
        
        def on_result(company):
            nonlocal count
            if count < request.max_results:
                if "id" not in company:
                    company["id"] = str(uuid.uuid4())
                hunt_queues[job_id].put(company)
                count += 1
                
        try:
            search_agent.search_stream(request.role, request.location, resume_summary_text, on_result)
        except Exception as e:
            print(f"Background search error: {e}")
        finally:
            hunt_queues[job_id].put({"status": "done"})

    thread = threading.Thread(target=background_search)
    thread.start()
    
    return {"job_id": job_id, "status": "started"}

@app.get("/api/hunt/stream/{job_id}")
async def stream_hunt(job_id: str):
    if job_id not in hunt_queues:
        return {"error": "Invalid job_id"}
        
    q = hunt_queues[job_id]
    
    async def event_generator():
        global last_search_results
        last_search_results = []
        
        while True:
            while q.empty():
                await asyncio.sleep(0.2)
                
            item = q.get()
            if item.get("status") == "done":
                yield f"data: {json.dumps(item)}\n\n"
                break
                
            last_search_results.append(item)
            yield f"data: {json.dumps(item)}\n\n"
            
    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/generate/{company_id}")
async def generate_materials(company_id: str):
    global last_search_results, resume_processor, resume_summary_text
    company = next((c for c in last_search_results if str(c.get("id")) == company_id), None)
    if not company:
        return {"error": "Company not found"}
        
    tailor_agent = TailorAgent()
    tailored_resume = tailor_agent.tailor(company, resume_processor)
    
    writer_agent = WriterAgent()
    result = writer_agent.write(company, resume_summary_text, tailored_resume)
    
    cover_letter = result.get("cover_letter", "")
    email_body = result.get("email_body", "")
    subject = result.get("subject", "")
    
    return {
        "cover_letter": cover_letter,
        "email_body": email_body,
        "subject": subject,
        "tailored_resume": tailored_resume
    }

@app.post("/api/send/{company_id}")
async def send_application(company_id: str, request: SendRequest):
    global last_search_results
    company = next((c for c in last_search_results if str(c.get("id")) == company_id), None)
    if not company:
        return {"success": False, "status": "Company not found"}
        
    sending_agent = SendingAgent()
    try:
        success = sending_agent.send(
            company=company,
            resume_path="data/resume.pdf",
            cover_letter=request.cover_letter,
            email_body=request.email_body,
            subject=request.subject
        )
        return {"success": success, "status": "sent" if success else "failed"}
    except Exception as e:
        return {"success": False, "status": str(e)}

@app.get("/api/status")
async def get_status():
    global resume_processor, resume_summary_text, resume_sections_data
    is_ready = resume_processor.is_ready()
    return {
        "resume_ready": is_ready,
        "sections_found": resume_sections_data,
        "summary_preview": resume_summary_text[:200] + "..." if resume_summary_text else ""
    }

@app.get("/api/llm/status")
def get_llm_status():
    return get_active_llm_info()
