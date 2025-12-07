# backend/services/mongo_client.py
import os
from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio

# accept multiple env var names so accidental mismatch doesn't break things
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("MONGO_DB") or os.getenv("DB_NAME") or "nirogya_db"

_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = _client[DB_NAME]

# existing collections
symptom_col = db["symptoms_reports"]  # Updated to match database collection name
water_col = db["water_reports"]
prediction_col = db["prediction_reports"]
raw_col = db["raw_reports"]

# users collection (for auth)
users_col = db["users"]

# OTP and Alert collections
otp_col = db["email_otps"]
alerts_col = db["water_alerts"]

# ASHA workers collection
asha_workers_col = db["asha_workers"]

# Audit logs collection (for user management actions)
audit_logs_col = db["audit_logs"]


def get_db():
    return db


async def create_or_update_asha_on_register(user_doc: dict):
    """
    Create or update an ASHA worker profile document when a user with role=asha_worker is created.
    """
    from datetime import datetime
    
    user_id = str(user_doc.get("_id"))
    email = user_doc.get("email")
    
    existing = await asha_workers_col.find_one({"user_id": user_id})
    
    asha_doc = {
        "user_id": user_id,
        "name": user_doc.get("full_name"),
        "email": email,
        "phone": user_doc.get("phone"),
        "location": user_doc.get("location"),
        "organization": user_doc.get("organization"),
        "status": "active",
        "updated_at": datetime.utcnow(),
    }
    
    if existing:
        await asha_workers_col.update_one(
            {"user_id": user_id},
            {"$set": asha_doc}
        )
    else:
        asha_doc["created_at"] = datetime.utcnow()
        await asha_workers_col.insert_one(asha_doc)
