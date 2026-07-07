from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from core.database import init_db
from core.llm_router import get_active_llm_info
from api.routes.auth import router as auth_router
from api.routes.hunt import router as hunt_router, resume_processor
from api.routes.resume import router as resume_router
from api.routes.community import router as community_router

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    if not os.getenv("RESEND_API_KEY"):
        print("WARNING: RESEND_API_KEY not set — email sending will fail.")

# Include routers
app.include_router(auth_router)
app.include_router(hunt_router)
app.include_router(resume_router)
app.include_router(community_router)

@app.get("/api/status")
async def get_status():
    # Keep global status check for resume readiness
    is_ready = resume_processor.is_ready()
    return {
        "resume_ready": is_ready,
        "sections_found": [],
        "summary_preview": ""
    }

@app.get("/api/llm/status")
def get_llm_status():
    return get_active_llm_info()

from pydantic import BaseModel

@app.get("/api/user/profile")
def get_user_profile():
    from dotenv import load_dotenv
    env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
    load_dotenv(env_path)
    return {"email": os.getenv("GMAIL_ADDRESS", "")}

class FeedbackRequest(BaseModel):
    name: str = ""
    email: str = ""
    message: str

@app.post("/api/feedback")
async def receive_feedback(request: FeedbackRequest):
    print(f"Feedback received from {request.name} ({request.email}): {request.message}")
    return {"success": True, "message": "Feedback received"}

