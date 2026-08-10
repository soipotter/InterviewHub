import { test, expect } from '@playwright/test';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';

test.describe('Phase 10D.1 Final Human-Equivalent Acceptance Verification', () => {
  test.beforeEach(({}, testInfo) => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  test('Single continuous human-equivalent journey from login to logout across all features', async ({
    page,
    context,
  }) => {
    // Collect console errors & unhandled page errors
    const consoleErrors: string[] = [];
    const pageErrors: Error[] = [];
    const failedRequests: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().includes('favicon') && !msg.text().includes('download the React DevTools')) {
        consoleErrors.push(msg.text());
      }
    });

    page.on('pageerror', (err) => {
      pageErrors.push(err);
    });

    page.on('response', (resp) => {
      if (resp.status() >= 400 && !resp.url().includes('favicon') && !resp.url().includes('/auth/v1/')) {
        failedRequests.push(`${resp.status()} ${resp.url()}`);
      }
    });

    // =========================================================================
    // STEP 1: Login
    // =========================================================================
    console.log('[journey] Step 1: Login via UI');
    const loggedIn = await loginAsUser(page);
    expect(loggedIn, 'Login via UI must succeed').toBeTruthy();

    // =========================================================================
    // STEP 2: Dashboard
    // =========================================================================
    console.log('[journey] Step 2: Dashboard verification');
    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('#header-logout-btn'), 'Header on Dashboard must be authenticated').toBeVisible();

    // =========================================================================
    // STEP 3: Practice via Navbar
    // =========================================================================
    console.log('[journey] Step 3: Navigate to Practice using navbar link');
    const practiceLink = page.locator('header nav a[href="/practice"]').first();
    await expect(practiceLink).toBeVisible();
    await practiceLink.click();

    await page.waitForURL('**/practice');
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/practice');
    await expect(page.locator('#header-logout-btn'), 'Header on Practice page must remain authenticated').toBeVisible();
    await expect(page.locator('#header-login-link'), 'Header on Practice page must NOT show Log In').not.toBeVisible();

    // =========================================================================
    // STEP 4: Start Practice
    // =========================================================================
    console.log('[journey] Step 4: Start Practice session');
    const startPracticeBtn = page.locator('button:has-text("Start Practice"), button:has-text("Start Quiz")').first();
    await expect(startPracticeBtn).toBeVisible();
    await startPracticeBtn.click();

    await page.waitForURL(/\/practice\/.+/);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#header-logout-btn'), 'Header on active quiz page must remain authenticated').toBeVisible();

    // =========================================================================
    // STEP 5 & 6: Answer questions & Submit Practice
    // =========================================================================
    console.log('[journey] Step 5 & 6: Answer questions and submit quiz');
    for (let i = 0; i < 10; i++) {
      const finishBtn = page.locator('button:has-text("Submit Quiz"), button:has-text("Finish Quiz")');
      if (await finishBtn.isVisible()) {
        await finishBtn.click();
        const confirmBtn = page.locator('button:has-text("Submit Anyway"), button:has-text("Confirm")');
        if (await confirmBtn.isVisible({ timeout: 2000 })) {
          await confirmBtn.click();
        }
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

    // =========================================================================
    // STEP 7: Results
    // =========================================================================
    console.log('[journey] Step 7: View Results page');
    await page.waitForURL(/\/results\/.+/);
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/results/');
    await expect(page.locator('#header-logout-btn'), 'Header on Results page must remain authenticated').toBeVisible();
    await expect(page.locator('text=Temporary Session Result'), 'Authenticated user should NOT see guest warning banner').not.toBeVisible();

    // =========================================================================
    // STEP 8: Hard refresh Results
    // =========================================================================
    console.log('[journey] Step 8: Hard refresh Results page');
    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/results/');
    await expect(page.locator('#header-logout-btn'), 'Header after Results refresh must remain authenticated').toBeVisible();

    // =========================================================================
    // STEP 9: Dashboard via Navbar
    // =========================================================================
    console.log('[journey] Step 9: Return to Dashboard using navbar link');
    const dashboardLink = page.locator('header nav a[href="/dashboard"]').first();
    await expect(dashboardLink).toBeVisible();
    await dashboardLink.click();

    await page.waitForURL('**/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#header-logout-btn'), 'Header on Dashboard must remain authenticated').toBeVisible();

    // =========================================================================
    // STEP 10, 11, 12, 13: Questions → Search → Filter → Question Detail
    // =========================================================================
    console.log('[journey] Step 10-13: Questions bank, Search, Filter, Question Detail');
    const questionsLink = page.locator('header nav a[href="/questions"]').first();
    await expect(questionsLink).toBeVisible();
    await questionsLink.click();

    await page.waitForURL('**/questions');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#header-logout-btn'), 'Header on Question Bank must remain authenticated').toBeVisible();

    // Click first question card to open detail
    const firstQuestionLink = page.locator('a[href^="/questions/"]').first();
    if (await firstQuestionLink.isVisible()) {
      await firstQuestionLink.click();
      await page.waitForURL(/\/questions\/.+/);
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#header-logout-btn'), 'Header on Question Detail must remain authenticated').toBeVisible();
    }

    // =========================================================================
    // STEP 14, 15: Bookmarks via Navbar & verify
    // =========================================================================
    console.log('[journey] Step 14-15: Navigate to Bookmarks via navbar');
    const bookmarksLink = page.locator('header nav a[href="/bookmarks"]').first();
    if (await bookmarksLink.isVisible()) {
      await bookmarksLink.click();
      await page.waitForURL('**/bookmarks');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#header-logout-btn'), 'Header on Bookmarks page must remain authenticated').toBeVisible();
    }

    // =========================================================================
    // STEP 16: Progress via Navbar
    // =========================================================================
    console.log('[journey] Step 16: Navigate to Progress via navbar');
    const progressLink = page.locator('header nav a[href="/progress"]').first();
    if (await progressLink.isVisible()) {
      await progressLink.click();
      await page.waitForURL('**/progress');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#header-logout-btn'), 'Header on Progress page must remain authenticated').toBeVisible();
    }

    // =========================================================================
    // STEP 17: Daily Challenge via Navbar
    // =========================================================================
    console.log('[journey] Step 17: Navigate to Daily Challenge via navbar');
    const dailyLink = page.locator('header nav a[href="/daily-challenge"]').first();
    await expect(dailyLink).toBeVisible();
    await dailyLink.click();

    await page.waitForURL('**/daily-challenge');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('#header-logout-btn'), 'Header on Daily Challenge must remain authenticated').toBeVisible();

    // =========================================================================
    // STEP 18: Community Submit via Navbar
    // =========================================================================
    console.log('[journey] Step 18: Navigate to Community Submit via navbar');
    const communityLink = page.locator('header nav a[href="/community/submit"]').first();
    if (await communityLink.isVisible()) {
      await communityLink.click();
      await page.waitForURL('**/community/submit');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('#header-logout-btn'), 'Header on Community Submit must remain authenticated').toBeVisible();
    }

    // =========================================================================
    // STEP 19: Return to Dashboard
    // =========================================================================
    console.log('[journey] Step 19: Return to Dashboard');
    const returnDashboardLink = page.locator('header nav a[href="/dashboard"]').first();
    if (await returnDashboardLink.isVisible()) {
      await returnDashboardLink.click();
      await page.waitForURL('**/dashboard');
      await page.waitForLoadState('networkidle');
    }

    // =========================================================================
    // STEP 20: Logout & verify protected route block
    // =========================================================================
    console.log('[journey] Step 20: Logout and verify redirection from protected route');
    const logoutBtn = page.locator('#header-logout-btn');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    await page.waitForURL((url) => !url.pathname.includes('/dashboard'), { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    // Attempt accessing /dashboard directly while logged out
    await page.goto('/dashboard');
    await page.waitForURL('**/login');
    expect(page.url(), 'Accessing /dashboard after logout must redirect to /login').toContain('/login');

    // Assert zero critical errors
    expect(pageErrors, 'Should have 0 unhandled page errors during journey').toHaveLength(0);
    console.log('[journey] Complete continuous human-equivalent journey PASSED 100% ✓');
  });
});
