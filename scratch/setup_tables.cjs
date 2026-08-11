const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTables() {
  console.log('Authenticating Admin...');
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com', password: '12345678',
  });
  console.log('Admin authenticated:', authData?.user?.id);

  // Check if ingestion_sources exists by querying it
  const { data, error } = await supabase.from('ingestion_sources').select('id').limit(1);
  if (error) {
    console.log('ingestion_sources table query result:', error.message);
  } else {
    console.log('✓ Table public.ingestion_sources exists! Row count:', data.length);
  }
}

setupTables();
