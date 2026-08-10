import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Category, Difficulty, QuestionFilters, QuestionType } from '../types/question';

export function useQuestionFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters: QuestionFilters = useMemo(() => {
    const q = searchParams.get('q') || undefined;
    const category = (searchParams.get('category') as Category | 'All') || undefined;
    const difficulty = (searchParams.get('difficulty') as Difficulty | 'All') || undefined;
    const type = (searchParams.get('type') as QuestionType | 'All') || undefined;
    const pageParam = searchParams.get('page');
    const page = pageParam ? parseInt(pageParam, 10) : 1;

    return {
      q,
      category,
      difficulty,
      type,
      page: isNaN(page) || page < 1 ? 1 : page,
    };
  }, [searchParams]);

  const updateFilters = (newFilters: Partial<QuestionFilters>, resetPage: boolean = true) => {
    setSearchParams((prevParams) => {
      const nextParams = new URLSearchParams(prevParams);

      Object.entries(newFilters).forEach(([key, val]) => {
        if (val === undefined || val === null || val === '' || val === 'All') {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(val));
        }
      });

      if (resetPage && !('page' in newFilters)) {
        nextParams.delete('page');
      }

      return nextParams;
    });
  };

  const setSearchQuery = (q: string) => {
    updateFilters({ q: q.trim() ? q : undefined });
  };

  const setCategory = (category: Category | 'All') => {
    updateFilters({ category });
  };

  const setDifficulty = (difficulty: Difficulty | 'All') => {
    updateFilters({ difficulty });
  };

  const setType = (type: QuestionType | 'All') => {
    updateFilters({ type });
  };

  const setPage = (page: number) => {
    updateFilters({ page: page > 1 ? page : undefined }, false);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    filters.q ||
    (filters.category && filters.category !== 'All') ||
    (filters.difficulty && filters.difficulty !== 'All') ||
    (filters.type && filters.type !== 'All')
  );

  return {
    filters,
    setSearchQuery,
    setCategory,
    setDifficulty,
    setType,
    setPage,
    clearFilters,
    hasActiveFilters,
  };
}
