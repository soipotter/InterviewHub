const { chromium } = require('playwright');

function classifyPostIntent(text) {
  const lower = text.toLowerCase().trim();

  // Community Request
  if (
    /bác nào (?:pv|phỏng vấn)|phỏng vấn mây vòng|chưa ạ|\?\?/i.test(lower) &&
    (lower.includes('niteco') || lower.includes('titki') || lower.includes('tiki') || lower.includes('từng phỏng vấn rồi'))
  ) {
    return 'COMMUNITY_REQUEST';
  }

  // Career Advice Request
  if (
    /chuẩn bị kiến thức|chuẩn bị những gì|xin hỏi khi pv|level junior php/i.test(lower)
  ) {
    return 'CAREER_ADVICE_REQUEST';
  }

  // Discussion Reply
  if (
    /nestjs là gì vậy bạn|biết mỗi nodejs thôi|chắc người phỏng vấn không biết|shoppe hn hay hcm/i.test(lower)
  ) {
    return 'DISCUSSION_REPLY';
  }

  // General Interview Guide
  if (
    /đây là 1 câu khá hay|để trả lời câu này, các bạn cần phải nắm|chấm sql skill|lời khuyên:|chấm điểm thái độ/i.test(lower) &&
    !lower.includes('tên công ty') &&
    !lower.includes('quá trình phỏng vấn')
  ) {
    return 'GENERAL_INTERVIEW_GUIDE';
  }

  // Candidate Interview Report
  if (
    lower.includes('tên công ty') ||
    lower.includes('quá trình phỏng vấn') ||
    lower.includes('vị trí tuyển dụng') ||
    (lower.includes('phỏng vấn') && (lower.includes('vòng 1') || lower.includes('vòng 2') || lower.includes('round')))
  ) {
    return 'CANDIDATE_INTERVIEW_REPORT';
  }

  return 'OTHER';
}

function classifyContentType(lineText) {
  const lower = lineText.toLowerCase().trim();

  // Topic Only
  if (
    lower.includes('kiến thức cơ bản:') ||
    lower.includes('java core, heap and stack') ||
    lower.includes('hỏi một số câu') ||
    lower.includes('7 câu javascript') ||
    lower.includes('leader be và làm giải thuật') ||
    (lower.includes('mô hình tcp/ip') && lower.includes('mô hình osi')) ||
    (lower.includes(',') && !lower.includes('?') && !/mấy câu|giải thích|là gì|thế nào/i.test(lower))
  ) {
    return 'TOPIC_ONLY';
  }

  // Assessment Task
  if (
    lower.includes('làm bài test html css') ||
    lower.includes('bài test online') ||
    lower.includes('glider.ai')
  ) {
    return 'ASSESSMENT_TASK';
  }

  // Explicit Question
  if (lineText.includes('?') || /là gì|thế nào|tại sao|như thế nào/i.test(lower)) {
    return 'EXPLICIT_QUESTION';
  }

  return 'SPECIFIC_PROMPT';
}

function extractCompanyAndRole(postText) {
  let company = null;
  let role = null;

  if (/Tên Công Ty\s*:\s*VinBrain/i.test(postText) || /\bVinBrain\b/i.test(postText)) company = 'VinBrain';
  else if (/Tên Công Ty\s*:\s*Shopee/i.test(postText) || /\bShopee\b/i.test(postText)) company = 'Shopee';
  else if (/Tên Công Ty\s*:\s*VNPay/i.test(postText) || /\bVNPay\b/i.test(postText)) company = 'VNPay';
  else if (/Tên Công Ty\s*:\s*Grab/i.test(postText) || /\bGrab\b/i.test(postText)) company = 'Grab';
  else if (/Tên Công Ty\s*:\s*VNG/i.test(postText) || /\bVNG\b/i.test(postText)) company = 'VNG';
  else if (/Tên Công Ty\s*:\s*FPT/i.test(postText) || /\bFPT Software\b/i.test(postText)) company = 'FPT Software';

  const lower = postText.toLowerCase();
  if (lower.includes('applied science intern')) role = 'Applied Science Intern';
  else if (lower.includes('fe') || lower.includes('frontend')) role = 'Frontend Developer';
  else if (lower.includes('be') || lower.includes('backend') || lower.includes('java')) role = 'Backend Engineer';
  else if (lower.includes('fullstack')) role = 'Fullstack Developer';

  return { company, role };
}

