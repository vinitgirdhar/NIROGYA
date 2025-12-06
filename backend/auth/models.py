# backend/auth/models.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# ---------------------------
# Core auth models
# ---------------------------
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    # role from signup is ignored / forced to community on backend logic
    role: str = Field(..., min_length=1)
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)
    organization: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str
    organization: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None
    created_at: Optional[datetime] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


# ---------------------------
# Admin-only create models
# ---------------------------
class AdminCreateAshaRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    district: str = Field(..., min_length=2)
    location: str = Field(..., min_length=2)
    phone: Optional[str] = None
    # optional override; if not sent we auto-generate
    email: Optional[EmailStr] = None


class AdminCreateGovernmentUserRequest(BaseModel):
    full_name: str = Field(..., min_length=2)
    email: EmailStr
    department: Optional[str] = None
    phone: Optional[str] = None


class AdminCreatedUserResponse(UserOut):
    # plain temp password shown once in UI
    temp_password: str