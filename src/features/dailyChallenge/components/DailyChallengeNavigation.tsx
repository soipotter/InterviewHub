import React from 'react';
import { Button } from '../../../components/ui/Button';

export interface DailyChallengeNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export const DailyChallengeNavigation: React.FC<DailyChallengeNavigationProps> = ({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  isSubmitting = false,
}) => {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;

  return (
    <div className="flex items-center justify-between gap-3 pt-2">
      <Button
        variant="outline"
        size="md"
        onClick={onPrevious}
        disabled={isFirst}
        aria-label="Previous question"
        aria-disabled={isFirst}
      >
        ← Previous
      </Button>

      <div className="flex items-center gap-2">
        {!isLast && (
          <Button variant="outline" size="md" onClick={onNext} aria-label="Next question">
            Next →
          </Button>
        )}

        {isLast && (
          <Button
            variant="primary"
            size="md"
            onClick={onSubmit}
            disabled={isSubmitting}
            aria-disabled={isSubmitting}
            id="daily-challenge-submit-btn"
            aria-label="Submit Daily Challenge"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Challenge ✓'}
          </Button>
        )}
      </div>
    </div>
  );
};
