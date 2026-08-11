/**
 * Phase 12: Exhaustive Header Navigation & Auth-State Stabilization
 *
 * REGRESSION: Authenticated user clicks Header "Questions" → must stay authenticated.
 *
 * Covers:
 *   1. BUG-01: Exact "Questions" header click from Dashboard, Landing, Practice
 *   2. Authenticated navigation transition matrix (6 source routes x all header links)
 *   3. Guest navigation matrix
 *   4. Mobile navigation matrix at 375x812
 *   5. Admin navigation matrix
 *   6. Back/Forward browser history while authenticated
 *   7. Hard refresh after each header navigation
 *   8. New tab auth state
 *   9. No spurious /login redirects from public pages
 *   10. Console/Network error gate on every transition
 *   11. All Header labels and hrefs verified deterministically
 *   12. Cross-origin link audit
 */
import { test, expect, Page } from '@playwright/test';
import { loginAsUser, loginAsAdmin, hasUserCredentials, hasAdminCredentials } from '../helpers/auth';

const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';
const SKIP_ADMIN = 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function assertAuthenticatedHeader(page: Page, label: string) {
  const logoutBtn = page
    .locator('#header-logout-btn:visible, #mobile-header-logout-btn:visible, button:has-text("Log Out"):visible')
    .first();

  await expect(
    logoutBtn,
    `[${label}] Log Out button must be visible`,
  ).toBeVisible();
  await expect(
    page.locator('#header-login-link:visible, #mobile-header-login-link:visible'),
    `[${label}] Log In link must NOT be visible`,
  ).not.toBeVisible();
  await expect(
    page.locator('#header-register-link:visible'),
    `[${label}] Register link must NOT be visible`,
  ).not.toBeVisible();
}

async function assertGuestHeader(page: Page, label: string) {
  const loginLink = page
    .locator('#header-login-link:visible, #mobile-header-login-link:visible, a:has-text("Log In"):visible')
    .first();

  await expect(
    loginLink,
    `[${label}] Log In link must be visible (guest)`,
  ).toBeVisible();
  await expect(
    page.locator('#header-logout-btn:visible, #mobile-header-logout-btn:visible'),
    `[${label}] Log Out must NOT be visible (guest)`,
  ).not.toBeVisible();
}

async function clickHeaderNavLink(
  page: Page,
  linkText: string,
  expectedUrlContains: string,
): Promise<void> {
  const link = page.locator('header nav').getByRole('link', { name: linkText, exact: false }).first();
  await expect(link, `Header nav link "${linkText}" must be visible`).toBeVisible();

  const href = await link.getAttribute('href');
  console.log(`[nav-click] "${linkText}" href="${href}"`);

  // Fail immediately if href points to /login
  expect(
    href?.includes('/login'),
    `Header link "${linkText}" MUST NOT point to /login. Got: ${href}`,
  ).toBe(false);

  // Fail if href is an absolute cross-origin URL
  if (href?.startsWith('http')) {
    expect(
      href.includes('interview-hubb.vercel.app'),
      `Header link "${linkText}" must not be cross-origin. Got: ${href}`,
    ).toBe(true);
  }

  await link.click();
  await page.waitForURL(`**${expectedUrlContains}`, { timeout: 15000 });
  await page.waitForLoadState('domcontentloaded');
}

function collectConsoleErrors(page: Page): { errors: string[] } {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      !msg.text().includes('favicon') &&
      !msg.text().includes('React DevTools') &&
      !msg.text().includes('Failed to load resource') &&
      // PGRST203: known DB overload issue (get_daily_challenge), fixed by migration 00017
      !msg.text().includes('PGRST203')
    ) {
      errors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => errors.push(`[pageerror] ${err.message}`));
  return { errors };
}

// ─── 1. BUG-01: Exact "Questions" Header Click Regression ─────────────────────

