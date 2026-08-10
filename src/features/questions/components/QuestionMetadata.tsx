import React from 'react';
import { Question } from '../types/question';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import { BookmarkButton } from '../../bookmarks/components/BookmarkButton';

export interface QuestionMetadataProps {
  question: Question;
}

const difficultyBadgeVariant: Record<Question['difficulty'], BadgeVariant> = {
  Beginner: 'success',
  Junior: 'info',
  Intermediate: 'warning',
};

export const QuestionMetadata: React.FC<QuestionMetadataProps> = ({ question }) => {
  return (
    <div className="flex flex-col gap-4 border-b border-slate-800 pb-6 text-left">
      {/* Badges & Meta bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="default" size="md">
            {question.category}
          </Badge>
          <Badge variant={difficultyBadgeVariant[question.difficulty]} size="md">
            {question.difficulty}
          </Badge>
          <Badge variant="secondary" size="md">
            {question.type}
          </Badge>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            ~{question.estimatedMinutes} min read
          </span>
          {/* Integrated Bookmark Button Feature */}
          <BookmarkButton questionId={question.id} size="sm" />
        </div>
      </div>

      {/* Question Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-snug">
        {question.title}
      </h1>

      {/* Topic & Tags */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-slate-400">
        <span className="font-mono">
          <strong className="text-slate-300">Topic:</strong> {question.topic}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono text-[11px]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
