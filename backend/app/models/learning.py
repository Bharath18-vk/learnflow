"""
LearnWise Phase 3: Learning, Mastery & Assessment Engine Models
Defines structured educational data models for milestone lessons, granular concepts,
user concept mastery heuristics, assessment sessions, attempt tracking, and targeted remediation.
"""

from sqlalchemy import Column, Integer, Float, String, Boolean, DateTime, ForeignKey, Text, text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base, engine


class LearningContent(Base):
    __tablename__ = "learning_contents"

    id = Column(Integer, primary_key=True, index=True)
    milestone_id = Column(Integer, ForeignKey("roadmap_steps.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    overview = Column(Text, nullable=False)
    estimated_minutes = Column(Integer, default=45)
    difficulty = Column(String, default="Beginner")
    learning_objectives = Column(Text, default="[]")  # JSON list of objective strings
    content_structure = Column(String, default="general")  # programming, theory, devops, data_science, math, general
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    concepts = relationship("LearningConcept", back_populates="learning_content", cascade="all, delete-orphan", order_by="LearningConcept.order_index")
    sections = relationship("LessonSection", back_populates="learning_content", cascade="all, delete-orphan", order_by="LessonSection.order_index")
    practice_activities = relationship("PracticeActivity", back_populates="learning_content", cascade="all, delete-orphan", order_by="PracticeActivity.order_index")
    checkpoint_questions = relationship("CheckpointQuestion", back_populates="learning_content", cascade="all, delete-orphan", order_by="CheckpointQuestion.order_index")
    recommended_resources = relationship("LearningResource", back_populates="learning_content", cascade="all, delete-orphan")
    progress_records = relationship("UserLearningProgress", back_populates="learning_content", cascade="all, delete-orphan")
    assessment_sessions = relationship("AssessmentSession", back_populates="learning_content", cascade="all, delete-orphan", order_by="AssessmentSession.attempt_number.desc()")
    remediation_units = relationship("RemediationUnit", back_populates="learning_content", cascade="all, delete-orphan")
    notes = relationship("UserNote", back_populates="learning_content", cascade="all, delete-orphan")
    bookmarks = relationship("Bookmark", back_populates="learning_content", cascade="all, delete-orphan")


class LearningConcept(Base):
    """
    Granular concept tracked inside a learning milestone (e.g. 'HTTP Methods', 'Status Codes', 'Idempotency').
    """
    __tablename__ = "learning_concepts"

    id = Column(Integer, primary_key=True, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, nullable=False, default=0)
    difficulty = Column(String, default="Beginner")  # Beginner, Intermediate, Advanced
    importance = Column(String, default="Essential")  # Essential, Recommended, Advanced
    estimated_minutes = Column(Integer, default=10)

    # Relationships
    learning_content = relationship("LearningContent", back_populates="concepts")
    mastery_records = relationship("UserConceptMastery", back_populates="concept", cascade="all, delete-orphan")


class UserConceptMastery(Base):
    """
    Tracks evidence-based concept mastery for a user on a specific learning concept.
    """
    __tablename__ = "user_concept_masteries"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(Integer, ForeignKey("learning_concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    mastery_score = Column(Float, default=0.0)  # 0.0 to 100.0
    mastery_level = Column(String, default="NOT_STARTED")  # NOT_STARTED, LEARNING, DEVELOPING, PROFICIENT, MASTERED
    attempts_count = Column(Integer, default=0)
    correct_attempts = Column(Integer, default=0)
    incorrect_attempts = Column(Integer, default=0)
    practice_completed = Column(Boolean, default=False)
    practice_hints_used = Column(Integer, default=0)
    solution_viewed = Column(Boolean, default=False)
    practice_quality = Column(Float, default=0.0)  # 0.0 to 1.0 (independent = 1.0, with hints = 0.7, solution = 0.35)
    last_difficulty = Column(String, default="medium")  # easy, medium, hard
    confidence_score = Column(Float, default=0.5)
    improvement_rate = Column(Float, default=0.0)  # Gain from baseline/remediation
    history_json = Column(Text, default="[]")  # Historical score snapshots JSON array
    last_assessed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    concept = relationship("LearningConcept", back_populates="mastery_records")
    learning_content = relationship("LearningContent")


class AssessmentSession(Base):
    """
    Records an assessment event (checkpoint assessment or targeted remediation reassessment).
    """
    __tablename__ = "assessment_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_id = Column(Integer, ForeignKey("roadmap_steps.id", ondelete="CASCADE"), nullable=False, index=True)
    attempt_number = Column(Integer, default=1)
    session_type = Column(String, default="checkpoint")  # checkpoint, reassessment, diagnostic
    target_concept_id = Column(Integer, nullable=True)  # Populated for concept remediation reassessments
    total_questions = Column(Integer, default=0)
    correct_count = Column(Integer, default=0)
    score_percentage = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    mastery_summary = Column(Text, nullable=True)  # JSON dict with strengths, developing, weaknesses, recommendations
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    learning_content = relationship("LearningContent", back_populates="assessment_sessions")
    attempts = relationship("AssessmentAttempt", back_populates="session", cascade="all, delete-orphan", order_by="AssessmentAttempt.id")


class AssessmentAttempt(Base):
    """
    Stores individual question responses inside an assessment session.
    """
    __tablename__ = "assessment_attempts"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("assessment_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(Integer, nullable=True)
    concept_id = Column(Integer, nullable=True)
    concept_name = Column(String, nullable=True)
    question_type = Column(String, default="mcq")  # mcq, multi_select, true_false, code_output, short_answer, scenario
    difficulty = Column(String, default="medium")  # easy, medium, hard
    selected_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, default=False)
    time_spent_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    session = relationship("AssessmentSession", back_populates="attempts")


class RemediationUnit(Base):
    """
    Targeted 10-minute remediation module generated for a specific weak concept.
    """
    __tablename__ = "remediation_units"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(Integer, ForeignKey("learning_concepts.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    concept_name = Column(String, nullable=False)
    diagnosis_summary = Column(Text, nullable=False)  # Plain language explanation of misconception
    targeted_explanation = Column(Text, nullable=False)  # Focused refresher markdown
    code_example = Column(Text, nullable=True)
    focused_exercises = Column(Text, default="[]")  # JSON list of 1-3 practice exercises
    mini_quiz = Column(Text, default="[]")  # JSON list of 2-3 reassessment questions
    is_completed = Column(Boolean, default=False)
    reassessment_score = Column(Float, nullable=True)
    baseline_mastery = Column(Float, nullable=True)
    post_mastery = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    learning_content = relationship("LearningContent", back_populates="remediation_units")
    concept = relationship("LearningConcept")


class LessonSection(Base):
    __tablename__ = "lesson_sections"

    id = Column(Integer, primary_key=True, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(Integer, ForeignKey("learning_concepts.id", ondelete="SET NULL"), nullable=True)
    concept_name = Column(String, nullable=True)
    title = Column(String, nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    explanation = Column(Text, nullable=False)  # Rich structured markdown
    key_takeaway = Column(Text, nullable=True)
    estimated_minutes = Column(Integer, default=8)
    interactive_check = Column(Text, nullable=True)  # JSON dict with prompt, check_type, options, answer, explanation

    # Relationships
    learning_content = relationship("LearningContent", back_populates="sections")
    examples = relationship("LessonExample", back_populates="section", cascade="all, delete-orphan", order_by="LessonExample.order_index")


class LessonExample(Base):
    __tablename__ = "lesson_examples"

    id = Column(Integer, primary_key=True, index=True)
    lesson_section_id = Column(Integer, ForeignKey("lesson_sections.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    explanation = Column(Text, nullable=True)
    example_content = Column(Text, nullable=False)  # Code, math calculation, CLI commands, or scenario
    language = Column(String, default="text")  # python, javascript, sql, bash, json, etc.
    order_index = Column(Integer, nullable=False, default=0)

    # Relationships
    section = relationship("LessonSection", back_populates="examples")


class PracticeActivity(Base):
    __tablename__ = "practice_activities"

    id = Column(Integer, primary_key=True, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(Integer, ForeignKey("learning_concepts.id", ondelete="SET NULL"), nullable=True)
    concept_name = Column(String, nullable=True)
    title = Column(String, nullable=False)
    instructions = Column(Text, nullable=False)
    activity_type = Column(String, default="coding")  # coding, problem_solving, scenario, debug, concept_match
    difficulty = Column(String, default="Beginner")
    expected_minutes = Column(Integer, default=20)
    starter_code = Column(Text, nullable=True)
    solution_hint = Column(Text, nullable=True)
    sample_solution = Column(Text, nullable=False)
    hints_used = Column(Integer, default=0)
    solution_revealed = Column(Boolean, default=False)
    order_index = Column(Integer, nullable=False, default=0)

    # Relationships
    learning_content = relationship("LearningContent", back_populates="practice_activities")


class CheckpointQuestion(Base):
    __tablename__ = "checkpoint_questions"

    id = Column(Integer, primary_key=True, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(Integer, ForeignKey("learning_concepts.id", ondelete="SET NULL"), nullable=True)
    concept_name = Column(String, nullable=True)
    question = Column(Text, nullable=False)
    question_type = Column(String, default="mcq")  # mcq, true_false, multi_select, code_output, short_answer, scenario
    options = Column(Text, default="[]")  # JSON list of string options
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True)
    difficulty = Column(String, default="medium")  # easy, medium, hard
    order_index = Column(Integer, nullable=False, default=0)

    # Relationships
    learning_content = relationship("LearningContent", back_populates="checkpoint_questions")


class LearningResource(Base):
    __tablename__ = "learning_resources"

    id = Column(Integer, primary_key=True, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    resource_type = Column(String, default="docs")  # docs, video, practice, article, course
    url = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    relevance_reason = Column(Text, nullable=False)  # Explicit 'Why this resource?' rationale
    estimated_minutes = Column(Integer, default=15)
    provider = Column(String, default="Official Docs")

    # Relationships
    learning_content = relationship("LearningContent", back_populates="recommended_resources")


class UserLearningProgress(Base):
    __tablename__ = "user_learning_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    milestone_id = Column(Integer, ForeignKey("roadmap_steps.id", ondelete="CASCADE"), nullable=False, index=True)
    current_section_index = Column(Integer, default=0)
    completed_sections = Column(Text, default="[]")  # JSON list of completed section order indices
    practice_completed = Column(Boolean, default=False)
    practice_hints_used = Column(Integer, default=0)
    practice_solution_viewed = Column(Boolean, default=False)
    checkpoint_completed = Column(Boolean, default=False)
    checkpoint_score = Column(Float, nullable=True)
    checkpoint_total = Column(Integer, nullable=True)
    checkpoint_answers = Column(Text, nullable=True)  # JSON dict of user responses
    progress_percentage = Column(Integer, default=0)
    status = Column(String, default="not_started")  # not_started, in_progress, completed
    started_at = Column(DateTime, default=datetime.utcnow)
    last_accessed_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    learning_content = relationship("LearningContent", back_populates="progress_records")


class UserNote(Base):
    __tablename__ = "user_notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(Integer, nullable=True)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    learning_content = relationship("LearningContent", back_populates="notes")


class Bookmark(Base):
    __tablename__ = "user_bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    learning_content_id = Column(Integer, ForeignKey("learning_contents.id", ondelete="CASCADE"), nullable=False, index=True)
    section_id = Column(Integer, nullable=True)
    title = Column(String, nullable=True)
    snippet = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    learning_content = relationship("LearningContent", back_populates="bookmarks")


def run_sqlite_learning_migrations():
    """
    Non-destructively ensures all Phase 2 and Phase 3 tables and columns exist in SQLite.
    """
    try:
        # 1. Create all newly declared tables
        Base.metadata.create_all(bind=engine)

        # 2. Add any new columns to pre-existing tables if they don't already exist
        with engine.connect() as conn:
            # Helper function to check and add column
            def add_column_if_missing(table_name: str, col_name: str, col_type: str, default_val: str = None):
                cursor = conn.execute(text(f"PRAGMA table_info({table_name})"))
                existing_cols = [row[1] for row in cursor.fetchall()]
                if col_name not in existing_cols:
                    stmt = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}"
                    if default_val is not None:
                        stmt += f" DEFAULT {default_val}"
                    conn.execute(text(stmt))
                    conn.commit()

            # Lesson sections
            add_column_if_missing("lesson_sections", "concept_id", "INTEGER")
            add_column_if_missing("lesson_sections", "concept_name", "VARCHAR")

            # Practice activities
            add_column_if_missing("practice_activities", "concept_id", "INTEGER")
            add_column_if_missing("practice_activities", "concept_name", "VARCHAR")
            add_column_if_missing("practice_activities", "hints_used", "INTEGER", "0")
            add_column_if_missing("practice_activities", "solution_revealed", "BOOLEAN", "0")

            # Checkpoint questions
            add_column_if_missing("checkpoint_questions", "concept_id", "INTEGER")
            add_column_if_missing("checkpoint_questions", "concept_name", "VARCHAR")

            # User progress
            add_column_if_missing("user_learning_progress", "practice_hints_used", "INTEGER", "0")
            add_column_if_missing("user_learning_progress", "practice_solution_viewed", "BOOLEAN", "0")

    except Exception as e:
        print("SQLite learning migration info/warning:", e)

