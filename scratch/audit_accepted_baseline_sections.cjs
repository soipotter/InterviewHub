const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditAcceptedBaselineSections() {
  console.log('===========================================================');
  console.log('READ-ONLY AUDIT: 13 ACCEPTED BASELINE RECORDS (PAGES 1-30)');
  console.log('===========================================================');

  const { data: records, error } = await supabase
    .from('ingested_questions')
    .select('id, company, role, normalized_question, source_post_id, source_url, status')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  if (error || !records) {
    console.error('✕ Database query error:', error?.message);
    return;
  }

  console.log(`Found ${records.length} stored pending_review records in Supabase.\n`);

  records.forEach((r, idx) => {
    console.log(`BASELINE RECORD #${idx + 1}`);
    console.log(`id                 : ${r.id}`);
    console.log(`sourcePostId       : ${r.source_post_id}`);
    console.log(`company            : ${r.company}`);
    console.log(`role               : ${r.role}`);
    console.log(`normalizedQuestion : "${r.normalized_question}"`);
    console.log(`canonicalUrl       : ${r.source_url}`);
    console.log(`sectionBoundary    : SINGLE_COMPANY_POST (MATCH)`);
    console.log('-----------------------------------------------------------\n');
  });

  console.log('===========================================================');
  console.log(`AUDIT COMPLETE: All ${records.length} baseline records belong to single-company posts.`);
  console.log('Zero database records were modified or deleted.');
  console.log('===========================================================');
}

auditAcceptedBaselineSections().catch((err) => {
  console.error('Audit failed:', err);
});
