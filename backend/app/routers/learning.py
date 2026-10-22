"""
LearnWise Phase 3: Learning Content, Concept Mastery & Assessment Router
Provides REST endpoints for on-demand milestone learning generation, structured lesson retrieval,
progress tracking, evidence-weighted concept mastery, assessment sessions, targeted remediation,
anti-leakage question delivery, notes, bookmarks, and dashboard analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import json
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.roadmap import LearningGoal, Roadmap, RoadmapStep
from app.models.learning import (
    LearningContent,
    LearningConcept,
    UserConceptMastery,
    AssessmentSession,
    AssessmentAttempt,
    RemediationUnit,
    LessonSection,
    LessonExample,
    PracticeActivity,
    CheckpointQuestion,
    LearningResource,
    UserLearningProgress,
    UserNote,
    Bookmark
)
from app.schemas.learning import (
    LearningConceptSchema,
    UserConceptMasterySchema,
    ConceptMasteryListResponse,
    LearningContentSchema,
    MilestoneLearningResponse,
    ProgressUpdatePayload,
    UserLearningProgressSchema,
    CheckpointSubmissionPayload,
    CheckpointResultResponse,
    CheckpointEvaluationResult,
    AssessmentQuestionPublicSchema,
    AssessmentSessionSchema,
    RemediationUnitSchema,
    ReassessmentSubmissionPayload,
    ReassessmentResultResponse,
    MasteryDashboardSummaryResponse,
    UserNoteSchema,
    UserNoteCreatePayload,
    UserNoteUpdatePayload,
    BookmarkSchema,
    BookmarkPayload,
    ActiveSessionResponse
)
from app.routers.deps import get_current_user
from app.services.ai_learning_generator import generate_milestone_learning_content
from app.services.assessment_engine import (
    get_public_assessment_questions,
    start_assessment_session,
    evaluate_checkpoint_submission
)
from app.services.mastery_engine import (
    calculate_practice_quality,
    update_concept_masteries_from_assessment,
    get_milestone_mastery_breakdown,
    get_user_mastery_dashboard_summary,
    ensure_learning_concepts_exist
)
from app.services.remediation_engine import (
    generate_remediation_unit,
    evaluate_reassessment
)

router = APIRouter(prefix="/learning", tags=["Learning Experience"])


def _build_content_schema(content: LearningContent, progress: Optional[UserLearningProgress] = None) -> LearningContentSchema:
    """Helper to convert SQLAlchemy LearningContent to Pydantic schema with parsed JSON fields."""
    objectives = []
    if content.learning_objectives:
        try:
            objectives = json.loads(content.learning_objectives) if isinstance(content.learning_objectives, str) else content.learning_objectives
        except Exception:
            objectives = [content.learning_objectives]

    concepts = [
        {
            "id": c.id,
            "learning_content_id": c.learning_content_id,
            "name": c.name,
            "description": c.description,
            "order_index": c.order_index,
            "difficulty": c.difficulty,
            "importance": c.importance,
            "estimated_minutes": c.estimated_minutes
        }
        for c in (content.concepts or [])
    ]

    sections = []
    for s in content.sections:
        interactive = None
        if s.interactive_check:
            try:
                interactive = json.loads(s.interactive_check) if isinstance(s.interactive_check, str) else s.interactive_check
            except Exception:
                interactive = None

        examples = [
            {
                "id": ex.id,
                "title": ex.title,
                "explanation": ex.explanation,
                "example_content": ex.example_content,
                "language": ex.language or "text",
                "order_index": ex.order_index
            }
            for ex in s.examples
        ]

        sec_est_minutes = s.estimated_minutes or 8
        if sec_est_minutes > 15:
            words = len((s.explanation or "").split())
            sec_est_minutes = max(5, min(12, int(words / 120) + 4))

        sections.append({
            "id": s.id,
            "concept_id": s.concept_id,
            "concept_name": s.concept_name,
            "title": s.title,
            "order_index": s.order_index,
            "explanation": s.explanation,
            "key_takeaway": s.key_takeaway,
            "estimated_minutes": sec_est_minutes,
            "interactive_check": interactive,
            "examples": examples
        })

    practices = [
        {
            "id": p.id,
            "concept_id": p.concept_id,
            "concept_name": p.concept_name,
            "title": p.title,
            "instructions": p.instructions,
            "activity_type": p.activity_type,
            "difficulty": p.difficulty,
            "expected_minutes": p.expected_minutes,
            "starter_code": p.starter_code,
            "solution_hint": p.solution_hint,
            "sample_solution": p.sample_solution,
            "hints_used": p.hints_used or 0,
            "solution_revealed": p.solution_revealed or False,
            "order_index": p.order_index
        }
        for p in content.practice_activities
    ]

    checkpoints = [
        {
            "id": q.id,
            "concept_id": q.concept_id,
            "concept_name": q.concept_name,
            "question": q.question,
            "question_type": q.question_type,
            "options": json.loads(q.options) if isinstance(q.options, str) else q.options,
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "order_index": q.order_index
        }
        for q in content.checkpoint_questions
    ]


    resources = [
        {
            "id": r.id,
            "title": r.title,
            "resource_type": r.resource_type,
            "url": r.url,
            "description": r.description,
            "relevance_reason": r.relevance_reason,
            "estimated_minutes": r.estimated_minutes,
            "provider": r.provider
        }
        for r in content.recommended_resources
    ]

    progress_schema = None
    if progress:
        completed_secs = []
        if progress.completed_sections:
            try:
                completed_secs = json.loads(progress.completed_sections) if isinstance(progress.completed_sections, str) else progress.completed_sections
            except Exception:
                completed_secs = []

        answers = None
        if progress.checkpoint_answers:
            try:
                answers = json.loads(progress.checkpoint_answers) if isinstance(progress.checkpoint_answers, str) else progress.checkpoint_answers
            except Exception:
                answers = None

        progress_schema = {
            "id": progress.id,
            "user_id": progress.user_id,
            "learning_content_id": progress.learning_content_id,
            "milestone_id": progress.milestone_id,
            "current_section_index": progress.current_section_index,
            "completed_sections": completed_secs,
            "practice_completed": progress.practice_completed,
            "checkpoint_completed": progress.checkpoint_completed,
            "checkpoint_score": progress.checkpoint_score,
            "checkpoint_total": progress.checkpoint_total,
            "checkpoint_answers": answers,
            "progress_percentage": progress.progress_percentage,
            "status": progress.status,
            "started_at": progress.started_at,
            "last_accessed_at": progress.last_accessed_at,
            "completed_at": progress.completed_at
        }

    total_est_minutes = content.estimated_minutes or 45
    if total_est_minutes > 60:
        total_est_minutes = sum(sec["estimated_minutes"] for sec in sections) + (20 if practices else 0) + (10 if questions else 0)

    return LearningContentSchema(
        id=content.id,
        milestone_id=content.milestone_id,
        user_id=content.user_id,
        title=content.title,
        overview=content.overview,
        estimated_minutes=total_est_minutes,
        difficulty=content.difficulty,
        learning_objectives=objectives,
        content_structure=content.content_structure,
        version=content.version,
        created_at=content.created_at,
        concepts=concepts,
        sections=sections,
        practice_activities=practices,
        checkpoint_questions=checkpoints,
        recommended_resources=resources,
        progress=progress_schema
    )



# --- 1. Milestone Learning Retrieval & On-Demand Generation ---

@router.get("/milestones/{step_id}", response_model=MilestoneLearningResponse)
def get_milestone_learning(
    step_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Checks if structured learning content already exists for a milestone and returns it.
    If not, returns milestone metadata so the frontend can trigger generation.
    """
    step = db.query(RoadmapStep).join(Roadmap).filter(
        RoadmapStep.id == step_id,
        Roadmap.user_id == current_user.id
    ).first()

    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found or does not belong to the current user."
        )

    content = db.query(LearningContent).filter(
        LearningContent.milestone_id == step_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        return MilestoneLearningResponse(
            has_content=False,
            milestone_id=step.id,
            milestone_title=step.title,
            phase_number=step.phase_number or 1,
            phase_title=step.phase_title or "Core Foundations",
            difficulty=step.difficulty or "Beginner",
            estimated_hours=step.estimated_hours or 5.0,
            content=None
        )

    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.learning_content_id == content.id,
        UserLearningProgress.user_id == current_user.id
    ).first()

    content_data = _build_content_schema(content, progress)

    return MilestoneLearningResponse(
        has_content=True,
        milestone_id=step.id,
        milestone_title=step.title,
        phase_number=step.phase_number or 1,
        phase_title=step.phase_title or "Core Foundations",
        difficulty=step.difficulty or "Beginner",
        estimated_hours=step.estimated_hours or 5.0,
        content=content_data
    )


