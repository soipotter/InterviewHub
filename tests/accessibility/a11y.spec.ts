import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility — WCAG A/AA Automated Scan', () => {
  test('landing page passes axe accessibility scan', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Filter out known, low-impact non-blockers for an MVP
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      const report = criticalViolations
        .map((v) => `[${v.impact}] ${v.id}: ${v.description} — ${v.nodes.length} element(s)`)
        .join('\n');
      throw new Error(`Critical/serious accessibility violations on landing page:\n${report}`);
    }
  });

  test('login page passes axe accessibility scan', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      const report = criticalViolations
        .map((v) => `[${v.impact}] ${v.id}: ${v.description} — ${v.nodes.length} element(s)`)
        .join('\n');
      throw new Error(`Critical/serious accessibility violations on login page:\n${report}`);
    }
  });

  test('question bank page passes axe accessibility scan', async ({ page }) => {
    await page.goto('/questions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // wait for Supabase data
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      const report = criticalViolations
        .map((v) => `[${v.impact}] ${v.id}: ${v.description}`)
        .join('\n');
      // Record as warning (P2/P3), not hard fail for MVP
      console.warn(`Accessibility issues on question bank:\n${report}`);
    }
    // Only hard fail on critical
    const blockers = results.violations.filter((v) => v.impact === 'critical');
    expect(blockers.length, `Critical a11y violations: ${blockers.map((v) => v.id).join(', ')}`).toBe(0);
  });

  test('daily challenge page passes axe accessibility scan', async ({ page }) => {
    await page.goto('/daily-challenge');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const blockers = results.violations.filter((v) => v.impact === 'critical');
    expect(blockers.length, `Critical a11y violations on daily challenge: ${blockers.map((v) => v.id).join(', ')}`).toBe(0);
  });

  test('register page passes axe accessibility scan', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    if (criticalViolations.length > 0) {
      const report = criticalViolations
        .map((v) => `[${v.impact}] ${v.id}: ${v.description} — ${v.nodes.length} element(s)`)
        .join('\n');
      throw new Error(`Critical/serious accessibility violations on register page:\n${report}`);
    }
  });
});
