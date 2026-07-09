from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timedelta
from core.database import get_db
from core.auth import get_current_user

import asyncio

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("")
async def get_analytics(current_user_id: str = Depends(get_current_user)):
    db = get_db()
    
    # Define pipelines
    pipeline_status = [
        {"$match": {"user_id": current_user_id}},
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    
    pipeline_recent = [
        {"$match": {"user_id": current_user_id}},
        {"$sort": {"applied_at": -1}},
        {"$limit": 1}
    ]
    
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    pipeline_roles = [
        {"$match": {"user_id": current_user_id}},
        {"$group": {"_id": "$job_title", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    
    pipeline_llm = [
        {"$match": {"user_id": current_user_id, "llm_provider": {"$exists": True, "$ne": None}}},
        {"$group": {"_id": "$llm_provider", "count": {"$sum": 1}}}
    ]

    # Run queries concurrently in parallel
    (
        total_applications,
        by_status_raw,
        recent_raw,
        applications_this_month,
        roles_raw,
        llm_raw
    ) = await asyncio.gather(
        db.applications.count_documents({"user_id": current_user_id}),
        db.applications.aggregate(pipeline_status).to_list(length=20),
        db.applications.aggregate(pipeline_recent).to_list(length=1),
        db.applications.count_documents({
            "user_id": current_user_id,
            "applied_at": {"$gte": thirty_days_ago}
        }),
        db.applications.aggregate(pipeline_roles).to_list(length=5),
        db.applications.aggregate(pipeline_llm).to_list(length=20)
    )
    
    # Map raw counts to a dictionary with default values
    by_status = {
        "applied": 0,
        "viewed": 0,
        "replied": 0,
        "interview": 0,
        "rejected": 0,
        "failed": 0
    }
    for item in by_status_raw:
        status_name = item["_id"]
        if status_name in by_status:
            by_status[status_name] = item["count"]
            
    # Calculate reply rate and interview rate
    reply_rate = 0.0
    interview_rate = 0.0
    if total_applications > 0:
        replied_count = by_status["replied"] + by_status["interview"] + by_status["rejected"]
        reply_rate = round(replied_count / total_applications, 3)
        interview_rate = round(by_status["interview"] / total_applications, 3)
        
    most_recent_application = None
    if recent_raw:
        dt = recent_raw[0].get("applied_at")
        if isinstance(dt, datetime):
            most_recent_application = dt.isoformat()
            
    top_roles = [item["_id"] for item in roles_raw if item["_id"]]
    llm_usage = {item["_id"]: item["count"] for item in llm_raw if item["_id"]}
    
    return {
        "total_applications": total_applications,
        "by_status": by_status,
        "reply_rate": reply_rate,
        "interview_rate": interview_rate,
        "most_recent_application": most_recent_application,
        "applications_this_month": applications_this_month,
        "top_roles": top_roles,
        "llm_usage": llm_usage
    }
