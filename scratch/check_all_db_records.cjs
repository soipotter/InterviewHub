const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllDbRecords() {
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com',
    password: '12345678',
  });

  const { data, error } = await supabase
    .from('ingested_questions')
    .select('id, company, role, normalized_question, source_post_id, status');

  console.log('Database Error:', error);
  console.log(`Total Ingested Questions in DB: ${data ? data.length : 0}`);
  if (data && data.length > 0) {
    data.forEach((r, idx) => {
      console.log(`#${idx + 1}: ${r.id} | ${r.company} | ${r.role} | ${r.source_post_id} | ${r.status}`);
    });
  }
}

checkAllDbRecords();
