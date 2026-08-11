function validateProvenanceRecord(record, fetchedHtml) {
  if (record.sourceHttpStatus !== 200) {
    throw new Error(`Provenance Rejected: HTTP status is ${record.sourceHttpStatus} (expected 200 OK).`);
  }

  if (record.sourcePageTitle?.toLowerCase().includes('404 not found')) {
    throw new Error(`Provenance Rejected: Source page title indicates 404 Not Found.`);
  }

  if (!fetchedHtml || !fetchedHtml.trim()) {
    throw new Error(`Provenance Rejected: Fetched HTML content is empty.`);
  }

  const cleanHtml = fetchedHtml.toLowerCase().replace(/\s+/g, ' ');
  const cleanEvidence = record.sourceEvidenceText.toLowerCase().replace(/\s+/g, ' ').trim();

  if (cleanEvidence.length > 5 && !cleanHtml.includes(cleanEvidence)) {
    throw new Error(`Provenance Rejected: Supporting evidence text "${record.sourceEvidenceText}" not found in raw fetched HTML.`);
  }

  return true;
}

function runTests() {
  console.log('===========================================================');
  console.log('PHASE 6 — AUTOMATED PROVENANCE VALIDATION UNIT TESTS');
  console.log('===========================================================');
  let failures = 0;

  // Test 1: 404 Source Rejection
  try {
    validateProvenanceRecord({
      sourceHttpStatus: 404,
      sourcePageTitle: '404 Not Found',
      sourceEvidenceText: 'Virtual DOM là gì',
    }, '<html>404 Not Found</html>');
    console.error('  ✕ FAIL: 404 source was not rejected.');
    failures++;
  } catch (err) {
    console.log('  ✓ PASS Test 1: HTTP 404 source correctly rejected:', err.message);
  }

  // Test 2: Unrelated Page Title Rejection
  try {
    validateProvenanceRecord({
      sourceHttpStatus: 200,
      sourcePageTitle: '404 Not Found - voz.vn',
      sourceEvidenceText: 'FPT Software phỏng vấn',
    }, '<html>404 Not Found - voz.vn</html>');
    console.error('  ✕ FAIL: 404 title was not rejected.');
    failures++;
  } catch (err) {
    console.log('  ✓ PASS Test 2: Page title 404 correctly rejected:', err.message);
  }

  // Test 3: Missing Evidence Rejection
  try {
    validateProvenanceRecord({
      sourceHttpStatus: 200,
      sourcePageTitle: 'Review Phỏng Vấn',
      sourceEvidenceText: 'Synthetic text not present in html',
    }, '<html><body>Shopee FE test online glider.ai</body></html>');
    console.error('  ✕ FAIL: Missing evidence was not rejected.');
    failures++;
  } catch (err) {
    console.log('  ✓ PASS Test 3: Missing evidence correctly rejected:', err.message);
  }

  // Test 4: Valid Evidence Acceptance
  try {
    const isValid = validateProvenanceRecord({
      sourceHttpStatus: 200,
      sourcePageTitle: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
      sourceEvidenceText: 'mô hình tcp/ip và mô hình osi',
    }, '<html><title>thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ</title><body>Ảnh hỏi mình về mô hình tcp/ip và mô hình osi</body></html>');
    if (isValid) {
      console.log('  ✓ PASS Test 4: Valid real provenance record correctly accepted.');
    }
  } catch (err) {
    console.error('  ✕ FAIL Test 4:', err.message);
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL PROVENANCE VALIDATION UNIT TESTS PASSED (4/4)');
  } else {
    console.error(`COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runTests();
