"""
LearnWise Phase 3: Targeted Remediation Engine Service
Generates targeted 10-minute remediation modules for weak concepts,
provides focused explanations & interactive mini-quizzes, and evaluates reassessments.
"""

from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from datetime import datetime
import json
import os
import logging

from app.config import settings
from app.models.learning import (
    LearningContent,
    LearningConcept,
    UserConceptMastery,
    RemediationUnit,
    AssessmentSession,
    AssessmentAttempt,
    UserLearningProgress
)
from app.schemas.learning import (
    RemediationUnitSchema,
    ReassessmentSubmissionPayload,
    ReassessmentResultResponse
)
from app.services.assessment_engine import grade_answer
from app.services.mastery_engine import (
    calculate_concept_mastery_score,
    score_to_mastery_level,
    calculate_practice_quality
)

logger = logging.getLogger(__name__)


def generate_remediation_unit(
    db: Session,
    user_id: int,
    content_id: int,
    concept_id: int
) -> RemediationUnit:
    """
    Generates a targeted 10-minute remediation unit for a specific weak concept.
    Uses Gemini 1.5 Flash if available, with rich domain-specific fallback synthesis.
    """
    content = db.query(LearningContent).filter(LearningContent.id == content_id).first()
    if not content:
        raise ValueError("Learning content not found.")

    concept = db.query(LearningConcept).filter(
        LearningConcept.id == concept_id,
        LearningConcept.learning_content_id == content_id
    ).first()
    if not concept:
        raise ValueError("Concept not found for this milestone.")

    mastery = db.query(UserConceptMastery).filter(
        UserConceptMastery.user_id == user_id,
        UserConceptMastery.concept_id == concept_id
    ).first()

    baseline_score = mastery.mastery_score if mastery else 0.0

    # Fetch recent failed attempts for this concept to diagnose misunderstanding
    failed_attempts = db.query(AssessmentAttempt).filter(
        AssessmentAttempt.user_id == user_id,
        AssessmentAttempt.concept_id == concept_id,
        AssessmentAttempt.is_correct == False
    ).order_by(AssessmentAttempt.id.desc()).limit(3).all()

    failed_contexts = [
        f"Missed: Question Type {a.question_type}, Selected Answer: {a.selected_answer}"
        for a in failed_attempts
    ]
    diag_context = "; ".join(failed_contexts) if failed_contexts else "Needs fundamental concept reinforcement."

    # Try Gemini generation
    gemini_key = (
        os.getenv("GEMINI_API_KEY")
        or os.getenv("GOOGLE_API_KEY")
        or getattr(settings, "GEMINI_API_KEY", None)
        or getattr(settings, "GOOGLE_API_KEY", None)
    )

    raw_remediation = None
    if gemini_key:
        try:
            import google.generativeai as genai
            genai.configure(api_key=gemini_key)
            model = genai.GenerativeModel("gemini-1.5-flash")

            prompt = f"""
You are an expert pedagogical tutor for LearnWise AI.
Create a targeted 10-MINUTE REMEDIATION MODULE for a student struggling with this specific concept:

CONCEPT: {concept.name}
DESCRIPTION: {concept.description or 'Core concept'}
MILESTONE CONTEXT: {content.title}
CURRENT MASTERY SCORE: {baseline_score}%
STUDENT MISTAKE CONTEXT: {diag_context}

REQUIREMENTS:
1. Diagnosis Summary: 2-3 sentences explaining the exact common misconception in plain language.
2. Targeted Explanation: Clean Markdown refresher with mental models, bullet rules of thumb, and clear contrast.
3. Code / Concrete Example: Short, clean example comparing the right approach vs common mistake.
4. Focused Exercises: 1-2 quick active-recall checks.
5. Mini Quiz: Exactly 2 or 3 targeted reassessment questions (MCQ or Code Output) with options and correct answers.

Return ONLY valid JSON matching this schema:
{{
  "title": "Targeted Refresher: {concept.name}",
  "diagnosis_summary": "Plain language explanation of the core misunderstanding...",
  "targeted_explanation": "Markdown content with ### headings and key rules of thumb...",
  "code_example": "# Clear code example illustrating the correct pattern\\n",
  "focused_exercises": [
    {{
      "instruction": "Identify which operation violates idempotency in this scenario...",
      "solution": "Clear answer and explanation"
    }}
  ],
  "mini_quiz": [
    {{
      "question": "Clear scenario or concept question?",
      "question_type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_answer": "Option B",
      "explanation": "Why Option B is correct."
    }},
    {{
      "question": "Second verification question?",
      "question_type": "mcq",
      "options": ["Choice 1", "Choice 2", "Choice 3"],
      "correct_answer": "Choice 1",
      "explanation": "Why Choice 1 is correct."
    }}
  ]
}}
Do NOT wrap output in backticks. Return only raw JSON.
"""
            response = model.generate_content(prompt)
            clean_text = response.text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text[7:]
            if clean_text.startswith("```"):
                clean_text = clean_text[3:]
            if clean_text.endswith("```"):
                clean_text = clean_text[:-3]

            data = json.loads(clean_text.strip())
            if data and data.get("mini_quiz") and len(data["mini_quiz"]) >= 2:
                raw_remediation = data
        except Exception as e:
            logger.warning(f"Gemini remediation generation failed: {e}. Using deterministic synthesis.")

    if not raw_remediation:
        raw_remediation = _synthesize_deterministic_remediation(concept.name, content.title, baseline_score)

    unit = RemediationUnit(
        user_id=user_id,
        learning_content_id=content_id,
        concept_id=concept_id,
        title=raw_remediation.get("title", f"Targeted Refresher: {concept.name}"),
        concept_name=concept.name,
        diagnosis_summary=raw_remediation.get("diagnosis_summary", f"Targeted review to solidify understanding of {concept.name}."),
        targeted_explanation=raw_remediation.get("targeted_explanation", ""),
        code_example=raw_remediation.get("code_example"),
        focused_exercises=json.dumps(raw_remediation.get("focused_exercises", [])),
        mini_quiz=json.dumps(raw_remediation.get("mini_quiz", [])),
        is_completed=False,
        baseline_mastery=baseline_score,
        created_at=datetime.utcnow()
    )
    db.add(unit)
    db.commit()
    db.refresh(unit)
    return unit


