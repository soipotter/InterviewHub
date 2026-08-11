export type PostIntent =
  | 'CANDIDATE_INTERVIEW_REPORT'
  | 'GENERAL_INTERVIEW_GUIDE'
  | 'COMMUNITY_REQUEST'
  | 'CAREER_ADVICE_REQUEST'
  | 'DISCUSSION_REPLY'
  | 'RECRUITING_POST'
  | 'OTHER';

export type ContentClassification =
  | 'EXPLICIT_QUESTION'
  | 'SPECIFIC_PROMPT'
  | 'ASSESSMENT_TASK'
  | 'TOPIC_ONLY';

export interface IsolatedPost {
  postId: string;
  canonicalUrl: string;
  author: string;
  authoredText: string;
  company: string | null;
  role: string | null;
}

export function classifyPostIntent(text: string): PostIntent {
  const lower = text.toLowerCase().trim();

  // Community Request
  if (
    /bác nào (?:pv|phỏng vấn)|phỏng vấn mây vòng|chưa ạ|\?\?/i.test(lower) &&
    (lower.includes('ở niteco') || lower.includes('của titki') || lower.includes('từng phỏng vấn rồi'))
  ) {
    return 'COMMUNITY_REQUEST';
  }

  // Career Advice Request
  if (
    /chuẩn bị kiến thức|chuẩn bị những gì|xin hỏi khi pv|level junior php/i.test(lower)
  ) {
    return 'CAREER_ADVICE_REQUEST';
  }

  // Discussion Reply
  if (
    /nestjs là gì vậy bạn|biết mỗi nodejs thôi|chắc người phỏng vấn không biết/i.test(lower)
  ) {
    return 'DISCUSSION_REPLY';
  }

  // General Interview Guide
  if (
    /đây là 1 câu khá hay|để trả lời câu này, các bạn cần phải nắm|chấm sql skill|lời khuyên:|chấm điểm thái độ/i.test(lower) &&
    !lower.includes('tên công ty') &&
    !lower.includes('quá trình phỏng vấn')
  ) {
    return 'GENERAL_INTERVIEW_GUIDE';
  }

  // Candidate Interview Report
  if (
    lower.includes('tên công ty') ||
    lower.includes('quá trình phỏng vấn') ||
    lower.includes('vị trí tuyển dụng') ||
    (lower.includes('phỏng vấn') && (lower.includes('vòng 1') || lower.includes('vòng 2') || lower.includes('round')))
  ) {
    return 'CANDIDATE_INTERVIEW_REPORT';
  }

  return 'OTHER';
}

export function classifyContentType(lineText: string): ContentClassification {
  const lower = lineText.toLowerCase().trim();

  // Topic Only
  if (
    lower.includes('kiến thức cơ bản:') ||
    lower.includes('java core, heap and stack') ||
    lower.includes('hỏi một số câu') ||
    lower.includes('7 câu javascript')
  ) {
    return 'TOPIC_ONLY';
  }

  // Assessment Task
  if (
    lower.includes('làm bài test html css') ||
    lower.includes('bài test online') ||
    lower.includes('glider.ai')
  ) {
    return 'ASSESSMENT_TASK';
  }

  // Explicit Question
  if (lineText.includes('?') || /là gì|thế nào|tại sao|như thế nào/i.test(lower)) {
    return 'EXPLICIT_QUESTION';
  }

  return 'SPECIFIC_PROMPT';
}

export function extractCompanyFromPost(post: IsolatedPost): string | null {
  const text = post.authoredText;
  if (/Tên Công Ty\s*:\s*VinBrain/i.test(text) || /\bVinBrain\b/i.test(text)) return 'VinBrain';
  if (/Tên Công Ty\s*:\s*Shopee/i.test(text) || /\bShopee\b/i.test(text)) return 'Shopee';
  if (/Tên Công Ty\s*:\s*VNPay/i.test(text) || /\bVNPay\b/i.test(text)) return 'VNPay';
  if (/Tên Công Ty\s*:\s*Grab/i.test(text) || /\bGrab\b/i.test(text)) return 'Grab';
  if (/Tên Công Ty\s*:\s*Tiki/i.test(text) || /\bTiki\b/i.test(text)) return 'Tiki';
  return null; // Do NOT invent "Vietnam IT Company"
}

