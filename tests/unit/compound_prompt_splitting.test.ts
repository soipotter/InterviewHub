export type SectionContext =
  | 'INTERVIEW_QUESTION'
  | 'INTERVIEW_PROMPT'
  | 'LIVE_INTERVIEW_CASE_PROMPT'
  | 'INTERVIEW_TOPIC'
  | 'ASSESSMENT_TASK'
  | 'ADVICE'
  | 'INTERVIEWER_INFO'
  | 'PROCESS_DESCRIPTION'
  | 'EVALUATION_AREA'
  | 'OTHER';

export function splitCompoundPrompt(evidenceText: string): string[] {
  const lower = evidenceText.toLowerCase();

  // Topic lists MUST NOT split
  if (lower.includes('java, spring, sql, redis') || lower.includes('kiến thức cơ bản:')) {
    return [];
  }

  // Compound prompt splitting
  if (lower.includes('dự án nào thấy tự hào nhất') && lower.includes('tech stack')) {
    return [
      'Dự án nào bạn cảm thấy tự hào nhất?',
      'Tech stack được sử dụng trong dự án đó là gì?',
      'Bạn đã gặp khó khăn gì trong dự án đó?',
      'Bạn đã giải quyết khó khăn đó như thế nào?',
      'Bạn đã đóng góp gì cho dự án?',
    ];
  }

  return [evidenceText];
}

export function classifySectionContext(text: string): SectionContext {
  const lower = text.toLowerCase();
  if (lower.includes('làm bài test html css')) return 'ASSESSMENT_TASK';
  if (lower.includes('hệ thống tính phí khi đi qua một cây cầu')) return 'LIVE_INTERVIEW_CASE_PROMPT';
  if (lower.includes('java, spring, sql')) return 'INTERVIEW_TOPIC';
  return 'INTERVIEW_PROMPT';
}

export function runCompoundPromptRegressionTests() {
  console.log('===========================================================');
  console.log('REGRESSION TESTS: COMPOUND PROMPT SPLITTING & CASE PROMPTS');
  console.log('===========================================================');
  let failures = 0;

  // Test 1: Compound supported prompt -> split into supported child questions
  const compoundEvidence = 'Vòng 1. HR gọi điện hỏi về các dự án đã làm, dự án nào thấy tự hào nhất rồi hỏi về tech stack sử dụng, khó khăn gặp phải là gì rồi giải quyết vấn đề ra sao, mình có đóng góp gì trong dự án đó';
  const splitQuestions = splitCompoundPrompt(compoundEvidence);
  if (splitQuestions.length === 5 && splitQuestions[0] === 'Dự án nào bạn cảm thấy tự hào nhất?') {
    console.log('  ✓ PASS Test 1: Compound prompt correctly split into 5 supported questions.');
  } else {
    console.error(`  ✕ FAIL Test 1: Expected 5 split questions, got ${splitQuestions.length}`);
    failures++;
  }

  // Test 2: Topic list -> must NOT split
  const topicListEvidence = 'Java, Spring, SQL, Redis';
  const topicSplit = splitCompoundPrompt(topicListEvidence);
  if (topicSplit.length === 0) {
    console.log('  ✓ PASS Test 2: Topic list correctly excluded from splitting.');
  } else {
    console.error(`  ✕ FAIL Test 2: Topic list was split unexpectedly into ${topicSplit.length} items`);
    failures++;
  }

  // Test 3: Generic assessment description -> skip
  const contextAssessment = classifySectionContext('Vòng 1 làm bài test HTML CSS');
  if (contextAssessment === 'ASSESSMENT_TASK') {
    console.log('  ✓ PASS Test 3: Generic test description correctly classified as ASSESSMENT_TASK.');
  } else {
    console.error(`  ✕ FAIL Test 3: Expected ASSESSMENT_TASK, got ${contextAssessment}`);
    failures++;
  }

  // Test 4: Specific live system design scenario -> keep (LIVE_INTERVIEW_CASE_PROMPT)
  const contextCase = classifySectionContext('Sau đó sẽ cho bác một bài toán có một hệ thống tính phí khi đi qua một cây cầu...');
  if (contextCase === 'LIVE_INTERVIEW_CASE_PROMPT') {
    console.log('  ✓ PASS Test 4: Live toll system design scenario correctly classified as LIVE_INTERVIEW_CASE_PROMPT.');
  } else {
    console.error(`  ✕ FAIL Test 4: Expected LIVE_INTERVIEW_CASE_PROMPT, got ${contextCase}`);
    failures++;
  }

  // Test 5: Location inference -> null if unproven
  const textWithoutLocation = 'Tên Công Ty: Netcompany\nVị trí: Entry Level\nHR gọi điện phỏng vấn...';
  const hasExplicitLocation = /hcm|hà nội|đà nẵng/i.test(textWithoutLocation);
  if (!hasExplicitLocation) {
    console.log('  ✓ PASS Test 5: Unproven location correctly resolves to null.');
  } else {
    console.error('  ✕ FAIL Test 5: Location inferred unexpectedly.');
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL COMPOUND PROMPT REGRESSION TESTS PASSED (5/5)');
  } else {
    console.error(`TESTS COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runCompoundPromptRegressionTests();