def _synthesize_deterministic_remediation(concept_name: str, milestone_title: str, baseline_score: float) -> Dict[str, Any]:
    """
    Rich deterministic fallback providing specialized remediation modules for core concepts.
    """
    c_lower = concept_name.lower()

    if "idempotency" in c_lower or "http" in c_lower:
        return {
            "title": f"Targeted Refresher: {concept_name}",
            "diagnosis_summary": (
                "A common point of confusion is treating idempotency as 'returning the same response code' "
                "rather than leaving the server's backend resource state identical after multiple identical calls."
            ),
            "targeted_explanation": (
                "### Understanding Idempotency & Safe Methods\n\n"
                "In RESTful architecture, **Idempotency** is defined by server-side state side-effects, not response bodies:\n\n"
                "- **Safe Methods (`GET`, `HEAD`, `OPTIONS`)**: Read-only operations. They do not alter server state.\n"
                "- **Idempotent Methods (`PUT`, `DELETE`, `GET`)**: Making $N$ identical requests produces the exact same server state as making $1$ request.\n"
                "- **Non-Idempotent Methods (`POST`, `PATCH` in some specs)**: Multiple calls create multiple new resources (e.g., duplicate charges or entries).\n\n"
                "> 💡 **Rule of Thumb**: If you press the button 5 times and 5 orders are placed $\\rightarrow$ `POST` (non-idempotent). "
                "If you press 5 times and the user's name is set to 'Alice' $\\rightarrow$ `PUT` (idempotent)."
            ),
            "code_example": (
                "# Idempotent vs Non-Idempotent API Design\n\n"
                "# 1. NON-IDEMPOTENT (POST) -> Adds new record on each invocation\n"
                "@app.post('/orders')\n"
                "def create_order(item: str):\n"
                "    return db.orders.insert({'item': item, 'id': uuid4()})\n\n"
                "# 2. IDEMPOTENT (PUT) -> Sets state at fixed key; 10 calls = same state\n"
                "@app.put('/users/{user_id}/status')\n"
                "def set_status(user_id: int, status: str):\n"
                "    db.users.update(user_id, status=status)\n"
                "    return {'status': status}"
            ),
            "focused_exercises": [
                {
                    "instruction": "Does repeating a DELETE /items/42 call change server state if the item is already gone?",
                    "solution": "No. The item remains deleted. Hence DELETE is idempotent even if the second call returns a 404 status."
                }
            ],
            "mini_quiz": [
                {
                    "question": "Which of the following HTTP methods is guaranteed to be idempotent according to the HTTP/1.1 specification?",
                    "question_type": "mcq",
                    "options": ["POST", "PUT", "CONNECT", "None of the above"],
                    "correct_answer": "PUT",
                    "explanation": "PUT replaces the resource state at a target URI. Executing it multiple times leaves the server in the identical state."
                },
                {
                    "question": "If sending a DELETE request twice returns 200 OK the first time and 404 Not Found the second time, is DELETE still idempotent?",
                    "question_type": "mcq",
                    "options": [
                        "Yes, because the server resource state remains unchanged (the resource remains deleted).",
                        "No, because the HTTP response status code changed from 200 to 404.",
                        "Only if using HTTPS.",
                        "No, DELETE is strictly non-idempotent."
                    ],
                    "correct_answer": "Yes, because the server resource state remains unchanged (the resource remains deleted).",
                    "explanation": "Idempotency pertains to the final side-effect on the server resource state, not the HTTP status code returned."
                }
            ]
        }

    # General / Domain-agnostic fallback
    return {
        "title": f"Targeted Refresher: {concept_name}",
        "diagnosis_summary": (
            f"Reviewing core mechanisms for '{concept_name}' in {milestone_title}. "
            "Mastering this concept requires separating the underlying mechanics from surface syntax."
        ),
        "targeted_explanation": (
            f"### Core Concept Breakdown: {concept_name}\n\n"
            f"To achieve full proficiency in **{concept_name}**, focus on these foundational rules:\n\n"
            "1. **Core Mental Model**: Understand why this pattern exists and the specific problem it solves.\n"
            "2. **Common Anti-Pattern**: Avoid premature assumptions and ensure explicit error/edge-case handling.\n"
            "3. **Production Best Practice**: Apply deterministic checks and verify performance characteristics.\n\n"
            "> 💡 **Key Takeaway**: Always verify invariants before executing state mutations."
        ),
        "code_example": (
            f"# Best Practice Reference for {concept_name}\n"
            "def apply_best_practice(data):\n"
            "    # Validate inputs\n"
            "    if not data:\n"
            "        return None\n"
            "    # Execute deterministic transformation\n"
            "    return { 'processed': True, 'payload': data }\n"
        ),
        "focused_exercises": [
            {
                "instruction": f"State the primary operational advantage of mastering {concept_name}.",
                "solution": "Ensures deterministic execution, robust error handling, and scalable system design."
            }
        ],
        "mini_quiz": [
            {
                "question": f"When implementing {concept_name}, what is the primary consideration for robust design?",
                "question_type": "mcq",
                "options": [
                    "Ensuring explicit validation and predictable side-effect management",
                    "Ignoring error states to improve throughput",
                    "Hardcoding static parameters",
                    "Bypassing runtime type checks"
                ],
                "correct_answer": "Ensuring explicit validation and predictable side-effect management",
                "explanation": "Robust design always emphasizes predictable behavior, invariant validation, and controlled side-effects."
            },
            {
                "question": f"True or False: Mastering {concept_name} directly improves application reliability and maintainability.",
                "question_type": "true_false",
                "options": ["True", "False"],
                "correct_answer": "True",
                "explanation": "Solid conceptual grounding prevents subtle logic bugs and improves architectural scalability."
            }
        ]
    }


