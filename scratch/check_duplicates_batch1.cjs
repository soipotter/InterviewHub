const { createClient } = require('@supabase/supabase-js');
const url = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const key = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(url, key);

async function main() {
  const { data: pub } = await supabase.from('questions').select('id, title, topic, category_id');

  console.log('--- CHECKING DUPLICATES FOR BATCH 1 CANDIDATES ---');
  console.log('Total published questions:', pub ? pub.length : 0);

  const keywords = ['Kafka', 'browser', 'trình duyệt', 'kiến trúc', 'Class Component'];
  keywords.forEach(kw => {
    const matches = (pub || []).filter(q => (q.title + ' ' + (q.topic || '')).toLowerCase().includes(kw.toLowerCase()));
    console.log(`Keyword "${kw}": ${matches.length} matches found.`);
    matches.forEach(m => console.log('   Match:', m.id, '|', m.title.substring(0, 60)));
  });
}

main().catch(console.error);
