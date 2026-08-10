import React from 'react';
import { Link } from 'react-router-dom';
import { DailyChallengeResult } from '../hooks/useDailyChallengeRunner';
import { DailyChallengeStats } from '../types/dailyChallenge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { Badge, BadgeVariant } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { QuizResultQuestion } from '../../practice/components/QuizResultQuestion';
import { DailyChallengeStreak } from './DailyChallengeStreak';

export interface DailyChallengeResultProps {
  result: DailyChallengeResult;
  isAuthenticated: boolean;
  stats?: DailyChallengeStats | null;
}

export const DailyChallengeResultView: React.FC<DailyChallengeResultProps> = ({
  result,
  isAuthenticated,
  stats,
}) => {
  let scoreBadgeVariant: BadgeVariant = 'danger';
  let scoreLabel = 'Keep Practicing';
  let progressVariant: 'default' | 'success' | 'warning' | 'danger' = 'danger';

  if (result.scorePercentage >= 80) {
    scoreBadgeVariant = 'success';
    scoreLabel = 'Excellent!';
    progressVariant = 'success';
  } else if (result.scorePercentage >= 60) {
    scoreBadgeVariant = 'info';
    scoreLabel = 'Good Effort';
    progressVariant = 'default';
  } else if (result.scorePercentage >= 40) {
    scoreBadgeVariant = 'warning';
    scoreLabel = 'Fair Attempt';
    progressVariant = 'warning';
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Score Summary Card */}
      <Card className="border-slate-800 bg-slate-950/90 shadow-2xl">
        <CardHeader className="border-b border-slate-800/80 pb-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Badge variant={scoreBadgeVariant} size="md">
              {scoreLabel}
            </Badge>
            <span className="text-xs font-mono text-slate-400">⚡ Daily Challenge Complete</span>
          </div>
          <CardTitle className="text-2xl text-white mt-1">Your Results</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 pt-6 text-left">
          {/* Accuracy meter */}
          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-slate-400 font-mono">Overall Accuracy</span>
              <span className="text-3xl font-extrabold text-white font-mono">
                {result.scorePercentage}%
              </span>
            </div>
            <Progress value={result.scorePercentage} size="lg" variant={progressVariant} />
          </div>

          {/* 3-stat boxes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-emerald-500/20 bg-emerald-950/20 flex flex-col">
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                ✓ Correct
              </span>
              <span className="text-2xl font-bold text-emerald-300 font-mono mt-1">
                {result.correctAnswersCount}
                <span className="text-base text-slate-500"> / 5</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 flex flex-col">
              <span className="text-[11px] font-mono text-rose-400 font-semibold">✕ Incorrect</span>
              <span className="text-2xl font-bold text-rose-300 font-mono mt-1">
                {result.incorrectAnswersCount}
                <span className="text-base text-slate-500"> / 5</span>
              </span>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-700 bg-slate-900/60 flex flex-col">
              <span className="text-[11px] font-mono text-slate-400">Questions</span>
              <span className="text-2xl font-bold text-white font-mono mt-1">5</span>
            </div>
          </div>

          {/* Streak display for authenticated users */}
          {isAuthenticated && stats && (
            <div className="border-t border-slate-800 pt-4">
              <DailyChallengeStreak stats={stats} compact />
            </div>
          )}

          {/* Auth-aware CTA */}
          <div className="border-t border-slate-800 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {!isAuthenticated ? (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-white font-semibold">
                  Track your Daily Challenge streak
                </p>
                <p className="text-xs text-slate-400">
                  Sign in to save your results and build a streak.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <p className="text-sm text-slate-300">Come back tomorrow for a new challenge!</p>
              </div>
            )}

            <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
              {!isAuthenticated && (
                <Link to="/login?redirect=%2Fdaily-challenge">
                  <Button variant="primary" size="sm" id="dc-result-signin-cta">
                    Sign In to Track Streak
                  </Button>
                </Link>
              )}
              <Link to="/questions">
                <Button variant="outline" size="sm" id="dc-result-question-bank-cta">
                  Browse Question Bank
                </Button>
              </Link>
              <Link to="/practice">
                <Button variant="ghost" size="sm" id="dc-result-practice-cta">
                  Practice More
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Per-Question Review */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Answer Review</h2>
        {result.questionResults.map((item, idx) => (
          <QuizResultQuestion key={item.questionId} index={idx} item={item} />
        ))}
      </div>
    </div>
  );
};
