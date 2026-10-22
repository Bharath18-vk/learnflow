import os
import logging
from pydantic_settings import BaseSettings
from pydantic import field_validator

logger = logging.getLogger("uvicorn.error")

class Settings(BaseSettings):
    PROJECT_NAME: str = "LearnWise API"
    ENVIRONMENT: str = "development"  # "development", "staging", "production"
    SECRET_KEY: str = "learnwise_super_secret_jwt_key_2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080
    DATABASE_URL: str = "sqlite:///./learnwise.db"

    @field_validator("SECRET_KEY")
    def validate_secret_key(cls, v: str) -> str:
        env = os.getenv("ENVIRONMENT", "development").strip().lower()
        insecure_keys = {
            "learnwise_super_secret_jwt_key_2026",
            "learnwise_super_secret_jwt_key_2026_change_in_production",
            "secret",
            "changeme",
            "password"
        }
        if env == "production":
            if v in insecure_keys or len(v) < 32:
                raise ValueError(
                    "CRITICAL SECURITY FAILURE: Production requires a strong SECRET_KEY "
                    "with at least 32 characters. Generate one using: python -c 'import secrets; print(secrets.token_urlsafe(32))'"
                )
        elif v in insecure_keys:
            logger.warning(
                "SECURITY WARNING: Running in development with default or insecure SECRET_KEY. "
                "Set a unique, strong SECRET_KEY before deploying to production."
            )
        return v

    # SMTP Configuration
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = "LearnWise <noreply@learnwise.app>"
    FRONTEND_URL: str = "http://localhost:5173"
    # External AI & API Keys
    GEMINI_API_KEY: str = ""
    GOOGLE_API_KEY: str = ""
    YOUTUBE_API_KEY: str = ""

    # Production CORS Origins (Comma-separated string or * for wildcard)
    ALLOWED_ORIGINS: str = "*"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
