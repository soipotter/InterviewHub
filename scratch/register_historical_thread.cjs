const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function registerHistoricalThread() {
  console.log('Authenticating Admin gamecuasoine@gmail.com...');
  const { data: authData } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com', password: '12345678',
  });
  console.log('✓ Admin authenticated! User ID:', authData?.user?.id);

  const historicalRecord = {
    source_type: 'voz',
    source_name: 'Voz Forum - IT Company Interview Review',
    canonical_url: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/',
    thread_id: '206897',
    title: 'thảo luận - [Review Phỏng Vấn] Các công ty CNTT | VOZ',
    status: 'processed',
    is_active: true,
    historical_complete: true,
    last_processed_page: 102,
    questions_collected_count: 88,
    discovery_method: 'historical_seed',
    last_checked_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('ingestion_sources')
    .upsert(historicalRecord, { onConflict: 'source_type,canonical_url' })
    .select();

  if (error) {
    console.error('✕ Failed to register historical thread:', error.message);
  } else {
    console.log('✓ Historical thread 206897 registered successfully in ingestion_sources:', data[0]);
  }
}

registerHistoricalThread();
