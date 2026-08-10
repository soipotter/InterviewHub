import React from 'react';
import {
  Category,
  Difficulty,
  QuestionFilters as IQuestionFilters,
  QuestionType,
} from '../types/question';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';

export interface QuestionFiltersProps {
  filters: IQuestionFilters;
  onCategoryChange: (category: Category | 'All') => void;
  onDifficultyChange: (difficulty: Difficulty | 'All') => void;
  onTypeChange: (type: QuestionType | 'All') => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
}

const CATEGORY_OPTIONS: Array<{ value: Category | 'All'; label: string }> = [
  { value: 'All', label: 'All Categories' },
  { value: 'HTML', label: 'HTML & Accessibility' },
  { value: 'CSS', label: 'CSS Layouts' },
  { value: 'JavaScript', label: 'JavaScript (ES6+)' },
  { value: 'React', label: 'React Framework' },
  { value: 'TypeScript', label: 'TypeScript' },
  { value: 'Web Fundamentals', label: 'Web Fundamentals' },
  { value: 'Git', label: 'Git & Version Control' },
];

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty | 'All'; label: string }> = [
  { value: 'All', label: 'All Difficulties' },
  { value: 'Beginner', label: 'Beginner' },
  { value: 'Junior', label: 'Junior' },
  { value: 'Intermediate', label: 'Intermediate' },
];

const TYPE_OPTIONS: Array<{ value: QuestionType | 'All'; label: string }> = [
  { value: 'All', label: 'All Question Types' },
  { value: 'Multiple Choice', label: 'Multiple Choice' },
  { value: 'True/False', label: 'True / False' },
];

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  filters,
  onCategoryChange,
  onDifficultyChange,
  onTypeChange,
  onClearFilters,
  hasActiveFilters,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
        <Select
          value={filters.category || 'All'}
          onChange={(e) => onCategoryChange(e.target.value as Category | 'All')}
          options={CATEGORY_OPTIONS}
          aria-label="Filter by Category"
        />
        <Select
          value={filters.difficulty || 'All'}
          onChange={(e) => onDifficultyChange(e.target.value as Difficulty | 'All')}
          options={DIFFICULTY_OPTIONS}
          aria-label="Filter by Difficulty"
        />
        <Select
          value={filters.type || 'All'}
          onChange={(e) => onTypeChange(e.target.value as QuestionType | 'All')}
          options={TYPE_OPTIONS}
          aria-label="Filter by Question Type"
        />
      </div>

      {hasActiveFilters && (
        <Button
          variant="outline"
          size="md"
          onClick={onClearFilters}
          className="sm:w-auto text-xs whitespace-nowrap"
        >
          Clear Filters ✕
        </Button>
      )}
    </div>
  );
};
