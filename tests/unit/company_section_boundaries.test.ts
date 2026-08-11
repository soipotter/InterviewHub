export interface InterviewReportSection {
  sourcePostId: string;
  sourceSectionId: string;
  sectionIndex: number;
  companyRaw: string | null;
  company: string | null;
  roleRaw: string | null;
  role: string | null;
  location: string | null;
  sectionText: string;
  sectionStart: string;
  sectionEnd: string;
}

export function parsePostIntoCompanySections(
  sourcePostId: string,
  postText: string
): InterviewReportSection[] {
  const lines = postText.split('\n');
  const sectionHeadings: { lineIdx: number; companyRaw: string; company: string | null; role: string | null }[] = [];

  const knownCompanies = [
    'OneMount', 'VinID', 'AxonActive', 'Trusting Social', 'Tiki', 'Orange Logic',
    'Sun Asterisk', 'Sun*', 'Nexon Dev Vina', 'Nexon', 'FPT Software', 'FPT', 'DXC',
    'Shopee', 'VNG', 'VNPay', 'Grab', 'MoMo', 'VinBrain', 'Viettel', 'Zalo',
    'NashTech', 'Viet** Cyber Security', 'Splus Software Vietnam', 'Netcompany', 'HCL'
  ];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const numberedMatch = trimmed.match(/^(?:\d+[\s.)|-]+|\*[\s|-]+)([A-Z0-9][A-Za-z0-9\s*()_-]{2,40})/);
    if (numberedMatch) {
      const candidateStr = numberedMatch[1].trim();
      for (const comp of knownCompanies) {
        if (new RegExp(`\\b${comp.replace(/\*/g, '\\*')}\\b`, 'i').test(candidateStr)) {
          let role = null;
          const roleMatch = trimmed.match(/(?:vị trí|role|position|level)?\s*[:(-]\s*([A-Za-z0-9\s()_-]+)/i);
          if (roleMatch && !roleMatch[1].toLowerCase().includes(comp.toLowerCase())) {
            role = roleMatch[1].trim();
          }
          sectionHeadings.push({ lineIdx: idx, companyRaw: candidateStr, company: comp, role });
          return;
        }
      }
    }

    const explicitMatch = trimmed.match(/(?:Tên\s+)?C(?:ông|ty)\s*T(?:y|i)?\s*:\s*([^\n\r]+)/i);
    if (explicitMatch) {
      const companyRaw = explicitMatch[1].trim();
      let company: string | null = companyRaw;
      for (const comp of knownCompanies) {
        if (new RegExp(`\\b${comp.replace(/\*/g, '\\*')}\\b`, 'i').test(companyRaw)) {
          company = comp;
          break;
        }
      }
      sectionHeadings.push({ lineIdx: idx, companyRaw, company, role: null });
      return;
    }
  });

  if (sectionHeadings.length === 0) {
    let company: string | null = null;
    let role: string | null = null;
    let location: string | null = null;

    const compMatch = postText.match(/(?:Tên\s+)?C(?:ông|ty)\s*T(?:y|i)?\s*:\s*([^\n\r]+)/i);
    if (compMatch) {
      company = compMatch[1].trim();
    } else {
      for (const comp of knownCompanies) {
        if (new RegExp(`\\b${comp.replace(/\*/g, '\\*')}\\b`, 'i').test(postText)) {
          company = comp;
          break;
        }
      }
    }

    const roleMatch = postText.match(/Vị trí(?:\s*tuyển dụng)?\s*:\s*([^\n\r]+)/i);
    if (roleMatch) role = roleMatch[1].trim();

    const lower = postText.toLowerCase();
    if (lower.includes('hcm office') || lower.includes('văn phòng hcm')) location = 'Ho Chi Minh City, Vietnam';
    else if (lower.includes('hà nội office') || lower.includes('văn phòng hà nội')) location = 'Hanoi, Vietnam';

    return [
      {
        sourcePostId,
        sourceSectionId: `${sourcePostId}-sec1`,
        sectionIndex: 1,
        companyRaw: company,
        company,
        roleRaw: role,
        role,
        location,
        sectionText: postText,
        sectionStart: postText.slice(0, 60),
        sectionEnd: postText.slice(-60),
      },
    ];
  }

  const sections: InterviewReportSection[] = [];
  for (let i = 0; i < sectionHeadings.length; i++) {
    const heading = sectionHeadings[i];
    const startLine = heading.lineIdx;
    const endLine = i + 1 < sectionHeadings.length ? sectionHeadings[i + 1].lineIdx : lines.length;

    const sectionLines = lines.slice(startLine, endLine);
    const sectionText = sectionLines.join('\n').trim();

    let role = heading.role;
    if (!role) {
      const roleMatch = sectionText.match(/Vị trí(?:\s*tuyển dụng)?\s*:\s*([^\n\r]+)/i);
      if (roleMatch) role = roleMatch[1].trim();
    }

    let location: string | null = null;
    const lowerSection = sectionText.toLowerCase();
    if (lowerSection.includes('hcm office') || lowerSection.includes('văn phòng hcm')) location = 'Ho Chi Minh City, Vietnam';
    else if (lowerSection.includes('hà nội office') || lowerSection.includes('văn phòng hà nội')) location = 'Hanoi, Vietnam';

    sections.push({
      sourcePostId,
      sourceSectionId: `${sourcePostId}-sec${i + 1}`,
      sectionIndex: i + 1,
      companyRaw: heading.companyRaw,
      company: heading.company,
      roleRaw: role,
      role,
      location,
      sectionText,
      sectionStart: sectionText.slice(0, 60),
      sectionEnd: sectionText.slice(-60),
    });
  }

  return sections;
}

