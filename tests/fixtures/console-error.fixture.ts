/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, expect } from '@playwright/test';

/**
 * Shared console error fixture.
 * Fails the test if any unexpected uncaught exceptions or console errors occur.
 */
export const test = base.extend<{
  consoleErrors: string[];
  expectNoConsoleErrors: () => void;
}>({
  consoleErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Ignore known harmless third-party noise
        const ignoredPatterns = [
          /favicon/i,
          /Failed to load resource: net::ERR_NAME_NOT_RESOLVED/,
        ];
        const isIgnored = ignoredPatterns.some((p) =>
          typeof p === 'string' ? text.includes(p) : p.test(text)
        );
        if (!isIgnored) {
          errors.push(text);
        }
      }
    });
    page.on('pageerror', (err) => {
      errors.push(`[pageerror] ${err.message}`);
    });
    await use(errors);
  },

  expectNoConsoleErrors: async ({ consoleErrors }, use) => {
    await use(() => {
      if (consoleErrors.length > 0) {
        throw new Error(
          `Unexpected console/runtime errors:\n${consoleErrors.join('\n')}`
        );
      }
    });
  },
});

export { expect };
