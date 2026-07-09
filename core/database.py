import os
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import MONGODB_URI, MONGODB_DB

client = None
db = None

def get_db():
    global db
    if db is None:
        raise RuntimeError("Database not initialized. Call init_db first.")
    return db

async def init_db():
    global client, db
    print(f"Connecting to MongoDB at: {MONGODB_URI} (DB: {MONGODB_DB})")
    client = AsyncIOMotorClient(MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[MONGODB_DB]
    
    # Create indexes as required by the spec
    try:
        await db.users.create_index("email", unique=True)
        await db.resumes.create_index("user_id")
        await db.hunt_sessions.create_index("user_id")
        await db.companies.create_index([("hunt_id", 1), ("user_id", 1)])
        await db.community_posts.create_index([("created_at", -1)])
        await db.applications.create_index("user_id")
        await db.users.create_index("gmail_address")
        await db.users.create_index("hunt_preferences")
        await db.applications.create_index("status")
        await db.applications.create_index([("user_id", 1), ("applied_at", -1)])
        print("Database collections and indexes initialized successfully.")
    except Exception as e:
        print(f"WARNING: Failed to initialize MongoDB indexes: {e}")
        print("The application will continue starting, but database operations will fail until a valid MONGODB_URI is provided.")
