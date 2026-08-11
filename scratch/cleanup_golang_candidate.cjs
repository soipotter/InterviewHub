const { createClient } = require('@supabase/supabase-js');
const url = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const key = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(url, key);

async function main() {
  console.log('Authenticating Admin...');
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  console.log('Updating Golang Candidate ingest-355b69bea4554ab7b3ac462ba0fa36a5 to status = approved, published_question_id = null...');
  const { error } = await supabase
    .from('ingested_questions')
    .update({
      status: 'approved',
      published_question_id: null
    })
    .eq('id', 'ingest-355b69bea4554ab7b3ac462ba0fa36a5');

  console.log('Golang candidate update status:', error ? error.message : 'SUCCESS');

  const { data: updated } = await supabase
    .from('ingested_questions')
    .select('id, status, published_question_id, source_classification, question_format')
    .eq('id', 'ingest-355b69bea4554ab7b3ac462ba0fa36a5')
    .single();

  console.log('Verified Golang Candidate Record:', updated);
}

main().catch(console.error);
