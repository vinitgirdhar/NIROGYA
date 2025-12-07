
import asyncio
import os
from dotenv import load_dotenv
import motor.motor_asyncio

load_dotenv()

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("MONGO_DB") or os.getenv("DB_NAME") or "nirogya_db"

async def check_users():
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    users_col = db["users"]
    
    cursor = users_col.find({})
    users = await cursor.to_list(length=100)
    for user in users:
        created_at = user.get('created_at')
        print(f"User: {user.get('email')} | Created At: {created_at} ({type(created_at)})")

if __name__ == "__main__":
    asyncio.run(check_users())
