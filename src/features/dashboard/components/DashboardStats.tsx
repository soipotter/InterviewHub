import React from 'react';
import { DashboardSummaryStats } from '../types/dashboard';

export interface DashboardStatsProps {
  stats: DashboardSummaryStats;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
        <span className="text-xs font-mono text-slate-400">Questions Answered</span>
        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
          {stats.questionsCompleted}
        </span>
      </div>

      <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 flex flex-col justify-between">
        <span className="text-xs font-mono text-indigo-400 font-semibold">Overall Accuracy</span>
        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
          {stats.overallAccuracy}%
        </span>
      </div>

      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
        <span className="text-xs font-mono text-slate-400">Bookmarks Saved</span>
        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
          {stats.bookmarkedCount}
        </span>
      </div>

      <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/80 flex flex-col justify-between">
        <span className="text-xs font-mono text-slate-400">Practice Quizzes</span>
        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-2">
          {stats.practiceAttempts}
        </span>
      </div>
    </div>
  );
};
