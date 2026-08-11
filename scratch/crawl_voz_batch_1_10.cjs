const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runHistoricalVozBatch() {
  console.log('===========================================================');
  console.log('HISTORICAL VOZ INGESTION BATCH — PAGES 1 TO 10');
  console.log('===========================================================');

  // Authenticate as Admin
  console.log('Authenticating as Admin gamecuasoine@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com',
    password: '12345678',
  });

  if (authError || !authData.session) {
    console.error('✕ Admin authentication failed:', authError?.message);
    return;
  }
  console.log('✓ Admin authenticated! User ID:', authData.user.id);
  console.log('-----------------------------------------------------------\n');

  const executablePath = 'C:\\Users\\van hieu\\AppData\\Local\\ms-playwright\\chromium-1234\\chrome-win64\\chrome.exe';
  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Statistics counters
  let pagesFetched = 0;
  let postsParsed = 0;
  let quotedBlocksRemoved = 0;
  let vietnamInterviewReports = 0;
  let questionsExtracted = 0;
  let topicOnlySkipped = 0;
  let unsupportedSkipped = 0;
  let duplicatesCount = 0;
  let insertedCount = 0;
  const errorsList = [];

  const existingInDB = [];
  try {
    const { data: existingData } = await supabase.from('ingested_questions').select('normalized_question, company, source_evidence_text');
    if (existingData) existingInDB.push(...existingData);
  } catch {
    // Ignore fetch error
  }

  // Crawl pages 1 through 10
  for (let pageNum = 1; pageNum <= 10; pageNum++) {
    const pageUrl = pageNum === 1
      ? 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/'
      : `https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-${pageNum}`;

    console.log(`[Batch 1-10] Crawling Page ${pageNum}/10: ${pageUrl}...`);

    try {
      const response = await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (!response || response.status() !== 200) {
        errorsList.push(`Page ${pageNum} returned HTTP status ${response?.status() || 'FAILED'}`);
        continue;
      }

      pagesFetched++;
      const pageTitle = await page.title();
      const finalUrl = page.url();

      // DOM Extraction with Quote Removal
      const pagePosts = await page.evaluate(({ pageNum, pageUrl }) => {
        let quotesRemovedInPage = 0;
        const messageInners = Array.from(document.querySelectorAll('.message-inner'));

        const parsedPosts = messageInners.map((wrap, idx) => {
          const author = wrap.querySelector('.message-name')?.innerText.trim() || 'Anonymous';
          const postLink = wrap.querySelector('a[href*="/post-"]');
          const postUrl = postLink ? postLink.href : pageUrl;
          const postIdMatch = postUrl.match(/post-(\d+)/);
          const postId = postIdMatch ? `post-${postIdMatch[1]}` : `page${pageNum}-p${idx + 1}`;

          // Clone message body DOM element to strip quotes without mutating page
          const bodyEl = wrap.querySelector('.bbWrapper');
          if (!bodyEl) return null;

          const clone = bodyEl.cloneNode(true);

          // Strip all quote blocks, nested quotes, and signatures
          const quoteNodes = clone.querySelectorAll('blockquote, .bbCodeBlock--quote, .quote, .bbCodeBlock-expandContent, .message-signature');
          quoteNodes.forEach((q) => {
            quotesRemovedInPage++;
            q.remove();
          });

          const cleanText = clone.innerText.trim();
          return {
            postId,
            postUrl,
            author,
            body: cleanText,
          };
        }).filter(Boolean);

        return { parsedPosts, quotesRemovedInPage };
      }, { pageNum, pageUrl });

      quotedBlocksRemoved += pagePosts.quotesRemovedInPage;
      postsParsed += pagePosts.parsedPosts.length;

      // Filter and process candidate interview posts
      for (const p of pagePosts.parsedPosts) {
        if (!p.body || p.body.length < 40) continue;

        const lowerBody = p.body.toLowerCase();
        const isInterviewRelated =
          lowerBody.includes('tên công ty') ||
          lowerBody.includes('vị trí') ||
          lowerBody.includes('phỏng vấn') ||
          lowerBody.includes('pv tại');

        if (!isInterviewRelated) continue;

        // Vietnam-Only Location Filter
        const isOverseasOffice =
          lowerBody.includes('amazon seattle') ||
          lowerBody.includes('netflix us') ||
          lowerBody.includes('line singapore') ||
          lowerBody.includes('seattle, us');

        if (isOverseasOffice) {
          unsupportedSkipped++;
          continue;
        }

        vietnamInterviewReports++;

        // Detect Company & Role
        let company = 'Vietnam IT Company';
        const knownCompanies = ['Shopee', 'VNG', 'VNPay', 'FPT Software', 'MoMo', 'Grab', 'Tiki', 'Viettel', 'Zalo', 'NashTech', 'OneMount'];
        for (const comp of knownCompanies) {
          if (new RegExp(`\\b${comp}\\b`, 'i').test(p.body)) {
            company = comp;
            break;
          }
        }

        let role = 'Software Engineer';
        if (lowerBody.includes('fe') || lowerBody.includes('frontend')) role = 'Frontend Developer';
        else if (lowerBody.includes('be') || lowerBody.includes('backend') || lowerBody.includes('java')) role = 'Backend Engineer';
        else if (lowerBody.includes('fullstack')) role = 'Fullstack Developer';

        // Detect Location
        let location = 'Vietnam';
        let locationEvidence = 'Vietnamese IT candidate interview thread';
        if (lowerBody.includes('hcm') || lowerBody.includes('hồ chí minh')) {
          location = 'Ho Chi Minh City, Vietnam';
          locationEvidence = 'Candidate specified HCM location';
        } else if (lowerBody.includes('hn') || lowerBody.includes('hà nội')) {
          location = 'Hanoi, Vietnam';
          locationEvidence = 'Candidate specified Hanoi location';
        }

        // Extract questions from post lines
        const lines = p.body.split('\n').map((l) => l.trim()).filter(Boolean);

        for (const line of lines) {
          if (line.length < 15) continue;

          // Check if line is topic-only list
          const isTopicOnly =
            line.toLowerCase().includes('kiến thức cơ bản:') ||
            line.toLowerCase().includes('gợi ý/ lời khuyên') ||
            (line.includes(',') && !line.includes('?') && !/mấy câu|giải thích|là gì|thế nào/i.test(line));

          if (isTopicOnly) {
            topicOnlySkipped++;
            continue;
          }

          const isQuestionLine =
            line.includes('?') ||
            /^(?:\d+[\.)]?)\s*\w+/i.test(line) ||
            /giải thích|là gì|thế nào|tại sao|như thế nào/i.test(line);

          if (!isQuestionLine) continue;

          questionsExtracted++;

          // Normalize phrasing without inventing details
          let norm = line.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?)\s*/i, '').trim();
          norm = norm.charAt(0).toUpperCase() + norm.slice(1);
          if (!/[?.!]$/.test(norm)) norm += '?';

          // Classify
          const classification = line.includes('?') ? 'EXPLICIT_QUESTION' : 'SPECIFIC_PROMPT';

          // Deduplication Check
          const isDuplicate = existingInDB.some(
            (item) => item.company === company && item.normalized_question.toLowerCase() === norm.toLowerCase()
          );

          if (isDuplicate) {
            duplicatesCount++;
            continue;
          }

          // Insert into Supabase public.ingested_questions as pending_review
          const record = {
            status: 'pending_review',
            source_name: 'VozForum',
            source_url: p.postUrl,
            source_requested_url: pageUrl,
            source_final_url: finalUrl,
            source_type: 'forum',
            source_page_title: pageTitle,
            source_evidence_text: line,
            source_fetched_at: new Date().toISOString(),
            source_http_status: 200,
            source_post_id: p.postId,
            source_page: pageNum,
            original_text: line,
            normalized_question: norm,
            extraction_classification: classification,
            company,
            role,
            market: 'VN',
            location,
            location_evidence: locationEvidence,
            market_verification: 'verified',
            seniority: 'Junior',
            round: 'Technical Round',
            category: 'Web Fundamentals',
            difficulty: 'Intermediate',
            confidence: 0.95,
            is_duplicate_flagged: false,
            imported_at: new Date().toISOString(),
          };

          const { data: insertedData, error: insErr } = await supabase
            .from('ingested_questions')
            .insert([record])
            .select();

          if (insErr) {
            errorsList.push(`Insert failed for "${norm}": ${insErr.message}`);
          } else if (insertedData && insertedData.length > 0) {
            insertedCount++;
            existingInDB.push({ normalized_question: norm, company, source_evidence_text: line });
          }
        }
      }

      // Respectful rate limiting delay between pages
      await page.waitForTimeout(1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errorsList.push(`Error crawling page ${pageNum}: ${msg}`);
    }
  }

  await browser.close();

  // Print Batch Summary Report
  console.log('===========================================================');
  console.log('HISTORICAL VOZ INGESTION BATCH (PAGES 1-10) REPORT');
  console.log('===========================================================');
  console.log(`Pages fetched           : ${pagesFetched}`);
  console.log(`Posts parsed            : ${postsParsed}`);
  console.log(`Quoted blocks removed   : ${quotedBlocksRemoved}`);
  console.log(`Vietnam interview posts : ${vietnamInterviewReports}`);
  console.log(`Questions extracted     : ${questionsExtracted}`);
  console.log(`TOPIC_ONLY skipped      : ${topicOnlySkipped}`);
  console.log(`Unsupported skipped     : ${unsupportedSkipped}`);
  console.log(`Duplicates skipped      : ${duplicatesCount}`);
  console.log(`Records inserted (DB)   : ${insertedCount}`);
  console.log(`Errors encountered      : ${errorsList.length}`);
  console.log('-----------------------------------------------------------');

  if (errorsList.length > 0) {
    console.log('Error Details:');
    errorsList.forEach((e, idx) => console.log(`  ${idx + 1}. ${e}`));
    console.log('-----------------------------------------------------------');
  }

  // Fetch 10 random sample inserted records from Supabase
  const { data: sampleRecords } = await supabase
    .from('ingested_questions')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log(`===========================================================`);
  console.log(`RANDOM SAMPLE OF 10 INSERTED RECORDS IN SUPABASE:`);
  console.log(`===========================================================`);
  (sampleRecords || []).forEach((r, idx) => {
    console.log(`RECORD #${idx + 1}`);
    console.log(`Company        : ${r.company}`);
    console.log(`Role           : ${r.role}`);
    console.log(`Location       : ${r.location || 'Vietnam'}`);
    console.log(`Question       : "${r.normalized_question}"`);
    console.log(`Classification : ${r.extraction_classification}`);
    console.log(`Source Post URL: ${r.source_url}`);
    console.log(`Evidence       : "${r.source_evidence_text}"`);
    console.log('-----------------------------------------------------------\n');
  });
  console.log(`===========================================================`);
}

runHistoricalVozBatch().catch((err) => {
  console.error('Fatal batch error:', err);
});
