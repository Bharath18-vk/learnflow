"""
LearnWise Phase 3: Concept Mastery Engine Service
Computes evidence-weighted concept mastery, practice quality analysis,
difficulty-adjusted scores, repeated consistency, strength/weakness categorization,
and dashboard mastery aggregation.
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import json
import math
import logging

from app.models.learning import (
    LearningContent,
    LearningConcept,
    UserConceptMastery,
    AssessmentSession,
    AssessmentAttempt,
    UserLearningProgress
)
from app.models.roadmap import Roadmap, RoadmapStep
from app.schemas.learning import (
    UserConceptMasterySchema,
    ConceptMasteryListResponse,
    MasteryDashboardSummaryResponse
)

logger = logging.getLogger(__name__)


def calculate_practice_quality(
    practice_completed: bool,
    hints_used: int = 0,
    solution_viewed: bool = False
) -> float:
    """
    Computes quality weight for practice completion (0.0 to 1.0):
    - Solved independently: 1.0 (Strong evidence -> 100% of 30 pts)
    - Solved with hints: 0.70 (Moderate evidence -> 70% of 30 pts)
    - Viewed solution: 0.35 (Weak evidence -> 35% of 30 pts)
    - Not completed: 0.0 (0 pts)
    """
    if not practice_completed:
        return 0.0

    if solution_viewed:
        return 0.35

    if hints_used > 0:
        return 0.70

    return 1.0


def score_to_mastery_level(score: float) -> str:
    """
    Maps 0-100 mastery score to human-readable mastery level.
    """
    if score >= 85.0:
        return "MASTERED"
    elif score >= 70.0:
        return "PROFICIENT"
    elif score >= 50.0:
        return "DEVELOPING"
    elif score >= 25.0:
        return "LEARNING"
    else:
        return "NOT_STARTED"


def calculate_concept_mastery_score(
    assessment_accuracy: float,       # 0.0 to 1.0 (or 0 to 100)
    practice_quality: float,          # 0.0 to 1.0
    consistency_rate: float = 0.5,    # 0.0 to 1.0
    difficulty_score: float = 0.7     # 0.0 to 1.0 (easy=0.5, med=0.75, hard=1.0)
) -> float:
    """
    Applies the user-approved 4-factor mastery formula:
    Mastery = 40% Assessment + 30% Practice + 20% Consistency + 10% Difficulty
    Yields 0.0 to 100.0.
    """
    # Normalize inputs to 0-100 scale
    norm_assess = assessment_accuracy * 100.0 if assessment_accuracy <= 1.0 else assessment_accuracy
    norm_practice = practice_quality * 100.0 if practice_quality <= 1.0 else practice_quality
    norm_consistency = consistency_rate * 100.0 if consistency_rate <= 1.0 else consistency_rate
    norm_diff = difficulty_score * 100.0 if difficulty_score <= 1.0 else difficulty_score

    raw_score = (
        0.40 * norm_assess
        + 0.30 * norm_practice
        + 0.20 * norm_consistency
        + 0.10 * norm_diff
    )

    return round(max(0.0, min(100.0, raw_score)), 1)


def update_concept_masteries_from_assessment(
    db: Session,
    user_id: int,
    content: LearningContent,
    assessment_session: AssessmentSession,
    attempts: List[AssessmentAttempt]
) -> List[UserConceptMastery]:
    """
    Updates or creates UserConceptMastery records for every concept in the milestone
    based on the latest assessment session and historical attempts.
    """
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.learning_content_id == content.id,
        UserLearningProgress.user_id == user_id
    ).first()

    p_completed = progress.practice_completed if progress else False
    p_hints = progress.practice_hints_used if progress else 0
    p_solution = progress.practice_solution_viewed if progress else False
    practice_q = calculate_practice_quality(p_completed, p_hints, p_solution)

    # Ensure concepts exist for this learning content
    concepts = content.concepts
    if not concepts:
        # Auto-create concepts from attempts/sections if empty
        concepts = ensure_learning_concepts_exist(db, content)

    concept_attempts_map: Dict[int, List[AssessmentAttempt]] = {c.id: [] for c in concepts}
    for att in attempts:
        if att.concept_id and att.concept_id in concept_attempts_map:
            concept_attempts_map[att.concept_id].append(att)
        elif att.concept_name:
            for c in concepts:
                if c.name.strip().lower() == att.concept_name.strip().lower():
                    concept_attempts_map[c.id].append(att)
                    break

    updated_records: List[UserConceptMastery] = []

    for concept in concepts:
        mastery = db.query(UserConceptMastery).filter(
            UserConceptMastery.user_id == user_id,
            UserConceptMastery.concept_id == concept.id
        ).first()

        if not mastery:
            mastery = UserConceptMastery(
                user_id=user_id,
                concept_id=concept.id,
                learning_content_id=content.id,
                mastery_score=0.0,
                mastery_level="NOT_STARTED",
                attempts_count=0,
                correct_attempts=0,
                incorrect_attempts=0,
                practice_completed=p_completed,
                practice_hints_used=p_hints,
                solution_viewed=p_solution,
                practice_quality=practice_q,
                confidence_score=0.5,
                improvement_rate=0.0,
                history_json=json.dumps([]),
                created_at=datetime.utcnow()
            )
            db.add(mastery)
            db.flush()

        # Fetch ALL historical attempts for this user & concept across sessions
        all_concept_attempts = db.query(AssessmentAttempt).filter(
            AssessmentAttempt.user_id == user_id,
            AssessmentAttempt.concept_id == concept.id
        ).all()

        total_attempts = len(all_concept_attempts)
        correct_attempts = sum(1 for a in all_concept_attempts if a.is_correct)
        incorrect_attempts = total_attempts - correct_attempts

        # Current session accuracy for this concept
        curr_session_attempts = concept_attempts_map.get(concept.id, [])
        if curr_session_attempts:
            curr_correct = sum(1 for a in curr_session_attempts if a.is_correct)
            session_accuracy = curr_correct / len(curr_session_attempts)
            last_diff = curr_session_attempts[-1].difficulty or "medium"
        else:
            session_accuracy = (correct_attempts / total_attempts) if total_attempts > 0 else 0.0
            last_diff = "medium"

        # Consistency across multiple attempts
        if total_attempts <= 1:
            consistency_rate = session_accuracy * 0.9  # Baseline consistency on first try
        else:
            historical_rate = correct_attempts / total_attempts
            consistency_rate = (session_accuracy * 0.6) + (historical_rate * 0.4)

        # Difficulty factor (easy=0.5, medium=0.75, hard=1.0)
        diff_weights = {"easy": 0.5, "beginner": 0.5, "medium": 0.75, "intermediate": 0.75, "hard": 1.0, "advanced": 1.0}
        diff_score = diff_weights.get(last_diff.strip().lower(), 0.75)

        # Calculate new score
        new_score = calculate_concept_mastery_score(
            assessment_accuracy=session_accuracy,
            practice_quality=practice_q,
            consistency_rate=consistency_rate,
            difficulty_score=diff_score
        )

        new_level = score_to_mastery_level(new_score)

        # Parse and append history snapshot
        history_list = []
        if mastery.history_json:
            try:
                history_list = json.loads(mastery.history_json) if isinstance(mastery.history_json, str) else mastery.history_json
            except Exception:
                history_list = []

        history_list.append({
            "session_id": assessment_session.id,
            "session_type": assessment_session.session_type,
            "score": new_score,
            "level": new_level,
            "accuracy": round(session_accuracy * 100.0, 1),
            "timestamp": datetime.utcnow().isoformat()
        })

        mastery.mastery_score = new_score
        mastery.mastery_level = new_level
        mastery.attempts_count = total_attempts
        mastery.correct_attempts = correct_attempts
        mastery.incorrect_attempts = incorrect_attempts
        mastery.practice_completed = p_completed
        mastery.practice_hints_used = p_hints
        mastery.solution_viewed = p_solution
        mastery.practice_quality = practice_q
        mastery.last_difficulty = last_diff
        mastery.confidence_score = min(1.0, 0.4 + 0.15 * min(4, total_attempts) + (0.2 if p_completed else 0.0))
        mastery.history_json = json.dumps(history_list)
        mastery.last_assessed_at = datetime.utcnow()

        updated_records.append(mastery)

    db.commit()
    for m in updated_records:
        db.refresh(m)

    return updated_records


def ensure_learning_concepts_exist(db: Session, content: LearningContent) -> List[LearningConcept]:
    """
    Ensures that a LearningContent has granular LearningConcept rows.
    If none exist, infers them cleanly from sections or questions.
    """
    if content.concepts and len(content.concepts) > 0:
        return content.concepts

    created_concepts = []

    # 1. Try to extract from lesson sections
    if content.sections:
        for idx, sec in enumerate(content.sections, 1):
            clean_name = sec.title
            if ". " in clean_name:
                clean_name = clean_name.split(". ", 1)[1]
            
            c = LearningConcept(
                learning_content_id=content.id,
                name=clean_name.strip(),
                description=sec.key_takeaway or f"Core concept covered in {sec.title}.",
                order_index=idx,
                difficulty=content.difficulty or "Beginner",
                importance="Essential",
                estimated_minutes=sec.estimated_minutes or 10
            )
            db.add(c)
            created_concepts.append(c)
    else:
        # Fallback default concepts
        default_names = ["Core Fundamentals", "Application & Syntax", "Architecture & Edge Cases"]
        for idx, name in enumerate(default_names, 1):
            c = LearningConcept(
                learning_content_id=content.id,
                name=f"{content.title}: {name}",
                description=f"Key understanding of {name} for {content.title}.",
                order_index=idx,
                difficulty=content.difficulty or "Beginner",
                importance="Essential",
                estimated_minutes=10
            )
            db.add(c)
            created_concepts.append(c)

    db.commit()
    db.refresh(content)
    return content.concepts


def get_milestone_mastery_breakdown(
    db: Session,
    user_id: int,
    content: LearningContent
) -> ConceptMasteryListResponse:
    """
    Retrieves full concept mastery breakdown for a learning content unit,
    grouping concepts into strong, developing, and weak lists.
    """
    concepts = ensure_learning_concepts_exist(db, content)
    masteries = db.query(UserConceptMastery).filter(
        UserConceptMastery.user_id == user_id,
        UserConceptMastery.learning_content_id == content.id
    ).all()

    mastery_map = {m.concept_id: m for m in masteries}

    all_schemas: List[UserConceptMasterySchema] = []
    strong: List[UserConceptMasterySchema] = []
    developing: List[UserConceptMasterySchema] = []
    weak: List[UserConceptMasterySchema] = []

    total_score = 0.0

    for c in concepts:
        m = mastery_map.get(c.id)
        if m:
            s = UserConceptMasterySchema(
                id=m.id,
                concept_id=c.id,
                concept_name=c.name,
                mastery_score=m.mastery_score,
                mastery_level=m.mastery_level,
                attempts_count=m.attempts_count,
                correct_attempts=m.correct_attempts,
                incorrect_attempts=m.incorrect_attempts,
                practice_completed=m.practice_completed,
                practice_quality=m.practice_quality,
                confidence_score=m.confidence_score,
                improvement_rate=m.improvement_rate,
                last_difficulty=m.last_difficulty,
                last_assessed_at=m.last_assessed_at
            )
        else:
            s = UserConceptMasterySchema(
                concept_id=c.id,
                concept_name=c.name,
                mastery_score=0.0,
                mastery_level="NOT_STARTED",
                attempts_count=0,
                correct_attempts=0,
                incorrect_attempts=0,
                practice_completed=False,
                practice_quality=0.0,
                confidence_score=0.5,
                improvement_rate=0.0,
                last_difficulty="medium",
                last_assessed_at=None
            )

        all_schemas.append(s)
        total_score += s.mastery_score

        if s.mastery_score >= 70.0:
            strong.append(s)
        elif s.mastery_score >= 50.0:
            developing.append(s)
        else:
            weak.append(s)

    count = max(1, len(all_schemas))
    overall_pct = round(total_score / count, 1)
    overall_level = score_to_mastery_level(overall_pct)

    return ConceptMasteryListResponse(
        milestone_id=content.milestone_id,
        milestone_title=content.title,
        overall_mastery_percentage=overall_pct,
        mastery_level=overall_level,
        strong_concepts=strong,
        developing_concepts=developing,
        weak_concepts=weak,
        all_concepts=all_schemas
    )


def get_user_mastery_dashboard_summary(
    db: Session,
    user_id: int
) -> MasteryDashboardSummaryResponse:
    """
    Returns aggregated mastery summary across the user's active learning milestone
    for display on the main dashboard.
    """
    # Find most recently accessed or active learning progress
    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.user_id == user_id
    ).order_by(UserLearningProgress.last_accessed_at.desc()).first()

    if not progress:
        return MasteryDashboardSummaryResponse(
            has_active_mastery=False,
            mastery_percentage=0.0,
            mastery_level="NOT_STARTED"
        )

    content = db.query(LearningContent).filter(LearningContent.id == progress.learning_content_id).first()
    if not content:
        return MasteryDashboardSummaryResponse(has_active_mastery=False)

    step = db.query(RoadmapStep).filter(RoadmapStep.id == content.milestone_id).first()
    breakdown = get_milestone_mastery_breakdown(db, user_id, content)

    top_weak = breakdown.weak_concepts[0].concept_name if breakdown.weak_concepts else None
    
    # Action recommendation
    if breakdown.weak_concepts:
        rec = f"Targeted 10-minute remediation recommended for {breakdown.weak_concepts[0].concept_name}."
    elif breakdown.developing_concepts:
        rec = f"Practice challenge recommended for {breakdown.developing_concepts[0].concept_name}."
    elif breakdown.overall_mastery_percentage >= 70.0:
        rec = "Strong mastery demonstrated! Ready to advance to next milestone."
    else:
        rec = "Begin interactive lesson to establish concept mastery."

    return MasteryDashboardSummaryResponse(
        has_active_mastery=True,
        milestone_id=content.milestone_id,
        milestone_title=content.title,
        phase_title=step.phase_title if step else "Core Curriculum",
        mastery_percentage=breakdown.overall_mastery_percentage,
        mastery_level=breakdown.mastery_level,
        strong_count=len(breakdown.strong_concepts),
        developing_count=len(breakdown.developing_concepts),
        weak_count=len(breakdown.weak_concepts),
        top_weak_concept=top_weak,
        action_recommendation=rec
    )
