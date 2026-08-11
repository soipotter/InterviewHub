const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const sql = fs.readFileSync('supabase/migrations/20260811000027_create_ingestion_sources_and_runs.sql', 'utf8');

  console.log('Authenticating Admin...');
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  // Try RPC exec_sql or query pg_meta
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.log('RPC exec_sql error:', error.message);
  } else {
    console.log('✓ Migration applied successfully via exec_sql!');
  }
}

applyMigration();
