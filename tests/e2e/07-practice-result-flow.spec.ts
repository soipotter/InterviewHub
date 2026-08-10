import { test, expect } from '@playwright/test';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

/**
 * P1 Gate: Practice Builder → Quiz → Answers → Submit → Results → Refresh
 *
 * Architecture notes:
 * - Quiz state is stored in sessionStorage (not cross-tab persistent)
 * - Playwright keeps sessionStorage within the same page context (single SPA session)
 * - Navigation via page.goto() within same context preserves sessionStorage
 * - After submit, attempt is persisted to Supabase (quiz_attempts + quiz_answers tables)
 * - /results/:attemptId loads from Supabase → survives reload
 */
test.describe('Practice → Quiz → Results (P1 Gate)', () => {
  test.beforeEach(async () => {
    if (!hasUserCredentials()) test.skip(true, 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set');
  });

  test('D+E: full practice quiz completion → results → result reload persists', async ({ page }) => {
    // ── Step 1: Login ──────────────────────────────────────────────────────
    const ok = await loginAsUser(page);
    expect(ok, 'Login failed').toBeTruthy();

    // ── Step 2: Navigate to practice builder ──────────────────────────────
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // wait for Supabase question fetch

    // Verify the start button is available and enabled
    const startBtn = page.locator('button:has-text("Start Practice")');
    await expect(startBtn).toBeVisible({ timeout: 10000 });

    // Verify there are matching questions (not 0 available)
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/No matching questions available/i);
    expect(bodyText).not.toMatch(/✕/); // red X indicator

    // ── Step 3: Start quiz ────────────────────────────────────────────────
    await startBtn.click();
    // Should navigate to /practice/:quizId
    await page.waitForURL(/\/practice\/quiz_/, { timeout: 15000 });
    const quizUrl = page.url();
    expect(quizUrl).toMatch(/\/practice\/quiz_/);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // ── Step 4: Answer all questions ──────────────────────────────────────
    // The quiz runner shows one question at a time with radio/button options
    let questionsAnswered = 0;
    const maxQuestions = 5; // default count
    let hasNext = true;

    while (hasNext && questionsAnswered < maxQuestions) {
      // Select the first available option
      const options = page.locator('input[type="radio"], button[role="radio"]');
      const optionCount = await options.count();

      if (optionCount > 0) {
        await options.first().click();
        await page.waitForTimeout(300);
        questionsAnswered++;
      } else {
        // Try button-style options if no radio inputs
        const btnOptions = page.locator('[class*="option"], [class*="choice"]').first();
        if (await btnOptions.isVisible()) {
          await btnOptions.click();
          await page.waitForTimeout(300);
          questionsAnswered++;
        }
      }

      // Try clicking "Next" button
      const nextBtn = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();
      const finishBtn = page.locator('button:has-text("Finish"), button:has-text("Submit")').first();

      if (await finishBtn.isVisible()) {
        hasNext = false; // This is the last question
      } else if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(500);
      } else {
        hasNext = false;
      }
    }

    expect(questionsAnswered, 'No questions were answerable in the quiz').toBeGreaterThan(0);

    // ── Step 5: Submit quiz ───────────────────────────────────────────────
    const finishBtn = page.locator('button:has-text("Finish"), button:has-text("Submit")').first();
    await expect(finishBtn).toBeVisible({ timeout: 10000 });
    await finishBtn.click();

    // If unanswered modal appears, confirm submission
    await page.waitForTimeout(1000);
    const confirmBtn = page.locator('button:has-text("Submit Anyway"), button:has-text("Confirm Submit"), button:has-text("Submit Quiz")').first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }

    // ── Step 6: Verify results page loads ─────────────────────────────────
    await page.waitForURL(/\/results\/att_/, { timeout: 20000 });
    const resultsUrl = page.url();
    expect(resultsUrl).toMatch(/\/results\/att_/);

    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const resultsBody = await page.textContent('body') ?? '';
    // Should show score content, not error state
    expect(resultsBody).not.toMatch(/Attempt Result Not Found/i);
    expect(resultsBody.trim().length).toBeGreaterThan(200);

    // Extract attempt ID from URL
    const attemptIdMatch = resultsUrl.match(/\/results\/(att_[^?#]+)/);
    expect(attemptIdMatch, 'Could not extract attempt ID from URL').not.toBeNull();
    const attemptId = attemptIdMatch![1];

    // ── Step 7: Reload results page (Supabase persistence gate) ──────────
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Supabase fetch

    const reloadBody = await page.textContent('body') ?? '';
    expect(reloadBody).not.toMatch(/Attempt Result Not Found/i);
    expect(reloadBody.trim().length).toBeGreaterThan(200);

    // ── Step 8: Navigate directly to results by ID (deep link test) ───────
    await page.goto(`/results/${attemptId}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const deepLinkBody = await page.textContent('body') ?? '';
    expect(deepLinkBody).not.toMatch(/Attempt Result Not Found/i);
    expect(page.url()).toContain(`/results/${attemptId}`);

    console.log(`[practice-result] Attempt ${attemptId} persisted to Supabase ✓`);
  });

  test('E2: guest practice (no auth) completes and shows result (sessionStorage)', async ({ page }) => {
    // This tests practice without auth — result is sessionStorage-only
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const startBtn = page.locator('button:has-text("Start Practice")');
    if (!(await startBtn.isEnabled())) {
      test.skip(true, 'No questions available in practice builder');
      return;
    }

    await startBtn.click();
    await page.waitForURL(/\/practice\/quiz_/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Answer at least one question
    const options = page.locator('input[type="radio"]');
    if (await options.count() > 0) {
      await options.first().click();
    }

    // Click Finish
    const finishBtn = page.locator('button:has-text("Finish"), button:has-text("Submit")').first();
    if (await finishBtn.isVisible()) {
      await finishBtn.click();
      await page.waitForTimeout(1000);
      const confirmBtn = page.locator('button:has-text("Submit Anyway"), button:has-text("Confirm")').first();
      if (await confirmBtn.isVisible()) await confirmBtn.click();
    }

    // Should redirect to /results
    await page.waitForURL(/\/results\/att_/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Results render from sessionStorage for guest
    const bodyText = await page.textContent('body') ?? '';
    // Guest sees "Temporary Session Result" banner OR the result itself
    const hasResultContent = bodyText.includes('Practice') || bodyText.includes('Score') ||
      bodyText.includes('Question') || bodyText.includes('Correct');
    expect(hasResultContent, 'No result content found on /results page').toBeTruthy();
  });
});
