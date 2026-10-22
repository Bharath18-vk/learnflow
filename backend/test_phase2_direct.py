import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

from app.database import get_db, Base, engine
from app.models import (
    User, LearningGoal, Roadmap, RoadmapStep,
    LearningContent, LessonSection, LessonExample, PracticeActivity,
    CheckpointQuestion, LearningResource,
    UserLearningProgress, UserNote, Bookmark,
    run_sqlite_learning_migrations
)
from app.utils.security import hash_password, create_access_token
from app.routers.learning import (
    get_milestone_learning,
    generate_milestone_learning,
    get_learning_content_by_id,
    update_learning_progress,
    submit_checkpoint_assessment,
    get_user_notes,
    create_user_note,
    delete_user_note,
    toggle_bookmark,
    get_active_learning_session
)
from app.schemas.learning import (
    ProgressUpdatePayload,
    CheckpointSubmissionPayload,
    UserNoteCreatePayload,
    BookmarkPayload
)

def run_direct_tests():
    print("=== Direct Integration Test: LearnWise Phase 2 Internal Learning ===")
    
    # Run SQLite migration
    run_sqlite_learning_migrations()
    
    db = next(get_db())
    
    # 1. Setup User
    test_email = "test_phase2_direct@learnwise.ai"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            email=test_email,
            hashed_password=hash_password("TestPassword123!"),
            full_name="Phase 2 Direct Tester",
            email_verified=True,
            xp_points=100,
            current_streak=3
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Setup Goal, Roadmap, Step
    goal = db.query(LearningGoal).filter(LearningGoal.user_id == user.id, LearningGoal.title == "Direct Test Goal").first()
    if not goal:
        goal = LearningGoal(
            user_id=user.id,
            title="Direct Test Goal",
            target_outcome="Full Stack Mastery",
            skill_level="intermediate",
            existing_knowledge="Python, SQL",
            daily_minutes=45,
            days_per_week=5,
            desired_depth="in-depth",
            is_active=True
        )
        db.add(goal)
        db.commit()
        db.refresh(goal)
    else:
        goal.is_active = True
        db.commit()

    roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal.id).first()
    if not roadmap:
        roadmap = Roadmap(
            goal_id=goal.id,
            user_id=user.id,
            title="Full Stack Python Mastery",
            description="End-to-end Python, FastAPI, and Database Architecture.",
            total_estimated_hours=30.0,
            estimated_duration_weeks=6
        )
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)

    step = db.query(RoadmapStep).filter(RoadmapStep.roadmap_id == roadmap.id, RoadmapStep.title.like("%FastAPI%")).first()
    if not step:
        step = RoadmapStep(
            roadmap_id=roadmap.id,
            title="FastAPI Dependency Injection and Database Session Management",
            description="Master Yield dependencies, SQLAlchemy session lifecycles, and transaction boundaries in FastAPI.",
            phase_number=1,
            phase_title="Phase 1: Backend Architecture",
            order_index=1,
            estimated_hours=4.0,
            difficulty="intermediate",
            priority="Essential",
            is_completed=False
        )
        db.add(step)
        db.commit()
        db.refresh(step)

    print(f"✓ Step Created: ID {step.id} - '{step.title}'")

    # 3. Test Generate Milestone Learning Content
    print("\n--- Test 1: Generate Milestone Learning Content ---")
    res = generate_milestone_learning(
        step_id=step.id,
        force=True,
        db=db,
        current_user=user
    )
    
    assert res.has_content is True, "Expected has_content to be True"
    content = res.content
    assert content is not None
    print(f"✓ Generated Content ID: {content.id}")
    print(f"✓ Title: {content.title}")
    print(f"✓ Objectives ({len(content.learning_objectives)}): {content.learning_objectives[:2]}")
    print(f"✓ Sections ({len(content.sections)}): {[s.title for s in content.sections]}")
    print(f"✓ Practice Activities: {len(content.practice_activities)}")
    print(f"✓ Checkpoint Questions: {len(content.checkpoint_questions)}")
    print(f"✓ Recommended Resources: {len(content.recommended_resources)}")

    # 4. Verify Content Retrieval
    print("\n--- Test 2: Retrieve Content by Milestone ID & Content ID ---")
    fetch_res = get_milestone_learning(step_id=step.id, db=db, current_user=user)
    assert fetch_res.has_content is True
    assert fetch_res.content.id == content.id

    content_res = get_learning_content_by_id(content_id=content.id, db=db, current_user=user)
    assert content_res.id == content.id
    print("✓ Content retrieval verified.")

    # 5. Test Progress Updates
    print("\n--- Test 3: Progress Updates ---")
    prog_update = ProgressUpdatePayload(
        current_section_index=1,
        completed_section_index=1
    )
    prog = update_learning_progress(
        content_id=content.id,
        payload=prog_update,
        db=db,
        current_user=user
    )
    print(f"✓ Progress Percentage: {prog.progress_percentage}%")
    print(f"✓ Completed Sections: {prog.completed_sections}")
    assert 1 in prog.completed_sections

    # 6. Test Notes CRUD
    print("\n--- Test 4: Notes Management ---")
    note_create = UserNoteCreatePayload(content="Yield dependencies handle cleanup automatically after response is sent.")
    created_note = create_user_note(
        content_id=content.id,
        payload=note_create,
        db=db,
        current_user=user
    )
    print(f"✓ Created Note ID: {created_note.id} -> '{created_note.content}'")

    notes_list = get_user_notes(content_id=content.id, db=db, current_user=user)
    assert len(notes_list) >= 1
    print(f"✓ Total Notes for Lesson: {len(notes_list)}")

    # 7. Test Bookmarking
    print("\n--- Test 5: Bookmark Toggle ---")
    bmark_create = BookmarkPayload(title="FastAPI DI Reference")
    bmark = toggle_bookmark(
        content_id=content.id,
        payload=bmark_create,
        db=db,
        current_user=user
    )
    print(f"✓ Bookmark active (ID={bmark.id})")

    # 8. Test Checkpoint Assessment with Multi-Factor Completion Rule
    print("\n--- Test 6: Checkpoint Assessment & Multi-Factor Completion Rule ---")
    answers = {}
    for q in content.checkpoint_questions:
        answers[str(q.id)] = q.correct_answer

    chk_submission = CheckpointSubmissionPayload(answers=answers)
    eval_result = submit_checkpoint_assessment(
        content_id=content.id,
        payload=chk_submission,
        db=db,
        current_user=user
    )
    
    print(f"✓ Quiz Score: {eval_result.score_percentage}% ({eval_result.correct_count}/{eval_result.total_questions})")
    print(f"✓ Passed Threshold: {eval_result.passed}")
    print(f"✓ Lesson Sections Complete: {eval_result.lesson_sections_complete}")
    print(f"✓ Practice Complete: {eval_result.practice_complete}")
    print(f"✓ Milestone Completed Flag: {eval_result.milestone_completed}")

    # Because sections 2..N and practice were not completed yet, milestone_completed must be False!
    total_sections = len(content.sections)
    if len(prog.completed_sections) < total_sections or not prog.practice_completed:
        assert eval_result.milestone_completed is False, "Milestone must NOT be marked complete without sections + practice!"
        print("✓ Verified: Passing 100% on quiz did NOT complete milestone without prerequisite sections + practice.")

        # Now complete all sections and practice
        print("\nCompleting all sections and practice challenge...")
        for s_idx in range(1, total_sections + 1):
            update_learning_progress(
                content_id=content.id,
                payload=ProgressUpdatePayload(current_section_index=s_idx, completed_section_index=s_idx),
                db=db,
                current_user=user
            )
        
        update_learning_progress(
            content_id=content.id,
            payload=ProgressUpdatePayload(practice_completed=True),
            db=db,
            current_user=user
        )

        # Resubmit quiz
        eval_result2 = submit_checkpoint_assessment(
            content_id=content.id,
            payload=chk_submission,
            db=db,
            current_user=user
        )
        print(f"✓ Resubmission Result -> Milestone Completed: {eval_result2.milestone_completed}")
        assert eval_result2.milestone_completed is True, "Milestone should be complete now that all 3 criteria are satisfied!"
        
        # Verify step in DB is marked complete
        refreshed_step = db.query(RoadmapStep).filter(RoadmapStep.id == step.id).first()
        assert refreshed_step.is_completed is True, "Step in database must be marked is_completed=True!"
        print("✓ Step in database verified as completed.")

    # 9. Test Active Session Telemetry
    print("\n--- Test 7: Active Learning Session Telemetry ---")
    active_session_data = get_active_learning_session(db=db, current_user=user)
    print(f"✓ Active Session Response: {active_session_data}")
    assert active_session_data.has_active_session is True
    assert active_session_data.milestone_id == step.id

    print("\n==============================================================")
    print("ALL PHASE 2 INTERNAL LEARNING ARCHITECTURE TESTS PASSED 100%!")
    print("==============================================================")

if __name__ == "__main__":
    run_direct_tests()