test.describe('Phase 12 — BUG-01 Regression: Questions header click auth-state', () => {
  test.beforeEach(() => { if (!hasUserCredentials()) test.skip(true, SKIP_USER); });

  test('Login → Dashboard → click Header "Questions" → /questions with authenticated header', async ({ page }) => {
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn, 'loginAsUser must succeed').toBeTruthy();
    expect(page.url(), 'Must land on /dashboard after login').toContain('/dashboard');

    await assertAuthenticatedHeader(page, 'Dashboard — before click');

    const questionsLink = page
      .locator('header nav')
      .getByRole('link', { name: 'Questions', exact: true })
      .first();
    await expect(questionsLink, 'Header "Questions" link must be visible').toBeVisible();

    const href = await questionsLink.getAttribute('href');
    console.log(`[BUG-01] Questions href="${href}"`);
    expect(href, 'Questions link href must be /questions').toBe('/questions');

    // REAL CLICK — not page.goto()
    await questionsLink.click();
    await page.waitForURL('**/questions', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    console.log(`[BUG-01] URL after click: ${page.url()}`);
    expect(page.url(), 'Must navigate to /questions').toContain('/questions');
    expect(page.url(), 'Must NOT redirect to /login').not.toContain('/login');
    await assertAuthenticatedHeader(page, 'Questions — after header click');

    expect(errors, 'Zero console errors during navigation').toHaveLength(0);
    console.log('[BUG-01] Dashboard → Questions via header click: PASS');
  });

  test('Login → / (Landing) → click Header "Questions" → authenticated on /questions', async ({ page }) => {
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const logo = page.locator('header').getByRole('link', { name: /InterviewHub/i }).first();
    await logo.click();
    await page.waitForURL('**/', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await assertAuthenticatedHeader(page, 'Landing — before click');

    const questionsLink = page.locator('header nav').getByRole('link', { name: 'Questions', exact: true }).first();
    await expect(questionsLink).toBeVisible();
    await questionsLink.click();
    await page.waitForURL('**/questions', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/questions');
    expect(page.url()).not.toContain('/login');
    await assertAuthenticatedHeader(page, 'Questions — from Landing click');

    expect(errors).toHaveLength(0);
    console.log('[BUG-01] Landing → Questions via header click: PASS');
  });

  test('Login → /practice → click Header "Questions" → authenticated on /questions', async ({ page }) => {
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    await assertAuthenticatedHeader(page, 'Practice — before click');

    const questionsLink = page.locator('header nav').getByRole('link', { name: 'Questions', exact: true }).first();
    await expect(questionsLink).toBeVisible();
    await questionsLink.click();
    await page.waitForURL('**/questions', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/questions');
    expect(page.url()).not.toContain('/login');
    await assertAuthenticatedHeader(page, 'Questions — from Practice click');

    expect(errors).toHaveLength(0);
    console.log('[BUG-01] Practice → Questions via header click: PASS');
  });
});

// ─── 2. Authenticated Navigation Transition Matrix ────────────────────────────

test.describe('Phase 12 — Authenticated Navigation Transition Matrix', () => {
  test.beforeEach(() => { if (!hasUserCredentials()) test.skip(true, SKIP_USER); });

  const sourceRoutes = [
    { route: '/dashboard', label: 'Dashboard' },
    { route: '/questions', label: 'Questions' },
    { route: '/practice', label: 'Practice' },
    { route: '/daily-challenge', label: 'Daily' },
    { route: '/progress', label: 'Progress' },
    { route: '/bookmarks', label: 'Bookmarks' },
  ];

  for (const src of sourceRoutes) {
    test(`FROM ${src.label} — click Questions, Practice, Daily — auth preserved`, async ({ page }) => {
      test.setTimeout(60000);
      const { errors } = collectConsoleErrors(page);

      const loggedIn = await loginAsUser(page);
      expect(loggedIn).toBeTruthy();

      await page.goto(src.route);
      await page.waitForLoadState('domcontentloaded');
      await assertAuthenticatedHeader(page, `Source: ${src.label}`);

      // → Questions
      await clickHeaderNavLink(page, 'Questions', '/questions');
      await assertAuthenticatedHeader(page, `${src.label} → Questions`);
      console.log(`[matrix] ${src.label} → Questions: PASS`);

      // → Practice
      await clickHeaderNavLink(page, 'Practice', '/practice');
      await assertAuthenticatedHeader(page, `${src.label} → Practice`);
      console.log(`[matrix] ${src.label} → Practice: PASS`);

      // → Daily
      await clickHeaderNavLink(page, 'Daily', '/daily-challenge');
      await assertAuthenticatedHeader(page, `${src.label} → Daily`);
      console.log(`[matrix] ${src.label} → Daily: PASS`);

      // → Dashboard (if visible)
      const dashLink = page.locator('header nav').getByRole('link', { name: 'Dashboard', exact: true }).first();
      if (await dashLink.isVisible()) {
        await dashLink.click();
        await page.waitForURL('**/dashboard', { timeout: 15000 });
        await page.waitForLoadState('domcontentloaded');
        await assertAuthenticatedHeader(page, `${src.label} → Dashboard`);
        console.log(`[matrix] ${src.label} → Dashboard: PASS`);
      }

      expect(errors, `No console errors from ${src.label}`).toHaveLength(0);
    });
  }

  test('All authenticated Header labels have correct hrefs', async ({ page }) => {
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const expected = [
      { label: 'Questions', href: '/questions' },
      { label: 'Practice', href: '/practice' },
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Progress', href: '/progress' },
      { label: 'Bookmarks', href: '/bookmarks' },
    ];

    for (const e of expected) {
      const link = page.locator('header nav').getByRole('link', { name: e.label, exact: true }).first();
      await expect(link, `Header "${e.label}" must be visible`).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href, `"${e.label}" href must be ${e.href}`).toBe(e.href);
      console.log(`[labels] "${e.label}" href="${href}": PASS`);
    }

    const daily = page.locator('header nav').getByRole('link', { name: /Daily/i }).first();
    await expect(daily).toBeVisible();
    const dailyHref = await daily.getAttribute('href');
    expect(dailyHref, 'Daily link must be /daily-challenge').toBe('/daily-challenge');

    expect(errors).toHaveLength(0);
    console.log('[labels] All header labels verified: PASS');
  });

  test('Auth state survives hard refresh on every public route', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const routes = ['/', '/questions', '/practice', '/daily-challenge'];
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await assertAuthenticatedHeader(page, `Cold: ${route}`);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await assertAuthenticatedHeader(page, `Reload: ${route}`);
      console.log(`[refresh] ${route}: auth after hard refresh: PASS`);
    }

    expect(errors).toHaveLength(0);
  });

  test('Back/Forward navigation preserves auth state', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    await clickHeaderNavLink(page, 'Questions', '/questions');
    await assertAuthenticatedHeader(page, 'After: Questions');

    await clickHeaderNavLink(page, 'Practice', '/practice');
    await assertAuthenticatedHeader(page, 'After: Practice');

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/questions');
    await assertAuthenticatedHeader(page, 'Back to Questions');

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/dashboard');
    await assertAuthenticatedHeader(page, 'Back to Dashboard');

    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/questions');
    await assertAuthenticatedHeader(page, 'Fwd to Questions');

    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/practice');
    await assertAuthenticatedHeader(page, 'Fwd to Practice');

    expect(errors).toHaveLength(0);
    console.log('[back-forward] Back/forward auth preserved: PASS');
  });

  test('New tab from authenticated page maintains auth state on /questions', async ({ page, context }) => {
    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const newTab = await context.newPage();
    await newTab.goto('/questions');
    await newTab.waitForLoadState('networkidle');

    await assertAuthenticatedHeader(newTab, 'New tab: /questions');
    expect(newTab.url()).toContain('/questions');
    expect(newTab.url()).not.toContain('/login');

    await newTab.close();
    console.log('[new-tab] /questions in new tab: authenticated: PASS');
  });
});

