import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { useProgress } from '../features/progress/hooks/useProgress';
import { ProgressSummary } from '../features/progress/components/ProgressSummary';
import { ProgressCategoryBreakdown } from '../features/progress/components/ProgressCategoryBreakdown';
import { ProgressWeakTopics } from '../features/progress/components/ProgressWeakTopics';
import { ProgressRecentAttempts } from '../features/progress/components/ProgressRecentAttempts';

export const ProgressPage: React.FC = () => {
  const { data, isLoading } = useProgress();

  return (
    <AppShell header={<Header />} footer={<Footer />}>
      <div className="flex flex-col gap-8 text-left pb-16 max-w-6xl mx-auto w-full">
        {/* Page Header */}
        <div className="flex flex-col gap-2 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <Badge variant="default" size="md">
              Progress & Analytics
            </Badge>
            <span className="text-xs font-mono text-slate-400">
              Category Accuracy & Diagnostics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Learning Progress & Category Mastery
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Detailed performance tracking across the 7 frontend engineering domains, accuracy
            metrics, and weak domain diagnostics.
          </p>
        </div>

        {/* Loading State */}
        {isLoading || !data ? (
          <div className="flex flex-col gap-6">
            <Skeleton variant="rectangular" height="180px" />
            <Skeleton variant="rectangular" height="240px" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Overall Progress Summary */}
            <ProgressSummary summary={data.summary} />

            {/* Category Accuracy & Weak Topics Diagnostics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProgressCategoryBreakdown categoryProgress={data.categoryProgress} />
              <ProgressWeakTopics weakTopics={data.weakTopics} />
            </div>

            {/* Session Attempt History */}
            <ProgressRecentAttempts attempts={data.recentAttempts} />
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ProgressPage;
