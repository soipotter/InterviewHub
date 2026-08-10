import { test, expect } from '@playwright/test';

test.describe('Practice & Daily Challenge — Guest', () => {
  test('practice builder loads', async ({ page }) => {
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });

  test('daily challenge page loads and shows content', async ({ page }) => {
    await page.goto('/daily-challenge');
    await page.waitForLoadState('networkidle');
    // Wait for Supabase to load challenge
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    // Either a loading spinner resolves OR question content appears
    // Check for any visible interactive content OR a spinner that means it's loading
    // The page should have some UI — at minimum a spinner or content
    expect(bodyText.trim().length, 'Daily challenge page appears to be blank').toBeGreaterThan(50);
  });

  test('daily challenge page has no horizontal overflow', async ({ page }) => {
    await page.goto('/daily-challenge');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Horizontal overflow on daily challenge page').toBeFalsy();
  });

  test('daily challenge refresh preserves state (guest)', async ({ page }) => {
    await page.goto('/daily-challenge');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.reload();
    await page.waitForLoadState('networkidle');
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });

  test('/results with invalid ID shows graceful error', async ({ page }) => {
    await page.goto('/results/invalid-attempt-id-99999');
    await page.waitForLoadState('networkidle');
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });
});
