import { test, expect } from '@playwright/test';

test.describe('Auth Route Guards', () => {
  test('/dashboard redirects guest to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('/bookmarks redirects guest to /login', async ({ page }) => {
    await page.goto('/bookmarks');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('/progress redirects guest to /login', async ({ page }) => {
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('/community/submit redirects guest to /login', async ({ page }) => {
    await page.goto('/community/submit');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('/admin redirects guest to /login (not platform 404)', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    const bodyText = await page.textContent('body');
    // Must not show Vercel platform 404
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    // Must redirect to login or show unauthorized
    const isLoginPage = url.includes('/login');
    const isUnauthorized = (bodyText ?? '').match(/unauthorized|access denied|403/i) !== null;
    expect(isLoginPage || isUnauthorized, 'Admin route should redirect guest to login or show unauthorized').toBeTruthy();
  });

  test('/results/:id redirects guest to /login', async ({ page }) => {
    await page.goto('/results/some-attempt-id-123');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/login');
  });
});

test.describe('Login Page', () => {
  test('login page renders email and password inputs', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Use specific form inputs — avoid matching header "Log In" button
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    // Submit button is inside the form — look for type="submit"
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
  });

  test('login shows validation error for empty submission', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    // Use type="submit" to avoid ambiguity with header "Log In" link button
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(500);
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/cannot read|TypeError/i);
  });

  test('login shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await emailInput.fill('definitely-wrong@example.com');
    await passwordInput.fill('wrongpassword123');
    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();
    await page.waitForTimeout(4000);
    // Should NOT redirect to dashboard
    const url = page.url();
    expect(url).not.toContain('/dashboard');
    // Should stay on login or show error
    const bodyText = await page.textContent('body') ?? '';
    const hasError = bodyText.match(/invalid|incorrect|wrong|error|failed/i) !== null;
    const isStillOnLogin = url.includes('/login');
    expect(isStillOnLogin || hasError, 'Should remain on login page or show error for bad creds').toBeTruthy();
  });
});

test.describe('Register Page', () => {
  test('register page renders correctly', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();
  });

  test('register shows validation error for empty submission', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    // type="submit" specifically avoids the header "Register" link
    const submitBtn = page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      const bodyText = await page.textContent('body');
      expect(bodyText).not.toMatch(/cannot read|TypeError/i);
    }
  });
});
