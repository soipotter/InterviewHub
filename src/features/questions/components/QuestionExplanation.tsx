import React, { useState } from 'react';
import { Question } from '../types/question';
import { Button } from '../../../components/ui/Button';
import { Alert } from '../../../components/ui/Alert';

export interface QuestionExplanationProps {
  question: Question;
}

export const QuestionExplanation: React.FC<QuestionExplanationProps> = ({ question }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);

  const hasOptions = question.options && question.options.length > 0;
  const isCorrect = selectedOption === question.correctAnswer;

  return (
    <div className="flex flex-col gap-6 text-left py-4">
      {/* Short Summary Callout Card */}
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-950/20 p-5 backdrop-blur-sm">
        <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1">
          Quick Summary
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed font-medium">
          {question.shortSummary}
        </p>
      </div>

      {/* Answer Options Section */}
      {hasOptions && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="text-sm font-bold text-white">Select Your Answer:</h3>
            <span className="text-xs text-slate-400 font-mono">{question.type}</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {question.options!.map((optionText, idx) => {
              const isSelected = selectedOption === optionText;
              const isCorrectOption = showExplanation && optionText === question.correctAnswer;
              const isIncorrectSelection =
                showExplanation && isSelected && optionText !== question.correctAnswer;

              let optionClasses =
                'border-slate-800 bg-slate-900/80 hover:border-slate-700 text-slate-200';

              if (showExplanation) {
                if (isCorrectOption) {
                  optionClasses =
                    'border-emerald-500/80 bg-emerald-950/30 text-emerald-200 font-semibold';
                } else if (isIncorrectSelection) {
                  optionClasses = 'border-rose-500/80 bg-rose-950/30 text-rose-200';
                }
              } else if (isSelected) {
                optionClasses = 'border-indigo-500 bg-indigo-950/40 text-white font-medium';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedOption(optionText)}
                  className={`w-full flex items-start gap-3 p-3.5 rounded-lg border text-xs text-left transition-all cursor-pointer ${optionClasses}`}
                >
                  <span className="font-mono font-semibold text-slate-400 shrink-0 mt-0.5">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span className="flex-1 leading-relaxed">{optionText}</span>
                  {showExplanation && isCorrectOption && (
                    <span className="text-emerald-400 font-bold text-xs shrink-0">✓ Correct</span>
                  )}
                  {showExplanation && isIncorrectSelection && (
                    <span className="text-rose-400 font-bold text-xs shrink-0">✕ Incorrect</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Reveal / Toggle Explanation Action */}
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-800/80 flex-wrap">
            {selectedOption && showExplanation && (
              <span
                className={`text-xs font-semibold ${isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {isCorrect ? '✓ Correct selection!' : '✕ Incorrect selection.'}
              </span>
            )}
            <Button
              variant={showExplanation ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowExplanation((prev) => !prev)}
              className="ml-auto"
            >
              {showExplanation ? 'Hide Detailed Answer' : 'Show Explanation & Answer'}
            </Button>
          </div>
        </div>
      )}

      {/* Model Answer / Answer Guidance for Subjective Formats */}
      {question.modelAnswer && (
        <div className="flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-950/20 p-5 backdrop-blur-sm">
          <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Model Answer / Answer Guidance
          </h3>
          <div className="text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
            {question.modelAnswer}
          </div>
        </div>
      )}

      {/* Detailed Explanation Section (Revealed or visible if no options) */}
      {(showExplanation || !hasOptions) && (
        <div className="flex flex-col gap-6 pt-2 animate-in fade-in duration-200">
          <div className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
              {hasOptions ? 'Detailed Explanation' : 'Explanation & Key Points'}
            </h2>
            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line font-sans space-y-3">
              {question.explanationMarkdown || question.shortSummary}
            </div>
          </div>

          {/* Code Example Snippet */}
          {question.codeSnippet && (
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-slate-300 font-mono">Code Example:</h3>
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre leading-relaxed shadow-inner">
                <code>{question.codeSnippet}</code>
              </div>
            </div>
          )}

          {/* Interview Tip Callout */}
          {question.interviewTip && (
            <Alert variant="info" title="Interview Tip">
              <p className="text-xs text-slate-300 leading-relaxed">{question.interviewTip}</p>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};
