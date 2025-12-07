# backend/routes/user_management.py
"""
User Management Routes for Government Officials
Handles viewing, editing, deactivating, deleting, and resetting passwords for users
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime
from typing import Any, Dict, List, Optional
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field

from backend.auth.deps import get_current_user
from backend.services.mongo_client import users_col, audit_logs_col
from backend.auth.utils import hash_password, generate_temp_password as gen_temp_pwd
import secrets
import string

router = APIRouter(prefix="/api/users", tags=["user_management"])

# ---------------------------
# Pydantic Models
# ---------------------------
class UserManagementResponse(BaseModel):
    id: str
    full_name: str
    email: str
    role: str
    organization: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    status: str = "active"  # active/inactive
    created_at: Optional[str] = None
    last_login: Optional[str] = None
    district: Optional[str] = None


class UpdateUserRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None  # active/inactive
    district: Optional[str] = None


class ResetPasswordResponse(BaseModel):
    temp_password: str
    expires_in_hours: int = 24


class PasswordChangeRequest(BaseModel):
    old_password: Optional[str] = None
    new_password: str
    confirm_password: str


# ---------------------------
# Helper Functions
# ---------------------------
def user_helper(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Convert MongoDB doc to response format"""
    return {
        "id": str(doc["_id"]),
        "full_name": doc.get("full_name"),
        "email": doc.get("email"),
        "role": doc.get("role"),
        "organization": doc.get("organization"),
        "location": doc.get("location"),
        "phone": doc.get("phone"),
        "status": doc.get("status", "active"),
        "created_at": doc.get("created_at").isoformat() if doc.get("created_at") else None,
        "last_login": doc.get("last_login").isoformat() if doc.get("last_login") else None,
        "district": doc.get("district"),
    }


async def ensure_government_official(current_user: dict):
    """Verify user is government official"""
    if current_user.get("role") != "government_body":
        raise HTTPException(
            status_code=403,
            detail="Only Government Officials can access user management"
        )


async def log_audit(action: str, user_id: str, target_user_id: str, 
                   changes: Dict[str, Any] = None, status_code: int = 200):
    """Log all user management actions"""
    audit_entry = {
        "action": action,
        "performed_by": user_id,
        "target_user_id": target_user_id,
        "changes": changes or {},
        "timestamp": datetime.utcnow(),
        "status": "success" if status_code == 200 else "failed",
        "status_code": status_code,
    }
    await audit_logs_col.insert_one(audit_entry)


# ---------------------------
# GET ENDPOINTS
# ---------------------------

