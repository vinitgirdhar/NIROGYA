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

def get_db():
    return db
