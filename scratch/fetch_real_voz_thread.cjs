const { chromium } = require('playwright');

async function fetchRealVozThread() {
  console.log('===========================================================');
  console.log('PHASE 3 — REAL VOZ THREAD DISCOVERY & FETCH (PLAYWRIGHT)');
  console.log('===========================================================');

  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  const requestedUrl = 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/';
  console.log('Navigating to real Voz thread:', requestedUrl);

  const response = await page.goto(requestedUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  const httpStatus = response.status();
  const finalUrl = page.url();
  const pageTitle = await page.title();

  console.log('HTTP Status :', httpStatus);
  console.log('Final URL   :', finalUrl);
  console.log('Page Title  :', pageTitle);
  console.log('-----------------------------------------------------------');

  if (httpStatus !== 200) {
    console.error('✕ Failed: HTTP Status is not 200 OK!');
    await browser.close();
    return;
  }

  // Extract post message elements
  const posts = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article.message, div.bbWrapper'));
    return articles.map((art, idx) => {
      const text = art.innerText.trim();
      return {
        index: idx + 1,
        text,
      };
    }).filter((p) => p.text.length > 50);
  });

  console.log(`Extracted ${posts.length} post elements from thread page.\n`);

  posts.slice(0, 10).forEach((p) => {
    console.log(`--- POST #${p.index} ---`);
    console.log(p.text.substring(0, 200) + '...\n');
  });

  await browser.close();
}

fetchRealVozThread().catch((err) => {
  console.error('Fatal fetch error:', err);
});
