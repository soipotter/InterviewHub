import React from 'react';
import { DailyChallengeStats } from '../types/dailyChallenge';
import { Card, CardContent } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export interface DailyChallengeStreakProps {
  stats: DailyChallengeStats;
  compact?: boolean;
}

export const DailyChallengeStreak: React.FC<DailyChallengeStreakProps> = ({
  stats,
  compact = false,
}) => {
  if (compact) {
    // Compact inline version for use inside result card
    return (
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div className="flex flex-col">
            <span className="text-xs font-mono text-slate-400">Current Streak</span>
            <span className="text-lg font-extrabold text-white font-mono">
              {stats.currentStreak}
              <span className="text-xs text-slate-400 ml-1">
                {stats.currentStreak === 1 ? 'day' : 'days'}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <div className="flex flex-col">
            <span className="text-xs font-mono text-slate-400">Best Streak</span>
            <span className="text-lg font-extrabold text-white font-mono">
              {stats.longestStreak}
              <span className="text-xs text-slate-400 ml-1">
                {stats.longestStreak === 1 ? 'day' : 'days'}
              </span>
            </span>
          </div>
        </div>
        {stats.completedToday && (
          <Badge variant="success" size="sm">
            ✓ Completed Today
          </Badge>
        )}
        <span className="text-xs text-slate-500 font-mono">{stats.totalCompletions} total</span>
      </div>
    );
  }

  // Full card version for Dashboard
  return (
    <Card className="border-slate-800 bg-slate-950/80">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-col gap-4 text-left">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚡</span>
              <span className="text-sm font-bold text-white">Daily Challenge</span>
            </div>
            {stats.completedToday && (
              <Badge variant="success" size="sm">
                ✓ Done Today
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-amber-500/20 bg-amber-950/20 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-base">🔥</span>
                <span className="text-[11px] font-mono text-amber-400 font-semibold">
                  Current Streak
                </span>
              </div>
              <span className="text-2xl font-extrabold text-white font-mono">
                {stats.currentStreak}
                <span className="text-xs text-slate-400 ml-1">
                  {stats.currentStreak === 1 ? 'day' : 'days'}
                </span>
              </span>
            </div>

            <div className="p-3 rounded-xl border border-indigo-500/20 bg-indigo-950/20 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span className="text-base">🏆</span>
                <span className="text-[11px] font-mono text-indigo-400 font-semibold">
                  Best Streak
                </span>
              </div>
              <span className="text-2xl font-extrabold text-white font-mono">
                {stats.longestStreak}
                <span className="text-xs text-slate-400 ml-1">
                  {stats.longestStreak === 1 ? 'day' : 'days'}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-1 border-t border-slate-800">
            <span>
              {stats.totalCompletions} challenge{stats.totalCompletions !== 1 ? 's' : ''} completed
            </span>
            {!stats.completedToday && (
              <span className="text-amber-400">Complete today to keep streak!</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
