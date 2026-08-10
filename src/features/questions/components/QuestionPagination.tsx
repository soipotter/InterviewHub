import React from 'react';
import { Button } from '../../../components/ui/Button';

export interface QuestionPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const QuestionPagination: React.FC<QuestionPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      className="flex items-center justify-between gap-4 py-4 border-t border-slate-800 text-xs"
      aria-label="Question Bank Pagination"
    >
      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Go to previous page"
      >
        ← Previous
      </Button>

      <div className="flex items-center gap-1 font-mono">
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-8 w-8 rounded-md font-semibold transition-colors cursor-pointer ${
              p === currentPage
                ? 'bg-indigo-600 text-white shadow-subtle'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
            }`}
            aria-current={p === currentPage ? 'page' : undefined}
            aria-label={`Page ${p}`}
          >
            {p}
          </button>
        ))}
      </div>

      <Button
        variant="secondary"
        size="sm"
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Go to next page"
      >
        Next →
      </Button>
    </nav>
  );
};
