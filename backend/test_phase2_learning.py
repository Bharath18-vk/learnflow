import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db, Base, engine
from app.models import User, Goal, Roadmap, Step, LearningContent, UserLearningProgress, UserNote, Bookmark
from app.utils.auth import create_access_token, get_password_hash

client = TestClient(app)

def run_tests():
    print("=== Testing LearnWise Phase 2 Internal Learning Experience ===")
    
    # 1. Setup Test Database & User
    db = next(get_db())
    
    test_email = "test_phase2@learnwise.ai"
    user = db.query(User).filter(User.email == test_email).first()
    if not user:
        user = User(
            email=test_email,
            password_hash=get_password_hash("TestPassword123!"),
            full_name="Phase 2 Learner",
            is_active=True,
            is_verified=True,
            xp_points=100,
            streak_days=3
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 2. Setup Test Goal and Step
    goal = db.query(Goal).filter(Goal.user_id == user.id, Goal.title == "Master React & TypeScript").first()
    if not goal:
        goal = Goal(
            user_id=user.id,
            title="Master React & TypeScript",
            target_outcome="Job-ready Developer",
            current_skill_level="intermediate",
            existing_knowledge="JavaScript, HTML, CSS",
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
            title="Master React & TypeScript",
            description="Comprehensive path to production-grade React & TypeScript applications.",
            total_estimated_hours=35.0,
            estimated_duration_weeks=6
        )
        db.add(roadmap)
        db.commit()
        db.refresh(roadmap)

    step = db.query(Step).filter(Step.roadmap_id == roadmap.id, Step.title.like("%Hooks%")).first()
    if not step:
        step = Step(
            roadmap_id=roadmap.id,
            title="Advanced React Hooks & Custom Hook Architecture",
            description="Deep dive into useEffect, useMemo, useCallback, useRef, and designing reusable custom hooks.",
            phase_number=1,
            phase_title="Phase 1: Advanced State & Component Lifecycle",
            order_index=1,
            estimated_hours=4.0,
            difficulty="intermediate",
            priority="Essential",
            is_completed=False
        )
        db.add(step)
        db.commit()
        db.refresh(step)

    # Create auth token
    token = create_access_token({"sub": str(user.id)})
    headers = {"Authorization": f"Bearer {token}"}

    print(f"✓ User: {user.email} (ID: {user.id})")
    print(f"✓ Step: {step.title} (ID: {step.id})")

    # 3. Test GET /api/learning/milestones/{step_id}
    print("\n--- Test 1: Fetch Milestone Learning (Auto-generation / Retrieval) ---")
    res = client.get(f"/api/learning/milestones/{step.id}", headers=headers)
    assert res.status_code == 200, f"Failed: {res.text}"
    data = res.json()
    assert data["milestone_id"] == step.id
    print(f"Response: has_content={data['has_content']}")

    # If not yet generated, call generate
    if not data["has_content"]:
        print("Triggering Generation...")
        gen_res = client.post(f"/api/learning/milestones/{step.id}/generate", json={"force_regenerate": True}, headers=headers)
        assert gen_res.status_code == 200, f"Generate Failed: {gen_res.text}"
        data = gen_res.json()
    
    content = data["content"]
    assert content is not None
    content_id = content["id"]
    print(f"✓ Learning Content ID: {content_id}")
    print(f"✓ Title: {content['title']}")
    print(f"✓ Learning Objectives ({len(content.get('learning_objectives', []))}): {content.get('learning_objectives', [])[:2]}")
    print(f"✓ Sections Count: {len(content.get('sections', []))}")
    print(f"✓ Practice Activities Count: {len(content.get('practice_activities', []))}")
    print(f"✓ Checkpoint Questions Count: {len(content.get('checkpoint_questions', []))}")
    print(f"✓ Recommended Resources Count: {len(content.get('recommended_resources', []))}")
    
    # Assert curriculum structure completeness
    assert len(content.get("sections", [])) >= 2, "Expected at least 2 sections"
    assert len(content.get("checkpoint_questions", [])) >= 3, "Expected at least 3 checkpoint questions"
    
    # Check that interactive knowledge check and code examples exist
    first_sec = content["sections"][0]
    print(f"  Section 1: {first_sec['title']}")
    print(f"  Section 1 Examples Count: {len(first_sec.get('examples', []))}")
    print(f"  Section 1 Has Interactive Check: {bool(first_sec.get('interactive_check'))}")
    
    # 4. Test Progress Update (Section 1 Completed)
    print("\n--- Test 2: Progress Updates ---")
    prog_res = client.post(
        f"/api/learning/{content_id}/progress",
        json={"current_section_index": 1, "completed_section_index": 1},
        headers=headers
    )
    assert prog_res.status_code == 200, f"Progress update failed: {prog_res.text}"
    prog_data = prog_res.json()
    print(f"✓ Updated Progress: {prog_data['progress_percentage']}% (Completed sections: {prog_data['completed_sections']})")

    # 5. Test Notes CRUD
    print("\n--- Test 3: Notes CRUD ---")
    note_res = client.post(
        f"/api/learning/{content_id}/notes",
        json={"content": "Remember: useCallback only stabilizes function identity when dependencies don't change."},
        headers=headers
    )
    assert note_res.status_code == 200, f"Create note failed: {note_res.text}"
    note_data = note_res.json()
    note_id = note_data["id"]
    print(f"✓ Created Note ID {note_id}: '{note_data['content']}'")

    get_notes_res = client.get(f"/api/learning/{content_id}/notes", headers=headers)
    assert get_notes_res.status_code == 200
    assert len(get_notes_res.json()) >= 1
    print(f"✓ Retrieved {len(get_notes_res.json())} notes")

    # 6. Test Bookmarking
    print("\n--- Test 4: Bookmark Toggle ---")
    bmark_res = client.post(
        f"/api/learning/{content_id}/bookmark",
        json={"title": "Custom Hooks Deep Dive"},
        headers=headers
    )
    assert bmark_res.status_code == 200
    print(f"✓ Bookmark toggled: {bmark_res.json()}")

    # 7. Test Checkpoint Submission & Multi-Factor Completion Rule
    print("\n--- Test 5: Checkpoint Assessment & Multi-Factor Completion Rule ---")
    questions = content["checkpoint_questions"]
    answers = {}
    for q in questions:
        q_id = str(q["id"])
        # Provide correct answer
        answers[q_id] = q["correct_answer"]
        
    chk_res = client.post(
        f"/api/learning/{content_id}/checkpoint",
        json={"answers": answers},
        headers=headers
    )
    assert chk_res.status_code == 200, f"Checkpoint failed: {chk_res.text}"
    chk_data = chk_res.json()
    print(f"✓ Score: {chk_data['score_percentage']}% ({chk_data['correct_count']}/{chk_data['total_questions']})")
    print(f"✓ Passed: {chk_data['passed']}")
    print(f"✓ Lesson sections complete: {chk_data['lesson_sections_complete']}")
    print(f"✓ Practice complete: {chk_data['practice_complete']}")
    print(f"✓ Milestone Completed Flag: {chk_data['milestone_completed']}")
    
    # Notice: If practice or all sections were not completed, milestone_completed should be False!
    total_secs = len(content["sections"])
    if len(prog_data.get("completed_sections", [])) < total_secs or not prog_data.get("practice_completed"):
        assert chk_data["milestone_completed"] is False, "Milestone must NOT complete without sections + practice!"
        print("✓ Verified: Multi-factor constraint prevented premature milestone completion.")

        # Now complete remaining sections & practice
        print("Completing remaining sections and practice...")
        for s_idx in range(1, total_secs + 1):
            client.post(
                f"/api/learning/{content_id}/progress",
                json={"current_section_index": s_idx, "completed_section_index": s_idx},
                headers=headers
            )
        client.post(
            f"/api/learning/{content_id}/progress",
            json={"practice_completed": True},
            headers=headers
        )
        
        # Resubmit checkpoint
        chk_res2 = client.post(
            f"/api/learning/{content_id}/checkpoint",
            json={"answers": answers},
            headers=headers
        )
        chk_data2 = chk_res2.json()
        print(f"✓ Resubmit Checkpoint -> Milestone Completed: {chk_data2['milestone_completed']}")
        assert chk_data2["milestone_completed"] is True, "Milestone should now be completed!"

    # 8. Test Active Session Telemetry
    print("\n--- Test 6: Active Session Telemetry ---")
    session_res = client.get("/api/learning/active-session", headers=headers)
    assert session_res.status_code == 200
    session_data = session_res.json()
    print(f"✓ Active Session Data: {session_data}")
    assert session_data["has_active_session"] is True
    assert session_data["milestone_id"] == step.id

    print("\n=== ALL PHASE 2 INTERNAL LEARNING TESTS PASSED SUCCESSFULLY! ===")

if __name__ == "__main__":
    run_tests()
