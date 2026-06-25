from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime
from core.database import get_db
from core.auth import get_current_user

router = APIRouter(tags=["community"])

class PostCreateRequest(BaseModel):
    username: str
    text: str
    tag: str

@router.get("/api/community/posts")
async def get_posts():
    db = get_db()
    cursor = db.community_posts.find().sort("created_at", -1).limit(50)
    posts = []
    async for doc in cursor:
        posts.append({
            "id": str(doc["_id"]),
            "user_id": doc.get("user_id"),
            "username": doc.get("username"),
            "text": doc.get("text"),
            "tag": doc.get("tag"),
            "likes_count": doc.get("likes_count", 0),
            "likes": doc.get("likes", []),
            "created_at": doc.get("created_at")
        })
    return posts

@router.post("/api/community/posts")
async def create_post(request: PostCreateRequest, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    post_doc = {
        "user_id": current_user_id,
        "username": request.username.strip(),
        "text": request.text.strip(),
        "tag": request.tag.strip(),
        "likes_count": 0,
        "likes": [],
        "created_at": datetime.utcnow()
    }
    result = await db.community_posts.insert_one(post_doc)
    
    post_doc["id"] = str(result.inserted_id)
    if "_id" in post_doc:
        del post_doc["_id"]
    post_doc["created_at"] = post_doc["created_at"].isoformat()
    
    return post_doc


@router.post("/api/community/posts/{post_id}/like")
async def toggle_like(post_id: str, current_user_id: str = Depends(get_current_user)):
    db = get_db()
    try:
        oid = ObjectId(post_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid post ID format"
        )
        
    post = await db.community_posts.find_one({"_id": oid})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
        
    likes = post.get("likes", [])
    if current_user_id in likes:
        # Unlike the post
        await db.community_posts.update_one(
            {"_id": oid},
            {
                "$pull": {"likes": current_user_id},
                "$inc": {"likes_count": -1}
            }
        )
        liked = False
    else:
        # Like the post
        await db.community_posts.update_one(
            {"_id": oid},
            {
                "$addToSet": {"likes": current_user_id},
                "$inc": {"likes_count": 1}
            }
        )
        liked = True
        
    # Get updated post to return correct count
    updated_post = await db.community_posts.find_one({"_id": oid})
    return {
        "success": True,
        "liked": liked,
        "likes_count": updated_post.get("likes_count", 0)
    }
