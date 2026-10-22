import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

from app.database import get_db, Base, engine
from app.models import User, LearningGoal, Roadmap, RoadmapStep
from app.utils.security import hash_password, verify_password
from app.routers.roadmap import get_step_quiz_endpoint, submit_step_quiz_endpoint
from fastapi import HTTPException

print("==================================================")
print("🛡️ RUNNING LEARNWISE P1 SECURITY VERIFICATION TEST")
print("==================================================")

db = next(get_db())

# --- Test 1: Verify Password Plaintext Fallback is Eliminated ---
print("\n--> Test 1: Testing verify_password behavior...")
plain_pw = "SecureP@ssw0rd123!"
hashed = hash_password(plain_pw)

assert verify_password(plain_pw, hashed) is True, "FAIL: Valid password was not verified."
assert verify_password("WrongPassword!", hashed) is False, "FAIL: Incorrect password was verified."

# Ensure plaintext fallback is blocked
assert verify_password("plaintext123", "plaintext123") is False, (
    "FAIL: Plaintext password fallback still exists! Should return False."
)
assert verify_password("", "") is False, "FAIL: Empty plaintext fallback should return False."
print("  ✅ PASS: Password verification works correctly and plaintext fallback is completely removed!")

# --- Test 2: Quiz Question Sanitization & Session Token ---
print("\n--> Test 2: Testing step quiz anti-leakage sanitization...")
# Get or create test user
user = db.query(User).filter(User.email == "security_p1_tester@example.com").first()
if not user:
    user = User(
        full_name="P1 Tester",
        email="security_p1_tester@example.com",
        hashed_password=hashed,
        is_verified=True,
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

# Get or create a roadmap step for this user
goal = db.query(LearningGoal).filter(LearningGoal.user_id == user.id).first()
if not goal:
    goal = LearningGoal(user_id=user.id, title="Test Security Goal", is_active=True)
    db.add(goal)
    db.commit()
    db.refresh(goal)

roadmap = db.query(Roadmap).filter(Roadmap.goal_id == goal.id).first()
if not roadmap:
    roadmap = Roadmap(goal_id=goal.id, user_id=user.id, title="Test Security Roadmap")
    db.add(roadmap)
    db.commit()
    db.refresh(roadmap)

step = db.query(RoadmapStep).filter(RoadmapStep.roadmap_id == roadmap.id).first()
if not step:
    step = RoadmapStep(
        roadmap_id=roadmap.id,
        title="Test Security Architecture & Cryptography",
        is_completed=False
    )
    db.add(step)
    db.commit()
    db.refresh(step)

quiz_res = get_step_quiz_endpoint(step_id=step.id, db=db, current_user=user)

assert "quiz_session_token" in quiz_res, "FAIL: Missing quiz_session_token in quiz response."
assert len(quiz_res["questions"]) > 0, "FAIL: No questions generated."

for q in quiz_res["questions"]:
    assert "correct_index" not in q, f"FAIL: Answer leaked in question payload: {q}"
    assert "explanation" not in q, f"FAIL: Explanation leaked in question payload: {q}"
    assert "options" in q and len(q["options"]) > 0, "FAIL: Question missing options."

print("  ✅ PASS: Step quiz questions are 100% sanitized! Zero answer leakage detected.")

# --- Test 3: Server-Side Quiz Grading ---
print("\n--> Test 3: Testing server-side quiz grading with answers...")
token = quiz_res["quiz_session_token"]

# Submitting intentionally incorrect answers
wrong_submission = {
    "quiz_session_token": token,
    "answers": {0: 99, 1: 99, 2: 99}
}
res_wrong = submit_step_quiz_endpoint(step_id=step.id, payload=wrong_submission, db=db, current_user=user)

assert res_wrong["passed"] is False, "FAIL: Quiz should not have passed with incorrect answers."
assert res_wrong["score"] == 0, f"FAIL: Expected score 0, got {res_wrong['score']}"
assert len(res_wrong["evaluations"]) > 0, "FAIL: Missing post-grading evaluations."
print("  ✅ PASS: Incorrect answers correctly graded as 0 score on the server.")

# Submitting valid answers using the server evaluations
correct_answers = {e["question_index"]: e["correct_index"] for e in res_wrong["evaluations"]}
correct_submission = {
    "quiz_session_token": token,
    "answers": correct_answers
}
res_correct = submit_step_quiz_endpoint(step_id=step.id, payload=correct_submission, db=db, current_user=user)

assert res_correct["passed"] is True, "FAIL: Quiz should have passed with correct answers."
assert res_correct["score"] == res_correct["total"], "FAIL: Expected perfect score."
db.refresh(step)
assert step.is_completed is True, "FAIL: Step was not marked completed in DB."
print("  ✅ PASS: Server-side grading passed with perfect score and completed step!")

# --- Test 4: Tamper Protection ---
print("\n--> Test 4: Testing tamper protection with invalid token...")
tampered_submission = {
    "quiz_session_token": "tampered.jwt.token",
    "answers": {0: 0, 1: 0}
}
try:
    submit_step_quiz_endpoint(step_id=step.id, payload=tampered_submission, db=db, current_user=user)
    raise AssertionError("FAIL: Tampered token should have been rejected.")
except HTTPException as e:
    assert e.status_code == 400
    print("  ✅ PASS: Tampered / invalid quiz session tokens are rejected with HTTP 400!")

print("\n==================================================")
print("🎉 ALL LEARNWISE P1 SECURITY TESTS PASSED 100%!")
print("==================================================")
