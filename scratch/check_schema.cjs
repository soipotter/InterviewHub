const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  await supabase.auth.signInWithPassword({ email: 'gamecuasoine@gmail.com', password: '12345678' });

  // Test direct ID query
  const testId = 'comm-9b6ae7fd76134b6980c7beb54f31316d';

  console.log('=== Testing various query patterns ===\n');

  // Pattern 1: direct .eq('id', ...) 
  const { data: d1, error: e1 } = await supabase.from('questions').select('id').eq('id', testId).maybeSingle();
  console.log(`Pattern 1 .eq('id', "${testId}"): ${d1 ? 'FOUND' : 'NOT FOUND'} ${e1 ? '| Error: ' + e1.message : ''}`);

  // Pattern 2: .or() with id and slug
  const { data: d2, error: e2 } = await supabase.from('questions').select('id').eq('status', 'published').or(`id.eq.${testId},slug.eq.${testId}`).maybeSingle();
  console.log(`Pattern 2 .or() filter: ${d2 ? 'FOUND' : 'NOT FOUND'} ${e2 ? '| Error: ' + e2.message : ''}`);

  // Pattern 3: Check what type 'id' column is by inserting a non-UUID and seeing error
  const { data: d3, error: e3 } = await supabase.from('questions').select('id').limit(1).single();
  console.log(`Pattern 3 first question id: ${d3?.id}`);

  // Pattern 4: Try the broken ID with dashes
  const brokenId = 'comm-9b6ae7fd-7613-4b69-80c7-beb54f31316d';
  const { data: d4, error: e4 } = await supabase.from('questions').select('id').eq('status', 'published').or(`id.eq.${brokenId},slug.eq.${brokenId}`).maybeSingle();
  console.log(`Pattern 4 .or() with broken dashes: ${d4 ? 'FOUND' : 'NOT FOUND'} ${e4 ? '| Error: ' + e4.message : ''}`);

  // Pattern 5: Check slug-based query
  const testSlug = 'comm-choose-right-syntax-about-push-in-git-9b6ae7fd';
  const { data: d5 } = await supabase.from('questions').select('id, slug').eq('slug', testSlug).maybeSingle();
  console.log(`Pattern 5 slug query: ${d5 ? 'FOUND id=' + d5.id : 'NOT FOUND'}`);

  // Pattern 6: Does the .or() filter have issues with the comm- prefix?
  // Check: does or(`id.eq.comm-9b6ae7fd76134b6980c7beb54f31316d`) get parsed correctly?
  const { data: d6, error: e6 } = await supabase.from('questions').select('id').or(`id.eq.${testId}`).limit(1).maybeSingle();
  console.log(`Pattern 6 or() id-only: ${d6 ? 'FOUND' : 'NOT FOUND'} ${e6 ? '| Error: ' + e6.message : ''}`);
}

checkSchema().catch(err => console.error(err));