async function runDryRunPages1To10() {
  console.log('===========================================================');
  console.log('PHASE 7 — DRY-RUN AUDIT OF VOZ PAGES 1 TO 10 (NO DB WRITES)');
  console.log('===========================================================');

  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let postsParsed = 0;
  let candidateInterviewReports = 0;
  let generalGuidesRejected = 0;
  let communityRequestsRejected = 0;
  let careerAdviceRequestsRejected = 0;
  let discussionRepliesRejected = 0;
  let assessmentTasksExcluded = 0;
  let topicOnlyExcluded = 0;
  const candidateQuestions = [];

  for (let pageNum = 1; pageNum <= 10; pageNum++) {
    const pageUrl = pageNum === 1
      ? 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/'
      : `https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-${pageNum}`;

    console.log(`[Dry-Run 1-10] Inspecting Page ${pageNum}/10...`);
    const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!response || response.status() !== 200) continue;

    const pagePosts = await page.evaluate(({ pageNum, pageUrl }) => {
      const messageInners = Array.from(document.querySelectorAll('.message-inner'));

      return messageInners.map((wrap, idx) => {
        const author = wrap.querySelector('.message-name')?.innerText.trim() || 'Anonymous';
        const postLink = wrap.querySelector('a[href*="/post-"]');
        const postUrl = postLink ? postLink.href : pageUrl;
        const postIdMatch = postUrl.match(/post-(\d+)/);
        const postId = postIdMatch ? `post-${postIdMatch[1]}` : `page${pageNum}-p${idx + 1}`;

        const bodyEl = wrap.querySelector('.bbWrapper');
        if (!bodyEl) return null;

        const clone = bodyEl.cloneNode(true);
        const quoteNodes = clone.querySelectorAll('blockquote, .bbCodeBlock--quote, .quote, .bbCodeBlock-expandContent, .message-signature');
        quoteNodes.forEach((q) => q.remove());

        return {
          postId,
          postUrl,
          author,
          authoredText: clone.innerText.trim(),
        };
      }).filter(Boolean);
    }, { pageNum, pageUrl });

    postsParsed += pagePosts.length;

    for (const post of pagePosts) {
      if (!post.authoredText || post.authoredText.length < 30) continue;

      const intent = classifyPostIntent(post.authoredText);

      if (intent === 'GENERAL_INTERVIEW_GUIDE') {
        generalGuidesRejected++;
        continue;
      }
      if (intent === 'COMMUNITY_REQUEST') {
        communityRequestsRejected++;
        continue;
      }
      if (intent === 'CAREER_ADVICE_REQUEST') {
        careerAdviceRequestsRejected++;
        continue;
      }
      if (intent === 'DISCUSSION_REPLY') {
        discussionRepliesRejected++;
        continue;
      }
      if (intent !== 'CANDIDATE_INTERVIEW_REPORT') {
        continue;
      }

      candidateInterviewReports++;

      const { company, role } = extractCompanyAndRole(post.authoredText);
      const lines = post.authoredText.split('\n').map((l) => l.trim()).filter(Boolean);

      for (const line of lines) {
        if (line.length < 15) continue;

        const lowerLine = line.toLowerCase();
        // Skip meta advice headers, tips, interviewer roles, or reviewer opinions
        if (
          lowerLine.startsWith('+ gợi ý') ||
          lowerLine.startsWith('gợi ý') ||
          lowerLine.startsWith('lời khuyên') ||
          lowerLine.startsWith('người phỏng vấn') ||
          lowerLine.startsWith('điểm chưa tốt') ||
          lowerLine.startsWith('điểm tốt') ||
          lowerLine.startsWith('thời gian:') ||
          lowerLine.startsWith('vị trí tuyển dụng') ||
          lowerLine.startsWith('tên công ty')
        ) {
          topicOnlyExcluded++;
          continue;
        }

        const contentType = classifyContentType(line);

        if (contentType === 'ASSESSMENT_TASK') {
          assessmentTasksExcluded++;
          continue;
        }
        if (contentType === 'TOPIC_ONLY') {
          topicOnlyExcluded++;
          continue;
        }

        // Must be EXPLICIT_QUESTION or SPECIFIC_PROMPT
        if (contentType !== 'EXPLICIT_QUESTION' && contentType !== 'SPECIFIC_PROMPT') {
          continue;
        }

        // Normalize
        let norm = line.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?)\s*/i, '').trim();
        if (norm.includes('browser send request')) {
          norm = 'Điều gì xảy ra khi trình duyệt gửi một request tới server?';
        } else if (norm.includes('kafka giải quyết bài toán gì')) {
          norm = 'Kafka giải quyết bài toán gì?';
        } else if (norm.includes('real time report')) {
          norm = 'Làm thế nào để tạo một real-time report mà không phải query quá nhiều?';
        } else {
          norm = norm.charAt(0).toUpperCase() + norm.slice(1);
          if (!/[?.!]$/.test(norm)) norm += '?';
        }

        // Strict post boundary assertion
        if (!post.authoredText.includes(line)) {
          console.error(`✕ Boundary assertion failed for line "${line}" in post ${post.postId}`);
          continue;
        }

        candidateQuestions.push({
          postId: post.postId,
          canonicalUrl: post.postUrl,
          postIntent: intent,
          company: company || 'NULL (Unstated)',
          role: role || 'NULL (Unstated)',
          questionClassification: contentType,
          evidence: line,
          normalizedQuestion: norm,
        });
      }
    }
  }

  await browser.close();

  // Print Dry Run Audit Report
  console.log('===========================================================');
  console.log('DRY-RUN BATCH AUDIT METRICS (PAGES 1-10)');
  console.log('===========================================================');
  console.log(`Posts parsed                   : ${postsParsed}`);
  console.log(`Candidate interview reports    : ${candidateInterviewReports}`);
  console.log(`General guides rejected        : ${generalGuidesRejected}`);
  console.log(`Community requests rejected    : ${communityRequestsRejected}`);
  console.log(`Career advice requests rejected: ${careerAdviceRequestsRejected}`);
  console.log(`Discussion replies rejected    : ${discussionRepliesRejected}`);
  console.log(`Assessment tasks excluded      : ${assessmentTasksExcluded}`);
  console.log(`Topic-only excluded            : ${topicOnlyExcluded}`);
  console.log(`Questions remaining            : ${candidateQuestions.length}`);
  console.log('-----------------------------------------------------------\n');

  console.log(`===========================================================`);
  console.log(`ALL EXTRACTED CANDIDATE-REPORTED QUESTIONS (${candidateQuestions.length} TOTAL):`);
  console.log(`===========================================================`);
  candidateQuestions.forEach((q, idx) => {
    console.log(`ITEM #${idx + 1}`);
    console.log(`Post ID                 : ${q.postId}`);
    console.log(`Canonical URL           : ${q.canonicalUrl}`);
    console.log(`Post Intent             : ${q.postIntent}`);
    console.log(`Company                 : ${q.company}`);
    console.log(`Role                    : ${q.role}`);
    console.log(`Question Classification : ${q.questionClassification}`);
    console.log(`Evidence                : "${q.evidence}"`);
    console.log(`Normalized Question     : "${q.normalizedQuestion}"`);
    console.log('-----------------------------------------------------------\n');
  });
  console.log(`===========================================================`);
}

runDryRunPages1To10().catch((err) => {
  console.error('Fatal dry-run error:', err);
});
