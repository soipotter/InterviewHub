import React, { useState } from 'react';
import { QuestionResultItem } from '../types/practice';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';

export interface QuizResultQuestionProps {
  index: number;
  item: QuestionResultItem;
}

export const QuizResultQuestion: React.FC<QuizResultQuestionProps> = ({ index, item }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const isUnanswered = !item.selectedAnswer;

  return (
    <div className="flex flex-col gap-3 p-4 md:p-5 rounded-xl border border-slate-800 bg-slate-900/60 text-left">
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-slate-400">Q{index + 1}.</span>
          <Badge variant="default" size="sm">
            {item.category}
          </Badge>
          <Badge variant="secondary" size="sm">
            {item.difficulty}
          </Badge>
        </div>

        <div>
          {item.isCorrect ? (
            <Badge variant="success" size="sm">
              ✓ Correct
            </Badge>
          ) : isUnanswered ? (
            <Badge variant="warning" size="sm">
              — Unanswered
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              ✕ Incorrect
            </Badge>
          )}
        </div>
      </div>

      {/* Question Title */}
      <h3 className="text-sm md:text-base font-bold text-white leading-snug">
        {item.questionTitle}
      </h3>

      {/* Selected vs Correct Answer Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
        <div
          className={`p-3 rounded-lg border flex flex-col gap-1 ${
            item.isCorrect
              ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
              : isUnanswered
                ? 'border-amber-500/30 bg-amber-950/20 text-amber-200'
                : 'border-rose-500/30 bg-rose-950/20 text-rose-200'
          }`}
        >
          <span className="font-mono text-[11px] font-semibold text-slate-400">
            Your Selection:
          </span>
          <span className="font-medium">{item.selectedAnswer || 'No answer selected'}</span>
        </div>

        <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 text-emerald-200 flex flex-col gap-1">
          <span className="font-mono text-[11px] font-semibold text-emerald-400">
            Correct Answer:
          </span>
          <span className="font-medium">{item.correctAnswer || 'N/A'}</span>
        </div>
      </div>

      {/* Explanation Reveal Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer focus:outline-none"
        >
          {isExpanded ? 'Hide Explanation ▲' : 'Show Explanation Breakdown ▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 pt-2 border-t border-slate-800/80 animate-in fade-in duration-150">
          <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
            {item.explanationMarkdown}
          </div>

          {item.interviewTip && (
            <Alert variant="info" title="Interview Tip">
              <p className="text-xs text-slate-300 leading-relaxed">{item.interviewTip}</p>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
