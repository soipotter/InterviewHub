const { createClient } = require('@supabase/supabase-js');
const url = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const key = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(url, key);

async function main() {
  console.log('Authenticating Admin...');
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  // 1. Candidate 1 (VNPay Java - Kafka)
  console.log('Publishing Candidate 1: ingest-02f91f9c15724126ab085e2a748343cc...');
  const { data: res1, error: err1 } = await supabase.rpc('approve_ingested_question', {
    p_ingested_id: 'ingest-02f91f9c15724126ab085e2a748343cc',
    p_normalized_question: 'Kafka giải quyết bài toán gì trong kiến trúc hệ thống?',
    p_company: 'VNPay',
    p_role: 'Software Engineer (Java)',
    p_category: 'Web Fundamentals',
    p_difficulty: 'Intermediate'
  });
  console.log('Candidate 1 Result:', res1 || err1);

  // 2. Candidate 3 (VinBrain - Network Arch Scenario)
  console.log('Publishing Candidate 3: ingest-19d8c702daf64b56b478af78d8074ca8...');
  const { data: res3, error: err3 } = await supabase.rpc('approve_ingested_question', {
    p_ingested_id: 'ingest-19d8c702daf64b56b478af78d8074ca8',
    p_normalized_question: 'Giải thích một kiến trúc mạng máy tính và phân tích ưu, nhược điểm của kiến trúc đó.',
    p_company: 'VinBrain',
    p_role: 'Applied Science Intern',
    p_category: 'Web Fundamentals',
    p_difficulty: 'Beginner'
  });
  console.log('Candidate 3 Result:', res3 || err3);

  // 3. Candidate 6 (Splus Software - React Class vs Function)
  console.log('Publishing Candidate 6: ingest-3be6570dd29443dfbdf6d7ff696f5b84...');
  const { data: res6, error: err6 } = await supabase.rpc('approve_ingested_question', {
    p_ingested_id: 'ingest-3be6570dd29443dfbdf6d7ff696f5b84',
    p_normalized_question: 'Phân biệt Class Component và Function Component trong React.',
    p_company: 'Splus Software Vietnam',
    p_role: 'Fresher ReactJS Developer',
    p_category: 'React',
    p_difficulty: 'Beginner'
  });
  console.log('Candidate 6 Result:', res6 || err6);

  // Update status for rejected items
  const rejectedIds = [
    'ingest-236abbdefb5b4f8babe1ffc13b218846',
    'ingest-6b63951277184ed08cd2012f5477b89b',
    'ingest-9c753fbef0f54704b3dabfadd63d4652',
    'ingest-96f5074e2d0d4806ac1a97990804357f',
    'ingest-4151ccc50f0d4073a7ba601393f65974'
  ];

  console.log('Updating status for 5 rejected candidates...');
  for (const id of rejectedIds) {
    await supabase.from('ingested_questions').update({ status: 'rejected', rejection_reason: 'Non-technical HR or insufficient evidence' }).eq('id', id);
  }
  console.log('Rejected candidates updated!');
}

main().catch(console.error);
