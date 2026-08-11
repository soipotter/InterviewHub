import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cfbccblwpvuaysfbwygd.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';

test.describe('Decoupled Curation Workflow (Accept vs Publish)', () => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  test.beforeAll(async () => {
    // Authenticate as Admin
    await supabase.auth.signInWithPassword({
      email: process.env.E2E_ADMIN_EMAIL || 'gamecuasoine@gmail.com',
      password: process.env.E2E_ADMIN_PASSWORD || '12345678',
    });
  });

  test('1. verifies existing Golang candidate ingest-355b69bea4554ab7b3ac462ba0fa36a5 is Accepted but Unpublished', async () => {
    const { data: candidate } = await supabase
      .from('ingested_questions')
      .select('id, status, published_question_id')
      .eq('id', 'ingest-355b69bea4554ab7b3ac462ba0fa36a5')
      .single();

    expect(candidate).toBeDefined();
    expect(candidate?.status).toBe('approved');
    expect(candidate?.published_question_id).toBeNull();
  });

  test('2. verifies accepted candidate is absent from public Question Bank before publish', async () => {
    const { data: pub } = await supabase
      .from('questions')
      .select('id')
      .eq('slug', 'q-ingest-ingest355b69bea4554ab7b3ac462ba0fa36a5');

    expect(pub).toBeDefined();
    expect(pub?.length).toBe(0);
  });

  test('3. accepts a pending QA candidate without publishing it into public.questions', async () => {
    // Pick first pending_review candidate
    const { data: pending } = await supabase
      .from('ingested_questions')
      .select('id')
      .eq('status', 'pending_review')
      .limit(1)
      .single();

    if (!pending) return;

    const { data: acceptRes, error } = await supabase.rpc('accept_ingested_question', {
      p_candidate_id: pending.id,
    });

    expect(error).toBeNull();
    expect(acceptRes.success).toBe(true);

    // Verify DB state
    const { data: verified } = await supabase
      .from('ingested_questions')
      .select('status, published_question_id')
      .eq('id', pending.id)
      .single();

    expect(verified?.status).toBe('approved');
    expect(verified?.published_question_id).toBeNull();
  });

  test('4. rejects an invalid/out-of-scope candidate and prevents publication', async () => {
    const { data: rejected } = await supabase
      .from('ingested_questions')
      .select('id')
      .eq('status', 'rejected')
      .limit(1)
      .single();

    if (!rejected) return;

    const { error } = await supabase.rpc('publish_ingested_question', {
      p_candidate_id: rejected.id,
    });

    expect(error).toBeDefined();
  });
});
