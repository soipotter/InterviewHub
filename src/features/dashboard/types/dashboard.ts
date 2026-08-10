import { Category } from '../../questions/types/question';
import { QuizAttemptResult } from '../../practice/types/practice';
import { DailyChallengeStats } from '../../dailyChallenge/types/dailyChallenge';

export interface DashboardSummaryStats {
  questionsCompleted: number;
  overallAccuracy: number;
  bookmarkedCount: number;
  practiceAttempts: number;
}

export interface DashboardCategoryStat {
  category: Category;
  correct: number;
  total: number;
  accuracy: number;
}

export interface DashboardData {
  stats: DashboardSummaryStats;
  recentAttempts: QuizAttemptResult[];
  categoryStats: DashboardCategoryStat[];
  dailyChallengeStats?: DailyChallengeStats;
}
