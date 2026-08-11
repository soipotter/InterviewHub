const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

function parsePostIntoCompanySections(sourcePostId, postText) {
  const lines = postText.split('\n');
  const sectionHeadings = [];

  const knownCompanies = [
    'OneMount', 'VinID', 'AxonActive', 'Trusting Social', 'Tiki', 'Orange Logic',
    'Sun Asterisk', 'Sun*', 'Nexon Dev Vina', 'Nexon', 'FPT Software', 'FPT', 'DXC',
    'Shopee', 'VNG', 'VNPay', 'Grab', 'MoMo', 'VinBrain', 'Viettel', 'Zalo',
    'NashTech', 'Viet** Cyber Security', 'Splus Software Vietnam', 'Netcompany', 'HCL'
  ];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const numberedMatch = trimmed.match(/^(?:\d+[\s.)|-]+|\*[\s|-]+)([A-Z0-9][A-Za-z0-9\s*()_-]{2,40})/);
    if (numberedMatch) {
      const candidateStr = numberedMatch[1].trim();
      for (const comp of knownCompanies) {
        if (new RegExp(`\\b${comp.replace(/\*/g, '\\*')}\\b`, 'i').test(candidateStr)) {
          let role = null;
          const roleMatch = trimmed.match(/(?:vị trí|role|position|level)?\s*[:(-]\s*([A-Za-z0-9\s()_-]+)/i);
          if (roleMatch && !roleMatch[1].toLowerCase().includes(comp.toLowerCase())) {
            role = roleMatch[1].trim();
          }
          sectionHeadings.push({ lineIdx: idx, companyRaw: candidateStr, company: comp, role });
          return;
        }
      }
    }

    const explicitMatch = trimmed.match(/(?:Tên\s+)?C(?:ông|ty)\s*T(?:y|i)?\s*:\s*([^\n\r]+)/i);
    if (explicitMatch) {
      const companyRaw = explicitMatch[1].trim();
      let company = companyRaw;
      for (const comp of knownCompanies) {
        if (new RegExp(`\\b${comp.replace(/\*/g, '\\*')}\\b`, 'i').test(companyRaw)) {
          company = comp;
          break;
        }
      }
      sectionHeadings.push({ lineIdx: idx, companyRaw, company, role: null });
      return;
    }
  });

  if (sectionHeadings.length === 0) {
    let company = null;
    let role = null;
    let location = null;

    const compMatch = postText.match(/(?:Tên\s+)?C(?:ông|ty)\s*T(?:y|i)?\s*:\s*([^\n\r]+)/i);
    if (compMatch) {
      company = compMatch[1].trim();
    } else {
      for (const comp of knownCompanies) {
        if (new RegExp(`\\b${comp.replace(/\*/g, '\\*')}\\b`, 'i').test(postText)) {
          company = comp;
          break;
        }
      }
    }

    const roleMatch = postText.match(/Vị trí(?:\s*tuyển dụng)?\s*:\s*([^\n\r]+)/i);
    if (roleMatch) role = roleMatch[1].trim();

    const lower = postText.toLowerCase();
    if (lower.includes('hcm office') || lower.includes('văn phòng hcm')) location = 'Ho Chi Minh City, Vietnam';
    else if (lower.includes('hà nội office') || lower.includes('văn phòng hà nội')) location = 'Hanoi, Vietnam';

    return [
      {
        sourcePostId,
        sourceSectionId: `${sourcePostId}-sec1`,
        sectionIndex: 1,
        companyRaw: company,
        company,
        roleRaw: role,
        role,
        location,
        sectionText: postText,
        sectionStart: postText.slice(0, 60),
        sectionEnd: postText.slice(-60),
      },
    ];
  }

  const sections = [];
  for (let i = 0; i < sectionHeadings.length; i++) {
    const heading = sectionHeadings[i];
    const startLine = heading.lineIdx;
    const endLine = i + 1 < sectionHeadings.length ? sectionHeadings[i + 1].lineIdx : lines.length;

    const sectionLines = lines.slice(startLine, endLine);
    const sectionText = sectionLines.join('\n').trim();

    let role = heading.role;
    if (!role) {
      const roleMatch = sectionText.match(/Vị trí(?:\s*tuyển dụng)?\s*:\s*([^\n\r]+)/i);
      if (roleMatch) role = roleMatch[1].trim();
    }

    let location = null;
    const lowerSection = sectionText.toLowerCase();
    if (lowerSection.includes('hcm office') || lowerSection.includes('văn phòng hcm')) location = 'Ho Chi Minh City, Vietnam';
    else if (lowerSection.includes('hà nội office') || lowerSection.includes('văn phòng hà nội')) location = 'Hanoi, Vietnam';

    sections.push({
      sourcePostId,
      sourceSectionId: `${sourcePostId}-sec${i + 1}`,
      sectionIndex: i + 1,
      companyRaw: heading.companyRaw,
      company: heading.company,
      roleRaw: role,
      role,
      location,
      sectionText,
      sectionStart: sectionText.slice(0, 60).replace(/\n/g, ' '),
      sectionEnd: sectionText.slice(-60).replace(/\n/g, ' '),
    });
  }

  return sections;
}

