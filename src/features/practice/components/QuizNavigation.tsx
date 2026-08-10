import React from 'react';
import { Button } from '../../../components/ui/Button';

export interface QuizNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrev: () => void;
  onNext: () => void;
  onFinish: () => void;
}

export const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentIndex,
  totalQuestions,
  onPrev,
  onNext,
  onFinish,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-800">
      <Button
        variant="secondary"
        size="md"
        disabled={isFirst}
        onClick={onPrev}
        aria-label="Previous question"
      >
        ← Previous
      </Button>

      {isLast ? (
        <Button
          variant="primary"
          size="md"
          onClick={onFinish}
          className="bg-emerald-600 hover:bg-emerald-500 font-bold"
          aria-label="Finish Practice"
        >
          Finish Practice ✓
        </Button>
      ) : (
        <Button variant="primary" size="md" onClick={onNext} aria-label="Next question">
          Next →
        </Button>
      )}
    </div>
  );
};
