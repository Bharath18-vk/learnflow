from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    plan_tier = Column(String, default="Free Plan")

    # Verification & Token Management
    is_verified = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    
    verification_token_hash = Column(String, nullable=True)
    verification_token_expires = Column(DateTime, nullable=True)
    
    password_reset_token_hash = Column(String, nullable=True)
    password_reset_token_expires = Column(DateTime, nullable=True)
    
    last_verification_email_sent = Column(DateTime, nullable=True)
    last_password_reset_sent = Column(DateTime, nullable=True)

    # Security Activity Logging
    password_changed_at = Column(DateTime, nullable=True)
    last_login_at = Column(DateTime, nullable=True)

    # Daily Study Schedule & Streak Tracker
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_study_date = Column(String, nullable=True)
    daily_goal_minutes = Column(Integer, default=30)
    today_minutes_logged = Column(Integer, default=0)
    last_log_date = Column(String, nullable=True)

    # XP & Gamification Leveling
    xp_points = Column(Integer, default=0)
    streak_freezes = Column(Integer, default=1)


