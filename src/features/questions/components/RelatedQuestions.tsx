import React from 'react';
import { Question } from '../types/question';
import { QuestionCard } from './QuestionCard';

export interface RelatedQuestionsProps {
  relatedQuestions: Question[];
}

export const RelatedQuestions: React.FC<RelatedQuestionsProps> = ({ relatedQuestions }) => {
  if (!relatedQuestions || relatedQuestions.length === 0) return null;

  return (
    <div className="flex flex-col gap-4 border-t border-slate-800 pt-8 text-left">
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">Related Interview Questions</h3>
        <p className="text-xs text-slate-400 mt-1">
          Explore similar questions in the same technical category.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {relatedQuestions.map((q) => (
          <QuestionCard key={q.id} question={q} />
        ))}
      </div>
    </div>
  );
};
