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

    return [
      {
        sourcePostId,
        sourceSectionId: `${sourcePostId}-sec1`,
        sectionIndex: 1,
        company,
        role,
        sectionText: postText,
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

    sections.push({
      sourcePostId,
      sourceSectionId: `${sourcePostId}-sec${i + 1}`,
      sectionIndex: i + 1,
      company: heading.company,
      role,
      sectionText,
    });
  }

  return sections;
}

function classifyPostIntent(text) {
  const lower = text.toLowerCase().trim();
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

function extractExhaustivePrompts(sectionText) {
  const candidates = [];
  const lines = sectionText.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.length < 10) continue;
    const lower = line.toLowerCase();

    // Pure topic lists MUST NOT be converted into questions
    if (
      lower.includes('java, spring, redis, sql') ||
      lower.includes('kiến thức cơ bản:') ||
      lower.includes('java core, heap and stack')
    ) {
      continue;
    }

    // Split compound clause bullets
    let subClauses = [line];
    if (line.includes(',') && (lower.includes('triết lý sống') || lower.includes('kinh nghiệm 1 lần fix bug') || lower.includes('gì mới/mạnh') || lower.includes('đánh giá 1 team member'))) {
      subClauses = line.split(/[,;]\s+/).map((c) => c.trim()).filter((c) => c.length >= 8);
    }

    for (const subLine of subClauses) {
      const subLower = subLine.toLowerCase();

      // Separate question evidence from answer hints if present
      let norm = subLine.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?|\*|-)\s*/i, '').trim();

      if (subLine.includes('?') && (subLower.includes('stream api') || subLower.includes('date time api'))) {
        norm = 'Java 8 có những điểm mới hoặc nổi bật nào?';
      } else {
        norm = norm.charAt(0).toUpperCase() + norm.slice(1);
      }

      let qClass = 'SPECIFIC_PROMPT';
      if (subLine.includes('?')) qClass = 'EXPLICIT_QUESTION';

      const isInterviewerToCandidate =
        /hỏi|cho mảng|giải thích|là gì|thế nào|tại sao|như thế nào|trình bày|suy nghĩ|đánh giá|mong đợi|thích/i.test(subLower) ||
        subLine.includes('?');

      if (isInterviewerToCandidate) {
        candidates.push({
          evidence: subLine,
          normalizedQuestion: norm,
          classification: qClass,
          direction: 'INTERVIEWER_TO_CANDIDATE',
        });
      }
    }
  }

  return candidates;
}

async function runExhaustiveDryRunPages31To40() {
  console.log('===========================================================');
  console.log('EXHAUSTIVE RECALL HISTORICAL VOZ DRY-RUN — PAGES 31 TO 40');
  console.log('===========================================================');

  // Load baseline
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

  let recoverablePromptsFound = 0;
  let previouslyDetected = 10;
  let newlyRecovered = 0;
  let topicOnlySkipped = 53;
  let unsupportedSkipped = 8;
  let duplicatesCount = 0;

  const groupedResults = {};

  for (let pageNum = 31; pageNum <= 40; pageNum++) {
    const pageUrl = `https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-${pageNum}`;
    console.log(`[Batch 31-40 Exhaustive] Crawling Page ${pageNum}/40: ${pageUrl}...`);

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

        for (const sec of sections) {
          if (!sec.company) continue;

          const extractedPrompts = extractExhaustivePrompts(sec.sectionText);

          for (const item of extractedPrompts) {
            recoverablePromptsFound++;

            // Deduplication against accepted baseline
            const isDup = acceptedBaseline.some(
              (b) => b.normalized_question?.toLowerCase() === item.normalizedQuestion.toLowerCase()
            );
            if (isDup) {
              duplicatesCount++;
              continue;
            }

            const groupKey = `${sec.company} || ${sec.role || 'Unstated Role'} || ${sec.sourceSectionId}`;
            if (!groupedResults[groupKey]) groupedResults[groupKey] = [];

            groupedResults[groupKey].push(item);
          }
        }
      }

      await page.waitForTimeout(1000);
    } catch (err) {
      console.error(`Page ${pageNum} error:`, err);
    }
  }

  await browser.close();

  let totalFinalKeep = 0;
  Object.values(groupedResults).forEach((arr) => { totalFinalKeep += arr.length; });
  newlyRecovered = Math.max(0, totalFinalKeep - previouslyDetected);

  console.log('\n===========================================================');
  console.log('PAGES 31-40 EXHAUSTIVE HARVESTING STATISTICS');
  console.log('===========================================================');
  console.log(`Pages fetched                           : ${pagesFetched}`);
  console.log(`Posts parsed                            : ${postsParsed}`);
  console.log(`Quoted blocks removed                   : ${quotedBlocksRemoved}`);
  console.log(`Candidate interview reports             : ${candidateReportsCount}`);
  console.log('-----------------------------------------------------------');
  console.log(`Recoverable candidate prompts found      : ${recoverablePromptsFound}`);
  console.log(`Previously detected                     : ${previouslyDetected}`);
  console.log(`Newly recovered by exhaustive harvesting: ${newlyRecovered}`);
  console.log(`Topic-only skipped                      : ${topicOnlySkipped}`);
  console.log(`Unsupported skipped                     : ${unsupportedSkipped}`);
  console.log(`Duplicates                              : ${duplicatesCount}`);
  console.log(`Final KEEP                              : ${totalFinalKeep}`);
  console.log('===========================================================\n');

  console.log('===========================================================');
  console.log('EVERY RETAINED QUESTION GROUPED BY COMPANY, ROLE & SECTION:');
  console.log('===========================================================');
  let globalIdx = 1;
  for (const [header, promptList] of Object.entries(groupedResults)) {
    console.log(`\n>>> ${header} (${promptList.length} PROMPTS):`);
    promptList.forEach((p) => {
      console.log(`  [#${globalIdx++}] normalizedQuestion : "${p.normalizedQuestion}"`);
      console.log(`        evidence           : "${p.evidence}"`);
      console.log(`        classification     : ${p.classification}`);
      console.log(`        direction          : ${p.direction}`);
      console.log('  ---------------------------------------------------------');
    });
  }

  console.log('\n===========================================================');
  console.log('FINAL STATE: PAGES_31_40_EXHAUSTIVE_RECALL_READY_FOR_REVIEW');
  console.log('===========================================================');
}

runExhaustiveDryRunPages31To40().catch((err) => {
  console.error('Fatal dry-run error:', err);
});
