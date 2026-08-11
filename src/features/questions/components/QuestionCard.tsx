import React from 'react';
import { Link } from 'react-router-dom';
import { Question } from '../types/question';
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

export interface QuestionCardProps {
  question: Question;
}

const difficultyBadgeVariant: Record<Question['difficulty'], BadgeVariant> = {
  Beginner: 'success',
  Junior: 'info',
  Intermediate: 'warning',
};

export const QuestionCard: React.FC<QuestionCardProps> = ({ question }) => {
  return (
    <Card hoverable className="flex flex-col justify-between h-full group">
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
          <span className="text-[11px] font-mono text-slate-400">
            ~{question.estimatedMinutes} min read
          </span>
        </div>
        <CardTitle className="text-base text-white group-hover:text-indigo-400 transition-colors leading-snug break-words">
          <Link to={`/questions/${question.id}`} className="focus:outline-none focus:underline">
            {question.title}
          </Link>
        </CardTitle>
        <CardDescription className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed break-words">
          {question.shortSummary}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex items-center gap-1.5 flex-wrap pt-2">
          <span className="text-[11px] text-slate-400 font-mono break-all line-clamp-1">Topic: {question.topic}</span>
        </div>
        <div className="flex items-center gap-1 flex-wrap mt-2">
          {question.tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono"
            >
              #{tag}
            </span>
          ))}
        </div>
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
