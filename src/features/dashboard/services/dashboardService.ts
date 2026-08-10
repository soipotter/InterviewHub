import { Category } from '../../questions/types/question';
import { practiceService } from '../../practice/services/practiceService';
import { bookmarkService } from '../../bookmarks/services/bookmarkService';
import { dailyChallengeService } from '../../dailyChallenge/services/dailyChallengeService';
import { DashboardCategoryStat, DashboardData, DashboardSummaryStats } from '../types/dashboard';

const ALL_CATEGORIES: Category[] = [
  'HTML',
  'CSS',
  'JavaScript',
  'React',
  'TypeScript',
  'Web Fundamentals',
  'Git',
];

export const dashboardService = {
  /**
   * Aggregates real dashboard metrics from Supabase bookmarks, practice attempts,
   * and Daily Challenge completion history.
   */
  async getDashboardData(userId?: string): Promise<DashboardData> {
    const [bookmarkedIds, attempts, dailyStats] = await Promise.all([
      bookmarkService.getBookmarkedQuestionIds(userId),
      practiceService.getUserAttempts(userId),
      userId ? dailyChallengeService.getUserDailyChallengeStats(userId) : Promise.resolve(null),
    ]);

    const practiceAttempts = attempts.length;
    let totalQuestionsAnswered = 0;
    let totalCorrectCount = 0;

    const categoryMap = new Map<Category, { correct: number; total: number }>();
    ALL_CATEGORIES.forEach((cat) => categoryMap.set(cat, { correct: 0, total: 0 }));

    attempts.forEach((attempt) => {
      totalQuestionsAnswered += attempt.totalQuestions;
      totalCorrectCount += attempt.correctAnswersCount;

      attempt.questionResults.forEach((qr) => {
        const existing = categoryMap.get(qr.category) || { correct: 0, total: 0 };
        existing.total += 1;
        if (qr.isCorrect) existing.correct += 1;
        categoryMap.set(qr.category, existing);
      });
    });

    const overallAccuracy =
      totalQuestionsAnswered > 0
        ? Math.round((totalCorrectCount / totalQuestionsAnswered) * 100)
        : 0;

    const stats: DashboardSummaryStats = {
      questionsCompleted: totalQuestionsAnswered,
      overallAccuracy,
      bookmarkedCount: bookmarkedIds.length,
      practiceAttempts,
    };

    const categoryStats: DashboardCategoryStat[] = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        correct: data.correct,
        total: data.total,
        accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      })
    );

    return {
      stats,
      recentAttempts: attempts.slice(0, 5),
      categoryStats,
      dailyChallengeStats: dailyStats ?? undefined,
    };
  },
};
