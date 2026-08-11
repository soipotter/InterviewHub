const { chromium } = require('playwright');

async function verifyProductionFix() {
  console.log('Launching Playwright Chromium with explicit executable path...');
  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://interview-hubb.vercel.app/questions/comm-0c0fa6d6fde9454d9c0773234046781f';
  console.log('Navigating to canonical production URL:', url);
  await page.goto(url, { waitUntil: 'networkidle' });

  // Take screenshot
  const screenshotPath = 'C:\\Users\\van hieu\\.gemini\\antigravity-ide\\brain\\12250ade-aa8a-4caf-8db5-e20b97b8239e\\production_fix_verified.png';
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot to:', screenshotPath);

  // Read heading and page text
  const titleText = await page.locator('h1').innerText().catch(() => 'NO_H1');
  const pageText = await page.innerText('body');
  const isNotFound = pageText.includes('Question Not Found');

  console.log('==================================================');
  console.log('CANONICAL PRODUCTION VERIFICATION RESULTS');
  console.log('==================================================');
  console.log('URL:', page.url());
  console.log('H1 Question Title:', titleText);
  console.log('Is "Question Not Found" present?:', isNotFound);
  console.log('==================================================');

  await browser.close();
}

verifyProductionFix().catch(err => {
  console.error('Error running verification:', err);
});
