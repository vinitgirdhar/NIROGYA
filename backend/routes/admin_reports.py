# backend/routes/admin_reports.py
"""
Admin Reports Routes
Provides comprehensive analytics, system health, audit logs, and data reports
Only accessible to admin users
"""

from fastapi import APIRouter, HTTPException, status, Depends, Query
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from bson import ObjectId
from pydantic import BaseModel

from backend.auth.deps import get_current_user
from backend.services.mongo_client import users_col, audit_logs_col, symptom_col, water_col, prediction_col

router = APIRouter(prefix="/api/admin/reports", tags=["admin_reports"])

# ---------------------------
# Pydantic Models
# ---------------------------
class SystemHealthReport(BaseModel):
    metric: str
    value: float
    status: str  # healthy, warning, critical
    percentage: Optional[float] = None
    timestamp: str


class UserReport(BaseModel):
    id: str
    user_name: str
    email: str
    role: str
    total_logins: int
    last_login: Optional[str] = None
    actions_count: int
    status: str
    created_at: Optional[str] = None


class AuditLog(BaseModel):
    id: str
    user_id: str
    user_name: str
    action: str
    resource: str
    details: str
    timestamp: str
    status: str  # success, failed


class DataReport(BaseModel):
    date: str
    users_created: int
    reports_generated: int
    api_calls: int
    data_points: int


class SummaryStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    total_actions: int
    total_reports: int
    api_health: float
    database_health: float
    system_uptime: float


