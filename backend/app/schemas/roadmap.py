from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class OnboardingRequest(BaseModel):
    goal_title: str = Field(..., min_length=1, max_length=200, description="Target learning topic or skill")
    target_outcome: Optional[str] = Field(default="Job-ready", max_length=100)
    skill_level: Optional[str] = Field(default="Beginner", max_length=50)
    existing_knowledge: Optional[str] = Field(default="", max_length=2000)
    daily_minutes: Optional[int] = Field(default=30, ge=5, le=720, description="Daily commitment in minutes (5 to 720)")
    days_per_week: Optional[int] = Field(default=5, ge=1, le=7, description="Study days per week (1 to 7)")
    deadline: Optional[str] = Field(default=None, max_length=50)
    preferred_format: Optional[str] = Field(default="All", max_length=300)
    learning_preferences: Optional[List[str]] = Field(default_factory=list, max_length=20)
    desired_depth: Optional[str] = Field(default="Balanced", max_length=100)

class RefineRoadmapRequest(BaseModel):
    refinement_prompt: str = Field(..., min_length=2, max_length=1500, description="Roadmap adjustment instructions")
    goal_id: int = Field(..., ge=1, description="Associated learning goal ID")

class ResourceSchema(BaseModel):
    id: Optional[int] = None
    title: str
    url: str
    resource_type: str

    class Config:
        from_attributes = True

class RoadmapStepSchema(BaseModel):
    id: Optional[int] = None
    phase_number: int = 1
    phase_title: str = "Core Foundations"
    title: str
    description: Optional[str] = None
    estimated_hours: float = 5.0
    difficulty: str = "Beginner"
    priority: str = "Essential"
    is_essential: bool = True
    prerequisites: List[str] = Field(default_factory=list)
    category: str = "Core Concept"
    order_index: int
    is_completed: bool = False
    completed_at: Optional[datetime] = None
    resources: List[ResourceSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True

class CommitmentDetailsSchema(BaseModel):
    daily_minutes: int = 30
    days_per_week: int = 5
    weekly_hours: float = 2.5
    monthly_hours: float = 10.8
    total_available_hours: Optional[float] = None
    deadline: Optional[str] = None
    days_until_deadline: Optional[int] = None
    weeks_until_deadline: Optional[float] = None

class FeasibilityAnalysisSchema(BaseModel):
    status: str = "realistic" # realistic, tight, infeasible
    total_estimated_hours: float = 0.0
    total_available_hours: Optional[float] = None
    hours_deficit_or_surplus: Optional[float] = None
    required_weekly_hours: Optional[float] = None
    notes: str = ""
    suggested_adjustments: List[str] = Field(default_factory=list)

class RoadmapSchema(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    total_estimated_hours: float = 0.0
    total_available_hours: float = 0.0
    estimated_duration_weeks: int = 1
    projected_completion_date: Optional[str] = None
    feasibility_status: str = "realistic"
    feasibility_notes: Optional[str] = None
    personalization_reasoning: List[str] = Field(default_factory=list)
    deferred_topics: List[str] = Field(default_factory=list)
    created_at: datetime
    steps: List[RoadmapStepSchema] = Field(default_factory=list)

    class Config:
        from_attributes = True

class GamificationStatsSchema(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    streak_freezes: int = 1
    xp_points: int = 0
    level: int = 1
    level_title: str = "Novice Learner"
    xp_into_level: int = 0
    xp_for_next_level: int = 100
    level_progress_percentage: int = 0

class GoalProgressSchema(BaseModel):
    goal_id: int
    title: str
    target_outcome: str = "Job-ready"
    skill_level: str = "Beginner"
    existing_knowledge: Optional[str] = ""
    daily_minutes: int = 30
    days_per_week: int = 5
    deadline: Optional[str] = None
    preferred_format: str = "All"
    learning_preferences: List[str] = Field(default_factory=list)
    desired_depth: str = "Balanced"
    total_steps: int = 0
    completed_steps: int = 0
    progress_percentage: int = 0
    streak_days: int = 1
    commitment: Optional[CommitmentDetailsSchema] = None
    feasibility: Optional[FeasibilityAnalysisSchema] = None
    user_stats: Optional[GamificationStatsSchema] = None
    next_step: Optional[RoadmapStepSchema] = None
    roadmap: Optional[RoadmapSchema] = None


