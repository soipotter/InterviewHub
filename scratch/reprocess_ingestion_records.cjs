const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function reprocessIngestionRecords() {
  console.log('===========================================================');
  console.log('REPROCESSING CANDIDATE INGESTION RECORDS (ZERO INVENTED DETAILS)');
  console.log('===========================================================');

  // Authenticate as Admin
  console.log('Authenticating as Admin gamecuasoine@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com',
    password: '12345678',
  });

  if (authError || !authData.session) {
    console.error('✕ Admin auth failed:', authError?.message);
    return;
  }
  console.log('✓ Admin authenticated! User ID:', authData.user.id);

  // Fetch current 5 records from Supabase
  const { data: currentRecords, error: fetchErr } = await supabase
    .from('ingested_questions')
    .select('*')
    .order('created_at', { ascending: true });

  if (fetchErr || !currentRecords || currentRecords.length === 0) {
    console.error('✕ No current records found in public.ingested_questions:', fetchErr?.message);
    return;
  }

  console.log(`Found ${currentRecords.length} records in public.ingested_questions to reprocess.\n`);

  // Reprocessing table payload
  const reprocessedSummary = [];

  for (const rec of currentRecords) {
    const origText = rec.original_text || rec.source_evidence_text || '';

    // RECORD 1: Shopee TCP/IP & OSI -> TOPIC_ONLY -> REJECT
    if (origText.includes('mô hình tcp/ip và mô hình osi') || rec.normalized_question.includes('TCP/IP')) {
      const summaryItem = {
        id: rec.id,
        evidence: origText,
        classification: 'TOPIC_ONLY',
        oldNormalized: rec.normalized_question,
        newNormalized: '[REJECTED — TOPIC ONLY]',
        canonicalUrl: rec.source_url,
        action: 'DELETE',
      };
      reprocessedSummary.push(summaryItem);

      await supabase.from('ingested_questions').delete().eq('id', rec.id);
    }
    // RECORD 2: Shopee browser request -> SPECIFIC_PROMPT -> Keep without HTTP
    else if (origText.includes('browser send request') || rec.normalized_question.includes('trình duyệt')) {
      const exactShopeePermalink = 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-6383397';
      const newQuestion = 'Điều gì xảy ra khi trình duyệt gửi một request tới server?';

      const summaryItem = {
        id: rec.id,
        evidence: origText,
        classification: 'SPECIFIC_PROMPT',
        oldNormalized: rec.normalized_question,
        newNormalized: newQuestion,
        canonicalUrl: exactShopeePermalink,
        action: 'UPDATE',
      };
      reprocessedSummary.push(summaryItem);

      await supabase
        .from('ingested_questions')
        .update({
          normalized_question: newQuestion,
          source_url: exactShopeePermalink,
          source_final_url: exactShopeePermalink,
          extraction_classification: 'SPECIFIC_PROMPT',
          updated_at: new Date().toISOString(),
        })
        .eq('id', rec.id);
    }
    // RECORD 3: VNPay Java core / heap & stack -> TOPIC_ONLY -> REJECT
    else if (origText.includes('heap and stack') || rec.normalized_question.includes('Heap và Stack')) {
      const summaryItem = {
        id: rec.id,
        evidence: origText,
        classification: 'TOPIC_ONLY',
        oldNormalized: rec.normalized_question,
        newNormalized: '[REJECTED — TOPIC ONLY]',
        canonicalUrl: rec.source_url,
        action: 'DELETE',
      };
      reprocessedSummary.push(summaryItem);

      await supabase.from('ingested_questions').delete().eq('id', rec.id);
    }
    // RECORD 4: VNPay Kafka -> SPECIFIC_PROMPT -> "Kafka giải quyết bài toán gì?"
    else if (origText.includes('kafka giải quyết bài toán gì') || rec.normalized_question.includes('Kafka')) {
      const newQuestion = 'Kafka giải quyết bài toán gì?';

      const summaryItem = {
        id: rec.id,
        evidence: origText,
        classification: 'SPECIFIC_PROMPT',
        oldNormalized: rec.normalized_question,
        newNormalized: newQuestion,
        canonicalUrl: rec.source_url,
        action: 'UPDATE',
      };
      reprocessedSummary.push(summaryItem);

      await supabase
        .from('ingested_questions')
        .update({
          normalized_question: newQuestion,
          extraction_classification: 'SPECIFIC_PROMPT',
          updated_at: new Date().toISOString(),
        })
        .eq('id', rec.id);
    }
    // RECORD 5: VNPay real time report -> SPECIFIC_PROMPT -> "Làm thế nào để tạo một real-time report mà không phải query quá nhiều?"
    else if (origText.includes('real time report') || rec.normalized_question.includes('real time') || rec.normalized_question.includes('Real-time')) {
      const newQuestion = 'Làm thế nào để tạo một real-time report mà không phải query quá nhiều?';

      const summaryItem = {
        id: rec.id,
        evidence: origText,
        classification: 'SPECIFIC_PROMPT',
        oldNormalized: rec.normalized_question,
        newNormalized: newQuestion,
        canonicalUrl: rec.source_url,
        action: 'UPDATE',
      };
      reprocessedSummary.push(summaryItem);

      await supabase
        .from('ingested_questions')
        .update({
          normalized_question: newQuestion,
          extraction_classification: 'SPECIFIC_PROMPT',
          updated_at: new Date().toISOString(),
        })
        .eq('id', rec.id);
    }
  }

  console.log('===========================================================');
  console.log('REPROCESSING COMPLETE — FACTUAL COMPARISON REPORT');
  console.log('===========================================================');
  reprocessedSummary.forEach((item, idx) => {
    console.log(`RECORD #${idx + 1}`);
    console.log(`Original Evidence : "${item.evidence}"`);
    console.log(`Classification    : ${item.classification}`);
    console.log(`Old Normalized Q  : "${item.oldNormalized}"`);
    console.log(`New Normalized Q  : "${item.newNormalized}"`);
    console.log(`Canonical Source  : ${item.canonicalUrl}`);
    console.log(`Action Taken      : ${item.action}`);
    console.log('-----------------------------------------------------------\n');
  });

  // Query back retained records in Supabase
  const { data: finalRecords } = await supabase
    .from('ingested_questions')
    .select('*')
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true });

  console.log(`===========================================================`);
  console.log(`RETAINED RETAINED SUPABASE RECORDS (${finalRecords?.length || 0} records):`);
  console.log(`===========================================================`);
  (finalRecords || []).forEach((r, i) => {
    console.log(`${i + 1}. [ID: ${r.id}]`);
    console.log(`   Normalized Question: "${r.normalized_question}"`);
    console.log(`   Classification: ${r.extraction_classification}`);
    console.log(`   Company: ${r.company} | Role: ${r.role}`);
    console.log(`   Canonical Permalink: ${r.source_url}`);
    console.log(`   Evidence Text: "${r.source_evidence_text}"\n`);
  });
  console.log(`===========================================================`);
}

reprocessIngestionRecords().catch((err) => {
  console.error('Fatal reprocessing error:', err);
});
