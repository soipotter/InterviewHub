import { test, expect } from '@playwright/test';
import { loginAsUser } from '../helpers/auth';

test.describe('Dashboard Performance & Network Efficiency Regression Suite', () => {
  test('authenticated dashboard load triggers bounded network requests without excessive N+1 waterfalls', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBe(true);

    const apiRequests: { url: string; method: string }[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.includes('supabase.co')) {
        apiRequests.push({ url, method: req.method() });
      }
    });

    const startTime = Date.now();
    apiRequests.length = 0;
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Assert main header greeting / dashboard shell is rendered quickly
    await expect(page.locator('body')).toContainText(/Welcome back|Developer Dashboard/i, {
      timeout: 15000,
    });

    const loadDuration = Date.now() - startTime;

    console.log(`[Perf Test] Dashboard loaded in ${loadDuration}ms with ${apiRequests.length} Supabase API requests`);

    // Performance budget assertions:
    // Total Supabase API requests on /dashboard must stay strictly under 120 in dev (down from 486)
    expect(apiRequests.length).toBeLessThan(120);

    // Load duration must be under 30s
    expect(loadDuration).toBeLessThan(30000);
  });

  test('warm navigation back to dashboard uses in-memory cache for instant rendering', async ({
    page,
  }) => {
    test.setTimeout(60000);

    const loggedIn = await loginAsUser(page);
    expect(loggedIn).toBe(true);

    // First visit to populate cache
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Navigate away to Questions page
    await page.goto('/questions');
    await page.waitForLoadState('domcontentloaded');

    // Measure warm return to /dashboard
    const tWarmStart = Date.now();
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Content should be visible immediately (within 3000ms)
    await expect(page.locator('body')).toContainText(/Welcome back|Developer Dashboard/i, {
      timeout: 3000,
    });
    const warmDuration = Date.now() - tWarmStart;

    console.log(`[Perf Test] Warm return to Dashboard completed in ${warmDuration}ms`);
    expect(warmDuration).toBeLessThan(5000);
  });
});
