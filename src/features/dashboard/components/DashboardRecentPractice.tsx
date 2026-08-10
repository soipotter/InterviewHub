import React from 'react';
import { Link } from 'react-router-dom';
import { QuizAttemptResult } from '../../practice/types/practice';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export interface DashboardRecentPracticeProps {
  attempts: QuizAttemptResult[];
}

export const DashboardRecentPractice: React.FC<DashboardRecentPracticeProps> = ({ attempts }) => {
  return (
    <Card className="border-slate-800 bg-slate-950/80 text-left">
      <CardHeader className="pb-3 border-b border-slate-800/60 flex flex-row items-center justify-between">
        <CardTitle className="text-lg text-white">Recent Quiz Attempts</CardTitle>
        <Link to="/practice" className="text-xs text-indigo-400 hover:underline font-semibold">
          New Quiz →
        </Link>
      </CardHeader>

      <CardContent className="pt-4">
        {attempts.length === 0 ? (
          <EmptyState
            title="No Quiz Attempts Found"
            description="You haven't completed any practice quizzes in this session yet."
            action={
              <Link to="/practice">
                <Button variant="primary" size="sm">
                  Start Practice
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="flex flex-col gap-3">
            {attempts.map((attempt) => (
              <div
                key={attempt.attemptId}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between gap-4 flex-wrap"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" size="sm">
                      {attempt.config.category}
                    </Badge>
                    <Badge variant="secondary" size="sm">
                      {attempt.config.difficulty}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-300 font-mono">
                    {attempt.correctAnswersCount}/{attempt.totalQuestions} questions correct
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-white font-mono">
                    {attempt.scorePercentage}%
                  </span>
                  <Link to={`/results/${attempt.attemptId}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      View Results →
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