@router.get("/list", response_model=List[UserManagementResponse])
async def get_all_users(
    current_user: dict = Depends(get_current_user),
    role: Optional[str] = Query(None, description="Filter by role"),
    status_filter: Optional[str] = Query(None, description="Filter by status (active/inactive)"),
    district: Optional[str] = Query(None, description="Filter by district"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: int = Query(-1, description="Sort order (1=asc, -1=desc)"),
):
    """
    Get all users with filtering and pagination.
    Only accessible to Government Officials.
    """
    await ensure_government_official(current_user)
    
    # Build filter query
    filter_query = {}
    
    if role:
        filter_query["role"] = role
    
    if status_filter:
        filter_query["status"] = status_filter
    
    if district:
        filter_query["district"] = district
    
    if search:
        filter_query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    
    print(f"DEBUG: filter_query={filter_query}, skip={skip}, limit={limit}, sort={sort_by}:{sort_order}")

    # Execute query with sorting, skip, and limit
    cursor = users_col.find(filter_query).sort(sort_by, sort_order).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    print(f"DEBUG: Found {len(users)} users")

    return [user_helper(user) for user in users]


@router.get("/count", response_model=dict)
async def get_users_count(
    current_user: dict = Depends(get_current_user),
    role: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
):
    """Get total count of users (for pagination)"""
    await ensure_government_official(current_user)
    
    filter_query = {}
    if role:
        filter_query["role"] = role
    if status_filter:
        filter_query["status"] = status_filter
    
    count = await users_col.count_documents(filter_query)
    
    return {
        "total_count": count,
        "admin_count": await users_col.count_documents({"role": "admin"}),
        "government_count": await users_col.count_documents({"role": "government_body"}),
        "asha_count": await users_col.count_documents({"role": "asha_worker"}),
        "community_count": await users_col.count_documents({"role": "community_user"}),
    }


@router.get("/{user_id}", response_model=UserManagementResponse)
async def get_user_detail(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Get detailed user information including activity logs"""
    await ensure_government_official(current_user)
    
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user = await users_col.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_helper(user)


@router.get("/{user_id}/activity-logs", response_model=List[dict])
async def get_user_activity_logs(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """Get activity logs for a specific user"""
    await ensure_government_official(current_user)
    
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Get logs where target_user_id matches
    logs_cursor = audit_logs_col.find(
        {"target_user_id": user_id}
    ).sort("timestamp", -1).skip(skip).limit(limit)
    
    logs = await logs_cursor.to_list(length=limit)
    
    return [
        {
            "action": log.get("action"),
            "performed_by": log.get("performed_by"),
            "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else None,
            "changes": log.get("changes"),
        }
        for log in logs
    ]


# ---------------------------
# UPDATE ENDPOINTS
# ---------------------------

@router.put("/{user_id}", response_model=UserManagementResponse)
async def update_user(
    user_id: str,
    update_data: UpdateUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update user information.
    Only Government Officials can perform this action.
    """
    await ensure_government_official(current_user)
    
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    # Prevent self-modification of role
    update_dict = update_data.dict(exclude_unset=True)
    
    if "role" in update_dict:
        raise HTTPException(status_code=400, detail="Cannot modify user role")
    
    # Check for email uniqueness if email is being updated
    if "email" in update_dict:
        existing = await users_col.find_one({
            "email": update_dict["email"].lower(),
            "_id": {"$ne": obj_id}
        })
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_dict["email"] = update_dict["email"].lower()
    
    result = await users_col.find_one_and_update(
        {"_id": obj_id},
        {"$set": update_dict},
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log the action
    await log_audit(
        action="UPDATE_USER",
        user_id=current_user.get("id"),
        target_user_id=user_id,
        changes=update_dict
    )
    
    return user_helper(result)


@router.patch("/{user_id}/status", response_model=dict)
async def toggle_user_status(
    user_id: str,
    status_data: dict,
    current_user: dict = Depends(get_current_user),
):
    """
    Activate or deactivate a user account.
    """
    await ensure_government_official(current_user)
    
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    new_status = status_data.get("status")
    if new_status not in ["active", "inactive"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'inactive'")
    
    result = await users_col.find_one_and_update(
        {"_id": obj_id},
        {
            "$set": {
                "status": new_status,
                "status_changed_at": datetime.utcnow(),
            }
        },
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log the action
    await log_audit(
        action="TOGGLE_STATUS",
        user_id=current_user.get("id"),
        target_user_id=user_id,
        changes={"status": new_status}
    )
    
    return {
        "user_id": user_id,
        "new_status": new_status,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.post("/{user_id}/reset-password", response_model=ResetPasswordResponse)
async def reset_user_password(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Reset user password and return temporary password.
    Government Official only.
    """
    await ensure_government_official(current_user)
    
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    temp_password = gen_temp_pwd(10)
    hashed = hash_password(temp_password)
    
    result = await users_col.find_one_and_update(
        {"_id": obj_id},
        {
            "$set": {
                "password": hashed,
                "password_reset_by": current_user.get("id"),
                "password_reset_at": datetime.utcnow(),
                "force_password_change": True,
            }
        },
        return_document=True
    )
    
    if not result:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Log the action
    await log_audit(
        action="RESET_PASSWORD",
        user_id=current_user.get("id"),
        target_user_id=user_id,
        changes={"password": "RESET"}
    )
    
    return {
        "temp_password": temp_password,
        "expires_in_hours": 24
    }


# ---------------------------
# DELETE ENDPOINT
# ---------------------------

@router.delete("/{user_id}", response_model=dict)
async def delete_user(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a user account.
    Only Government Officials can perform this action.
    Prevents deletion of admin accounts.
    """
    await ensure_government_official(current_user)
    
    if user_id == current_user.get("id"):
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    try:
        obj_id = ObjectId(user_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid user ID")
    
    user = await users_col.find_one({"_id": obj_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deletion of admin accounts
    if user.get("role") == "admin":
        raise HTTPException(status_code=403, detail="Cannot delete admin accounts")
    
    # Soft delete by marking as inactive instead of hard delete
    result = await users_col.find_one_and_update(
        {"_id": obj_id},
        {
            "$set": {
                "status": "deleted",
                "deleted_by": current_user.get("id"),
                "deleted_at": datetime.utcnow(),
            }
        },
        return_document=True
    )
    
    # Log the action
    await log_audit(
        action="DELETE_USER",
        user_id=current_user.get("id"),
        target_user_id=user_id,
        changes={"status": "deleted"}
    )
    
    return {
        "user_id": user_id,
        "message": "User account deleted successfully",
        "timestamp": datetime.utcnow().isoformat()
    }


# ---------------------------
# AUDIT LOG ENDPOINTS
# ---------------------------

@router.get("/admin/audit-logs", response_model=List[dict])
async def get_audit_logs(
    current_user: dict = Depends(get_current_user),
    action: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    Get all audit logs.
    Only Government Officials can view this.
    """
    await ensure_government_official(current_user)
    
    filter_query = {}
    if action:
        filter_query["action"] = action
    
    logs_cursor = audit_logs_col.find(filter_query).sort("timestamp", -1).skip(skip).limit(limit)
    logs = await logs_cursor.to_list(length=limit)
    
    return [
        {
            "id": str(log.get("_id")),
            "action": log.get("action"),
            "performed_by": log.get("performed_by"),
            "target_user_id": log.get("target_user_id"),
            "timestamp": log.get("timestamp").isoformat() if log.get("timestamp") else None,
            "changes": log.get("changes"),
            "status": log.get("status"),
        }
        for log in logs
    ]
