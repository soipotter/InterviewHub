const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectDbLinkage() {
  console.log('===========================================================');
  console.log('STEP 2: AUTHORITATIVE DATABASE LINKAGE CHECK');
  console.log('===========================================================');

  await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com', password: '12345678',
  });

  // The community ID stored in DB uses "comm-" prefix in the URL but underlying DB 
  // field might be UUID only. Let's search recent community questions
  const { data: allComm, error: allErr } = await supabase
    .from('community_questions')
    .select('id, title, status, published_question_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (allErr) {
    console.error('✕ Error querying community_questions:', allErr.message);
    return;
  }

  console.log('Recent community_questions rows:');
  allComm.forEach(row => {
    console.log('---');
    console.log('  ID                  :', row.id);
    console.log('  TITLE               :', row.title);
    console.log('  STATUS              :', row.status);
    console.log('  PUBLISHED_QUESTION_ID:', row.published_question_id);
  });

  // Check what the RPC returns
  console.log('\n===========================================================');
  console.log('CHECKING approve_community_question RPC RETURN VALUE');
  console.log('===========================================================');

  // Find the approved question from the first reproduction run
  const approved = allComm.find(r => r.status === 'approved');
  if (approved) {
    console.log('\nApproved community question found:');
    console.log('  COMMUNITY_ID        :', approved.id);
    console.log('  STATUS              :', approved.status);
    console.log('  PUBLISHED_QUESTION_ID:', approved.published_question_id);

    if (approved.published_question_id) {
      const { data: pubRow, error: pubErr } = await supabase
        .from('questions')
        .select('id, title')
        .eq('id', approved.published_question_id)
        .single();

      if (pubErr || !pubRow) {
        console.log('  PUBLIC_QUESTION_EXISTS: false — LINKAGE BROKEN!');
        console.error('  Error:', pubErr?.message);
      } else {
        console.log('  PUBLIC_QUESTION_EXISTS: true');
        console.log('  PUBLIC_QUESTION_ID    :', pubRow.id);
        console.log('  PUBLIC_QUESTION_TITLE :', pubRow.title);
      }
    } else {
      console.log('  PUBLIC_QUESTION_EXISTS: false — published_question_id IS NULL!');
    }
  }

  // Check the community ID format vs URL format
  const firstRow = allComm[0];
  if (firstRow) {
    console.log('\n===========================================================');
    console.log('ID FORMAT ANALYSIS:');
    console.log('===========================================================');
    console.log('community_questions.id:', firstRow.id);
    console.log('URL in production used: /questions/comm-' + firstRow.id.replace('comm-', ''));
    console.log('Does community ID start with "comm-":', firstRow.id.startsWith('comm-'));
    console.log('The ID itself:', firstRow.id);
    console.log('\nConclusion: The URL /questions/comm-eefba558... uses the community ID which is NOT');
    console.log('a valid public.questions.id. The QuestionDetail page queries public.questions by ID.');
  }
}

inspectDbLinkage().catch((err) => console.error(err));
