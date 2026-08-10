import React from 'react';
import { Question } from '../types/question';
import { QuestionCard } from './QuestionCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Button } from '../../../components/ui/Button';

export interface QuestionListProps {
  questions: Question[];
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  onRetry?: () => void;
  onClearFilters?: () => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  isLoading,
  isError,
  isEmpty,
  onRetry,
  onClearFilters,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="text" width="20%" />
            </div>
            <Skeleton variant="text" width="85%" height="24px" />
            <Skeleton variant="rectangular" height="40px" />
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
              <Skeleton variant="text" width="40%" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Failed to Load Questions"
        message="An unexpected error occurred while retrieving technical questions. Please try again."
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return (
      <EmptyState
        title="No Questions Match Your Criteria"
        description="Try clearing your search query or selecting different category and difficulty filters."
        action={
          onClearFilters ? (
            <Button variant="secondary" size="sm" onClick={onClearFilters}>
              Reset All Filters
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} />
      ))}
    </div>
  );
};
