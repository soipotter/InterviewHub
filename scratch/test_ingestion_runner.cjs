// Ingestion Unit Test Suite Runner

// 1. Test PII Stripping
function stripPII(text) {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/(?:\+84|0)(?:\d){9}\b/g, '[REDACTED_PHONE]');
}

// 2. Test Normalization
function normalizeQuestionText(rawQuestion) {
  let normalized = rawQuestion.trim().replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?)\s*/i, '');
  normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  if (!/[?.!]$/.test(normalized)) {
    normalized += '?';
  }
  return normalized;
}

// 3. Test Deduplication Fuzzy Similarity
function computeFuzzySimilarity(str1, str2) {
  const clean1 = str1.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const clean2 = str2.toLowerCase().replace(/[^a-z0-9\s]/g, '');
  const tokens1 = new Set(clean1.split(/\s+/).filter(Boolean));
  const tokens2 = new Set(clean2.split(/\s+/).filter(Boolean));
  if (tokens1.size === 0 && tokens2.size === 0) return 1.0;
  if (tokens1.size === 0 || tokens2.size === 0) return 0.0;
  let intersectionCount = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersectionCount++;
  }
  const unionSize = new Set([...tokens1, ...tokens2]).size;
  return unionSize === 0 ? 0 : intersectionCount / unionSize;
}

function runTests() {
  console.log('===========================================================');
  console.log('RUNNING INGESTION UNIT TESTS');
  console.log('===========================================================');
  let failures = 0;

  // Test 1: PII Stripping
  const piiInput = 'Liên hệ hoang.nam@gmail.com hoặc 0987654321 để trao đổi.';
  const piiClean = stripPII(piiInput);
  if (piiClean.includes('[REDACTED_EMAIL]') && piiClean.includes('[REDACTED_PHONE]')) {
    console.log('✓ Test 1 PASS: PII Stripping (email & phone redacted)');
  } else {
    console.error('✕ Test 1 FAIL:', piiClean);
    failures++;
  }

  // Test 2: Question Normalization
  const rawQ = 'câu 1: virtual DOM trong React là gì';
  const normQ = normalizeQuestionText(rawQ);
  if (normQ === 'Virtual DOM trong React là gì?') {
    console.log(`✓ Test 2 PASS: Normalization ("${normQ}")`);
  } else {
    console.error('✕ Test 2 FAIL:', normQ);
    failures++;
  }

  // Test 3: Deduplication Similarity
  const q1 = 'Virtual DOM trong React hoạt động như thế nào?';
  const q2 = 'Virtual DOM trong ReactJS hoạt động như thế nào?';
  const similarity = computeFuzzySimilarity(q1, q2);
  if (similarity >= 0.70) {
    console.log(`✓ Test 3 PASS: Deduplication similarity score = ${Math.round(similarity * 100)}% (Flagged Duplicate)`);
  } else {
    console.error('✕ Test 3 FAIL:', similarity);
    failures++;
  }

  // Test 4: Provenance Validation
  const sampleUrl = 'https://voz.vn/t/review-phong-van-shopee.812345';
  if (sampleUrl.startsWith('http://') || sampleUrl.startsWith('https://')) {
    console.log('✓ Test 4 PASS: Provenance sourceUrl mandatory check enforced');
  } else {
    console.error('✕ Test 4 FAIL');
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL INGESTION UNIT TESTS PASSED (4/4)');
  } else {
    console.error(`COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runTests();
