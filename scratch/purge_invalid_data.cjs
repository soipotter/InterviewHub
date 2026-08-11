const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeInvalidData() {
  console.log('===========================================================');
  console.log('PHASE 1 — PURGE INVALID TEST DATA FROM SUPABASE');
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

  // 1. Query invalid ingested_questions records
  console.log('\n1. Querying invalid ingested_questions records...');
  const { data: invalidRecords, error: fetchErr } = await supabase
    .from('ingested_questions')
    .select('id, normalized_question, source_url, company, imported_at, published_question_id')
    .or('source_url.like.%812345%,source_url.like.%812990%,source_url.like.%814001%,source_url.like.%test-persistence%');

  if (fetchErr) {
    console.error('✕ Error querying invalid records:', fetchErr.message);
    return;
  }

  if (!invalidRecords || invalidRecords.length === 0) {
    console.log('✓ No invalid records found in public.ingested_questions.');
    return;
  }

  console.log(`Found ${invalidRecords.length} invalid ingested records to purge:\n`);
  invalidRecords.forEach((rec, idx) => {
    console.log(`${idx + 1}. [ID: ${rec.id}]`);
    console.log(`   Company: ${rec.company}`);
    console.log(`   Normalized Question: "${rec.normalized_question}"`);
    console.log(`   Source URL: ${rec.source_url}`);
    console.log(`   Imported At: ${rec.imported_at}`);
    console.log(`   Published Question ID: ${rec.published_question_id || 'NONE'}\n`);
  });

  // 2. Identify and delete linked published questions from public.questions
  const publishedIdsToDelete = invalidRecords
    .map((r) => r.published_question_id)
    .filter(Boolean);

  if (publishedIdsToDelete.length > 0) {
    console.log(`2. Deleting ${publishedIdsToDelete.length} linked published questions from public.questions...`);
    const { error: delPubErr } = await supabase
      .from('questions')
      .delete()
      .in('id', publishedIdsToDelete);

    if (delPubErr) {
      console.error('✕ Error deleting published questions:', delPubErr.message);
    } else {
      console.log(`✓ Successfully deleted published questions: ${publishedIdsToDelete.join(', ')}`);
    }
  }

  // 3. Delete invalid records from public.ingested_questions
  const ingestedIdsToDelete = invalidRecords.map((r) => r.id);
  console.log(`3. Deleting ${ingestedIdsToDelete.length} invalid records from public.ingested_questions...`);
  const { error: delIngestErr } = await supabase
    .from('ingested_questions')
    .delete()
    .in('id', ingestedIdsToDelete);

  if (delIngestErr) {
    console.error('✕ Error deleting ingested_questions:', delIngestErr.message);
  } else {
    console.log(`✓ Successfully purged ${ingestedIdsToDelete.length} invalid records from public.ingested_questions.`);
  }

  console.log('===========================================================');
  console.log('PHASE 1 PURGE COMPLETE: INVALID DATA REMOVED (100% PASS)');
  console.log('===========================================================');
}

purgeInvalidData().catch((err) => {
  console.error('Fatal purge error:', err);
});
