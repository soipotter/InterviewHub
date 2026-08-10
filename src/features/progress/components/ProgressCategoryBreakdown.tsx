import React from 'react';
import { CategoryProgressItem } from '../types/progress';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export interface ProgressCategoryBreakdownProps {
  categoryProgress: CategoryProgressItem[];
}

export const ProgressCategoryBreakdown: React.FC<ProgressCategoryBreakdownProps> = ({
  categoryProgress,
}) => {
  const hasData = categoryProgress.some((c) => c.total > 0);

  return (
    <Card className="border-slate-800 bg-slate-900/60 text-left">
      <CardHeader className="pb-3 border-b border-slate-800/60">
        <CardTitle className="text-lg text-white">
          Category Accuracy breakdown (7 MVP Domains)
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        {!hasData ? (
          <EmptyState
            title="No Category Metrics Available"
            description="You haven't completed any practice quizzes yet. Category performance updates automatically after your first quiz."
            action={
              <Link to="/practice">
                <Button variant="primary" size="sm">
                  Start Practice
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {categoryProgress.map((item) => (
              <div key={item.category} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-200">{item.category}</span>
                  <span className="text-slate-400">
                    {item.total > 0
                      ? `${item.correct}/${item.total} correct (${item.accuracy}%)`
                      : '0 questions attempted'}
                  </span>
                </div>
                <Progress
                  value={item.accuracy}
                  size="sm"
                  variant={
                    item.total === 0
                      ? 'default'
                      : item.accuracy >= 70
                        ? 'success'
                        : item.accuracy >= 50
                          ? 'warning'
                          : 'danger'
                  }
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
