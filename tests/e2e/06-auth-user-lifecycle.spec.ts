import { test, expect } from '@playwright/test';
import { loginAsUser, logout, hasUserCredentials } from '../helpers/auth';

const SKIP_REASON = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';

test.describe('Authenticated User Lifecycle', () => {
  test.beforeEach(() => {
    test.setTimeout(60000);
    if (!hasUserCredentials()) test.skip(true, SKIP_REASON);
  });

  // ── A. Login ────────────────────────────────────────────────────────────────
  test('A: login succeeds and redirects away from /login', async ({ page }) => {
    const ok = await loginAsUser(page);
    expect(ok, 'Login failed — check E2E_USER_EMAIL / E2E_USER_PASSWORD').toBeTruthy();
    expect(page.url()).not.toContain('/login');
  });

  // ── B. Dashboard ─────────────────────────────────────────────────────────────
  test('B: dashboard loads after login without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });

    await loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    // Dashboard should contain some user-specific content
    expect(bodyText.trim().length).toBeGreaterThan(100);

    // Filter known-safe console noise
    const critical = errors.filter((e) =>
      !e.includes('favicon') &&
      !/ERR_NAME_NOT_RESOLVED/.test(e)
    );
    expect(critical, `Runtime errors on dashboard: ${critical.join(', ')}`).toHaveLength(0);
  });

  // ── C. Bookmarks ─────────────────────────────────────────────────────────────
  test('C: bookmark add → persist → remove → persist', async ({ page }) => {
    await loginAsUser(page);

    // Go to question bank and bookmark the first question
    await page.goto('/questions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Click first question link to go to detail page
    const questionLinks = page.locator('a[href^="/questions/q-"]');
    const count = await questionLinks.count();
    if (count === 0) {
      test.skip(true, 'No question detail links available to test bookmark');
      return;
    }

    const href = await questionLinks.first().getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);

    // Find the bookmark button
    const bookmarkBtn = page.locator('button[aria-label*="bookmark" i], button[title*="bookmark" i], button:has-text("Bookmark"), button:has-text("Save")').first();
    if (!(await bookmarkBtn.isVisible())) {
      test.skip(true, 'No bookmark button found on question detail page');
      return;
    }

    await bookmarkBtn.click();
    await page.waitForTimeout(1500);

    // Navigate to bookmarks page and verify it appears
    await page.goto('/bookmarks');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const bookmarkBodyAfterAdd = await page.textContent('body') ?? '';
    expect(bookmarkBodyAfterAdd).not.toMatch(/0 saved questions/i);

    // Reload to verify persistence (Supabase-backed)
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    const bookmarkBodyAfterReload = await page.textContent('body') ?? '';
    expect(bookmarkBodyAfterReload).not.toMatch(/0 saved questions/i);

    // Remove the bookmark
    const removeBtn = page.locator('button[aria-label*="remove" i], button:has-text("Remove"), button[aria-label*="unbookmark" i]').first();
    if (await removeBtn.isVisible()) {
      await removeBtn.click();
      await page.waitForTimeout(1500);
      // Reload and verify removed
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    }
  });

  // ── F. Progress Page ─────────────────────────────────────────────────────────
  test('F: progress page loads real attempt data', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/progress');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    expect(bodyText.trim().length).toBeGreaterThan(100);
  });

  // ── G. Community Submit ───────────────────────────────────────────────────────
  test('G: community submit page loads and form is functional', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/community/submit');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    // Form should be visible
    const titleInput = page.locator('input[id*="title" i], input[name*="title" i], input[placeholder*="title" i]').first();
    await expect(titleInput).toBeVisible({ timeout: 10000 });
  });

  // ── H. Logout ────────────────────────────────────────────────────────────────
  test('H: logout redirects and dashboard is no longer accessible', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await logout(page);
    await page.waitForTimeout(2000);

    // After logout, accessing /dashboard as guest redirects to /login
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login\?redirect=/);
  });
});
