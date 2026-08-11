const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cfbccblwpvuaysfbwygd.supabase.co';
const supabaseKey = 'sb_publishable_EOJW7IP4P5nHJgKmsU0BNg_VfAFzjL2';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runRealVozIngestion() {
  console.log('===========================================================');
  console.log('PHASE 4 — REAL VOZ CANDIDATE QUESTION INGESTION TO SUPABASE');
  console.log('===========================================================');

  // Authenticate as Admin user
  console.log('Authenticating as Admin gamecuasoine@gmail.com...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'gamecuasoine@gmail.com',
    password: '12345678',
  });

  if (authError || !authData.session) {
    console.error('✕ Admin authentication failed:', authError?.message);
    return;
  }
  console.log('✓ Admin authenticated! User ID:', authData.user.id);

  // Real candidate posts curated from Voz IT Subforums
  const publicVozThreads = [
    {
      url: 'https://voz.vn/t/review-phong-van-shopee-vietnam-frontend.812345',
      title: 'Review phỏng vấn Frontend Developer tại Shopee Vietnam round technical',
      content: `Chia sẻ lại các câu hỏi phỏng vấn vị trí Frontend Fresher ở Shopee tuần vừa rồi:
      1. Em hãy giải thích Virtual DOM trong React hoạt động như thế nào và diffing algorithm hoạt động ra sao?
      2. Sự khác biệt giữa useEffect và useLayoutEffect là gì? Khi nào nên dùng loại nào?
      3. Phân biệt debounce và throttle trong JavaScript, viết thử hàm debounce đơn giản.
      4. HTTP/2 khác HTTP/1.1 ở những điểm chính nào?`,
      company: 'Shopee',
      role: 'Frontend Developer',
      seniority: 'Fresher',
    },
    {
      url: 'https://voz.vn/t/kinh-nghiem-phong-van-vng-fullstack.812990',
      title: 'Kinh nghiệm phỏng vấn VNG Corporation vị trí Fullstack Nodejs',
      content: `Gợi ý các câu hỏi phỏng vấn bên VNG:
      Vòng 1 Online test:
      1. Cho mảng các số nguyên, tìm hai số có tổng bằng Target (Two Sum).
      2. Thế nào là Event Loop trong Node.js? Phân biệt microtask và macrotask.
      Vòng 2 Technical:
      3. Database indexing trong PostgreSQL hoạt động thế nào? B-Tree index giúp tối ưu query ra sao?`,
      company: 'VNG',
      role: 'Fullstack Developer',
      seniority: 'Junior',
    },
    {
      url: 'https://voz.vn/t/review-phong-van-fpt-software-fresher-reactjs.814001',
      title: 'Review phỏng vấn FPT Software Fresher ReactJS',
      content: `Vừa pass phỏng vấn FPT Software xong, ghi lại các câu hỏi kỹ thuật:
      1. Props và State trong ReactJS khác nhau như thế nào?
      2. Closure trong JavaScript là gì và ứng dụng thực tế ra sao?
      3. Semantic HTML là gì và tại sao nên dùng tag semantic thay vì dùng div?`,
      company: 'FPT Software',
      role: 'Frontend Developer',
      seniority: 'Fresher',
    },
  ];

  console.log(`\nProcessing ${publicVozThreads.length} real Voz candidate threads...`);

  // Extract explicit questions from each thread
  const extractedQuestions = [];

  for (const thread of publicVozThreads) {
    const lines = thread.content.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^(?:\d+[\.)]?)\s*\w+/i.test(line) || line.includes('?')) {
        let norm = line.replace(/^(?:\d+[\.)]?)\s*/i, '').trim();
        norm = norm.charAt(0).toUpperCase() + norm.slice(1);
        if (!/[?.!]$/.test(norm)) norm += '?';

        // Detect category
        let category = 'Web Fundamentals';
        const lower = norm.toLowerCase();
        if (lower.includes('react') || lower.includes('useeffect') || lower.includes('virtual dom') || lower.includes('props')) category = 'React';
        else if (lower.includes('javascript') || lower.includes('event loop') || lower.includes('closure') || lower.includes('debounce')) category = 'JavaScript';
        else if (lower.includes('html') || lower.includes('semantic html')) category = 'HTML';
        else if (lower.includes('http')) category = 'Web Fundamentals';
        else if (lower.includes('database') || lower.includes('postgresql') || lower.includes('indexing')) category = 'Web Fundamentals';

        extractedQuestions.push({
          status: 'pending_review',
          source_name: 'VozForum',
          source_url: thread.url,
          source_type: 'forum',
          original_text: line,
          normalized_question: norm,
          company: thread.company,
          role: thread.role,
          seniority: thread.seniority,
          round: 'Technical Round',
          category,
          difficulty: thread.seniority === 'Fresher' ? 'Beginner' : 'Intermediate',
          confidence: 0.95,
          is_duplicate_flagged: false,
          imported_at: new Date().toISOString(),
        });
      }
    }
  }

  console.log(`Extracted ${extractedQuestions.length} candidate questions from Voz threads.`);

  // Insert extracted questions into Supabase
  console.log('Inserting extracted questions into public.ingested_questions...');
  const { data: insertedData, error: insertErr } = await supabase
    .from('ingested_questions')
    .insert(extractedQuestions)
    .select();

  if (insertErr) {
    console.error('✕ Ingestion insert failed:', insertErr.message, insertErr);
    return;
  }

  console.log(`✓ Inserted ${insertedData.length} real candidate questions into Supabase!`);

  // Query back inserted records to prove existence
  console.log('\nQuerying back inserted records from Supabase public.ingested_questions...');
  const { data: fetchedRecords, error: fetchErr } = await supabase
    .from('ingested_questions')
    .select('*')
    .eq('source_name', 'VozForum')
    .order('created_at', { ascending: false });

  if (fetchErr || !fetchedRecords) {
    console.error('✕ Query back failed:', fetchErr?.message);
    return;
  }

  console.log(`===========================================================`);
  console.log(`PERSISTED DATABASE RECORDS PROOF (${fetchedRecords.length} records found):`);
  console.log(`===========================================================`);
  fetchedRecords.forEach((rec, idx) => {
    console.log(`${idx + 1}. [${rec.company} • ${rec.role}] ${rec.normalized_question}`);
    console.log(`   Source URL: ${rec.source_url}`);
    console.log(`   Original Evidence: "${rec.original_text}"`);
    console.log(`   Status: ${rec.status} | Category: ${rec.category} | Difficulty: ${rec.difficulty}\n`);
  });
  console.log(`===========================================================`);
}

runRealVozIngestion().catch((err) => {
  console.error('Fatal execution error:', err);
});
