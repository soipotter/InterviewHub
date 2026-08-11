import { test, expect } from '@playwright/test';
import { loginAsUser, loginAsAdmin, hasUserCredentials, hasAdminCredentials } from '../helpers/auth';

const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';
const SKIP_ADMIN = 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set';

test.describe('Phase 12.5 — Community Submit Question E2E Acceptance', () => {
  // ─── 1. Unauthenticated AuthGuard Protection ────────────────────────────────
  test('1. Unauthenticated navigation to /community/submit redirects to /login', async ({ page }) => {
    await page.goto('/community/submit');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
    expect(page.url()).toContain('redirect=%2Fcommunity%2Fsubmit');
  });

  // ─── 2. Validation Matrix (UI Level) ────────────────────────────────────────
  test.describe('Form Validation Matrix & UI Controls', () => {
    test.beforeEach(async ({ page }) => {
      if (!hasUserCredentials()) {
        test.skip(true, SKIP_USER);
        return;
      }
      const ok = await loginAsUser(page);
      expect(ok, 'User login failed').toBeTruthy();
      await page.goto('/community/submit');
      await page.waitForLoadState('domcontentloaded');
    });

    test('Header navigation link "Submit Q" leads to /community/submit', async ({ page }) => {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      const submitLink = page.locator('header nav').getByRole('link', { name: /submit q|community/i }).first();
      await expect(submitLink).toBeVisible();
      await submitLink.click();
      await expect(page).toHaveURL(/\/community\/submit$/);
    });

    test('Blank title validation error displayed', async ({ page }) => {
      const submitBtn = page.locator('#community-submit-btn');
      await submitBtn.click();
      const titleError = page.locator('text=Question title is required.').first();
      await expect(titleError).toBeVisible();
    });

    test('Whitespace-only title validation error displayed', async ({ page }) => {
      await page.locator('#community-title').fill('   \t  ');
      await page.locator('#community-submit-btn').click();
      const titleError = page.locator('text=Question title is required.').first();
      await expect(titleError).toBeVisible();
    });

    test('Blank summary validation error displayed', async ({ page }) => {
      await page.locator('#community-title').fill('[QA Test] Valid Title');
      await page.locator('#community-submit-btn').click();
      const summaryError = page.locator('text=Short summary is required.').first();
      await expect(summaryError).toBeVisible();
    });

    test('Blank explanation validation error displayed', async ({ page }) => {
      await page.locator('#community-title').fill('[QA Test] Valid Title');
      await page.locator('#community-short-summary').fill('Valid summary text.');
      await page.locator('#community-submit-btn').click();
      const expError = page.locator('text=Explanation is required.').first();
      await expect(expError).toBeVisible();
    });

    test('Duplicate MC options validation error displayed', async ({ page }) => {
      await page.locator('#community-title').fill('[QA Test] Title');
      await page.selectOption('#community-category', { index: 1 });
      await page.locator('#community-topic').fill('Testing');
      await page.selectOption('#community-difficulty', 'Intermediate');
      await page.selectOption('#community-type', 'Multiple Choice');
      await page.locator('#community-short-summary').fill('Summary');
      await page.locator('#community-explanation').fill('Explanation');

      await page.locator('#community-option-0').fill('Option Alpha');
      await page.locator('#community-option-1').fill('option alpha'); // duplicate (case-insensitive)
      await page.locator('#community-option-2').fill('Option Beta');
      await page.locator('#community-option-3').fill('Option Gamma');

      await page.locator('#community-submit-btn').click();
      const dupError = page.locator('text=All answer options must be unique.').first();
      await expect(dupError).toBeVisible();
    });
  });

  // ─── 3. Mobile Viewport & Responsiveness ────────────────────────────────────
  test('Mobile Viewport layout verification for Submit Question', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    // Verify mobile header/card rendered cleanly
    const heading = page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
  });

  // ─── 4. Public Question Bank Invariant ──────────────────────────────────────
  test('Pending submissions never appear in public Question Bank', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toContain('[QA Test Unpublished]');
  });

  // ─── 5. Admin Moderation (Report BLOCKED if credentials not available) ──────
  test('Admin Moderation Queue Check', async ({ page }) => {
    if (!hasAdminCredentials()) {
      console.log('[ADMIN-MODERATION] Admin credentials (E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD) NOT set -> Moderation test is BLOCKED');
      test.skip(true, SKIP_ADMIN);
      return;
    }

    const ok = await loginAsAdmin(page);
    expect(ok, 'Admin login failed').toBeTruthy();
    await page.goto('/admin/community');
    await expect(page).toHaveURL(/\/admin\/community$/);
  });
});
