import { useState, useEffect, useCallback } from 'react';
import { Question } from '../types/question';
import { questionService } from '../services/questionService';

export function useQuestionDetail(questionId: string | undefined) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [relatedQuestions, setRelatedQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);

  const fetchDetail = useCallback(async () => {
    if (!questionId) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setIsNotFound(false);

    try {
      const q = await questionService.getQuestionById(questionId);

      if (!q) {
        setIsNotFound(true);
        setQuestion(null);
        setRelatedQuestions([]);
      } else {
        setQuestion(q);
        const related = await questionService.getRelatedQuestions(q.id, q.category, 3);
        setRelatedQuestions(related);
      }
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [questionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    question,
    relatedQuestions,
    isLoading,
    isError,
    isNotFound,
    refetch: fetchDetail,
  };
}
