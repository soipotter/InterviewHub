import { useState, useEffect, useCallback } from 'react';
import { AdminStats, PendingCommunitySubmission } from '../types/admin';
import { adminService } from '../services/adminService';

export function useAdmin() {
  const [submissions, setSubmissions] = useState<PendingCommunitySubmission[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [subsData, statsData] = await Promise.all([
        adminService.getPendingSubmissions(),
        adminService.getAdminStats(),
      ]);
      setSubmissions(subsData);
      setStats(statsData);
    } catch (err) {
      console.error('[InterviewHub] Error loading admin data:', err);
      setError('Failed to load admin data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return {
    submissions,
    stats,
    isLoading,
    error,
    refetch: fetchData,
  };
}
