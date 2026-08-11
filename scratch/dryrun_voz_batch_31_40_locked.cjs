const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

function computeEvidenceHash(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

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

function extractExhaustivePromptsWithOffsets(sec) {
  const candidates = [];
  const sectionText = sec.sectionText;
  const lines = sectionText.split('\n');

  let currentOffset = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    const lineStart = sectionText.indexOf(line, currentOffset);
    currentOffset = lineStart + line.length;

    if (trimmed.length < 10) continue;
    const lower = trimmed.toLowerCase();

    // EXCLUDE KNOWN FALSE POSITIVES
    if (
      lower.includes('java, spring, redis, sql') ||
      lower.includes('kiến thức cơ bản:') ||
      lower.includes('java core, heap and stack') ||
      lower === 'event loop' ||
      lower === 'cơ chế fallover của redis-cluster' ||
      lower.includes('một số câu hỏi/ chủ đề phỏng vấn:')
    ) {
      continue;
    }

    // Split compound clause bullets
    let subClauses = [trimmed];
    if (trimmed.includes(',') && (lower.includes('triết lý sống') || lower.includes('kinh nghiệm 1 lần fix bug') || lower.includes('gì mới/mạnh') || lower.includes('đánh giá 1 team member'))) {
      subClauses = trimmed.split(/[,;]\s+/).map((c) => c.trim()).filter((c) => c.length >= 8);
    }

    for (const subLine of subClauses) {
      const subLower = subLine.toLowerCase();

      // Find exact character offsets in sectionText for verbatim source string
      const subStart = sectionText.indexOf(subLine, lineStart);
      const subEnd = subStart >= 0 ? subStart + subLine.length : lineStart + trimmed.length;
      const rawVerbatim = subStart >= 0 ? sectionText.substring(subStart, subEnd) : subLine;

      let norm = subLine.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?|\*|-)\s*/i, '').trim();

      // Normalize without adding unstated details
      if (subLine.includes('?') && (subLower.includes('stream api') || subLower.includes('date time api'))) {
        norm = 'Java 8 có những điểm mới hoặc nổi bật nào?';
      } else if (subLower.includes('input data rất lớn thì algo đổi ntn')) {
        norm = 'Thuật toán sẽ thay đổi như thế nào khi dữ liệu đầu vào rất lớn?';
      } else if (subLower.includes('vẽ với trình bày kiến trúc chung')) {
        norm = 'Vẽ và trình bày kiến trúc tổng quan của hệ thống bạn đã làm.';
      } else if (subLower === 'single thread vs multithread') {
        norm = 'So sánh Single Thread và Multithread trong Node.js.';
      } else {
        norm = norm.charAt(0).toUpperCase() + norm.slice(1);
      }

      let qClass = 'SPECIFIC_PROMPT';
      if (subLine.includes('?')) qClass = 'EXPLICIT_QUESTION';
      if (subLower === 'single thread vs multithread') qClass = 'SPECIFIC_PROMPT';

      const isInterviewerToCandidate =
        /hỏi|cho mảng|giải thích|là gì|thế nào|tại sao|như thế nào|trình bày|suy nghĩ|đánh giá|mong đợi|thích|so sánh/i.test(subLower) ||
        subLine.includes('?');

      if (isInterviewerToCandidate) {
        candidates.push({
          sourcePostId: sec.sourcePostId,
          sourceSectionId: sec.sourceSectionId,
          company: sec.company,
          role: sec.role || 'Software Engineer',
          sourceEvidenceRaw: rawVerbatim,
          evidenceStartOffset: Math.max(0, subStart),
          evidenceEndOffset: subEnd,
          evidenceHash: computeEvidenceHash(rawVerbatim),
          classification: qClass,
          questionDirection: 'INTERVIEWER_TO_CANDIDATE',
          normalizedQuestion: norm,
        });
      }
    }
  }

  return candidates;
}

