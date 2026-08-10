import React from 'react';
import { ProgressSummaryStats } from '../types/progress';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';

export interface ProgressSummaryProps {
  summary: ProgressSummaryStats;
}

export const ProgressSummary: React.FC<ProgressSummaryProps> = ({ summary }) => {
  return (
    <Card className="border-slate-800 bg-slate-950/90 shadow-2xl text-left">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <CardTitle className="text-xl text-white">Overall Learning Progress</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between font-mono">
            <span className="text-xs text-slate-400">Cumulative Accuracy Rate</span>
            <span className="text-3xl font-extrabold text-white">{summary.overallAccuracy}%</span>
          </div>
          <Progress
            value={summary.overallAccuracy}
            size="lg"
            variant={
              summary.overallAccuracy >= 70
                ? 'success'
                : summary.overallAccuracy >= 50
                  ? 'warning'
                  : 'danger'
            }
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
            <span className="text-xs font-mono text-slate-400">Questions Answered</span>
            <span className="text-2xl font-bold text-white font-mono mt-1">
              {summary.totalAnswered}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex flex-col">
            <span className="text-xs font-mono text-emerald-400 font-semibold">✓ Correct</span>
            <span className="text-2xl font-bold text-emerald-300 font-mono mt-1">
              {summary.correctAnswers}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 flex flex-col">
            <span className="text-xs font-mono text-rose-400 font-semibold">✕ Incorrect</span>
            <span className="text-2xl font-bold text-rose-300 font-mono mt-1">
              {summary.incorrectAnswers}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
