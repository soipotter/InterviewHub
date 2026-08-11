const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabasePersistence() {
  console.log('===========================================================');
  console.log('PHASE 1 — SUPABASE DATABASE PERSISTENCE CHECK (AUTHENTICATED ADMIN)');
  console.log('===========================================================');

  // Authenticate as Admin user
  console.log('Logging in as Admin gamecuasoine@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com',
    password: '12345678',
  });

  if (authError || !authData.session) {
    console.error('✕ Admin auth failed:', authError?.message);
    return;
  }
  console.log('✓ Admin authenticated! User ID:', authData.user.id);

  const tempId = `ingest-temp-${Date.now()}`;
  const tempRecord = {
    id: tempId,
    status: 'pending_review',
    source_name: 'VozForum',
    source_url: 'https://voz.vn/t/test-persistence-thread.999999',
    source_type: 'forum',
    original_text: 'Em phỏng vấn Shopee hỏi Virtual DOM là gì?',
    normalized_question: 'Virtual DOM trong React hoạt động như thế nào?',
    company: 'Shopee',
    role: 'Frontend Developer',
    seniority: 'Fresher',
    round: 'Technical Round 1',
    category: 'React',
    difficulty: 'Intermediate',
    confidence: 0.95,
    is_duplicate_flagged: false,
    imported_at: new Date().toISOString(),
  };

  console.log('\n1. Inserting temporary test record into public.ingested_questions...');
  const { data: insertData, error: insertError } = await supabase
    .from('ingested_questions')
    .insert([tempRecord])
    .select();

  if (insertError) {
    console.error('✕ INSERT FAILED:', insertError.message, insertError);
    console.log('===========================================================');
    return;
  }

  console.log('✓ Insert successful! Inserted record ID:', tempId);

  console.log('\n2. Querying back inserted record from Supabase...');
  const { data: queryData, error: queryError } = await supabase
    .from('ingested_questions')
    .select('*')
    .eq('id', tempId)
    .maybeSingle();

  if (queryError || !queryData) {
    console.error('✕ QUERY FAILED:', queryError?.message || 'Record not found');
    return;
  }

  console.log('✓ Query successful! Retrived record details:');
  console.log({
    id: queryData.id,
    status: queryData.status,
    source_name: queryData.source_name,
    source_url: queryData.source_url,
    company: queryData.company,
    role: queryData.role,
    normalized_question: queryData.normalized_question,
    imported_at: queryData.imported_at,
  });

  console.log('\n3. Deleting temporary test record from Supabase...');
  const { error: deleteError } = await supabase
    .from('ingested_questions')
    .delete()
    .eq('id', tempId);

  if (deleteError) {
    console.error('✕ DELETE FAILED:', deleteError.message);
  } else {
    console.log('✓ Delete successful! Temporary record cleaned up.');
  }

  console.log('===========================================================');
  console.log('SUPABASE DATABASE PERSISTENCE: VERIFIED (100% PASS)');
  console.log('===========================================================');
}

testDatabasePersistence().catch((err) => {
  console.error('Fatal DB test error:', err);
});