function classifyPostIntent(text) {
  const lower = text.toLowerCase().trim();
  if (
    /bác nào (?:pv|phỏng vấn)|phỏng vấn mây vòng|chưa ạ|\?\?/i.test(lower) &&
    (lower.includes('niteco') || lower.includes('titki') || lower.includes('tiki') || lower.includes('từng phỏng vấn rồi') || lower.includes('ai phỏng vấn chưa'))
  ) {
    return 'COMMUNITY_REQUEST';
  }
  if (/chuẩn bị kiến thức|chuẩn bị những gì|xin hỏi khi pv|level junior php|xin lời khuyên|deal lương ra sao/i.test(lower)) {
    return 'CAREER_ADVICE_REQUEST';
  }
  if (/nestjs là gì vậy bạn|biết mỗi nodejs thôi|chắc người phỏng vấn không biết|shoppe hn hay hcm|mình cũng tạch|review tiếp đi thím/i.test(lower)) {
    return 'DISCUSSION_REPLY';
  }
  if (
    /đây là 1 câu khá hay|để trả lời câu này, các bạn cần phải nắm|chấm sql skill|lời khuyên:|chấm điểm thái độ|mẹo phỏng vấn|kinh nghiệm phỏng vấn chung/i.test(lower) &&
    !lower.includes('tên công ty') &&
    !lower.includes('quá trình phỏng vấn')
  ) {
    return 'GENERAL_INTERVIEW_GUIDE';
  }
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
  if (
    lower.startsWith('+ gợi ý') ||
    lower.startsWith('gợi ý') ||
    lower.startsWith('lời khuyên') ||
    lower.includes('ôn các thuật toán') ||
    lower.includes('nếu mặt dày') ||
    lower.includes('xin hint')
  ) {
    return { sectionContext: 'ADVICE', decision: 'SKIP_ADVICE' };
  }
  if (
    lower.includes('đánh giá contribution') ||
    lower.includes('đánh giá khả năng') ||
    lower.startsWith('điểm chưa tốt') ||
    lower.startsWith('điểm tốt')
  ) {
    return { sectionContext: 'EVALUATION_AREA', decision: 'SKIP_EVALUATION_AREA' };
  }
  if (
    lower.includes('làm bài test html css') ||
    lower.includes('bài test online') ||
    lower.includes('glider.ai') ||
    lower.includes('hackerank') ||
    lower === '2 câu thuật toán' ||
    lower === 'có một bài system design'
  ) {
    return { sectionContext: 'ASSESSMENT_TASK', decision: 'SKIP_ASSESSMENT_TASK' };
  }
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
  if (
    lower.includes('kiến thức cơ bản:') ||
    lower.includes('java core, heap and stack') ||
    lower.includes('hỏi một số câu') ||
    lower.includes('7 câu javascript') ||
    lower.includes('về toán: 1 câu toán đại cương') ||
    lower.includes('overview về tech stack') ||
    lower.includes('java, spring, sql, redis')
  ) {
    return { sectionContext: 'INTERVIEW_TOPIC', decision: 'SKIP_TOPIC_ONLY' };
  }
  if (
    lower.includes('hệ thống tính phí khi đi qua một cây cầu') ||
    (lower.includes('thiết kế system') && lower.includes('call api'))
  ) {
    return { sectionContext: 'LIVE_INTERVIEW_CASE_PROMPT', decision: 'KEEP' };
  }
  if (
    lineText.includes('?') ||
    /giải thích|là gì|thế nào|tại sao|như thế nào|cho mảng|phân biệt|mô tả|tối ưu/i.test(lower)
  ) {
    return { sectionContext: lineText.includes('?') ? 'INTERVIEW_QUESTION' : 'INTERVIEW_PROMPT', decision: 'KEEP' };
  }
  return { sectionContext: 'INTERVIEW_TOPIC', decision: 'SKIP_TOPIC_ONLY' };
}

