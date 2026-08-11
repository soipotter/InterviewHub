const { createClient } = require('@supabase/supabase-js');
const url = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const key = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(url, key);

async function main() {
  console.log('Authenticating Admin...');
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  // 1. Candidate 1 (Netcompany Toll System Design)
  console.log('Publishing Candidate 1: ingest-56fb09f4299941dcb1144078f4471b11...');
  const { data: res1, error: err1 } = await supabase.rpc('approve_ingested_question', {
    p_ingested_id: 'ingest-56fb09f4299941dcb1144078f4471b11',
    p_normalized_question: 'Hãy thiết kế hệ thống tính phí tự động khi phương tiện đi qua cầu (Toll Collection System).',
    p_company: 'Netcompany',
    p_role: 'IT Consultant',
    p_category: 'Web Fundamentals',
    p_difficulty: 'Intermediate'
  });
  console.log('Candidate 1 Result:', res1 || err1);

  // 2. Candidate 4 (AxonActive Java 8 New Features)
  console.log('Publishing Candidate 4: ingest-e496b1fd34954e2098c408ff24303ba6...');
  const { data: res4, error: err4 } = await supabase.rpc('approve_ingested_question', {
    p_ingested_id: 'ingest-e496b1fd34954e2098c408ff24303ba6',
    p_normalized_question: 'Java 8 có những tính năng mới nổi bật nào (Stream API, Date-Time API, Lambda Expressions)?',
    p_company: 'AxonActive',
    p_role: 'Software Engineer Backend',
    p_category: 'Web Fundamentals',
    p_difficulty: 'Intermediate'
  });
  console.log('Candidate 4 Result:', res4 || err4);

  // 3. Candidate 6 (AxonActive Java Code Review & Optimization)
  console.log('Publishing Candidate 6: ingest-3116f329d8954520a5d0d2bc3377a044...');
  const { data: res6, error: err6 } = await supabase.rpc('approve_ingested_question', {
    p_ingested_id: 'ingest-3116f329d8954520a5d0d2bc3377a044',
    p_normalized_question: 'Phương pháp giải thích và quy trình đề xuất tối ưu hóa (Optimization) khi review một đoạn code Java với đồng nghiệp.',
    p_company: 'AxonActive',
    p_role: 'Software Engineer Backend',
    p_category: 'Web Fundamentals',
    p_difficulty: 'Intermediate'
  });
  console.log('Candidate 6 Result:', res6 || err6);

  // 4. Candidate 8 (AxonActive Exception Handling Best Practices)
  console.log('Publishing Candidate 8: ingest-ea41c7e23bb142e8af2e44469431cabb...');
  const { data: res8, error: err8 } = await supabase.rpc('approve_ingested_question', {
    p_ingested_id: 'ingest-ea41c7e23bb142e8af2e44469431cabb',
    p_normalized_question: 'Cần lưu ý những gì khi thực hiện Exception Handling trong ứng dụng Java Backend?',
    p_company: 'AxonActive',
    p_role: 'Software Engineer Backend',
    p_category: 'Web Fundamentals',
    p_difficulty: 'Intermediate'
  });
  console.log('Candidate 8 Result:', res8 || err8);

  // 5. Candidate 9 (OneMount Session Storage System Design)
  console.log('Publishing Candidate 9: ingest-1aec06ffffcd4598b75dfe5aa06df5aa...');
  const { data: res9, error: err9 } = await supabase.rpc('approve_ingested_question', {
    p_ingested_id: 'ingest-1aec06ffffcd4598b75dfe5aa06df5aa',
    p_normalized_question: 'Khi thiết kế hệ thống quản lý Session đăng nhập (User Session Management), cần lưu ý những khía cạnh nào?',
    p_company: 'OneMount',
    p_role: 'Software Engineer Backend',
    p_category: 'Web Fundamentals',
    p_difficulty: 'Intermediate'
  });
  console.log('Candidate 9 Result:', res9 || err9);

  // Update status for rejected items
  const rejectedItems = [
    { id: 'ingest-75f9a500e49a446f95a8970db9e9509d', reason: 'insufficient_evidence: generic resume walkthrough phrase' },
    { id: 'ingest-d53cab7972a24c368ef0add8b4e5a54b', reason: 'insufficient_evidence: vague generic phrase' },
    { id: 'ingest-17ffc0c7fc6745138e5c120c34e67b92', reason: 'out_of_scope: personal philosophy question' },
    { id: 'ingest-531da0e033a541aba63589a338f2b523', reason: 'out_of_scope: personal life preference question' }
  ];

  console.log('Updating status for 4 rejected candidates...');
  for (const item of rejectedItems) {
    await supabase.from('ingested_questions').update({ status: 'rejected', rejection_reason: item.reason }).eq('id', item.id);
  }
  console.log('Rejected candidates updated!');
}

main().catch(console.error);
