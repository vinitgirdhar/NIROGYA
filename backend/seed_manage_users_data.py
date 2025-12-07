#!/usr/bin/env python3
"""
Test Data Generator for Manage Users Feature
Run this script to populate MongoDB with test users and audit logs
"""

import asyncio
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

import motor.motor_asyncio
from bcrypt import hashpw, gensalt

MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI") or "mongodb://localhost:27017"
DB_NAME = os.getenv("MONGO_DB") or os.getenv("DB_NAME") or "nirogya_db"

# Test data
TEST_USERS = [
    {
        "full_name": "John Admin",
        "email": "admin@nirogya.gov.in",
        "role": "admin",
        "password": "admin123",
        "organization": "Nirogya HQ",
        "location": "Guwahati",
        "phone": "+91-9876543210",
        "status": "active",
    },
    {
        "full_name": "Priya Government Officer",
        "email": "priya.official@assam.gov.in",
        "role": "government_body",
        "password": "gov123456",
        "organization": "Assam Health Department",
        "location": "Dispur",
        "phone": "+91-9123456789",
        "district": "Kamrup",
        "status": "active",
    },
    {
        "full_name": "Rajesh Kumar",
        "email": "rajesh.asha@nirogya.gov.in",
        "role": "asha_worker",
        "password": "asha123456",
        "organization": "Nirogya Field ASHA",
        "location": "Nashik, Nashik",
        "phone": "+91-8765432109",
        "district": "Nashik",
        "status": "active",
    },
    {
        "full_name": "Meera Sharma",
        "email": "meera.asha@nirogya.gov.in",
        "role": "asha_worker",
        "password": "asha123456",
        "organization": "Nirogya Field ASHA",
        "location": "Pune, Pune",
        "phone": "+91-8765432108",
        "district": "Pune",
        "status": "active",
    },
    {
        "full_name": "Amit Community User",
        "email": "amit.community@gmail.com",
        "role": "community_user",
        "password": "community123",
        "organization": "Community Health Initiative",
        "location": "Mumbai",
        "phone": "+91-7654321098",
        "district": "Mumbai",
        "status": "active",
    },
    {
        "full_name": "Sunita Community User",
        "email": "sunita.community@gmail.com",
        "role": "community_user",
        "password": "community123",
        "organization": "Local Health Group",
        "location": "Bangalore",
        "phone": "+91-7654321097",
        "district": "Bangalore",
        "status": "active",
    },
    {
        "full_name": "Inactive User",
        "email": "inactive@test.gov.in",
        "role": "community_user",
        "password": "inactive123",
        "organization": "Test Organization",
        "location": "Chennai",
        "phone": "+91-7654321096",
        "district": "Chennai",
        "status": "inactive",
    },
]

TEST_AUDIT_LOGS = [
    {
        "action": "UPDATE_USER",
        "performed_by": "admin_id_1",
        "target_user_id": "user_id_5",
        "changes": {"full_name": "Amit Kumar", "phone": "+91-7654321098"},
        "status": "success",
        "status_code": 200,
    },
    {
        "action": "TOGGLE_STATUS",
        "performed_by": "admin_id_1",
        "target_user_id": "user_id_7",
        "changes": {"status": "inactive"},
        "status": "success",
        "status_code": 200,
    },
    {
        "action": "RESET_PASSWORD",
        "performed_by": "admin_id_1",
        "target_user_id": "user_id_3",
        "changes": {"password": "RESET"},
        "status": "success",
        "status_code": 200,
    },
]


async def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return hashpw(password.encode(), gensalt()).decode()


async def create_test_data():
    """Create test data in MongoDB"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    users_col = db["users"]
    audit_logs_col = db["audit_logs"]

    print("🔄 Creating test users...")

    # Hash passwords and prepare users
    hashed_users = []
    for user in TEST_USERS:
        user_copy = user.copy()
        user_copy["password"] = await hash_password(user["password"])
        user_copy["created_at"] = datetime.utcnow()
        user_copy["last_login"] = datetime.utcnow() - timedelta(days=1)
        hashed_users.append(user_copy)

    # Insert users
    try:
        result = await users_col.insert_many(hashed_users)
        print(f"✅ Created {len(result.inserted_ids)} test users")

        # Get the actual user IDs for audit logs
        users = await users_col.find().to_list(length=100)
        user_ids = {user["email"]: str(user["_id"]) for user in users}

        # Update audit logs with real user IDs
        audit_logs_to_insert = []
        admin_id = user_ids.get("admin@nirogya.gov.in", "admin_id_1")
        user_ids_list = list(user_ids.values())

        for i, log in enumerate(TEST_AUDIT_LOGS):
            log_copy = log.copy()
            log_copy["performed_by"] = admin_id
            log_copy["target_user_id"] = user_ids_list[i % len(user_ids_list)]
            log_copy["timestamp"] = datetime.utcnow() - timedelta(hours=i)
            audit_logs_to_insert.append(log_copy)

        # Insert audit logs
        audit_result = await audit_logs_col.insert_many(audit_logs_to_insert)
        print(f"✅ Created {len(audit_result.inserted_ids)} test audit logs")

        print("\n📊 Test User Credentials:")
        print("=" * 60)
        for user in hashed_users:
            original_user = next((u for u in TEST_USERS if u["email"] == user["email"]), None)
            print(f"\n👤 {user['full_name']}")
            print(f"   Role: {user['role']}")
            print(f"   Email: {user['email']}")
            print(f"   Password: {original_user['password'] if original_user else 'N/A'}")
            print(f"   Status: {user['status']}")

        print("\n✅ Test data created successfully!")
        print("\n🚀 You can now log in with any of the credentials above")
        print("   For managing users, use the Government Official account:")
        print("   Email: priya.official@assam.gov.in")
        print("   Password: gov123456")

    except Exception as e:
        if "duplicate key error" in str(e).lower():
            print(
                "⚠️  Some users already exist. Run clear_test_data() first if you want to reset."
            )
        else:
            print(f"❌ Error creating test data: {e}")
        raise


async def clear_test_data():
    """Clear test data from MongoDB"""
    client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    users_col = db["users"]
    audit_logs_col = db["audit_logs"]

    print("🔄 Clearing test data...")

    # Delete test users
    test_emails = [user["email"] for user in TEST_USERS]
    users_result = await users_col.delete_many({"email": {"$in": test_emails}})
    print(f"✅ Deleted {users_result.deleted_count} test users")

    # Clear all audit logs (or be more selective)
    audit_result = await audit_logs_col.delete_many({})
    print(f"✅ Deleted {audit_result.deleted_count} audit logs")

    print("✅ Test data cleared successfully!")


async def main():
    """Main function"""
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "clear":
        await clear_test_data()
    else:
        await create_test_data()


if __name__ == "__main__":
    asyncio.run(main())
