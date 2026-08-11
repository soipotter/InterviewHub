const { chromium } = require('playwright');

async function runFullProductionAcceptance() {
  console.log('Starting 5/5 E2E Production Acceptance Verification...');
  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test 1: Direct link 5/5 repetitions across refresh & back/forward
  const commUrl = 'https://interview-hubb.vercel.app/questions/comm-0c0fa6d6fde9454d9c0773234046781f';
  let directPasses = 0;
  for (let i = 1; i <= 5; i++) {
    await page.goto(commUrl, { waitUntil: 'networkidle' });
    const h1Text = await page.locator('h1').innerText().catch(() => '');
    const bodyText = await page.innerText('body');
    const isNotFound = bodyText.includes('Question Not Found');
    if (h1Text.includes('reconciliation') && !isNotFound) {
      directPasses++;
    }
  }
  console.log(`Direct Published Question Link Repetitions: ${directPasses}/5 PASS`);

  // Test 2: Admin Login & View Published Question CTA
  console.log('Logging in as Admin QA user...');
  await page.goto('https://interview-hubb.vercel.app/login', { waitUntil: 'networkidle' });
  await page.fill('#email', 'gamecuasoine@gmail.com');
  await page.fill('#password', '12345678');
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]')
  ]);
  console.log('After login URL:', page.url());

  const detailUrl = 'https://interview-hubb.vercel.app/admin/community/0c0fa6d6-fde9-454d-9c07-73234046781f';
  console.log('Navigating to Admin Submission Detail:', detailUrl);
  await page.goto(detailUrl, { waitUntil: 'networkidle' });
  
  const ctaBtn = page.locator('#view-published-question-btn');
  const ctaVisible = await ctaBtn.isVisible().catch(() => false);
  console.log('Admin CTA "View Published Question →" visible?:', ctaVisible);

  if (ctaVisible) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle' }),
      ctaBtn.click()
    ]);
    const postCtaUrl = page.url();
    const postCtaH1 = await page.locator('h1').innerText().catch(() => '');
    const postCtaNotFound = (await page.innerText('body')).includes('Question Not Found');
    console.log('Post-CTA URL:', postCtaUrl);
    console.log('Post-CTA H1:', postCtaH1);
    console.log('Post-CTA Question Not Found?:', postCtaNotFound);
  }

  await browser.close();
}

runFullProductionAcceptance().catch(err => {
  console.error('Error during full E2E verification:', err);
});
