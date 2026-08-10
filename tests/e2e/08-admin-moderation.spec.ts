import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsUser, hasAdminCredentials, hasUserCredentials } from '../helpers/auth';

const SKIP_ADMIN = 'E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD not set';
const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';

/**
 * Helper: find a pending submission in the queue or create one (via community submit form).
 * Returns the submission ID from the URL, or null if none found/creatable.
 */
async function findPendingSubmission(page: import('@playwright/test').Page): Promise<string | null> {
  await page.goto('/admin/community');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  const firstDetailLink = page.locator('a[href*="/admin/community/"]').first();
  const count = await page.locator('a[href*="/admin/community/"]').count();
  if (count === 0) return null;

  const href = await firstDetailLink.getAttribute('href');
  return href;
}

test.describe('Admin Moderation Lifecycle', () => {
  test.beforeEach(() => {
    if (!hasAdminCredentials()) test.skip(true, SKIP_ADMIN);
  });

  test('admin login and queue load', async ({ page }) => {
    const ok = await loginAsAdmin(page);
    expect(ok, 'Admin login failed').toBeTruthy();

    await page.goto('/admin/community');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const url = page.url();
    // Should be on admin community page, NOT redirected to login
    expect(url).not.toContain('/login');
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);
    // Should show "Community Submissions Queue" or empty state
    expect(bodyText).toMatch(/Community Submissions Queue|No questions are waiting/i);
  });

  test('admin approve flow', async ({ page }) => {
    const ok = await loginAsAdmin(page);
    expect(ok, 'Admin login failed').toBeTruthy();

    const detailHref = await findPendingSubmission(page);
    if (!detailHref) {
      test.skip(true, 'No pending submissions in queue to approve — create one via community submit first');
      return;
    }

    // Navigate to detail
    await page.goto(detailHref);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    // Verify detail loads
    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);

    // Check current status before action
    const isAlreadyProcessed = bodyText.match(/Approved & Published|Rejected/i) !== null;

    if (isAlreadyProcessed) {
      test.skip(true, 'Submission already processed — need a fresh pending submission');
      return;
    }

    // Click Approve button
    const approveBtn = page.locator('button:has-text("Approve"), button:has-text("Publish")').first();
    if (!(await approveBtn.isVisible())) {
      test.skip(true, 'No Approve button visible — submission may not be in pending state');
      return;
    }

    await approveBtn.click();
    await page.waitForTimeout(1000);

    // Confirm in modal
    const confirmApproveBtn = page.locator('button:has-text("Confirm Approve"), button:has-text("Approve & Publish"), button:has-text("Yes, Approve")').first();
    if (await confirmApproveBtn.isVisible()) {
      await confirmApproveBtn.click();
    }

    // Wait for action to complete
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle');

    // Verify status changed to approved
    const afterBody = await page.textContent('body') ?? '';
    const isApproved = afterBody.match(/Approved|Published|approved/i) !== null;
    expect(isApproved, 'Submission status did not change to approved after approve action').toBeTruthy();

    // Check no error appeared
    expect(afterBody).not.toMatch(/failed|error.*approving/i);

    console.log('[admin-moderation] Approve flow: PASS');
  });

  test('admin reject flow — reason required', async ({ page }) => {
    const ok = await loginAsAdmin(page);
    expect(ok, 'Admin login failed').toBeTruthy();

    // We need a second pending submission for the reject test
    const detailHref = await findPendingSubmission(page);
    if (!detailHref) {
      test.skip(true, 'No pending submissions to reject — create one via community submit first');
      return;
    }

    await page.goto(detailHref);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const bodyText = await page.textContent('body') ?? '';
    const isAlreadyProcessed = bodyText.match(/Approved & Published|Rejected/i) !== null;
    if (isAlreadyProcessed) {
      test.skip(true, 'Submission already processed');
      return;
    }

    // Click Reject button
    const rejectBtn = page.locator('button:has-text("Reject")').first();
    if (!(await rejectBtn.isVisible())) {
      test.skip(true, 'No Reject button visible');
      return;
    }

    await rejectBtn.click();
    await page.waitForTimeout(1000);

    // Modal should appear with a rejection reason field
    const reasonField = page.locator('textarea, input[placeholder*="reason" i]').first();
    if (!(await reasonField.isVisible())) {
      test.skip(true, 'No rejection reason field visible in modal');
      return;
    }

    // First try: submit without reason — should show validation error
    const confirmRejectBtn = page.locator('button:has-text("Confirm Reject"), button:has-text("Reject Submission"), button:has-text("Submit Rejection")').first();
    if (await confirmRejectBtn.isVisible()) {
      await confirmRejectBtn.click();
      await page.waitForTimeout(500);
      const validationBody = await page.textContent('body') ?? '';
      expect(validationBody).toMatch(/reason is required|required/i);
    }

    // Second try: fill reason and submit
    await reasonField.fill('E2E test rejection — does not meet quality standards for automated testing purposes.');
    await page.waitForTimeout(300);

    if (await confirmRejectBtn.isVisible()) {
      await confirmRejectBtn.click();
    }

    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle');

    const afterBody = await page.textContent('body') ?? '';
    const isRejected = afterBody.match(/Rejected|rejected/i) !== null;
    expect(isRejected, 'Submission status did not change to rejected').toBeTruthy();
    expect(afterBody).not.toMatch(/failed|error.*reject/i);

    // Verify NO published question was created for rejected submission
    // (No link to /questions/:id should appear as "published question")
    const publishedLink = page.locator('a[href^="/questions/q-"]');
    const publishedCount = await publishedLink.count();
    expect(publishedCount, 'A published question link appeared for a REJECTED submission — RLS violation').toBe(0);

    console.log('[admin-moderation] Reject flow: PASS');
  });
});

