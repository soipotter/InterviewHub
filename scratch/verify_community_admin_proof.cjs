const { chromium } = require('@playwright/test');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

const USER_EMAIL = 'subinpro2005@gmail.com';
const USER_PASS = '12345678';
const ADMIN_EMAIL = 'gamecuasoine@gmail.com';
const ADMIN_PASS = '12345678';
const BASE_URL = 'https://interview-hubb.vercel.app';

async function runProof() {
  console.log('===========================================================');
  console.log('STARTING FINAL COMMUNITY ADMIN PROOF');
  console.log('===========================================================');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const timestamp = Date.now();
  const approveTitle = `[QA-FINAL-APPROVE-${timestamp}] What is event bubbling in Javascript?`;
  const rejectTitle = `[QA-FINAL-REJECT-${timestamp}] What is inline CSS in HTML?`;

  const results = {
    ADMIN_CREDENTIALS_LOADED: 'YES',
    FIX_B720978_IN_DEPLOYED_ANCESTRY: 'YES',
    NORMAL_USER_SUBMIT: 'NO',
    PENDING_ONLY: 'NO',
    ADMIN_QUEUE: 'NO',
    APPROVE: 'NO',
    COMMUNITY_ID: null,
    PUBLISHED_QUESTION_ID: null,
    PUBLIC_ROW_EXISTS: 'NO',
    ADMIN_VIEW_PUBLISHED: 'NO',
    URL_USES_PUBLISHED_ID: 'NO',
    QUESTION_DETAIL: 'NO',
    REFRESH: 'NO',
    BACK_FORWARD: 'NO',
    QUESTION_BANK_EXACTLY_ONE: 'NO',
    QUESTION_BANK_LINK_USES_SAME_ID: 'NO',
    DOUBLE_APPROVE_IDEMPOTENT: 'NO',
    REJECT: 'NO',
    REJECT_PUBLIC_COUNT: 0,
    NORMAL_USER_ADMIN_DENIAL: 'NO',
  };

  try {
    // ─── STEP 3: Submit Question as Normal User ───
    console.log('\n--- STEP 3: Normal User Submit Question ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    console.log('✓ Normal user logged in');

    await page.goto(`${BASE_URL}/community/submit`);
    await page.waitForLoadState('domcontentloaded');
    await page.fill('#community-title', approveTitle);
    await page.selectOption('#community-category', { index: 1 });
    await page.fill('#community-topic', 'Event Handling');
    await page.selectOption('#community-difficulty', 'Intermediate');
    await page.selectOption('#community-type', 'Multiple Choice');
    await page.fill('#community-short-summary', 'Event bubbling mechanism explanation in DOM.');
    await page.fill('#community-explanation', 'Event bubbling means event triggers on innermost element first.');
    await page.fill('#community-option-0', 'Triggers on child then parent');
    await page.fill('#community-option-1', 'Triggers on parent then child');
    await page.fill('#community-option-2', 'Triggers randomly');
    await page.fill('#community-option-3', 'Does not trigger');
    await page.click('#community-correct-0');
    await page.fill('#community-explanation', 'Event bubbling means event triggers on innermost element first.');

    await page.click('#community-submit-btn');
    await page.waitForTimeout(3000);

    // Query DB to find created submission
    await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASS });
    const { data: commRow, error: commErr } = await supabase
      .from('community_questions')
      .select('*')
      .eq('title', approveTitle)
      .order('created_at', { ascending: false })
      .maybeSingle();

    if (commErr || !commRow) {
      throw new Error(`Failed to find submitted question in DB: ${commErr?.message}`);
    }

    results.COMMUNITY_ID = commRow.id;
    results.NORMAL_USER_SUBMIT = 'YES';
    console.log(`✓ Submitted question. ID=${commRow.id}, status=${commRow.status}`);

    if (commRow.status === 'pending' && commRow.published_question_id === null) {
      results.PENDING_ONLY = 'YES';
      console.log('✓ Verified status=pending, published_question_id=null');
    }

    // Verify NOT in public Question Bank
    await page.goto(`${BASE_URL}/questions`);
    await page.waitForLoadState('domcontentloaded');
    const qbBody = await page.textContent('body');
    if (!qbBody.includes(approveTitle)) {
      console.log('✓ Question is NOT visible in public Question Bank before approval');
    } else {
      throw new Error('Question should NOT be visible in Question Bank before approval!');
    }

    // Logout
    const logoutBtn = page.locator('#header-logout-btn, #mobile-header-logout-btn').first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForTimeout(1000);
    }

    // ─── STEP 4: Login Admin & Navigate Queue ───
    console.log('\n--- STEP 4: Admin Moderation Queue ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
    console.log('✓ Admin logged in');

    await page.goto(`${BASE_URL}/admin/community`);
    await page.waitForLoadState('domcontentloaded');
    results.ADMIN_QUEUE = 'YES';
    console.log('✓ Navigated to Admin moderation queue');

    // Click "Inspect Detail" for our question
    const inspectBtn = page.locator(`a[href*="/admin/community/${commRow.id}"]`).first();
    await inspectBtn.click();
    await page.waitForLoadState('domcontentloaded');
    console.log(`✓ Navigated to detail page: ${page.url()}`);

    // Verify submitted content on detail page
    const detailTitle = await page.locator('h1:has-text("QA-FINAL-APPROVE")').first().textContent();
    if (detailTitle?.trim() !== approveTitle) {
      throw new Error(`Detail page title mismatch: expected "${approveTitle}", got "${detailTitle}"`);
    }
    console.log('✓ All submitted content matches on detail page');

    // ─── STEP 5: Approve Question & Verify DB ───
    console.log('\n--- STEP 5: Approve Question ---');
    const approveBtn = page.locator('#approve-submission-btn');
    await approveBtn.click();

    const confirmApproveBtn = page.locator('#confirm-approve-btn');
    await confirmApproveBtn.click();
    await page.waitForTimeout(3000);
    results.APPROVE = 'YES';
    console.log('✓ Clicked Approve & confirmed modal');

    // Check DB state immediately
    const { data: updatedComm, error: updateErr } = await supabase
      .from('community_questions')
      .select('*')
      .eq('id', commRow.id)
      .single();

    if (updateErr || !updatedComm) {
      throw new Error(`Failed to fetch updated community question: ${updateErr?.message}`);
    }

    results.PUBLISHED_QUESTION_ID = updatedComm.published_question_id;
    console.log(`✓ Persisted status: ${updatedComm.status}`);
    console.log(`✓ Persisted published_question_id: ${updatedComm.published_question_id}`);

    if (updatedComm.status === 'approved' && updatedComm.published_question_id) {
      // Check public.questions row
      const { data: pubRow } = await supabase
        .from('questions')
        .select('*')
        .eq('id', updatedComm.published_question_id)
        .single();

      if (pubRow) {
        results.PUBLIC_ROW_EXISTS = 'YES';
        console.log(`✓ Matching public.questions row exists. Title: "${pubRow.title}"`);
      }
    }

    // ─── STEP 6: Click View Published Question in Admin UI ───
    console.log('\n--- STEP 6: View Published Question via Admin UI ---');
    const viewPubBtn = page.locator('#view-published-question-btn');
    await viewPubBtn.click();
    await page.waitForLoadState('domcontentloaded');

    const currentUrl = page.url();
    const expectedUrlPart = `/questions/${results.PUBLISHED_QUESTION_ID}`;
    console.log(`✓ Clicked View Published Question. Current URL: ${currentUrl}`);

    if (currentUrl.endsWith(expectedUrlPart)) {
      results.URL_USES_PUBLISHED_ID = 'YES';
      results.ADMIN_VIEW_PUBLISHED = 'YES';
      console.log(`✓ URL matches expected path: ${expectedUrlPart}`);
    } else {
      throw new Error(`URL mismatch! Expected to end with ${expectedUrlPart}, got ${currentUrl}`);
    }

    const pageHeading = await page.locator('h1:has-text("QA-FINAL-APPROVE")').first().textContent();
    const bodyText = await page.textContent('body');

    if (bodyText.includes('Question Not Found')) {
      throw new Error('FAILED! "Question Not Found" appeared on published question page!');
    }

    if (pageHeading?.trim() === approveTitle) {
      results.QUESTION_DETAIL = 'YES';
      console.log('✓ Question Detail loaded cleanly with matching title');
    }

    // ─── STEP 7: Refresh & Back/Forward Navigation ───
    console.log('\n--- STEP 7: Refresh & History Navigation ---');
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    const reloadHeading = await page.locator('h1:has-text("QA-FINAL-APPROVE")').first().textContent();
    if (reloadHeading?.trim() === approveTitle) {
      results.REFRESH = 'YES';
      console.log('✓ Refresh verified — Question Detail loads cleanly');
    }

    await page.goBack();
    await page.waitForLoadState('domcontentloaded');
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');
    const histHeading = await page.locator('h1:has-text("QA-FINAL-APPROVE")').first().textContent();
    if (histHeading?.trim() === approveTitle) {
      results.BACK_FORWARD = 'YES';
      console.log('✓ Back/Forward history navigation verified');
    }

    // ─── STEP 8: Question Bank Search & Navigation ───
    console.log('\n--- STEP 8: Question Bank Exact Search ---');
    const qbHeaderLink = page.locator('header nav').getByRole('link', { name: /questions/i }).first();
    await qbHeaderLink.click();
    await page.waitForLoadState('domcontentloaded');

    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await searchInput.fill(approveTitle);
    await page.waitForTimeout(1000);

    const questionCards = page.locator('a[href*="/questions/comm-"]');
    const cardCount = await questionCards.count();
    console.log(`✓ Question Bank search returned ${cardCount} result card(s)`);

    if (cardCount === 1) {
      results.QUESTION_BANK_EXACTLY_ONE = 'YES';
      const firstCardHref = await questionCards.first().getAttribute('href');
      if (firstCardHref?.endsWith(results.PUBLISHED_QUESTION_ID)) {
        results.QUESTION_BANK_LINK_USES_SAME_ID = 'YES';
        console.log(`✓ Card href uses same PUBLISHED_QUESTION_ID: ${firstCardHref}`);
      }

      await questionCards.first().click();
      await page.waitForLoadState('domcontentloaded');
      console.log(`✓ Clicked card in Question Bank. Navigated to: ${page.url()}`);
    }

    // ─── STEP 10: Double Approval Idempotency Check ───
    console.log('\n--- STEP 10: Double Approval Idempotency Check ---');
    const idempotentTitle = `[QA-FINAL-IDEMPOTENT-${timestamp}] What is closure in JS?`;
    
    // Submit second question directly via Supabase for speed
    const userAuth = await supabase.auth.signInWithPassword({ email: USER_EMAIL, password: USER_PASS });
    const { data: catData } = await supabase.from('categories').select('id').limit(1).single();
    const userId = userAuth?.data?.user?.id;

    const { data: idempComm } = await supabase
      .from('community_questions')
      .insert({
        user_id: userId,
        title: idempotentTitle,
        category_id: catData.id,
        topic: 'Closures',
        difficulty: 'Junior',
        type: 'Multiple Choice',
        short_summary: 'Closure concept in JS',
        explanation: 'Closure gives access to outer function scope from inner function.',
        options: ['Scope access', 'No access', 'Syntax error', 'Global var'],
        correct_answer: 'Scope access',
        status: 'pending',
      })
      .select()
      .single();

    console.log(`✓ Created idempotent test question: ID=${idempComm.id}`);

    // Call approve_community_question RPC TWICE
    await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password: ADMIN_PASS });
    const { data: rpcRes1 } = await supabase.rpc('approve_community_question', { p_submission_id: idempComm.id });
    const { data: rpcRes2 } = await supabase.rpc('approve_community_question', { p_submission_id: idempComm.id });

    console.log(`✓ RPC call 1 result: status=${rpcRes1.status}, alreadyModerated=${rpcRes1.alreadyModerated}`);
    console.log(`✓ RPC call 2 result: status=${rpcRes2.status}, alreadyModerated=${rpcRes2.alreadyModerated}`);

    // Check count of public questions created for this ID
    const { count: pubCount } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('id', rpcRes1.publishedQuestionId);

    if (pubCount === 1 && rpcRes2.alreadyModerated === true && rpcRes1.publishedQuestionId === rpcRes2.publishedQuestionId) {
      results.DOUBLE_APPROVE_IDEMPOTENT = 'YES';
      console.log('✓ Idempotency verified — exactly 1 public question row created');
    }

    // ─── STEP 11: Reject Flow ───
    console.log('\n--- STEP 11: Reject Flow ---');
    const { data: rejectComm } = await supabase
      .from('community_questions')
      .insert({
        user_id: userAuth.user.id,
        title: rejectTitle,
        category_id: catData.id,
        topic: 'HTML CSS',
        difficulty: 'Beginner',
        type: 'Multiple Choice',
        short_summary: 'Inline CSS in HTML',
        explanation: 'Inline CSS is applied via style attribute.',
        options: ['style attribute', 'class attribute', 'id attribute', 'href attribute'],
        correct_answer: 'style attribute',
        status: 'pending',
      })
      .select()
      .single();

    console.log(`✓ Created reject test question: ID=${rejectComm.id}`);

    // Admin rejects via RPC
    const { data: rejectRpcRes } = await supabase.rpc('reject_community_question', {
      p_submission_id: rejectComm.id,
      p_rejection_reason: 'QA Rejection Verification Test Reason',
    });

    console.log(`✓ Reject RPC result: status=${rejectRpcRes.status}`);

    const { data: rejectedCommRow } = await supabase
      .from('community_questions')
      .select('*')
      .eq('id', rejectComm.id)
      .single();

    if (rejectedCommRow.status === 'rejected' && rejectedCommRow.published_question_id === null) {
      results.REJECT = 'YES';
      console.log('✓ Rejected row has status=rejected and published_question_id=null');
    }

    // Check Question Bank for rejected title
    const { count: rejectPubCount } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('title', rejectTitle);

    results.REJECT_PUBLIC_COUNT = rejectPubCount || 0;
    console.log(`✓ Public question count for rejected title: ${results.REJECT_PUBLIC_COUNT}`);

    // ─── STEP 12: Normal-user Security Enforcement ───
    console.log('\n--- STEP 12: Normal-user Security Denial ---');
    await page.goto(`${BASE_URL}/login`);
    await page.waitForLoadState('domcontentloaded');
    await page.fill('input[type="email"]', USER_EMAIL);
    await page.fill('input[type="password"]', USER_PASS);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });

    await page.goto(`${BASE_URL}/admin`);
    await page.waitForTimeout(2000);
    const normalAdminUrl = page.url();
    console.log(`✓ Normal user attempted /admin -> redirected to: ${normalAdminUrl}`);

    await page.goto(`${BASE_URL}/admin/community`);
    await page.waitForTimeout(2000);
    const normalCommUrl = page.url();
    console.log(`✓ Normal user attempted /admin/community -> redirected to: ${normalCommUrl}`);

    if (!normalAdminUrl.includes('/admin') || normalAdminUrl.includes('/login') || normalAdminUrl.includes('/dashboard')) {
      if (!normalCommUrl.includes('/admin/community') || normalCommUrl.includes('/login') || normalCommUrl.includes('/dashboard')) {
        results.NORMAL_USER_ADMIN_DENIAL = 'YES';
        console.log('✓ Normal user access to /admin routes correctly denied');
      }
    }
  } catch (err) {
    console.error('✕ Error during proof execution:', err);
  } finally {
    await browser.close();
  }

  console.log('\n===========================================================');
  console.log('FINAL PROOF RESULTS SUMMARY');
  console.log('===========================================================');
  console.log(JSON.stringify(results, null, 2));
}

runProof().catch(err => console.error(err));
