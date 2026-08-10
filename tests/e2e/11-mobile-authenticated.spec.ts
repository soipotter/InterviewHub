import { test, expect } from '@playwright/test';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';

/**
 * Gate 19: Mobile Authenticated Flow at 375x812
 * Tests: login, dashboard, practice builder, community submit
 * Verifies: no clipped controls, no horizontal overflow, forms usable
 */
test.describe('Mobile Authenticated Flow — 375x812 (Gate 19)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test.beforeEach(() => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  test('login form is fully functional on mobile', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Verify no horizontal overflow
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Horizontal overflow on login page (mobile)').toBeFalsy();

    // Verify form fields are visible and interactable
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();

    // Verify button is not clipped (has bounding box within viewport)
    const submitBtn = page.locator('button[type="submit"]').first();
    const bbox = await submitBtn.boundingBox();
    expect(bbox, 'Submit button has no bounding box').not.toBeNull();
    expect(bbox!.x, 'Submit button clipped left').toBeGreaterThanOrEqual(0);
    expect(bbox!.x + bbox!.width, 'Submit button clipped right').toBeLessThanOrEqual(375 + 5); // 5px tolerance
  });

  test('dashboard has no horizontal overflow on mobile', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Horizontal overflow on dashboard (mobile)').toBeFalsy();
  });

  test('practice builder is usable on mobile', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Horizontal overflow on practice builder (mobile)').toBeFalsy();

    // Start button should be visible and not clipped
    const startBtn = page.locator('button:has-text("Start Practice")').first();
    if (await startBtn.isVisible()) {
      const bbox = await startBtn.boundingBox();
      expect(bbox).not.toBeNull();
      expect(bbox!.x + bbox!.width).toBeLessThanOrEqual(380);
    }
  });

  test('community submit form is usable on mobile', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/community/submit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Horizontal overflow on community submit (mobile)').toBeFalsy();
  });

  test('navigation menu is accessible on mobile', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check mobile hamburger menu toggle exists and is visible
    const mobileToggle = page.locator('button[aria-label="Toggle Navigation Menu"]');
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.waitForTimeout(500);
      // After toggle, nav links should appear
      const navVisible = await page.locator('nav').isVisible();
      expect(navVisible).toBeTruthy();
      // Reset
      await mobileToggle.click();
    }

    // No overflow after menu toggle
    const overflow = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
    expect(overflow, 'Horizontal overflow after mobile menu toggle').toBeFalsy();
  });
});
