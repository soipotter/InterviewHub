import { test, expect } from '@playwright/test';

/**
 * Multi-browser critical suite (Gates 16, 17, 18).
 * Tests must pass on Chromium, Firefox, AND WebKit.
 * Run with --project=chromium --project=firefox --project=webkit
 */
test.describe('Multi-Browser Critical Suite', () => {
  test('landing page renders correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/.+/);
    await expect(page.locator('h1').first()).toBeVisible();
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow).toBeFalsy();
  });

  test('questions bank loads and shows data', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    // Should have loaded at least some content
    expect(bodyText.trim().length).toBeGreaterThan(200);
  });

  test('question detail deep-link works (SPA rewrite)', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const questionLinks = page.locator('a[href^="/questions/q-"]');
    const count = await questionLinks.count();
    if (count === 0) {
      test.skip(true, 'No question links found');
      return;
    }
    const href = await questionLinks.first().getAttribute('href');
    await page.goto(href!);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    expect(page.url()).toContain('/questions/');
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });

  test('login page renders and form is usable', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('practice builder loads on all browsers', async ({ page }) => {
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('daily challenge renders on all browsers', async ({ page }) => {
    await page.goto('/daily-challenge');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    expect(bodyText.trim().length).toBeGreaterThan(100);
  });

  test('unknown route handled gracefully on all browsers', async ({ page }) => {
    await page.goto('/totally-unknown-route-xyz-browser-test');
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });
});
