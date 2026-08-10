import { useState, useCallback } from 'react';
import { adminService } from '../services/adminService';
import { ApproveSubmissionResult, RejectSubmissionResult } from '../types/admin';

export function useCommunityModeration() {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const approveSubmission = useCallback(
    async (submissionId: string): Promise<ApproveSubmissionResult | null> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await adminService.approveCommunitySubmission(submissionId);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Approval failed';
        setError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const rejectSubmission = useCallback(
    async (submissionId: string, reason: string): Promise<RejectSubmissionResult | null> => {
      setIsSubmitting(true);
      setError(null);
      try {
        const result = await adminService.rejectCommunitySubmission(submissionId, reason);
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Rejection failed';
        setError(msg);
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    approveSubmission,
    rejectSubmission,
    isSubmitting,
    error,
    clearError: () => setError(null),
  };
}