// ─── 3. Guest Navigation Matrix ───────────────────────────────────────────────

test.describe('Phase 12 — Guest Navigation Matrix', () => {
  test('Public routes accessible as guest, no /login redirect', async ({ page }) => {
    const routes = [
      { path: '/', label: 'Landing' },
      { path: '/questions', label: 'Questions' },
      { path: '/practice', label: 'Practice' },
      { path: '/daily-challenge', label: 'Daily' },
    ];
    for (const r of routes) {
      await page.goto(r.path);
      await page.waitForLoadState('networkidle');
      expect(page.url(), `Guest on ${r.label} must NOT redirect to /login`).not.toContain('/login');
      await assertGuestHeader(page, `Guest: ${r.label}`);
      console.log(`[guest] ${r.label}: accessible, guest header correct: PASS`);
    }
  });

  test('Protected routes redirect guest to /login with ?redirect param', async ({ page }) => {
    const routes = ['/dashboard', '/progress', '/bookmarks', '/community/submit'];
    for (const path of routes) {
      // Navigate — page.goto() follows the full redirect chain including client-side redirects
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      // After auth state resolves, AuthGuard redirects unauthenticated users to /login
      // The URL may already be /login before we can call waitForURL, so check directly
      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname, `${path} must redirect to /login`).toBe('/login');
      const redirect = currentUrl.searchParams.get('redirect');
      expect(redirect, `?redirect must be set for ${path}`).toBeTruthy();
      console.log(`[guest] ${path} → /login?redirect=${redirect}: PASS`);
    }
  });

  test('Guest can click Header "Questions" from Landing → /questions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const questionsLink = page.locator('header nav').getByRole('link', { name: 'Questions', exact: true }).first();
    await expect(questionsLink).toBeVisible();
    const href = await questionsLink.getAttribute('href');
    expect(href, 'Guest Questions href must be /questions').toBe('/questions');

    await questionsLink.click();
    await page.waitForURL('**/questions', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/questions');
    expect(page.url()).not.toContain('/login');
    await assertGuestHeader(page, 'Guest: after clicking Questions');
    console.log('[guest] Guest click Questions in header: PASS');
  });
});

