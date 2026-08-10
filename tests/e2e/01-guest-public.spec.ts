import { test, expect } from '@playwright/test';

test.describe('Guest Persona — Public Routes', () => {
  test('landing page loads with key elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/.+/);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
  });

  test('landing page has no horizontal overflow on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Horizontal overflow detected on desktop landing').toBeFalsy();
  });

  test('landing page has no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Horizontal overflow detected on mobile landing').toBeFalsy();
  });

  test('landing page has navigation to question bank', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const qLink = page.locator('a[href="/questions"]').first();
    await expect(qLink).toBeVisible();
  });

  test('unknown route does not show Vercel platform 404', async ({ page }) => {
    await page.goto('/this-route-absolutely-does-not-exist-xyz');
    await page.waitForLoadState('domcontentloaded');
    const bodyText = await page.textContent('body');
    // Must NOT show Vercel's generic 404 page — SPA should handle routing
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
  });
});
