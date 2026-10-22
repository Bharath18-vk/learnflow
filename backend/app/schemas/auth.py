from pydantic import BaseModel, EmailStr, field_validator, Field
from datetime import datetime
from typing import Optional
import re

class UserCreate(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    @field_validator('password')
    def validate_password_policy(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long.')
        if len(v) > 128:
            raise ValueError('Password must not exceed 128 characters.')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter.')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number.')
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*).')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1, max_length=128)

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    plan_tier: str = "Free Plan"
    is_verified: bool = False
    email_verified: bool = False
    created_at: datetime
    last_login_at: Optional[datetime] = None
    password_changed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str = Field(..., min_length=10, max_length=500)
    new_password: str = Field(..., min_length=8, max_length=128)

    @field_validator('new_password')
    def validate_password_policy(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long.')
        if len(v) > 128:
            raise ValueError('Password must not exceed 128 characters.')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter.')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number.')
        if not re.search(r'[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]', v):
            raise ValueError('Password must contain at least one special character (!@#$%^&*).')
        return v

class VerifyEmailRequest(BaseModel):
    token: str = Field(..., min_length=10, max_length=500)

class ResendVerificationRequest(BaseModel):
    email: EmailStr
