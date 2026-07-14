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
from api.routes.settings import router as settings_router
from api.routes.analytics import router as analytics_router
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"https?://.*",
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
app.include_router(settings_router)
app.include_router(analytics_router)

@app.get("/")
async def root():
    return {"status": "online", "message": "Agent Apply Backend API is running successfully."}

@app.get("/api/status")
async def get_status():
    # Keep global status check for resume readiness
    is_ready = resume_processor.is_ready()
    return {
        "resume_ready": is_ready,
        "sections_found": [],
        "summary_preview": ""
    }

from core.auth import get_current_user_optional
from core.database import get_db
from bson import ObjectId
from fastapi import Depends

@app.get("/api/llm/status")
async def get_llm_status(current_user_id: str = Depends(get_current_user_optional)):
    settings = {}
    if current_user_id:
        db = get_db()
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
        if user:
            settings = user
    return get_active_llm_info(settings)

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

