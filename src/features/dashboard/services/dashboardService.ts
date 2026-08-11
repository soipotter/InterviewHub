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
   * Aggregates real dashboard metrics concurrently from Supabase.
   *
   * Lifetime aggregate stats (questionsCompleted, overallAccuracy, practiceAttempts,
   * categoryStats) use the FULL user history via lightweight aggregate queries.
   *
   * Recent Attempts list is limited to 5 with full detail (questionResults).
   *
   * All queries run concurrently via Promise.all — no N+1.
   */
  async getDashboardData(userId?: string): Promise<DashboardData> {
    const [bookmarkedIds, recentAttempts, dailyStats, aggregates, categoryBreakdown] =
      await Promise.all([
        bookmarkService.getBookmarkedQuestionIds(userId),
        practiceService.getUserAttempts(userId, 5),
        userId
          ? dailyChallengeService.getUserDailyChallengeStats(userId)
          : Promise.resolve(null),
        userId
          ? practiceService.getAttemptAggregates(userId)
          : Promise.resolve(null),
        userId
          ? practiceService.getCategoryBreakdown(userId)
          : Promise.resolve([]),
      ]);

    // Lifetime stats from full-history aggregates (not limited to 5)
    const questionsCompleted = aggregates?.questionsCompleted ?? 0;
    const totalCorrect = aggregates?.totalCorrect ?? 0;
    const overallAccuracy =
      questionsCompleted > 0
        ? Math.round((totalCorrect / questionsCompleted) * 100)
        : 0;

    const stats: DashboardSummaryStats = {
      questionsCompleted,
      overallAccuracy,
      bookmarkedCount: bookmarkedIds.length,
      practiceAttempts: aggregates?.practiceAttempts ?? 0,
    };

    // Category stats from full-history breakdown
    const categoryMap = new Map<Category, { correct: number; total: number }>();
    ALL_CATEGORIES.forEach((cat) => categoryMap.set(cat, { correct: 0, total: 0 }));

    categoryBreakdown.forEach((item) => {
      const cat = item.category as Category;
      if (categoryMap.has(cat)) {
        categoryMap.set(cat, { correct: item.correct, total: item.total });
      }
    });

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
      recentAttempts: recentAttempts.slice(0, 5),
      categoryStats,
      dailyChallengeStats: dailyStats ?? undefined,
    };
  },
};
