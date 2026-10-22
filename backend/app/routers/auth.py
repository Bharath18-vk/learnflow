from datetime import datetime, timedelta
import os
import logging
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

from app.database import get_db
from app.models.user import User
from app.schemas.auth import (
    UserCreate, UserLogin, UserResponse, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, ResendVerificationRequest
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.tokens import generate_secure_token, hash_token, verify_token_hash
from app.services.email_service import send_verification_email, send_password_reset_email, FRONTEND_URL
from app.routers.deps import get_current_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    clean_email = user_data.email.strip().lower()
    # Check if email exists
    existing_user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered."
        )
    
    # Generate secure verification token & hash
    raw_token = generate_secure_token()
    token_hash = hash_token(raw_token)
    expires_at = datetime.utcnow() + timedelta(hours=24)

    # Create new user
    new_user = User(
        full_name=user_data.full_name.strip(),
        email=clean_email,
        hashed_password=hash_password(user_data.password),
        is_verified=True,
        email_verified=True,
        verification_token_hash=token_hash,
        verification_token_expires=expires_at,
        last_verification_email_sent=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Send verification email
    delivery_info = send_verification_email(new_user.email, new_user.full_name, raw_token)

    # Generate JWT token
    access_token = create_access_token(data={"sub": new_user.email, "user_id": new_user.id})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(new_user)
    )


@router.post("/login", response_model=TokenResponse)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    clean_email = credentials.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Update last login timestamp
    user.last_login_at = datetime.utcnow()
    db.commit()

    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user)
    )


@router.get("/verify-email")
def verify_email(token: str = Query(...), db: Session = Depends(get_db)):
    """Verifies incoming email token using SHA-256 hash lookup."""
    incoming_hash = hash_token(token)
    user = db.query(User).filter(User.verification_token_hash == incoming_hash).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification link or token has already been used."
        )

    if user.verification_token_expires and user.verification_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This verification link has expired."
        )

    # Mark as verified & invalidate single-use token
    user.is_verified = True
    user.email_verified = True
    user.verification_token_hash = None
    user.verification_token_expires = None
    db.commit()

    # Generate JWT token for immediate session access
    access_token = create_access_token(data={"sub": user.email, "user_id": user.id})

    return {
        "message": "Email address successfully verified!",
        "access_token": access_token,
        "user": UserResponse.model_validate(user)
    }


@router.post("/resend-verification")
def resend_verification(req: ResendVerificationRequest, db: Session = Depends(get_db)):
    """Resends verification email with rate limiting."""
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    
    if not user:
        return {"message": "If an account exists, a new verification link has been sent."}

    if user.is_verified or user.email_verified:
        return {"message": "Email address is already verified."}

    # Rate limiting: Check cooldown
    now = datetime.utcnow()
    if user.last_verification_email_sent:
        time_since = now - user.last_verification_email_sent
        if time_since < timedelta(seconds=15):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Please wait 15 seconds before requesting another verification email."
            )

    # Generate new token & invalidate previous
    raw_token = generate_secure_token()
    user.verification_token_hash = hash_token(raw_token)
    user.verification_token_expires = now + timedelta(hours=24)
    user.last_verification_email_sent = now
    db.commit()

    delivery_info = send_verification_email(user.email, user.full_name, raw_token)
    if delivery_info.get("delivery_mode") == "dev_mock":
        logger.info(f"[DEV ONLY] Verification link for {user.email}: {FRONTEND_URL}/verify-email?token={raw_token}")

    return {
        "message": "If an account exists, a new verification link has been dispatched.",
        "delivery_mode": delivery_info.get("delivery_mode", "dev_mock"),
        "delivery_success": delivery_info.get("success", False),
        "smtp_error": delivery_info.get("error")
    }


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Generates password reset token and dispatches reset email."""
    clean_email = req.email.strip().lower()
    user = db.query(User).filter(func.lower(User.email) == clean_email).first()
    
    generic_response = {
        "message": "If an account exists, instructions to reset your password have been dispatched.",
        "status": "success",
        "delivery_mode": "dev_mock",
        "delivery_success": True
    }

    if not user:
        return generic_response

    # Rate limiting check
    now = datetime.utcnow()
    if user.last_password_reset_sent:
        if now - user.last_password_reset_sent < timedelta(seconds=10):
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Password reset email sent recently. Please check your inbox or wait a moment."
            )

    # Generate 30-minute single-use reset token
    raw_token = generate_secure_token()
    user.password_reset_token_hash = hash_token(raw_token)
    user.password_reset_token_expires = now + timedelta(minutes=30)
    user.last_password_reset_sent = now
    db.commit()

    delivery_info = send_password_reset_email(user.email, user.full_name, raw_token)
    if delivery_info.get("delivery_mode") == "dev_mock":
        logger.info(f"[DEV ONLY] Password reset link for {user.email}: {FRONTEND_URL}/reset-password?token={raw_token}")

    return {
        "message": "If an account exists, instructions to reset your password have been dispatched.",
        "status": "success",
        "delivery_mode": delivery_info.get("delivery_mode", "dev_mock"),
        "delivery_success": delivery_info.get("success", False),
        "smtp_error": delivery_info.get("error")
    }



@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    """Validates 30-minute single-use reset token and updates user password."""
    incoming_hash = hash_token(req.token)
    user = db.query(User).filter(User.password_reset_token_hash == incoming_hash).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or already used password reset link."
        )

    if user.password_reset_token_expires and user.password_reset_token_expires < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password reset link has expired. Please request a new link."
        )

    # Update password, set timestamp, and clear single-use token
    user.hashed_password = hash_password(req.new_password)
    user.password_changed_at = datetime.utcnow()
    user.password_reset_token_hash = None
    user.password_reset_token_expires = None
    db.commit()

    return {"message": "Password successfully updated! Please sign in with your new password."}


@router.get("/verification-status")
def get_verification_status(current_user: User = Depends(get_current_user)):
    """Returns email verification and security activity timestamps for profile view."""
    return {
        "email": current_user.email,
        "is_verified": current_user.is_verified or current_user.email_verified,
        "created_at": current_user.created_at,
        "last_login_at": current_user.last_login_at,
        "password_changed_at": current_user.password_changed_at,
        "last_verification_email_sent": current_user.last_verification_email_sent
    }
