const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

function classifyPostIntent(text) {
  const lower = text.toLowerCase().trim();

  // Community Request
  if (
    /bác nào (?:pv|phỏng vấn)|phỏng vấn mây vòng|chưa ạ|\?\?/i.test(lower) &&
    (lower.includes('niteco') || lower.includes('titki') || lower.includes('tiki') || lower.includes('từng phỏng vấn rồi') || lower.includes('ai phỏng vấn chưa'))
  ) {
    return 'COMMUNITY_REQUEST';
  }

  // Career Advice Request
  if (
    /chuẩn bị kiến thức|chuẩn bị những gì|xin hỏi khi pv|level junior php|xin lời khuyên|deal lương ra sao/i.test(lower)
  ) {
    return 'CAREER_ADVICE_REQUEST';
  }

  // Discussion Reply
  if (
    /nestjs là gì vậy bạn|biết mỗi nodejs thôi|chắc người phỏng vấn không biết|shoppe hn hay hcm|mình cũng tạch|review tiếp đi thím/i.test(lower)
  ) {
    return 'DISCUSSION_REPLY';
  }

  // General Interview Guide
  if (
    /đây là 1 câu khá hay|để trả lời câu này, các bạn cần phải nắm|chấm sql skill|lời khuyên:|chấm điểm thái độ|mẹo phỏng vấn|kinh nghiệm phỏng vấn chung/i.test(lower) &&
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
    (lower.includes('phỏng vấn') && (lower.includes('vòng 1') || lower.includes('vòng 2') || lower.includes('round 1') || lower.includes('round 2')))
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
    lower.includes('glider.ai') ||
    lower.includes('hackerank') ||
    lower.includes('leetcode hard')
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
    lower.includes('overview về tech stack') ||
    lower.includes('vài câu react') ||
    lower.includes('một số câu java')
  ) {
    return { sectionContext: 'INTERVIEW_TOPIC', decision: 'SKIP_TOPIC_ONLY' };
  }

  // Recoverable Interview Question or Specific Prompt
  if (
    lineText.includes('?') ||
    /giải thích|là gì|thế nào|tại sao|như thế nào|cho mảng|phân biệt|mô tả/i.test(lower)
  ) {
    return { sectionContext: lineText.includes('?') ? 'INTERVIEW_QUESTION' : 'INTERVIEW_PROMPT', decision: 'KEEP' };
  }

  return { sectionContext: 'INTERVIEW_TOPIC', decision: 'SKIP_TOPIC_ONLY' };
}

function extractCompanyAndExactRole(postText) {
  let company = null;
  let role = null;
  let location = null;

  // Exact company extraction from post text
  const compMatch = postText.match(/Tên Công Ty\s*:\s*([^\n\r]+)/i);
  if (compMatch) {
    company = compMatch[1].trim();
  } else {
    const knownCompanies = ['Shopee', 'VNG', 'VNPay', 'Grab', 'Tiki', 'MoMo', 'VinBrain', 'FPT Software', 'Viettel', 'Zalo', 'NashTech', 'OneMount', 'Viet** Cyber Security'];
    for (const comp of knownCompanies) {
      if (new RegExp(`\\b${comp.replace(/\*/g, '\\*')}\\b`, 'i').test(postText)) {
        company = comp;
        break;
      }
    }
  }

  // Role extraction
  const roleMatch = postText.match(/Vị trí(?:\s*tuyển dụng)?\s*:\s*([^\n\r]+)/i);
  if (roleMatch) {
    role = roleMatch[1].trim();
  }

  // Location extraction
  const lower = postText.toLowerCase();
  if (lower.includes('hcm') || lower.includes('hồ chí minh')) location = 'Ho Chi Minh City, Vietnam';
  else if (lower.includes('hn') || lower.includes('hà nội')) location = 'Hanoi, Vietnam';
  else if (lower.includes('đà nẵng') || lower.includes('da nang')) location = 'Da Nang, Vietnam';
  else if (company) location = 'Vietnam';

  return { company, role, location };
}

