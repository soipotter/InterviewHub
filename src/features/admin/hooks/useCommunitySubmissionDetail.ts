import { useState, useEffect, useCallback } from 'react';
import { PendingCommunitySubmission } from '../types/admin';
import { adminService } from '../services/adminService';

export function useCommunitySubmissionDetail(submissionId: string | undefined) {
  const [submission, setSubmission] = useState<PendingCommunitySubmission | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!submissionId) {
      setIsLoading(false);
      setSubmission(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await adminService.getCommunitySubmissionById(submissionId);
      setSubmission(data);
    } catch (err) {
      console.error('[InterviewHub] Error loading submission detail:', err);
      setError('Failed to load submission detail.');
    } finally {
      setIsLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    void fetchDetail();
  }, [fetchDetail]);

  return {
    submission,
    isLoading,
    error,
    refetch: fetchDetail,
  };
}
