const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function purgeBatch1To10() {
  console.log('===========================================================');
  console.log('PHASE 1 — QUARANTINE & PURGE PAGES 1-10 BATCH FROM SUPABASE');
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

  // 1. Fetch current records in public.ingested_questions
  const { data: currentRecords, error: fetchErr } = await supabase
    .from('ingested_questions')
    .select('id, normalized_question, company, source_url, created_at');

  if (fetchErr) {
    console.error('✕ Error querying ingested_questions:', fetchErr.message);
    return;
  }

  if (!currentRecords || currentRecords.length === 0) {
    console.log('✓ No records found in public.ingested_questions to purge.');
    return;
  }

  console.log(`Found ${currentRecords.length} records in public.ingested_questions to purge:\n`);
  currentRecords.forEach((r, idx) => {
    console.log(`${idx + 1}. [ID: ${r.id}] Company: ${r.company} | Q: "${r.normalized_question}" | URL: ${r.source_url}`);
  });

  // Delete all records from this batch
  const idsToDelete = currentRecords.map((r) => r.id);
  console.log(`\nDeleting ${idsToDelete.length} records from public.ingested_questions...`);

  const { error: delErr } = await supabase
    .from('ingested_questions')
    .delete()
    .in('id', idsToDelete);

  if (delErr) {
    console.error('✕ Error deleting batch records:', delErr.message);
  } else {
    console.log(`✓ Successfully purged ${idsToDelete.length} records from public.ingested_questions.`);
  }

  console.log('===========================================================');
  console.log('QUARANTINE PURGE COMPLETE (100% CLEAN)');
  console.log('===========================================================');
}

purgeBatch1To10().catch((err) => {
  console.error('Fatal purge error:', err);
});
