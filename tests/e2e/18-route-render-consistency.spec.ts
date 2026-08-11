import { test, expect, Page } from '@playwright/test';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

const SKIP_USER = 'QA user credentials (E2E_USER_EMAIL, E2E_USER_PASSWORD) not provided in environment';

interface PageIdentity {
  route: string;
  label: string;
  expectedHeadingPattern: RegExp;
}

const PAGE_IDENTITIES: Record<string, PageIdentity> = {
  landing: {
    route: '/',
    label: 'Landing',
    expectedHeadingPattern: /master modern tech interviews|interviewhub/i,
  },
  questions: {
    route: '/questions',
    label: 'Question Bank',
    expectedHeadingPattern: /technical interview questions|frontend question bank|question bank/i,
  },
  practice: {
    route: '/practice',
    label: 'Practice Builder',
    expectedHeadingPattern: /custom practice builder|practice quizzes|practice session/i,
  },
  dashboard: {
    route: '/dashboard',
    label: 'Dashboard',
    expectedHeadingPattern: /welcome back|developer dashboard|dashboard/i,
  },
  progress: {
    route: '/progress',
    label: 'Progress',
    expectedHeadingPattern: /learning progress|skill analytics|progress/i,
  },
  bookmarks: {
    route: '/bookmarks',
    label: 'Bookmarks',
    expectedHeadingPattern: /bookmarked questions|revision bookmarks|saved questions/i,
  },
  daily: {
    route: '/daily-challenge',
    label: 'Daily Challenge',
    expectedHeadingPattern: /daily challenge|today's challenge|loading today's challenge/i,
  },
  community: {
    route: '/community/submit',
    label: 'Community Submit',
    expectedHeadingPattern: /submit a community question|submit a question|community contribution/i,
  },
};

async function assertPageIdentity(page: Page, identityKey: string) {
  const identity = PAGE_IDENTITIES[identityKey];
  if (!identity) throw new Error(`Unknown identity key: ${identityKey}`);

  // 1. Assert URL matches
  await expect(page).toHaveURL(new RegExp(identity.route === '/' ? '^[^?#]*//[^/]+/$' : identity.route.replace('/', '\\/')));

  // 2. Assert NEW page heading or title element is visible
  const heading = page.locator('h1, h2, h3, p, div').filter({ hasText: identity.expectedHeadingPattern }).first();
  await expect(heading, `Page ${identity.label} heading should be visible`).toBeVisible({ timeout: 15000 });

  // 3. Assert active nav link matches if on desktop viewport
  const viewport = page.viewportSize();
  const isDesktop = !viewport || viewport.width >= 768;

  if (isDesktop && ['questions', 'practice', 'dashboard', 'progress', 'bookmarks', 'daily'].includes(identityKey)) {
    const navTextMap: Record<string, string> = {
      questions: 'Questions',
      practice: 'Practice',
      dashboard: 'Dashboard',
      progress: 'Progress',
      bookmarks: 'Bookmarks',
      daily: 'Daily',
    };
    const activeNavText = navTextMap[identityKey];
    if (activeNavText) {
      const activeLink = page.locator('header nav').locator('a', { hasText: new RegExp(activeNavText, 'i') }).first();
      await expect(activeLink).toBeVisible();
    }
  }
}

async function assertOldPageDisappeared(page: Page, oldIdentityKey: string) {
  const oldIdentity = PAGE_IDENTITIES[oldIdentityKey];
  if (!oldIdentity || oldIdentityKey === 'landing') return;

  const oldHeading = page.locator('h1, h2').filter({ hasText: oldIdentity.expectedHeadingPattern });
  const count = await oldHeading.count();
  if (count > 0) {
    await expect(oldHeading.first()).not.toBeVisible();
  }
}

function collectErrors(page: Page) {
  const errors: string[] = [];
  const netFailures: string[] = [];

  page.on('console', (msg) => {
    if (
      msg.type() === 'error' &&
      !msg.text().includes('favicon') &&
      !msg.text().includes('React DevTools') &&
      !msg.text().includes('Failed to load resource') &&
      !msg.text().includes('PGRST203')
    ) {
      errors.push(msg.text());
    }
  });

  page.on('requestfailed', (req) => {
    const url = req.url();
    if (!url.includes('favicon') && !url.includes('google-analytics')) {
      netFailures.push(`${req.method()} ${url} - ${req.failure()?.errorText}`);
    }
  });

  return { errors, netFailures };
}