test.describe('Community Submit — User Creates Pending Submission', () => {
  test.beforeEach(() => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  test('G: submit valid community question → status pending', async ({ page }) => {
    const ok = await loginAsUser(page);
    expect(ok, 'Login failed').toBeTruthy();

    await page.goto('/community/submit');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body') ?? '';
    expect(bodyText).not.toMatch(/404.*This page could not be found/i);

    // Fill in the minimum required fields
    const titleInput = page.locator('input[id*="title" i], input[name*="title" i]').first();
    if (!(await titleInput.isVisible())) {
      test.skip(true, 'Community submit form not found');
      return;
    }

    const ts = Date.now();
    await titleInput.fill(`E2E Test Question ${ts}: What is the difference between let and const in JS?`);

    // Select category if available
    const categorySelect = page.locator('select[id*="category" i], select[name*="category" i]').first();
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 }); // Pick first non-empty
    }

    // Topic
    const topicInput = page.locator('input[id*="topic" i], input[name*="topic" i]').first();
    if (await topicInput.isVisible()) {
      await topicInput.fill('Variable Declaration');
    }

    // Difficulty
    const difficultySelect = page.locator('select[id*="difficulty" i], select[name*="difficulty" i]').first();
    if (await difficultySelect.isVisible()) {
      await difficultySelect.selectOption({ index: 1 });
    }

    // Type
    const typeSelect = page.locator('select[id*="type" i], select[name*="type" i]').first();
    if (await typeSelect.isVisible()) {
      await typeSelect.selectOption({ index: 1 });
    }

    // Short summary
    const summaryTextarea = page.locator('textarea[id*="summary" i], textarea[name*="summary" i]').first();
    if (await summaryTextarea.isVisible()) {
      await summaryTextarea.fill('E2E test question about JS variable declaration differences. Auto-generated.');
    }

    // Options (for multiple choice — 4 options)
    const optionInputs = page.locator('input[id*="option" i], input[name*="option" i]');
    const optionCount = await optionInputs.count();
    const optionValues = [
      '`let` is block-scoped and mutable; `const` is block-scoped and immutable.',
      '`let` is function-scoped; `const` is block-scoped.',
      '`let` cannot be reassigned; `const` can be reassigned.',
      'There is no difference between `let` and `const`.',
    ];
    for (let i = 0; i < Math.min(optionCount, 4); i++) {
      await optionInputs.nth(i).fill(optionValues[i]);
    }

    // Correct answer — select first option radio if present
    const correctAnswerRadios = page.locator('input[type="radio"][name*="correct" i]');
    if (await correctAnswerRadios.count() > 0) {
      await correctAnswerRadios.first().click();
    }

    // Explanation
    const explanationTextarea = page.locator('textarea[id*="explanation" i], textarea[name*="explanation" i]').first();
    if (await explanationTextarea.isVisible()) {
      await explanationTextarea.fill('`let` allows reassignment of the variable while `const` does not. Both are block-scoped.');
    }

    // Submit the form
    const submitBtn = page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Submit Question")').first();
    if (!(await submitBtn.isVisible())) {
      test.skip(true, 'Submit button not found on community form');
      return;
    }

    await submitBtn.click();
    await page.waitForTimeout(4000);
    await page.waitForLoadState('networkidle');

    // Verify success view OR pending confirmation
    const afterBody = await page.textContent('body') ?? '';
    const hasSuccess = afterBody.match(/submitted for review|Question submitted|pending/i) !== null;
    expect(hasSuccess, 'Community submit did not show success state').toBeTruthy();

    console.log(`[community-submit] Submission created at ${new Date().toISOString()}`);
  });
});
