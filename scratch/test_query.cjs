const { createClient } = require('@supabase/supabase-js');
const url = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const key = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(url, key);

async function testBugBeforeFix() {
  const idOrSlug = 'comm-0c0fa6d6fde9454d9c0773234046781f';

  // Old buggy logic:
  // if (idOrSlug.startsWith('q-')) { query.eq('id', idOrSlug) } else { query.eq('slug', idOrSlug) }
  let queryOld = supabase.from('questions').select('*, categories(*)').eq('status', 'published');
  if (idOrSlug.startsWith('q-')) {
    queryOld = queryOld.eq('id', idOrSlug);
  } else {
    queryOld = queryOld.eq('slug', idOrSlug); // BUG! Searching slug for 'comm-0c0fa6d6fde9454d9c0773234046781f'
  }
  const { data: dataOld } = await queryOld.maybeSingle();

  console.log('=== OLD LOGIC RESULT ===');
  console.log('dataOld:', dataOld); // NULL -> Question Not Found!

  // New fixed logic:
  const { data: dataNew } = await supabase
    .from('questions')
    .select('*, categories(*)')
    .eq('status', 'published')
    .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
    .maybeSingle();

  console.log('=== NEW LOGIC RESULT ===');
  console.log('dataNew ID:', dataNew ? dataNew.id : null);
  console.log('dataNew Title:', dataNew ? dataNew.title : null);
}

testBugBeforeFix();
