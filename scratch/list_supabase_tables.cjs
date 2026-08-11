const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  const tables = ['ingested_questions', 'questions', 'comments', 'user_profiles', 'bookmarks', 'user_progress', 'question_reviews', 'ingestion_sources', 'ingestion_runs'];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('count', { count: 'exact', head: true });
    if (error) {
      console.log(`Table '${t}': NOT AVAILABLE (${error.message})`);
    } else {
      console.log(`Table '${t}': AVAILABLE (Rows: ${data || 0})`);
    }
  }
}

listTables();
