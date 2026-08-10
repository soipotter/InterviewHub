import React from 'react';
import { QuizAttemptResult } from '../types/practice';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';

export interface QuizResultSummaryProps {
  result: QuizAttemptResult;
}

function formatDuration(startedAt: number, completedAt: number): string {
  const durationMs = Math.max(0, completedAt - startedAt);
  const totalSeconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export const QuizResultSummary: React.FC<QuizResultSummaryProps> = ({ result }) => {
  const unansweredCount = result.questionResults.filter((q) => !q.selectedAnswer).length;
  const timeTaken = formatDuration(result.startedAt, result.completedAt);

  let scoreBadgeVariant: BadgeVariant = 'danger';
  let scoreLabel = 'Needs Improvement';
  let progressVariant: 'default' | 'success' | 'warning' | 'danger' = 'danger';

  if (result.scorePercentage >= 80) {
    scoreBadgeVariant = 'success';
    scoreLabel = 'Excellent Performance';
    progressVariant = 'success';
  } else if (result.scorePercentage >= 70) {
    scoreBadgeVariant = 'info';
    scoreLabel = 'Passing Grade';
    progressVariant = 'default';
  } else if (result.scorePercentage >= 50) {
    scoreBadgeVariant = 'warning';
    scoreLabel = 'Fair Attempt';
    progressVariant = 'warning';
  }

  return (
    <Card className="border-slate-800 bg-slate-950/90 shadow-2xl">
      <CardHeader className="border-b border-slate-800/80 pb-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Badge variant={scoreBadgeVariant} size="md">
            {scoreLabel}
          </Badge>
          <span className="text-xs font-mono text-slate-400">Time Taken: {timeTaken}</span>
        </div>
        <CardTitle className="text-2xl text-white mt-1">Quiz Results & Score Breakdown</CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 pt-6 text-left">
        {/* Score & Progress Display */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-slate-400 font-mono">Overall Accuracy</span>
            <span className="text-3xl font-extrabold text-white font-mono">
              {result.scorePercentage}%
            </span>
          </div>
          <Progress value={result.scorePercentage} size="lg" variant={progressVariant} />
        </div>

        {/* 4-Stat Box Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col">
            <span className="text-[11px] font-mono text-slate-400">Total Questions</span>
            <span className="text-xl font-bold text-white font-mono mt-1">
              {result.totalQuestions}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex flex-col">
            <span className="text-[11px] font-mono text-emerald-400 font-semibold">✓ Correct</span>
            <span className="text-xl font-bold text-emerald-300 font-mono mt-1">
              {result.correctAnswersCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 flex flex-col">
            <span className="text-[11px] font-mono text-rose-400 font-semibold">✕ Incorrect</span>
            <span className="text-xl font-bold text-rose-300 font-mono mt-1">
              {result.incorrectAnswersCount}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-950/20 flex flex-col">
            <span className="text-[11px] font-mono text-amber-400 font-semibold">— Unanswered</span>
            <span className="text-xl font-bold text-amber-300 font-mono mt-1">
              {unansweredCount}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
