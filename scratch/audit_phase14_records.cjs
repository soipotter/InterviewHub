const { createClient } = require('@supabase/supabase-js');
const url = process.env.VITE_SUPABASE_URL || 'https://xiycwrdfdmdlssyghskq.supabase.co';
const key = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeWN3cmRmZG1kbHNzeWdoc2txIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyMzY4NTAsImV4cCI6MjA1NjgxMjg1MH0.sM50F1Z40Y8Uf7-Yv5V1a8g8s7E5e30_jK1F5n8g1W8';
const supabase = createClient(url, key);

function classifySourceContent(text) {
  if (!text) return 'insufficient_evidence';
  const lower = text.toLowerCase();
  if (
    lower.includes('phong cách code') ||
    lower.includes('không quá khó') ||
    lower.includes('chủ yếu xem') ||
    lower.includes('thân thiện') ||
    lower.includes('phòng sạch đẹp') ||
    lower.includes('lương thỏa thuận') ||
    lower.includes('kinh nghiệm phỏng vấn') ||
    lower.includes('chia sẻ kinh nghiệm') ||
    lower.includes('chúc may mắn') ||
    lower.includes('review công ty')
  ) {
    return 'not_a_question';
  }
  if (text.includes('?') && text.length >= 15) return 'actual_question';
  if (text.length >= 25 && (lower.includes('hỏi về') || lower.includes('yêu cầu') || lower.includes('bài test'))) return 'question_with_context';
  if (text.length < 15) return 'insufficient_evidence';
  return 'actual_question';
}

function classifyQuestionFormat(text) {
  if (!text) return 'open_ended';
  const lower = text.toLowerCase();
  if (lower.includes('coding') || lower.includes('leetcode') || lower.includes('thuật toán') || lower.includes('viết hàm') || lower.includes('implement')) return 'coding';
  if (lower.includes('system design') || lower.includes('thiết kế hệ thống') || lower.includes('latency') || lower.includes('scale')) return 'scenario';
  if (lower.includes('true/false') || lower.includes('đúng hay sai')) return 'true_false';
  return 'open_ended';
}

async function main() {
  const { data: ingested } = await supabase.from('ingested_questions').select('*');
  const candidates = ingested || [];
  
  const classCounts = { actual_question: 0, question_with_context: 0, not_a_question: 0, insufficient_evidence: 0 };
  const formatCounts = { multiple_choice: 0, true_false: 0, open_ended: 0, coding: 0, scenario: 0, unclassified: 0 };

  candidates.forEach(c => {
    const sc = classifySourceContent(c.original_text || c.normalized_question || '');
    const qf = classifyQuestionFormat(c.original_text || c.normalized_question || '');
    classCounts[sc] = (classCounts[sc] || 0) + 1;
    formatCounts[qf] = (formatCounts[qf] || 0) + 1;
  });

  console.log('=== INGESTED CANDIDATES AUDIT ===');
  console.log('TOTAL:', candidates.length);
  console.log('ACTUAL_QUESTION:', classCounts.actual_question);
  console.log('QUESTION_WITH_CONTEXT:', classCounts.question_with_context);
  console.log('NOT_A_QUESTION:', classCounts.not_a_question);
  console.log('INSUFFICIENT_EVIDENCE:', classCounts.insufficient_evidence);
  console.log('MULTIPLE_CHOICE:', formatCounts.multiple_choice);
  console.log('TRUE_FALSE:', formatCounts.true_false);
  console.log('OPEN_ENDED:', formatCounts.open_ended);
  console.log('CODING:', formatCounts.coding);
  console.log('SCENARIO:', formatCounts.scenario);

  const { data: pub } = await supabase.from('questions').select('*');
  const published = pub || [];
  let suspiciousCount = 0;

  published.forEach(p => {
    const sc = classifySourceContent(p.title + ' ' + (p.short_summary || ''));
    if (sc === 'not_a_question' || sc === 'insufficient_evidence') {
      suspiciousCount++;
    }
  });

  console.log('\n=== PUBLISHED INGESTION AUDIT ===');
  console.log('TOTAL_PUBLISHED:', published.length);
  console.log('SUSPICIOUS_COUNT:', suspiciousCount);
}

main().catch(console.error);
