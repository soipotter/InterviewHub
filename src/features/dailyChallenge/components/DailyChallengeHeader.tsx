import React from 'react';
import { Badge } from '../../../components/ui/Badge';

export interface DailyChallengeHeaderProps {
  challengeDate: string;
}

function formatChallengeDate(dateStr: string): string {
  try {
    // dateStr is YYYY-MM-DD (UTC). Parse it without timezone shifts.
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC',
    });
  } catch {
    return dateStr;
  }
}

export const DailyChallengeHeader: React.FC<DailyChallengeHeaderProps> = ({ challengeDate }) => {
  return (
    <div className="flex flex-col gap-3 text-left">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="Daily Challenge">
            ⚡
          </span>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Daily Challenge</h1>
        </div>
        <Badge variant="info" size="md">
          5 Questions
        </Badge>
      </div>
      <p className="text-sm text-slate-400 font-mono">{formatChallengeDate(challengeDate)}</p>
      <p className="text-sm text-slate-400 max-w-xl">
        A fresh frontend challenge every day. Answer all 5 questions and see how you score. No
        sign-in required.
      </p>
    </div>
  );
};
