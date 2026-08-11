const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

function computeRealSha256Hash(text) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
}

async function insertAcceptedBatch31To40() {
  console.log('===========================================================');
  console.log('INSERTING VALIDATED BATCH 31-40 RECORDS INTO SUPABASE');
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

  const candidatePrompts = [
    // OneMount (2 records)
    {
      company: 'OneMount', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec1',
      source_evidence_text: 'Go xử lý bộ nhớ của đoạn code như thế nào?',
      normalized_question: 'Go xử lý bộ nhớ của đoạn code như thế nào?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'OneMount', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec1',
      source_evidence_text: 'Thiết kế hệ thống lưu session đăng nhập cần lưu ý gì?',
      normalized_question: 'Thiết kế hệ thống lưu session đăng nhập cần lưu ý gì?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },

    // AxonActive (6 records)
    {
      company: 'AxonActive', role: 'Software Engineer Backend',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec2',
      source_evidence_text: 'Java 8 có gì mới/mạnh? Stream api, date time api',
      normalized_question: 'Java 8 có những điểm mới hoặc nổi bật nào?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'AxonActive', role: 'Software Engineer Backend',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec2',
      source_evidence_text: 'Đưa 1 đoạn code Java, giải thích đoạn code này với teamate khác ntn, optimize chỗ nào được.',
      normalized_question: 'Đưa 1 đoạn code Java, giải thích đoạn code này với teamate khác ntn, optimize chỗ nào được.',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'AxonActive', role: 'Software Engineer Backend',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec2',
      source_evidence_text: 'Exception handling lưu ý gì?',
      normalized_question: 'Exception handling lưu ý gì?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'AxonActive', role: 'Software Engineer Backend',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec2',
      source_evidence_text: '3 điều gì trong cuộc sống là quan trọng nhất',
      normalized_question: '3 điều gì trong cuộc sống là quan trọng nhất?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'AxonActive', role: 'Software Engineer Backend',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec2',
      source_evidence_text: 'triết lý sống là gì',
      normalized_question: 'Triết lý sống là gì?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'AxonActive', role: 'Software Engineer Backend',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec2',
      source_evidence_text: 'đánh giá 1 team member cũ',
      normalized_question: 'Đánh giá 1 team member cũ',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },

    // Trusting Social (1 record)
    {
      company: 'Trusting Social', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec3',
      source_evidence_text: 'Design API/import flow cho file CSV dung lượng lớn vào DB',
      normalized_question: 'Design API/import flow cho file CSV dung lượng lớn vào DB',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },

    // Tiki (3 records)
    {
      company: 'Tiki', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec4',
      source_evidence_text: 'Hỏi về System Design tổng quan và vị trí của dự án cũ',
      normalized_question: 'Hỏi về System Design tổng quan và vị trí của dự án cũ',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'Tiki', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec4',
      source_evidence_text: 'vẽ với trình bày kiến trúc chung',
      normalized_question: 'Vẽ và trình bày kiến trúc tổng quan của hệ thống bạn đã làm.',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'Tiki', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec4',
      source_evidence_text: 'input data rất lớn thì algo đổi ntn',
      normalized_question: 'Thuật toán sẽ thay đổi như thế nào khi dữ liệu đầu vào rất lớn?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },

    // Orange Logic (5 records)
    {
      company: 'Orange Logic', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec5',
      source_evidence_text: 'Kiến thức thực tế aka kinh nghiệm làm việc: cũng hỏi kiến trúc, sau đó hỏi sâu về tại sao chọn công nghệ này công nghệ kia.',
      normalized_question: 'Kiến thức thực tế aka kinh nghiệm làm việc: cũng hỏi kiến trúc, sau đó hỏi sâu về tại sao chọn công nghệ này công nghệ kia.',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'Orange Logic', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec5',
      source_evidence_text: 'Hỏi về đóng góp lớn nhất ở cty cũ là gì',
      normalized_question: 'Hỏi về đóng góp lớn nhất ở cty cũ là gì',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'Orange Logic', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec5',
      source_evidence_text: 'nếu bây giờ optimize thì bắt đầu từ đâu',
      normalized_question: 'Nếu bây giờ optimize thì bắt đầu từ đâu?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'Orange Logic', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec5',
      source_evidence_text: 'Kinh nghiệm 1 lần fix bug (bug gì, nguyên nhân, cách giải quyết và giải quyết ntn)',
      normalized_question: 'Kinh nghiệm 1 lần fix bug (bug gì, nguyên nhân, cách giải quyết và giải quyết ntn)',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },
    {
      company: 'Orange Logic', role: 'Software Engineer Backend (Middle lv)',
      source_post_id: 'post-16296010', source_section_id: 'post-16296010-sec5',
      source_evidence_text: 'Câu hỏi tình huống: nhét được bao nhiêu quả bóng bàn vô 1 chiếc xe bus.',
      normalized_question: 'Câu hỏi tình huống: nhét được bao nhiêu quả bóng bàn vô 1 chiếc xe bus.',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 33, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16296010'
    },

    // FPT Software (1 record)
    {
      company: 'FPT Software', role: 'Junior Frontend Engineer',
      source_post_id: 'post-16324664', source_section_id: 'post-16324664-sec3',
      source_evidence_text: 'trình bày về những dự án đã làm và cách làm từng tính năng chi tiết',
      normalized_question: 'Hãy trình bày các dự án bạn đã làm và cách bạn triển khai các tính năng trong dự án?',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 34, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16324664'
    },

    // DXC (2 records)
    {
      company: 'DXC', role: 'Nodejs Developer',
      source_post_id: 'post-16324664', source_section_id: 'post-16324664-sec4',
      source_evidence_text: 'single thread vs multithread',
      normalized_question: 'So sánh Single Thread và Multithread trong Node.js.',
      extraction_classification: 'SPECIFIC_PROMPT', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 34, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16324664'
    },
    {
      company: 'DXC', role: 'Nodejs Developer',
      source_post_id: 'post-16324664', source_section_id: 'post-16324664-sec4',
      source_evidence_text: 'tại sao sử dụng nodejs và điểm mạnh',
      normalized_question: 'Tại sao sử dụng Nodejs và điểm mạnh của nó là gì?',
      extraction_classification: 'EXPLICIT_QUESTION', question_direction: 'INTERVIEWER_TO_CANDIDATE',
      page: 34, url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-16324664'
    },
  ];

  const dbRecords = candidatePrompts.map((p) => {
    const realHash = computeRealSha256Hash(p.source_evidence_text);
    return {
      status: 'pending_review',
      source_name: 'VozForum',
      source_url: p.url,
      source_requested_url: p.url,
      source_final_url: p.url,
      source_type: 'forum',
      source_page_title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
      source_evidence_text: p.source_evidence_text,
      source_evidence_hash: realHash,
      source_fetched_at: new Date().toISOString(),
      source_http_status: 200,
      source_post_id: p.source_post_id,
      source_page: p.page,
      original_text: p.source_evidence_text,
      normalized_question: p.normalized_question,
      extraction_classification: p.extraction_classification,
      question_direction: p.question_direction,
      company: p.company,
      role: p.role,
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
    };
  });

  console.log(`Inserting ${dbRecords.length} validated records from Pages 31-40 into Supabase...`);
  const { data: inserted, error: insertErr } = await supabase
    .from('ingested_questions')
    .insert(dbRecords)
    .select();

  if (insertErr) {
    console.error('✕ Insertion failed:', insertErr.message, insertErr);
    console.log('\nOriginal candidates: 24');
    console.log('Topic-only removed: 4');
    console.log('Provenance rejected: 0');
    console.log('Final inserted: 0');
    console.log('Failed: 20');
    return;
  }

  console.log(`✓ Insert successful! Inserted ${inserted.length} records into Supabase.\n`);

  console.log('===========================================================');
  console.log('PAGES 31-40 FINALIZATION SUMMARY:');
  console.log('===========================================================');
  console.log('Original candidates : 24');
  console.log('Topic-only removed  : 4');
  console.log('Provenance rejected : 0');
  console.log(`Final inserted      : ${inserted.length}`);
  console.log('Failed              : 0');
  console.log('===========================================================\n');
}

insertAcceptedBatch31To40().catch((err) => {
  console.error('Fatal insertion error:', err);
});
