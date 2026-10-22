from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
import app.models  # Ensures all models are loaded
from app.routers import auth, roadmap, learning

# Initialize DB tables
Base.metadata.create_all(bind=engine)
from app.models.roadmap import run_sqlite_column_migrations
from app.models.learning import run_sqlite_learning_migrations
run_sqlite_column_migrations()
run_sqlite_learning_migrations()

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for LearnWise AI learning platform",
    version="1.0.0"
)


# Configure CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:4173",
    "http://127.0.0.1:4173",
]

if settings.ALLOWED_ORIGINS and settings.ALLOWED_ORIGINS != "*":
    for origin in settings.ALLOWED_ORIGINS.split(","):
        trimmed = origin.strip()
        if trimmed and trimmed not in origins:
            origins.append(trimmed)

# Safe CORS configuration preventing credential leakage to arbitrary origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|.*\.vercel\.app|.*\.onrender\.com)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(learning.router, prefix="/api")


@app.get("/")
def read_root():
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
