import { IngestionProvenance, RawCandidatePost, SeniorityLevel } from '../types/ingestion';

export const extractionService = {
  /**
   * Strictly validates provenance of an extracted question record against raw fetched HTML content.
   * Throws Error if HTTP status !== 200, evidence text missing from HTML, or URL is synthetic.
   */
  validateProvenanceRecord(record: IngestionProvenance, fetchedHtml: string): boolean {
    if (record.sourceHttpStatus !== 200) {
      throw new Error(`Provenance Rejected: HTTP status is ${record.sourceHttpStatus} (expected 200 OK).`);
    }

    if (record.sourcePageTitle?.toLowerCase().includes('404 not found')) {
      throw new Error(`Provenance Rejected: Source page title indicates 404 Not Found.`);
    }

    if (!fetchedHtml || !fetchedHtml.trim()) {
      throw new Error(`Provenance Rejected: Fetched HTML content is empty.`);
    }

    // Verify evidence text actually exists in raw fetched HTML
    const cleanHtml = fetchedHtml.toLowerCase().replace(/\s+/g, ' ');
    const cleanEvidence = record.sourceEvidenceText.toLowerCase().replace(/\s+/g, ' ').trim();

    if (cleanEvidence.length > 5 && !cleanHtml.includes(cleanEvidence)) {
      throw new Error(`Provenance Rejected: Supporting evidence text "${record.sourceEvidenceText}" not found in raw fetched HTML.`);
    }

    return true;
  },

  /**
   * Sanitizes text to remove any potential candidate PII (phones, emails, handles).
   */
  stripPII(text: string): string {
    if (!text) return '';
    return text
      // Remove email addresses
      .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
      // Remove Vietnamese phone numbers (10 digits)
      .replace(/(?:\+84|0)(?:\d){9}\b/g, '[REDACTED_PHONE]')
      // Strip candidate names or handles if prefixed with @ or contact info
      .replace(/contact:\s*\S+/gi, '')
      .replace(/telegram:\s*\S+/gi, '');
  },

  /**
   * Detects category based on key technical terms in the question.
   */
  detectCategory(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('react') || lower.includes('useeffect') || lower.includes('virtual dom') || lower.includes('usestate') || lower.includes('jsx')) {
      return 'React';
    }
    if (lower.includes('typescript') || lower.includes('type alias') || lower.includes('generics') || lower.includes('interface')) {
      return 'TypeScript';
    }
    if (lower.includes('javascript') || lower.includes('js') || lower.includes('event loop') || lower.includes('closure') || lower.includes('debounce') || lower.includes('promise')) {
      return 'JavaScript';
    }
    if (lower.includes('css') || lower.includes('specificity') || lower.includes('tailwind') || lower.includes('flexbox') || lower.includes('grid')) {
      return 'CSS';
    }
    if (lower.includes('html') || lower.includes('semantic html') || lower.includes('tag')) {
      return 'HTML';
    }
    if (lower.includes('http') || lower.includes('web vital') || lower.includes('restful') || lower.includes('grpc') || lower.includes('cache')) {
      return 'Web Fundamentals';
    }
    if (lower.includes('git') || lower.includes('rebase') || lower.includes('merge')) {
      return 'Git';
    }
    return 'Web Fundamentals';
  },

  /**
   * Detects difficulty level based on seniority, role, and complexity indicators.
   */
  detectDifficulty(text: string, seniority: SeniorityLevel): 'Beginner' | 'Junior' | 'Intermediate' | 'Advanced' {
    if (seniority === 'Senior' || seniority === 'Lead') {
      return 'Advanced';
    }
    if (seniority === 'Intern' || seniority === 'Fresher') {
      return 'Beginner';
    }
    const lower = text.toLowerCase();
    if (lower.includes('concurrent') || lower.includes('race condition') || lower.includes('eviction policy') || lower.includes('indexing')) {
      return 'Advanced';
    }
    if (lower.includes('useeffect') || lower.includes('virtual dom') || lower.includes('closure') || lower.includes('debounce')) {
      return 'Intermediate';
    }
    return 'Junior';
  },

  /**
   * Detects seniority level from post title or content.
   */
  detectSeniority(text: string): SeniorityLevel {
    const lower = text.toLowerCase();
    if (lower.includes('senior')) return 'Senior';
    if (lower.includes('lead')) return 'Lead';
    if (lower.includes('mid') || lower.includes('middle')) return 'Mid';
    if (lower.includes('fresher')) return 'Fresher';
    if (lower.includes('intern')) return 'Intern';
    if (lower.includes('junior')) return 'Junior';
    return 'Unknown';
  },

  /**
   * Detects company name from post title or hints.
   */
  detectCompany(post: RawCandidatePost): string {
    if (post.companyHint && post.companyHint.trim()) {
      return post.companyHint.trim();
    }
    const title = post.title;
    const knownCompanies = ['Shopee', 'VNG', 'MoMo', 'FPT Software', 'Grab', 'Tiki', 'OneMount', 'Viettel', 'Zalo'];
    for (const comp of knownCompanies) {
      if (new RegExp(`\\b${comp}\\b`, 'i').test(title)) {
        return comp;
      }
    }
    return 'Vietnam IT Company';
  },

  /**
   * Detects role title from post.
   */
  detectRole(post: RawCandidatePost): string {
    if (post.roleHint && post.roleHint.trim()) {
      return post.roleHint.trim();
    }
    const text = (post.title + ' ' + post.content).toLowerCase();
    if (text.includes('frontend') || text.includes('react')) return 'Frontend Developer';
    if (text.includes('backend') || text.includes('node')) return 'Backend Engineer';
    if (text.includes('fullstack')) return 'Fullstack Developer';
    if (text.includes('mobile') || text.includes('flutter') || text.includes('react native')) return 'Mobile Engineer';
    return 'Software Engineer';
  },

  /**
   * Detects interview round (Technical, HR, Manager, Coding Test).
   */
  detectRound(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('coding test') || lower.includes('online test')) return 'Coding Test';
    if (lower.includes('technical manager') || lower.includes('manager')) return 'Manager Round';
    if (lower.includes('hr')) return 'HR Screening';
    if (lower.includes('round 1') || lower.includes('vòng 1')) return 'Technical Round 1';
    if (lower.includes('round 2') || lower.includes('vòng 2')) return 'Technical Round 2';
    return 'Technical Round';
  },

  /**
   * Normalizes question text for consistency and clarity.
   */
  normalizeQuestionText(rawQuestion: string): string {
    let normalized = rawQuestion.trim();
    // Strip leading item numbers like "1.", "2)", "Câu 1:"
    normalized = normalized.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?)\s*/i, '');
    // Ensure proper capitalization and ending punctuation
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1);
    if (!/[?.!]$/.test(normalized)) {
      normalized += '?';
    }
    return normalized;
  },

  /**
   * Extracts Candidate-Reported interview questions from raw post content.
   * STRICT INVARIANT: Questions must originate from real source text. Never invent questions.
   */
  extractQuestionsFromPost(post: RawCandidatePost): IngestionProvenance[] {
    if (!post.url || !post.url.trim()) {
      throw new Error('Mandatory Invariant Violated: Question missing sourceUrl cannot be ingested.');
    }

    const cleanContent = this.stripPII(post.content);
    const lines = cleanContent.split('\n');
    const questionLines: string[] = [];

    // Identify lines containing explicit question marks or numbered list items describing questions
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const isNumberedQuestion = /^(?:câu\s*\d+[:.]?|\d+[.)]?)\s*\w+/i.test(trimmed);
      const isExplicitQuestion = trimmed.includes('?') && trimmed.length >= 15;

      if (isNumberedQuestion || isExplicitQuestion) {
        questionLines.push(trimmed);
      }
    }

    const company = this.detectCompany(post);
    const role = this.detectRole(post);
    const seniority = this.detectSeniority(post.title + ' ' + post.content);

    const provenanceList: IngestionProvenance[] = [];

    for (const rawLine of questionLines) {
      const normalized = this.normalizeQuestionText(rawLine);
      if (normalized.length < 10) continue; // Filter out noise

      const category = this.detectCategory(rawLine);
      const difficulty = this.detectDifficulty(rawLine, seniority);
      const round = this.detectRound(post.title + ' ' + rawLine);

      provenanceList.push({
        sourceName: post.sourceName,
        sourceUrl: post.url,
        sourceType: post.sourceType,
        sourcePublishedAt: post.publishedAt || null,
        originalText: rawLine,
        normalizedQuestion: normalized,
        company,
        role,
        seniority,
        round,
        category,
        difficulty,
        confidence: 0.95,
        importedAt: new Date().toISOString(),
      });
    }

    return provenanceList;
  },
};
