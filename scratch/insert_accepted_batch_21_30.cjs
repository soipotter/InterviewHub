const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function insertAcceptedBatch21To30() {
  console.log('===========================================================');
  console.log('INSERTING 8 ACCEPTED BATCH 21-30 RECORDS INTO SUPABASE');
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

  const acceptedRecords = [
    // Splus Software Vietnam (2 records)
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-14138108',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-24',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-14138108',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 24 | VOZ',
      source_evidence_text: 'project mình ghi làm 1 mình, mà cứ hỏi 2 lần là làm team hay 1 mình làm',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-14138108',
      source_page: 24,
      original_text: 'project mình ghi làm 1 mình, mà cứ hỏi 2 lần là làm team hay 1 mình làm',
      normalized_question: 'Project này bạn làm theo team hay làm một mình?',
      extraction_classification: 'EXPLICIT_QUESTION',
      question_direction: 'INTERVIEWER_TO_CANDIDATE',
      company: 'Splus Software Vietnam',
      role: 'Fresher ReactJS Developer',
      market: 'VN',
      location: null,
      location_evidence: null,
      market_verification: 'verified',
      seniority: 'Fresher',
      round: 'Technical Round',
      category: 'React',
      difficulty: 'Junior',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-14138108',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-24',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-14138108',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 24 | VOZ',
      source_evidence_text: 'hỏi class component vs Function component',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-14138108',
      source_page: 24,
      original_text: 'hỏi class component vs Function component',
      normalized_question: 'Class Component và Function Component khác nhau như thế nào?',
      extraction_classification: 'SPECIFIC_PROMPT',
      question_direction: 'INTERVIEWER_TO_CANDIDATE',
      company: 'Splus Software Vietnam',
      role: 'Fresher ReactJS Developer',
      market: 'VN',
      location: null,
      location_evidence: null,
      market_verification: 'verified',
      seniority: 'Fresher',
      round: 'Technical Round',
      category: 'React',
      difficulty: 'Junior',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },

    // Netcompany (5 split HR screening prompts)
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-27',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 27 | VOZ',
      source_evidence_text: 'Vòng 1. HR gọi điện hỏi về các dự án đã làm, dự án nào thấy tự hào nhất rồi hỏi về tech stack sử dụng, khó khăn gặp phải là gì rồi giải quyết vấn đề ra sao, mình có đóng góp gì trong dự án đó',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-15314059',
      source_page: 27,
      original_text: 'dự án nào thấy tự hào nhất',
      normalized_question: 'Dự án nào bạn cảm thấy tự hào nhất?',
      extraction_classification: 'EXPLICIT_QUESTION',
      question_direction: 'INTERVIEWER_TO_CANDIDATE',
      company: 'Netcompany',
      role: 'Entry Level',
      market: 'VN',
      location: null,
      location_evidence: null,
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
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-27',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 27 | VOZ',
      source_evidence_text: 'Vòng 1. HR gọi điện hỏi về các dự án đã làm, dự án nào thấy tự hào nhất rồi hỏi về tech stack sử dụng, khó khăn gặp phải là gì rồi giải quyết vấn đề ra sao, mình có đóng góp gì trong dự án đó',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-15314059',
      source_page: 27,
      original_text: 'hỏi về tech stack sử dụng',
      normalized_question: 'Tech stack được sử dụng trong dự án đó là gì?',
      extraction_classification: 'EXPLICIT_QUESTION',
      question_direction: 'INTERVIEWER_TO_CANDIDATE',
      company: 'Netcompany',
      role: 'Entry Level',
      market: 'VN',
      location: null,
      location_evidence: null,
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
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-27',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 27 | VOZ',
      source_evidence_text: 'Vòng 1. HR gọi điện hỏi về các dự án đã làm, dự án nào thấy tự hào nhất rồi hỏi về tech stack sử dụng, khó khăn gặp phải là gì rồi giải quyết vấn đề ra sao, mình có đóng góp gì trong dự án đó',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-15314059',
      source_page: 27,
      original_text: 'khó khăn gặp phải là gì',
      normalized_question: 'Bạn đã gặp khó khăn gì trong dự án đó?',
      extraction_classification: 'EXPLICIT_QUESTION',
      question_direction: 'INTERVIEWER_TO_CANDIDATE',
      company: 'Netcompany',
      role: 'Entry Level',
      market: 'VN',
      location: null,
      location_evidence: null,
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
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-27',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 27 | VOZ',
      source_evidence_text: 'Vòng 1. HR gọi điện hỏi về các dự án đã làm, dự án nào thấy tự hào nhất rồi hỏi về tech stack sử dụng, khó khăn gặp phải là gì rồi giải quyết vấn đề ra sao, mình có đóng góp gì trong dự án đó',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-15314059',
      source_page: 27,
      original_text: 'giải quyết vấn đề ra sao',
      normalized_question: 'Bạn đã giải quyết khó khăn đó như thế nào?',
      extraction_classification: 'EXPLICIT_QUESTION',
      question_direction: 'INTERVIEWER_TO_CANDIDATE',
      company: 'Netcompany',
      role: 'Entry Level',
      market: 'VN',
      location: null,
      location_evidence: null,
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
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-27',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 27 | VOZ',
      source_evidence_text: 'Vòng 1. HR gọi điện hỏi về các dự án đã làm, dự án nào thấy tự hào nhất rồi hỏi về tech stack sử dụng, khó khăn gặp phải là gì rồi giải quyết vấn đề ra sao, mình có đóng góp gì trong dự án đó',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-15314059',
      source_page: 27,
      original_text: 'mình có đóng góp gì trong dự án đó',
      normalized_question: 'Bạn đã đóng góp gì cho dự án?',
      extraction_classification: 'EXPLICIT_QUESTION',
      question_direction: 'INTERVIEWER_TO_CANDIDATE',
      company: 'Netcompany',
      role: 'Entry Level',
      market: 'VN',
      location: null,
      location_evidence: null,
      market_verification: 'verified',
      seniority: 'Intern',
      round: 'HR Screening',
      category: 'Web Fundamentals',
      difficulty: 'Junior',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },

    // Netcompany (1 Live Interview Case Prompt record)
    {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_requested_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/page-27',
      source_final_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-15314059',
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | Page 27 | VOZ',
      source_evidence_text: 'Sau đó sẽ cho bác một bài toán (bác sẽ coi như mình là một IT consultant) để giải quyết bài toán đó, bài toán này kiểu như là có một hệ thống tính phí khi đi qua một cây cầu, system có call api tới bên thứ 3 để tính toán dc chi phí... sau đó thì yêu cầu mình thiết kế cái system đó...',
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: 'post-15314059',
      source_page: 27,
      original_text: 'Sau đó sẽ cho bác một bài toán (bác sẽ coi như mình là một IT consultant) để giải quyết bài toán đó, bài toán này kiểu như là có một hệ thống tính phí khi đi qua một cây cầu...',
      normalized_question: 'Hãy thiết kế một hệ thống tính phí khi phương tiện đi qua cầu. Hệ thống có tích hợp API bên thứ ba để tính chi phí. Hãy trình bày lựa chọn công nghệ Frontend/Backend, thiết kế database và cách xử lý các vấn đề về performance.',
      extraction_classification: 'SPECIFIC_PROMPT',
      question_direction: 'INTERVIEWER_TO_CANDIDATE',
      company: 'Netcompany',
      role: 'Entry Level',
      market: 'VN',
      location: null,
      location_evidence: null,
      market_verification: 'verified',
      seniority: 'Intern',
      round: 'Technical Case Study',
      category: 'Web Fundamentals',
      difficulty: 'Intermediate',
      confidence: 0.98,
      is_duplicate_flagged: false,
      imported_at: new Date().toISOString(),
    },
  ];

  console.log('Inserting 8 accepted records into Supabase public.ingested_questions...');
  const { data: inserted, error: insertErr } = await supabase
    .from('ingested_questions')
    .insert(acceptedRecords)
    .select();

  if (insertErr) {
    console.error('✕ Insertion failed:', insertErr.message, insertErr);
    console.log('\nINSERTED: 0');
    console.log('FAILED: 8');
    return;
  }

  console.log(`✓ Insert successful! Inserted ${inserted.length} records into Supabase.\n`);

  // Query back all newly inserted records from Supabase to verify persistence
  console.log('Querying back newly inserted records from Supabase public.ingested_questions...');
  const { data: queriedRecords, error: queryErr } = await supabase
    .from('ingested_questions')
    .select('id, company, role, normalized_question, source_post_id, source_url, extraction_classification, status')
    .eq('status', 'pending_review')
    .or('company.eq.Splus Software Vietnam,company.eq.Netcompany')
    .order('created_at', { ascending: true });

  if (queryErr || !queriedRecords) {
    console.error('✕ Query back failed:', queryErr?.message);
    return;
  }

  console.log('===========================================================');
  console.log(`SUPABASE PERSISTENCE VERIFICATION (${queriedRecords.length} NEW RECORDS):`);
  console.log('===========================================================');
  queriedRecords.forEach((r, idx) => {
    console.log(`RECORD #${idx + 1}`);
    console.log(`id                  : ${r.id}`);
    console.log(`company             : ${r.company}`);
    console.log(`role                : ${r.role}`);
    console.log(`normalizedQuestion  : "${r.normalized_question}"`);
    console.log(`sourcePostId        : ${r.source_post_id}`);
    console.log(`canonicalUrl        : ${r.source_url}`);
    console.log(`classification      : ${r.extraction_classification}`);
    console.log(`status              : ${r.status}`);
    console.log('-----------------------------------------------------------\n');
  });

  console.log('===========================================================');
  console.log('INSERTED: 8');
  console.log('FAILED: 0');
  console.log('===========================================================');
  console.log('RESULT: PAGES_21_30_INSERTED_PENDING_REVIEW');
  console.log('===========================================================');
}

insertAcceptedBatch21To30().catch((err) => {
  console.error('Fatal insertion error:', err);
});
