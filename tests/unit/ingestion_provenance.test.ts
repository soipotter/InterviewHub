import { extractionService } from '../../src/features/question-ingestion/services/extractionService';
import { IngestionProvenance } from '../../src/features/question-ingestion/types/ingestion';

async function runProvenanceValidationTests() {
  console.log('===========================================================');
  console.log('PHASE 6 — AUTOMATED PROVENANCE VALIDATION TESTS');
  console.log('===========================================================');
  let failures = 0;

  // Test 1: 404 Source => Rejected
  console.log('Test 1: HTTP 404 Source Rejection');
  try {
    const provenance404: IngestionProvenance = {
      sourceName: 'VozForum',
      sourceUrl: 'https://voz.vn/t/fake-404-thread.999999',
      sourceRequestedUrl: 'https://voz.vn/t/fake-404-thread.999999',
      sourceFinalUrl: 'https://voz.vn/t/fake-404-thread.999999',
      sourceType: 'forum',
      sourcePageTitle: '404 Not Found',
      sourceEvidenceText: 'Virtual DOM là gì',
      sourceFetchedAt: new Date().toISOString(),
      sourceHttpStatus: 404,
      originalText: 'Virtual DOM là gì',
      normalizedQuestion: 'Virtual DOM trong React hoạt động như thế nào?',
      company: 'Shopee',
      role: 'Frontend Developer',
      seniority: 'Fresher',
      category: 'React',
      difficulty: 'Intermediate',
      confidence: 0.95,
      importedAt: new Date().toISOString(),
    };

    extractionService.validateProvenanceRecord(provenance404, '<html>404 Not Found</html>');
    console.error('  ✕ FAIL: 404 record was not rejected.');
    failures++;
  } catch (err) {
    console.log('  ✓ PASS: 404 source record correctly rejected:', (err as Error).message);
  }

  // Test 2: Redirect to Unrelated Page => Rejected
  console.log('\nTest 2: Redirect to Unrelated Page Rejection');
  try {
    const provenanceRedirect: IngestionProvenance = {
      sourceName: 'VozForum',
      sourceUrl: 'https://voz.vn/t/review-phong-van-fpt-software.814001',
      sourceRequestedUrl: 'https://voz.vn/t/review-phong-van-fpt-software.814001',
      sourceFinalUrl: 'https://voz.vn/t/nghe-khong-duoc-tin-ai.814001',
      sourceType: 'forum',
      sourcePageTitle: 'Nghề không được tin ai, đi làm ngày nào cũng bị gạ tình',
      sourceEvidenceText: 'FPT Software phỏng vấn hỏi gì',
      sourceFetchedAt: new Date().toISOString(),
      sourceHttpStatus: 200,
      originalText: 'FPT Software phỏng vấn',
      normalizedQuestion: 'FPT Software phỏng vấn?',
      company: 'FPT Software',
      role: 'Frontend Developer',
      seniority: 'Fresher',
      category: 'React',
      difficulty: 'Junior',
      confidence: 0.95,
      importedAt: new Date().toISOString(),
    };

    extractionService.validateProvenanceRecord(provenanceRedirect, '<html><body>Nghề không được tin ai</body></html>');
    console.error('  ✕ FAIL: Unrelated redirect record was not rejected.');
    failures++;
  } catch (err) {
    console.log('  ✓ PASS: Unrelated redirect record correctly rejected:', (err as Error).message);
  }

  // Test 3: Evidence Absent from HTML => Rejected
  console.log('\nTest 3: Evidence Absent from HTML Rejection');
  try {
    const provenanceNoEvidence: IngestionProvenance = {
      sourceName: 'VozForum',
      sourceUrl: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
      sourceRequestedUrl: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
      sourceFinalUrl: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
      sourceType: 'forum',
      sourcePageTitle: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
      sourceEvidenceText: 'Synthetically invented evidence text not present in html',
      sourceFetchedAt: new Date().toISOString(),
      sourceHttpStatus: 200,
      originalText: 'Synthetically invented evidence text',
      normalizedQuestion: 'Synthetically invented question?',
      company: 'Shopee',
      role: 'Frontend Developer',
      seniority: 'Fresher',
      category: 'React',
      difficulty: 'Intermediate',
      confidence: 0.95,
      importedAt: new Date().toISOString(),
    };

    extractionService.validateProvenanceRecord(provenanceNoEvidence, '<html><body>Shopee FE glider.ai glider.ai</body></html>');
    console.error('  ✕ FAIL: Record with missing evidence was not rejected.');
    failures++;
  } catch (err) {
    console.log('  ✓ PASS: Record with missing evidence correctly rejected:', (err as Error).message);
  }

  // Test 4: Valid Real Fetched Post => Accepted
  console.log('\nTest 4: Valid Real Fetched Post Acceptance');
  const validProvenance: IngestionProvenance = {
    sourceName: 'VozForum',
    sourceUrl: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6383204',
    sourceRequestedUrl: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
    sourceFinalUrl: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cac-cong-ty-cntt.206897/',
    sourceType: 'forum',
    sourcePageTitle: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
    sourceEvidenceText: 'mô hình tcp/ip và mô hình osi',
    sourceFetchedAt: new Date().toISOString(),
    sourceHttpStatus: 200,
    originalText: 'Ảnh hỏi mình về mô hình tcp/ip và mô hình osi',
    normalizedQuestion: 'Em hãy phân biệt mô hình TCP/IP và mô hình OSI trong mạng máy tính?',
    company: 'Shopee',
    role: 'Frontend Developer',
    seniority: 'Fresher',
    category: 'Web Fundamentals',
    difficulty: 'Intermediate',
    confidence: 0.95,
    importedAt: new Date().toISOString(),
  };

  const sampleHtml = '<html><title>thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ</title><body>Tên Công Ty Shopee Vị trí tuyển dụng: FE Ảnh hỏi mình về mô hình tcp/ip và mô hình osi</body></html>';
  const isValid = extractionService.validateProvenanceRecord(validProvenance, sampleHtml);
  if (isValid) {
    console.log('  ✓ PASS: Valid real provenance record correctly accepted.');
  } else {
    console.error('  ✕ FAIL: Valid provenance record was rejected unexpectedly.');
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL PROVENANCE VALIDATION UNIT TESTS PASSED (4/4)');
  } else {
    console.error(`PROVENANCE VALIDATION TESTS COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runProvenanceValidationTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
