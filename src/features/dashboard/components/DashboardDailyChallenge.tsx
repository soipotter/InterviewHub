import React from 'react';
import { Link } from 'react-router-dom';
import { DailyChallengeStats } from '../../dailyChallenge/types/dailyChallenge';
import { DailyChallengeStreak } from '../../dailyChallenge/components/DailyChallengeStreak';
import { Button } from '../../../components/ui/Button';

export interface DashboardDailyChallengeProps {
  stats: DailyChallengeStats;
}

export const DashboardDailyChallenge: React.FC<DashboardDailyChallengeProps> = ({ stats }) => {
  return (
    <div className="flex flex-col gap-3">
      <DailyChallengeStreak stats={stats} />
      {!stats.completedToday && (
        <Link to="/daily-challenge">
          <Button variant="primary" size="sm" className="w-full" id="dashboard-take-dc-cta">
            ⚡ Take Today's Challenge
          </Button>
        </Link>
      )}
    </div>
  );
};
