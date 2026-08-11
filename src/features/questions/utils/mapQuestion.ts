import { Category, Difficulty, Question, QuestionSource, QuestionType } from '../types/question';

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
}

export interface DbQuestionRow {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  short_summary: string;
  explanation?: string | null;
  code_snippet?: string | null;
  interview_tip?: string | null;
  options?: string[] | null;
  correct_answer?: string | null;
  model_answer?: string | null;
  tags: string[];
  sources?: QuestionSource[] | null;
  estimated_minutes: number;
  status: string;
  categories?: DbCategory | DbCategory[] | null;
}

/**
 * Maps PostgreSQL database snake_case row to canonical frontend Question model.
 */
export function mapRowToQuestion(row: DbQuestionRow): Question {
  const categoryData = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const categoryName = (categoryData?.name as Category) || 'HTML';

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    category: categoryName,
    topic: row.topic,
    difficulty: row.difficulty,
    type: row.type,
    shortSummary: row.short_summary,
    tags: row.tags || [],
    estimatedMinutes: row.estimated_minutes || 3,
    options: row.options || undefined,
    correctAnswer: row.correct_answer || undefined,
    modelAnswer: row.model_answer || undefined,
    explanationMarkdown: row.explanation || undefined,
    interviewTip: row.interview_tip || undefined,
    codeSnippet: row.code_snippet || undefined,
    sources: row.sources || undefined,
  };
}
