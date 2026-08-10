import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { useQuestionFilters } from '../features/questions/hooks/useQuestionFilters';
import { useQuestions } from '../features/questions/hooks/useQuestions';
import { QuestionSearch } from '../features/questions/components/QuestionSearch';
import { QuestionFilters } from '../features/questions/components/QuestionFilters';
import { QuestionList } from '../features/questions/components/QuestionList';
import { QuestionPagination } from '../features/questions/components/QuestionPagination';

export const QuestionBankPage: React.FC = () => {
  const {
    filters,
    setSearchQuery,
    setCategory,
    setDifficulty,
    setType,
    setPage,
    clearFilters,
    hasActiveFilters,
  } = useQuestionFilters();

  const { questions, total, page, totalPages, isLoading, isError, isEmpty, refetch } =
    useQuestions(filters);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 text-left pb-12">
        {/* Page Header */}
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Badge variant="default" size="md">
              Frontend Question Bank
            </Badge>
            <span className="text-xs font-mono text-slate-400">
              Showing {questions.length} of {total ?? 0} questions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Technical Interview Questions
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Browse and search vetted frontend technical interview questions across HTML, CSS,
            JavaScript, React, TypeScript, Web Fundamentals, and Git.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
          <QuestionSearch value={filters.q || ''} onSearch={setSearchQuery} />
          <QuestionFilters
            filters={filters}
            onCategoryChange={setCategory}
            onDifficultyChange={setDifficulty}
            onTypeChange={setType}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {/* Active Filters Pill Summary Bar */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-semibold">Active Filters:</span>
            {filters.q && (
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                Query: "{filters.q}"
              </span>
            )}
            {filters.category && filters.category !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                Category: {filters.category}
              </span>
            )}
            {filters.difficulty && filters.difficulty !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                Difficulty: {filters.difficulty}
              </span>
            )}
            {filters.type && filters.type !== 'All' && (
              <span className="inline-flex items-center gap-1 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded font-mono">
                Type: {filters.type}
              </span>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-rose-400 hover:underline font-semibold ml-auto cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* Question List (Cards, Skeletons, Empty, Error) */}
        <QuestionList
          questions={questions}
          isLoading={isLoading}
          isError={isError}
          isEmpty={isEmpty}
          onRetry={refetch}
          onClearFilters={clearFilters}
        />

        {/* Pagination Bar */}
        {!isLoading && !isError && !isEmpty && (
          <QuestionPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>
    </AppShell>
  );
};

export default QuestionBankPage;
