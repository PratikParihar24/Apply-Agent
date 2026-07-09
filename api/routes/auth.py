from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from pydantic import BaseModel
from bson import ObjectId
from core.database import get_db
from core.auth import hash_password, verify_password, create_jwt, get_current_user
from utils.imap_monitor import check_replies_for_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/register")
async def register(request: RegisterRequest):
    db = get_db()
    email_clean = request.email.strip().lower()
    
    # Check if user already exists
    existing_user = await db.users.find_one({"email": email_clean})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
        
    hashed = hash_password(request.password)
    user_doc = {
        "email": email_clean,
        "password": hashed,
        "name": request.name
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    token = create_jwt(user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": email_clean,
            "name": request.name
        }
    }

@router.post("/login")
async def login(request: LoginRequest, background_tasks: BackgroundTasks):
    db = get_db()
    email_clean = request.email.strip().lower()
    
    user = await db.users.find_one({"email": email_clean})
    if not user or not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
        
    user_id = str(user["_id"])
    token = create_jwt(user_id)
    background_tasks.add_task(check_replies_for_user, user_id)
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user["email"],
            "name": user.get("name", "")
        }
    }

@router.get("/me")
async def get_me(current_user_id: str = Depends(get_current_user)):
    db = get_db()
    try:
        user = await db.users.find_one({"_id": ObjectId(current_user_id)})
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
        
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "preferences": user.get("preferences")
    }

class UpdatePreferencesRequest(BaseModel):
    role: str
    location: str

@router.put("/update")
async def update_preferences(request: UpdatePreferencesRequest, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(current_user_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )
        
    await db.users.update_one(
        {"_id": oid},
        {"$set": {"preferences": {"role": request.role.strip(), "location": request.location.strip()}}}
    )
    return {"success": True, "message": "Preferences updated successfully"}

