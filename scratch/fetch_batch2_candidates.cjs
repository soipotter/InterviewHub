const { createClient } = require('@supabase/supabase-js');
const url = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const key = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(url, key);

async function main() {
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  const { data: candidates, error } = await supabase
    .from('ingested_questions')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) {
    console.error('Error fetching candidates:', error);
    return;
  }

  console.log(`Fetched ${candidates.length} next candidate rows for Batch 2 review:\n`);
  candidates.forEach((c, idx) => {
    console.log(`=== BATCH 2 CANDIDATE ${idx + 1} ===`);
    console.log('ID:', c.id);
    console.log('Company:', c.company, '| Role:', c.role, '| Seniority:', c.seniority, '| Category:', c.category);
    console.log('Original Text:', c.original_text);
    console.log('Normalized Question:', c.normalized_question);
    console.log('Source URL:', c.source_url);
    console.log('Source Post ID:', c.source_post_id);
    console.log('Extraction Classification:', c.extraction_classification);
    console.log('');
  });
}

main().catch(console.error);