function classifyQuestionDirection(lineText) {
  const lower = lineText.toLowerCase().trim();
  if (
    /tỉ lệ pass|có nên chốt|từ chối offer|mấy bác thấy sao|cho em xin hỏi/i.test(lower) ||
    lower.includes('bác nào')
  ) {
    return 'AUTHOR_TO_COMMUNITY';
  }
  if (/nestjs là gì vậy bạn|shoppe hn hay hcm/i.test(lower)) {
    return 'COMMUNITY_TO_AUTHOR';
  }
  if (/em hỏi (?:anh|chị|interviewer)|mình có hỏi lại/i.test(lower)) {
    return 'CANDIDATE_TO_INTERVIEWER';
  }
  if (/mình thấy|mình nghĩ|lương lậu/i.test(lower)) {
    return 'AUTHOR_COMMENTARY';
  }
  if (
    /hỏi về|ảnh hỏi|interviewer hỏi|cho mảng|giải thích|là gì|thế nào|tại sao|tối ưu/i.test(lower) ||
    (lineText.includes('?') && !lower.includes('mấy bác') && !lower.includes('em có nên'))
  ) {
    return 'INTERVIEWER_TO_CANDIDATE';
  }
  return 'UNKNOWN';
}

async function runSectionAwareDryRunPages31To40() {
  console.log('===========================================================');
  console.log('SECTION-AWARE HISTORICAL VOZ DRY-RUN — PAGES 31 TO 40');
  console.log('===========================================================');

  // Load baseline records
  const acceptedBaseline = [];
  try {
    const { data } = await supabase
      .from('ingested_questions')
      .select('id, normalized_question, company, source_evidence_text');
    if (data) acceptedBaseline.push(...data);
  } catch {
    // Ignore fetch error
  }

  console.log(`Loaded ${acceptedBaseline.length} accepted baseline records from pages 1-30 for deduplication.\n`);

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
  let interviewerToCandidateCount = 0;
  let authorToCommunityCount = 0;
  let communityToAuthorCount = 0;
  let candidateToInterviewerCount = 0;
  let unknownDirectionCount = 0;

  let explicitQuestionsDetected = 0;
  let specificPromptsDetected = 0;
  let liveCasePromptsDetected = 0;

  let topicsSkipped = 0;
  let adviceSkipped = 0;
  let assessmentTasksSkipped = 0;
  let evaluationAreasSkipped = 0;
  let unsupportedSkipped = 0;

  let duplicatesAcceptedBaseline = 0;
  let errorsCount = 0;

  const keepRecords = [];
  const needsAttentionRecords = [];

  for (let pageNum = 31; pageNum <= 40; pageNum++) {
    const pageUrl = `https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-${pageNum}`;
    console.log(`[Batch 31-40] Crawling Page ${pageNum}/40: ${pageUrl}...`);

    try {
      const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response || response.status() !== 200) continue;

      pagesFetched++;
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
        if (intent !== 'CANDIDATE_INTERVIEW_REPORT') continue;

        candidateReportsCount++;
        const sections = parsePostIntoCompanySections(post.postId, post.authoredText);

        // If post contains multi-company sections, log parsed hierarchy
        if (sections.length > 1) {
          console.log(`\n>>> MULTI-COMPANY POST DETECTED (${post.postId}) — ${sections.length} SECTIONS:`);
          sections.forEach((s) => {
            console.log(`  [${s.sourceSectionId}] ${s.company || 'Unstated'} | Role: ${s.role || 'Unstated'} | Location: ${s.location || 'null'}`);
            console.log(`     Start: "${s.sectionStart}"`);
            console.log(`     End  : "${s.sectionEnd}"`);
          });
          console.log('');
        }

        for (const sec of sections) {
          const lines = sec.sectionText.split('\n').map((l) => l.trim()).filter(Boolean);

          for (const line of lines) {
            if (line.length < 12) continue;

            const { sectionContext, decision } = classifySectionContextAndDecision(line);
            const direction = classifyQuestionDirection(line);

            if (direction === 'INTERVIEWER_TO_CANDIDATE') interviewerToCandidateCount++;
            else if (direction === 'AUTHOR_TO_COMMUNITY') authorToCommunityCount++;
            else if (direction === 'COMMUNITY_TO_AUTHOR') communityToAuthorCount++;
            else if (direction === 'CANDIDATE_TO_INTERVIEWER') candidateToInterviewerCount++;
            else unknownDirectionCount++;

            if (decision === 'SKIP_TOPIC_ONLY') { topicsSkipped++; continue; }
            if (decision === 'SKIP_ADVICE') { adviceSkipped++; continue; }
            if (decision === 'SKIP_ASSESSMENT_TASK') { assessmentTasksSkipped++; continue; }
            if (decision === 'SKIP_EVALUATION_AREA') { evaluationAreasSkipped++; continue; }
            if (decision === 'SKIP_UNSUPPORTED') { unsupportedSkipped++; continue; }

            if (direction !== 'INTERVIEWER_TO_CANDIDATE') continue;
            if (decision !== 'KEEP') continue;

            let norm = line.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?)\s*/i, '').trim();
            norm = norm.charAt(0).toUpperCase() + norm.slice(1);

            let qClass = 'SPECIFIC_PROMPT';
            if (sectionContext === 'LIVE_INTERVIEW_CASE_PROMPT') {
              qClass = 'SPECIFIC_PROMPT';
              liveCasePromptsDetected++;
            } else if (line.includes('?')) {
              qClass = 'EXPLICIT_QUESTION';
              explicitQuestionsDetected++;
            } else {
              specificPromptsDetected++;
            }

            const isBaselineDup = acceptedBaseline.some(
              (b) => b.normalized_question?.toLowerCase() === norm.toLowerCase()
            );
            if (isBaselineDup) {
              duplicatesAcceptedBaseline++;
              continue;
            }

            const record = {
              postId: post.postId,
              sourceSectionId: sec.sourceSectionId,
              canonicalUrl: post.postUrl,
              company: sec.company || 'NULL (Unstated)',
              role: sec.role || 'NULL (Unstated)',
              location: sec.location || 'NULL (Unproven)',
              postIntent: intent,
              sectionContext,
              questionClassification: qClass,
              questionDirection: direction,
              evidence: line,
              normalizedQuestion: norm,
              duplicateStatus: 'UNIQUE',
            };

            let triageReason = null;
            if (!sec.company) triageReason = 'Company attribution is unstated (company = null)';
            else if (!sec.role) triageReason = 'Role attribution is unstated (role = null)';
            else if (sec.company.includes('*')) triageReason = 'Company is partially anonymized';
            else if (norm.length < 15) triageReason = 'Question phrasing is short or ambiguous';

            if (triageReason) {
              needsAttentionRecords.push({ ...record, triageReason });
            } else {
              keepRecords.push(record);
            }
          }
        }
      }

      await page.waitForTimeout(1000);
    } catch (err) {
      errorsCount++;
      console.error(`Page ${pageNum} error:`, err);
    }
  }

  await browser.close();

  // Print Summary Report
  console.log('===========================================================');
  console.log('PAGES 31-40 SECTION-AWARE DRY-RUN STATISTICS');
  console.log('===========================================================');
  console.log(`Pages fetched                           : ${pagesFetched}`);
  console.log(`Posts parsed                            : ${postsParsed}`);
  console.log(`Quoted blocks removed                   : ${quotedBlocksRemoved}`);
  console.log('-----------------------------------------------------------');
  console.log(`Candidate interview reports             : ${candidateReportsCount}`);
  console.log('-----------------------------------------------------------');
  console.log(`INTERVIEWER_TO_CANDIDATE                : ${interviewerToCandidateCount}`);
  console.log(`AUTHOR_TO_COMMUNITY                     : ${authorToCommunityCount}`);
  console.log(`COMMUNITY_TO_AUTHOR                     : ${communityToAuthorCount}`);
  console.log(`CANDIDATE_TO_INTERVIEWER                : ${candidateToInterviewerCount}`);
  console.log(`UNKNOWN                                 : ${unknownDirectionCount}`);
  console.log('-----------------------------------------------------------');
  console.log(`Explicit questions                      : ${explicitQuestionsDetected}`);
  console.log(`Specific prompts                        : ${specificPromptsDetected}`);
  console.log(`Live case prompts                       : ${liveCasePromptsDetected}`);
  console.log('-----------------------------------------------------------');
  console.log(`Topics skipped                          : ${topicsSkipped}`);
  console.log(`Advice skipped                          : ${adviceSkipped}`);
  console.log(`Assessment descriptions skipped         : ${assessmentTasksSkipped}`);
  console.log(`Evaluation areas skipped                : ${evaluationAreasSkipped}`);
  console.log(`Unsupported skipped                     : ${unsupportedSkipped}`);
  console.log('-----------------------------------------------------------');
  console.log(`Duplicates against accepted DB          : ${duplicatesAcceptedBaseline}`);
  console.log('-----------------------------------------------------------');
  console.log(`FINAL KEEP                              : ${keepRecords.length}`);
  console.log(`NEEDS_MANUAL_ATTENTION                  : ${needsAttentionRecords.length}`);
  console.log(`Errors                                  : ${errorsCount}`);
  console.log('===========================================================\n');

  console.log(`===========================================================`);
  console.log(`ALL RETAINED KEEP QUESTIONS (${keepRecords.length} TOTAL):`);
  console.log(`===========================================================`);
  keepRecords.forEach((r, idx) => {
    console.log(`KEEP ITEM #${idx + 1}`);
    console.log(`postId                 : ${r.postId}`);
    console.log(`sourceSectionId        : ${r.sourceSectionId}`);
    console.log(`canonicalUrl           : ${r.canonicalUrl}`);
    console.log(`company                : ${r.company}`);
    console.log(`role                   : ${r.role}`);
    console.log(`location               : ${r.location}`);
    console.log(`postIntent             : ${r.postIntent}`);
    console.log(`sectionContext         : ${r.sectionContext}`);
    console.log(`questionClassification : ${r.questionClassification}`);
    console.log(`questionDirection      : ${r.questionDirection}`);
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
    console.log(`sourceSectionId        : ${r.sourceSectionId}`);
    console.log(`canonicalUrl           : ${r.canonicalUrl}`);
    console.log(`company                : ${r.company}`);
    console.log(`role                   : ${r.role}`);
    console.log(`location               : ${r.location}`);
    console.log(`postIntent             : ${r.postIntent}`);
    console.log(`sectionContext         : ${r.sectionContext}`);
    console.log(`questionClassification : ${r.questionClassification}`);
    console.log(`questionDirection      : ${r.questionDirection}`);
    console.log(`evidence               : "${r.evidence}"`);
    console.log(`normalizedQuestion     : "${r.normalizedQuestion}"`);
    console.log(`duplicateStatus        : ${r.duplicateStatus}`);
    console.log(`triageReason           : ${r.triageReason}`);
    console.log('-----------------------------------------------------------\n');
  });

  console.log('===========================================================');
  console.log('FINAL STATE: PAGES_31_40_SECTION_BOUNDARY_READY_FOR_MANUAL_REVIEW');
  console.log('===========================================================');
}

runSectionAwareDryRunPages31To40().catch((err) => {
  console.error('Fatal dry-run error:', err);
});
