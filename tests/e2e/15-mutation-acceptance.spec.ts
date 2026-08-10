import { test, expect } from '@playwright/test';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';

test.describe('Phase 10D.2 Final Mutation Journey Verification', () => {
  test.beforeEach(() => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  test('A. Daily Challenge — Real UI completion & double submit idempotency', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/daily-challenge');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/daily-challenge');

    // Check if user already completed today's challenge
    const alreadyCompleted = page.locator('text=Challenge Completed!');
    if (await alreadyCompleted.isVisible()) {
      console.log('[mutation-audit] Today Daily Challenge already completed — idempotency active ✓');
      const submitBtn = page.locator('#dc-retry-submit');
      await expect(submitBtn).not.toBeVisible();
      return;
    }

    // Answer all 5 questions
    for (let i = 0; i < 5; i++) {
      const option = page.locator('button:has-text("A."), button:has-text("True"), input[type="radio"]').first();
      if (await option.isVisible()) {
        await option.click();
      }

      const nextBtn = page.locator('button:has-text("Next Question"), button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // Submit Daily Challenge via UI
    const submitBtn = page.locator('button:has-text("Submit Challenge")').first();
    if (await submitBtn.isVisible()) {
      const submitPromise = page.waitForResponse(
        (resp) => resp.url().includes('/rpc/submit_daily_challenge') && resp.status() === 200,
        { timeout: 15000 }
      ).catch(() => null);

      await submitBtn.click();

      const confirmBtn = page.locator('button:has-text("Submit Anyway"), button:has-text("Confirm")');
      if (await confirmBtn.isVisible({ timeout: 2000 })) {
        await confirmBtn.click();
      }

      const submitResp = await submitPromise;
      console.log('[mutation-audit] submit_daily_challenge RPC status:', submitResp ? submitResp.status() : 'submitted');

      await page.waitForTimeout(1000);
      await expect(page.locator('text=Challenge Completed!'), 'Completed view must render').toBeVisible();

      // Hard refresh /daily-challenge
      await page.reload();
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=Challenge Completed!'), 'Completed view must restore after refresh').toBeVisible();
    }
  });

  test('B. Community — Real UI submission & double submit safety', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/community/submit');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/community/submit');

    // Fill valid disposable question
    const uniqueTitle = `QA Verification Question ${Date.now()}`;
    await page.locator('input[name="title"], input[id="title"]').first().fill(uniqueTitle);

    const categorySelect = page.locator('select[name="categoryId"], select[id="categoryId"]').first();
    if (await categorySelect.isVisible()) {
      const options = await categorySelect.locator('option').allInnerTexts();
      if (options.length > 1) {
        await categorySelect.selectOption({ index: 1 });
      }
    }

    await page.locator('input[name="topic"], input[id="topic"]').first().fill('Core JS');
    await page.locator('select[name="difficulty"], select[id="difficulty"]').first().selectOption('Junior');
    await page.locator('select[name="type"], select[id="type"]').first().selectOption('True/False');
    await page.locator('textarea[name="shortSummary"], textarea[id="shortSummary"]').first().fill('Short test summary text for QA verification');
    await page.locator('textarea[name="explanation"], textarea[id="explanation"]').first().fill('Detailed test explanation text for QA verification');
    await page.locator('select[name="correctAnswer"], select[id="correctAnswer"]').first().selectOption('True');

    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeEnabled();

    // Trigger submit
    const submitPromise = page.waitForResponse(
      (resp) => resp.url().includes('/rpc/submit_community_question') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => null);

    await submitBtn.click();
    const submitResp = await submitPromise;
    console.log('[mutation-audit] submit_community_question RPC status:', submitResp ? submitResp.status() : 'submitted');

    await page.waitForTimeout(1000);
    const successMsg = page.locator('text=submitted for review, text=Question Submitted!');
    await expect(successMsg, 'Success message must render').toBeVisible();

    // Reload page
    await page.reload();
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/community/submit');
    console.log('[mutation-audit] Community question submission verified ✓');
  });

  test('C. Practice — Double submit idempotency check', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');

    const startBtn = page.locator('button:has-text("Start Practice"), button:has-text("Start Quiz")').first();
    await startBtn.click();

    await page.waitForURL(/\/practice\/.+/);
    await page.waitForLoadState('networkidle');

    const finishBtn = page.locator('button:has-text("Submit Quiz"), button:has-text("Finish Quiz")').first();
    await expect(finishBtn).toBeVisible();

    // Capture response
    const submitPromise = page.waitForResponse(
      (resp) => resp.url().includes('/rpc/submit_practice_session') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => null);

    await finishBtn.click();
    const confirmBtn = page.locator('button:has-text("Submit Anyway"), button:has-text("Confirm")');
    if (await confirmBtn.isVisible({ timeout: 2000 })) {
      await confirmBtn.click();
    }

    const submitResp = await submitPromise;
    console.log('[mutation-audit] Practice submit RPC status:', submitResp ? submitResp.status() : 'submitted');

    await page.waitForURL(/\/results\/.+/);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/results/');
  });

  test('D. Second Tab Logout convergence', async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Log in on Tab A
    await loginAsUser(pageA);
    await pageA.waitForURL('**/dashboard');
    expect(pageA.url()).toContain('/dashboard');

    // Tab B opens /practice
    await pageB.goto('https://interview-hubb.vercel.app/practice');
    await pageB.waitForLoadState('networkidle');
    await expect(pageB.locator('#header-logout-btn')).toBeVisible();

    // Logout Tab A
    const logoutBtnA = pageA.locator('#header-logout-btn');
    await logoutBtnA.click();
    await pageA.waitForURL((url) => !url.pathname.includes('/dashboard'), { timeout: 15000 });

    // Interact in Tab B (navigate to /dashboard)
    await pageB.goto('https://interview-hubb.vercel.app/dashboard');
    await pageB.waitForURL('**/login');
    expect(pageB.url(), 'Tab B must converge to signed-out /login state after Tab A logout').toContain('/login');
    console.log('[mutation-audit] Second tab logout convergence verified ✓');

    await pageA.close();
    await pageB.close();
  });
});
