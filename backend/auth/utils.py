# backend/auth/utils.py
import os
from datetime import datetime, timedelta
from typing import Optional, Tuple, Dict, Any
import secrets
import string

from passlib.context import CryptContext
import jwt  # PyJWT

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False

def generate_temp_password(length: int = 10) -> str:
    """Generate a strong temporary password"""
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    while True:
        pwd = "".join(secrets.choice(chars) for _ in range(length))
        if (
            any(c.islower() for c in pwd)
            and any(c.isupper() for c in pwd)
            and any(c.isdigit() for c in pwd)
        ):
            return pwd

# JWT configuration (read from env if present)
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-to-a-long-secret")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRES_MINUTES = int(os.getenv("JWT_EXPIRES_MINUTES", "1440"))  # default 1 day

def create_access_token(subject: str, extra: Optional[Dict[str, Any]] = None, expires_minutes: Optional[int] = None) -> Tuple[str, datetime]:
    """
    Create a JWT token. `subject` usually the user id (string).
    Returns (token, expire_datetime)
    """
    expires_minutes = expires_minutes or JWT_EXPIRES_MINUTES
    expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": datetime.utcnow(),
        "exp": expire
    }
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    # PyJWT returns a str in v2.x; keep it str
    return token, expire

def decode_token(token: str) -> Dict[str, Any]:
    """
    Decode and validate a JWT token. Raises jwt exceptions on failure.
    Returns the decoded payload dict.
    """
    # This will raise jwt.ExpiredSignatureError or jwt.InvalidTokenError on problems
    payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    return payload
