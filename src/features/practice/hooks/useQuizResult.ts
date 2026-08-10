import { useState, useEffect } from 'react';
import { QuizAttemptResult } from '../types/practice';
import { practiceService } from '../services/practiceService';

export function useQuizResult(attemptId: string | undefined) {
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  useEffect(() => {
    if (!attemptId) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    practiceService
      .getAttemptResult(attemptId)
      .then((loaded) => {
        if (isMounted) {
          if (!loaded) {
            setIsNotFound(true);
            setResult(null);
          } else {
            setResult(loaded);
            setIsNotFound(false);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsNotFound(true);
          setResult(null);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [attemptId]);

  return {
    result,
    isLoading,
    isNotFound,
  };
}