def evaluate_reassessment(
    db: Session,
    user_id: int,
    remediation_id: int,
    payload: ReassessmentSubmissionPayload
) -> ReassessmentResultResponse:
    """
    Evaluates mini-quiz answers submitted for a remediation unit,
    updates concept mastery score & history, records assessment session,
    and returns comprehensive feedback.
    """
    unit = db.query(RemediationUnit).filter(
        RemediationUnit.id == remediation_id,
        RemediationUnit.user_id == user_id
    ).first()

    if not unit:
        raise ValueError("Remediation unit not found.")

    quiz_questions = []
    if unit.mini_quiz:
        try:
            quiz_questions = json.loads(unit.mini_quiz) if isinstance(unit.mini_quiz, str) else unit.mini_quiz
        except Exception:
            quiz_questions = []

    if not quiz_questions:
        raise ValueError("No mini-quiz questions found in this remediation unit.")

    evaluations = []
    correct_count = 0

    # Start a dedicated reassessment session
    session = AssessmentSession(
        user_id=user_id,
        learning_content_id=unit.learning_content_id,
        milestone_id=unit.learning_content.milestone_id,
        session_type="reassessment",
        target_concept_id=unit.concept_id,
        total_questions=len(quiz_questions),
        correct_count=0,
        score_percentage=0.0,
        passed=False,
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.flush()

    for idx, q in enumerate(quiz_questions, 1):
        user_ans = (
            payload.answers.get(str(idx))
            or payload.answers.get(str(idx - 1))
            or payload.answers.get(q.get("question", ""))
            or ""
        )

        is_correct = grade_answer(user_ans, q.get("correct_answer", ""), q.get("question_type", "mcq"))
        if is_correct:
            correct_count += 1

        # Record attempt
        attempt = AssessmentAttempt(
            session_id=session.id,
            user_id=user_id,
            question_id=None,
            concept_id=unit.concept_id,
            concept_name=unit.concept_name,
            question_type=q.get("question_type", "mcq"),
            difficulty="medium",
            selected_answer=str(user_ans),
            is_correct=is_correct,
            time_spent_seconds=20
        )
        db.add(attempt)

        evaluations.append({
            "question_index": idx,
            "question": q.get("question", ""),
            "user_answer": user_ans,
            "correct_answer": q.get("correct_answer", ""),
            "is_correct": is_correct,
            "explanation": q.get("explanation", "")
        })

    total_q = len(quiz_questions)
    score_pct = round((correct_count / total_q) * 100.0, 1)
    passed = score_pct >= 60.0

    session.correct_count = correct_count
    session.score_percentage = score_pct
    session.passed = passed
    session.completed_at = datetime.utcnow()

    # Update UserConceptMastery
    mastery = db.query(UserConceptMastery).filter(
        UserConceptMastery.user_id == user_id,
        UserConceptMastery.concept_id == unit.concept_id
    ).first()

    progress = db.query(UserLearningProgress).filter(
        UserLearningProgress.learning_content_id == unit.learning_content_id,
        UserLearningProgress.user_id == user_id
    ).first()

    p_completed = progress.practice_completed if progress else False
    p_hints = progress.practice_hints_used if progress else 0
    p_solution = progress.practice_solution_viewed if progress else False
    practice_q = calculate_practice_quality(p_completed, p_hints, p_solution)

    baseline_mastery = unit.baseline_mastery or (mastery.mastery_score if mastery else 0.0)

    # Calculate post-mastery incorporating the reassessment success
    # If passed (e.g. 100%), mastery increases significantly
    reassess_acc = correct_count / total_q
    
    # Calculate new score: 40% Assess (post reassessment), 30% Practice, 20% Consistency, 10% Diff
    post_score = calculate_concept_mastery_score(
        assessment_accuracy=reassess_acc,
        practice_quality=max(0.7, practice_q),  # Post remediation grants at least solid practice understanding
        consistency_rate=max(0.7, reassess_acc),
        difficulty_score=0.8
    )

    # Ensure post_mastery strictly reflects gain when passed
    if passed and post_score <= baseline_mastery:
        post_score = min(100.0, baseline_mastery + 25.0)

    post_level = score_to_mastery_level(post_score)
    improvement = round(post_score - baseline_mastery, 1)

    if mastery:
        mastery.mastery_score = post_score
        mastery.mastery_level = post_level
        mastery.attempts_count = (mastery.attempts_count or 0) + total_q
        mastery.correct_attempts = (mastery.correct_attempts or 0) + correct_count
        mastery.incorrect_attempts = (mastery.incorrect_attempts or 0) + (total_q - correct_count)
        mastery.improvement_rate = improvement
        mastery.last_assessed_at = datetime.utcnow()

        history_list = []
        if mastery.history_json:
            try:
                history_list = json.loads(mastery.history_json) if isinstance(mastery.history_json, str) else mastery.history_json
            except Exception:
                history_list = []

        history_list.append({
            "session_id": session.id,
            "session_type": "reassessment",
            "score": post_score,
            "level": post_level,
            "reassessment_accuracy": score_pct,
            "improvement": improvement,
            "timestamp": datetime.utcnow().isoformat()
        })
        mastery.history_json = json.dumps(history_list)

    unit.is_completed = True
    unit.reassessment_score = score_pct
    unit.post_mastery = post_score
    unit.completed_at = datetime.utcnow()

    db.commit()
    if mastery:
        db.refresh(mastery)
    db.refresh(unit)

    return ReassessmentResultResponse(
        remediation_id=unit.id,
        concept_id=unit.concept_id,
        concept_name=unit.concept_name,
        total_questions=total_q,
        correct_count=correct_count,
        score_percentage=score_pct,
        passed=passed,
        baseline_mastery=baseline_mastery,
        post_mastery=post_score,
        improvement_points=improvement,
        new_mastery_level=post_level,
        evaluations=evaluations
    )
