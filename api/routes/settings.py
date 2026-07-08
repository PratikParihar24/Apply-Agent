from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional 
from bson import ObjectId

from core.database import get_db 
from core.auth import get_current_user
from utils.encryption import encrypt,decrypt

router = APIRouter(tags=["settings"])

class SettingsUpdate(BaseModel):
    preferred_llm:Optional[str] = None
    ollama_url: Optional[str] = None 
    gemini_api_key:Optional[str] = None
    groq_api_key:Optional[str] = None
    openrouter_api_key:Optional[str] = None
    resend_api_key: Optional [str] = None 
    gmail_address:Optional[str] = None
    gmail_app_password: Optional[str] = None
    
            
@router.get("/api/settings")
async def get_settings(current_user_id: str = Depends(get_current_user)):
    db = get_db()
    user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    # Helper to mask sensitive keys (shows last 4 characters)
    def mask_key(key: str) -> str:
        if not key: return ""
        return f"{'*' * 10}{key[-4:]}" if len(key) >= 4 else "****"
    return {
        "preferred_llm": user.get("preferred_llm", "auto"),
        "ollama_url": user.get("ollama_url", ""),
        "gemini_api_key": mask_key(decrypt(user.get("gemini_api_key"))) if user.get("gemini_api_key") else "",
        "groq_api_key": mask_key(decrypt(user.get("groq_api_key"))) if user.get("groq_api_key") else "",
        "openrouter_api_key": mask_key(decrypt(user.get("openrouter_api_key"))) if user.get("openrouter_api_key") else "",
        "resend_api_key": mask_key(decrypt(user.get("resend_api_key"))) if user.get("resend_api_key") else "",
        "gmail_address": user.get("gmail_address", ""),
        "gmail_app_password": mask_key(decrypt(user.get("gmail_app_password"))) if user.get("gmail_app_password") else ""
    }
@router.put("/api/settings")
async def update_settings(settings: SettingsUpdate, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    
    update_data = {}
    
    # We only update fields that were actually provided in the request
    if settings.preferred_llm is not None:
        update_data["preferred_llm"] = settings.preferred_llm
    if settings.ollama_url is not None:
        update_data["ollama_url"] = settings.ollama_url
    if settings.gmail_address is not None:
        update_data["gmail_address"] = settings.gmail_address
        
    # Encrypt sensitive fields before saving to the database
    if settings.gemini_api_key is not None:
        update_data["gemini_api_key"] = encrypt(settings.gemini_api_key)
    if settings.resend_api_key is not None:
        update_data["resend_api_key"] = encrypt(settings.resend_api_key)
    if settings.gmail_app_password is not None:
        update_data["gmail_app_password"] = encrypt(settings.gmail_app_password)
    if hasattr(settings, 'groq_api_key') and settings.groq_api_key is not None:
        update_data["groq_api_key"] = encrypt(settings.groq_api_key)
    if hasattr(settings, 'openrouter_api_key') and settings.openrouter_api_key is not None:
        update_data["openrouter_api_key"] = encrypt(settings.openrouter_api_key)
    if not update_data:
        return {"success": True, "message": "No fields to update"}
    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$set": update_data}
    )
    return {"success": True}
@router.delete("/api/settings/field/{field_name}")
async def delete_settings_field(field_name: str, current_user_id: str = Depends(get_current_user)):
    allowed_fields = ["preferred_llm", "ollama_url", "gemini_api_key", "resend_api_key", "gmail_address", "gmail_app_password"]
    
    if field_name not in allowed_fields:
        raise HTTPException(status_code=400, detail="Invalid field name")
        
    db = get_db()
    # $unset removes the field entirely from the document
    await db.users.update_one(
        {"_id": ObjectId(current_user_id)},
        {"$unset": {field_name: ""}}
    )
    return {"success": True}