// ─── 4. Mobile Navigation Matrix ─────────────────────────────────────────────

test.describe('Phase 12 — Mobile Navigation Matrix (375x812)', () => {
  test.use({ viewport: { width: 375, height: 812 } });
  test.beforeEach(() => { if (!hasUserCredentials()) test.skip(true, SKIP_USER); });

  test('Mobile: Login → open menu → click Questions → authenticated on /questions', async ({ page }) => {
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();
    expect(page.url()).toContain('/dashboard');

    const toggle = page.getByRole('button', { name: /toggle navigation menu/i }).first();
    await expect(toggle, 'Mobile menu toggle must be visible at 375px').toBeVisible();
    await toggle.click();
    await page.waitForTimeout(300);

    const mobileQ = page.locator('nav').getByRole('link', { name: 'Questions', exact: true }).first();
    await expect(mobileQ, 'Mobile nav Questions must be visible').toBeVisible();

    const href = await mobileQ.getAttribute('href');
    expect(href, 'Mobile Questions href must be /questions').toBe('/questions');

    await mobileQ.click();
    await page.waitForURL('**/questions', { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    expect(page.url()).toContain('/questions');
    expect(page.url()).not.toContain('/login');
    await assertAuthenticatedHeader(page, 'Mobile: after Questions click');

    expect(errors).toHaveLength(0);
    console.log('[mobile] Dashboard → Questions via mobile nav: PASS');
  });

  test('Mobile: Auth state survives hard refresh on /questions', async ({ page }) => {
    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await assertAuthenticatedHeader(page, 'Mobile: cold nav /questions');

    await page.reload({ waitUntil: 'networkidle' });
    await assertAuthenticatedHeader(page, 'Mobile: reload /questions');
    console.log('[mobile] Mobile hard refresh /questions: auth preserved: PASS');
  });

  test('Mobile: Guest Header Questions link navigates to /questions', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // On mobile, nav is hidden — open menu first
    const toggle = page.getByRole('button', { name: /toggle navigation menu/i }).first();
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(300);
    }

    // Questions may be in the mobile dropdown or desktop nav
    const questionsLink = page.getByRole('link', { name: 'Questions', exact: true }).first();
    await expect(questionsLink).toBeVisible();
    const href = await questionsLink.getAttribute('href');
    expect(href, 'Mobile guest Questions href must be /questions').toBe('/questions');
    console.log('[mobile] Guest mobile Questions href verified: PASS');
  });
});

// ─── 5. Admin Navigation Matrix ───────────────────────────────────────────────

