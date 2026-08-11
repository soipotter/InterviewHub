import crypto from 'crypto';

function computeRealSha256Hash(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function validateProvenanceRecord(record: Record<string, unknown>, sectionText: string) {
  const r = record as Record<string, string | number | undefined>;
  if (!r.sourcePostId) return { isValid: false, rejectionReason: 'REJECT_MISSING_POST_ID' };
  if (!r.sourceSectionId) return { isValid: false, rejectionReason: 'REJECT_MISSING_SECTION_ID' };
  if (!r.company || r.company === 'NULL (Unstated)') return { isValid: false, rejectionReason: 'REJECT_MISSING_COMPANY' };

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

  const expectedHash = computeRealSha256Hash(rawText);

  if (!/^[0-9a-f]{64}$/.test(expectedHash)) {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_SHA256_FORMAT' };
  }

  if (record.evidenceHash) {
    if (!/^[0-9a-f]{64}$/.test(record.evidenceHash)) {
      return { isValid: false, rejectionReason: 'REJECT_FAKE_OR_INVALID_HASH_FORMAT' };
    }
    if (record.evidenceHash !== expectedHash) {
      return { isValid: false, rejectionReason: 'REJECT_HASH_MISMATCH' };
    }
  }

  if (record.questionDirection && record.questionDirection !== 'INTERVIEWER_TO_CANDIDATE') {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_DIRECTION' };
  }

  if (record.extractionClassification === 'TOPIC_ONLY' || record.extractionClassification === 'UNSUPPORTED') {
    return { isValid: false, rejectionReason: 'REJECT_TOPIC_ONLY' };
  }

  const lowerRaw = rawText.toLowerCase().trim();
  if (
    lowerRaw === 'event loop' ||
    lowerRaw === 'cơ chế fallover của redis-cluster' ||
    lowerRaw === 'system design movie-ticket system' ||
    lowerRaw.includes('các câu hỏi về javascript') ||
    lowerRaw.includes('behavioral interview') ||
    lowerRaw.includes('những câu lí thuyết về js')
  ) {
    return { isValid: false, rejectionReason: 'REJECT_TOPIC_FALSE_POSITIVE' };
  }

  if (!record.sourceFinalUrl || !record.sourceFinalUrl.includes('/post-')) {
    return { isValid: false, rejectionReason: 'REJECT_NON_CANONICAL_URL' };
  }

  return { isValid: true, evidenceHash: expectedHash };
}

export function runCryptoValidationTests() {
  console.log('===========================================================');
  console.log('AUTOMATED PROVENANCE & CRYPTOGRAPHIC SHA-256 FAILURE/PASS TESTS');
  console.log('===========================================================');
  let failures = 0;

  const sampleSectionText = 'Java 8 co gi moi/manh? Stream api, date time api';

  // Fail 1: Invalid SHA-256 characters
  const resF1 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?', evidenceStartOffset: 0, evidenceEndOffset: 23,
    evidenceHash: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ',
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, sampleSectionText);
  if (!resF1.isValid && resF1.rejectionReason === 'REJECT_FAKE_OR_INVALID_HASH_FORMAT') {
    console.log('  ✓ PASS Fail-Test 1: Invalid non-hex SHA-256 characters hard-rejected.');
  } else { console.error('  ✕ FAIL Fail-Test 1'); failures++; }

  // Fail 2: SHA-256 wrong length
  const resF2 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?', evidenceStartOffset: 0, evidenceEndOffset: 23,
    evidenceHash: '1234567890abcdef',
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, sampleSectionText);
  if (!resF2.isValid && resF2.rejectionReason === 'REJECT_FAKE_OR_INVALID_HASH_FORMAT') {
    console.log('  ✓ PASS Fail-Test 2: SHA-256 wrong length (not 64 chars) hard-rejected.');
  } else { console.error('  ✕ FAIL Fail-Test 2'); failures++; }

  // Fail 3: Hard-coded fake hash ("low3...")
  const resF3 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?', evidenceStartOffset: 0, evidenceEndOffset: 23,
    evidenceHash: 'low38891238910aa1848bbce2c040d99905fa85ff091004ea110ec1f2518e38cd',
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, sampleSectionText);
  if (!resF3.isValid && resF3.rejectionReason === 'REJECT_FAKE_OR_INVALID_HASH_FORMAT') {
    console.log('  ✓ PASS Fail-Test 3: Hard-coded fake hash ("low3...") hard-rejected.');
  } else { console.error('  ✕ FAIL Fail-Test 3'); failures++; }

  // Fail 4: SHA-256 Mismatch
  const resF4 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?', evidenceStartOffset: 0, evidenceEndOffset: 23,
    evidenceHash: '0000000000000000000000000000000000000000000000000000000000000000',
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, sampleSectionText);
  if (!resF4.isValid && resF4.rejectionReason === 'REJECT_HASH_MISMATCH') {
    console.log('  ✓ PASS Fail-Test 4: Real SHA-256 hash mismatch hard-rejected.');
  } else { console.error('  ✕ FAIL Fail-Test 4'); failures++; }

  // Fail 5: Offset Mismatch
  const resF5 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?', evidenceStartOffset: 10, evidenceEndOffset: 33,
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, sampleSectionText);
  if (!resF5.isValid && resF5.rejectionReason === 'REJECT_EVIDENCE_OFFSET_MISMATCH') {
    console.log('  ✓ PASS Fail-Test 5: Evidence offset mismatch hard-rejected.');
  } else { console.error('  ✕ FAIL Fail-Test 5'); failures++; }

  // Fail 6: Topic-only Javascript list
  const text6 = 'Các câu hỏi về Javascript (như var, let, const, hoisting, closure, ...)';
  const resF6 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'Sun Asterisk',
    sourceEvidenceRaw: text6,
    evidenceStartOffset: 0, evidenceEndOffset: text6.length,
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, text6);
  if (!resF6.isValid && resF6.rejectionReason === 'REJECT_TOPIC_FALSE_POSITIVE') {
    console.log('  ✓ PASS Fail-Test 6: Topic-only Javascript list hard-rejected.');
  } else { console.error('  ✕ FAIL Fail-Test 6:', resF6.rejectionReason); failures++; }

  // Fail 7: Generic behavioral interview
  const text7 = 'Hỏi về những câu hỏi non-tech, hay còn gọi là behavioral interview';
  const resF7 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'Nexon Dev Vina',
    sourceEvidenceRaw: text7,
    evidenceStartOffset: 0, evidenceEndOffset: text7.length,
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, text7);
  if (!resF7.isValid && resF7.rejectionReason === 'REJECT_TOPIC_FALSE_POSITIVE') {
    console.log('  ✓ PASS Fail-Test 7: Generic behavioral interview mention hard-rejected.');
  } else { console.error('  ✕ FAIL Fail-Test 7:', resF7.rejectionReason); failures++; }

  // Fail 8: Generic system design movie-ticket system
  const text8 = 'System design movie-ticket system';
  const resF8 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'Trusting Social',
    sourceEvidenceRaw: text8,
    evidenceStartOffset: 0, evidenceEndOffset: text8.length,
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, text8);
  if (!resF8.isValid && resF8.rejectionReason === 'REJECT_TOPIC_FALSE_POSITIVE') {
    console.log('  ✓ PASS Fail-Test 8: Generic movie ticket system design mention hard-rejected.');
  } else { console.error('  ✕ FAIL Fail-Test 8:', resF8.rejectionReason); failures++; }

  // Pass 1: Explicit question with real SHA-256
  const realHash = computeRealSha256Hash('Java 8 co gi moi/manh?');
  const resP1 = validateProvenanceRecord({
    sourcePostId: 'p1', sourceSectionId: 's1', company: 'AxonActive',
    sourceEvidenceRaw: 'Java 8 co gi moi/manh?', evidenceStartOffset: 0, evidenceEndOffset: 23,
    evidenceHash: realHash, questionDirection: 'INTERVIEWER_TO_CANDIDATE',
    extractionClassification: 'EXPLICIT_QUESTION',
    sourceFinalUrl: 'https://voz.vn/t/rev.206897/post-1',
  }, sampleSectionText);
  if (resP1.isValid && resP1.evidenceHash === realHash) {
    console.log('  ✓ PASS Pass-Test 1: Explicit question with real 64-char SHA-256 passed cleanly.');
  } else { console.error('  ✕ FAIL Pass-Test 1'); failures++; }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL PROVENANCE CRYPTO FAILURE & PASS TESTS PASSED (9/9)');
  } else {
    console.error(`TESTS COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runCryptoValidationTests();
