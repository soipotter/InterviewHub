import { Page } from '@playwright/test';

export const BASE_URL =
  process.env.E2E_BASE_URL || 'https://interview-hubb.vercel.app';

/** Routes under test */
export const ROUTES = {
  home: '/',
  questions: '/questions',
  practice: '/practice',
  dailyChallenge: '/daily-challenge',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  bookmarks: '/bookmarks',
  progress: '/progress',
  communitySubmit: '/community/submit',
  admin: '/admin',
  adminCommunity: '/admin/community',
};

/** Wait for Supabase-backed content to load */
export async function waitForContent(page: Page, timeout = 15000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/** Navigate and wait for network idle */
export async function navTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('domcontentloaded');
}

/** Check that there is NO horizontal overflow */
export async function assertNoHorizontalOverflow(page: Page) {
  const hasOverflow = await page.evaluate(() => {
    return document.body.scrollWidth > window.innerWidth;
  });
  if (hasOverflow) {
    throw new Error(
      `Horizontal overflow detected. scrollWidth=${await page.evaluate(() => document.body.scrollWidth)}, innerWidth=${await page.evaluate(() => window.innerWidth)}`
    );
  }
}

/** Login helper — reads credentials from env vars */
export async function loginUser(
  page: Page,
  email = process.env.E2E_USER_EMAIL || '',
  password = process.env.E2E_USER_PASSWORD || ''
) {
  await navTo(page, '/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /log in|sign in/i }).click();
  await page.waitForURL(/dashboard|\//, { timeout: 15000 });
}

/** Admin login helper */
export async function loginAdmin(page: Page) {
  return loginUser(
    page,
    process.env.E2E_ADMIN_EMAIL || '',
    process.env.E2E_ADMIN_PASSWORD || ''
  );
}

/** Logout helper */
export async function logout(page: Page) {
  // Try header logout button
  const logoutBtn = page.getByRole('button', { name: /log out|sign out/i });
  if (await logoutBtn.isVisible()) {
    await logoutBtn.click();
  }
}
