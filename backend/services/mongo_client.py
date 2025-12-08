# backend/services/mongo_client.py
import os
from dotenv import load_dotenv
load_dotenv()

import motor.motor_asyncio
from datetime import datetime
from bson import ObjectId

# accept multiple env var names so accidental mismatch doesn't break things
MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("MONGO_DB") or os.getenv("DB_NAME") or "nirogya_db"

_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = _client[DB_NAME]

# existing collections
symptom_col = db["symptoms_reports"]
water_col = db["water_reports"]
prediction_col = db["prediction_reports"]
raw_col = db["raw_reports"]

# users collection (for auth)
users_col = db["users"]

# OTP and Alert collections
otp_col = db["email_otps"]
alerts_col = db["water_alerts"]

# ASHA workers collection with reporting stats
asha_workers_col = db["asha_workers"]
asha_col = asha_workers_col  # Alias for compatibility

# Audit logs collection (for user management actions)
audit_logs_col = db["audit_logs"]


def get_db():
    return db


# ============================================================
# ASHA WORKER SUPPORT FUNCTIONS
# ============================================================

async def create_or_update_asha_on_register(user_doc: dict):
    """
    Called when a user registers with role ASHA.
    Creates an ASHA worker record with reporting stats if not already present.
    """

    user_id = user_doc["_id"]

    doc = {
        "user_id": user_id,
        "full_name": user_doc.get("full_name") or user_doc.get("name"),
        "email": user_doc.get("email"),
        "location": user_doc.get("location"),
        "phone": user_doc.get("phone"),
        "organization": user_doc.get("organization"),
        "status": "active",

        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "last_submission_at": None,

        # reporting counters
        "symptom_report_count": 0,
        "water_report_count": 0,

        # report lists
        "symptom_report_ids": [],
        "water_report_ids": [],
    }

    # Ensure unique index on user_id
    await asha_workers_col.create_index("user_id", unique=True)

    # Upsert: create if not exist, otherwise update basic fields
    await asha_workers_col.update_one(
        {"user_id": user_id},
        {
            "$setOnInsert": doc,
            "$set": {
                "full_name": doc["full_name"],
                "email": doc["email"],
                "location": doc["location"],
                "phone": doc["phone"],
                "organization": doc.get("organization"),
                "updated_at": datetime.utcnow(),
            }
        },
        upsert=True
    )


async def record_asha_submission(user_id: ObjectId, report_type: str, report_id: ObjectId):
    """
    Called whenever an ASHA worker submits any report.
    Updates submission counters and tracking lists.
    
    Args:
        user_id: The ObjectId of the ASHA user
        report_type: Either "symptom" or "water"
        report_id: The ObjectId of the submitted report
    """

    field_count = "symptom_report_count" if report_type == "symptom" else "water_report_count"
    field_ids = "symptom_report_ids" if report_type == "symptom" else "water_report_ids"

    await asha_workers_col.update_one(
        {"user_id": user_id},
        {
            "$inc": {field_count: 1},
            "$push": {field_ids: str(report_id)},
            "$set": {
                "last_submission_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
            },
        },
        upsert=True
    )
