# backend/auth/routes.py
from fastapi import APIRouter, HTTPException, status, Depends
from datetime import datetime
from typing import Any, Dict

import re
import secrets
import string

from backend.auth.models import (
    RegisterRequest,
    UserOut,
    UserLogin,
    TokenResponse,
    AdminCreateAshaRequest,
    AdminCreateGovernmentUserRequest,
    AdminCreatedUserResponse,
)
from backend.auth.utils import hash_password, verify_password, create_access_token
from backend.auth.deps import get_current_user
from backend.services.mongo_client import users_col, create_or_update_asha_on_register, create_or_update_admin_on_register

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ---------------------------
# Helper to format user object
# ---------------------------
def user_helper(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "full_name": doc.get("full_name"),
        "email": doc.get("email"),
        "role": doc.get("role"),
        "organization": doc.get("organization"),
        "location": doc.get("location"),
        "phone": doc.get("phone"),
        "created_at": doc.get("created_at"),
    }


# ---------------------------
# Helper: name → local-part slug
# ---------------------------
def slug_from_name(name: str) -> str:
    base = re.sub(r"[^a-z0-9]+", "", name.lower())
    return base or "asha"


async def generate_unique_email(local_part: str, domain: str = "nirogya.gov.in") -> str:
    """
    Make sure we don't clash if same ASHA name used twice.
    Returns something like: maxasha@nirogya.gov.in, maxasha2@..., etc.
    """
    candidate = f"{local_part}@{domain}"
    n = 2
    while await users_col.find_one({"email": candidate}):
        candidate = f"{local_part}{n}@{domain}"
        n += 1
    return candidate


def generate_temp_password(length: int = 10) -> str:
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        pwd = "".join(secrets.choice(chars) for _ in range(length))
        if (
            any(c.islower() for c in pwd)
            and any(c.isupper() for c in pwd)
            and any(c.isdigit() for c in pwd)
        ):
            return pwd


# ---------------------------
# REGISTER (public)
# ---------------------------
@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest):
    import logging
    logging.info(f"Register attempt - email: {payload.email}, name: {payload.full_name}, role: {payload.role}")
    logging.info(f"Payload data: full_name={payload.full_name}, email={payload.email}, role={payload.role}, org={payload.organization}, loc={payload.location}, phone={payload.phone}")

    # Validate password match
    if payload.password != payload.confirm_password:
        logging.error("Password mismatch")
        raise HTTPException(status_code=400, detail="Passwords do not match")
    
    # Validate password length
    if len(payload.password) < 6:
        logging.error("Password too short")
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    email = payload.email.lower().strip()

    # ensure email index exists
    try:
        await users_col.create_index("email", unique=True)
    except Exception:
        pass

    existing = await users_col.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(payload.password)

    # Force public signup role to community user for safety
    role = "community_user"

    doc = {
        "full_name": payload.full_name.strip(),
        "email": email,
        "role": role,
        "password": hashed,
        "organization": payload.organization,
        "location": payload.location,
        "phone": payload.phone,
        "created_at": datetime.utcnow(),
    }

    result = await users_col.insert_one(doc)
    created = await users_col.find_one({"_id": result.inserted_id})

    if not created:
        raise HTTPException(status_code=500, detail="Failed to create user")

    return user_helper(created)


# ---------------------------
# LOGIN
# ---------------------------
@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):

    email = payload.email.lower().strip()
    user = await users_col.find_one({"email": email})

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    stored_hash = user.get("password", "")

    ok = verify_password(payload.password, stored_hash)
    if not ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token, exp = create_access_token(
        str(user["_id"]), extra={"email": user["email"], "role": user.get("role")}
    )
    expires_in = int((exp - datetime.utcnow()).total_seconds())

    user_out = {
        "id": str(user.get("_id")),
        "email": user.get("email"),
        "role": user.get("role"),
        "full_name": user.get("full_name"),
        "organization": user.get("organization"),
        "location": user.get("location"),
        "phone": user.get("phone"),
    }

    # NOTE: TokenResponse only defines token fields.
    # We send user info in a separate field; your frontend already expects this.
    return {
        "access_token": token,
        "expires_in": expires_in,
        "token_type": "bearer",
        "user": user_out,
    }


# ---------------------------
# CURRENT USER /me
# ---------------------------
@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user.get("id"),
        "full_name": current_user.get("full_name"),
        "email": current_user.get("email"),
        "role": current_user.get("role"),
        "organization": current_user.get("organization"),
        "location": current_user.get("location"),
        "phone": current_user.get("phone"),
        "created_at": current_user.get("created_at"),
    }


@router.get("/users/me")
async def users_me(current_user: dict = Depends(get_current_user)):
    return await me(current_user)


# ===========================================================
#                ADMIN / GOVERNMENT ENDPOINTS
# ===========================================================

def ensure_is_admin_or_gov(current_user: dict):
    if current_user.get("role") not in ("admin", "government_body"):
        raise HTTPException(status_code=403, detail="Not allowed")


@router.post(
    "/admin/create-asha-worker",
    response_model=AdminCreatedUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_asha_worker(
    payload: AdminCreateAshaRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Government / Admin creates an ASHA worker.

    - Auto-generates email as: ashaname@nirogya.gov.in
      (or ashaname2@... if taken)
    - Auto-generates strong temp password
    - Creates user in users collection with role=asha_worker
    - Also creates/updates entry in asha_workers collection via helper
    - Returns user + temp_password (shown once in UI)
    """
    ensure_is_admin_or_gov(current_user)

    # email: use provided one OR auto-generate
    if payload.email:
        email = payload.email.lower().strip()
        # prevent clash
        if await users_col.find_one({"email": email}):
            raise HTTPException(status_code=400, detail="Email already registered")
    else:
        local_part = slug_from_name(payload.full_name)
        email = await generate_unique_email(local_part)

    temp_password = generate_temp_password()
    hashed = hash_password(temp_password)

    doc = {
        "full_name": payload.full_name.strip(),
        "email": email,
        "role": "asha_worker",
        "password": hashed,
        "organization": "Nirogya Field ASHA",
        "location": f"{payload.location}, {payload.district}",
        "phone": payload.phone,
        "created_at": datetime.utcnow(),
    }

    result = await users_col.insert_one(doc)
    created = await users_col.find_one({"_id": result.inserted_id})

    if not created:
        raise HTTPException(status_code=500, detail="Failed to create ASHA worker")

    # create ASHA worker profile document
    await create_or_update_asha_on_register(created)

    base_user = user_helper(created)
    return {**base_user, "temp_password": temp_password}


@router.post(
    "/admin/create-government-user",
    response_model=AdminCreatedUserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def admin_create_government_user(
    payload: AdminCreateGovernmentUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Admin-only: create another government_body user with auto temp password.
    """
    # for safety: only admin can create other government accounts
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create government users")

    email = payload.email.lower().strip()

    if await users_col.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    temp_password = generate_temp_password()
    hashed = hash_password(temp_password)

    doc = {
        "full_name": payload.full_name.strip(),
        "email": email,
        "role": "government_body",
        "password": hashed,
        "organization": payload.department or "Government Health Dept",
        "location": "Assam",
        "phone": payload.phone,
        "created_at": datetime.utcnow(),
    }

    result = await users_col.insert_one(doc)
    created = await users_col.find_one({"_id": result.inserted_id})

    if not created:
        raise HTTPException(status_code=500, detail="Failed to create government user")

    # Create admin worker profile document
    await create_or_update_admin_on_register(created)

    base_user = user_helper(created)
    return {**base_user, "temp_password": temp_password}
