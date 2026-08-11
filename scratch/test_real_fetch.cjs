async function testRedditPublicApi() {
  console.log('Testing Reddit public search API...');
  const searchUrl = 'https://www.reddit.com/r/vozforums/search.json?q=ph%E1%BB%8Fng+v%E1%BA%A5n&restrict_sr=1&sort=new&limit=5';
  try {
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'InterviewHub-PublicIngestionBot/1.0 (educational research tool)',
      },
    });
    console.log('Reddit HTTP Status:', res.status);
    if (res.ok) {
      const data = await res.json();
      const children = data?.data?.children || [];
      console.log(`Discovered ${children.length} real Reddit posts:`);
      children.forEach((c, i) => {
        console.log(`  ${i + 1}. [${c.data.title}] - https://www.reddit.com${c.data.permalink}`);
      });
    }
  } catch (err) {
    console.error('Reddit fetch failed:', err);
  }
}

testRedditPublicApi();