export function runCompanySectionBoundaryTests() {
  console.log('===========================================================');
  console.log('REGRESSION TESTS: MULTI-COMPANY SECTION BOUNDARIES (A-J)');
  console.log('===========================================================');
  let failures = 0;

  const post16296010Text = `
1. OneMount (VinID)
Vị trí: Software Engineer Backend (Middle lv)
Hỏi kĩ về dự án cũ, tech stack...

2. AxonActive
Vị trí: Software Engineer Backend
Hỏi khá kĩ về Java: Java 8 có gì mới/mạnh? Stream api, date time api.
Đưa 1 đoạn code Java, giải thích đoạn code này với teamate khác ntn, optimize chỗ nào được.
Exception handling lưu ý gì?
Vài vấn đề chắc là để test tính cách: 3 điều gì trong cuộc sống là quan trọng nhất, triết lý sống là gì...

3. Trusting Social
Vị trí: Software Engineer Backend (Middle lv)
Chủ yếu làm bài test LeetCode medium.

4. Tiki
Vị trí: Software Engineer Backend (Middle lv)
Hỏi về System Design tổng quan.

5. Orange Logic
Vị trí: Software Engineer Backend (Middle lv)
Hỏi sâu về tại sao chọn công nghệ này công nghệ kia.
Hỏi về đóng góp lớn nhất ở cty cũ là gì, nếu bây giờ optimize thì bắt đầu từ đâu.
Kinh nghiệm 1 lần fix bug (bug gì, nguyên nhân, cách giải quyết và giải quyết ntn)
`;

  const post16324664Text = `
1. Sun Asterisk
Vị trí: Junior Frontend Engineer (Reactjs)
Hỏi câu hỏi HR cơ bản.

2. Nexon Dev Vina
Vị trí: Junior Frontend Engineer (Reactjs)
Đa số hỏi xoáy về những gì đã làm trên CV, hỏi kĩ và giải thích ưu nhược điểm (tiếng việt)

3. FPT Software
Vị trí: Junior Frontend Engineer (Reactjs)
Phỏng vấn tiếng Anh nhẹ nhàng.

4. DXC
Vị trí: Nodejs Developer
Single thread vs multithread trong Nodejs khác nhau như thế nào?
Tại sao sử dụng Nodejs và điểm mạnh của nó là gì?
`;

  const sections16296010 = parsePostIntoCompanySections('post-16296010', post16296010Text);
  const sections16324664 = parsePostIntoCompanySections('post-16324664', post16324664Text);

  // Test A
  if (sections16296010.length === 5 && sections16296010[1].company === 'AxonActive' && sections16296010[0].company === 'OneMount') {
    console.log('  ✓ PASS Test A: Post 16296010 correctly split into 5 distinct company sections.');
  } else {
    console.error(`  ✕ FAIL Test A: Expected 5 sections for post 16296010, got ${sections16296010.length}`);
    failures++;
  }

  // Test B
  const java8Section = sections16296010.find((s) => s.sectionText.includes('Java 8 có gì mới/mạnh'));
  if (java8Section && java8Section.company === 'AxonActive') {
    console.log('  ✓ PASS Test B: Java 8 question correctly attributed to AxonActive.');
  } else {
    console.error(`  ✕ FAIL Test B: Expected AxonActive for Java 8 question, got ${java8Section?.company}`);
    failures++;
  }

  // Test C
  const excSection = sections16296010.find((s) => s.sectionText.includes('Exception handling lưu ý gì'));
  if (excSection && excSection.company === 'AxonActive') {
    console.log('  ✓ PASS Test C: Exception Handling question correctly attributed to AxonActive.');
  } else {
    console.error(`  ✕ FAIL Test C: Expected AxonActive for Exception Handling, got ${excSection?.company}`);
    failures++;
  }

  // Test D
  const techChoiceSection = sections16296010.find((s) => s.sectionText.includes('tại sao chọn công nghệ này công nghệ kia'));
  if (techChoiceSection && techChoiceSection.company === 'Orange Logic') {
    console.log('  ✓ PASS Test D: Tech choice question correctly attributed to Orange Logic.');
  } else {
    console.error(`  ✕ FAIL Test D: Expected Orange Logic for tech choice question, got ${techChoiceSection?.company}`);
    failures++;
  }

  // Test E
  const fixBugSection = sections16296010.find((s) => s.sectionText.includes('Kinh nghiệm 1 lần fix bug'));
  if (fixBugSection && fixBugSection.company === 'Orange Logic') {
    console.log('  ✓ PASS Test E: Fix bug experience correctly attributed to Orange Logic.');
  } else {
    console.error(`  ✕ FAIL Test E: Expected Orange Logic for fix bug experience, got ${fixBugSection?.company}`);
    failures++;
  }

  // Test F
  const cvSection = sections16324664.find((s) => s.sectionText.includes('hỏi xoáy về những gì đã làm trên CV'));
  if (cvSection && cvSection.company === 'Nexon Dev Vina') {
    console.log('  ✓ PASS Test F: CV pros/cons question correctly attributed to Nexon Dev Vina.');
  } else {
    console.error(`  ✕ FAIL Test F: Expected Nexon Dev Vina for CV question, got ${cvSection?.company}`);
    failures++;
  }

  // Test G
  const stSection = sections16324664.find((s) => s.sectionText.includes('Single thread vs multithread'));
  if (stSection && stSection.company === 'DXC') {
    console.log('  ✓ PASS Test G: Single thread vs multithread question correctly attributed to DXC.');
  } else {
    console.error(`  ✕ FAIL Test G: Expected DXC for single thread question, got ${stSection?.company}`);
    failures++;
  }

  // Test H
  const nodeSection = sections16324664.find((s) => s.sectionText.includes('Tại sao sử dụng Nodejs'));
  if (nodeSection && nodeSection.company === 'DXC') {
    console.log('  ✓ PASS Test H: Why Node.js question correctly attributed to DXC.');
  } else {
    console.error(`  ✕ FAIL Test H: Expected DXC for why Node.js question, got ${nodeSection?.company}`);
    failures++;
  }

  // Test I
  if (sections16296010[1].location === null) {
    console.log('  ✓ PASS Test I: Absent location correctly defaults to null.');
  } else {
    console.error(`  ✕ FAIL Test I: Location expected null, got ${sections16296010[1].location}`);
    failures++;
  }

  // Test J
  const section1Text = sections16296010[0].sectionText;
  const containsAxonInSec1 = section1Text.includes('AxonActive');
  if (!containsAxonInSec1) {
    console.log('  ✓ PASS Test J: New company heading (AxonActive) correctly closed section 1 (OneMount).');
  } else {
    console.error('  ✕ FAIL Test J: Section 1 failed to close before AxonActive.');
    failures++;
  }

  console.log('===========================================================');
  if (failures === 0) {
    console.log('ALL COMPANY SECTION BOUNDARY REGRESSION TESTS PASSED (10/10)');
  } else {
    console.error(`TESTS COMPLETED WITH ${failures} FAILURES`);
    process.exit(1);
  }
}

runCompanySectionBoundaryTests();
