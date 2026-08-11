import { test, expect } from '@playwright/test';

test.describe('Question Bank', () => {
  test('question bank loads published questions', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // allow Supabase to return data
    const questionLinks = page.locator('a[href*="/questions/q-"], a[href*="/questions/comm-"]');
    const linkCount = await questionLinks.count();
    expect(linkCount, 'No question links found — question bank may not be loading data from Supabase').toBeGreaterThan(0);
  });

  test('question bank search does not crash and does not show undefined', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('React');
      await page.waitForTimeout(1000); // debounce
      await page.waitForLoadState('networkidle');
      const bodyText = await page.textContent('body') ?? '';
      // The word "undefined" should NOT appear as visible text
      expect(bodyText).not.toMatch(/\bundefined\b.*questions/i);
      // Should not crash
      expect(bodyText).not.toMatch(/cannot read|TypeError/i);
    }
  });

  test('question detail deep-link navigates correctly', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // wait for Supabase data
    // Find links specifically to question detail pages (slug format q-...)
    const questionDetailLinks = page.locator('a[href^="/questions/q-"]');
    const count = await questionDetailLinks.count();
    if (count === 0) {
      test.skip(true, 'No question detail links found — question bank empty or not loaded');
      return;
    }
    const href = await questionDetailLinks.first().getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/questions/');
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });

  test('question detail refresh works (SPA rewrite)', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const questionDetailLinks = page.locator('a[href^="/questions/q-"]');
    const count = await questionDetailLinks.count();
    if (count === 0) {
      test.skip(true, 'No question detail links found');
      return;
    }
    const href = await questionDetailLinks.first().getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('networkidle');
    await page.reload();
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toContain('/questions/');
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });

  test('invalid question ID shows graceful error not platform 404', async ({ page }) => {
    await page.goto('/questions/this-id-does-not-exist-abc123xyz');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });
});
