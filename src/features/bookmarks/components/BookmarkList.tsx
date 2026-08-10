import React from 'react';
import { Link } from 'react-router-dom';
import { Question } from '../../questions/types/question';
import { BookmarkCard } from './BookmarkCard';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';

export interface BookmarkListProps {
  questions: Question[];
  isLoading: boolean;
  onRemove: (questionId: string) => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({ questions, isLoading, onRemove }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div
            key={idx}
            className="p-6 rounded-xl border border-slate-800 bg-slate-900/40 flex flex-col gap-4"
          >
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="80%" height="24px" />
            <Skeleton variant="rectangular" height="40px" />
          </div>
        ))}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <EmptyState
        title="Save questions you want to review later."
        description="Click the bookmark icon on any question detail page to build your personal revision list."
        action={
          <Link to="/questions">
            <Button variant="primary" size="sm">
              Browse Questions
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-6">
      {questions.map((q) => (
        <BookmarkCard key={q.id} question={q} onRemove={onRemove} />
      ))}
    </div>
  );
};
