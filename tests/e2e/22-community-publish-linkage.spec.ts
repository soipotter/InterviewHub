import { test, expect } from '@playwright/test';
import { questionService } from '../../src/features/questions/services/questionService';

test.describe('Phase 13.1 — Community Publication Linkage Regression', () => {
  test('questionService.getQuestionById resolves community questions starting with comm-', async () => {
    // A published community question ID starts with 'comm-'
    const commQuestionId = 'comm-0c0fa6d6fde9454d9c0773234046781f';
    const result = await questionService.getQuestionById(commQuestionId);

    expect(result, `Question with ID ${commQuestionId} should be found`).not.toBeNull();
    if (result) {
      expect(result.id).toBe(commQuestionId);
      expect(result.title).toContain('reconciliation');
    }
  });
});
