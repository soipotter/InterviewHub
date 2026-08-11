function parseXenForoMaxPage(htmlOrText) {
  let currentPage = 1;
  let reportedTotalPages = 1;
  let lastPageHref = null;
  let discoveredMaxPage = 1;

  // 1. Textual state parser (e.g. "60 of 102" or "Page 60 of 102")
  const textMatch = htmlOrText.match(/(?:page\s*)?(\d+)\s+of\s+(\d+)/i);
  if (textMatch) {
    currentPage = parseInt(textMatch[1], 10);
    reportedTotalPages = parseInt(textMatch[2], 10);
  }

  // 2. Explicit "Last" link parser (e.g. href=".../page-102")
  const lastLinkMatch = htmlOrText.match(/href="[^"]*\/page-(\d+)"[^>]*class="[^"]*pageNav-jump--last/i) ||
    htmlOrText.match(/class="[^"]*pageNav-jump--last[^"]*"[^>]*href="[^"]*\/page-(\d+)"/i);

  if (lastLinkMatch) {
    reportedTotalPages = parseInt(lastLinkMatch[1], 10);
    lastPageHref = lastLinkMatch[0];
  }

  // 3. Collect ALL numeric page links in pagination DOM
  const pageMatches = Array.from(htmlOrText.matchAll(/\/page-(\d+)/g));
  let maxFoundInLinks = reportedTotalPages;
  pageMatches.forEach((m) => {
    const p = parseInt(m[1], 10);
    if (p > maxFoundInLinks) maxFoundInLinks = p;
  });

  discoveredMaxPage = Math.max(reportedTotalPages, maxFoundInLinks);

  const isInvariantValid = discoveredMaxPage === reportedTotalPages;

  return {
    currentPage,
    reportedTotalPages,
    lastPageHref,
    discoveredMaxPage,
    isInvariantValid,
  };
}

export function runMaxPageDiscoveryTests() {
  console.log('===========================================================');
  console.log('REGRESSION TESTS: XENFORO MAX-PAGE DISCOVERY (PAGE 102)');
  console.log('===========================================================');
  let failures = 0;

  // Fixture 1: Page 60 HTML containing "60 of 102" and Last page link 102
  const page60Fixture = `
    <div class="pageNav">
      <span class="pageNav-page">60 of 102</span>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-58">58</a>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-59">59</a>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-60" class="pageNav-page--current">60</a>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-61">61</a>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-102" class="pageNav-jump pageNav-jump--last">102</a>
    </div>
  `;

  const res60 = parseXenForoMaxPage(page60Fixture);
  if (res60.currentPage === 60 && res60.discoveredMaxPage === 102 && res60.isInvariantValid) {
    console.log('  ✓ PASS Test 1: Page 60 fixture correctly resolves max page = 102 (NOT 60).');
  } else {
    console.error(`  ✕ FAIL Test 1: Expected max 102, got ${res60.discoveredMaxPage}`);
    failures++;
  }

  // Fixture 2: Page 1 HTML
  const page1Fixture = `
    <div class="pageNav">
      <span class="pageNav-page">1 of 102</span>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-1" class="pageNav-page--current">1</a>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-2">2</a>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-102" class="pageNav-jump pageNav-jump--last">102</a>
    </div>
  `;
  const res1 = parseXenForoMaxPage(page1Fixture);
  if (res1.currentPage === 1 && res1.discoveredMaxPage === 102 && res1.isInvariantValid) {
    console.log('  ✓ PASS Test 2: Page 1 fixture correctly resolves max page = 102.');
  } else {
    console.error(`  ✕ FAIL Test 2: Expected max 102, got ${res1.discoveredMaxPage}`);
    failures++;
  }

  // Fixture 3: Page 102 HTML
  const page102Fixture = `
    <div class="pageNav">
      <span class="pageNav-page">102 of 102</span>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-101">101</a>
      <a href="/t/review-phong-van-cac-cong-ty-cntt.206897/page-102" class="pageNav-page--current">102</a>
    </div>
  `;
  const res102 = parseXenForoMaxPage(page102Fixture);
  if (res102.currentPage === 102 && res102.discoveredMaxPage === 102 && res102.isInvariantValid) {
    console.log('  ✓ PASS Test 3: Page 102 fixture correctly resolves max page = 102.');
  } else {
    console.error(`  ✕ FAIL Test 3: Expected max 102, got ${res102.discoveredMaxPage}`);
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL MAX-PAGE DISCOVERY REGRESSION TESTS PASSED (3/3)');
  } else {
    console.error(`TESTS COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runMaxPageDiscoveryTests();
