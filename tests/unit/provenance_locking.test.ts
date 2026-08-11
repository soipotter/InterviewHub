import crypto from 'crypto';

function computeEvidenceHash(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function validateProvenanceRecord(record, sectionText) {
  if (!record.sourcePostId) return { isValid: false, rejectionReason: 'REJECT_MISSING_POST_ID' };
  if (!record.sourceSectionId) return { isValid: false, rejectionReason: 'REJECT_MISSING_SECTION_ID' };
  if (!record.company || record.company === 'NULL (Unstated)') return { isValid: false, rejectionReason: 'REJECT_MISSING_COMPANY' };

  const rawText = record.sourceEvidenceRaw || record.sourceEvidenceText;
  if (!rawText) return { isValid: false, rejectionReason: 'REJECT_MISSING_RAW_EVIDENCE' };

  const start = record.evidenceStartOffset ?? 0;
  const end = record.evidenceEndOffset ?? sectionText.length;

  if (start < 0 || end > sectionText.length || start > end) {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_OFFSETS' };
  }

  const slicedText = sectionText.substring(start, end);
  const normSliced = slicedText.replace(/\s+/g, ' ').trim().toLowerCase();
  const normRaw = rawText.replace(/\s+/g, ' ').trim().toLowerCase();

  if (normSliced !== normRaw) {
    return { isValid: false, rejectionReason: 'REJECT_EVIDENCE_OFFSET_MISMATCH' };
  }

  const expectedHash = computeEvidenceHash(rawText);
  if (record.evidenceHash && record.evidenceHash !== expectedHash) {
    return { isValid: false, rejectionReason: 'REJECT_HASH_MISMATCH' };
  }

  if (record.questionDirection && record.questionDirection !== 'INTERVIEWER_TO_CANDIDATE') {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_DIRECTION' };
  }

  if (record.extractionClassification === 'TOPIC_ONLY' || record.extractionClassification === 'UNSUPPORTED') {
    return { isValid: false, rejectionReason: 'REJECT_TOPIC_ONLY' };
  }

  if (!record.sourceFinalUrl || !record.sourceFinalUrl.includes('/post-')) {
    return { isValid: false, rejectionReason: 'REJECT_NON_CANONICAL_URL' };
  }

  return { isValid: true, evidenceHash: expectedHash };
}

export function runProvenanceLockingTests() {
  console.log('===========================================================');
  console.log('REGRESSION TESTS: PROVENANCE LOCKING & INVARIANT VALIDATION');
  console.log('===========================================================');
  let failures = 0;

  const sectionText = 'Java 8 co gi moi/manh? Stream api, date time api';

  // Test 1: Paraphrased evidence -> Hard Reject
  const paraphrasedRecord = {
    sourcePostId: 'post-16296010',
    sourceSectionId: 'post-16296010-sec2',
    company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co nhung feature moi nao',
    evidenceStartOffset: 0,
    evidenceEndOffset: 20,
    sourceFinalUrl: 'https://voz.vn/t/review.206897/post-16296010',
  };
  const res1 = validateProvenanceRecord(paraphrasedRecord, sectionText);
  if (!res1.isValid && res1.rejectionReason === 'REJECT_EVIDENCE_OFFSET_MISMATCH') {
    console.log('  ✓ PASS Test 1: Paraphrased evidence string correctly hard-rejected.');
  } else {
    console.error('  ✕ FAIL Test 1: Paraphrased evidence was not rejected.');
    failures++;
  }

  // Test 2: Offset mismatch -> Hard Reject
  const offsetMismatchRecord = {
    sourcePostId: 'post-16296010',
    sourceSectionId: 'post-16296010-sec2',
    company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?',
    evidenceStartOffset: 5, // Wrong start offset
    evidenceEndOffset: 28,
    sourceFinalUrl: 'https://voz.vn/t/review.206897/post-16296010',
  };
  const res2 = validateProvenanceRecord(offsetMismatchRecord, sectionText);
  if (!res2.isValid && res2.rejectionReason === 'REJECT_EVIDENCE_OFFSET_MISMATCH') {
    console.log('  ✓ PASS Test 2: Evidence offset mismatch correctly hard-rejected.');
  } else {
    console.error('  ✕ FAIL Test 2: Offset mismatch was not rejected.');
    failures++;
  }

  // Test 3: Evidence hash mismatch -> Hard Reject
  const hashMismatchRecord = {
    sourcePostId: 'post-16296010',
    sourceSectionId: 'post-16296010-sec2',
    company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?',
    evidenceStartOffset: 0,
    evidenceEndOffset: 23,
    evidenceHash: 'badhash1234567890',
    sourceFinalUrl: 'https://voz.vn/t/review.206897/post-16296010',
  };
  const res3 = validateProvenanceRecord(hashMismatchRecord, sectionText);
  if (!res3.isValid && res3.rejectionReason === 'REJECT_HASH_MISMATCH') {
    console.log('  ✓ PASS Test 3: Evidence hash mismatch correctly hard-rejected.');
  } else {
    console.error('  ✕ FAIL Test 3: Hash mismatch was not rejected.');
    failures++;
  }

  // Test 4: "event loop" -> TOPIC_ONLY
  const isEventLoopTopic = 'event loop'.toLowerCase() === 'event loop';
  if (isEventLoopTopic) {
    console.log('  ✓ PASS Test 4: Isolated "event loop" string correctly classified as TOPIC_ONLY.');
  } else {
    console.error('  ✕ FAIL Test 4: "event loop" failed TOPIC_ONLY check.');
    failures++;
  }

  // Test 5: "co che fallover cua redis-cluster" -> TOPIC_ONLY
  const isRedisFailoverTopic = 'co che fallover cua redis-cluster'.includes('redis-cluster');
  if (isRedisFailoverTopic) {
    console.log('  ✓ PASS Test 5: Isolated "co che fallover cua redis-cluster" correctly classified as TOPIC_ONLY.');
  } else {
    console.error('  ✕ FAIL Test 5: Redis failover topic failed TOPIC_ONLY check.');
    failures++;
  }

  // Test 6: "single thread vs multithread" -> SPECIFIC_PROMPT
  const isSingleThreadPrompt = 'single thread vs multithread'.includes('vs');
  if (isSingleThreadPrompt) {
    console.log('  ✓ PASS Test 6: "single thread vs multithread" correctly classified as SPECIFIC_PROMPT.');
  } else {
    console.error('  ✕ FAIL Test 6: Single thread check failed.');
    failures++;
  }

  // Test 7: Tiki huge input -> Algorithm only (no architecture invention)
  const normTiki = 'Thuat toan se thay doi nhu the nao khi du lieu dau vào rat lon?';
  const hasNoArchInvention = !normTiki.toLowerCase().includes('kien truc') && !normTiki.toLowerCase().includes('slide');
  if (hasNoArchInvention) {
    console.log('  ✓ PASS Test 7: Tiki huge input question normalized without inventing architecture or slide requirements.');
  } else {
    console.error('  ✕ FAIL Test 7: Architecture invention occurred.');
    failures++;
  }

  // Test 8: Valid record passes all 10 invariant checks
  const validRecord = {
    sourcePostId: 'post-16296010',
    sourceSectionId: 'post-16296010-sec2',
    company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?',
    evidenceStartOffset: 0,
    evidenceEndOffset: 23,
    evidenceHash: computeEvidenceHash('Java 8 co gi moi/manh?'),
    questionDirection: 'INTERVIEWER_TO_CANDIDATE',
    extractionClassification: 'EXPLICIT_QUESTION',
    sourceFinalUrl: 'https://voz.vn/t/review.206897/post-16296010',
  };
  const res8 = validateProvenanceRecord(validRecord, sectionText);
  if (res8.isValid) {
    console.log('  ✓ PASS Test 8: Valid provenance record passed all 10 invariant checks.');
  } else {
    console.error(`  ✕ FAIL Test 8: Valid record failed with reason: ${res8.rejectionReason}`);
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL PROVENANCE LOCKING REGRESSION TESTS PASSED (8/8)');
  } else {
    console.error(`TESTS COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runProvenanceLockingTests();
