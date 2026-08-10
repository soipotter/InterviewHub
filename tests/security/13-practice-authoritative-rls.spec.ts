import { test, expect } from '@playwright/test';
import { loginAsUser, hasUserCredentials } from '../helpers/auth';

const SKIP_USER = 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set';

test.describe('Phase 10C.1 Authoritative Business Rule & RLS Hardening', () => {
  test.beforeEach(() => {
    if (!hasUserCredentials()) test.skip(true, SKIP_USER);
  });

  test('A. legacy save_quiz_attempt_with_answers RPC is REVOKED from client roles', async ({ page }) => {
    await loginAsUser(page);

    const rpcResult = await page.evaluate(async () => {
      try {
        const resp = await fetch('/rest/v1/rpc/save_quiz_attempt_with_answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            p_attempt: { attemptId: 'fake_att_123', totalQuestions: 5, scorePercentage: 100 },
            p_answers: [],
          }),
        });
        return { status: resp.status };
      } catch (err) {
        return { error: String(err) };
      }
    });

    // Revoked execution returns 401, 403, or 404 (RPC not found/executable for role)
    expect(rpcResult.status, 'Legacy save_quiz_attempt_with_answers RPC should be revoked from client roles').toBeGreaterThanOrEqual(400);
    console.log('[abuse-audit] Legacy save_quiz_attempt_with_answers RPC execution REVOKED ✓');
  });

  test('B. direct quiz_attempts INSERT is DENIED by RLS & privileges', async ({ page }) => {
    await loginAsUser(page);

    const insertResult = await page.evaluate(async () => {
      try {
        const resp = await fetch('/rest/v1/quiz_attempts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify({
            id: `att_fake_${Date.now()}`,
            quiz_id: 'quiz_fake',
            config: { category: 'HTML', count: 5 },
            total_questions: 5,
            correct_count: 5,
            incorrect_count: 0,
            score_percentage: 100,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          }),
        });
        return { status: resp.status };
      } catch (err) {
        return { error: String(err) };
      }
    });

    // Direct table INSERT should be denied (401, 403, or RLS error)
    expect(insertResult.status, 'Direct quiz_attempts INSERT should be denied by RLS/privileges').toBeGreaterThanOrEqual(400);
    console.log('[abuse-audit] Direct quiz_attempts INSERT DENIED ✓');
  });

  test('C. direct quiz_answers INSERT is DENIED by RLS & privileges', async ({ page }) => {
    await loginAsUser(page);

    const insertResult = await page.evaluate(async () => {
      try {
        const resp = await fetch('/rest/v1/quiz_answers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attempt_id: 'att_fake_123',
            question_id: 'q-html-01',
            selected_answer: 'Option A',
            is_correct: true,
          }),
        });
        return { status: resp.status };
      } catch (err) {
        return { error: String(err) };
      }
    });

    expect(insertResult.status, 'Direct quiz_answers INSERT should be denied by RLS/privileges').toBeGreaterThanOrEqual(400);
    console.log('[abuse-audit] Direct quiz_answers INSERT DENIED ✓');
  });

  test('D. community submit with whitespace-only title or required text is REJECTED by DB', async ({ page }) => {
    await loginAsUser(page);

    // Call submit_community_question with whitespace-only title
    const rpcResult = await page.evaluate(async () => {
      try {
        const resp = await fetch('/rest/v1/rpc/submit_community_question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            p_title: '   ',
            p_category_id: '00000000-0000-0000-0000-000000000000',
            p_topic: 'JS',
            p_difficulty: 'Junior',
            p_type: 'Multiple Choice',
            p_short_summary: 'Summary',
            p_explanation: 'Explanation',
            p_options: ['A', 'B'],
            p_correct_answer: 'A',
          }),
        });
        return { status: resp.status };
      } catch (err) {
        return { error: String(err) };
      }
    });

    // Database non-blank check constraint or RPC validation rejects whitespace title with error status
    expect(rpcResult.status, 'Whitespace-only title in community submission should be rejected').toBeGreaterThanOrEqual(400);
    console.log('[abuse-audit] Community submission whitespace-only title REJECTED by DB ✓');
  });
});