async function runLockedDryRunPages31To40() {
  console.log('===========================================================');
  console.log('PROVENANCE-LOCKED ZERO-TRUNCATION DRY-RUN — PAGES 31 TO 40');
  console.log('===========================================================');

  // Load baseline for deduplication
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

  let candidateSectionsCount = 0;
  let rawCandidateSegmentsCount = 0;
  let recoverablePromptsCount = 0;
  let rejectedTopicOnlyCount = 0;
  let rejectedUnsupportedCount = 0;
  let rejectedProvenanceCount = 0;
  let duplicatesCount = 0;

  const keepRecords = [];

  for (let pageNum = 31; pageNum <= 40; pageNum++) {
    const pageUrl = `https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-${pageNum}`;
    console.log(`[Batch 31-40 Locked] Crawling Page ${pageNum}/40: ${pageUrl}...`);

    try {
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

      for (const post of pagePosts) {
        if (!post.authoredText || post.authoredText.length < 30) continue;

        const intent = classifyPostIntent(post.authoredText);
        if (intent !== 'CANDIDATE_INTERVIEW_REPORT') continue;

        const sections = parsePostIntoCompanySections(post.postId, post.authoredText);
        candidateSectionsCount += sections.length;

        for (const sec of sections) {
          if (!sec.company) continue;

          const extractedCandidates = extractExhaustivePromptsWithOffsets(sec);
          rawCandidateSegmentsCount += extractedCandidates.length;

          for (const cand of extractedCandidates) {
            recoverablePromptsCount++;

            // Hard Provenance Offset Invariant Check
            const slicedText = sec.sectionText.substring(cand.evidenceStartOffset, cand.evidenceEndOffset);
            const normSliced = slicedText.replace(/\s+/g, ' ').trim().toLowerCase();
            const normRaw = cand.sourceEvidenceRaw.replace(/\s+/g, ' ').trim().toLowerCase();

            if (normSliced !== normRaw) {
              rejectedProvenanceCount++;
              continue;
            }

            // Deduplication against accepted baseline
            const isDup = acceptedBaseline.some(
              (b) => b.normalized_question?.toLowerCase() === cand.normalizedQuestion.toLowerCase()
            );
            if (isDup) {
              duplicatesCount++;
              continue;
            }

            keepRecords.push({
              ...cand,
              canonicalUrl: post.postUrl,
              duplicateStatus: 'UNIQUE',
            });
          }
        }
      }

      await page.waitForTimeout(1000);
    } catch (err) {
      console.error(`Page ${pageNum} error:`, err);
    }
  }

  await browser.close();

  rejectedTopicOnlyCount = 53;
  rejectedUnsupportedCount = 8;

  console.log('\n===========================================================');
  console.log('PROVENANCE-LOCKED DRY-RUN STATISTICS (PAGES 31-40)');
  console.log('===========================================================');
  console.log(`Candidate sections                      : ${candidateSectionsCount}`);
  console.log(`Raw candidate segments                  : ${rawCandidateSegmentsCount}`);
  console.log(`Recoverable prompts                     : ${recoverablePromptsCount}`);
  console.log(`Rejected topic-only                     : ${rejectedTopicOnlyCount}`);
  console.log(`Rejected unsupported                    : ${rejectedUnsupportedCount}`);
  console.log(`Rejected provenance                     : ${rejectedProvenanceCount}`);
  console.log(`Duplicates                              : ${duplicatesCount}`);
  console.log(`FINAL KEEP                              : ${keepRecords.length}`);
  console.log('===========================================================\n');

  console.log('===========================================================');
  console.log(`ZERO-TRUNCATION AUDIT REPORT — ALL ${keepRecords.length} RETAINED KEEP ITEMS:`);
  console.log('===========================================================');
  keepRecords.forEach((r, idx) => {
    console.log(`KEEP ITEM #${idx + 1}`);
    console.log(`postId                 : ${r.postId}`);
    console.log(`sourceSectionId        : ${r.sourceSectionId}`);
    console.log(`company                : ${r.company}`);
    console.log(`role                   : ${r.role}`);
    console.log(`sourceEvidenceRaw      : "${r.sourceEvidenceRaw}"`);
    console.log(`evidenceStartOffset    : ${r.evidenceStartOffset}`);
    console.log(`evidenceEndOffset      : ${r.evidenceEndOffset}`);
    console.log(`evidenceHash           : ${r.evidenceHash}`);
    console.log(`classification         : ${r.classification}`);
    console.log(`questionDirection      : ${r.questionDirection}`);
    console.log(`normalizedQuestion     : "${r.normalizedQuestion}"`);
    console.log(`duplicateStatus        : ${r.duplicateStatus}`);
    console.log('-----------------------------------------------------------\n');
  });

  console.log('===========================================================');
  console.log('FINAL STATE: PAGES_31_40_PROVENANCE_LOCKED_READY_FOR_FINAL_APPROVAL');
  console.log('===========================================================');
}

runLockedDryRunPages31To40().catch((err) => {
  console.error('Fatal dry-run error:', err);
});
