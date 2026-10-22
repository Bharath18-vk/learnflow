"""
LearnWise Phase 3: Learning Content, Concept Mastery & Assessment Schemas
Strict validation schemas for learning units, granular concepts, evidence-based mastery,
assessment sessions, attempts, targeted remediation, and multi-factor completion.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime


# --- Concept Schemas ---

class LearningConceptSchema(BaseModel):
    id: Optional[int] = None
    learning_content_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    order_index: int = 0
    difficulty: str = "Beginner"
    importance: str = "Essential"
    estimated_minutes: int = 10

    class Config:
        from_attributes = True


class UserConceptMasterySchema(BaseModel):
    id: Optional[int] = None
    concept_id: int
    concept_name: str
    mastery_score: float = 0.0
    mastery_level: str = "NOT_STARTED"  # NOT_STARTED, LEARNING, DEVELOPING, PROFICIENT, MASTERED
    attempts_count: int = 0
    correct_attempts: int = 0
    incorrect_attempts: int = 0
    practice_completed: bool = False
    practice_quality: float = 0.0
    confidence_score: float = 0.5
    improvement_rate: float = 0.0
    last_difficulty: str = "medium"
    last_assessed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ConceptMasteryListResponse(BaseModel):
    milestone_id: int
    milestone_title: str
    overall_mastery_percentage: float
    mastery_level: str
    strong_concepts: List[UserConceptMasterySchema] = []
    developing_concepts: List[UserConceptMasterySchema] = []
    weak_concepts: List[UserConceptMasterySchema] = []
    all_concepts: List[UserConceptMasterySchema] = []


# --- Section & Example Schemas ---

class LessonExampleSchema(BaseModel):
    id: Optional[int] = None
    title: str
    explanation: Optional[str] = None
    example_content: str
    language: str = "text"
    order_index: int = 0

    class Config:
        from_attributes = True


class InteractiveCheckSchema(BaseModel):
    prompt: str
    check_type: str = "quick_quiz"  # predict_output, quick_quiz, reflection
    code_snippet: Optional[str] = None
    options: List[str] = []
    correct_answer: str
    explanation: Optional[str] = None


class LessonSectionSchema(BaseModel):
    id: Optional[int] = None
    concept_id: Optional[int] = None
    concept_name: Optional[str] = None
    title: str
    order_index: int = 0
    explanation: str
    key_takeaway: Optional[str] = None
    estimated_minutes: int = 8
    interactive_check: Optional[Dict[str, Any]] = None
    examples: List[LessonExampleSchema] = []

    class Config:
        from_attributes = True


# --- Practice Activity Schemas ---

class PracticeActivitySchema(BaseModel):
    id: Optional[int] = None
    concept_id: Optional[int] = None
    concept_name: Optional[str] = None
    title: str
    instructions: str
    activity_type: str = "coding"  # coding, problem_solving, scenario, debug, concept_match
    difficulty: str = "Beginner"
    expected_minutes: int = 20
    starter_code: Optional[str] = None
    solution_hint: Optional[str] = None
    sample_solution: str
    hints_used: int = 0
    solution_revealed: bool = False
    order_index: int = 0

    class Config:
        from_attributes = True


# --- Checkpoint Question Schemas ---

class CheckpointQuestionSchema(BaseModel):
    id: Optional[int] = None
    concept_id: Optional[int] = None
    concept_name: Optional[str] = None
    question: str
    question_type: str = "mcq"  # mcq, true_false, multi_select, code_output, short_answer, scenario
    options: List[str] = []
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str = "medium"  # easy, medium, hard
    order_index: int = 0

    class Config:
        from_attributes = True


class AssessmentQuestionPublicSchema(BaseModel):
    """Sanitized question schema sent to the frontend BEFORE user answers (anti-leakage)."""
    id: int
    concept_name: Optional[str] = None
    question: str
    question_type: str = "mcq"
    options: List[str] = []
    difficulty: str = "medium"
    order_index: int = 0


# --- Learning Resource Schemas ---

class LearningResourceSchema(BaseModel):
    id: Optional[int] = None
    title: str
    resource_type: str = "docs"  # docs, video, practice, article, course
    url: str
    description: Optional[str] = None
    relevance_reason: str
    estimated_minutes: int = 15
    provider: str = "Official Docs"

    class Config:
        from_attributes = True


# --- User Learning Progress Schemas ---

class UserLearningProgressSchema(BaseModel):
    id: Optional[int] = None
    user_id: int
    learning_content_id: int
    milestone_id: int
    current_section_index: int = 0
    completed_sections: List[int] = []
    practice_completed: bool = False
    practice_hints_used: int = 0
    practice_solution_viewed: bool = False
    checkpoint_completed: bool = False
    checkpoint_score: Optional[float] = None
    checkpoint_total: Optional[int] = None
    checkpoint_answers: Optional[Dict[str, Any]] = None
    progress_percentage: int = 0
    status: str = "not_started"  # not_started, in_progress, completed
    started_at: Optional[datetime] = None
    last_accessed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProgressUpdatePayload(BaseModel):
    current_section_index: Optional[int] = Field(default=None, ge=0, le=50)
    completed_section_index: Optional[int] = Field(default=None, ge=0, le=50)
    practice_completed: Optional[bool] = None
    practice_hints_used: Optional[int] = Field(default=None, ge=0, le=20)
    practice_solution_viewed: Optional[bool] = None


# --- Assessment & Checkpoint Evaluation Schemas ---

class CheckpointSubmissionPayload(BaseModel):
    answers: Dict[str, Any] = Field(..., description="Map of question_id -> user answer")
    hints_used: Optional[Dict[str, int]] = None
    time_spent_seconds: Optional[int] = Field(default=None, ge=0, le=86400)


class CheckpointEvaluationResult(BaseModel):
    question_id: int
    question: str
    concept_name: Optional[str] = None
    difficulty: str = "medium"
    user_answer: Any
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None


class CheckpointResultResponse(BaseModel):
    session_id: Optional[int] = None
    attempt_number: int = 1
    total_questions: int
    correct_count: int
    score_percentage: float
    passed: bool
    evaluations: List[CheckpointEvaluationResult]
    mastery_level: str = "DEVELOPING"
    strengths: List[str] = []
    developing: List[str] = []
    weaknesses: List[str] = []
    personalized_feedback: str = ""
    recommended_action: str = "targeted_practice"  # next_milestone, quick_review, targeted_practice
    lesson_sections_complete: bool
    practice_complete: bool
    milestone_completed: bool
    progress_percentage: int
    status: str


class AssessmentSessionSchema(BaseModel):
    id: int
    user_id: int
    learning_content_id: int
    milestone_id: int
    attempt_number: int
    session_type: str
    total_questions: int
    correct_count: int
    score_percentage: float
    passed: bool
    mastery_summary: Optional[Dict[str, Any]] = None
    started_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# --- Targeted Remediation Schemas ---

class RemediationUnitSchema(BaseModel):
    id: int
    learning_content_id: int
    concept_id: int
    concept_name: str
    title: str
    diagnosis_summary: str
    targeted_explanation: str
    code_example: Optional[str] = None
    focused_exercises: List[Dict[str, Any]] = []
    mini_quiz: List[Dict[str, Any]] = []
    is_completed: bool = False
    baseline_mastery: Optional[float] = None
    post_mastery: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ReassessmentSubmissionPayload(BaseModel):
    answers: Dict[str, str]  # question index/id -> selected answer string


class ReassessmentResultResponse(BaseModel):
    remediation_id: int
    concept_id: int
    concept_name: str
    total_questions: int
    correct_count: int
    score_percentage: float
    passed: bool
    baseline_mastery: float
    post_mastery: float
    improvement_points: float
    new_mastery_level: str
    evaluations: List[Dict[str, Any]] = []


# --- Full Learning Content Schemas ---

class LearningContentSchema(BaseModel):
    id: int
    milestone_id: int
    user_id: int
    title: str
    overview: str
    estimated_minutes: int = 45
    difficulty: str = "Beginner"
    learning_objectives: List[str] = []
    content_structure: str = "general"
    version: int = 1
    created_at: Optional[datetime] = None
    concepts: List[LearningConceptSchema] = []
    sections: List[LessonSectionSchema] = []
    practice_activities: List[PracticeActivitySchema] = []
    checkpoint_questions: List[CheckpointQuestionSchema] = []
    recommended_resources: List[LearningResourceSchema] = []
    progress: Optional[UserLearningProgressSchema] = None

    class Config:
        from_attributes = True


class MilestoneLearningResponse(BaseModel):
    has_content: bool
    milestone_id: int
    milestone_title: str
    phase_number: int
    phase_title: str
    difficulty: str
    estimated_hours: float
    content: Optional[LearningContentSchema] = None


# --- Notes & Bookmark Schemas ---

class UserNoteSchema(BaseModel):
    id: int
    user_id: int
    learning_content_id: int
    section_id: Optional[int] = None
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserNoteCreatePayload(BaseModel):
    section_id: Optional[int] = None
    content: str = Field(..., min_length=1, max_length=5000)


class UserNoteUpdatePayload(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)


class BookmarkSchema(BaseModel):
    id: int
    user_id: int
    learning_content_id: int
    section_id: Optional[int] = None
    title: Optional[str] = None
    snippet: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class BookmarkPayload(BaseModel):
    section_id: Optional[int] = None
    title: Optional[str] = Field(default=None, max_length=200)
    snippet: Optional[str] = Field(default=None, max_length=1000)


class ActiveSessionResponse(BaseModel):
    has_active_session: bool
    milestone_id: Optional[int] = None
    milestone_title: Optional[str] = None
    phase_number: Optional[int] = None
    phase_title: Optional[str] = None
    learning_content_id: Optional[int] = None
    current_section_index: int = 0
    total_sections: int = 0
    progress_percentage: int = 0
    estimated_minutes_remaining: int = 0
    last_accessed_at: Optional[datetime] = None


class MasteryDashboardSummaryResponse(BaseModel):
    has_active_mastery: bool = False
    milestone_id: Optional[int] = None
    milestone_title: Optional[str] = None
    phase_title: Optional[str] = None
    mastery_percentage: float = 0.0
    mastery_level: str = "NOT_STARTED"
    strong_count: int = 0
    developing_count: int = 0
    weak_count: int = 0
    top_weak_concept: Optional[str] = None
    action_recommendation: Optional[str] = None