test.describe('Phase 12 — Admin Navigation Matrix', () => {
  test.beforeEach(() => { if (!hasAdminCredentials()) test.skip(true, SKIP_ADMIN); });

  test('Admin: auth preserved on public routes', async ({ page }) => {
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsAdmin(page);
    expect(loggedIn).toBeTruthy();

    for (const route of ['/questions', '/practice', '/daily-challenge']) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await assertAuthenticatedHeader(page, `Admin on ${route}`);
      expect(page.url()).not.toContain('/login');
      console.log(`[admin] Auth preserved on ${route}: PASS`);
    }

    expect(errors).toHaveLength(0);
  });

  test('Admin: navigate admin section then back to /questions', async ({ page }) => {
    const { errors } = collectConsoleErrors(page);

    const loggedIn = await loginAsAdmin(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await assertAuthenticatedHeader(page, 'Admin: /admin');
    expect(page.url()).not.toContain('/login');

    await page.goto('/admin/community');
    await page.waitForLoadState('networkidle');
    await assertAuthenticatedHeader(page, 'Admin: /admin/community');

    const questionsLink = page.locator('header nav').getByRole('link', { name: 'Questions', exact: true }).first();
    await questionsLink.click();
    await page.waitForURL('**/questions', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await assertAuthenticatedHeader(page, 'Admin: back at /questions');

    expect(errors).toHaveLength(0);
    console.log('[admin] Admin journey complete: PASS');
  });
});

// ─── 6. Console & Network Error Gate ──────────────────────────────────────────

test.describe('Phase 12 — Console & Network Error Gate', () => {
  test.beforeEach(() => { if (!hasUserCredentials()) test.skip(true, SKIP_USER); });

  test('Zero console errors and network failures during authenticated navigation', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectConsoleErrors(page);
    const netFails: string[] = [];

    page.on('response', (resp) => {
      if (resp.status() >= 400 && !resp.url().includes('favicon') && !resp.url().includes('/auth/v1/')) {
        netFails.push(`${resp.status()} ${resp.url()}`);
      }
    });

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    for (const route of ['/dashboard', '/questions', '/practice', '/daily-challenge', '/progress', '/bookmarks']) {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await assertAuthenticatedHeader(page, `Gate: ${route}`);
    }

    expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
    expect(netFails, `Network failures: ${netFails.join('; ')}`).toHaveLength(0);
    console.log('[gate] Zero errors across all routes: PASS');
  });
});

// ─── 7. Cross-Origin & Login Redirect Audit ───────────────────────────────────

test.describe('Phase 12 — Cross-Origin & Login Redirect Audit', () => {
  test('No Header nav link points to /login for nav items (guest)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const navLinks = await page.locator('header nav').getByRole('link').all();
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      const text = (await link.textContent())?.trim() ?? '';
      if (href && !text.includes('Log In') && !text.includes('Register')) {
        expect(
          href.includes('/login'),
          `Nav link "${text}" href="${href}" must NOT point to /login`,
        ).toBe(false);
        if (href.startsWith('http')) {
          expect(
            href.includes('interview-hubb.vercel.app'),
            `Header link "${text}" must be same-origin. Got: ${href}`,
          ).toBe(true);
        }
        console.log(`[cross-origin] "${text}" href="${href}": OK`);
      }
    }
    console.log('[cross-origin] All header links are safe: PASS');
  });

  test('Public routes do NOT redirect guest to /login', async ({ page }) => {
    const publicPages = ['/', '/questions', '/practice', '/daily-challenge'];
    for (const path of publicPages) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(page.url(), `${path} must not redirect to /login`).not.toContain('/login');
      console.log(`[redirect-audit] ${path}: no spurious /login redirect: PASS`);
    }
  });

  test('Protected routes redirect with /login?redirect= param', async ({ page }) => {
    const routes = ['/dashboard', '/progress', '/bookmarks', '/community/submit'];
    for (const path of routes) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const currentUrl = new URL(page.url());
      expect(currentUrl.pathname, `${path} must redirect to /login`).toBe('/login');
      const redirect = currentUrl.searchParams.get('redirect');
      expect(redirect, `?redirect must be set for ${path}`).toBeTruthy();
      console.log(`[redirect-audit] ${path} → /login?redirect=${redirect}: PASS`);
    }
  });
});