test.describe('Phase 12.4 — Route & Render Consistency Master Suite', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(() => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  // ─── 1. MANDATORY REPRODUCER TEST ──────────────────────────────────────────
  test('1. Mandatory Bug Test: Daily Challenge → Header Dashboard click renders Dashboard', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/daily-challenge');
    await page.waitForLoadState('domcontentloaded');
    await assertPageIdentity(page, 'daily');

    // Click Header link "Dashboard"
    const dashLink = page.locator('header nav').getByRole('link', { name: 'Dashboard', exact: true }).first();
    await dashLink.click();

    // Assert URL & Rendered Content
    await assertPageIdentity(page, 'dashboard');
    await assertOldPageDisappeared(page, 'daily');

    expect(errors, `Console errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  // ─── 2. EXHAUSTIVE TRANSITION MATRIX ──────────────────────────────────────
  test('2. Exhaustive Authenticated Transition Matrix', async ({ page }) => {
    test.setTimeout(180000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const matrixSources = [
      { key: 'daily', name: 'Daily Challenge' },
      { key: 'dashboard', name: 'Dashboard' },
      { key: 'questions', name: 'Questions' },
      { key: 'practice', name: 'Practice' },
      { key: 'progress', name: 'Progress' },
      { key: 'bookmarks', name: 'Bookmarks' },
    ];

    const destinations = [
      { key: 'questions', linkName: 'Questions' },
      { key: 'practice', linkName: 'Practice' },
      { key: 'daily', linkName: 'Daily' },
      { key: 'dashboard', linkName: 'Dashboard' },
      { key: 'progress', linkName: 'Progress' },
      { key: 'bookmarks', linkName: 'Bookmarks' },
    ];

    for (const src of matrixSources) {
      for (const dest of destinations) {
        if (src.key === dest.key) continue;

        // Navigate to source route
        await page.goto(PAGE_IDENTITIES[src.key].route);
        await page.waitForLoadState('domcontentloaded');
        await assertPageIdentity(page, src.key);

        // Click destination link in header
        const targetLink = page.locator('header nav').getByRole('link', { name: new RegExp(dest.linkName, 'i') }).first();
        await expect(targetLink).toBeVisible();
        await targetLink.click();

        // Assert BOTH URL and Page Identity
        await assertPageIdentity(page, dest.key);
        await assertOldPageDisappeared(page, src.key);

        console.log(`[matrix] ${src.name} → ${dest.linkName}: PASS`);
      }
    }

    expect(errors).toHaveLength(0);
  });

  // ─── 3. RAPID NAVIGATION ──────────────────────────────────────────────────
  test('3. Rapid Navigation — Daily → Dashboard → Questions → Practice → Dashboard', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/daily-challenge');
    await page.waitForLoadState('domcontentloaded');

    const nav = (name: string) => page.locator('header nav').getByRole('link', { name: new RegExp(name, 'i') }).first();

    await nav('Dashboard').click();
    await nav('Questions').click();
    await nav('Practice').click();
    await nav('Dashboard').click();

    await assertPageIdentity(page, 'dashboard');
    await assertOldPageDisappeared(page, 'daily');
    await assertOldPageDisappeared(page, 'practice');

    expect(errors).toHaveLength(0);
  });

  // ─── 4. BACK / FORWARD HISTORY NAVIGATION ────────────────────────────────
  test('4. History Navigation — Daily → Dashboard → Questions → Back → Back → Forward', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/daily-challenge');
    await page.waitForLoadState('domcontentloaded');
    await assertPageIdentity(page, 'daily');

    await page.locator('header nav').getByRole('link', { name: 'Dashboard' }).first().click();
    await assertPageIdentity(page, 'dashboard');

    await page.locator('header nav').getByRole('link', { name: 'Questions' }).first().click();
    await assertPageIdentity(page, 'questions');

    await page.goBack();
    await assertPageIdentity(page, 'dashboard');

    await page.goBack();
    await assertPageIdentity(page, 'daily');

    await page.goForward();
    await assertPageIdentity(page, 'dashboard');

    expect(errors).toHaveLength(0);
  });

  // ─── 5. HARD REFRESH CONSISTENCY ──────────────────────────────────────────
  test('5. Hard Refresh — URL and Rendered Identity agree on all routes', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const routesToTest = ['dashboard', 'questions', 'practice', 'daily', 'progress', 'bookmarks'];

    for (const key of routesToTest) {
      await page.goto(PAGE_IDENTITIES[key].route);
      await page.waitForLoadState('domcontentloaded');
      await assertPageIdentity(page, key);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await assertPageIdentity(page, key);
    }

    expect(errors).toHaveLength(0);
  });

  // ─── 6. RANDOM 30-STEP ROUTE WALK ─────────────────────────────────────────
  test('6. Deterministic 30-Step Random Route Walk', async ({ page }) => {
    test.setTimeout(120000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const routeKeys = ['dashboard', 'questions', 'practice', 'daily', 'progress', 'bookmarks', 'community'];
    const navTextMap: Record<string, string> = {
      dashboard: 'Dashboard',
      questions: 'Questions',
      practice: 'Practice',
      daily: 'Daily',
      progress: 'Progress',
      bookmarks: 'Bookmarks',
      community: 'Submit Q',
    };

    let seed = 42;
    function pseudoRandom() {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }

    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    let currentKey = 'dashboard';

    for (let step = 1; step <= 30; step++) {
      let nextIndex = Math.floor(pseudoRandom() * routeKeys.length);
      while (routeKeys[nextIndex] === currentKey) {
        nextIndex = Math.floor(pseudoRandom() * routeKeys.length);
      }
      const nextKey = routeKeys[nextIndex];
      const linkText = navTextMap[nextKey];

      const link = page.locator('header nav').getByRole('link', { name: new RegExp(linkText, 'i') }).first();
      await expect(link).toBeVisible();
      await link.click();

      await assertPageIdentity(page, nextKey);
      await assertOldPageDisappeared(page, currentKey);

      console.log(`[step ${step}/30] ${currentKey} → ${nextKey}: PASS`);
      currentKey = nextKey;
    }

    expect(errors).toHaveLength(0);
  });

  // ─── 7. MULTI-VIEWPORT ROUTE CONSISTENCY ──────────────────────────────────
  test('7. Mobile Viewport (375x812) — Nav Drawer Transitions', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width: 375, height: 812 });
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/daily-challenge');
    await page.waitForLoadState('domcontentloaded');
    await assertPageIdentity(page, 'daily');

    const menuBtn = page.getByRole('button', { name: /toggle navigation menu/i });
    await menuBtn.click();

    const dashLink = page.locator('div.md\\:hidden').getByRole('link', { name: 'Dashboard' }).first();
    await dashLink.click();

    await assertPageIdentity(page, 'dashboard');
    await assertOldPageDisappeared(page, 'daily');

    expect(errors).toHaveLength(0);
  });
});
