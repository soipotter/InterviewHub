const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function auditBug() {
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  // 1. Get all approved community questions
  const { data: commRows } = await supabase
    .from('community_questions')
    .select('id, title, status, published_question_id')
    .eq('status', 'approved');

  console.log('=== APPROVED COMMUNITY QUESTIONS ===');
  for (const row of (commRows || [])) {
    console.log(`\nCOMM_ID: ${row.id}`);
    console.log(`PUBLISHED_QUESTION_ID: ${row.published_question_id}`);

    // 2. Check if public.questions row exists with the published_question_id
    const { data: pubRow, error: pubErr } = await supabase
      .from('questions')
      .select('id, title, status, slug')
      .eq('id', row.published_question_id)
      .single();

    if (pubErr || !pubRow) {
      console.log('PUBLIC_QUESTION_EXISTS: FALSE ← BROKEN LINKAGE!');
      console.log(`Error: ${pubErr?.message}`);

      // Try with the community ID directly
      const communityIdAsQId = 'comm-' + row.id.replace(/-/g, '');
      const { data: altRow } = await supabase
        .from('questions')
        .select('id, title')
        .eq('id', communityIdAsQId)
        .single();
      console.log(`Try with comm-${row.id.replace(/-/g,'')}:`, altRow ? 'EXISTS' : 'MISSING');
    } else {
      console.log('PUBLIC_QUESTION_EXISTS: TRUE');
      console.log(`PUBLIC_QUESTION_ID: ${pubRow.id}`);
      console.log(`PUBLIC_QUESTION_TITLE: ${pubRow.title}`);
      console.log(`PUBLIC_QUESTION_STATUS: ${pubRow.status}`);
      console.log(`PUBLIC_QUESTION_SLUG: ${pubRow.slug}`);
    }

    // 3. The correct URL that should be used
    const correctUrl = `/questions/${row.published_question_id}`;
    // 4. The broken URL that was being generated
    const brokenUrl = `/questions/comm-${row.id}`;
    console.log(`CORRECT_URL: ${correctUrl}`);
    console.log(`BROKEN_URL:  ${brokenUrl}`);
    console.log(`URLS_MATCH: ${correctUrl === brokenUrl}`);
  }

  // 5. Simulate questionService.getQuestionById with the BROKEN id
  console.log('\n=== SIMULATING getQuestionById with BROKEN URL param ===');
  const brokenParam = 'comm-9b6ae7fd-7613-4b69-80c7-beb54f31316d'; // with dashes
  const { data: fetchByBroken } = await supabase
    .from('questions')
    .select('id, title')
    .eq('status', 'published')
    .or(`id.eq.${brokenParam},slug.eq.${brokenParam}`)
    .maybeSingle();
  console.log(`Query with broken ID "${brokenParam}" returns:`, fetchByBroken ? fetchByBroken.id : 'NULL (Question Not Found!)');

  const correctParam = 'comm-9b6ae7fd76134b6980c7beb54f31316d'; // no dashes
  const { data: fetchByCorrect } = await supabase
    .from('questions')
    .select('id, title')
    .eq('status', 'published')
    .or(`id.eq.${correctParam},slug.eq.${correctParam}`)
    .maybeSingle();
  console.log(`Query with correct ID "${correctParam}" returns:`, fetchByCorrect ? fetchByCorrect.id : 'NULL');
}

auditBug().catch(err => console.error(err));
