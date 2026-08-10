import { useState, useEffect, useCallback } from 'react';
import { Question, QuestionFilters, QuestionResponse } from '../types/question';
import { questionService } from '../services/questionService';

export function useQuestions(filters: QuestionFilters) {
  const [data, setData] = useState<QuestionResponse>({
    data: [],
    total: 0,
    page: 1,
    totalPages: 1,
    pageSize: 10,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);

  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const res = await questionService.getQuestions(filters);
      setData(res);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const isEmpty = !isLoading && !isError && data.data.length === 0;

  return {
    questions: data.data as Question[],
    total: data.total,
    page: data.page,
    totalPages: data.totalPages,
    pageSize: data.pageSize,
    isLoading,
    isError,
    isEmpty,
    refetch: fetchQuestions,
  };
}
