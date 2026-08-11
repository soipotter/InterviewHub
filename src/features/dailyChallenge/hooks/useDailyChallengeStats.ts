import { useState, useEffect, useCallback } from 'react';
import { DailyChallengeStats } from '../types/dailyChallenge';
import { dailyChallengeService } from '../services/dailyChallengeService';

export interface UseDailyChallengeStatsReturn {
  stats: DailyChallengeStats | null;
  isLoading: boolean;
  refresh: () => void;
}

export function useDailyChallengeStats(
  userId: string | null,
  challengeId?: string
): UseDailyChallengeStatsReturn {
  const [stats, setStats] = useState<DailyChallengeStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (!userId) {
      setStats(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    dailyChallengeService
      .getUserDailyChallengeStats(userId, challengeId)
      .then((s) => {
        if (isMounted) {
          setStats(s);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, challengeId, tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  return { stats, isLoading, refresh };
}
