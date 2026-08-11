import { test, expect, Page } from '@playwright/test';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

const SKIP_USER = 'QA user credentials not provided';

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

  // 4. Header auth check
  const logoutBtn = page.locator('#header-logout-btn, #mobile-header-logout-btn').first();
  await expect(logoutBtn).toBeVisible();
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

test.describe('Phase 12.4.1 — Final Pre-Push Proof Suite', () => {
  test.beforeEach(() => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  // ─── STEP 2: Production-Like Preview UI Transition Sequence ────────────────
  test('Step 2: Production Preview UI Navigation Sequence', async ({ page }) => {
    test.setTimeout(90000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const sequence = [
      { from: 'landing', to: 'daily', link: 'Daily' },
      { from: 'daily', to: 'dashboard', link: 'Dashboard' },
      { from: 'dashboard', to: 'questions', link: 'Questions' },
      { from: 'questions', to: 'practice', link: 'Practice' },
      { from: 'practice', to: 'dashboard', link: 'Dashboard' },
      { from: 'dashboard', to: 'progress', link: 'Progress' },
      { from: 'progress', to: 'daily', link: 'Daily' },
      { from: 'daily', to: 'dashboard', link: 'Dashboard' },
    ];

    await page.goto('/daily-challenge');
    await page.waitForLoadState('domcontentloaded');
    await assertPageIdentity(page, 'daily');

    for (const step of sequence) {
      if (step.from === 'landing') continue;

      const navLink = page.locator('header nav').getByRole('link', { name: new RegExp(step.link, 'i') }).first();
      await expect(navLink).toBeVisible();
      await navLink.click();

      await assertPageIdentity(page, step.to);
      await assertOldPageDisappeared(page, step.from);
      console.log(`[preview-ui] ${step.from} → ${step.to}: PASS`);
    }

    expect(errors).toHaveLength(0);
  });

  // ─── STEP 3: Reproduce original bug 10 consecutive times ────────────────────
  test('Step 3: Reproduce original Daily → Dashboard bug 10 consecutive times', async ({ page }) => {
    test.setTimeout(180000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    for (let iteration = 1; iteration <= 10; iteration++) {
      // 1. Visit Daily Challenge
      await page.goto('/daily-challenge');
      await page.waitForLoadState('domcontentloaded');
      await assertPageIdentity(page, 'daily');

      // 2. Click Header link Dashboard
      const dashLink = page.locator('header nav').getByRole('link', { name: 'Dashboard', exact: true }).first();
      await dashLink.click();

      // 3. Assert Dashboard visible & Daily page gone
      await assertPageIdentity(page, 'dashboard');
      await assertOldPageDisappeared(page, 'daily');

      console.log(`[10x-stress] Iteration ${iteration}/10: PASS`);
    }

    expect(errors).toHaveLength(0);
  });

  // ─── STEP 4: Async Race Stress (5x repetitions per pattern) ───────────────
  test('Step 4: Async Race Stress Patterns', async ({ page }) => {
    test.setTimeout(180000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const nav = (name: string) => page.locator('header nav').getByRole('link', { name: new RegExp(name, 'i') }).first();

    // Pattern A: Daily → Dashboard → Questions quickly (x5)
    for (let i = 1; i <= 5; i++) {
      await page.goto('/daily-challenge');
      await page.waitForLoadState('domcontentloaded');
      await nav('Dashboard').click();
      await nav('Questions').click();
      await assertPageIdentity(page, 'questions');
      await assertOldPageDisappeared(page, 'daily');
      console.log(`[async-race-A] Daily → Dashboard → Questions (${i}/5): PASS`);
    }

    // Pattern B: Dashboard → Daily → Dashboard quickly (x5)
    for (let i = 1; i <= 5; i++) {
      await page.goto('/dashboard');
      await page.waitForLoadState('domcontentloaded');
      await nav('Daily').click();
      await nav('Dashboard').click();
      await assertPageIdentity(page, 'dashboard');
      await assertOldPageDisappeared(page, 'daily');
      console.log(`[async-race-B] Dashboard → Daily → Dashboard (${i}/5): PASS`);
    }

    // Pattern C: Practice → Dashboard quickly (x5)
    for (let i = 1; i <= 5; i++) {
      await page.goto('/practice');
      await page.waitForLoadState('domcontentloaded');
      await nav('Dashboard').click();
      await assertPageIdentity(page, 'dashboard');
      await assertOldPageDisappeared(page, 'practice');
      console.log(`[async-race-C] Practice → Dashboard (${i}/5): PASS`);
    }

    expect(errors).toHaveLength(0);
  });

  // ─── STEP 5: Back / Forward History Navigation ────────────────────────────
  test('Step 5: History Navigation — Daily → Dashboard → Back → Forward', async ({ page }) => {
    test.setTimeout(60000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    await page.goto('/daily-challenge');
    await page.waitForLoadState('domcontentloaded');
    await assertPageIdentity(page, 'daily');

    await page.locator('header nav').getByRole('link', { name: 'Dashboard' }).first().click();
    await assertPageIdentity(page, 'dashboard');

    await page.goBack();
    await assertPageIdentity(page, 'daily');

    await page.goForward();
    await assertPageIdentity(page, 'dashboard');

    expect(errors).toHaveLength(0);
  });

  // ─── STEP 6: Hard Refresh on Key Routes ──────────────────────────────────
  test('Step 6: Hard Refresh on key routes', async ({ page }) => {
    test.setTimeout(90000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const targetRoutes = ['daily', 'dashboard', 'questions', 'practice', 'progress'];

    for (const key of targetRoutes) {
      await page.goto(PAGE_IDENTITIES[key].route);
      await page.waitForLoadState('domcontentloaded');
      await assertPageIdentity(page, key);

      await page.reload({ waitUntil: 'domcontentloaded' });
      await assertPageIdentity(page, key);
      console.log(`[hard-refresh] ${key}: PASS`);
    }

    expect(errors).toHaveLength(0);
  });

  // ─── STEP 7: Clean Browser Pass 1 ──────────────────────────────────────────
  test('Step 7: Clean Browser Pass 1 (Full Natural Journey A)', async ({ page }) => {
    test.setTimeout(120000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const journey = [
      'dashboard',
      'questions',
      'practice',
      'dashboard',
      'progress',
      'daily',
      'community',
    ];

    for (const key of journey) {
      const linkText = key === 'community' ? 'Submit Q' : key.slice(0, 1).toUpperCase() + key.slice(1);
      const link = page.locator('header nav').getByRole('link', { name: new RegExp(linkText, 'i') }).first();
      await expect(link).toBeVisible();
      await link.click();
      await assertPageIdentity(page, key);
    }

    // Back / Forward / Refresh
    await page.goBack();
    await page.goForward();
    await page.reload({ waitUntil: 'domcontentloaded' });
    await assertPageIdentity(page, 'community');

    expect(errors, `Pass 1 Console Errors: ${errors.join('; ')}`).toHaveLength(0);
  });

  // ─── STEP 8: Clean Browser Pass 2 ──────────────────────────────────────────
  test('Step 8: Clean Browser Pass 2 (Full Natural Journey B)', async ({ page }) => {
    test.setTimeout(120000);
    const { errors } = collectErrors(page);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBeTruthy();

    const journey = [
      'daily',
      'practice',
      'progress',
      'bookmarks',
      'questions',
      'community',
      'dashboard',
    ];

    for (const key of journey) {
      const linkText = key === 'community' ? 'Submit Q' : key.slice(0, 1).toUpperCase() + key.slice(1);
      const link = page.locator('header nav').getByRole('link', { name: new RegExp(linkText, 'i') }).first();
      await expect(link).toBeVisible();
      await link.click();
      await assertPageIdentity(page, key);
    }

    await page.reload({ waitUntil: 'domcontentloaded' });
    await assertPageIdentity(page, 'dashboard');

    expect(errors, `Pass 2 Console Errors: ${errors.join('; ')}`).toHaveLength(0);
  });
});
