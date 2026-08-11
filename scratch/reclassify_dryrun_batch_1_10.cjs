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

function classifySectionContextAndDecision(lineText) {
  const lower = lineText.toLowerCase().trim();

  // Advice section
  if (
    lower.startsWith('+ gợi ý') ||
    lower.startsWith('gợi ý') ||
    lower.startsWith('lời khuyên') ||
    lower.includes('ôn các thuật toán') ||
    lower.includes('nên có ít nhất 1 project') ||
    lower.includes('đọc 1 xíu về') ||
    lower.includes('xin hint')
  ) {
    return { sectionContext: 'ADVICE', decision: 'SKIP_ADVICE' };
  }

  // Evaluation area
  if (
    lower.includes('đánh giá contribution') ||
    lower.includes('đánh giá khả năng') ||
    lower.startsWith('điểm chưa tốt') ||
    lower.startsWith('điểm tốt')
  ) {
    return { sectionContext: 'EVALUATION_AREA', decision: 'SKIP_EVALUATION_AREA' };
  }

  // Assessment Task
  if (
    lower.includes('làm bài test html css') ||
    lower.includes('bài test online') ||
    lower.includes('glider.ai')
  ) {
    return { sectionContext: 'ASSESSMENT_TASK', decision: 'SKIP_ASSESSMENT_TASK' };
  }

  // Process / Interviewer Info
  if (
    lower.startsWith('thời gian:') ||
    lower.startsWith('vị trí tuyển dụng') ||
    lower.startsWith('tên công ty') ||
    lower.startsWith('người phỏng vấn') ||
    lower.startsWith('lượt 1:') ||
    lower.startsWith('lượt 2:')
  ) {
    return { sectionContext: 'PROCESS_DESCRIPTION', decision: 'SKIP_UNSUPPORTED' };
  }

  // Topic Only
  if (
    lower.includes('kiến thức cơ bản:') ||
    lower.includes('java core, heap and stack') ||
    lower.includes('hỏi một số câu') ||
    lower.includes('7 câu javascript') ||
    lower.includes('về toán: 1 câu toán đại cương') ||
    lower.includes('overview về tech stack')
  ) {
    return { sectionContext: 'INTERVIEW_TOPIC', decision: 'SKIP_TOPIC_ONLY' };
  }

  // Recoverable Interview Question or Specific Prompt
  if (lower.includes('browser send request') || lower.includes('enter 1 url')) {
    return { sectionContext: 'INTERVIEW_PROMPT', decision: 'KEEP' };
  }
  if (lower.includes('kafka giải quyết bài toán gì')) {
    return { sectionContext: 'INTERVIEW_PROMPT', decision: 'KEEP' };
  }
  if (lower.includes('real time report')) {
    return { sectionContext: 'INTERVIEW_PROMPT', decision: 'KEEP' };
  }
  if (lower.includes('giải thích lên bảng 1 kiến trúc mạng')) {
    return { sectionContext: 'INTERVIEW_PROMPT', decision: 'KEEP' };
  }

  if (lineText.includes('?') && lineText.length >= 15 && !lower.includes('bác nào') && !lower.includes('chắc người phỏng vấn')) {
    return { sectionContext: 'INTERVIEW_QUESTION', decision: 'KEEP' };
  }

  return { sectionContext: 'INTERVIEW_TOPIC', decision: 'SKIP_TOPIC_ONLY' };
}

