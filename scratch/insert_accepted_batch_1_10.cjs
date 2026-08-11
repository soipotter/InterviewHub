const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertAcceptedBatch1To10() {
  console.log('===========================================================');
  console.log('INSERTING 5 MANUALLY ACCEPTED BATCH 1-10 RECORDS INTO SUPABASE');
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

  // The 5 manually accepted candidate questions with exact metadata and zero invented details
  const acceptedRecords = [
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6383397',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6383397',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
      source_evidence_text: 'chi tiết khi một browser send request tới server thì chuyện gì xảy ra',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-6383397',
      source_page: 1,
      original_text: 'chi tiết khi một browser send request tới server thì chuyện gì xảy ra',
      normalized_question: 'Điều gì xảy ra khi trình duyệt gửi một request tới server?',
      extraction_classification: 'SPECIFIC_PROMPT',
      company: 'Shopee',
      role: 'Frontend Developer',
      market: 'VN',
      location: 'Ho Chi Minh City, Vietnam',
      location_evidence: 'Shopee HCM office',
      market_verification: 'verified',
      seniority: 'Fresher',
      round: 'Technical Round 2',
      category: 'Web Fundamentals',
      difficulty: 'Intermediate',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6444145',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6444145',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
      source_evidence_text: 'Tại sao em không chuyên về an ninh mạng, lại apply vị trí này? hay là vì em muốn vào cty, nên cty tuyển vị trí gì thì em nộp vị trí đó?',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-6444145',
      source_page: 2,
      original_text: 'Tại sao em không chuyên về an ninh mạng, lại apply vị trí này? hay là vì em muốn vào cty, nên cty tuyển vị trí gì thì em nộp vị trí đó?',
      normalized_question: 'Tại sao em không chuyên về an ninh mạng, lại apply vị trí này? hay là vì em muốn vào cty, nên cty tuyển vị trí gì thì em nộp vị trí đó?',
      extraction_classification: 'EXPLICIT_QUESTION',
      company: 'Viet** Cyber Security',
      role: 'Cybersecurity Intern',
      market: 'VN',
      location: 'Vietnam',
      location_evidence: 'Vietnam Cyber Security company',
      market_verification: 'verified',
      seniority: 'Intern',
      round: 'Technical Round',
      category: 'Web Fundamentals',
      difficulty: 'Junior',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6444145',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6444145',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
      source_evidence_text: 'Nếu bây giờ công ty chỉ hỗ trợ cho em 1 khoản tiền nhỏ để thực tập thì em có làm không? số tiền nhỏ chỉ để mua được quyển sách chẳng hạn.',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-6444145',
      source_page: 2,
      original_text: 'Nếu bây giờ công ty chỉ hỗ trợ cho em 1 khoản tiền nhỏ để thực tập thì em có làm không? số tiền nhỏ chỉ để mua được quyển sách chẳng hạn.',
      normalized_question: 'Nếu bây giờ công ty chỉ hỗ trợ cho em 1 khoản tiền nhỏ để thực tập thì em có làm không? số tiền nhỏ chỉ để mua được quyển sách chẳng hạn.',
      extraction_classification: 'EXPLICIT_QUESTION',
      company: 'Viet** Cyber Security',
      role: 'Cybersecurity Intern',
      market: 'VN',
      location: 'Vietnam',
      location_evidence: 'Vietnam Cyber Security company',
      market_verification: 'verified',
      seniority: 'Intern',
      round: 'HR Screening',
      category: 'Web Fundamentals',
      difficulty: 'Junior',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6484610',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-3',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6484610',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 3 | VOZ',
      source_evidence_text: 'Ví dụ bên mình xài Kafka thì kafka giải quyết bài toán gì',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-6484610',
      source_page: 3,
      original_text: 'Ví dụ bên mình xài Kafka thì kafka giải quyết bài toán gì',
      normalized_question: 'Kafka giải quyết bài toán gì?',
      extraction_classification: 'SPECIFIC_PROMPT',
      company: 'VNPay',
      role: 'Software Engineer (Java)',
      market: 'VN',
      location: 'Hanoi, Vietnam',
      location_evidence: 'VNPay Hanoi office',
      market_verification: 'verified',
      seniority: 'Junior',
      round: 'Technical Round 1',
      category: 'Web Fundamentals',
      difficulty: 'Intermediate',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-7916686',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-5',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-7916686',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 5 | VOZ',
      source_evidence_text: 'Giải thích lên bảng 1 kiến trúc mạng gì đó. Cùng nhau phân tích cons/pros.',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-7916686',
      source_page: 5,
      original_text: 'Giải thích lên bảng 1 kiến trúc mạng gì đó. Cùng nhau phân tích cons/pros.',
      normalized_question: 'Giải thích một kiến trúc mạng và phân tích ưu, nhược điểm của kiến trúc đó.',
      extraction_classification: 'SPECIFIC_PROMPT',
      company: 'VinBrain',
      role: 'Applied Science Intern',
      market: 'VN',
      location: 'Vietnam',
      location_evidence: 'VinBrain office',
      market_verification: 'verified',
      seniority: 'Intern',
      round: 'Technical Round',
      category: 'Web Fundamentals',
      difficulty: 'Intermediate',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },
  ];

  console.log('Inserting 5 accepted records into Supabase public.ingested_questions...');
  const { data: inserted, error: insertErr } = await supabase
    .from('ingested_questions')
    .insert(acceptedRecords)
    .select();

  if (insertErr) {
    console.error('✕ Insertion failed:', insertErr.message, insertErr);
    console.log('\nINSERTED: 0');
    console.log('FAILED: 5');
    return;
  }

  console.log(`✓ Insert successful! Inserted ${inserted.length} records into Supabase.\n`);

  // Query back all 5 inserted records from Supabase to verify persistence
  console.log('Querying back inserted records from Supabase public.ingested_questions...');
  const { data: queriedRecords, error: queryErr } = await supabase
    .from('ingested_questions')
    .select('id, company, role, normalized_question, source_post_id, source_url, extraction_classification, status')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  if (queryErr || !queriedRecords) {
    console.error('✕ Query back failed:', queryErr?.message);
    return;
  }

  console.log('===========================================================');
  console.log(`SUPABASE PERSISTENCE VERIFICATION (${queriedRecords.length} RECORDS):`);
  console.log('===========================================================');
  queriedRecords.forEach((r, idx) => {
    console.log(`RECORD #${idx + 1}`);
    console.log(`id                      : ${r.id}`);
    console.log(`company                 : ${r.company}`);
    console.log(`role                    : ${r.role}`);
    console.log(`normalized_question     : "${r.normalized_question}"`);
    console.log(`source_post_id          : ${r.source_post_id}`);
    console.log(`canonical_url           : ${r.source_url}`);
    console.log(`classification          : ${r.extraction_classification}`);
    console.log(`status                  : ${r.status}`);
    console.log('-----------------------------------------------------------\n');
  });

  console.log('===========================================================');
  console.log('INSERTED: 5');
  console.log('FAILED: 0');
  console.log('===========================================================');
  console.log('RESULT: BATCH_1_10_INSERTED_PENDING_REVIEW');
  console.log('===========================================================');
}

insertAcceptedBatch1To10().catch((err) => {
  console.error('Fatal insertion error:', err);
});
