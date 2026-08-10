import React from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Skeleton } from '../components/ui/Skeleton';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useDashboard } from '../features/dashboard/hooks/useDashboard';
import { DashboardHeader } from '../features/dashboard/components/DashboardHeader';
import { DashboardStats } from '../features/dashboard/components/DashboardStats';
import { DashboardQuickActions } from '../features/dashboard/components/DashboardQuickActions';
import { DashboardRecentPractice } from '../features/dashboard/components/DashboardRecentPractice';
import { DashboardCategoryPerformance } from '../features/dashboard/components/DashboardCategoryPerformance';
import { DashboardDailyChallenge } from '../features/dashboard/components/DashboardDailyChallenge';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard();

  return (
    <AppShell header={<Header />} footer={<Footer />}>
      <div className="flex flex-col gap-8 text-left pb-16 max-w-6xl mx-auto w-full">
        {/* Dashboard Header */}
        <DashboardHeader user={user} />

        {/* Loading State */}
        {isLoading || !data ? (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} variant="rectangular" height="90px" />
              ))}
            </div>
            <Skeleton variant="rectangular" height="180px" />
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Quick Stats Grid */}
            <DashboardStats stats={data.stats} />

            {/* Daily Challenge Streak */}
            {data.dailyChallengeStats && (
              <DashboardDailyChallenge stats={data.dailyChallengeStats} />
            )}

            {/* Quick Actions Bar */}
            <DashboardQuickActions />

            {/* Recent Practice & Category Performance Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DashboardRecentPractice attempts={data.recentAttempts} />
              <DashboardCategoryPerformance categoryStats={data.categoryStats} />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default DashboardPage;
