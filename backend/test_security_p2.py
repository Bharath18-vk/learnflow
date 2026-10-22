import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

from pydantic import ValidationError
from app.schemas.roadmap import OnboardingRequest, RefineRoadmapRequest
from app.schemas.auth import UserCreate, ResetPasswordRequest
from app.schemas.learning import UserNoteCreatePayload, ProgressUpdatePayload

print("==================================================")
print("🛡️ RUNNING LEARNWISE P2 SECURITY VERIFICATION TEST")
print("==================================================")

# --- Test 1: OnboardingRequest Bounds ---
print("\n--> Test 1: Testing OnboardingRequest boundary constraints...")

# 1. Negative or zero daily minutes
try:
    OnboardingRequest(goal_title="Python", daily_minutes=-10)
    raise AssertionError("FAIL: Accepted negative daily_minutes!")
except ValidationError:
    print("  ✅ PASS: Negative daily_minutes rejected!")

# 2. Excessive daily minutes
try:
    OnboardingRequest(goal_title="Python", daily_minutes=5000)
    raise AssertionError("FAIL: Accepted excessive daily_minutes!")
except ValidationError:
    print("  ✅ PASS: Excessive daily_minutes (>720) rejected!")

# 3. Invalid days_per_week
try:
    OnboardingRequest(goal_title="Python", days_per_week=10)
    raise AssertionError("FAIL: Accepted days_per_week > 7!")
except ValidationError:
    print("  ✅ PASS: days_per_week > 7 rejected!")

try:
    OnboardingRequest(goal_title="Python", days_per_week=0)
    raise AssertionError("FAIL: Accepted days_per_week < 1!")
except ValidationError:
    print("  ✅ PASS: days_per_week < 1 rejected!")

# 4. Excessive goal_title length (Prompt injection / buffer attack)
try:
    OnboardingRequest(goal_title="A" * 250)
    raise AssertionError("FAIL: Accepted oversized goal_title!")
except ValidationError:
    print("  ✅ PASS: Oversized goal_title (>200 chars) rejected!")

# Valid onboarding request
valid_onboarding = OnboardingRequest(
    goal_title="Full Stack Python & React",
    daily_minutes=45,
    days_per_week=5,
    target_outcome="Job-ready"
)
assert valid_onboarding.goal_title == "Full Stack Python & React"
print("  ✅ PASS: Valid OnboardingRequest accepted!")


# --- Test 2: RefineRoadmapRequest Bounds ---
print("\n--> Test 2: Testing RefineRoadmapRequest boundary constraints...")
try:
    RefineRoadmapRequest(refinement_prompt="A" * 2000, goal_id=1)
    raise AssertionError("FAIL: Accepted oversized refinement_prompt!")
except ValidationError:
    print("  ✅ PASS: Oversized refinement prompt (>1500 chars) rejected!")

try:
    RefineRoadmapRequest(refinement_prompt="Valid prompt", goal_id=0)
    raise AssertionError("FAIL: Accepted goal_id < 1!")
except ValidationError:
    print("  ✅ PASS: Invalid goal_id (<1) rejected!")


# --- Test 3: Password Length Limit (DoS Prevention) ---
print("\n--> Test 3: Testing UserCreate password length limit...")
try:
    UserCreate(
        full_name="Valid User",
        email="user@example.com",
        password="A" * 150 + "1!a"
    )
    raise AssertionError("FAIL: Accepted password > 128 chars!")
except (ValidationError, ValueError):
    print("  ✅ PASS: Password > 128 characters rejected to prevent CPU hash DoS!")


# --- Test 4: Learning Note & Progress Bounds ---
print("\n--> Test 4: Testing Learning Note & Progress boundary constraints...")
try:
    UserNoteCreatePayload(content="")
    raise AssertionError("FAIL: Accepted empty note content!")
except ValidationError:
    print("  ✅ PASS: Empty note content rejected!")

try:
    UserNoteCreatePayload(content="N" * 6000)
    raise AssertionError("FAIL: Accepted note content > 5000 chars!")
except ValidationError:
    print("  ✅ PASS: Oversized note content (>5000 chars) rejected!")

try:
    ProgressUpdatePayload(practice_hints_used=99)
    raise AssertionError("FAIL: Accepted practice_hints_used > 20!")
except ValidationError:
    print("  ✅ PASS: Invalid practice_hints_used (>20) rejected!")

print("\n==================================================")
print("🎉 ALL LEARNWISE P2 SECURITY TESTS PASSED 100%!")
print("==================================================")
