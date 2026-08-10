import { test, expect } from '@playwright/test';

test.describe('Responsive Layout — Mobile 375x812', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('landing page no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Mobile horizontal overflow on landing page').toBeFalsy();
  });

  test('question bank no horizontal overflow on mobile', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Mobile horizontal overflow on question bank').toBeFalsy();
  });

  test('login page usable on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.getByLabel(/email/i).or(page.locator('input[type="email"]')).first();
    await expect(emailInput).toBeVisible();
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Mobile horizontal overflow on login page').toBeFalsy();
  });

  test('daily challenge usable on mobile', async ({ page }) => {
    await page.goto('/daily-challenge');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Mobile horizontal overflow on daily challenge').toBeFalsy();
  });
});

test.describe('Responsive Layout — Tablet 768x1024', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('landing page no horizontal overflow on tablet', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Tablet horizontal overflow on landing page').toBeFalsy();
  });

  test('question bank no horizontal overflow on tablet', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Tablet horizontal overflow on question bank').toBeFalsy();
  });
});

test.describe('Responsive Layout — Desktop 1440x900', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('landing page no horizontal overflow on desktop', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Desktop horizontal overflow on landing page').toBeFalsy();
  });
});
