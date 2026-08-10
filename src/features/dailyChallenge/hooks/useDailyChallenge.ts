import { useState, useEffect } from 'react';
import { DailyChallenge } from '../types/dailyChallenge';
import { dailyChallengeService } from '../services/dailyChallengeService';

export interface UseDailyChallengeReturn {
  challenge: DailyChallenge | null;
  isLoading: boolean;
  error: string | null;
}

export function useDailyChallenge(): UseDailyChallengeReturn {
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    dailyChallengeService
      .getDailyChallenge()
      .then((data) => {
        if (!isMounted) return;
        if (!data) {
          setError("Failed to load today's Daily Challenge. Please try again.");
          setChallenge(null);
        } else if (data.questions.length !== 5) {
          setError(
            `Invalid challenge: expected 5 questions, received ${data.questions.length}. Please try again later.`
          );
          setChallenge(null);
        } else {
          setChallenge(data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setError('An unexpected error occurred while loading the Daily Challenge.');
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return { challenge, isLoading, error };
}
