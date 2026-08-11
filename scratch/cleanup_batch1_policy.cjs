const { createClient } = require('@supabase/supabase-js');
const url = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const key = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(url, key);

async function main() {
  console.log('Authenticating Admin...');
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  // 1. Mark duplicate candidate as REJECTED with reason 'semantic_duplicate'
  console.log('1. Rejecting duplicate ingest-1954d802df124bf8a7487a54ff99e672...');
  const { error: err1 } = await supabase
    .from('ingested_questions')
    .update({ status: 'rejected', rejection_reason: 'semantic_duplicate: duplicate of q-wf-01' })
    .eq('id', 'ingest-1954d802df124bf8a7487a54ff99e672');
  console.log('Duplicate update status:', err1 ? err1.message : 'SUCCESS');

  // 2. Mark HR background question as REJECTED with reason 'out_of_scope'
  console.log('2. Rejecting HR background question ingest-dcfd997e59d246c88aa14d850ebd300c...');
  const { error: err2 } = await supabase
    .from('ingested_questions')
    .update({ status: 'rejected', rejection_reason: 'out_of_scope: personal HR background question' })
    .eq('id', 'ingest-dcfd997e59d246c88aa14d850ebd300c');
  console.log('HR question update status:', err2 ? err2.message : 'SUCCESS');

  // 3. Update VinBrain classification to authoritative 'question_with_context'
  console.log('3. Updating VinBrain ingest-19d8c702daf64b56b478af78d8074ca8 source_classification to question_with_context...');
  const { error: err3 } = await supabase
    .from('ingested_questions')
    .update({ source_classification: 'question_with_context' })
    .eq('id', 'ingest-19d8c702daf64b56b478af78d8074ca8');
  console.log('VinBrain update status:', err3 ? err3.message : 'SUCCESS');

  // Verify final Batch 1 candidate statuses
  const batch1Ids = [
    'ingest-02f91f9c15724126ab085e2a748343cc',
    'ingest-1954d802df124bf8a7487a54ff99e672',
    'ingest-19d8c702daf64b56b478af78d8074ca8',
    'ingest-dcfd997e59d246c88aa14d850ebd300c',
    'ingest-236abbdefb5b4f8babe1ffc13b218846',
    'ingest-3be6570dd29443dfbdf6d7ff696f5b84',
    'ingest-6b63951277184ed08cd2012f5477b89b',
    'ingest-9c753fbef0f54704b3dabfadd63d4652',
    'ingest-96f5074e2d0d4806ac1a97990804357f',
    'ingest-4151ccc50f0d4073a7ba601393f65974'
  ];

  const { data: rows } = await supabase.from('ingested_questions').select('id, status, rejection_reason, source_classification').in('id', batch1Ids);
  console.log('\n=== FINAL BATCH 1 DB STATUSES ===');
  const counts = { approved: 0, rejected: 0, pending_review: 0 };
  rows.forEach(r => {
    counts[r.status] = (counts[r.status] || 0) + 1;
    console.log(r.id, '| Status:', r.status, '| Classification:', r.source_classification, '| Reason:', r.rejection_reason || 'N/A');
  });

  console.log('\nCOUNTS:', counts);
}

main().catch(console.error);
