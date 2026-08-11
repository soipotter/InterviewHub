import { test, expect } from '@playwright/test';
import { isAutoScorable } from '../../src/features/questions/types/question';
import { extractionService } from '../../src/features/question-ingestion/services/extractionService';

test.describe('Phase 14 — Question Format Model & Classification Rules', () => {

  test('1 & 8: isAutoScorable returns true ONLY for multiple_choice and true_false', () => {
    expect(isAutoScorable('multiple_choice')).toBe(true);
    expect(isAutoScorable('Multiple Choice')).toBe(true);
    expect(isAutoScorable('true_false')).toBe(true);
    expect(isAutoScorable('True/False')).toBe(true);

    expect(isAutoScorable('open_ended')).toBe(false);
    expect(isAutoScorable('Open-ended')).toBe(false);
    expect(isAutoScorable('coding')).toBe(false);
    expect(isAutoScorable('Coding')).toBe(false);
    expect(isAutoScorable('scenario')).toBe(false);
    expect(isAutoScorable('Scenario')).toBe(false);
  });

  test('2: classifySourceContent identifies actual questions vs commentary/advice', () => {
    const q1 = extractionService.classifySourceContent('React reconciliation hoạt động như thế nào?');
    expect(q1).toBe('actual_question');

    const advice = extractionService.classifySourceContent('Bài live code thì không quá khó, chủ yếu xem phong cách code');
    expect(advice).toBe('not_a_question');

    const short = extractionService.classifySourceContent('abc');
    expect(short).toBe('insufficient_evidence');
  });

  test('3: classifyQuestionFormat categorizes technical prompts faithfully', () => {
    expect(extractionService.classifyQuestionFormat('Implement LRU Cache in TypeScript')).toBe('coding');
    expect(extractionService.classifyQuestionFormat('System design: API latency suddenly spikes in production')).toBe('scenario');
    expect(extractionService.classifyQuestionFormat('HTTP protocol is stateless. True or False?')).toBe('true_false');
    expect(extractionService.classifyQuestionFormat('Phân biệt useMemo và useCallback trong React')).toBe('open_ended');
  });

  test('4: Zero Invention Rule — raw extracted candidate records do not contain generated fake options', () => {
    const post = {
      title: 'Review phỏng vấn MoMo Senior Frontend',
      content: 'Hỏi về React Virtual DOM reconciliation hoạt động thế nào?',
      url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-5',
      sourceName: 'VozForum',
      sourceType: 'forum' as const
    };

    const records = extractionService.extractQuestionsFromPost(post);
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) {
      expect(r.options).toBeNull();
      expect(r.correctAnswer).toBeNull();
      expect(r.questionFormat).toBe('open_ended');
      expect(r.sourceClassification).toBe('actual_question');
    }
  });

});
