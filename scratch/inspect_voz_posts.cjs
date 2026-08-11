const { chromium } = require('playwright');

async function inspectVozPosts() {
  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const url = 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/';
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const posts = await page.evaluate(() => {
    const wrappers = Array.from(document.querySelectorAll('.message-inner'));
    return wrappers.map((wrap) => {
      const author = wrap.querySelector('.message-name')?.innerText.trim() || 'Anonymous';
      const postId = wrap.querySelector('a[href*="/post-"]')?.innerText.trim() || '';
      const postUrl = wrap.querySelector('a[href*="/post-"]')?.href || '';
      const body = wrap.querySelector('.bbWrapper')?.innerText.trim() || '';
      return { author, postId, postUrl, body };
    });
  });

  console.log(`Found ${posts.length} messages on page 1 of Voz thread 206897:\n`);

  posts.forEach((p, i) => {
    if (p.body.includes('phỏng vấn') || p.body.includes('Shopee') || p.body.includes('VNG') || p.body.includes('FPT')) {
      console.log(`===========================================================`);
      console.log(`POST #${i + 1} | Author: ${p.author} | ID: ${p.postId}`);
      console.log(`Post URL: ${p.postUrl}`);
      console.log(`-----------------------------------------------------------`);
      console.log(p.body);
      console.log(`===========================================================\n`);
    }
  });

  await browser.close();
}

inspectVozPosts().catch(console.error);
