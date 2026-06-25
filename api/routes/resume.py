from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
import shutil
import os
from datetime import datetime
from core.database import get_db
from core.auth import get_current_user
from agents.resume_processor import ResumeProcessor

router = APIRouter(tags=["resume"])
resume_processor = ResumeProcessor()

@router.post("/api/resume/upload")
async def upload_resume(file: UploadFile = File(...), current_user_id: str = Depends(get_current_user)):
    db = get_db()
    os.makedirs("data", exist_ok=True)
    file_path = f"data/resume_{current_user_id}.pdf"
    
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )
        
    try:
        result = resume_processor.process(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to process resume PDF: {str(e)}"
        )
        
    summary = result.get("summary", "")
    sections_found = result.get("sections_found", [])
    chunks_count = result.get("chunks_count", 0)
    
    # Deactivate all other resumes for this user
    await db.resumes.update_many(
        {"user_id": current_user_id},
        {"$set": {"is_active": False}}
    )
    
    # Save the resume metadata
    resume_doc = {
        "user_id": current_user_id,
        "filename": file.filename,
        "summary": summary,
        "sections_found": sections_found,
        "chunks_count": chunks_count,
        "is_active": True,
        "uploaded_at": datetime.utcnow()
    }
    await db.resumes.insert_one(resume_doc)
    
    return {
        "success": True,
        "chunks_count": chunks_count,
        "sections_found": sections_found,
        "summary": summary
    }

@router.get("/api/resume/active")
async def get_active_resume(current_user_id: str = Depends(get_current_user)):
    db = get_db()
    resume = await db.resumes.find_one({"user_id": current_user_id, "is_active": True})
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active resume found"
        )
    return {
        "id": str(resume["_id"]),
        "filename": resume.get("filename"),
        "summary": resume.get("summary"),
        "sections_found": resume.get("sections_found", []),
        "chunks_count": resume.get("chunks_count", 0),
        "uploaded_at": resume.get("uploaded_at")
    }
