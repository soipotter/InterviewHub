const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fullAudit() {
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  // Get ALL community questions (pending + approved)
  const { data: allComm } = await supabase
    .from('community_questions')
    .select('id, title, status, published_question_id, created_at')
    .order('created_at', { ascending: false });

  console.log('=== ALL COMMUNITY QUESTIONS ===');
  for (const row of (allComm || [])) {
    console.log(`\nID: ${row.id}`);
    console.log(`  Title: ${row.title?.slice(0, 60)}`);
    console.log(`  Status: ${row.status}`);
    console.log(`  PublishedQuestionId: ${row.published_question_id}`);
    console.log(`  ID starts with 'comm-': ${row.id?.startsWith('comm-')}`);
    
    if (row.status === 'approved' && row.published_question_id) {
      // Simulate what the link would be
      const linkUsingId = `/questions/${row.id}`;
      const linkUsingPublishedId = `/questions/${row.published_question_id}`;
      console.log(`  Link using .id: ${linkUsingId}`);
      console.log(`  Link using .published_question_id: ${linkUsingPublishedId}`);
      
      // Test which one works
      const { data: byId } = await supabase.from('questions').select('id').eq('status', 'published').or(`id.eq.${row.id},slug.eq.${row.id}`).maybeSingle();
      const { data: byPubId } = await supabase.from('questions').select('id').eq('status', 'published').or(`id.eq.${row.published_question_id},slug.eq.${row.published_question_id}`).maybeSingle();
      
      console.log(`  Link using .id works: ${byId ? 'YES' : 'NO - BROKEN!'}`);
      console.log(`  Link using .published_question_id works: ${byPubId ? 'YES' : 'NO - BROKEN!'}`);
    }
  }
}

fullAudit().catch(err => console.error(err));
