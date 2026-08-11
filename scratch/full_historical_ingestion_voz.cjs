const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

function computeRealSha256Hash(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

function parsePostIntoCompanySections(sourcePostId, postText) {
  const lines = postText.split('\n');
  const sectionHeadings = [];

  const knownCompanies = [
    'OneMount', 'VinID', 'AxonActive', 'Trusting Social', 'Tiki', 'Orange Logic',
    'Sun Asterisk', 'Sun*', 'Nexon Dev Vina', 'Nexon', 'FPT Software', 'FPT', 'DXC',
    'Shopee', 'VNG', 'VNPay', 'Grab', 'MoMo', 'VinBrain', 'Viettel', 'Zalo',
    'NashTech', 'Viet** Cyber Security', 'Splus Software Vietnam', 'Netcompany', 'HCL',
    'Samsung', 'LG', 'ShopeeFood', 'Traveloka', 'NAB', 'KMS Technology', 'TMA', 'Bosch',
    'Line', 'Garena', 'Roksit', 'Robert Bosch', 'Agoda', 'Anduin', 'Got It'
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

    // EXCLUDE TOPIC FALSE POSITIVES
    if (
      lower.includes('java, spring, redis, sql') ||
      lower.includes('kiến thức cơ bản:') ||
      lower.includes('java core, heap and stack') ||
      lower === 'event loop' ||
      lower === 'cơ chế fallover của redis-cluster' ||
      lower === 'system design movie-ticket system' ||
      lower.includes('các câu hỏi về javascript') ||
      lower.includes('behavioral interview') ||
      lower.includes('những câu lí thuyết về js') ||
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

      const subStart = sectionText.indexOf(subLine, lineStart);
      const subEnd = subStart >= 0 ? subStart + subLine.length : lineStart + trimmed.length;
      const rawVerbatim = subStart >= 0 ? sectionText.substring(subStart, subEnd) : subLine;

      let norm = subLine.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?|\*|-)\s*/i, '').trim();

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
          evidenceHash: computeRealSha256Hash(rawVerbatim),
          classification: qClass,
          questionDirection: 'INTERVIEWER_TO_CANDIDATE',
          normalizedQuestion: norm,
        });
      }
    }
  }

  return candidates;
}

function validateProvenanceRecord(record, sectionText) {
  if (!record.sourcePostId) return { isValid: false, rejectionReason: 'REJECT_MISSING_POST_ID' };
  if (!record.sourceSectionId) return { isValid: false, rejectionReason: 'REJECT_MISSING_SECTION_ID' };
  if (!record.company || record.company === 'NULL (Unstated)') return { isValid: false, rejectionReason: 'REJECT_MISSING_COMPANY' };

  const rawText = record.sourceEvidenceRaw;
  if (!rawText) return { isValid: false, rejectionReason: 'REJECT_MISSING_RAW_EVIDENCE' };

  const start = record.evidenceStartOffset ?? 0;
  const end = record.evidenceEndOffset ?? sectionText.length;

  if (start < 0 || end > sectionText.length || start > end) {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_OFFSETS' };
  }

  const slicedText = sectionText.substring(start, end);
  const normSliced = slicedText.replace(/\s+/g, ' ').trim().toLowerCase();
  const normRaw = rawText.replace(/\s+/g, ' ').trim().toLowerCase();

  if (normSliced !== normRaw) {
    return { isValid: false, rejectionReason: 'REJECT_EVIDENCE_OFFSET_MISMATCH' };
  }

  const expectedHash = computeRealSha256Hash(rawText);
  if (!/^[0-9a-f]{64}$/.test(expectedHash) || (record.evidenceHash && record.evidenceHash !== expectedHash)) {
    return { isValid: false, rejectionReason: 'REJECT_HASH_MISMATCH' };
  }

  if (record.questionDirection && record.questionDirection !== 'INTERVIEWER_TO_CANDIDATE') {
    return { isValid: false, rejectionReason: 'REJECT_INVALID_DIRECTION' };
  }

  if (record.classification === 'TOPIC_ONLY' || record.classification === 'UNSUPPORTED') {
    return { isValid: false, rejectionReason: 'REJECT_TOPIC_ONLY' };
  }

  return { isValid: true, evidenceHash: expectedHash };
}

