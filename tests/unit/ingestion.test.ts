import { extractionService } from '../../src/features/question-ingestion/services/extractionService';
import { deduplicationService } from '../../src/features/question-ingestion/services/deduplicationService';
import { IngestedQuestion, RawCandidatePost } from '../../src/features/question-ingestion/types/ingestion';

async function runIngestionUnitTests() {
  console.log('===========================================================');
  console.log('RUNNING INGESTION SYSTEM UNIT TESTS');
  console.log('===========================================================');
  let failures = 0;

  // 1. PII Stripping Test
  console.log('Test 1: PII Stripping');
  const textWithPII = 'Contact me at john.doe@gmail.com or 0912345678 for details.';
  const stripped = extractionService.stripPII(textWithPII);
  if (!stripped.includes('john.doe@gmail.com') && !stripped.includes('0912345678')) {
    console.log('  ✓ PASS: PII (email & phone) stripped successfully.');
  } else {
    console.error('  ✕ FAIL: PII was not stripped correctly.', stripped);
    failures++;
  }

  // 2. Question Extraction Test
  console.log('Test 2: Question Extraction from Source');
  const samplePost: RawCandidatePost = {
    title: 'Review phỏng vấn Frontend tại Shopee Vietnam',
    content: `Họ hỏi:
    1. Em hãy giải thích Virtual DOM trong React hoạt động thế nào?
    2. Closure trong JavaScript là gì?`,
    url: 'https://voz.vn/t/sample-shopee-post.12345',
    sourceName: 'VozForum',
    sourceType: 'forum',
    companyHint: 'Shopee',
  };

  const extracted = extractionService.extractQuestionsFromPost(samplePost);
  if (extracted.length === 2 && extracted[0].company === 'Shopee') {
    console.log(`  ✓ PASS: Extracted ${extracted.length} questions from candidate post.`);
  } else {
    console.error(`  ✕ FAIL: Expected 2 questions, got ${extracted.length}`);
    failures++;
  }

  // 3. Mandatory Source URL Invariant Test
  console.log('Test 3: Mandatory Source URL Invariant');
  try {
    extractionService.extractQuestionsFromPost({
      ...samplePost,
      url: '',
    });
    console.error('  ✕ FAIL: Invariant failed to reject post missing sourceUrl.');
    failures++;
  } catch (err) {
    console.log('  ✓ PASS: Post without sourceUrl strictly rejected:', (err as Error).message);
  }

  // 4. Normalization Test
  console.log('Test 4: Question Normalization');
  const rawQ = 'câu 1: virtual DOM là gì';
  const normQ = extractionService.normalizeQuestionText(rawQ);
  if (normQ === 'Virtual DOM là gì?') {
    console.log(`  ✓ PASS: Normalized question correctly: "${normQ}"`);
  } else {
    console.error(`  ✕ FAIL: Expected "Virtual DOM là gì?", got "${normQ}"`);
    failures++;
  }

  // 5. Deduplication Detection Test
  console.log('Test 5: Duplicate Detection');
  const existingQuestions: IngestedQuestion[] = [
    {
      id: 'ingest-001',
      status: 'pending_review',
      sourceName: 'VozForum',
      sourceUrl: 'https://voz.vn/t/1',
      sourceType: 'forum',
      originalText: 'Virtual DOM là gì?',
      normalizedQuestion: 'Virtual DOM trong React hoạt động như thế nào?',
      company: 'Shopee',
      role: 'Frontend Developer',
      seniority: 'Fresher',
      category: 'React',
      difficulty: 'Intermediate',
      confidence: 0.95,
      isDuplicateFlagged: false,
      importedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const candidate = {
    ...existingQuestions[0],
    normalizedQuestion: 'Virtual DOM trong React hoạt động như thế nào?',
  };

  const dupCheck = deduplicationService.detectDuplicates(candidate, existingQuestions);
  if (dupCheck.isDuplicate && dupCheck.duplicateOfId === 'ingest-001') {
    console.log('  ✓ PASS: Duplicate candidate correctly flagged as duplicate of ingest-001.');
  } else {
    console.error('  ✕ FAIL: Duplicate detection failed.', dupCheck);
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL INGESTION UNIT TESTS PASSED (5/5)');
  } else {
    console.error(`INGESTION UNIT TESTS COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runIngestionUnitTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
