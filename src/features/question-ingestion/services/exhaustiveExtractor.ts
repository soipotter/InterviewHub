import { InterviewReportSection } from './sectionParser';

export interface ExtractedPromptCandidate {
  evidence: string;
  questionEvidence: string;
  answerHintEvidence?: string | null;
  normalizedQuestion: string;
  sectionContext: 'INTERVIEW_QUESTION' | 'INTERVIEW_PROMPT' | 'LIVE_INTERVIEW_CASE_PROMPT' | 'INTERVIEW_TOPIC';
  questionClassification: 'EXPLICIT_QUESTION' | 'SPECIFIC_PROMPT' | 'TOPIC_ONLY';
  questionDirection: 'INTERVIEWER_TO_CANDIDATE' | 'UNKNOWN';
}

export function extractExhaustivePromptsFromSection(
  sec: InterviewReportSection
): ExtractedPromptCandidate[] {
  const candidates: ExtractedPromptCandidate[] = [];
  const lines = sec.sectionText.split('\n').map((l) => l.trim()).filter(Boolean);

  for (const line of lines) {
    if (line.length < 10) continue;
    const lower = line.toLowerCase();

    // Exclude topic lists from splitting
    if (
      lower.includes('java, spring, redis, sql') ||
      lower.includes('kiến thức cơ bản:') ||
      lower.includes('java core, heap and stack')
    ) {
      continue;
    }

    // Split compound clause bullets (e.g. "3 điều trong cuộc sống..., triết lý sống..., đánh giá 1 team member cũ")
    let subClauses: string[] = [line];
    if (line.includes(',') && (lower.includes('triết lý sống') || lower.includes('kinh nghiệm 1 lần fix bug') || lower.includes('gì mới/mạnh'))) {
      subClauses = line.split(/[,;]\s+/).map((c) => c.trim()).filter((c) => c.length >= 8);
    }

    for (const subLine of subClauses) {
      const subLower = subLine.toLowerCase();

      // Separate question from candidate answer hints if present
      let questionEvidence = subLine;
      let answerHintEvidence: string | null = null;
      let norm = subLine.replace(/^(?:câu\s*\d+[:.]?|\d+[.)]?|\*|-)\s*/i, '').trim();

      if (subLine.includes('?') && (subLower.includes('stream api') || subLower.includes('date time api'))) {
        const parts = subLine.split('?');
        questionEvidence = parts[0].trim() + '?';
        answerHintEvidence = parts.slice(1).join('?').trim();
        norm = 'Java 8 có những điểm mới hoặc nổi bật nào?';
      } else {
        norm = norm.charAt(0).toUpperCase() + norm.slice(1);
      }

      // Classification & Direction
      let context: 'INTERVIEW_QUESTION' | 'INTERVIEW_PROMPT' | 'LIVE_INTERVIEW_CASE_PROMPT' | 'INTERVIEW_TOPIC' = 'INTERVIEW_PROMPT';
      let classification: 'EXPLICIT_QUESTION' | 'SPECIFIC_PROMPT' | 'TOPIC_ONLY' = 'SPECIFIC_PROMPT';

      if (subLine.includes('?')) {
        context = 'INTERVIEW_QUESTION';
        classification = 'EXPLICIT_QUESTION';
      } else if (subLower.includes('thiết kế hệ thống') || subLower.includes('bài toán')) {
        context = 'LIVE_INTERVIEW_CASE_PROMPT';
        classification = 'SPECIFIC_PROMPT';
      }

      const isInterviewerToCandidate =
        /hỏi|cho mảng|giải thích|là gì|thế nào|tại sao|như thế nào|trình bày|suy nghĩ|đánh giá|mong đợi|thích/i.test(subLower) ||
        subLine.includes('?');

      if (isInterviewerToCandidate) {
        candidates.push({
          evidence: subLine,
          questionEvidence,
          answerHintEvidence,
          normalizedQuestion: norm,
          sectionContext: context,
          questionClassification: classification,
          questionDirection: 'INTERVIEWER_TO_CANDIDATE',
        });
      }
    }
  }

  return candidates;
}
