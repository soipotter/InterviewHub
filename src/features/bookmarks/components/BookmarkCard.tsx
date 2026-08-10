import React from 'react';
import { Link } from 'react-router-dom';
import { Question } from '../../questions/types/question';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../../../components/ui/Card';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface BookmarkCardProps {
  question: Question;
  onRemove: (questionId: string) => void;
}

const difficultyBadgeVariant: Record<Question['difficulty'], BadgeVariant> = {
  Beginner: 'success',
  Junior: 'info',
  Intermediate: 'warning',
};

export const BookmarkCard: React.FC<BookmarkCardProps> = ({ question, onRemove }) => {
  return (
    <Card hoverable className="flex flex-col justify-between h-full group text-left">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="default" size="sm">
              {question.category}
            </Badge>
            <Badge variant={difficultyBadgeVariant[question.difficulty]} size="sm">
              {question.difficulty}
            </Badge>
          </div>
          <button
            type="button"
            onClick={() => onRemove(question.id)}
            className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer focus:outline-none"
            aria-label={`Remove ${question.title} from bookmarks`}
          >
            Remove ✕
          </button>
        </div>
        <CardTitle className="text-base text-white group-hover:text-indigo-400 transition-colors leading-snug">
          <Link to={`/questions/${question.id}`} className="focus:outline-none focus:underline">
            {question.title}
          </Link>
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {question.shortSummary}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <span className="text-[11px] text-slate-400 font-mono">Topic: {question.topic}</span>
      </CardContent>

      <CardFooter className="pt-3 border-t border-slate-800/60 flex items-center justify-between">
        <span className="text-[11px] text-slate-400 font-mono">{question.type}</span>
        <Link to={`/questions/${question.id}`}>
          <Button
            variant="ghost"
            size="sm"
            className="text-indigo-400 hover:text-indigo-300 font-medium"
          >
            View Question →
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};
