import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';

test.describe('Accessibility — Authenticated Pages (WCAG A/AA)', () => {
  test.beforeEach(() => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  test('dashboard page: zero critical a11y violations', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticals = results.violations.filter((v) => v.impact === 'critical');
    if (criticals.length > 0) {
      const report = criticals.map((v) => `[critical] ${v.id}: ${v.description}`).join('\n');
      throw new Error(`Critical a11y violations on dashboard:\n${report}`);
    }

    const serious = results.violations.filter((v) => v.impact === 'serious');
    if (serious.length > 0) {
      console.warn('[a11y-dashboard] Serious violations:', serious.map((v) => v.id).join(', '));
    }
  });

  test('practice builder page: zero critical a11y violations', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/practice');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticals = results.violations.filter((v) => v.impact === 'critical');
    if (criticals.length > 0) {
      const report = criticals.map((v) => `[critical] ${v.id}: ${v.description}`).join('\n');
      throw new Error(`Critical a11y violations on practice page:\n${report}`);
    }
  });

  test('community submit page: zero critical a11y violations', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/community/submit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticals = results.violations.filter((v) => v.impact === 'critical');
    if (criticals.length > 0) {
      const report = criticals.map((v) => `[critical] ${v.id}: ${v.description}`).join('\n');
      throw new Error(`Critical a11y violations on community submit:\n${report}`);
    }

    const serious = results.violations.filter((v) => v.impact === 'serious');
    if (serious.length > 0) {
      console.warn('[a11y-community] Serious violations:', serious.map((v) => v.id).join(', '));
    }
  });

  test('progress page: zero critical a11y violations', async ({ page }) => {
    await loginAsUser(page);
    await page.goto('/progress');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticals = results.violations.filter((v) => v.impact === 'critical');
    if (criticals.length > 0) {
      const report = criticals.map((v) => `[critical] ${v.id}: ${v.description}`).join('\n');
      throw new Error(`Critical a11y violations on progress page:\n${report}`);
    }
  });
});
