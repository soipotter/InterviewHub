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

  // Known company dictionary for precise matching
  const knownCompanies = [
    'OneMount', 'VinID', 'AxonActive', 'Trusting Social', 'Tiki', 'Orange Logic',
    'Sun Asterisk', 'Sun*', 'Nexon Dev Vina', 'Nexon', 'FPT Software', 'FPT', 'DXC',
    'Shopee', 'VNG', 'VNPay', 'Grab', 'MoMo', 'VinBrain', 'Viettel', 'Zalo',
    'NashTech', 'Viet** Cyber Security', 'Splus Software Vietnam', 'Netcompany', 'HCL'
  ];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Pattern 1: Numbered list headers (e.g., "1. OneMount (VinID)", "2. AxonActive", "3. FPT Software")
    const numberedMatch = trimmed.match(/^(?:\d+[\s.)|-]+|\*[\s|-]+)([A-Z0-9][A-Za-z0-9\s*()_-]{2,40})/);
    if (numberedMatch) {
      const candidateStr = numberedMatch[1].trim();
      for (const comp of knownCompanies) {
        if (new RegExp(`\\b${comp.replace(/\*/g, '\\*')}\\b`, 'i').test(candidateStr)) {
          // Extract role if present in same line or next line
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

    // Pattern 2: Explicit key-value headers (e.g., "Tên Công Ty: OneMount", "Công ty: AxonActive")
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

  // If no company headings found, return single section for the whole post
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

    // Location ONLY if explicitly mentioned in authored text (e.g. "office HCM")
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

  // Build section objects for multi-company posts
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
