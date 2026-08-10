import { Category } from '../../questions/types/question';
import { practiceService } from '../../practice/services/practiceService';
import {
  CategoryProgressItem,
  ProgressData,
  ProgressSummaryStats,
  WeakTopicInfo,
} from '../types/progress';

const ALL_CATEGORIES: Category[] = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'TypeScript',
  'Web Fundamentals',
  'Git',
];

export const progressService = {
  /**
   * Calculates overall progress metrics, category accuracy, weak topics, and recent attempts from Supabase
   */
  async getProgressData(userId?: string): Promise<ProgressData> {
    const attempts = await practiceService.getUserAttempts(userId);

    let totalAnswered = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    const categoryMap = new Map<Category, { correct: number; total: number }>();
    ALL_CATEGORIES.forEach((cat) => categoryMap.set(cat, { correct: 0, total: 0 }));

    attempts.forEach((attempt) => {
      totalAnswered += attempt.totalQuestions;
      correctAnswers += attempt.correctAnswersCount;
      incorrectAnswers += attempt.incorrectAnswersCount;

      attempt.questionResults.forEach((qr) => {
        const existing = categoryMap.get(qr.category) || { correct: 0, total: 0 };
        existing.total += 1;
        if (qr.isCorrect) existing.correct += 1;
        categoryMap.set(qr.category, existing);
      });
    });

    const overallAccuracy =
      totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;

    const summary: ProgressSummaryStats = {
      totalAnswered,
      correctAnswers,
      incorrectAnswers,
      overallAccuracy,
    };

    const categoryProgress: CategoryProgressItem[] = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        correct: data.correct,
        total: data.total,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      })
    );

    // Weak topics diagnostic rule: accuracy < 70% AND total >= 3 evaluated questions
    const weakTopics: WeakTopicInfo[] = categoryProgress.filter(
      (cp) => cp.total >= 3 && cp.accuracy < 70
    );

    return {
      summary,
      categoryProgress,
      weakTopics,
      recentAttempts: attempts,
    };
  },
};
