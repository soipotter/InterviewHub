import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { dashboardService } from '../services/dashboardService';
import { DashboardData } from '../types/dashboard';

let globalDashboardCache: { userId: string; data: DashboardData; timestamp: number } | null = null;
const CACHE_TTL_MS = 30000;

export function invalidateDashboardCache() {
  globalDashboardCache = null;
}

export function useDashboard() {
  const { user } = useAuth();
  const userId = user?.id;

  const [data, setData] = useState<DashboardData | null>(() => {
    if (
      globalDashboardCache &&
      userId &&
      globalDashboardCache.userId === userId &&
      Date.now() - globalDashboardCache.timestamp < CACHE_TTL_MS
    ) {
      return globalDashboardCache.data;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!data);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await dashboardService.getDashboardData(userId);
      setData(res);
      if (userId) {
        globalDashboardCache = {
          userId,
          data: res,
          timestamp: Date.now(),
        };
      }
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchDashboard();
    }
  }, [userId, fetchDashboard]);

  return {
    data,
    isLoading,
    refetch: fetchDashboard,
  };
}
