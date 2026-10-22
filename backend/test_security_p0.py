import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__))))
sys.stdout.reconfigure(encoding="utf-8")

from app.database import get_db, Base, engine
from app.models.user import User
from app.schemas.auth import ForgotPasswordRequest, ResendVerificationRequest
from app.routers.auth import forgot_password, resend_verification
from app.config import Settings
from pydantic import ValidationError

print("==================================================")
print("🛡️ RUNNING LEARNWISE P0 SECURITY VERIFICATION TEST")
print("==================================================")

db = next(get_db())

# Ensure a test user exists
test_email = "security_test_user@example.com"
user = db.query(User).filter(User.email == test_email).first()
if not user:
    user = User(
        full_name="Security Test User",
        email=test_email,
        hashed_password="dummy_hash_for_test",
        is_verified=False,
        email_verified=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

print("\n--> Test 1: Testing forgot_password response security...")
req_fp = ForgotPasswordRequest(email=test_email)
res_fp = forgot_password(req=req_fp, db=db)

assert "dev_reset_link" not in res_fp or res_fp.get("dev_reset_link") is None, (
    f"FAIL: dev_reset_link leaked in forgot_password response: {res_fp}"
)
assert "token" not in str(res_fp), f"FAIL: Raw token leaked in response body: {res_fp}"
print("  ✅ PASS: No reset token or dev link leaked in forgot_password response!")

print("\n--> Test 2: Testing resend_verification response security...")
req_rv = ResendVerificationRequest(email=test_email)
res_rv = resend_verification(req=req_rv, db=db)

assert "dev_verify_link" not in res_rv or res_rv.get("dev_verify_link") is None, (
    f"FAIL: dev_verify_link leaked in resend_verification response: {res_rv}"
)
assert "token" not in str(res_rv), f"FAIL: Raw token leaked in response body: {res_rv}"
print("  ✅ PASS: No verification token or dev link leaked in resend_verification response!")

print("\n--> Test 3: Testing SECRET_KEY validation in production mode...")
os.environ["ENVIRONMENT"] = "production"
try:
    s = Settings(SECRET_KEY="learnwise_super_secret_jwt_key_2026")
    raise AssertionError("FAIL: Settings accepted insecure default SECRET_KEY in production!")
except (ValidationError, ValueError) as e:
    print("  ✅ PASS: Production mode strictly rejected insecure SECRET_KEY as expected!")
finally:
    os.environ["ENVIRONMENT"] = "development"

print("\n--> Test 4: Testing valid strong SECRET_KEY in production mode...")
os.environ["ENVIRONMENT"] = "production"
try:
    s = Settings(SECRET_KEY="a_very_strong_random_production_secret_key_32_chars_long")
    print("  ✅ PASS: Production mode accepted strong SECRET_KEY!")
finally:
    os.environ["ENVIRONMENT"] = "development"

print("\n==================================================")
print("🎉 ALL LEARNWISE P0 SECURITY TESTS PASSED 100%!")
print("==================================================")
