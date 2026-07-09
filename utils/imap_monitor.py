import imaplib
import email
from email.header import decode_header
import os
import re
from datetime import datetime, timedelta
from bson import ObjectId
from core.database import get_db
from utils.encryption import decrypt

async def check_replies_for_user(user_id: str):
    print(f"Starting IMAP reply check for user: {user_id}")
    db = get_db()
    
    # 1. Fetch user settings
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        print("IMAP Monitor: User not found.")
        return
        
    gmail_address = user.get("gmail_address")
    encrypted_pw = user.get("gmail_app_password")
    
    if not gmail_address or not encrypted_pw:
        print("IMAP Monitor: Gmail address or App password not configured. Skipping.")
        return
        
    gmail_password = decrypt(encrypted_pw)
    if not gmail_password:
        print("IMAP Monitor: Failed to decrypt Gmail App Password. Skipping.")
        return

    # 2. Get all applications for user that are applied/viewed and have a message_id
    cursor = db.applications.find({
        "user_id": user_id,
        "status": {"$in": ["applied", "viewed"]},
        "message_id": {"$exists": True, "$ne": None}
    })
    applications = await cursor.to_list(length=200)
    if not applications:
        print("IMAP Monitor: No active applications to check replies for.")
        return
        
    # Map Resend message_id to application document
    # Clean the stored message_id just in case (e.g. remove any '<' or '>')
    app_map = {}
    for app in applications:
        m_id = app.get("message_id", "").strip("<> ")
        if m_id:
            app_map[m_id] = app

    # 3. Connect to IMAP
    try:
        # Wrap everything in an executor because imaplib is synchronous/blocking
        import asyncio
        loop = asyncio.get_running_loop()
        
        def run_imap():
            mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
            mail.login(gmail_address, gmail_password)
            mail.select("inbox")
            
            # Search inbox for emails received in the last 30 days
            date_since = (datetime.now() - timedelta(days=30)).strftime("%d-%b-%Y")
            status, response_data = mail.search(None, f'(SINCE "{date_since}")')
            
            if status != "OK":
                print(f"IMAP Monitor: Search failed: {response_data}")
                mail.logout()
                return []
                
            msg_ids = response_data[0].split()
            print(f"IMAP Monitor: Found {len(msg_ids)} messages in last 30 days to scan.")
            
            matches = []
            for msg_id in msg_ids:
                status, data = mail.fetch(msg_id, "(BODY[HEADER.FIELDS (IN-REPLY-TO REFERENCES)])")
                if status != "OK" or not data:
                    continue
                    
                raw_header = data[0][1]
                if not raw_header:
                    continue
                    
                msg = email.message_from_bytes(raw_header)
                in_reply_to = msg.get("In-Reply-To", "")
                references = msg.get("References", "")
                
                referenced_ids = re.findall(r'<([^>]+)>', in_reply_to + " " + references)
                for ref_id in referenced_ids:
                    ref_id_clean = ref_id.strip()
                    if ref_id_clean in app_map:
                        matches.append(ref_id_clean)
                        # Avoid duplicates
                        break
                        
            mail.close()
            mail.logout()
            return matches

        matches = await loop.run_in_executor(None, run_imap)
        
        for ref_id_clean in matches:
            if ref_id_clean in app_map:
                matched_app = app_map[ref_id_clean]
                app_id = matched_app["_id"]
                company_name = matched_app.get("company_name", "Unknown")
                print(f"IMAP Monitor: Detected reply for application at {company_name}! Transitioning status.")
                
                # Update status to replied and record history
                await db.applications.update_one(
                    {"_id": app_id},
                    {
                        "$set": {"status": "replied", "last_updated": datetime.utcnow()},
                        "$push": {
                            "status_history": {
                                "status": "replied",
                                "timestamp": datetime.utcnow(),
                                "source": "auto_imap"
                            }
                        }
                    }
                )
                
        print("IMAP Monitor: Scan completed successfully.")
        
    except Exception as e:
        print(f"IMAP Monitor Error: {e}")
