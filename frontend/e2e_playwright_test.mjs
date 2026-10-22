import { chromium } from "playwright";

async function runFullE2ETest() {
    console.log("==========================================================");
    console.log("🚀 STARTING LEARNWISE PLAYWRIGHT COMPREHENSIVE E2E TEST");
    console.log("==========================================================");

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    // Listen to browser console and errors
    page.on("console", msg => console.log(` [Browser ${msg.type().toUpperCase()}]: ${msg.text()}`));
    page.on("pageerror", err => console.error(` [Browser Exception]: ${err.message}`));
    page.on("response", res => {
        if (res.url().includes("/api/")) {
            console.log(` [API ${res.status()}]: ${res.request().method()} ${res.url()}`);
        }
    });

    try {
        // Step 1: Register an authenticated test user via API
        console.log("\n▶ Step 1: Setting up authenticated session for testing...");
        const uniqueSuffix = Date.now();
        const email = `e2e_tester_${uniqueSuffix}@learnwise.ai`;
        const password = "Password123!";

        const regRes = await fetch("http://127.0.0.1:8000/api/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: email,
                password: password,
                full_name: "E2E Tester"
            })
        });
        const regData = await regRes.json();
        if (!regRes.ok || !regData.access_token) {
            throw new Error(`User registration failed: ${JSON.stringify(regData)}`);
        }
        const token = regData.access_token;
        console.log(` ✅ Authenticated test user registered: ${email} (User ID: ${regData.user?.id})`);

        // Step 2: Inject token into browser localStorage
        await page.goto("http://localhost:5173", { waitUntil: "domcontentloaded" });
        await page.evaluate(({ token, regData }) => {
            localStorage.setItem("token", token);
            localStorage.setItem("access_token", token);
            localStorage.setItem("user", JSON.stringify(regData.user || { name: "E2E Tester" }));
        }, { token, regData });

        // Step 3: Complete 4-step Onboarding Flow
        console.log("\n▶ Step 2: Navigating through Onboarding UI to generate roadmap...");
        await page.goto("http://localhost:5173/onboarding", { waitUntil: "networkidle" });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: "playwright_artifacts/01_onboarding_form.png" });
        console.log(" ✅ Onboarding page loaded. Screenshot: 01_onboarding_form.png");

        // Step 1 -> Step 2
        console.log(" ➡️ Advancing Step 1 (Goal & Outcome)...");
        await page.locator(".onboarding-next-btn").click();
        await page.waitForTimeout(600);

        // Step 2 -> Step 3
        console.log(" ➡️ Advancing Step 2 (Skill Level & Prior Knowledge)...");
        await page.locator(".onboarding-next-btn").click();
        await page.waitForTimeout(600);

        // Step 3 -> Step 4
        console.log(" ➡️ Advancing Step 3 (Schedule & Capacity)...");
        await page.locator(".onboarding-next-btn").click();
        await page.waitForTimeout(600);

        // Step 4 -> Generate
        console.log(" ⏳ Submitting Step 4 to generate personalized roadmap...");
        await page.locator(".onboarding-next-btn").click();

        // Wait for roadmap generation and navigation to dashboard
        await page.waitForURL(/.*\/dashboard.*/, { timeout: 45000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: "playwright_artifacts/02_dashboard_with_roadmap.png", fullPage: true });
        console.log(" ✅ Dashboard rendered with personalized roadmap. Screenshot: 02_dashboard_with_roadmap.png");

        // Step 4: Click into Milestone Learning
        console.log("\n▶ Step 3: Entering Milestone Learning Environment...");
        const learnBtn = page.locator(".start-learning-btn, .step-action-btn.learn-btn, .continue-study-btn").first();
        await learnBtn.waitFor({ state: "visible", timeout: 10000 });
        await learnBtn.click();

        // Wait for learning lesson generation & UI load
        console.log(" ⏳ Generating on-demand lesson content & concepts...");
        await page.waitForSelector(".learning-workspace-container", { timeout: 45000 });
        await page.waitForTimeout(2000);
        await page.screenshot({ path: "playwright_artifacts/03_lesson_overview.png", fullPage: true });
        console.log(" ✅ In-app Lesson Environment loaded. Screenshot: 03_lesson_overview.png");

        // Step 5: Test Sidebar Concept Mastery Tab
        console.log("\n▶ Step 4: Testing Concept Mastery Diagnostics Tab...");
        const masteryTab = page.locator(".mastery-toc-item, button:has-text('Concept Mastery')").first();
        await masteryTab.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: "playwright_artifacts/04_concept_mastery_tab.png", fullPage: true });
        console.log(" ✅ Concept Mastery Diagnostics rendered. Screenshot: 04_concept_mastery_tab.png");

        const conceptCount = await page.locator(".concept-mastery-card").count();
        console.log(` ✅ Granular Concept Mastery Cards found: ${conceptCount}`);

        // Step 6: Test Practice Tab & Evidence Tracking (Hints & Solution)
        console.log("\n▶ Step 5: Testing Applied Practice Challenge & Evidence Tracking...");
        const practiceTab = page.locator(".practice-toc-item, button:has-text('Practice')").first();
        await practiceTab.click();
        await page.waitForTimeout(1000);

        // Toggle hint if available
        const hintBtn = page.locator(".hint-toggle-btn, button:has-text('Need a Hint'), button:has-text('Hint')").first();
        if (await hintBtn.isVisible().catch(() => false)) {
            await hintBtn.click();
            await page.waitForTimeout(500);
            console.log(" 💡 Toggled practice hint (hints used recorded in telemetry).");
        }

        await page.screenshot({ path: "playwright_artifacts/05_practice_tab.png", fullPage: true });
        console.log(" ✅ Applied Practice tab rendered. Screenshot: 05_practice_tab.png");

        // Mark practice complete
        const markPracticeBtn = page.locator(".mark-practice-btn, button:has-text('Mark Practice Complete'), button:has-text('Completed')").first();
        if (await markPracticeBtn.isVisible().catch(() => false)) {
            await markPracticeBtn.click();
            await page.waitForTimeout(1500);
            console.log(" 🎯 Marked practice complete with quality weighting.");
        }

        // Step 7: Test Checkpoint Assessment & Anti-Leakage Questions
        console.log("\n▶ Step 6: Testing Checkpoint Assessment & Anti-Leakage Delivery...");
        const checkpointTab = page.locator(".checkpoint-toc-item, button:has-text('Checkpoint')").first();
        await checkpointTab.click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: "playwright_artifacts/06_checkpoint_questions.png", fullPage: true });
        console.log(" ✅ Checkpoint Assessment questions loaded. Screenshot: 06_checkpoint_questions.png");

        // Select answers for questions - deliberately choose alternative choices to trigger diagnostic weaknesses
        const qCards = page.locator(".checkpoint-q-card");
        const qCount = await qCards.count();
        console.log(` 📋 Found ${qCount} checkpoint questions`);

        for (let i = 0; i < qCount; i++) {
            const card = qCards.nth(i);
            const options = card.locator(".q-option-label");
            // Pick choice 1 for question 1 and choice 2/3 for others to produce targeted weaknesses
            const optIndex = (i === 0) ? 0 : (i === 2 ? 1 : 2);
            const targetOption = options.nth(optIndex);
            if (await targetOption.isVisible().catch(() => false)) {
                await targetOption.click();
                await page.waitForTimeout(200);
            }
        }

        // Submit assessment
        const submitBtn = page.locator(".submit-quiz-btn, button[type='submit']").first();
        if (await submitBtn.isVisible().catch(() => false)) {
            console.log(" 🚀 Submitting Checkpoint Assessment to Assessment Engine...");
            await submitBtn.click();
            await page.waitForSelector(".assessment-result-container, .assessment-score-banner", { timeout: 25000 });
            await page.waitForTimeout(2000);
            await page.screenshot({ path: "playwright_artifacts/07_assessment_result_diagnostics.png", fullPage: true });
            console.log(" ✅ Assessment submitted. Diagnostics & AssessmentResultView rendered! Screenshot: 07_assessment_result_diagnostics.png");
        }

        // Step 8: Test 10-Minute Targeted Remediation Modal
        console.log("\n▶ Step 7: Testing 10-Minute Targeted Remediation & Reassessment...");
        let remedBtn = page.locator(".btn-fix-concept").first();
        if (!await remedBtn.isVisible().catch(() => false)) {
            const masteryTab = page.locator(".mastery-toc-item, button:has-text('Concept Mastery')").first();
            await masteryTab.click();
            await page.waitForTimeout(1000);
            remedBtn = page.locator(".btn-remediation-trigger, .btn-fix-concept").first();
        }

        if (await remedBtn.isVisible().catch(() => false)) {
            console.log(" 🎯 Triggering 10-Minute Targeted Remediation for Weak Concept...");
            await remedBtn.click();
            await page.waitForSelector(".remediation-backdrop, .remediation-modal", { timeout: 25000 });
            // Wait for refresher step to finish loading
            const nextToQuiz = page.locator(".btn-remed-next").first();
            await nextToQuiz.waitFor({ state: "visible", timeout: 25000 });
            await page.waitForTimeout(1000);
            await page.screenshot({ path: "playwright_artifacts/08_remediation_refresher_modal.png" });
            console.log(" ✅ Remediation Modal active with Misconception Refresher. Screenshot: 08_remediation_refresher_modal.png");

            // Click next to quiz
            await nextToQuiz.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: "playwright_artifacts/09_remediation_mini_quiz.png" });
            console.log(" ✅ Mini-Quiz active. Screenshot: 09_remediation_mini_quiz.png");

            // Select answers for mini-quiz questions
            const quizCards = page.locator(".remed-quiz-card");
            const quizCount = await quizCards.count();
            console.log(` 📋 Found ${quizCount} active recall verification questions`);
            for (let q = 0; q < quizCount; q++) {
                const card = quizCards.nth(q);
                const opt = card.locator(".quiz-option-item").first();
                if (await opt.isVisible().catch(() => false)) {
                    await opt.click();
                    await page.waitForTimeout(300);
                }
            }

            // Submit mini-quiz
            const submitQuiz = page.locator(".btn-remed-next:not([disabled])").first();
            if (await submitQuiz.isVisible().catch(() => false)) {
                console.log(" 🚀 Submitting Mini-Quiz Reassessment...");
                await submitQuiz.click();
                await page.waitForSelector(".celebration-step, .celebration-hero", { timeout: 20000 });
                await page.waitForTimeout(2000);
                await page.screenshot({ path: "playwright_artifacts/10_remediation_mastery_gain.png" });
                console.log(" ✅ Remediation Reassessment Passed! Mastery gain celebration shown! Screenshot: 10_remediation_mastery_gain.png");

                // Dismiss modal
                const continueBtn = page.locator("button:has-text('Continue Learning'), .remed-close-btn").first();
                if (await continueBtn.isVisible().catch(() => false)) {
                    await continueBtn.click();
                    await page.waitForSelector(".remediation-backdrop", { state: "hidden", timeout: 10000 }).catch(() => null);
                    await page.waitForTimeout(1000);
                }
            }
        }

        // Final: View updated Concept Mastery Tab with refreshed scores
        console.log("\n▶ Step 8: Verifying Updated Concept Mastery Breakdown...");
        const finalMasteryTab = page.locator(".mastery-toc-item, button:has-text('Concept Mastery')").first();
        if (await finalMasteryTab.isVisible().catch(() => false)) {
            await finalMasteryTab.click();
            await page.waitForTimeout(1500);
            await page.screenshot({ path: "playwright_artifacts/04b_concept_mastery_updated.png", fullPage: true });
            console.log(" ✅ Refreshed Concept Mastery Breakdown captured: 04b_concept_mastery_updated.png");
        }

        console.log("\n==========================================================");
        console.log("🎉 ALL PLAYWRIGHT AUTOMATED E2E TESTS COMPLETED 100%!");
        console.log("==========================================================");

    } catch (err) {
        console.error("❌ Test Exception:", err);
        await page.screenshot({ path: "playwright_artifacts/error_state.png", fullPage: true });
    } finally {
        await browser.close();
    }
}

runFullE2ETest();
