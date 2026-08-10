import { test, expect } from '@playwright/test';

test.describe('Security — Route Access & Authorization', () => {
  test('admin route blocked for unauthenticated user', async ({ browser }) => {
    // Use a fresh context to ensure no Supabase session exists
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const bodyText = await page.textContent('body') ?? '';
    // Must not show admin content to unauthenticated users
    const showsAdminContent = bodyText.includes('Moderation') && bodyText.includes('Approve');
    expect(showsAdminContent, 'Admin content visible to unauthenticated user — SECURITY ISSUE').toBeFalsy();
    // Must redirect to login or show unauthorized
    const isLoginPage = url.includes('/login');
    const isUnauthorized = bodyText.match(/unauthorized|access denied|403/i) !== null;
    expect(isLoginPage || isUnauthorized, 'Admin route accessible without auth').toBeTruthy();
    await context.close();
  });

  test('admin/community route blocked for unauthenticated user', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto('/admin/community');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/login');
    await context.close();
  });

  test('dashboard blocked for unauthenticated user', async ({ browser }) => {
    const context = await browser.newContext({ storageState: undefined });
    const page = await context.newPage();
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url, 'Dashboard accessible without auth').toContain('/login');
    await context.close();
  });

  test('no Supabase service-role key visible in page source', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const content = await page.content();
    // Service role keys start with 'service_role' prefix in JWT
    expect(content).not.toContain('service_role');
  });
});

test.describe('Network Failure Handling', () => {
  test('question bank shows error state when Supabase is unreachable', async ({ page }) => {
    // Intercept all Supabase API requests and make them fail
    await page.route(/supabase\.co/, (route) => route.abort());
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    // Should NOT show blank white page — should show some error/empty state
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText.trim().length, 'Blank page shown when Supabase is unreachable').toBeGreaterThan(50);
    // Should NOT have an uncaught React crash
    expect(bodyText).not.toMatch(/cannot read properties of undefined/i);
  });

  test('daily challenge shows error state when Supabase is unreachable', async ({ page }) => {
    await page.route(/supabase\.co/, (route) => route.abort());
    await page.goto('/daily-challenge');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText.trim().length, 'Blank page on daily challenge with Supabase down').toBeGreaterThan(50);
  });
});
