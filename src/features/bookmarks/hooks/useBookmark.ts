import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { bookmarkService } from '../services/bookmarkService';
import { invalidateDashboardCache } from '../../dashboard/hooks/useDashboard';

export function useBookmark(questionId: string) {
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const status = await bookmarkService.isBookmarked(user?.id, questionId);
      setIsBookmarked(status);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, questionId]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const toggleBookmark = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isBookmarked) {
        await bookmarkService.removeBookmark(user?.id, questionId);
        setIsBookmarked(false);
      } else {
        await bookmarkService.addBookmark(user?.id, questionId);
        setIsBookmarked(true);
      }
      invalidateDashboardCache();
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, questionId, isBookmarked]);

  return {
    isBookmarked,
    isLoading,
    toggleBookmark,
  };
}
