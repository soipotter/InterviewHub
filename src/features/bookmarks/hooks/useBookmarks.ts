import { useState, useEffect, useCallback } from 'react';
import { Question } from '../../questions/types/question';
import { useAuth } from '../../auth/hooks/useAuth';
import { bookmarkService } from '../services/bookmarkService';

export function useBookmarks() {
  const { user } = useAuth();
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBookmarks = useCallback(async () => {
    setIsLoading(true);
    try {
      const questions = await bookmarkService.getBookmarkedQuestions(user?.id);
      setBookmarkedQuestions(questions);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const removeBookmark = useCallback(
    async (questionId: string) => {
      await bookmarkService.removeBookmark(user?.id, questionId);
      setBookmarkedQuestions((prev) => prev.filter((q) => q.id !== questionId));
    },
    [user?.id]
  );

  return {
    bookmarkedQuestions,
    isLoading,
    removeBookmark,
    refetch: fetchBookmarks,
  };
}
