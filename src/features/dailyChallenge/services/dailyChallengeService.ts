import { supabase } from '../../../services/supabase';
import { DbQuestionRow, mapRowToQuestion } from '../../questions/utils/mapQuestion';
import {
  DailyChallenge,
  DailyChallengeCompletion,
  DailyChallengeQuestion,
  DailyChallengeSubmitAnswer,
  DailyChallengeSubmitResult,
  DailyChallengeStats,
} from '../types/dailyChallenge';
import { computeStreak, getUtcTodayString } from '../utils/streakUtils';

export const dailyChallengeService = {
  /**
   * Fetches today's UTC 5-question Daily Challenge from Supabase RPC.
   * Publicly accessible to both anonymous visitors and authenticated users.
   */
  async getDailyChallenge(): Promise<DailyChallenge | null> {
    const { data, error } = await supabase.rpc('get_daily_challenge');

    if (error || !data) {
      console.error('[InterviewHub] Error fetching Daily Challenge from Supabase:', error);
      return null;
    }

    const payload = data as {
      id: string;
      challengeDate: string;
      createdAt: string;
      questions: Array<{
        position: number;
        question: DbQuestionRow;
      }>;
    };

    const questions: DailyChallengeQuestion[] = (payload.questions || []).map((qItem) => ({
      position: qItem.position,
      question: mapRowToQuestion(qItem.question),
    }));

    return {
      id: payload.id,
      challengeDate: payload.challengeDate,
      createdAt: payload.createdAt,
      questions,
    };
  },

  /**
   * Submits an authenticated Daily Challenge attempt atomically via RPC.
   * One call atomically writes: quiz_attempts, 5 quiz_answers, daily_challenge_completions.
   * Database computes authoritative correctness scores.
   */
  async submitDailyChallenge(
    challengeId: string,
    answers: DailyChallengeSubmitAnswer[],
    startedAt: Date
  ): Promise<DailyChallengeSubmitResult> {
    const { data, error } = await supabase.rpc('submit_daily_challenge', {
      p_challenge_id: challengeId,
      p_answers: answers,
      p_started_at: startedAt.toISOString(),
    });

    if (error) {
      console.error('[InterviewHub] RPC error submitting Daily Challenge:', error);
      throw new Error(error.message || 'Failed to submit Daily Challenge');
    }

    const row = data as {
      completionId: string;
      attemptId: string;
      challengeId: string;
      challengeDate: string;
      correctCount: number;
      incorrectCount: number;
      scorePercentage: number;
      alreadyCompleted: boolean;
    };

    return {
      completionId: row.completionId,
      attemptId: row.attemptId,
      challengeId: row.challengeId,
      challengeDate: row.challengeDate,
      correctCount: row.correctCount,
      incorrectCount: row.incorrectCount,
      scorePercentage: row.scorePercentage,
      alreadyCompleted: row.alreadyCompleted,
    };
  },

  /**
   * Gets today's completion record for an authenticated user, if it exists.
   * Used to restore persisted result on page load.
   */
  async getTodayCompletion(
    userId: string,
    challengeId: string
  ): Promise<DailyChallengeCompletion | null> {
    if (!userId || !challengeId) return null;

    const { data, error } = await supabase
      .from('daily_challenge_completions')
      .select('*, daily_challenges(challenge_date)')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    if (error || !data) return null;

    const dc = data as {
      id: string;
      user_id: string;
      challenge_id: string;
      attempt_id: string;
      completed_at: string;
      daily_challenges?: { challenge_date?: string } | null;
    };

    return {
      id: dc.id,
      userId: dc.user_id,
      challengeId: dc.challenge_id,
      attemptId: dc.attempt_id,
      completedAt: dc.completed_at,
      challengeDate: dc.daily_challenges?.challenge_date ?? undefined,
    };
  },

  /**
   * Retrieves completed Daily Challenge records for the specified user from Supabase.
   */
  async getUserDailyChallengeCompletions(userId?: string): Promise<DailyChallengeCompletion[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('daily_challenge_completions')
      .select('*, daily_challenges(challenge_date)')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error || !data) return [];

    return (
      data as Array<{
        id: string;
        user_id: string;
        challenge_id: string;
        attempt_id: string;
        completed_at: string;
        daily_challenges?: { challenge_date?: string } | null;
      }>
    ).map((item) => ({
      id: item.id,
      userId: item.user_id,
      challengeId: item.challenge_id,
      attemptId: item.attempt_id,
      completedAt: item.completed_at,
      challengeDate: item.daily_challenges?.challenge_date ?? undefined,
    }));
  },

  /**
   * Computes DailyChallengeStats (streak, totalCompletions, completedToday)
   * from the user's full completion history.
   */
  async getUserDailyChallengeStats(
    userId: string,
    todayChallengeId?: string
  ): Promise<DailyChallengeStats> {
    const completions = await this.getUserDailyChallengeCompletions(userId);

    const today = getUtcTodayString();
    const completedToday = todayChallengeId
      ? completions.some((c) => c.challengeId === todayChallengeId)
      : completions.some((c) => c.challengeDate === today);

    const dates = completions.map((c) => c.challengeDate).filter((d): d is string => Boolean(d));

    const { currentStreak, longestStreak } = computeStreak(dates, today);

    return {
      currentStreak,
      longestStreak,
      completedToday,
      totalCompletions: completions.length,
    };
  },
};
