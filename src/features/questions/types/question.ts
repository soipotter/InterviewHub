export type Category =
  'HTML' | 'CSS' | 'JavaScript' | 'React' | 'TypeScript' | 'Web Fundamentals' | 'Git';

export type Difficulty = 'Beginner' | 'Junior' | 'Intermediate';

export type QuestionType =
  | 'Multiple Choice'
  | 'True/False'
  | 'Open-ended'
  | 'Coding'
  | 'Scenario'
  | 'multiple_choice'
  | 'true_false'
  | 'open_ended'
  | 'coding'
  | 'scenario';

export type QuestionFormat =
  | 'multiple_choice'
  | 'true_false'
  | 'open_ended'
  | 'coding'
  | 'scenario';

export type SourceClassification =
  | 'actual_question'
  | 'question_with_context'
  | 'not_a_question'
  | 'insufficient_evidence';

export function isAutoScorable(question: { type: string } | string): boolean {
  const typeStr = typeof question === 'string' ? question : question.type;
  if (!typeStr) return false;
  const lower = typeStr.toLowerCase().replace(/[^a-z_]/g, '_');
  return lower === 'multiple_choice' || lower === 'true_false' || typeStr === 'Multiple Choice' || typeStr === 'True/False';
}

export interface QuestionSource {
  name: string;
  url: string;
}

export interface Question {
  id: string;
  title: string;
  slug: string;
  category: Category;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  shortSummary: string;
  tags: string[];
  estimatedMinutes: number;
  // Detail page fields
  options?: string[];
  correctAnswer?: string;
  modelAnswer?: string;
  explanationMarkdown?: string;
  interviewTip?: string;
  codeSnippet?: string;
  sources?: QuestionSource[];
}

export interface QuestionFilters {
  q?: string;
  category?: Category | 'All';
  difficulty?: Difficulty | 'All';
  type?: QuestionType | 'All';
  page?: number;
}

export interface QuestionResponse {
  data: Question[];
  total: number;
  page: number;
  totalPages: number;
  pageSize: number;
}
