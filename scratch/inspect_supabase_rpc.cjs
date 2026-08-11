const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });
  const { data, error } = await supabase.from('ingested_questions').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('Sample ingested_questions columns:', Object.keys(data[0]));
  } else {
    console.log('ingested_questions count query error:', error?.message);
  }
}

inspectSchema();
