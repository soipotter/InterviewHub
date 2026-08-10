import React from 'react';
import { Question } from '../../questions/types/question';

export interface QuizQuestionProps {
  question: Question;
  selectedOption?: string;
  onSelectOption: (optionText: string) => void;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedOption,
  onSelectOption,
}) => {
  const options =
    question.options && question.options.length > 0 ? question.options : ['True', 'False'];

  return (
    <div className="flex flex-col gap-6 text-left py-4">
      {/* Question Title & Topic Header */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-mono text-slate-400">
          Topic: <strong className="text-slate-300">{question.topic}</strong>
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
          {question.title}
        </h2>
      </div>

      {/* Answer Options Container */}
      <div className="flex flex-col gap-3">
        <span className="text-xs font-mono text-slate-400">Select an option below:</span>

        <div className="flex flex-col gap-3">
          {options.map((optionText, idx) => {
            const isSelected = selectedOption === optionText;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => onSelectOption(optionText)}
                className={`w-full flex items-start gap-3.5 p-4 rounded-xl border text-sm text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-950/50 text-white shadow-subtle ring-1 ring-indigo-500'
                    : 'border-slate-800 bg-slate-900/70 hover:border-slate-700 text-slate-200 hover:bg-slate-900'
                }`}
                aria-checked={isSelected}
                role="radio"
              >
                <div
                  className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 font-mono text-xs font-bold transition-colors ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-600 text-white'
                      : 'border-slate-700 bg-slate-800 text-slate-400'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </div>
                <span className="flex-1 leading-relaxed">{optionText}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
