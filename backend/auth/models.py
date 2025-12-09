# backend/auth/models.py
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

# ---------------------------
# Core auth models
# ---------------------------
class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, description="User's full name")
    email: EmailStr
    # role from signup is ignored / forced to community on backend logic
    role: str = Field(default="community_user", min_length=1)
    password: str = Field(..., min_length=6, description="Password")
    confirm_password: str = Field(..., min_length=6, description="Confirm password")
    organization: Optional[str] = Field(None, description="Organization name")
    location: Optional[str] = Field(None, description="Location")
    phone: Optional[str] = Field(None, description="Phone number")
    
    class Config:
        json_schema_extra = {
            "example": {
                "full_name": "John Doe",
                "email": "john@example.com",
                "role": "community_user",
                "password": "password123",
                "confirm_password": "password123",
                "organization": "Example Org",
                "location": "Mumbai",
                "phone": "+91-9876543210"
            }
        }


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


class UserInToken(BaseModel):
    id: str
    email: str
    role: str
    full_name: Optional[str] = None
    organization: Optional[str] = None
    location: Optional[str] = None
    phone: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[UserInToken] = None


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