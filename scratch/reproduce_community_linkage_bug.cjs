const { chromium } = require('playwright');
const path = require('path');

async function reproduceBug() {
  console.log('===========================================================');
  console.log('STEP 1: REPRODUCE COMMUNITY PUBLISH LINKAGE BUG ON PRODUCTION');
  console.log('===========================================================');

  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const timestamp = Date.now();
  const qaTitle = `[QA-PUBLISH-LINK-${timestamp}] What is the difference between UseState and UseRef in React?`;

  try {
    // 1. Login as QA User
    console.log('Logging in as QA User subinpro2005@gmail.com...');
    await page.goto('https://interview-hubb.vercel.app/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', 'subinpro2005@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // 2. Submit Question
    console.log(`Submitting question "${qaTitle}"...`);
    await page.goto('https://interview-hubb.vercel.app/submit-question', { waitUntil: 'networkidle' });
    await page.fill('input[name="title"]', qaTitle);
    await page.fill('input[name="company"]', 'VNG');
    await page.fill('input[name="role"]', 'Frontend Engineer');
    await page.fill('textarea[name="originalText"]', 'Interviewer asked: Explain useState vs useRef in React and when to use each.');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
    console.log('✓ Question submitted successfully!');

    // 3. Logout
    console.log('Logging out normal user...');
    await page.goto('https://interview-hubb.vercel.app/login', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // 4. Login as Admin
    console.log('Logging in as Admin QA gamecuasoine@gmail.com...');
    await page.fill('input[type="email"]', 'gamecuasoine@gmail.com');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // 5. Navigate to Admin Community Moderation Queue
    console.log('Navigating to Admin Community Queue...');
    await page.goto('https://interview-hubb.vercel.app/admin/community', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // Find submission
    const card = page.locator('div', { hasText: qaTitle }).first();
    const isVisible = await card.isVisible();
    console.log(`QA Submission Card Visible: ${isVisible}`);

    if (isVisible) {
      // Click View / Detail
      const detailBtn = card.locator('button:has-text("Review"), button:has-text("Detail"), a:has-text("Review")').first();
      if (await detailBtn.isVisible()) {
        await detailBtn.click();
        await page.waitForTimeout(2000);
      }

      // Record ID before approval
      const urlBefore = page.url();
      console.log('URL before approval:', urlBefore);

      // Click Approve
      console.log('Clicking Approve button...');
      const approveBtn = page.locator('button:has-text("Approve"), button:has-text("Duyệt")').first();
      if (await approveBtn.isVisible()) {
        await approveBtn.click();
        await page.waitForTimeout(2000);

        // Confirm modal if present
        const confirmBtn = page.locator('button:has-text("Confirm"), button:has-text("Xác nhận")').first();
        if (await confirmBtn.isVisible()) {
          await confirmBtn.click();
          await page.waitForTimeout(3000);
        }
      }

      // Check for published question link / CTA
      console.log('Looking for Published Question link after approval...');
      const publishedLink = page.locator('a[href*="/questions/"]').first();
      if (await publishedLink.isVisible()) {
        const href = await publishedLink.getAttribute('href');
        console.log('Published Link href:', href);

        await publishedLink.click();
        await page.waitForTimeout(3000);

        const currentUrlAfterClick = page.url();
        const pageText = await page.innerText('body');
        console.log('URL after clicking published link:', currentUrlAfterClick);
        console.log('Page contains "Question Not Found":', pageText.includes('Question Not Found') || pageText.includes('không tìm thấy'));

        const artifactPath = path.join('C:', 'Users', 'van hieu', '.gemini', 'antigravity-ide', 'brain', '12250ade-aa8a-4caf-8db5-e20b97b8239e', 'reproduce_community_linkage_bug.png');
        await page.screenshot({ path: artifactPath });
        console.log('Screenshot saved to:', artifactPath);
      } else {
        console.log('No direct published link found on page.');
      }
    }
  } catch (err) {
    console.error('Error during reproduction:', err);
  } finally {
    await browser.close();
  }
}

reproduceBug();