async function runDryRunPages11To20() {
  console.log('===========================================================');
  console.log('HISTORICAL VOZ DRY-RUN AUDIT — PAGES 11 TO 20 (NO DB WRITES)');
  console.log('===========================================================');

  // Query accepted baseline records from pages 1-10 for deduplication
  const acceptedBaseline = [];
  try {
    const { data } = await supabase
      .from('ingested_questions')
      .select('id, normalized_question, company, source_evidence_text');
    if (data) acceptedBaseline.push(...data);
  } catch {
    // Ignore fetch error
  }

  console.log(`Loaded ${acceptedBaseline.length} accepted baseline records from pages 1-10 for deduplication.\n`);

  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  let pagesFetched = 0;
  let postsParsed = 0;
  let quotedBlocksRemoved = 0;
  let candidateReportsCount = 0;
  let generalGuidesRejected = 0;
  let communityRequestsRejected = 0;
  let careerAdviceRejected = 0;
  let discussionRepliesRejected = 0;
  let otherPostsRejected = 0;

  let explicitQuestionsDetected = 0;
  let specificPromptsDetected = 0;
  let topicsSkipped = 0;
  let adviceSkipped = 0;
  let assessmentTasksSkipped = 0;
  let evaluationAreasSkipped = 0;
  let unsupportedSkipped = 0;

  let duplicatesInternal = 0;
  let duplicatesAcceptedBaseline = 0;

  const keepRecords = [];
  const needsAttentionRecords = [];
  const internalExtractedList = [];

  for (let pageNum = 11; pageNum <= 20; pageNum++) {
    const pageUrl = `https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-${pageNum}`;
    console.log(`[Batch 11-20] Crawling Page ${pageNum}/20: ${pageUrl}...`);

    try {
      const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response || response.status() !== 200) continue;

      pagesFetched++;
      const finalUrl = page.url();

      const pagePosts = await page.evaluate(({ pageNum, pageUrl }) => {
        let quotesInPage = 0;
        const messageInners = Array.from(document.querySelectorAll('.message-inner'));

        const posts = messageInners.map((wrap, idx) => {
          const author = wrap.querySelector('.message-name')?.innerText.trim() || 'Anonymous';
          const postLink = wrap.querySelector('a[href*="/post-"]');
          const postUrl = postLink ? postLink.href : pageUrl;
          const postIdMatch = postUrl.match(/post-(\d+)/);
          const postId = postIdMatch ? `post-${postIdMatch[1]}` : `page${pageNum}-p${idx + 1}`;

          const bodyEl = wrap.querySelector('.bbWrapper');
          if (!bodyEl) return null;

          const clone = bodyEl.cloneNode(true);
          const quoteNodes = clone.querySelectorAll('blockquote, .bbCodeBlock--quote, .quote, .bbCodeBlock-expandContent, .message-signature');
          quoteNodes.forEach((q) => {
            quotesInPage++;
            q.remove();
          });

          return {
            postId,
            postUrl,
            author,
            authoredText: clone.innerText.trim(),
          };
        }).filter(Boolean);

        return { posts, quotesInPage };
      }, { pageNum, pageUrl });

      quotedBlocksRemoved += pagePosts.quotesInPage;
      postsParsed += pagePosts.posts.length;

      for (const post of pagePosts.posts) {
        if (!post.authoredText || post.authoredText.length < 30) continue;

        const intent = classifyPostIntent(post.authoredText);

        if (intent === 'GENERAL_INTERVIEW_GUIDE') { generalGuidesRejected++; continue; }
        if (intent === 'COMMUNITY_REQUEST') { communityRequestsRejected++; continue; }
        if (intent === 'CAREER_ADVICE_REQUEST') { careerAdviceRejected++; continue; }
        if (intent === 'DISCUSSION_REPLY') { discussionRepliesRejected++; continue; }
        if (intent !== 'CANDIDATE_INTERVIEW_REPORT') { otherPostsRejected++; continue; }

        candidateReportsCount++;
        const { company, role, location } = extractCompanyAndExactRole(post.authoredText);
        const lines = post.authoredText.split('\n').map((l) => l.trim()).filter(Boolean);

        for (const line of lines) {
          if (line.length < 12) continue;

          const { sectionContext, decision } = classifySectionContextAndDecision(line);

          if (decision === 'SKIP_TOPIC_ONLY') { topicsSkipped++; continue; }
          if (decision === 'SKIP_ADVICE') { adviceSkipped++; continue; }
          if (decision === 'SKIP_ASSESSMENT_TASK') { assessmentTasksSkipped++; continue; }
          if (decision === 'SKIP_EVALUATION_AREA') { evaluationAreasSkipped++; continue; }
          if (decision === 'SKIP_UNSUPPORTED') { unsupportedSkipped++; continue; }

          if (decision !== 'KEEP') continue;

          // Normalize ONLY recoverable questions without appending '?' to topics
          let norm = line.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?)\s*/i, '').trim();
          norm = norm.charAt(0).toUpperCase() + norm.slice(1);

          const qClass = line.includes('?') ? 'EXPLICIT_QUESTION' : 'SPECIFIC_PROMPT';
          if (qClass === 'EXPLICIT_QUESTION') explicitQuestionsDetected++;
          else specificPromptsDetected++;

          // Check deduplication against baseline 1-10 and internal 11-20
          const isBaselineDup = acceptedBaseline.some(
            (b) => b.normalized_question?.toLowerCase() === norm.toLowerCase()
          );
          if (isBaselineDup) {
            duplicatesAcceptedBaseline++;
            continue;
          }

          const isInternalDup = internalExtractedList.some(
            (item) => item.normalizedQuestion.toLowerCase() === norm.toLowerCase()
          );
          if (isInternalDup) {
            duplicatesInternal++;
            continue;
          }

          internalExtractedList.push({ normalizedQuestion: norm });

          const record = {
            postId: post.postId,
            canonicalUrl: post.postUrl,
            company: company || 'NULL (Unstated)',
            role: role || 'NULL (Unstated)',
            location: location || 'NULL (Unproven)',
            postIntent: intent,
            sectionContext,
            questionClassification: qClass,
            evidence: line,
            normalizedQuestion: norm,
            duplicateStatus: 'UNIQUE',
          };

          // Triage suspicious items to NEEDS_MANUAL_ATTENTION
          const isSuspicious =
            !company ||
            !role ||
            company.includes('*') ||
            norm.length < 15 ||
            !location;

          if (isSuspicious) {
            needsAttentionRecords.push(record);
          } else {
            keepRecords.push(record);
          }
        }
      }

      await page.waitForTimeout(1000);
    } catch (err) {
      console.error(`Page ${pageNum} error:`, err);
    }
  }

  await browser.close();

  // Print Complete Report
  console.log('===========================================================');
  console.log('PAGES 11-20 DRY-RUN SUMMARY STATISTICS');
  console.log('===========================================================');
  console.log(`Pages fetched                           : ${pagesFetched}`);
  console.log(`Posts parsed                            : ${postsParsed}`);
  console.log(`Quoted blocks removed                   : ${quotedBlocksRemoved}`);
  console.log('-----------------------------------------------------------');
  console.log(`Candidate interview reports             : ${candidateReportsCount}`);
  console.log(`General guides rejected                 : ${generalGuidesRejected}`);
  console.log(`Community requests rejected             : ${communityRequestsRejected}`);
  console.log(`Career advice rejected                  : ${careerAdviceRejected}`);
  console.log(`Discussion replies rejected             : ${discussionRepliesRejected}`);
  console.log(`Other posts rejected                    : ${otherPostsRejected}`);
  console.log('-----------------------------------------------------------');
  console.log(`Explicit questions detected             : ${explicitQuestionsDetected}`);
  console.log(`Specific prompts detected               : ${specificPromptsDetected}`);
  console.log(`Topics skipped                          : ${topicsSkipped}`);
  console.log(`Advice skipped                          : ${adviceSkipped}`);
  console.log(`Assessment tasks skipped                : ${assessmentTasksSkipped}`);
  console.log(`Evaluation areas skipped                : ${evaluationAreasSkipped}`);
  console.log(`Unsupported skipped                     : ${unsupportedSkipped}`);
  console.log('-----------------------------------------------------------');
  console.log(`Duplicates against pages 11–20          : ${duplicatesInternal}`);
  console.log(`Duplicates against accepted pages 1–10  : ${duplicatesAcceptedBaseline}`);
  console.log('-----------------------------------------------------------');
  console.log(`FINAL questions retained (KEEP)         : ${keepRecords.length}`);
  console.log(`NEEDS_MANUAL_ATTENTION items            : ${needsAttentionRecords.length}`);
  console.log('===========================================================\n');

  console.log(`===========================================================`);
  console.log(`ALL RETAINED KEEP QUESTIONS (${keepRecords.length} TOTAL):`);
  console.log(`===========================================================`);
  keepRecords.forEach((r, idx) => {
    console.log(`KEEP ITEM #${idx + 1}`);
    console.log(`postId                 : ${r.postId}`);
    console.log(`canonicalUrl           : ${r.canonicalUrl}`);
    console.log(`company                : ${r.company}`);
    console.log(`role                   : ${r.role}`);
    console.log(`location               : ${r.location}`);
    console.log(`postIntent             : ${r.postIntent}`);
    console.log(`sectionContext         : ${r.sectionContext}`);
    console.log(`questionClassification : ${r.questionClassification}`);
    console.log(`evidence               : "${r.evidence}"`);
    console.log(`normalizedQuestion     : "${r.normalizedQuestion}"`);
    console.log(`duplicateStatus        : ${r.duplicateStatus}`);
    console.log('-----------------------------------------------------------\n');
  });

  console.log(`===========================================================`);
  console.log(`NEEDS_MANUAL_ATTENTION ITEMS (${needsAttentionRecords.length} TOTAL):`);
  console.log(`===========================================================`);
  needsAttentionRecords.forEach((r, idx) => {
    console.log(`ATTENTION ITEM #${idx + 1}`);
    console.log(`postId                 : ${r.postId}`);
    console.log(`canonicalUrl           : ${r.canonicalUrl}`);
    console.log(`company                : ${r.company}`);
    console.log(`role                   : ${r.role}`);
    console.log(`location               : ${r.location}`);
    console.log(`postIntent             : ${r.postIntent}`);
    console.log(`sectionContext         : ${r.sectionContext}`);
    console.log(`questionClassification : ${r.questionClassification}`);
    console.log(`evidence               : "${r.evidence}"`);
    console.log(`normalizedQuestion     : "${r.normalizedQuestion}"`);
    console.log(`duplicateStatus        : ${r.duplicateStatus}`);
    console.log('-----------------------------------------------------------\n');
  });

  console.log('===========================================================');
  console.log('FINAL STATE: PAGES_11_20_READY_FOR_MANUAL_REVIEW');
  console.log('===========================================================');
}

runDryRunPages11To20().catch((err) => {
  console.error('Fatal dry-run error:', err);
});
