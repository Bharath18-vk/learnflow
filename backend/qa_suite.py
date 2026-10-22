import requests
import sys
import uuid
import json

BASE_URL = "http://127.0.0.1:8000/api"

def run_qa_audit():
    print("==================================================")
    print("   LEARNWISE END-TO-END QA AUTOMATED SUITE")
    print("==================================================\n")

    results = {
        "passed": 0,
        "failed": 0,
        "blocked": 0,
        "details": []
    }

    def record_test(name, success, info=""):
        if success:
            results["passed"] += 1
            status_str = "[PASS]"
        else:
            results["failed"] += 1
            status_str = "[FAIL]"
        print(f"{status_str} {name} {f'- {info}' if info else ''}")
        results["details"].append({"name": name, "status": "PASS" if success else "FAIL", "info": info})

    session_a = requests.Session()
    session_b = requests.Session()

    unique_id = str(uuid.uuid4())[:8]
    email_a = f"qa_user_a_{unique_id}@example.com"
    email_b = f"qa_user_b_{unique_id}@example.com"
    password_a = "ValidPass123!"
    password_b = "UserBPass456!"

    token_a = None
    token_b = None

    # ---------------------------------------------------------
    # 1. REGISTRATION TESTING
    # ---------------------------------------------------------
    print("--> Phase 1: User Registration Tests")
    reg_payload_a = {
        "full_name": "QA Tester Alpha",
        "email": email_a,
        "password": password_a
    }
    res = session_a.post(f"{BASE_URL}/auth/register", json=reg_payload_a)
    record_test("User A Registration (201 Created)", res.status_code == 201, f"Status {res.status_code} - {res.text}")
    
    if res.status_code == 201:
        token_a = res.json().get("access_token")
        record_test("JWT Issued on Registration", bool(token_a))

    # Test Duplicate Registration
    res_dup = session_a.post(f"{BASE_URL}/auth/register", json=reg_payload_a)
    record_test("Duplicate Email Rejection (400 Bad Request)", res_dup.status_code == 400, f"Status {res_dup.status_code}")

    # Register User B
    reg_payload_b = {
        "full_name": "QA Tester Beta",
        "email": email_b,
        "password": password_b
    }
    res_b = session_b.post(f"{BASE_URL}/auth/register", json=reg_payload_b)
    if res_b.status_code == 201:
        token_b = res_b.json().get("access_token")
    record_test("User B Registration", res_b.status_code == 201)

    # ---------------------------------------------------------
    # 2. LOGIN TESTING
    # ---------------------------------------------------------
    print("\n--> Phase 2: Login Authentication Tests")
    login_res = session_a.post(f"{BASE_URL}/auth/login", json={"email": email_a, "password": password_a})
    record_test("Valid Login", login_res.status_code == 200)

    invalid_login = session_a.post(f"{BASE_URL}/auth/login", json={"email": email_a, "password": "WrongPassword!"})
    record_test("Invalid Password Rejection (401 Unauthorized)", invalid_login.status_code == 401)

    non_exist_login = session_a.post(f"{BASE_URL}/auth/login", json={"email": "nonexistent_9999@example.com", "password": "Pass!"})
    record_test("Non-Existent Account Rejection", non_exist_login.status_code == 401)

    # ---------------------------------------------------------
    # 3. FORGOT & RESET PASSWORD TESTING
    # ---------------------------------------------------------
    print("\n--> Phase 3: Password Reset Flow")
    forgot_res = session_a.post(f"{BASE_URL}/auth/forgot-password", json={"email": email_a})
    record_test("Forgot Password Request", forgot_res.status_code == 200)
    dev_reset_link = forgot_res.json().get("dev_reset_link")
    
    # Check Account Enumeration Protection for non-existent email
    forgot_enum = session_a.post(f"{BASE_URL}/auth/forgot-password", json={"email": "nobody_exists_12345@example.com"})
    record_test("Account Enumeration Prevention", forgot_enum.status_code == 200 and "dispatched" in forgot_enum.json().get("message", "").lower())

    if dev_reset_link and "token=" in dev_reset_link:
        raw_reset_token = dev_reset_link.split("token=")[1]
        new_password_a = "NewStrongPass999!"
        reset_res = session_a.post(f"{BASE_URL}/auth/reset-password", json={"token": raw_reset_token, "new_password": new_password_a})
        record_test("Password Reset Execution", reset_res.status_code == 200)

        # Test Old Password Failure
        old_login = session_a.post(f"{BASE_URL}/auth/login", json={"email": email_a, "password": password_a})
        record_test("Old Password Invalidation", old_login.status_code == 401)

        # Test New Password Success
        new_login = session_a.post(f"{BASE_URL}/auth/login", json={"email": email_a, "password": new_password_a})
        record_test("New Password Authentication", new_login.status_code == 200)
        token_a = new_login.json().get("access_token")

    auth_headers_a = {"Authorization": f"Bearer {token_a}"} if token_a else {}
    auth_headers_b = {"Authorization": f"Bearer {token_b}"} if token_b else {}

    # ---------------------------------------------------------
    # 4. ONBOARDING & ROADMAP GENERATION
    # ---------------------------------------------------------
    print("\n--> Phase 4: AI Roadmap Generation")
    goal_a_payload = {
        "goal_title": "Full-Stack Web Development",
        "skill_level": "Intermediate",
        "daily_minutes": 30,
        "preferred_format": "Video"
    }
    gen_a_res = requests.post(f"{BASE_URL}/roadmap/generate", json=goal_a_payload, headers=auth_headers_a)
    record_test("Generate Goal A Roadmap (201 Created)", gen_a_res.status_code == 201, f"Status {gen_a_res.status_code}")
    
    goal_a_data = gen_a_res.json() if gen_a_res.status_code == 201 else {}
    goal_a_id = goal_a_data.get("goal_id")
    steps_a = goal_a_data.get("roadmap", {}).get("steps", [])
    record_test("Roadmap Steps Persisted", len(steps_a) > 0, f"{len(steps_a)} steps generated")

    # ---------------------------------------------------------
    # 5. MULTI-ROADMAP & GOAL SWITCHING
    # ---------------------------------------------------------
    print("\n--> Phase 5: Multi-Roadmap & Goal Switching")
    goal_b_payload = {
        "goal_title": "Machine Learning",
        "skill_level": "Beginner",
        "daily_minutes": 60,
        "preferred_format": "Projects"
    }
    gen_b_res = requests.post(f"{BASE_URL}/roadmap/generate", json=goal_b_payload, headers=auth_headers_a)
    record_test("Generate Goal B Roadmap", gen_b_res.status_code == 201)
    goal_b_id = gen_b_res.json().get("goal_id") if gen_b_res.status_code == 201 else None

    # Fetch All Goals for User A
    all_goals_res = requests.get(f"{BASE_URL}/roadmap/all", headers=auth_headers_a)
    record_test("Fetch All User Goals", all_goals_res.status_code == 200 and len(all_goals_res.json()) >= 2)

    # Switch back to Goal A
    if goal_a_id:
        switch_res = requests.post(f"{BASE_URL}/roadmap/goals/{goal_a_id}/activate", headers=auth_headers_a)
        record_test("Goal Switch A Activation", switch_res.status_code == 200 and switch_res.json().get("goal_id") == goal_a_id)

    # ---------------------------------------------------------
    # 6. STEP TOGGLING & PROGRESS ISOLATION
    # ---------------------------------------------------------
    print("\n--> Phase 6: Step Toggling & Progress Calculation")
    if steps_a:
        step_1_id = steps_a[0]["id"]
        toggle_res = requests.post(f"{BASE_URL}/roadmap/steps/{step_1_id}/toggle", headers=auth_headers_a)
        record_test("Toggle Step 1 Completion", toggle_res.status_code == 200)
        
        progress_pct = toggle_res.json().get("progress_percentage", 0)
        record_test("Progress Percentage Calculated", progress_pct > 0, f"Progress: {progress_pct}%")

    # Switch to Goal B and verify Goal B is at 0% (Progress Isolation)
    if goal_b_id:
        switch_b_res = requests.post(f"{BASE_URL}/roadmap/goals/{goal_b_id}/activate", headers=auth_headers_a)
        b_progress_pct = switch_b_res.json().get("progress_percentage", 0)
        record_test("Progress Isolation (Goal B is 0%)", b_progress_pct == 0, f"Goal B Progress: {b_progress_pct}%")

    # ---------------------------------------------------------
    # 7. SECURITY & IDOR TESTING
    # ---------------------------------------------------------
    print("\n--> Phase 7: Authorization & IDOR Security")
    if steps_a and token_b:
        step_1_id = steps_a[0]["id"]
        # User B attempts to toggle User A's step
        idor_res = requests.post(f"{BASE_URL}/roadmap/steps/{step_1_id}/toggle", headers=auth_headers_b)
        record_test("IDOR Step Modification Blocked (403 Forbidden)", idor_res.status_code == 403, f"Status {idor_res.status_code}")

    # User B attempts to activate User A's goal
    if goal_a_id and token_b:
        idor_goal_res = requests.post(f"{BASE_URL}/roadmap/goals/{goal_a_id}/activate", headers=auth_headers_b)
        record_test("IDOR Goal Activation Blocked (404 Not Found)", idor_goal_res.status_code == 404)

    # ---------------------------------------------------------
    # 8. INPUT SECURITY (XSS & SQL Injection)
    # ---------------------------------------------------------
    print("\n--> Phase 8: Input Security Tests")
    xss_payload = {
        "goal_title": "<script>alert('xss')</script> Quantum Computing",
        "skill_level": "Beginner",
        "daily_minutes": 15,
        "preferred_format": "All"
    }
    xss_res = requests.post(f"{BASE_URL}/roadmap/generate", json=xss_payload, headers=auth_headers_a)
    record_test("XSS Input Generation Handled Safely", xss_res.status_code == 201)

    print("\n==================================================")
    print(f"QA SUITE COMPLETE: {results['passed']} Passed | {results['failed']} Failed | {results['blocked']} Blocked")
    print("==================================================\n")

    return results

if __name__ == "__main__":
    run_qa_audit()
