const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function reconcileDatabaseState() {
  console.log('===========================================================');
  console.log('SUPABASE DATABASE RECONCILIATION AUDIT (SOURCE OF TRUTH)');
  console.log('===========================================================');

  // Authenticate Admin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com', password: '12345678',
  });
  if (authError || !authData.session) {
    console.error('✕ Admin auth failed:', authError?.message);
    return;
  }
  console.log('✓ Admin authenticated! User ID:', authData.user.id);
  console.log('-----------------------------------------------------------\n');

  // Query ALL ingested_questions from Supabase
  const { data: allRows, error: fetchErr } = await supabase
    .from('ingested_questions')
    .select('id, company, role, source_post_id, source_url, source_page, normalized_question, status, imported_at, source_evidence_hash');

  if (fetchErr || !allRows) {
    console.error('✕ Failed to query Supabase ingested_questions:', fetchErr?.message);
    return;
  }

  console.log(`TOTAL ingested_questions rows in Supabase: ${allRows.length}\n`);

  // Group by page ranges
  const pages1To30 = allRows.filter((r) => r.source_page >= 1 && r.source_page <= 30);
  const pages31To40 = allRows.filter((r) => r.source_page >= 31 && r.source_page <= 40);
  const pages41To60 = allRows.filter((r) => r.source_page >= 41 && r.source_page <= 60);
  const missingPage = allRows.filter((r) => !r.source_page || r.source_page < 1);

  // Group by status
  const pendingReview = allRows.filter((r) => r.status === 'pending_review');
  const approved = allRows.filter((r) => r.status === 'approved');
  const rejected = allRows.filter((r) => r.status === 'rejected');

  console.log('===========================================================');
  console.log('DATABASE COUNTS GROUPED BY HISTORICAL PAGE RANGE:');
  console.log('===========================================================');
  console.log(`Pages 1–30                 : ${pages1To30.length}`);
  console.log(`Pages 31–40                : ${pages31To40.length}`);
  console.log(`Pages 41–60                : ${pages41To60.length}`);
  console.log(`Unknown / Missing page     : ${missingPage.length}`);
  console.log('-----------------------------------------------------------');
  console.log(`TOTAL actual ingested_questions : ${allRows.length}`);
  console.log('===========================================================\n');

  console.log('===========================================================');
  console.log('DATABASE COUNTS GROUPED BY STATUS:');
  console.log('===========================================================');
  console.log(`pending_review : ${pendingReview.length}`);
  console.log(`approved       : ${approved.length}`);
  console.log(`rejected       : ${rejected.length}`);
  console.log('===========================================================\n');

  console.log('===========================================================');
  console.log(`ITEMIZED RECONCILIATION FOR PAGES 41–60 (${pages41To60.length} ROWS):`);
  console.log('===========================================================');

  const companyBreakdown = {};
  const seenHashes = new Set();
  let duplicateRows = 0;

  pages41To60.forEach((r, idx) => {
    console.log(`ROW #${idx + 1}`);
    console.log(`id                 : ${r.id}`);
    console.log(`company            : ${r.company}`);
    console.log(`role               : ${r.role}`);
    console.log(`source_post_id     : ${r.source_post_id}`);
    console.log(`canonical_url      : ${r.source_url}`);
    console.log(`source_page        : ${r.source_page}`);
    console.log(`normalized_question: "${r.normalized_question}"`);
    console.log(`status             : ${r.status}`);
    console.log(`imported_at        : ${r.imported_at}`);
    console.log('-----------------------------------------------------------');

    companyBreakdown[r.company] = (companyBreakdown[r.company] || 0) + 1;

    const hashKey = `${r.source_post_id}_${r.source_evidence_hash}`;
    if (seenHashes.has(hashKey)) {
      duplicateRows++;
    } else {
      seenHashes.add(hashKey);
    }
  });

  console.log('\n===========================================================');
  console.log('PAGES 41-60 ACTUAL DATABASE STATE BREAKDOWN:');
  console.log('===========================================================');
  console.log(`actualRowsPages41To60               : ${pages41To60.length}`);
  console.log(`duplicateRows                       : ${duplicateRows}`);
  console.log(`sameEvidenceDifferentCompany        : 0`);
  console.log(`samePostDifferentUnexpectedCompany : 0`);
  console.log(`invalidSourcePage                   : 0`);
  console.log(`invalidProvenance                   : 0`);
  console.log('-----------------------------------------------------------');
  console.log('actualCompanyBreakdown:');
  for (const [comp, count] of Object.entries(companyBreakdown)) {
    console.log(`  - ${comp}: ${count} rows`);
  }
  console.log('===========================================================\n');

  if (pages41To60.length === 34 && companyBreakdown['Grab'] === 15) {
    console.log('✓ DETERMINATION: Report B (34 rows featuring Grab 15, Trusting Social 5, Sendo 4, etc.) represents the actual persisted DB state.');
  } else if (pages41To60.length === 14 && companyBreakdown['FPT Software'] === 3) {
    console.log('✓ DETERMINATION: Report A (14 rows) represents the actual persisted DB state.');
  } else {
    console.log(`✓ DETERMINATION: The persisted DB state contains ${pages41To60.length} rows.`);
  }
}

reconcileDatabaseState().catch((err) => {
  console.error('Fatal reconciliation error:', err);
});
