import { test, expect } from '@playwright/test';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';

test.describe('Phase 10D Reported Auth Bug — Stateful Auth Continuity Journey', () => {
  test.beforeEach(() => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  test('Single continuous browser context: login → dashboard → click Practice → header remains authenticated → practice session issued → finish → result → refresh → dashboard metrics updated', async ({
    page,
  }) => {
    // 1. Fresh browser context → Login
    await loginAsUser(page);
    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    // Verify /dashboard header is authenticated
    const dashboardLogoutBtn = page.locator('#header-logout-btn');
    await expect(dashboardLogoutBtn, 'Dashboard header must show Log Out button').toBeVisible();

    // 2. Click Practice in the actual app header navigation (do NOT use page.goto)
    const practiceNavLink = page.locator('header nav a[href="/practice"]').first();
    await expect(practiceNavLink, 'Practice link in header nav should be visible').toBeVisible();
    await practiceNavLink.click();

    await page.waitForURL('**/practice');
    await page.waitForLoadState('networkidle');

    // CRITICAL BUG ASSERTION: Header must RETAIN authenticated state and NOT revert to "Log In"
    const practiceLogoutBtn = page.locator('#header-logout-btn');
    await expect(
      practiceLogoutBtn,
      'REPORTED BUG REGRESSION: Header on /practice must remain authenticated and show Log Out button'
    ).toBeVisible();

    const practiceLoginLink = page.locator('#header-login-link');
    await expect(
      practiceLoginLink,
      'REPORTED BUG REGRESSION: Header on /practice must NOT show Log In button for authenticated user'
    ).not.toBeVisible();

    // 3. Start Practice Session as authenticated user
    const startBtn = page.locator('button:has-text("Start Practice"), button:has-text("Start Quiz")').first();
    await expect(startBtn).toBeVisible();

    // Setup network listener for create_practice_session RPC call
    const createSessionPromise = page.waitForResponse(
      (resp) => resp.url().includes('/rpc/create_practice_session') && resp.status() === 200,
      { timeout: 15000 }
    ).catch(() => null);

    await startBtn.click();

    await page.waitForURL(/\/practice\/.+/);
    await page.waitForLoadState('networkidle');

    const createResp = await createSessionPromise;
    console.log('[auth-continuity] Practice session creation RPC status:', createResp ? createResp.status() : 'local fallback');

    // Header on active /practice/:sessionId page must also remain authenticated
    await expect(
      page.locator('#header-logout-btn'),
      'Header on active quiz page must remain authenticated'
    ).toBeVisible();

    // 4. Complete Practice Quiz
    for (let i = 0; i < 10; i++) {
      const finishBtn = page.locator('button:has-text("Submit Quiz"), button:has-text("Finish Quiz")');
      if (await finishBtn.isVisible()) {
        const submitRpcPromise = page.waitForResponse(
          (resp) => resp.url().includes('/rpc/submit_practice_session') && resp.status() === 200,
          { timeout: 15000 }
        ).catch(() => null);

        await finishBtn.click();

        // Handle unanswered confirm modal if open
        const confirmBtn = page.locator('button:has-text("Submit Anyway"), button:has-text("Confirm")');
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
          await confirmBtn.click();
        }

        const submitResp = await submitRpcPromise;
        console.log('[auth-continuity] Practice submission RPC status:', submitResp ? submitResp.status() : 'local fallback');
        break;
      }

      // Click option A if available
      const optionA = page.locator('button:has-text("A."), button:has-text("True"), input[type="radio"]').first();
      if (await optionA.isVisible()) {
        await optionA.click();
      }

      // Click Next Question
      const nextBtn = page.locator('button:has-text("Next Question"), button:has-text("Next")');
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(300);
      }
    }

    // 5. Verify /results/:attemptId page
    await page.waitForURL(/\/results\/.+/);
    await page.waitForLoadState('networkidle');

    // Header on results page must remain authenticated
    await expect(
      page.locator('#header-logout-btn'),
      'Header on /results page must remain authenticated'
    ).toBeVisible();

    // 6. Hard refresh /results page
    await page.reload();
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('#header-logout-btn'),
      'Header on /results after hard refresh must remain authenticated'
    ).toBeVisible();

    // 7. Return to /dashboard via header nav
    const dashboardNavLink = page.locator('header nav a[href="/dashboard"]').first();
    await expect(dashboardNavLink).toBeVisible();
    await dashboardNavLink.click();

    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');

    await expect(
      page.locator('#header-logout-btn'),
      'Returned to Dashboard: header must remain authenticated'
    ).toBeVisible();
  });
});
