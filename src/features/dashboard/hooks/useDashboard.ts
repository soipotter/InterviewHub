import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { dashboardService } from '../services/dashboardService';
import { DashboardData } from '../types/dashboard';

export function useDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await dashboardService.getDashboardData(user?.id);
      setData(res);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    refetch: fetchDashboard,
  };
}