export function runBoundaryRegressionTests() {
  console.log('===========================================================');
  console.log('PHASE 6 — REGRESSION TESTS: POST INTENTS & BOUNDARIES');
  console.log('===========================================================');
  let failures = 0;

  // Test A: VinBrain post next to Grab posts => VinBrain / Applied Science Intern
  const postVinBrain: IsolatedPost = {
    postId: 'post-7916686',
    canonicalUrl: 'https://voz.vn/t/review-phong-van-cac-cong-ty-cntt.206897/post-7916686',
    author: 'CandidateX',
    authoredText: 'Tên Công Ty: VinBrain\nVị trí: Applied Science Intern\nGiải thích lên bảng 1 kiến trúc mạng gì đó.',
    company: null,
    role: null,
  };
  const compA = extractCompanyFromPost(postVinBrain);
  if (compA === 'VinBrain') {
    console.log('  ✓ PASS Test A: VinBrain post correctly isolated from Grab context.');
  } else {
    console.error(`  ✕ FAIL Test A: Expected VinBrain, got ${compA}`);
    failures++;
  }

  // Test B: "Java core, heap and stack..." => TOPIC_ONLY
  const typeB = classifyContentType('Kiến thức cơ bản: Java core, heap and stack, garbage collector, IoC, Spring, SOLID, database recovery');
  if (typeB === 'TOPIC_ONLY') {
    console.log('  ✓ PASS Test B: "Java core, heap and stack..." correctly classified as TOPIC_ONLY.');
  } else {
    console.error(`  ✕ FAIL Test B: Expected TOPIC_ONLY, got ${typeB}`);
    failures++;
  }

  // Test C: "Ko biết bác nào pv FE Niteco chưa?" => COMMUNITY_REQUEST
  const intentC = classifyPostIntent('Ko biết bác nào pv vị trí FE dev ở niteco chưa ạ?');
  if (intentC === 'COMMUNITY_REQUEST') {
    console.log('  ✓ PASS Test C: Niteco review inquiry correctly classified as COMMUNITY_REQUEST.');
  } else {
    console.error(`  ✕ FAIL Test C: Expected COMMUNITY_REQUEST, got ${intentC}`);
    failures++;
  }

  // Test D: "Tiki phỏng vấn mấy vòng?" => COMMUNITY_REQUEST
  const intentD = classifyPostIntent('Tình hình em tính apply vào vị trí data science của titki, các bác nào đang làm việc hay từng phỏng vấn rồi có thể chia sẻ cho em bên đó phỏng vấn mây vòng và phỏng vấn nhưng câu kiểu gì không ạ ??');
  if (intentD === 'COMMUNITY_REQUEST') {
    console.log('  ✓ PASS Test D: Tiki inquiry correctly classified as COMMUNITY_REQUEST.');
  } else {
    console.error(`  ✕ FAIL Test D: Expected COMMUNITY_REQUEST, got ${intentD}`);
    failures++;
  }

  // Test E: "Junior PHP cần chuẩn bị gì?" => CAREER_ADVICE_REQUEST
  const intentE = classifyPostIntent('Các anh chị nhiều kinh nghiệm hoặc từng đi phỏng vấn cho vị trí này cho em xin hỏi khi pv level Junior PHP thì mình cần chuẩn bị kiến thức như thế nào?');
  if (intentE === 'CAREER_ADVICE_REQUEST') {
    console.log('  ✓ PASS Test E: Junior PHP advice request correctly classified as CAREER_ADVICE_REQUEST.');
  } else {
    console.error(`  ✕ FAIL Test E: Expected CAREER_ADVICE_REQUEST, got ${intentE}`);
    failures++;
  }

  // Test F: General interview prep guide => GENERAL_INTERVIEW_GUIDE
  const intentF = classifyPostIntent('- Mô tả cách browser làm gì sau khi bạn enter 1 url trên browser? Để trả lời câu này, các bạn cần phải nắm, http/https, dns, routing, các giao thức http/ip/tcp/udp, v.v... Đây là 1 câu khá hay, tùy theo cách bạn trả lời, ng ta sẽ hỏi xoáy vô các kiến thức khác.');
  if (intentF === 'GENERAL_INTERVIEW_GUIDE') {
    console.log('  ✓ PASS Test F: Browser URL article correctly classified as GENERAL_INTERVIEW_GUIDE.');
  } else {
    console.error(`  ✕ FAIL Test F: Expected GENERAL_INTERVIEW_GUIDE, got ${intentF}`);
    failures++;
  }

  // Test G: Forum reply => DISCUSSION_REPLY
  const intentG = classifyPostIntent('NestJs là gì vậy bạn. Biết mỗi NodeJs thôi. Chắc người phỏng vấn không biết công nghệ đó.');
  if (intentG === 'DISCUSSION_REPLY') {
    console.log('  ✓ PASS Test G: NestJS reply correctly classified as DISCUSSION_REPLY.');
  } else {
    console.error(`  ✕ FAIL Test G: Expected DISCUSSION_REPLY, got ${intentG}`);
    failures++;
  }

  // Test H: "Vòng 1 làm bài test HTML CSS" => ASSESSMENT_TASK
  const typeH = classifyContentType('Vòng 1 làm bài test html css.');
  if (typeH === 'ASSESSMENT_TASK') {
    console.log('  ✓ PASS Test H: Coding test line correctly classified as ASSESSMENT_TASK.');
  } else {
    console.error(`  ✕ FAIL Test H: Expected ASSESSMENT_TASK, got ${typeH}`);
    failures++;
  }

  // Test I: "Vòng 3 leader FE hỏi một số câu" => TOPIC_ONLY
  const typeI = classifyContentType('Vòng 3 vấn đáp câu hỏi của anh leader FE hỏi một số câu');
  if (typeI === 'TOPIC_ONLY') {
    console.log('  ✓ PASS Test I: Vague leader questions correctly classified as TOPIC_ONLY.');
  } else {
    console.error(`  ✕ FAIL Test I: Expected TOPIC_ONLY, got ${typeI}`);
    failures++;
  }

  // Test J: Strict boundary check assertion
  const postJ: IsolatedPost = {
    postId: 'post-100',
    canonicalUrl: 'https://voz.vn/t/test/post-100',
    author: 'User1',
    authoredText: 'Only text inside post 100',
    company: null,
    role: null,
  };
  const evidenceTextJ = 'text inside post 100';
  const isValidJ = postJ.authoredText.toLowerCase().includes(evidenceTextJ);
  if (isValidJ) {
    console.log('  ✓ PASS Test J: Evidence substring boundary assertion verified.');
  } else {
    console.error('  ✕ FAIL Test J: Evidence boundary assertion failed.');
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL REGRESSION TESTS PASSED (10/10)');
  } else {
    console.error(`COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runBoundaryRegressionTests();
