import React from 'react';

export interface DailyChallengeProgressProps {
  currentIndex: number;
  totalQuestions: number;
  selectedAnswers: Record<string, string>;
  questionIds: string[];
}

export const DailyChallengeProgress: React.FC<DailyChallengeProgressProps> = ({
  currentIndex,
  totalQuestions,
  selectedAnswers,
  questionIds,
}) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-300 font-semibold">
          Question <span className="text-white font-mono">{currentIndex + 1}</span> of{' '}
          <span className="text-white font-mono">{totalQuestions}</span>
        </span>
        <span className="text-xs font-mono text-slate-400">
          {Object.keys(selectedAnswers).length} / {totalQuestions} answered
        </span>
      </div>

      {/* Dot progress indicators */}
      <div className="flex items-center gap-2" role="list" aria-label="Question progress">
        {questionIds.map((qId, idx) => {
          const isAnswered = Boolean(selectedAnswers[qId]);
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={qId}
              role="listitem"
              aria-label={`Question ${idx + 1}: ${isAnswered ? 'answered' : 'unanswered'}${isCurrent ? ', current' : ''}`}
              className={`h-2.5 rounded-full transition-all duration-200 ${
                isCurrent
                  ? 'w-6 bg-indigo-500'
                  : isAnswered
                    ? 'w-2.5 bg-emerald-500'
                    : 'w-2.5 bg-slate-700'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
