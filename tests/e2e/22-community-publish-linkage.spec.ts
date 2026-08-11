import { test, expect } from '@playwright/test';
import { loginAsAdmin, hasAdminCredentials } from '../helpers/auth';

const SKIP_ADMIN = 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set';

/**
 * Phase 13.1 — Community Publication Linkage Regression
 *
 * Root cause: The approve_community_question RPC generates a comm-{uuid-no-dashes} ID
 * for public.questions. The UI must use published_question_id (not community_questions.id)
 * to navigate to the public question detail page.
 *
 * These tests verify:
 * 1. A known approved community question URL resolves correctly (not "Question Not Found")
 * 2. The "View Published Question" button uses published_question_id after approval
 */
test.describe('Phase 13.1 — Community Publication Linkage Regression', () => {
  /**
   * Test 1: Direct URL navigation to a known comm-prefixed published question.
   *
   * Tests the FIXED behaviour in questionService.getQuestionById which now uses
   * .or(`id.eq.${id},slug.eq.${id}`) to handle comm- prefixed IDs.
   * The question comm-9b6ae7fd76134b6980c7beb54f31316d is a real approved
   * community question on production.
   */
  test('comm-prefixed question URL resolves correctly (not Question Not Found)', async ({ page }) => {
    const commQuestionId = 'comm-9b6ae7fd76134b6980c7beb54f31316d';
    await page.goto(`/questions/${commQuestionId}`);
    await page.waitForLoadState('domcontentloaded');

    // Must NOT show "Question Not Found"
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText, 'Page must not show "Question Not Found" for a published comm- question').not.toContain('Question Not Found');

    // Must show actual question content (h1 visible)
    const heading = page.locator('h1').first();
    await expect(heading, 'h1 heading must be visible on question detail page').toBeVisible();
    await expect(heading).toContainText(/git|push|syntax/i);
  });

  /**
   * Test 2: The /questions/:questionId route renders successfully for a second
   * comm-prefixed ID — regression against the old 'q-' only prefix matching.
   */
  test('A second comm-prefixed question URL resolves correctly', async ({ page }) => {
    const commQuestionId = 'comm-0c0fa6d6fde9454d9c0773234046781f';
    await page.goto(`/questions/${commQuestionId}`);
    await page.waitForLoadState('domcontentloaded');

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toContain('Question Not Found');

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible();
    await expect(heading).toContainText(/reconciliation|react/i);
  });

  /**
   * Test 3: After admin approves a community submission, the "View Published Question"
   * button href must be /questions/comm-{32-hex-chars} (no UUID dashes in the ID part).
   * Clicking it must navigate to a valid question page, not "Question Not Found".
   */
  test('Admin approval View Published Question button navigates to valid question URL', async ({ page }) => {
    if (!hasAdminCredentials()) {
      test.skip(true, SKIP_ADMIN);
      return;
    }

    const ok = await loginAsAdmin(page);
    expect(ok, 'Admin login failed').toBeTruthy();

    await page.goto('/admin/community');
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/admin\/community$/);

    // Find the first pending submission inspect button
    const inspectBtn = page.locator('button:has-text("Inspect Detail"), a:has-text("Inspect Detail")').first();
    const hasSubmission = await inspectBtn.isVisible().catch(() => false);

    if (!hasSubmission) {
      console.log('[LINKAGE-TEST] No pending submissions in queue — skipping approval flow test');
      test.skip(true, 'No pending submissions to test approval flow');
      return;
    }

    await inspectBtn.click();
    await page.waitForLoadState('domcontentloaded');

    const approveBtn = page.locator('#approve-submission-btn');
    await expect(approveBtn).toBeVisible({ timeout: 10000 });
    await approveBtn.click();

    const confirmBtn = page.locator('#confirm-approve-btn');
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    // After approval + refetch, the success banner must show the view link
    const viewPublishedBtn = page.locator('#view-published-question-btn');
    await expect(viewPublishedBtn, '"View Published Question" button must appear after approval').toBeVisible({ timeout: 15000 });

    // Get the enclosing anchor href — must be /questions/comm-{32 hex chars}
    const href = await page.locator('a', { has: page.locator('#view-published-question-btn') }).first().getAttribute('href');
    expect(href, '"View Published Question" href must be a valid comm-prefixed question URL without UUID dashes').toMatch(
      /^\/questions\/comm-[0-9a-f]{32}$/
    );

    // Navigate and verify the page loads correctly
    await viewPublishedBtn.click();
    await page.waitForLoadState('domcontentloaded');
    await expect(page).toHaveURL(/\/questions\/comm-[0-9a-f]{32}$/);

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText, 'Published question page must NOT show "Question Not Found"').not.toContain('Question Not Found');

    const heading = page.locator('h1').first();
    await expect(heading, 'Published question page must show a valid h1 title').toBeVisible();
  });
});