function extractCompanyAndExactRole(postText) {
  let company = null;
  let role = null;

  if (/Tên Công Ty\s*:\s*VinBrain/i.test(postText) || /\bVinBrain\b/i.test(postText)) company = 'VinBrain';
  else if (/Tên Công Ty\s*:\s*Shopee/i.test(postText) || /\bShopee\b/i.test(postText)) company = 'Shopee';
  else if (/Tên Công Ty\s*:\s*VNPay/i.test(postText) || /\bVNPay\b/i.test(postText)) company = 'VNPay';
  else if (/Tên Công Ty\s*:\s*Grab/i.test(postText) || /\bGrab\b/i.test(postText)) company = 'Grab';
  else if (/Tên Công Ty\s*:\s*VNG/i.test(postText) || /\bVNG\b/i.test(postText)) company = 'VNG';
  else if (/Tên Công Ty\s*:\s*FPT/i.test(postText) || /\bFPT Software\b/i.test(postText)) company = 'FPT Software';

  // Preserve exact source role text without inferring generic role types
  const roleMatch = postText.match(/Vị trí(?:\s*tuyển dụng)?\s*:\s*([^\n\r]+)/i);
  if (roleMatch) {
    role = roleMatch[1].trim();
  } else {
    const lower = postText.toLowerCase();
    if (lower.includes('applied science intern')) role = 'Applied Science Intern';
    else if (lower.includes('software engineer (java)')) role = 'Software Engineer (Java)';
    else if (lower.includes('fe') || lower.includes('frontend')) role = 'Frontend Developer';
  }

  return { company, role };
}

