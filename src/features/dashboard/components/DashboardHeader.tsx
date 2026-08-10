import React from 'react';
import { User } from '../../auth/types/auth';
import { Badge } from '../../../components/ui/Badge';

export interface DashboardHeaderProps {
  user: User | null;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ user }) => {
  const displayName = user?.fullName || user?.email?.split('@')[0] || 'Developer';

  return (
    <div className="flex flex-col gap-2 border-b border-slate-800 pb-6 text-left">
      <div className="flex items-center gap-3">
        <Badge variant="default" size="md">
          Developer Dashboard
        </Badge>
        <span className="text-xs font-mono text-slate-400">Authenticated Session</span>
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
        Welcome back, {displayName}
      </h1>
      <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
        Track your active quiz attempts, revision bookmarks, and category performance.
      </p>
    </div>
  );
};
