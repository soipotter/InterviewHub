import React from 'react';
import { DashboardCategoryStat } from '../types/dashboard';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';

export interface DashboardCategoryPerformanceProps {
  categoryStats: DashboardCategoryStat[];
}

export const DashboardCategoryPerformance: React.FC<DashboardCategoryPerformanceProps> = ({
  categoryStats,
}) => {
  const hasEvaluatedData = categoryStats.some((s) => s.total > 0);

  return (
    <Card className="border-slate-800 bg-slate-950/80 text-left">
      <CardHeader className="pb-3 border-b border-slate-800/60">
        <CardTitle className="text-lg text-white">Category Performance Overview</CardTitle>
      </CardHeader>

      <CardContent className="pt-4">
        {!hasEvaluatedData ? (
          <EmptyState
            title="No Performance Data Yet"
            description="Complete practice quizzes to generate real category accuracy metrics across the 7 frontend domains."
            action={
              <Link to="/practice">
                <Button variant="outline" size="sm">
                  Start Practice Session
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3.5">
            {categoryStats.map((stat) => (
              <div key={stat.category} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-semibold text-slate-200">{stat.category}</span>
                  <span className="text-slate-400">
                    {stat.total > 0
                      ? `${stat.correct}/${stat.total} (${stat.accuracy}%)`
                      : '0 attempts'}
                  </span>
                </div>
                <Progress
                  value={stat.accuracy}
                  size="sm"
                  variant={
                    stat.total === 0
                      ? 'default'
                      : stat.accuracy >= 70
                        ? 'success'
                        : stat.accuracy >= 50
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