@router.post("/milestones/{step_id}/generate", response_model=MilestoneLearningResponse)
def generate_milestone_learning(
    step_id: int,
    force: bool = Query(False, description="Force regeneration even if content exists"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates tailored, interactive learning content for a milestone on-demand.
    Reuses existing content unless force=True.
    """
    step = db.query(RoadmapStep).join(Roadmap).filter(
        RoadmapStep.id == step_id,
        Roadmap.user_id == current_user.id
    ).first()

    if not step:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found or does not belong to the current user."
        )

    existing_content = db.query(LearningContent).filter(
        LearningContent.milestone_id == step_id,
        LearningContent.user_id == current_user.id
    ).first()

    if existing_content and not force:
        progress = db.query(UserLearningProgress).filter(
            UserLearningProgress.learning_content_id == existing_content.id,
            UserLearningProgress.user_id == current_user.id
        ).first()
        content_data = _build_content_schema(existing_content, progress)
        return MilestoneLearningResponse(
            has_content=True,
            milestone_id=step.id,
            milestone_title=step.title,
            phase_number=step.phase_number or 1,
            phase_title=step.phase_title or "Core Foundations",
            difficulty=step.difficulty or "Beginner",
            estimated_hours=step.estimated_hours or 5.0,
            content=content_data
        )

    # If force regenerating, delete existing content
    if existing_content and force:
        db.delete(existing_content)
        db.commit()

    roadmap = step.roadmap
    goal = roadmap.goal if roadmap else None

    goal_title = goal.title if goal else "Software Mastery"
    target_outcome = goal.target_outcome if goal else "Job-ready"
    skill_level = goal.skill_level if goal else (step.difficulty or "Beginner")
    existing_knowledge = goal.existing_knowledge if goal else ""
    daily_minutes = goal.daily_minutes if goal else 30
    days_per_week = goal.days_per_week if goal else 5
    desired_depth = goal.desired_depth if goal else "Balanced"

    learning_prefs = []
    if goal and goal.learning_preferences:
        try:
            learning_prefs = json.loads(goal.learning_preferences) if isinstance(goal.learning_preferences, str) else goal.learning_preferences
        except Exception:
            learning_prefs = ["Hands-on Code", "Visual & Video"]

    prereqs = []
    if step.prerequisites:
        try:
            prereqs = json.loads(step.prerequisites) if isinstance(step.prerequisites, str) else [step.prerequisites]
        except Exception:
            prereqs = [str(step.prerequisites)]

    milestone_dict = {
        "id": step.id,
        "title": step.title,
        "description": step.description or "",
        "estimated_hours": step.estimated_hours or 5.0,
        "difficulty": step.difficulty or "Beginner",
        "priority": step.priority or "Essential",
        "prerequisites": prereqs,
        "category": step.category or "Core Concept"
    }

    raw_content = generate_milestone_learning_content(
        goal_title=goal_title,
        target_outcome=target_outcome,
        skill_level=skill_level,
        existing_knowledge=existing_knowledge,
        daily_minutes=daily_minutes,
        days_per_week=days_per_week,
        learning_preferences=learning_prefs,
        desired_depth=desired_depth,
        milestone=milestone_dict
    )

    # Save to database
    content_obj = LearningContent(
        milestone_id=step.id,
        user_id=current_user.id,
        title=raw_content.get("title", step.title),
        overview=raw_content.get("overview", "Comprehensive lesson overview."),
        estimated_minutes=raw_content.get("estimated_minutes", 45),
        difficulty=raw_content.get("difficulty", step.difficulty or "Beginner"),
        learning_objectives=json.dumps(raw_content.get("learning_objectives", [])),
        content_structure=raw_content.get("content_structure", "general"),
        version=1,
        created_at=datetime.utcnow()
    )
    db.add(content_obj)
    db.flush()

    # Extract or infer Granular Concepts
    concepts_raw = raw_content.get("concepts", [])
    if not concepts_raw:
        for s_idx, sec in enumerate(raw_content.get("sections", []), 1):
            s_title = sec.get("title", f"Concept {s_idx}")
            clean_name = s_title.split(". ", 1)[1] if ". " in s_title else s_title
            concepts_raw.append({
                "name": clean_name.strip(),
                "description": sec.get("key_takeaway") or f"Core concept for {clean_name}",
                "order_index": s_idx,
                "difficulty": content_obj.difficulty,
                "importance": "Essential",
                "estimated_minutes": sec.get("estimated_minutes", 10)
            })

    concept_objs = []
    concept_map = {}
    for c_idx, c_dict in enumerate(concepts_raw, 1):
        c_obj = LearningConcept(
            learning_content_id=content_obj.id,
            name=c_dict.get("name", f"Concept {c_idx}"),
            description=c_dict.get("description"),
            order_index=c_dict.get("order_index", c_idx),
            difficulty=c_dict.get("difficulty", content_obj.difficulty),
            importance=c_dict.get("importance", "Essential"),
            estimated_minutes=c_dict.get("estimated_minutes", 10)
        )
        db.add(c_obj)
        db.flush()
        concept_objs.append(c_obj)
        concept_map[c_obj.name.strip().lower()] = c_obj

        # Initialize baseline UserConceptMastery record
        mastery_obj = UserConceptMastery(
            user_id=current_user.id,
            concept_id=c_obj.id,
            learning_content_id=content_obj.id,
            mastery_score=0.0,
            mastery_level="NOT_STARTED",
            attempts_count=0,
            correct_attempts=0,
            incorrect_attempts=0,
            practice_completed=False,
            practice_hints_used=0,
            solution_viewed=False,
            practice_quality=0.0,
            confidence_score=0.5,
            improvement_rate=0.0,
            history_json=json.dumps([]),
            created_at=datetime.utcnow()
        )
        db.add(mastery_obj)

    # Sections & Examples
    for s_idx, sec in enumerate(raw_content.get("sections", []), 1):
        matched_c = None
        s_c_name = sec.get("concept_name")
        if s_c_name and s_c_name.strip().lower() in concept_map:
            matched_c = concept_map[s_c_name.strip().lower()]
        elif concept_objs:
            matched_c = concept_objs[(s_idx - 1) % len(concept_objs)]

        sec_obj = LessonSection(
            learning_content_id=content_obj.id,
            concept_id=matched_c.id if matched_c else None,
            concept_name=matched_c.name if matched_c else None,
            title=sec.get("title", f"Section {s_idx}"),
            order_index=sec.get("order_index", s_idx),
            explanation=sec.get("explanation", ""),
            key_takeaway=sec.get("key_takeaway"),
            estimated_minutes=sec.get("estimated_minutes", 15),
            interactive_check=json.dumps(sec.get("interactive_check")) if sec.get("interactive_check") else None
        )
        db.add(sec_obj)
        db.flush()

        for ex_idx, ex in enumerate(sec.get("examples", []), 1):
            ex_obj = LessonExample(
                lesson_section_id=sec_obj.id,
                title=ex.get("title", f"Example {ex_idx}"),
                explanation=ex.get("explanation"),
                example_content=ex.get("example_content", ""),
                language=ex.get("language", "text"),
                order_index=ex.get("order_index", ex_idx)
            )
            db.add(ex_obj)

    # Practice Activities
    for p_idx, prac in enumerate(raw_content.get("practice", []), 1):
        matched_c = None
        p_c_name = prac.get("concept_name")
        if p_c_name and p_c_name.strip().lower() in concept_map:
            matched_c = concept_map[p_c_name.strip().lower()]
        elif concept_objs:
            matched_c = concept_objs[(p_idx - 1) % len(concept_objs)]

        prac_obj = PracticeActivity(
            learning_content_id=content_obj.id,
            concept_id=matched_c.id if matched_c else None,
            concept_name=matched_c.name if matched_c else None,
            title=prac.get("title", f"Practice Activity {p_idx}"),
            instructions=prac.get("instructions", ""),
            activity_type=prac.get("activity_type", "coding"),
            difficulty=prac.get("difficulty", "Beginner"),
            expected_minutes=prac.get("expected_minutes", 15),
            starter_code=prac.get("starter_code"),
            solution_hint=prac.get("solution_hint"),
            sample_solution=prac.get("sample_solution", ""),
            hints_used=0,
            solution_revealed=False,
            order_index=prac.get("order_index", p_idx)
        )
        db.add(prac_obj)

    # Checkpoint Questions
    for q_idx, q in enumerate(raw_content.get("checkpoint", []), 1):
        matched_c = None
        q_c_name = q.get("concept_name")
        if q_c_name and q_c_name.strip().lower() in concept_map:
            matched_c = concept_map[q_c_name.strip().lower()]
        elif concept_objs:
            matched_c = concept_objs[(q_idx - 1) % len(concept_objs)]

        q_obj = CheckpointQuestion(
            learning_content_id=content_obj.id,
            concept_id=matched_c.id if matched_c else None,
            concept_name=matched_c.name if matched_c else None,
            question=q.get("question", f"Question {q_idx}"),
            question_type=q.get("question_type", "mcq"),
            options=json.dumps(q.get("options", [])),
            correct_answer=q.get("correct_answer", ""),
            explanation=q.get("explanation"),
            difficulty=q.get("difficulty", "Beginner"),
            order_index=q.get("order_index", q_idx)
        )
        db.add(q_obj)

    # Recommended Resources
    for r_idx, res in enumerate(raw_content.get("resources", []), 1):
        res_obj = LearningResource(
            learning_content_id=content_obj.id,
            title=res.get("title", "Reference Resource"),
            resource_type=res.get("resource_type", "docs"),
            url=res.get("url", "#"),
            description=res.get("description"),
            relevance_reason=res.get("relevance_reason", "Recommended supplementary reference."),
            estimated_minutes=res.get("estimated_minutes", 15),
            provider=res.get("provider", "Official Docs")
        )
        db.add(res_obj)

    # Initialize User Progress
    progress_obj = UserLearningProgress(
        user_id=current_user.id,
        learning_content_id=content_obj.id,
        milestone_id=step.id,
        current_section_index=0,
        completed_sections=json.dumps([]),
        practice_completed=False,
        practice_hints_used=0,
        practice_solution_viewed=False,
        checkpoint_completed=False,
        progress_percentage=0,
        status="in_progress",
        started_at=datetime.utcnow(),
        last_accessed_at=datetime.utcnow()
    )
    db.add(progress_obj)
    db.commit()

    db.refresh(content_obj)
    db.refresh(progress_obj)

    content_data = _build_content_schema(content_obj, progress_obj)

    return MilestoneLearningResponse(
        has_content=True,
        milestone_id=step.id,
        milestone_title=step.title,
        phase_number=step.phase_number or 1,
        phase_title=step.phase_title or "Core Foundations",
        difficulty=step.difficulty or "Beginner",
        estimated_hours=step.estimated_hours or 5.0,
        content=content_data
    )


# --- 2. Dashboard Top-Level Mastery & Active Session Endpoints ---

@router.get("/active-session", response_model=ActiveSessionResponse)
def get_active_learning_session(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the user's most recently accessed in-progress learning session for the Dashboard.
    """
    recent_progress = db.query(UserLearningProgress).join(LearningContent).join(RoadmapStep).filter(
        UserLearningProgress.user_id == current_user.id,
        UserLearningProgress.status == "in_progress"
    ).order_by(UserLearningProgress.last_accessed_at.desc()).first()

    if not recent_progress:
        recent_progress = db.query(UserLearningProgress).join(LearningContent).join(RoadmapStep).filter(
            UserLearningProgress.user_id == current_user.id
        ).order_by(UserLearningProgress.last_accessed_at.desc()).first()

    if not recent_progress or not recent_progress.learning_content:
        return ActiveSessionResponse(has_active_session=False)

    content = recent_progress.learning_content
    step = db.query(RoadmapStep).filter(RoadmapStep.id == content.milestone_id).first()

    total_sections = len(content.sections)
    rem_sections = max(0, total_sections - (recent_progress.current_section_index + 1))
    est_rem_minutes = rem_sections * 15 + (15 if not recent_progress.practice_completed else 0) + (10 if not recent_progress.checkpoint_completed else 0)

    return ActiveSessionResponse(
        has_active_session=True,
        milestone_id=content.milestone_id,
        milestone_title=step.title if step else content.title,
        phase_number=step.phase_number if step else 1,
        phase_title=step.phase_title if step else "Core Foundations",
        learning_content_id=content.id,
        current_section_index=recent_progress.current_section_index,
        total_sections=total_sections,
        progress_percentage=recent_progress.progress_percentage,
        estimated_minutes_remaining=max(5, est_rem_minutes),
        last_accessed_at=recent_progress.last_accessed_at
    )


@router.get("/dashboard/mastery-summary", response_model=MasteryDashboardSummaryResponse)
def get_dashboard_mastery_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns aggregated mastery summary for the user's active learning milestone on the dashboard.
    """
    return get_user_mastery_dashboard_summary(db, current_user.id)


# --- 3. Learning Content, Progress & Navigation Tracking ---

@router.get("/{content_id}", response_model=LearningContentSchema)
def get_learning_content_by_id(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves complete learning content by ID for the authorized user."""
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.learning_content_id == content.id,
        UserLearningProgress.user_id == current_user.id
    ).first()

    if progress:
        progress.last_accessed_at = datetime.utcnow()
        db.commit()

    return _build_content_schema(content, progress)


@router.post("/{content_id}/progress", response_model=UserLearningProgressSchema)
def update_learning_progress(
    content_id: int,
    payload: ProgressUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates user progress through lesson sections and practice.
    Calculates progress percentage without auto-completing the milestone.
    """
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.learning_content_id == content.id,
        UserLearningProgress.user_id == current_user.id
    ).first()

    if not progress:
        progress = UserLearningProgress(
            user_id=current_user.id,
            learning_content_id=content.id,
            milestone_id=content.milestone_id,
            started_at=datetime.utcnow()
        )
        db.add(progress)

    # Parse completed sections list
    completed_secs = []
    if progress.completed_sections:
        try:
            completed_secs = json.loads(progress.completed_sections) if isinstance(progress.completed_sections, str) else progress.completed_sections
        except Exception:
            completed_secs = []

    if payload.current_section_index is not None:
        progress.current_section_index = payload.current_section_index

    if payload.completed_section_index is not None:
        if payload.completed_section_index not in completed_secs:
            completed_secs.append(payload.completed_section_index)
            progress.completed_sections = json.dumps(completed_secs)

    if payload.practice_completed is not None:
        progress.practice_completed = payload.practice_completed

    if payload.practice_hints_used is not None:
        progress.practice_hints_used = payload.practice_hints_used

    if payload.practice_solution_viewed is not None:
        progress.practice_solution_viewed = payload.practice_solution_viewed

    # Compute progress % (Lesson sections: 60%, Practice: 20%, Checkpoint: 20%)
    total_sections = max(1, len(content.sections))
    section_score = (len(completed_secs) / total_sections) * 60.0
    practice_score = 20.0 if progress.practice_completed else 0.0
    checkpoint_score = 20.0 if progress.checkpoint_completed else 0.0

    total_progress = min(100, int(section_score + practice_score + checkpoint_score))
    progress.progress_percentage = total_progress
    progress.last_accessed_at = datetime.utcnow()
    progress.status = "completed" if (progress.checkpoint_completed and progress.practice_completed and len(completed_secs) >= total_sections) else "in_progress"

    db.commit()
    db.refresh(progress)

    chk_ans = None
    if progress.checkpoint_answers:
        try:
            chk_ans = json.loads(progress.checkpoint_answers) if isinstance(progress.checkpoint_answers, str) else progress.checkpoint_answers
        except Exception:
            chk_ans = None

    return UserLearningProgressSchema(
        id=progress.id,
        user_id=progress.user_id,
        learning_content_id=progress.learning_content_id,
        milestone_id=progress.milestone_id,
        current_section_index=progress.current_section_index,
        completed_sections=completed_secs,
        practice_completed=progress.practice_completed,
        practice_hints_used=progress.practice_hints_used or 0,
        practice_solution_viewed=progress.practice_solution_viewed or False,
        checkpoint_completed=progress.checkpoint_completed,
        checkpoint_score=progress.checkpoint_score,
        checkpoint_total=progress.checkpoint_total,
        checkpoint_answers=chk_ans,
        progress_percentage=progress.progress_percentage,
        status=progress.status,
        started_at=progress.started_at,
        last_accessed_at=progress.last_accessed_at,
        completed_at=progress.completed_at
    )


# --- 4. Anti-Leakage Questions & Assessment Sessions ---

@router.get("/{content_id}/assessment/questions", response_model=List[AssessmentQuestionPublicSchema])
def get_sanitized_assessment_questions(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns sanitized checkpoint questions without answer leakage before submission.
    """
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    return get_public_assessment_questions(content)


@router.post("/{content_id}/assessment/start", response_model=AssessmentSessionSchema)
def start_checkpoint_session(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Starts a new assessment attempt session.
    """
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    session = start_assessment_session(db, current_user.id, content.id, session_type="checkpoint")
    return session


@router.get("/{content_id}/assessment/history", response_model=List[AssessmentSessionSchema])
def get_assessment_history(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all past assessment sessions for this learning milestone.
    """
    sessions = db.query(AssessmentSession).filter(
        AssessmentSession.learning_content_id == content_id,
        AssessmentSession.user_id == current_user.id
    ).order_by(AssessmentSession.attempt_number.desc()).all()
    return sessions


# --- 5. Strict Checkpoint Assessment & Multi-Factor Completion ---

@router.post("/{content_id}/checkpoint", response_model=CheckpointResultResponse)
def submit_checkpoint_assessment(
    content_id: int,
    payload: CheckpointSubmissionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates checkpoint questions submitted by user.
    Records AssessmentSession and AssessmentAttempts.
    Calculates 4-factor concept mastery across all concepts.
    Enforces strict 3-way completion rule:
    Milestone is ONLY completed if (All Lesson Sections Done) AND (Practice Done) AND (Checkpoint Passed >= 60%).
    """
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.learning_content_id == content.id,
        UserLearningProgress.user_id == current_user.id
    ).first()

    if not progress:
        progress = UserLearningProgress(
            user_id=current_user.id,
            learning_content_id=content.id,
            milestone_id=content.milestone_id,
            started_at=datetime.utcnow()
        )
        db.add(progress)

    # 1. Run assessment evaluation
    session, attempts, evaluations, summary_meta = evaluate_checkpoint_submission(
        db=db,
        content=content,
        user_id=current_user.id,
        payload=payload
    )

    # 2. Update concept-level masteries
    updated_masteries = update_concept_masteries_from_assessment(
        db=db,
        user_id=current_user.id,
        content=content,
        assessment_session=session,
        attempts=attempts
    )

    # 3. Categorize strengths, developing, and weaknesses
    mastery_breakdown = get_milestone_mastery_breakdown(db, current_user.id, content)
    strengths = [c.concept_name for c in mastery_breakdown.strong_concepts]
    developing = [c.concept_name for c in mastery_breakdown.developing_concepts]
    weaknesses = [c.concept_name for c in mastery_breakdown.weak_concepts]

    # Generate personalized diagnostic feedback
    if weaknesses:
        feedback = f"Good effort! You showed strength in {', '.join(strengths) if strengths else 'the basics'}, but {', '.join(weaknesses)} need reinforcement."
        recommended_action = "targeted_practice"
    elif developing:
        feedback = f"Solid progress! You are developing strong comprehension in {', '.join(developing)}."
        recommended_action = "targeted_practice"
    else:
        feedback = "Outstanding performance! You have mastered all core concepts for this milestone."
        recommended_action = "next_milestone"

    # 4. Save checkpoint progress
    passed = session.passed
    progress.checkpoint_completed = passed
    progress.checkpoint_score = session.score_percentage
    progress.checkpoint_total = session.total_questions
    progress.checkpoint_answers = json.dumps(payload.answers)
    progress.last_accessed_at = datetime.utcnow()

    # 5. Check 3-way completion condition:
    completed_secs = []
    if progress.completed_sections:
        try:
            completed_secs = json.loads(progress.completed_sections) if isinstance(progress.completed_sections, str) else progress.completed_sections
        except Exception:
            completed_secs = []

    total_sections = max(1, len(content.sections))
    lesson_sections_complete = len(completed_secs) >= total_sections
    practice_complete = bool(progress.practice_completed)
    milestone_completed = lesson_sections_complete and practice_complete and passed

    if milestone_completed:
        progress.status = "completed"
        progress.completed_at = datetime.utcnow()
        progress.progress_percentage = 100

        step = db.query(RoadmapStep).filter(RoadmapStep.id == content.milestone_id).first()
        if step:
            step.is_completed = True
            step.completed_at = datetime.utcnow()
    else:
        progress.status = "in_progress"
        sec_score = (len(completed_secs) / total_sections) * 60.0
        prac_score = 20.0 if practice_complete else 0.0
        check_score = 20.0 if passed else (session.score_percentage / 100.0) * 15.0
        progress.progress_percentage = min(99, int(sec_score + prac_score + check_score))

    db.commit()
    db.refresh(progress)

    return CheckpointResultResponse(
        session_id=session.id,
        attempt_number=session.attempt_number,
        total_questions=session.total_questions,
        correct_count=session.correct_count,
        score_percentage=session.score_percentage,
        passed=passed,
        evaluations=evaluations,
        mastery_level=mastery_breakdown.mastery_level,
        strengths=strengths,
        developing=developing,
        weaknesses=weaknesses,
        personalized_feedback=feedback,
        recommended_action=recommended_action,
        lesson_sections_complete=lesson_sections_complete,
        practice_complete=practice_complete,
        milestone_completed=milestone_completed,
        progress_percentage=progress.progress_percentage,
        status=progress.status
    )


# --- 6. Concept Mastery Breakdown & Weakness Detection ---

@router.get("/{content_id}/mastery", response_model=ConceptMasteryListResponse)
def get_learning_concept_mastery(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves full concept-level mastery diagnostic breakdown for this milestone.
    """
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    return get_milestone_mastery_breakdown(db, current_user.id, content)


@router.get("/{content_id}/weak-concepts", response_model=List[UserConceptMasterySchema])
def get_weak_concepts(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns only concepts where mastery score < 50% for quick remediation targeting.
    """
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    breakdown = get_milestone_mastery_breakdown(db, current_user.id, content)
    return breakdown.weak_concepts


# --- 7. Targeted 10-Minute Remediation & Mini-Reassessment ---

@router.post("/{content_id}/remediation/{concept_id}", response_model=RemediationUnitSchema)
def create_concept_remediation(
    content_id: int,
    concept_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generates a targeted 10-minute remediation unit for a weak concept.
    """
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    unit = generate_remediation_unit(db, current_user.id, content_id, concept_id)

    exercises = []
    if unit.focused_exercises:
        try:
            exercises = json.loads(unit.focused_exercises) if isinstance(unit.focused_exercises, str) else unit.focused_exercises
        except Exception:
            exercises = []

    mini_quiz = []
    if unit.mini_quiz:
        try:
            mini_quiz = json.loads(unit.mini_quiz) if isinstance(unit.mini_quiz, str) else unit.mini_quiz
        except Exception:
            mini_quiz = []

    return RemediationUnitSchema(
        id=unit.id,
        learning_content_id=unit.learning_content_id,
        concept_id=unit.concept_id,
        concept_name=unit.concept_name,
        title=unit.title,
        diagnosis_summary=unit.diagnosis_summary,
        targeted_explanation=unit.targeted_explanation,
        code_example=unit.code_example,
        focused_exercises=exercises,
        mini_quiz=mini_quiz,
        is_completed=unit.is_completed,
        baseline_mastery=unit.baseline_mastery,
        post_mastery=unit.post_mastery,
        created_at=unit.created_at
    )


@router.post("/{content_id}/remediation/{remediation_id}/reassess", response_model=ReassessmentResultResponse)
def submit_remediation_reassessment(
    content_id: int,
    remediation_id: int,
    payload: ReassessmentSubmissionPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluates mini-quiz answers for a remediation module, improves concept mastery,
    and returns progress metrics.
    """
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    return evaluate_reassessment(db, current_user.id, remediation_id, payload)


# --- 8. User Notes & Bookmarks Management ---

@router.get("/{content_id}/notes", response_model=List[UserNoteSchema])
def get_user_notes(
    content_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Retrieves all notes created by user for this learning content."""
    notes = db.query(UserNote).filter(
        UserNote.learning_content_id == content_id,
        UserNote.user_id == current_user.id
    ).order_by(UserNote.created_at.desc()).all()
    return notes


@router.post("/{content_id}/notes", response_model=UserNoteSchema, status_code=status.HTTP_201_CREATED)
def create_user_note(
    content_id: int,
    payload: UserNoteCreatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Adds a new markdown note for this lesson."""
    content = db.query(LearningContent).filter(
        LearningContent.id == content_id,
        LearningContent.user_id == current_user.id
    ).first()

    if not content:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning content not found.")

    note = UserNote(
        user_id=current_user.id,
        learning_content_id=content_id,
        section_id=payload.section_id,
        content=payload.content,
        created_at=datetime.utcnow()
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


@router.put("/notes/{note_id}", response_model=UserNoteSchema)
def update_user_note(
    note_id: int,
    payload: UserNoteUpdatePayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates an existing note."""
    note = db.query(UserNote).filter(
        UserNote.id == note_id,
        UserNote.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    note.content = payload.content
    note.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{note_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Deletes a user note."""
    note = db.query(UserNote).filter(
        UserNote.id == note_id,
        UserNote.user_id == current_user.id
    ).first()

    if not note:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found.")

    db.delete(note)
    db.commit()
    return None


@router.post("/{content_id}/bookmark", response_model=BookmarkSchema)
def toggle_bookmark(
    content_id: int,
    payload: BookmarkPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Toggles bookmark status for a lesson or section."""
    existing = db.query(Bookmark).filter(
        Bookmark.learning_content_id == content_id,
        Bookmark.user_id == current_user.id,
        Bookmark.section_id == payload.section_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()
        return BookmarkSchema(
            id=0,
            user_id=current_user.id,
            learning_content_id=content_id,
            section_id=payload.section_id,
            title=None,
            snippet=None,
            created_at=datetime.utcnow()
        )

    bmark = Bookmark(
        user_id=current_user.id,
        learning_content_id=content_id,
        section_id=payload.section_id,
        title=payload.title,
        snippet=payload.snippet,
        created_at=datetime.utcnow()
    )
    db.add(bmark)
    db.commit()
    db.refresh(bmark)
    return bmark


