import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
sys.stdout.reconfigure(encoding='utf-8')

from app.database import get_db
from app.models.user import User
from app.routers.roadmap import generate_roadmap
from app.schemas.roadmap import OnboardingRequest
from app.utils.security import hash_password

db = next(get_db())

test_email = "test_onboard@learnwise.ai"
user = db.query(User).filter(User.email == test_email).first()
if not user:
    user = User(
        email=test_email,
        hashed_password=hash_password("Password123!"),
        full_name="Onboarding Tester",
        email_verified=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)

req = OnboardingRequest(
    goal_title="Machine Learning",
    target_outcome="Job-ready",
    skill_level="Beginner",
    existing_knowledge="Python",
    daily_minutes=30,
    days_per_week=5,
    deadline=None,
    desired_depth="Balanced",
    preferred_format="Video tutorials, Hands-on projects",
    learning_preferences=["Video tutorials", "Hands-on projects"]
)

try:
    print("Testing generate_roadmap endpoint...")
    result = generate_roadmap(request=req, db=db, current_user=user)
    print("✓ Success! Generated roadmap title:", result.get("title"))
    print("✓ Total steps:", result.get("total_steps"))
    print("✓ Feasibility status:", result.get("feasibility", {}).get("status"))
except Exception as e:
    print("✗ Error during generate_roadmap:", type(e), e)
    import traceback
    traceback.print_exc()
