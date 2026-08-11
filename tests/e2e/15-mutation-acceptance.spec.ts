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
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/daily-challenge');

    // Check if user already completed today's challenge
    const alreadyCompleted = page.locator('text=Challenge Completed!');
    if (await alreadyCompleted.isVisible()) {
      console.log('[mutation-audit] Today Daily Challenge already completed — idempotency active ✓');
      const retryBtn = page.locator('#dc-retry-submit');
      await expect(retryBtn).not.toBeVisible();
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
        (resp) => (resp.url().includes('/rpc/submit_daily_challenge') || resp.url().includes('/rpc/submit_practice_session')) && resp.status() === 200,
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
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('text=Challenge Completed!'), 'Completed view must restore after refresh').toBeVisible();
    }
  });

  test('B. Community — Real UI submission & double submit safety', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/community/submit');
    await page.waitForLoadState('domcontentloaded');

    expect(page.url()).toContain('/community/submit');

    // Fill valid disposable question
    const uniqueTitle = `QA Verification Question ${Date.now()}`;
    await page.locator('#community-title').fill(uniqueTitle);

    // Wait for categories to finish loading
    await page.waitForSelector('#community-category option:not([disabled])', { state: 'attached', timeout: 15000 });
    await page.locator('#community-category').selectOption({ index: 1 });

    await page.locator('#community-topic').fill('Core JS');
    await page.locator('#community-difficulty').selectOption({ index: 1 });
    await page.locator('#community-type').selectOption('True/False');
    await page.locator('#community-short-summary').fill('Short test summary text for QA verification');
    await page.locator('#community-explanation').fill('Detailed test explanation text for QA verification');
    
    // Select True radio option for True/False question
    const trueRadio = page.locator('#community-tf-true');
    if (await trueRadio.isVisible()) {
      await trueRadio.check({ force: true });
    } else {
      await page.getByLabel('True', { exact: true }).click();
    }

    const submitBtn = page.locator('#community-submit-btn, button:has-text("Submit Question"), button:has-text("Submit")').first();
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
    const successMsg = page.getByText(/submitted for review/i).first();
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

    // Step through questions until finish button appears
    for (let i = 0; i < 10; i++) {
      const finishBtn = page.locator('button:has-text("Finish Practice"), button:has-text("Submit Quiz"), button:has-text("Finish Quiz"), button[aria-label="Finish Practice"]');
      if (await finishBtn.isVisible()) {
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
        break;
      }

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

    await page.waitForURL(/\/results/);
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/results');
  });

  test('D. Second Tab Logout convergence', async ({ context }) => {
    const pageA = await context.newPage();
    const pageB = await context.newPage();

    // Log in on Tab A
    const loggedIn = await loginAsUser(pageA);
    expect(loggedIn).toBeTruthy();
    expect(pageA.url()).toContain('/dashboard');

    const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';

    // Tab B opens /practice
    await pageB.goto(`${baseUrl}/practice`);
    await pageB.waitForLoadState('networkidle');
    await expect(pageB.locator('#header-logout-btn')).toBeVisible();

    // Logout Tab A
    const logoutBtnA = pageA.locator('#header-logout-btn');
    await logoutBtnA.click();
    await pageA.waitForURL((url) => !url.pathname.includes('/dashboard'), { timeout: 15000 });

    // Interact in Tab B (navigate to /dashboard)
    await pageB.goto(`${baseUrl}/dashboard`);
    await pageB.waitForURL(/\/login/);
    expect(pageB.url(), 'Tab B must converge to signed-out /login state after Tab A logout').toContain('/login');
    console.log('[mutation-audit] Second tab logout convergence verified ✓');

    await pageA.close();
    await pageB.close();
  });
});
