from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base, engine

class LearningGoal(Base):
    __tablename__ = "learning_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    target_outcome = Column(String, default="Job-ready")
    skill_level = Column(String, default="Beginner")
    existing_knowledge = Column(Text, nullable=True)
    daily_minutes = Column(Integer, default=30)
    days_per_week = Column(Integer, default=5)
    deadline = Column(String, nullable=True)
    preferred_format = Column(String, default="All")
    learning_preferences = Column(Text, default="[]")
    desired_depth = Column(String, default="Balanced")
    available_hours = Column(Float, nullable=True)
    estimated_hours = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    roadmaps = relationship("Roadmap", back_populates="goal", cascade="all, delete-orphan")


class Roadmap(Base):
    __tablename__ = "roadmaps"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("learning_goals.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    total_estimated_hours = Column(Float, default=0.0)
    total_available_hours = Column(Float, default=0.0)
    estimated_duration_weeks = Column(Integer, default=1)
    projected_completion_date = Column(String, nullable=True)
    feasibility_status = Column(String, default="realistic") # realistic, tight, infeasible
    feasibility_notes = Column(Text, nullable=True)
    personalization_reasoning = Column(Text, default="[]") # JSON string list
    deferred_topics = Column(Text, default="[]") # JSON string list
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    goal = relationship("LearningGoal", back_populates="roadmaps")
    steps = relationship("RoadmapStep", back_populates="roadmap", cascade="all, delete-orphan", order_by="RoadmapStep.order_index")


class RoadmapStep(Base):
    __tablename__ = "roadmap_steps"

    id = Column(Integer, primary_key=True, index=True)
    roadmap_id = Column(Integer, ForeignKey("roadmaps.id", ondelete="CASCADE"), nullable=False)
    phase_number = Column(Integer, default=1)
    phase_title = Column(String, default="Core Foundations")
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    estimated_hours = Column(Float, default=5.0)
    difficulty = Column(String, default="Beginner") # Beginner, Intermediate, Advanced
    priority = Column(String, default="Essential") # Essential, Optional, Advanced
    is_essential = Column(Boolean, default=True)
    prerequisites = Column(Text, default="[]") # JSON string list of topics
    category = Column(String, default="Core Concept") # Core Concept, Hands-on Project, Advanced
    order_index = Column(Integer, nullable=False, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    roadmap = relationship("Roadmap", back_populates="steps")
    resources = relationship("Resource", back_populates="step", cascade="all, delete-orphan")


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    step_id = Column(Integer, ForeignKey("roadmap_steps.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    url = Column(String, nullable=False)
    resource_type = Column(String, default="article") # youtube, docs, article, course, practice

    # Relationships
    step = relationship("RoadmapStep", back_populates="resources")


def run_sqlite_column_migrations():
    """
    Safely adds any missing columns to existing SQLite tables without dropping data.
    """
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            # Check learning_goals
            goal_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(learning_goals)")).fetchall()]
            if "target_outcome" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN target_outcome VARCHAR DEFAULT 'Job-ready'"))
            if "existing_knowledge" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN existing_knowledge TEXT"))
            if "days_per_week" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN days_per_week INTEGER DEFAULT 5"))
            if "deadline" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN deadline VARCHAR"))
            if "preferred_format" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN preferred_format VARCHAR DEFAULT 'All'"))
            if "learning_preferences" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN learning_preferences TEXT DEFAULT '[]'"))
            if "desired_depth" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN desired_depth VARCHAR DEFAULT 'Balanced'"))
            if "available_hours" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN available_hours FLOAT"))
            if "estimated_hours" not in goal_cols:
                conn.execute(text("ALTER TABLE learning_goals ADD COLUMN estimated_hours FLOAT"))

            # Check roadmaps
            roadmap_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(roadmaps)")).fetchall()]
            if "total_estimated_hours" not in roadmap_cols:
                conn.execute(text("ALTER TABLE roadmaps ADD COLUMN total_estimated_hours FLOAT DEFAULT 0.0"))
            if "total_available_hours" not in roadmap_cols:
                conn.execute(text("ALTER TABLE roadmaps ADD COLUMN total_available_hours FLOAT DEFAULT 0.0"))
            if "estimated_duration_weeks" not in roadmap_cols:
                conn.execute(text("ALTER TABLE roadmaps ADD COLUMN estimated_duration_weeks INTEGER DEFAULT 1"))
            if "projected_completion_date" not in roadmap_cols:
                conn.execute(text("ALTER TABLE roadmaps ADD COLUMN projected_completion_date VARCHAR"))
            if "feasibility_status" not in roadmap_cols:
                conn.execute(text("ALTER TABLE roadmaps ADD COLUMN feasibility_status VARCHAR DEFAULT 'realistic'"))
            if "feasibility_notes" not in roadmap_cols:
                conn.execute(text("ALTER TABLE roadmaps ADD COLUMN feasibility_notes TEXT"))
            if "personalization_reasoning" not in roadmap_cols:
                conn.execute(text("ALTER TABLE roadmaps ADD COLUMN personalization_reasoning TEXT DEFAULT '[]'"))
            if "deferred_topics" not in roadmap_cols:
                conn.execute(text("ALTER TABLE roadmaps ADD COLUMN deferred_topics TEXT DEFAULT '[]'"))

            # Check roadmap_steps
            step_cols = [row[1] for row in conn.execute(text("PRAGMA table_info(roadmap_steps)")).fetchall()]
            if "phase_number" not in step_cols:
                conn.execute(text("ALTER TABLE roadmap_steps ADD COLUMN phase_number INTEGER DEFAULT 1"))
            if "phase_title" not in step_cols:
                conn.execute(text("ALTER TABLE roadmap_steps ADD COLUMN phase_title VARCHAR DEFAULT 'Core Foundations'"))
            if "estimated_hours" not in step_cols:
                conn.execute(text("ALTER TABLE roadmap_steps ADD COLUMN estimated_hours FLOAT DEFAULT 5.0"))
            if "difficulty" not in step_cols:
                conn.execute(text("ALTER TABLE roadmap_steps ADD COLUMN difficulty VARCHAR DEFAULT 'Beginner'"))
            if "priority" not in step_cols:
                conn.execute(text("ALTER TABLE roadmap_steps ADD COLUMN priority VARCHAR DEFAULT 'Essential'"))
            if "is_essential" not in step_cols:
                conn.execute(text("ALTER TABLE roadmap_steps ADD COLUMN is_essential BOOLEAN DEFAULT 1"))
            if "prerequisites" not in step_cols:
                conn.execute(text("ALTER TABLE roadmap_steps ADD COLUMN prerequisites TEXT DEFAULT '[]'"))
            conn.commit()
    except Exception as e:
        # Ignore if tables are not yet created on initial run
        pass

