"""
LearnWise Phase 3: Assessment Engine Service
Manages assessment sessions, attempt recording, server-side grading,
difficulty weighting, anti-leakage sanitization, and diagnostic evaluations.
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import json
import logging

from app.models.learning import (
    LearningContent,
    CheckpointQuestion,
    AssessmentSession,
    AssessmentAttempt,
    LearningConcept,
    UserConceptMastery
)
from app.schemas.learning import (
    AssessmentQuestionPublicSchema,
    CheckpointSubmissionPayload,
    CheckpointEvaluationResult
)

logger = logging.getLogger(__name__)

# Difficulty weighting mapping
DIFFICULTY_WEIGHTS = {
    "easy": 1.0,
    "beginner": 1.0,
    "medium": 1.5,
    "intermediate": 1.5,
    "hard": 2.0,
    "advanced": 2.0
}


def get_public_assessment_questions(content: LearningContent) -> List[AssessmentQuestionPublicSchema]:
    """
    Returns sanitized checkpoint questions without answers or explanations
    to ensure zero answer leakage before user submission.
    """
    public_questions = []
    for q in content.checkpoint_questions:
        options_list = []
        if q.options:
            try:
                options_list = json.loads(q.options) if isinstance(q.options, str) else q.options
            except Exception:
                options_list = []

        public_questions.append(AssessmentQuestionPublicSchema(
            id=q.id,
            concept_name=q.concept_name,
            question=q.question,
            question_type=q.question_type or "mcq",
            options=options_list,
            difficulty=q.difficulty or "medium",
            order_index=q.order_index
        ))
    return public_questions


def start_assessment_session(
    db: Session,
    user_id: int,
    content_id: int,
    session_type: str = "checkpoint",
    target_concept_id: Optional[int] = None
) -> AssessmentSession:
    """
    Initializes a new assessment session and increments attempt count.
    """
    content = db.query(LearningContent).filter(LearningContent.id == content_id).first()
    if not content:
        raise ValueError("Learning content not found.")

    prev_count = db.query(AssessmentSession).filter(
        AssessmentSession.user_id == user_id,
        AssessmentSession.learning_content_id == content_id,
        AssessmentSession.session_type == session_type
    ).count()

    session = AssessmentSession(
        user_id=user_id,
        learning_content_id=content_id,
        milestone_id=content.milestone_id,
        attempt_number=prev_count + 1,
        session_type=session_type,
        target_concept_id=target_concept_id,
        total_questions=len(content.checkpoint_questions),
        correct_count=0,
        score_percentage=0.0,
        passed=False,
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def grade_answer(user_ans: Any, correct_ans: str, question_type: str = "mcq") -> bool:
    """
    Robust server-side grading for various question types.
    """
    if user_ans is None:
        return False

    norm_correct = str(correct_ans).strip().lower()

    if question_type in ["mcq", "true_false", "scenario"]:
        norm_user = str(user_ans).strip().lower()
        if norm_user == norm_correct:
            return True
        if (len(norm_user) > 2 and len(norm_correct) > 2) and (norm_correct in norm_user or norm_user in norm_correct):
            return True
        return False

    elif question_type == "multi_select":
        if isinstance(user_ans, list):
            user_items = set([str(x).strip().lower() for x in user_ans])
        else:
            user_items = set([x.strip().lower() for x in str(user_ans).split(",") if x.strip()])
        
        if isinstance(correct_ans, list):
            correct_items = set([str(x).strip().lower() for x in correct_ans])
        else:
            try:
                parsed = json.loads(correct_ans)
                if isinstance(parsed, list):
                    correct_items = set([str(x).strip().lower() for x in parsed])
                else:
                    correct_items = set([x.strip().lower() for x in str(correct_ans).split(",") if x.strip()])
            except Exception:
                correct_items = set([x.strip().lower() for x in str(correct_ans).split(",") if x.strip()])

        return user_items == correct_items

    elif question_type in ["code_output", "short_answer"]:
        norm_user = " ".join(str(user_ans).strip().lower().split())
        norm_correct = " ".join(norm_correct.split())
        return norm_user == norm_correct

    return str(user_ans).strip().lower() == norm_correct


def evaluate_checkpoint_submission(
    db: Session,
    content: LearningContent,
    user_id: int,
    payload: CheckpointSubmissionPayload,
    session: Optional[AssessmentSession] = None
) -> Tuple[AssessmentSession, List[AssessmentAttempt], List[CheckpointEvaluationResult], Dict[str, Any]]:
    """
    Evaluates checkpoint submission against questions, persists assessment session and attempts,
    calculates difficulty-weighted accuracy and per-concept performance.
    """
    questions = content.checkpoint_questions
    if not questions:
        raise ValueError("No checkpoint questions found for this content.")

    if not session:
        session = start_assessment_session(db, user_id=user_id, content_id=content.id)

    evaluations: List[CheckpointEvaluationResult] = []
    attempts: List[AssessmentAttempt] = []
    correct_count = 0
    weighted_score = 0.0
    total_weight = 0.0

    total_time = payload.time_spent_seconds or 0
    time_per_q = int(total_time / max(1, len(questions))) if total_time > 0 else 30

    concept_lookup = {c.name.strip().lower(): c for c in content.concepts}

    for idx, q in enumerate(questions, 1):
        user_ans = (
            payload.answers.get(str(q.id))
            or payload.answers.get(str(q.order_index))
            or payload.answers.get(str(idx))
            or payload.answers.get(str(idx - 1))
            or ""
        )

        is_correct = grade_answer(user_ans, q.correct_answer, q.question_type)
        if is_correct:
            correct_count += 1

        diff_key = (q.difficulty or "medium").strip().lower()
        w = DIFFICULTY_WEIGHTS.get(diff_key, 1.5)
        total_weight += w
        if is_correct:
            weighted_score += w

        matched_concept = None
        if q.concept_id:
            matched_concept = db.query(LearningConcept).filter(LearningConcept.id == q.concept_id).first()
        elif q.concept_name and q.concept_name.strip().lower() in concept_lookup:
            matched_concept = concept_lookup[q.concept_name.strip().lower()]
        
        if not matched_concept and content.concepts:
            c_idx = (idx - 1) % len(content.concepts)
            matched_concept = content.concepts[c_idx]

        concept_id_val = matched_concept.id if matched_concept else None
        concept_name_val = matched_concept.name if matched_concept else (q.concept_name or "Core Principles")

        attempt = AssessmentAttempt(
            session_id=session.id,
            user_id=user_id,
            question_id=q.id,
            concept_id=concept_id_val,
            concept_name=concept_name_val,
            question_type=q.question_type or "mcq",
            difficulty=q.difficulty or "medium",
            selected_answer=json.dumps(user_ans) if isinstance(user_ans, (list, dict)) else str(user_ans),
            is_correct=is_correct,
            time_spent_seconds=time_per_q
        )
        db.add(attempt)
        attempts.append(attempt)

        evaluations.append(CheckpointEvaluationResult(
            question_id=q.id,
            question=q.question,
            concept_name=concept_name_val,
            difficulty=q.difficulty or "medium",
            user_answer=user_ans,
            correct_answer=q.correct_answer,
            is_correct=is_correct,
            explanation=q.explanation
        ))

    total_q = len(questions)
    score_percentage = round((correct_count / total_q) * 100.0, 1)
    passed = score_percentage >= 60.0

    concept_breakdown: Dict[str, Dict[str, Any]] = {}
    for att in attempts:
        c_name = att.concept_name or "General"
        if c_name not in concept_breakdown:
            concept_breakdown[c_name] = {
                "concept_id": att.concept_id,
                "concept_name": c_name,
                "correct": 0,
                "total": 0,
                "difficulties": []
            }
        concept_breakdown[c_name]["total"] += 1
        concept_breakdown[c_name]["difficulties"].append(att.difficulty)
        if att.is_correct:
            concept_breakdown[c_name]["correct"] += 1

    session.total_questions = total_q
    session.correct_count = correct_count
    session.score_percentage = score_percentage
    session.passed = passed
    session.completed_at = datetime.utcnow()
    
    summary_meta = {
        "weighted_score": round((weighted_score / max(0.1, total_weight)) * 100.0, 1),
        "concept_breakdown": concept_breakdown
    }
    session.mastery_summary = json.dumps(summary_meta)

    db.commit()
    db.refresh(session)

    return session, attempts, evaluations, summary_meta
