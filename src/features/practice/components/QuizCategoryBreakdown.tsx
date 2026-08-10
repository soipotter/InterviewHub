import React from 'react';
import { Category } from '../../questions/types/question';
import { QuizAttemptResult } from '../types/practice';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';

export interface QuizCategoryBreakdownProps {
  result: QuizAttemptResult;
}

interface CategoryStats {
  category: Category;
  correct: number;
  total: number;
  accuracy: number;
}

export const QuizCategoryBreakdown: React.FC<QuizCategoryBreakdownProps> = ({ result }) => {
  const categoryMap = new Map<Category, { correct: number; total: number }>();

  result.questionResults.forEach((q) => {
    const existing = categoryMap.get(q.category) || { correct: 0, total: 0 };
    existing.total += 1;
    if (q.isCorrect) existing.correct += 1;
    categoryMap.set(q.category, existing);
  });

  const statsList: CategoryStats[] = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    correct: data.correct,
    total: data.total,
    accuracy: Math.round((data.correct / data.total) * 100),
  }));

  return (
    <Card className="border-slate-800 bg-slate-900/60">
      <CardHeader className="pb-3 border-b border-slate-800/60">
        <CardTitle className="text-lg text-white">Category Performance Breakdown</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-4 text-left">
        {statsList.map((stat) => (
          <div key={stat.category} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-slate-200">{stat.category}</span>
              <span className="text-slate-400">
                {stat.correct}/{stat.total} correct ({stat.accuracy}%)
              </span>
            </div>
            <Progress
              value={stat.accuracy}
              size="sm"
              variant={stat.accuracy >= 70 ? 'success' : stat.accuracy >= 50 ? 'warning' : 'danger'}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