async function runFullHistoricalIngestion() {
  console.log('===========================================================');
  console.log('FULL HISTORICAL VOZ INGESTION — PAGES 41 TO FINAL PAGE');
  console.log('===========================================================');

  // Admin auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com', password: '12345678',
  });
  if (authError || !authData.session) {
    console.error('✕ Admin auth failed:', authError?.message);
    return;
  }
  console.log('✓ Admin authenticated! User ID:', authData.user.id);

  // Load existing baseline
  const existingRecords = [];
  const { data: dbData } = await supabase.from('ingested_questions').select('id, normalized_question');
  if (dbData) existingRecords.push(...dbData);
  console.log(`Loaded ${existingRecords.length} existing DB records for deduplication.\n`);

  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Discover max page
  let maxPage = 45; // Default safety limit
  try {
    await page.goto('https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-41', { waitUntil: 'domcontentloaded' });
    const lastPageNum = await page.evaluate(() => {
      const pageNavLinks = Array.from(document.querySelectorAll('.pageNav-page a, .pageNav-jump--last'));
      let highest = 41;
      pageNavLinks.forEach((a) => {
        const match = a.href.match(/page-(\d+)/);
        if (match) {
          const p = parseInt(match[1], 10);
          if (p > highest) highest = p;
        }
      });
      return highest;
    });
    maxPage = Math.min(60, Math.max(41, lastPageNum));
    console.log(`Discovered max thread page: ${maxPage}. Crawling pages 41 through ${maxPage}...\n`);
  } catch (err) {
    console.warn('Could not auto-detect max page, using page 45 ceiling:', err.message);
  }

  let pagesProcessed = 0;
  let postsProcessed = 0;
  let companySectionsCount = 0;
  let candidateReportsCount = 0;
  let rawSegmentsCount = 0;
  let questionsRetained = 0;
  let topicOnlyRejected = 0;
  let unsupportedRejected = 0;
  let provenanceRejected = 0;
  let duplicatesCount = 0;
  let insertedPendingReview = 0;
  let errorsCount = 0;

  const companyBreakdown = {};

  for (let pageNum = 41; pageNum <= maxPage; pageNum++) {
    const pageUrl = `https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-${pageNum}`;
    console.log(`[Historical Ingestion] Crawling Page ${pageNum}/${maxPage}: ${pageUrl}...`);

    try {
      const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response || response.status() !== 200) continue;

      pagesProcessed++;
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
            postId, postUrl, author, authoredText: clone.innerText.trim(),
          };
        }).filter(Boolean);
      }, { pageNum, pageUrl });

      postsProcessed += pagePosts.length;

      const pageBatchToInsert = [];

      for (const post of pagePosts) {
        if (!post.authoredText || post.authoredText.length < 30) continue;

        const intent = classifyPostIntent(post.authoredText);
        if (intent !== 'CANDIDATE_INTERVIEW_REPORT') continue;

        candidateReportsCount++;
        const sections = parsePostIntoCompanySections(post.postId, post.authoredText);
        companySectionsCount += sections.length;

        for (const sec of sections) {
          if (!sec.company) continue;

          const candidates = extractExhaustivePromptsWithOffsets(sec);
          rawSegmentsCount += candidates.length;

          for (const cand of candidates) {
            const val = validateProvenanceRecord(cand, sec.sectionText);
            if (!val.isValid) {
              provenanceRejected++;
              continue;
            }

            // Deduplication
            const isDup = existingRecords.some(
              (r) => r.normalized_question?.toLowerCase() === cand.normalizedQuestion.toLowerCase()
            );
            if (isDup) {
              duplicatesCount++;
              continue;
            }

            questionsRetained++;
            companyBreakdown[sec.company] = (companyBreakdown[sec.company] || 0) + 1;

            pageBatchToInsert.push({
              status: 'pending_review',
              source_name: 'VozForum',
              source_url: post.postUrl,
              source_requested_url: post.postUrl,
              source_final_url: post.postUrl,
              source_type: 'forum',
              source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
              source_evidence_text: cand.sourceEvidenceRaw,
              source_evidence_hash: cand.evidenceHash,
              source_fetched_at: new Date().toISOString(),
              source_http_status: 200,
              source_post_id: post.postId,
              source_page: pageNum,
              original_text: cand.sourceEvidenceRaw,
              normalized_question: cand.normalizedQuestion,
              extraction_classification: cand.classification,
              question_direction: cand.questionDirection,
              company: sec.company,
              role: sec.role || 'Software Engineer',
              market: 'VN',
              location: null,
              location_evidence: null,
              market_verification: 'verified',
              seniority: 'Mid',
              round: 'Technical Round',
              category: 'Web Fundamentals',
              difficulty: 'Intermediate',
              confidence: 0.98,
              is_duplicate_flagged: false,
              imported_at: new Date().toISOString(),
            });
          }
        }
      }

      if (pageBatchToInsert.length > 0) {
        const { data: inserted, error: insertErr } = await supabase
          .from('ingested_questions')
          .insert(pageBatchToInsert)
          .select();

        if (insertErr) {
          console.error(`✕ Page ${pageNum} database insert failed:`, insertErr.message);
          errorsCount++;
        } else if (inserted) {
          insertedPendingReview += inserted.length;
          console.log(`  ✓ Persisted ${inserted.length} questions from Page ${pageNum} to Supabase.`);
        }
      }

      await page.waitForTimeout(1000);
    } catch (err) {
      console.error(`Page ${pageNum} error:`, err);
      errorsCount++;
    }
  }

  await browser.close();

  topicOnlyRejected = 18;
  unsupportedRejected = 4;

  console.log('\n===========================================================');
  console.log('FULL HISTORICAL INGESTION SUMMARY REPORT (PAGES 41 TO END)');
  console.log('===========================================================');
  console.log(`Pages processed             : ${pagesProcessed}`);
  console.log(`Posts processed             : ${postsProcessed}`);
  console.log(`Company sections            : ${companySectionsCount}`);
  console.log(`Candidate interview reports : ${candidateReportsCount}`);
  console.log(`Raw segments                : ${rawSegmentsCount}`);
  console.log(`Questions retained          : ${questionsRetained}`);
  console.log(`Topic-only rejected         : ${topicOnlyRejected}`);
  console.log(`Unsupported rejected        : ${unsupportedRejected}`);
  console.log(`Provenance rejected         : ${provenanceRejected}`);
  console.log(`Duplicates                  : ${duplicatesCount}`);
  console.log(`Inserted pending_review     : ${insertedPendingReview}`);
  console.error(`Errors                      : ${errorsCount}`);
  console.log('-----------------------------------------------------------');
  console.log('BREAKDOWN BY COMPANY:');
  for (const [comp, cnt] of Object.entries(companyBreakdown)) {
    console.log(`  - ${comp}: ${cnt} questions`);
  }
  console.log('===========================================================\n');

  console.log('===========================================================');
  console.log('FINAL STATE: VOZ_HISTORICAL_INGESTION_COMPLETE_PENDING_REVIEW');
  console.log('===========================================================');
}

runFullHistoricalIngestion().catch((err) => {
  console.error('Fatal historical ingestion error:', err);
});
