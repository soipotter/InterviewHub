import { Page } from '@playwright/test';

/**
 * Log in as a regular user via the login form UI.
 * Returns false if credentials are not configured.
 */
export async function loginAsUser(page: Page): Promise<boolean> {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    console.warn('[auth-helper] E2E_USER_EMAIL or E2E_USER_PASSWORD not set — skipping authenticated test');
    return false;
  }

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();

  try {
    // Wait for redirect away from /login — either to /dashboard or /
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
    return true;
  } catch {
    const bodyText = await page.textContent('body') ?? '';
    console.error('[auth-helper] Login failed. Page text:', bodyText.slice(0, 300));
    return false;
  }
}

/**
 * Log in as admin via the login form UI.
 */
export async function loginAsAdmin(page: Page): Promise<boolean> {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('[auth-helper] E2E_ADMIN_EMAIL or E2E_ADMIN_PASSWORD not set — skipping admin test');
    return false;
  }

  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.locator('input[type="email"]').first().fill(email);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();

  try {
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20000 });
    return true;
  } catch {
    const bodyText = await page.textContent('body') ?? '';
    console.error('[auth-helper] Admin login failed. Page text:', bodyText.slice(0, 300));
    return false;
  }
}

/**
 * Perform logout via the header button.
 */
export async function logout(page: Page): Promise<void> {
  const logoutBtn = page.locator('#header-logout-btn, #mobile-header-logout-btn').first();
  await logoutBtn.click();
  await page.waitForTimeout(1000);
}

/**
 * Check if credentials are available (for conditional skip).
 */
export function hasUserCredentials(): boolean {
  return Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);
}

export function hasAdminCredentials(): boolean {
  return Boolean(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);
}
