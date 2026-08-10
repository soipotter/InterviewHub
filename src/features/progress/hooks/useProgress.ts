import { useState, useEffect, useCallback } from 'react';
import { progressService } from '../services/progressService';
import { ProgressData } from '../types/progress';

export function useProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchProgress = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await progressService.getProgressData();
      setData(res);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    data,
    isLoading,
    refetch: fetchProgress,
  };
}
