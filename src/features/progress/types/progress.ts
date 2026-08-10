import { Category } from '../../questions/types/question';
import { QuizAttemptResult } from '../../practice/types/practice';

export interface ProgressSummaryStats {
  totalAnswered: number;
  correctAnswers: number;
  incorrectAnswers: number;
  overallAccuracy: number;
}

export interface CategoryProgressItem {
  category: Category;
  correct: number;
  total: number;
  accuracy: number;
}

export interface WeakTopicInfo {
  category: Category;
  correct: number;
  total: number;
  accuracy: number;
}

export interface ProgressData {
  summary: ProgressSummaryStats;
  categoryProgress: CategoryProgressItem[];
  weakTopics: WeakTopicInfo[];
  recentAttempts: QuizAttemptResult[];
}
