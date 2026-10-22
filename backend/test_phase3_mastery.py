"""
LearnWise Phase 3: Automated Verification Test Suite
Tests concept mastery heuristics, quality-weighted practice scoring, anti-leakage questions,
server-side assessment grading, targeted 10-minute remediation, reassessments, and milestone separation.
"""

import sys
import os
import json
from datetime import datetime

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')


from app.database import SessionLocal, engine, Base
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
    PracticeActivity,
    CheckpointQuestion,
    UserLearningProgress,
    run_sqlite_learning_migrations
)
from app.schemas.learning import (
    ProgressUpdatePayload,
    CheckpointSubmissionPayload,
    ReassessmentSubmissionPayload
)
from app.services.assessment_engine import grade_answer
from app.services.mastery_engine import (
    calculate_practice_quality,
    calculate_concept_mastery_score,
    score_to_mastery_level
)
from app.routers.learning import (
    generate_milestone_learning,
    get_sanitized_assessment_questions,
    update_learning_progress,
    submit_checkpoint_assessment,
    get_learning_concept_mastery,
    create_concept_remediation,
    submit_remediation_reassessment,
    get_dashboard_mastery_summary
)


def setup_test_environment():
    """Ensures migrations have run and sets up a clean test user & goal."""
    run_sqlite_learning_migrations()
    db = SessionLocal()

    # Clean previous test user data
    test_user = db.query(User).filter(User.email == "mastery_tester@learnwise.ai").first()
    if test_user:
        db.delete(test_user)
        db.commit()

    user = User(
        email="mastery_tester@learnwise.ai",
        hashed_password="hashed_pw_test",
        full_name="Mastery Tester",
        is_verified=True,
        email_verified=True
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    goal = LearningGoal(
        user_id=user.id,
        title="Full-Stack REST APIs & Backend Engineering",
        target_outcome="Job-ready",
        skill_level="Intermediate",
        existing_knowledge="Python basics",
        daily_minutes=45,
        days_per_week=5,
        desired_depth="Deep Fundamental",
        learning_preferences=json.dumps(["Hands-on Code", "Visual Diagrams"])
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)

    roadmap = Roadmap(
        goal_id=goal.id,
        user_id=user.id,
        title="REST APIs Mastery Path",
        total_estimated_hours=40.0,
        estimated_duration_weeks=6
    )

    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

    step = RoadmapStep(
        roadmap_id=roadmap.id,
        phase_number=1,
        phase_title="API Foundations & HTTP Protocols",
        title="REST Architecture, HTTP Methods & Idempotency",
        description="Master status codes, safe vs idempotent methods, and stateless design.",
        estimated_hours=5.0,
        difficulty="Intermediate",
        priority="Essential",
        order_index=1,
        is_completed=False
    )
    db.add(step)
    db.commit()
    db.refresh(step)

    u_id = user.id
    s_id = step.id
    db.close()
    return u_id, s_id



def run_all_tests():
    print("=================================================================")
    print("🚀 STARTING LEARNWISE PHASE 3 AUTOMATED VERIFICATION TEST SUITE")
    print("=================================================================\n")

    user_id, step_id = setup_test_environment()
    db = SessionLocal()
    user = db.query(User).filter(User.id == user_id).first()

    passed_count = 0
    total_tests = 12

    # --- TEST 1: SQLite Schema & Migrations Integrity ---
    try:
        print("▶ TEST 1: Verifying SQLite schema & table creation...")
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        assert "learning_concepts" in tables, "learning_concepts table missing"
        assert "user_concept_masteries" in tables, "user_concept_masteries table missing"
        assert "assessment_sessions" in tables, "assessment_sessions table missing"
        assert "assessment_attempts" in tables, "assessment_attempts table missing"
        assert "remediation_units" in tables, "remediation_units table missing"
        print("  ✅ All Phase 3 tables exist in SQLite.")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 1 FAILED: {e}")

    # --- TEST 2: Practice Quality Evidence-Weighted Scoring ---
    try:
        print("\n▶ TEST 2: Verifying practice quality calculation...")
        q_independent = calculate_practice_quality(practice_completed=True, hints_used=0, solution_viewed=False)
        assert q_independent == 1.0, f"Expected 1.0 for independent, got {q_independent}"

        q_hints = calculate_practice_quality(practice_completed=True, hints_used=2, solution_viewed=False)
        assert q_hints == 0.70, f"Expected 0.70 for hints used, got {q_hints}"

        q_solution = calculate_practice_quality(practice_completed=True, hints_used=1, solution_viewed=True)
        assert q_solution == 0.35, f"Expected 0.35 for solution viewed, got {q_solution}"

        q_not_done = calculate_practice_quality(practice_completed=False, hints_used=0, solution_viewed=False)
        assert q_not_done == 0.0, f"Expected 0.0 for not done, got {q_not_done}"

        print("  ✅ Practice quality: Independent (100%), Hints (70%), Solution (35%), Not done (0%).")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 2 FAILED: {e}")

    # --- TEST 3: 4-Factor Concept Mastery Heuristic Formula ---
    try:
        print("\n▶ TEST 3: Verifying 4-factor concept mastery formula...")
        # 40% Assess (100) + 30% Practice (1.0 * 100) + 20% Consistency (100) + 10% Diff (100) = 100.0
        score_max = calculate_concept_mastery_score(1.0, 1.0, 1.0, 1.0)
        assert score_max == 100.0, f"Expected 100.0, got {score_max}"
        assert score_to_mastery_level(score_max) == "MASTERED"

        # 40% Assess (50) + 30% Practice (0.7 * 100) + 20% Consistency (50) + 10% Diff (75) = 20 + 21 + 10 + 7.5 = 58.5
        score_mid = calculate_concept_mastery_score(0.5, 0.7, 0.5, 0.75)
        assert 55.0 <= score_mid <= 62.0, f"Expected ~58.5, got {score_mid}"
        assert score_to_mastery_level(score_mid) == "DEVELOPING"

        # Weak score: 40% Assess (0) + 30% Practice (0) + 20% Consistency (0) + 10% Diff (50) = 5.0
        score_low = calculate_concept_mastery_score(0.0, 0.0, 0.0, 0.5)
        assert score_to_mastery_level(score_low) == "NOT_STARTED"

        print("  ✅ Mastery formula correctly computes weighted score and maps levels.")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 3 FAILED: {e}")

    # --- TEST 4: Grading Robustness (MCQ, Multi-select, True/False, Code-output) ---
    try:
        print("\n▶ TEST 4: Verifying multi-type answer grading...")
        assert grade_answer("PUT", "PUT", "mcq") is True
        assert grade_answer("put", "PUT", "mcq") is True
        assert grade_answer("POST", "PUT", "mcq") is False

        assert grade_answer(["GET", "DELETE"], ["DELETE", "GET"], "multi_select") is True
        assert grade_answer(["GET"], ["GET", "POST"], "multi_select") is False

        assert grade_answer("True", "true", "true_false") is True
        assert grade_answer("False", "True", "true_false") is False

        assert grade_answer(" [200, 201] ", "[200, 201]", "code_output") is True
        print("  ✅ Robust server-side grading passes all question formats.")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 4 FAILED: {e}")

    # --- TEST 5: Milestone Learning Generation with Concept Mapping ---
    content_id = None
    try:
        print("\n▶ TEST 5: Generating milestone learning with concept extraction...")
        resp = generate_milestone_learning(step_id=step_id, force=True, db=db, current_user=user)
        assert resp.has_content is True
        content_id = resp.content.id

        # Verify concepts were saved
        concepts = db.query(LearningConcept).filter(LearningConcept.learning_content_id == content_id).all()
        assert len(concepts) >= 2, f"Expected >= 2 concepts, got {len(concepts)}"
        print(f"  ✅ Milestone content generated with {len(concepts)} granular concepts:")
        for c in concepts:
            print(f"     • {c.name} ({c.difficulty}, {c.importance})")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 5 FAILED: {e}")

    # --- TEST 6: Anti-Leakage Public Question Retrieval ---
    try:
        print("\n▶ TEST 6: Verifying anti-leakage question endpoint...")
        q_list = get_sanitized_assessment_questions(content_id=content_id, db=db, current_user=user)
        assert len(q_list) >= 3, f"Expected >= 3 questions, got {len(q_list)}"

        for q in q_list:
            assert not hasattr(q, "correct_answer") or getattr(q, "correct_answer") is None, "LEAKAGE: correct_answer exposed!"
            assert not hasattr(q, "explanation") or getattr(q, "explanation") is None, "LEAKAGE: explanation exposed!"
            assert q.question and len(q.options) > 0

        print("  ✅ Public questions sanitized (zero answers or explanations leaked).")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 6 FAILED: {e}")

    # --- TEST 7: Progress Updates & Practice Quality Recording ---
    try:
        print("\n▶ TEST 7: Updating progress and practice activity with hints...")
        # Mark section 1 complete
        resp1 = update_learning_progress(
            content_id=content_id,
            payload=ProgressUpdatePayload(completed_section_index=1, current_section_index=1),
            db=db,
            current_user=user
        )

        # Mark practice completed with 1 hint
        resp2 = update_learning_progress(
            content_id=content_id,
            payload=ProgressUpdatePayload(
                practice_completed=True,
                practice_hints_used=1,
                practice_solution_viewed=False
            ),
            db=db,
            current_user=user
        )
        assert resp2.practice_completed is True
        assert resp2.practice_hints_used == 1
        print("  ✅ Progress and practice hints tracked correctly.")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 7 FAILED: {e}")

    # --- TEST 8: Checkpoint Submission, Mastery Calculation & Weakness Detection ---
    try:
        print("\n▶ TEST 8: Submitting checkpoint with intentional weakness...")
        questions = db.query(CheckpointQuestion).filter(CheckpointQuestion.learning_content_id == content_id).all()
        
        # We answer the first question correctly, and subsequent questions incorrectly to trigger weak concept
        answers = {}
        for idx, q in enumerate(questions):
            if idx == 0:
                answers[str(q.id)] = q.correct_answer
            else:
                answers[str(q.id)] = "WRONG_ANSWER"

        chk_data = submit_checkpoint_assessment(
            content_id=content_id,
            payload=CheckpointSubmissionPayload(answers=answers, time_spent_seconds=120),
            db=db,
            current_user=user
        )

        assert chk_data.correct_count == 1
        assert chk_data.passed is False  # 1/5 is < 60%
        assert len(chk_data.weaknesses) > 0, "Expected weaknesses detected"
        assert chk_data.milestone_completed is False, "Milestone should NOT complete on failing checkpoint"

        print(f"  ✅ Checkpoint evaluated: score={chk_data.score_percentage}%, weaknesses={chk_data.weaknesses}")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 8 FAILED: {e}")

    # --- TEST 9: Concept Mastery API Breakdown Verification ---
    weak_concept_id = None
    baseline_score = 0.0
    try:
        print("\n▶ TEST 9: Verifying GET /learning/{content_id}/mastery...")
        m_data = get_learning_concept_mastery(content_id=content_id, db=db, current_user=user)

        assert hasattr(m_data, "overall_mastery_percentage")
        assert len(m_data.all_concepts) >= 2
        assert len(m_data.weak_concepts) > 0

        target_weak_concept = m_data.weak_concepts[0]
        weak_concept_id = target_weak_concept.concept_id
        baseline_score = target_weak_concept.mastery_score

        print(f"  ✅ Concept Mastery breakdown retrieved: Overall={m_data.overall_mastery_percentage}%, Top Weak Concept='{target_weak_concept.concept_name}' (Score: {baseline_score}%)")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 9 FAILED: {e}")

    # --- TEST 10: Targeted 10-Minute Remediation Generation ---
    remediation_id = None
    try:
        print("\n▶ TEST 10: Generating targeted 10-minute remediation unit for weak concept...")
        rem_data = create_concept_remediation(
            content_id=content_id,
            concept_id=weak_concept_id,
            db=db,
            current_user=user
        )

        assert rem_data.concept_id == weak_concept_id
        assert len(rem_data.diagnosis_summary) > 10
        assert len(rem_data.targeted_explanation) > 20
        assert len(rem_data.mini_quiz) >= 2
        remediation_id = rem_data.id

        print(f"  ✅ Remediation unit generated: '{rem_data.title}' with {len(rem_data.mini_quiz)} mini-quiz questions.")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 10 FAILED: {e}")

    # --- TEST 11: Reassessment Submission & Mastery Improvement ---
    try:
        print("\n▶ TEST 11: Submitting reassessment with 100% accuracy to verify mastery gain...")
        rem_unit = db.query(RemediationUnit).filter(RemediationUnit.id == remediation_id).first()
        quiz_list = json.loads(rem_unit.mini_quiz)

        # Answer all mini-quiz questions correctly
        reassess_answers = {}
        for idx, q in enumerate(quiz_list, 1):
            reassess_answers[str(idx)] = q["correct_answer"]

        re_data = submit_remediation_reassessment(
            content_id=content_id,
            remediation_id=remediation_id,
            payload=ReassessmentSubmissionPayload(answers=reassess_answers),
            db=db,
            current_user=user
        )

        assert re_data.passed is True
        assert re_data.score_percentage == 100.0
        assert re_data.post_mastery > baseline_score, f"Expected post_mastery ({re_data.post_mastery}) > baseline ({baseline_score})"
        assert re_data.improvement_points > 0

        print(f"  ✅ Reassessment passed! Baseline: {re_data.baseline_mastery}% ➔ Post-Mastery: {re_data.post_mastery}% (+{re_data.improvement_points} pts, Level: {re_data.new_mastery_level})")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 11 FAILED: {e}")

    # --- TEST 12: Dashboard Mastery Summary & Multi-Criteria Completion ---
    try:
        print("\n▶ TEST 12: Verifying dashboard mastery summary and strict milestone completion...")
        dash_data = get_dashboard_mastery_summary(db=db, current_user=user)

        assert dash_data.has_active_mastery is True
        assert dash_data.milestone_id == step_id
        assert dash_data.mastery_percentage > 0
        assert dash_data.action_recommendation is not None

        # Verify milestone step in DB is not completed until ALL criteria are met
        step_db = db.query(RoadmapStep).filter(RoadmapStep.id == step_id).first()
        assert step_db.is_completed is False, "Milestone step should remain in_progress until passing all sections + checkpoint"

        print(f"  ✅ Dashboard summary active: {dash_data.milestone_title} ({dash_data.mastery_percentage}%, Level: {dash_data.mastery_level})")
        print(f"     Recommendation: {dash_data.action_recommendation}")
        passed_count += 1
    except Exception as e:
        print(f"  ❌ TEST 12 FAILED: {e}")

    db.close()

    print("\n=================================================================")
    print(f"🏁 PHASE 3 VERIFICATION COMPLETE: {passed_count}/{total_tests} TESTS PASSED")
    print("=================================================================")

    if passed_count == total_tests:
        return 0
    else:
        return 1


if __name__ == "__main__":
    sys.exit(run_all_tests())
