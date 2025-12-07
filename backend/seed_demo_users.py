"""
Seed demo users for testing the application.
Run this script to create demo accounts in the database.
"""
import asyncio
from datetime import datetime
from backend.services.mongo_client import users_col
from backend.auth.utils import hash_password


DEMO_USERS = [
    {
        "full_name": "System Administrator",
        "email": "admin@paanicare.com",
        "password": "admin123",
        "role": "admin",
        "organization": "PaaniCare",
        "location": "Central Office",
        "phone": "+91-9999999999"
    },
    {
        "full_name": "ASHA Worker",
        "email": "asha@paanicare.com",
        "password": "asha123",
        "role": "asha_worker",
        "organization": "Community Health Center",
        "location": "Village Health Post",
        "phone": "+91-9999999998"
    },
    {
        "full_name": "Government Official",
        "email": "government@paanicare.com",
        "password": "government123",
        "role": "government_body",
        "organization": "State Health Department",
        "location": "State Capital",
        "phone": "+91-9999999994"
    },
    {
        "full_name": "Community User",
        "email": "user@paanicare.com",
        "password": "user123",
        "role": "community_user",
        "organization": None,
        "location": "Local Village",
        "phone": "+91-9999999993"
    },
    # Add your test user here
    {
        "full_name": "Vinit Girdhar",
        "email": "girdharvinit786@gmail.com",
        "password": "test123",
        "role": "asha_worker",  # ASHA worker role so you can test alerts
        "organization": "Community Health Center",
        "location": "Kamrup Metro",  # Same region for alert testing
        "phone": "+91-7840926064"
    },
    # ============================================
    # SFIT TEAM TEST USERS - For Alert Testing
    # ============================================
    {
        "full_name": "Shini Edabre",
        "email": "shiniedabre03@student.sfit.ac.in",
        "password": "test123",
        "role": "community_user",
        "organization": "SFIT",
        "location": "Kamrup Metro",
        "phone": "+91-9699852663"
    },
    {
        "full_name": "Lizer Viji",
        "email": "lizerviji80@student.sfit.ac.in",
        "password": "test123",
        "role": "community_user",
        "organization": "SFIT",
        "location": "Kamrup Metro",
        "phone": "+91-8329789841"
    },
    {
        "full_name": "Vinit Girdhar (SFIT)",
        "email": "girdharvinit786@student.sfit.ac.in",
        "password": "test123",
        "role": "community_user",
        "organization": "SFIT",
        "location": "Kamrup Metro",
        "phone": "+91-7840926064"
    },
    {
        "full_name": "Dalmet Isona",
        "email": "dalmetisona23@student.sfit.ac.in",
        "password": "test123",
        "role": "community_user",
        "organization": "SFIT",
        "location": "Kamrup Metro",
        "phone": "+91-8855880379"
    },
    {
        "full_name": "Maxwell Mathew",
        "email": "mathew.maxwell5035@student.sfit.ac.in",
        "password": "test123",
        "role": "community_user",
        "organization": "SFIT",
        "location": "Kamrup Metro",
        "phone": "+91-9834101480"
    },
    {
        "full_name": "Aaditya Parab",
        "email": "parabaaditya785@student.sfit.ac.in",
        "password": "test123",
        "role": "community_user",
        "organization": "SFIT",
        "location": "Kamrup Metro",
        "phone": "+91-7843046341"
    }
]


async def seed_demo_users():
    """Create demo users in the database."""
    print("🌱 Seeding demo users...")
    
    # Ensure unique index on email
    try:
        await users_col.create_index("email", unique=True)
        print("✓ Email index created/verified")
    except Exception as e:
        print(f"⚠ Index creation warning: {e}")
    
    created_count = 0
    updated_count = 0
    
    for demo_user in DEMO_USERS:
        email = demo_user["email"].lower().strip()
        
        # Check if user already exists
        existing = await users_col.find_one({"email": email})
        
        if existing:
            # Update existing user's password
            hashed = hash_password(demo_user["password"])
            await users_col.update_one(
                {"email": email},
                {
                    "$set": {
                        "password": hashed,
                        "full_name": demo_user["full_name"],
                        "role": demo_user["role"],
                        "organization": demo_user["organization"],
                        "location": demo_user["location"],
                        "phone": demo_user["phone"]
                    }
                }
            )
            print(f"✓ Updated: {email} ({demo_user['role']})")
            updated_count += 1
        else:
            # Create new user
            hashed = hash_password(demo_user["password"])
            doc = {
                "full_name": demo_user["full_name"],
                "email": email,
                "role": demo_user["role"],
                "password": hashed,
                "organization": demo_user["organization"],
                "location": demo_user["location"],
                "phone": demo_user["phone"],
                "created_at": datetime.utcnow()
            }
            await users_col.insert_one(doc)
            print(f"✓ Created: {email} ({demo_user['role']})")
            created_count += 1
    
    print(f"\n✅ Seeding complete!")
    print(f"   Created: {created_count} users")
    print(f"   Updated: {updated_count} users")
    print(f"\n📝 Demo credentials:")
    for user in DEMO_USERS:
        print(f"   {user['email']} / {user['password']} ({user['role']})")


if __name__ == "__main__":
    asyncio.run(seed_demo_users())
