const { chromium } = require('playwright');

async function findMoreVozPosts() {
  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const pagesToScan = [
    'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
    'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-2',
    'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-3',
    'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-4',
  ];

  const candidateExperiences = [];

  for (const pageUrl of pagesToScan) {
    console.log('Scanning Voz thread page:', pageUrl);
    const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
    if (response.status() !== 200) continue;

    const pageTitle = await page.title();
    const finalUrl = page.url();

    const posts = await page.evaluate(({ pageUrl, pageTitle }) => {
      const articles = Array.from(document.querySelectorAll('.message-inner'));
      return articles.map((art) => {
        const author = art.querySelector('.message-name')?.innerText.trim() || 'Anonymous';
        const postLink = art.querySelector('a[href*="/post-"]');
        const postUrl = postLink ? postLink.href : pageUrl;
        const postId = postLink ? postLink.innerText.trim() : '';
        const body = art.querySelector('.bbWrapper')?.innerText.trim() || '';
        return { author, postId, postUrl, body, pageTitle };
      });
    }, { pageUrl, pageTitle });

    for (const p of posts) {
      if (p.body.includes('Tên Công Ty') || p.body.includes('Vị trí') || p.body.includes('hỏi về') || p.body.includes('Phỏng vấn')) {
        candidateExperiences.push({
          requestedUrl: pageUrl,
          finalUrl: p.postUrl || finalUrl,
          httpStatus: response.status(),
          pageTitle,
          author: p.author,
          postId: p.postId,
          body: p.body,
        });
      }
    }
  }

  console.log(`\nDiscovered ${candidateExperiences.length} candidate interview posts across Voz thread pages:\n`);

  candidateExperiences.forEach((exp, i) => {
    console.log(`===========================================================`);
    console.log(`EXPERIENCE #${i + 1} | Author: ${exp.author} | ID: ${exp.postId}`);
    console.log(`URL: ${exp.finalUrl}`);
    console.log(`Title: ${exp.pageTitle}`);
    console.log(`-----------------------------------------------------------`);
    console.log(exp.body);
    console.log(`===========================================================\n`);
  });

  await browser.close();
}

findMoreVozPosts().catch(console.error);
