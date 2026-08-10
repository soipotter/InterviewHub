import React from 'react';
import { Category, Difficulty } from '../../questions/types/question';
import { Progress } from '../../../components/ui/Progress';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';

export interface QuizHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  category: Category;
  difficulty: Difficulty;
}

const difficultyVariantMap: Record<Difficulty, BadgeVariant> = {
  Beginner: 'success',
  Junior: 'info',
  Intermediate: 'warning',
};

export const QuizHeader: React.FC<QuizHeaderProps> = ({
  currentIndex,
  totalQuestions,
  category,
  difficulty,
}) => {
  const currentNum = currentIndex + 1;
  const progressPercent = Math.round((currentNum / totalQuestions) * 100);

  return (
    <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 text-left">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Badge variant="default" size="sm">
            {category}
          </Badge>
          <Badge variant={difficultyVariantMap[difficulty]} size="sm">
            {difficulty}
          </Badge>
        </div>
        <span className="text-xs font-mono font-semibold text-indigo-400">
          Question {currentNum} of {totalQuestions}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <Progress value={progressPercent} size="md" variant="default" />
      </div>
    </div>
  );
};