# ---------------------------
# Helper Functions
# ---------------------------
async def ensure_admin(current_user: dict):
    """Verify user is admin"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only Admins can access admin reports"
        )


def calculate_health_status(percentage: float) -> str:
    """Determine health status based on percentage"""
    if percentage >= 98:
        return "healthy"
    elif percentage >= 90:
        return "warning"
    else:
        return "critical"


# ---------------------------
# SUMMARY STATISTICS
# ---------------------------
@router.get("/summary", response_model=SummaryStats)
async def get_summary_statistics(
    current_user: dict = Depends(get_current_user),
):
    """
    Get overall system summary statistics
    Only accessible to Admin users
    """
    await ensure_admin(current_user)
    
    # User counts
    total_users = await users_col.count_documents({})
    active_users = await users_col.count_documents({"status": "active"})
    inactive_users = await users_col.count_documents({"status": "inactive"})
    
    # Audit logs count (as proxy for total actions)
    total_actions = await audit_logs_col.count_documents({})
    
    # Reports count (symptoms + water quality + predictions)
    symptom_reports = await symptom_col.count_documents({})
    water_reports = await water_col.count_documents({})
    prediction_reports = await prediction_col.count_documents({})
    total_reports = symptom_reports + water_reports + prediction_reports
    
    # System health metrics (simplified - in production would check actual services)
    api_health = 99.8
    database_health = 98.5
    system_uptime = 99.95
    
    return SummaryStats(
        total_users=total_users,
        active_users=active_users,
        inactive_users=inactive_users,
        total_actions=total_actions,
        total_reports=total_reports,
        api_health=api_health,
        database_health=database_health,
        system_uptime=system_uptime,
    )


# ---------------------------
# SYSTEM HEALTH
# ---------------------------
@router.get("/system-health", response_model=List[SystemHealthReport])
async def get_system_health(
    current_user: dict = Depends(get_current_user),
):
    """
    Get system health metrics
    Only accessible to Admin users
    """
    await ensure_admin(current_user)
    
    # In production, these would be real metrics from monitoring systems
    # For now, we'll calculate based on database connectivity and response times
    
    timestamp = datetime.utcnow().isoformat()
    
    # API Server health
    api_percentage = 99.8
    
    # Database health (check if we can query)
    try:
        await users_col.count_documents({})
        db_percentage = 98.5
    except:
        db_percentage = 0.0
    
    # Cache health (simulated)
    cache_percentage = 95.2
    
    # Disk space (simulated - would use psutil in production)
    disk_percentage = 72.0
    
    health_reports = [
        SystemHealthReport(
            metric="API Server",
            value=api_percentage,
            status=calculate_health_status(api_percentage),
            percentage=api_percentage,
            timestamp=timestamp,
        ),
        SystemHealthReport(
            metric="Database",
            value=db_percentage,
            status=calculate_health_status(db_percentage),
            percentage=db_percentage,
            timestamp=timestamp,
        ),
        SystemHealthReport(
            metric="Cache",
            value=cache_percentage,
            status=calculate_health_status(cache_percentage),
            percentage=cache_percentage,
            timestamp=timestamp,
        ),
        SystemHealthReport(
            metric="Disk Space",
            value=disk_percentage,
            status=calculate_health_status(disk_percentage),
            percentage=disk_percentage,
            timestamp=timestamp,
        ),
    ]
    
    return health_reports


# ---------------------------
# USER REPORTS
# ---------------------------
@router.get("/users", response_model=List[UserReport])
async def get_user_reports(
    current_user: dict = Depends(get_current_user),
    role: Optional[str] = Query(None, description="Filter by role"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=500),
):
    """
    Get user activity reports with analytics
    Only accessible to Admin users
    """
    await ensure_admin(current_user)
    
    # Build filter query
    filter_query = {}
    if role:
        filter_query["role"] = role
    if status_filter:
        filter_query["status"] = status_filter
    
    # Get users
    cursor = users_col.find(filter_query).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    user_reports = []
    for user in users:
        user_id_str = str(user["_id"])
        
        # Count login actions
        login_count = await audit_logs_col.count_documents({
            "target_user_id": user_id_str,
            "action": "USER_LOGIN"
        })
        
        # Count all actions
        actions_count = await audit_logs_col.count_documents({
            "target_user_id": user_id_str
        })
        
        # Get last login
        last_login_log = await audit_logs_col.find_one(
            {"target_user_id": user_id_str, "action": "USER_LOGIN"},
            sort=[("timestamp", -1)]
        )
        
        last_login = None
        if last_login_log:
            last_login = last_login_log.get("timestamp").isoformat() if last_login_log.get("timestamp") else None
        elif user.get("last_login"):
            last_login = user.get("last_login").isoformat()
        
        user_reports.append(UserReport(
            id=user_id_str,
            user_name=user.get("full_name", "Unknown"),
            email=user.get("email", ""),
            role=user.get("role", ""),
            total_logins=login_count,
            last_login=last_login,
            actions_count=actions_count,
            status=user.get("status", "active"),
            created_at=user.get("created_at").isoformat() if user.get("created_at") else None,
        ))
    
    return user_reports


# ---------------------------
# AUDIT LOGS
# ---------------------------
@router.get("/audit-logs", response_model=List[AuditLog])
async def get_audit_logs(
    current_user: dict = Depends(get_current_user),
    action_filter: Optional[str] = Query(None, description="Filter by action"),
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
):
    """
    Get system audit logs
    Only accessible to Admin users
    """
    await ensure_admin(current_user)
    
    # Build filter query
    filter_query = {}
    if action_filter:
        filter_query["action"] = action_filter
    if status_filter:
        filter_query["status"] = status_filter
    
    # Get logs
    cursor = audit_logs_col.find(filter_query).sort("timestamp", -1).skip(skip).limit(limit)
    logs = await cursor.to_list(length=limit)
    
    audit_logs = []
    for log in logs:
        # Get user info
        performed_by_id = log.get("performed_by")
        user_name = "System"
        
        if performed_by_id:
            try:
                user = await users_col.find_one({"_id": ObjectId(performed_by_id)})
                if user:
                    user_name = user.get("full_name", "Unknown")
            except:
                pass
        
        # Determine resource and details from action
        action = log.get("action", "")
        resource = log.get("resource", action.split("_")[0] if "_" in action else "System")
        details = log.get("details", f"Action: {action}")
        
        # If changes exist, format them as details
        if log.get("changes"):
            changes = log.get("changes")
            details = f"Changes: {', '.join([f'{k}={v}' for k, v in changes.items()])}"
        
        audit_logs.append(AuditLog(
            id=str(log["_id"]),
            user_id=performed_by_id or "system",
            user_name=user_name,
            action=action,
            resource=resource,
            details=details,
            timestamp=log.get("timestamp").isoformat() if log.get("timestamp") else datetime.utcnow().isoformat(),
            status=log.get("status", "success"),
        ))
    
    return audit_logs


# ---------------------------
# DATA ANALYTICS
# ---------------------------
@router.get("/data-analytics", response_model=List[DataReport])
async def get_data_analytics(
    current_user: dict = Depends(get_current_user),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    days: int = Query(30, ge=1, le=365, description="Number of days to retrieve"),
):
    """
    Get data analytics over time
    Only accessible to Admin users
    """
    await ensure_admin(current_user)
    
    # Parse date range
    if start_date and end_date:
        try:
            start = datetime.fromisoformat(start_date)
            end = datetime.fromisoformat(end_date)
        except:
            raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    else:
        end = datetime.utcnow()
        start = end - timedelta(days=days)
    
    # Generate daily reports
    data_reports = []
    current_date = start
    
    while current_date <= end:
        next_date = current_date + timedelta(days=1)
        
        # Count users created on this date
        users_created = await users_col.count_documents({
            "created_at": {
                "$gte": current_date,
                "$lt": next_date
            }
        })
        
        # Count reports generated (symptoms + water quality)
        symptom_reports = await symptom_col.count_documents({
            "timestamp": {
                "$gte": current_date,
                "$lt": next_date
            }
        })
        
        water_reports = await water_col.count_documents({
            "timestamp": {
                "$gte": current_date,
                "$lt": next_date
            }
        })
        
        reports_generated = symptom_reports + water_reports
        
        # Count API calls (audit logs as proxy)
        api_calls = await audit_logs_col.count_documents({
            "timestamp": {
                "$gte": current_date,
                "$lt": next_date
            }
        })
        
        # Count data points (predictions)
        data_points = await prediction_col.count_documents({
            "timestamp": {
                "$gte": current_date,
                "$lt": next_date
            }
        })
        
        data_reports.append(DataReport(
            date=current_date.strftime("%Y-%m-%d"),
            users_created=users_created,
            reports_generated=reports_generated,
            api_calls=api_calls,
            data_points=data_points,
        ))
        
        current_date = next_date
    
    return data_reports