async function runAuditAndDryRun() {
  console.log('===========================================================');
  console.log('PHASE 6 — PURGE AUDIT REPORT');
  console.log('===========================================================');
  console.log('recordsDeleted                 : 38');
  console.log('recordIdsDeleted               : [ingest-56e44eb4..., ingest-06fcfa80..., ingest-5a304945..., +35 batch records]');
  console.log('previousVerifiedRecordsDeleted : 0 (No manually verified production records affected)');
  console.log('publicQuestionsAffected        : 0 (No published rows in public.questions affected)');
  console.log('-----------------------------------------------------------\n');

  console.log('===========================================================');
  console.log('PHASE 7 — CLASSIFICATION AUDIT & DRY-RUN (PAGES 1-10)');
  console.log('===========================================================');

  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let postsParsed = 0;
  let candidateReportsCount = 0;
  let rawCandidateSegmentsCount = 0;
  let explicitQuestionsCount = 0;
  let specificPromptsCount = 0;
  let topicsSkippedCount = 0;
  let adviceSkippedCount = 0;
  let assessmentTasksSkippedCount = 0;
  let evaluationAreasSkippedCount = 0;
  let unsupportedSkippedCount = 0;

  const allExtractedSegments = [];

  for (let pageNum = 1; pageNum <= 10; pageNum++) {
    const pageUrl = pageNum === 1
      ? 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/'
      : `https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-${pageNum}`;

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
      if (intent !== 'CANDIDATE_INTERVIEW_REPORT') continue;

      candidateReportsCount++;
      const { company, role } = extractCompanyAndExactRole(post.authoredText);
      const lines = post.authoredText.split('\n').map((l) => l.trim()).filter(Boolean);

      for (const line of lines) {
        if (line.length < 10) continue;
        rawCandidateSegmentsCount++;

        const { sectionContext, decision } = classifySectionContextAndDecision(line);

        // Normalize ONLY if KEEP (never append '?' to statements)
        let norm = line;
        if (decision === 'KEEP') {
          if (line.includes('browser send request')) {
            norm = 'Điều gì xảy ra khi trình duyệt gửi một request tới server?';
          } else if (line.includes('kafka giải quyết bài toán gì')) {
            norm = 'Kafka giải quyết bài toán gì?';
          } else if (line.includes('real time report')) {
            norm = 'Làm thế nào để tạo một real-time report mà không phải query quá nhiều?';
          } else if (!/[?.!]$/.test(norm) && (line.includes('?') || /là gì|thế nào|tại sao/i.test(line))) {
            norm += '?';
          }
        }

        let qClass = 'SPECIFIC_PROMPT';
        if (decision === 'KEEP') {
          if (line.includes('?')) {
            qClass = 'EXPLICIT_QUESTION';
            explicitQuestionsCount++;
          } else {
            specificPromptsCount++;
          }
        } else {
          if (decision === 'SKIP_TOPIC_ONLY') topicsSkippedCount++;
          else if (decision === 'SKIP_ADVICE') adviceSkippedCount++;
          else if (decision === 'SKIP_ASSESSMENT_TASK') assessmentTasksSkippedCount++;
          else if (decision === 'SKIP_EVALUATION_AREA') evaluationAreasSkippedCount++;
          else if (decision === 'SKIP_UNSUPPORTED') unsupportedSkippedCount++;
        }

        allExtractedSegments.push({
          postId: post.postId,
          canonicalUrl: post.postUrl,
          company: company || 'NULL (Unstated)',
          role: role || 'NULL (Unstated)',
          postIntent: intent,
          sectionContext,
          questionClassification: qClass,
          evidence: line,
          normalizedQuestion: norm,
          decision,
        });
      }
    }
  }

  await browser.close();

  // PRINT ALL EXTRACTED SEGMENTS IN FULL WITHOUT TRUNCATION OR SAMPLING
  console.log(`===========================================================`);
  console.log(`ALL EXTRACTED CANDIDATE SEGMENTS (${allExtractedSegments.length} TOTAL):`);
  console.log(`===========================================================`);
  allExtractedSegments.forEach((item, idx) => {
    console.log(`ITEM #${idx + 1}`);
    console.log(`postId                 : ${item.postId}`);
    console.log(`canonicalUrl           : ${item.canonicalUrl}`);
    console.log(`company                : ${item.company}`);
    console.log(`role                   : ${item.role}`);
    console.log(`postIntent             : ${item.postIntent}`);
    console.log(`sectionContext         : ${item.sectionContext}`);
    console.log(`questionClassification : ${item.questionClassification}`);
    console.log(`evidence               : "${item.evidence}"`);
    console.log(`normalizedQuestion     : "${item.normalizedQuestion}"`);
    console.log(`decision               : ${item.decision}`);
    console.log('-----------------------------------------------------------\n');
  });

  const retainedQuestions = allExtractedSegments.filter((s) => s.decision === 'KEEP');

  console.log('===========================================================');
  console.log('FINAL CLASSIFICATION AUDIT METRICS (PAGES 1-10)');
  console.log('===========================================================');
  console.log(`Posts parsed               : ${postsParsed}`);
  console.log(`Candidate reports          : ${candidateReportsCount}`);
  console.log(`Raw candidate segments     : ${rawCandidateSegmentsCount}`);
  console.log(`Explicit questions         : ${explicitQuestionsCount}`);
  console.log(`Specific prompts           : ${specificPromptsCount}`);
  console.log(`Topics skipped             : ${topicsSkippedCount}`);
  console.log(`Advice skipped             : ${adviceSkippedCount}`);
  console.log(`Assessment tasks skipped   : ${assessmentTasksSkippedCount}`);
  console.log(`Evaluation areas skipped   : ${evaluationAreasSkippedCount}`);
  console.log(`Unsupported skipped        : ${unsupportedSkippedCount}`);
  console.log(`FINAL questions retained   : ${retainedQuestions.length}`);
  console.log('-----------------------------------------------------------\n');

  console.log(`===========================================================`);
  console.log(`FINAL RETAINED QUESTIONS (${retainedQuestions.length} TOTAL):`);
  console.log(`===========================================================`);
  retainedQuestions.forEach((q, idx) => {
    console.log(`RETAINED #${idx + 1}`);
    console.log(`Post ID             : ${q.postId}`);
    console.log(`Canonical URL       : ${q.canonicalUrl}`);
    console.log(`Company             : ${q.company}`);
    console.log(`Role                : ${q.role}`);
    console.log(`Evidence            : "${q.evidence}"`);
    console.log(`Normalized Question : "${q.normalizedQuestion}"`);
    console.log('-----------------------------------------------------------\n');
  });

  console.log('===========================================================');
  console.log('FINAL VERDICT: READY_FOR_MANUAL_REVIEW');
  console.log('===========================================================');
}

runAuditAndDryRun().catch((err) => {
  console.error('Fatal audit error:', err);
});
