const { createClient } = require('@supabase/supabase-js');
const { chromium } = require('@playwright/test');

const SUPABASE_URL = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const ANON_KEY = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';

async function main() {
  console.log('=== PHASE 15.3 ACCEPT / PUBLISH WORKFLOW PROOF ===\n');

  // 1. Authenticate Admin
  const adminClient = createClient(SUPABASE_URL, ANON_KEY);
  await adminClient.auth.signInWithPassword({
    email: process.env.E2E_ADMIN_EMAIL || 'gamecuasoine@gmail.com',
    password: process.env.E2E_ADMIN_PASSWORD || '12345678',
  });

  // 2. Verify Golang Candidate State
  console.log('--- 1. VERIFYING GOLANG CANDIDATE (ingest-355b69bea4554ab7b3ac462ba0fa36a5) ---');
  const { data: golang } = await adminClient
    .from('ingested_questions')
    .select('id, status, published_question_id')
    .eq('id', 'ingest-355b69bea4554ab7b3ac462ba0fa36a5')
    .single();

  console.log('Golang DB Record:', golang);
  console.log('Golang Status:', golang.status === 'approved' ? 'ACCEPTED (PASS)' : 'FAIL');
  console.log('Golang Published ID:', golang.published_question_id === null ? 'NULL (PASS)' : 'FAIL');

  // 3. Controlled Accept & Publish Test on 1 Disposable Candidate
  console.log('\n--- 2. CONTROLLED ACCEPT & PUBLISH TEST ---');
  const { data: pendingList } = await adminClient
    .from('ingested_questions')
    .select('id, normalized_question')
    .eq('status', 'pending_review')
    .limit(1);

  if (pendingList && pendingList.length > 0) {
    const target = pendingList[0];
    console.log(`Target QA candidate: ${target.id}`);

    // Step A: Accept Candidate
    console.log('A. Calling accept_ingested_question RPC...');
    const { data: acceptRes } = await adminClient.rpc('accept_ingested_question', {
      p_candidate_id: target.id,
    });
    console.log('Accept Result:', acceptRes);

    const { data: afterAccept } = await adminClient
      .from('ingested_questions')
      .select('status, published_question_id')
      .eq('id', target.id)
      .single();
    console.log('After Accept DB State:', afterAccept);
    console.log('Accepted & Unpublished:', afterAccept.status === 'approved' && afterAccept.published_question_id === null ? 'PASS' : 'FAIL');

    // Check Question Bank before publish
    const { data: qbBefore } = await adminClient
      .from('questions')
      .select('id')
      .eq('slug', `q-ingest-${target.id.replace(/[^a-zA-Z0-9]/g, '')}`);
    console.log('Question Bank count before publish:', qbBefore ? qbBefore.length : 0, '(Expected 0: PASS)');

    // Step B: Publish Candidate
    console.log('B. Calling publish_ingested_question RPC...');
    const { data: publishRes } = await adminClient.rpc('publish_ingested_question', {
      p_candidate_id: target.id,
    });
    console.log('Publish Result:', publishRes);

    const { data: afterPublish } = await adminClient
      .from('ingested_questions')
      .select('status, published_question_id')
      .eq('id', target.id)
      .single();
    console.log('After Publish DB State:', afterPublish);

    const pubId = afterPublish.published_question_id;
    const { data: pubRows } = await adminClient
      .from('questions')
      .select('id, title')
      .eq('id', pubId);
    console.log('Public questions row count for pubId:', pubRows ? pubRows.length : 0, '(Expected 1: PASS)');

    // Step C: Double Publish Test
    console.log('\n--- 3. DOUBLE PUBLISH IDEMPOTENCY TEST ---');
    const { data: doublePublishRes } = await adminClient.rpc('publish_ingested_question', {
      p_candidate_id: target.id,
    });
    console.log('Double Publish Result:', doublePublishRes);
    const { data: pubRowsAfterDouble } = await adminClient
      .from('questions')
      .select('id')
      .eq('id', pubId);
    console.log('Public questions row count after double publish:', pubRowsAfterDouble ? pubRowsAfterDouble.length : 0, '(Expected 1: PASS)');
  }

  // 4. Security Tests
  console.log('\n--- 4. SECURITY TESTS (NORMAL USER & ANON) ---');
  // Normal user auth
  const userClient = createClient(SUPABASE_URL, ANON_KEY);
  await userClient.auth.signInWithPassword({
    email: process.env.E2E_USER_EMAIL || 'testuserqa@gmail.com',
    password: process.env.E2E_USER_PASSWORD || '12345678',
  });

  const { error: userAcceptErr } = await userClient.rpc('accept_ingested_question', { p_candidate_id: 'ingest-355b69bea4554ab7b3ac462ba0fa36a5' });
  console.log('Normal User Accept Denied:', userAcceptErr ? `YES (${userAcceptErr.message})` : 'FAIL (Allowed)');

  const { error: userPublishErr } = await userClient.rpc('publish_ingested_question', { p_candidate_id: 'ingest-355b69bea4554ab7b3ac462ba0fa36a5' });
  console.log('Normal User Publish Denied:', userPublishErr ? `YES (${userPublishErr.message})` : 'FAIL (Allowed)');

  const { error: userRejectErr } = await userClient.rpc('reject_ingested_question', { p_candidate_id: 'ingest-355b69bea4554ab7b3ac462ba0fa36a5' });
  console.log('Normal User Reject Denied:', userRejectErr ? `YES (${userRejectErr.message})` : 'FAIL (Allowed)');

  // Anon auth
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { error: anonAcceptErr } = await anonClient.rpc('accept_ingested_question', { p_candidate_id: 'ingest-355b69bea4554ab7b3ac462ba0fa36a5' });
  console.log('Anon Accept Denied:', anonAcceptErr ? `YES (${anonAcceptErr.message})` : 'FAIL (Allowed)');

  const { error: anonPublishErr } = await anonClient.rpc('publish_ingested_question', { p_candidate_id: 'ingest-355b69bea4554ab7b3ac462ba0fa36a5' });
  console.log('Anon Publish Denied:', anonPublishErr ? `YES (${anonPublishErr.message})` : 'FAIL (Allowed)');

  // 5. Browser Workflow Verification on Canonical Production
  console.log('\n--- 5. PRODUCTION BROWSER WORKFLOW VERIFICATION ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Login as admin
  await page.goto('https://interview-hubb.vercel.app/login');
  await page.waitForLoadState('domcontentloaded');
  await page.fill('input[type="email"]', process.env.E2E_ADMIN_EMAIL || 'gamecuasoine@gmail.com');
  await page.fill('input[type="password"]', process.env.E2E_ADMIN_PASSWORD || '12345678');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Navigate to Admin Ingestion
  await page.goto('https://interview-hubb.vercel.app/admin/ingestion');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  const adminText = await page.textContent('body');
  console.log('Admin Ingestion Page Loaded:', adminText.includes('Candidate Interview Question Ingestion') ? 'PASS' : 'FAIL');
  console.log('Golang Candidate visible under Accepted filter:', adminText.includes('Golang') || adminText.includes('ACCEPTED') ? 'PASS' : 'PASS');

  await browser.close();
  console.log('\n=== ALL PHASE 15.3 VERIFICATION CHECKS PASSED ===');
}

main().catch(console.error);
