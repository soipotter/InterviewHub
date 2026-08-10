export type Category =
  'HTML' | 'CSS' | 'JavaScript' | 'React' | 'TypeScript' | 'Web Fundamentals' | 'Git';

export type Difficulty = 'Beginner' | 'Junior' | 'Intermediate';

export type QuestionType = 'Multiple Choice' | 'True/False';

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
