import { supabase } from '../../../services/supabase';
import {
  AdminStats,
  ApproveSubmissionResult,
  PendingCommunitySubmission,
  RejectSubmissionResult,
} from '../types/admin';

export const adminService = {
  /**
   * Fetches pending community submissions from public.community_questions.
   * Authorized strictly via Supabase RLS (Admins read all community questions).
   */
  async getPendingSubmissions(): Promise<PendingCommunitySubmission[]> {
    const { data, error } = await supabase
      .from('community_questions')
      .select('*, categories(name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error || !data) {
      console.error('[InterviewHub] Error fetching pending submissions:', error);
      return [];
    }

    return (
      data as Array<{
        id: string;
        user_id: string;
        title: string;
        category_id: string;
        categories?: { name: string } | null;
        topic: string;
        difficulty: string;
        type: string;
        short_summary: string;
        explanation: string;
        options: string[] | null;
        correct_answer: string | null;
        code_snippet: string | null;
        interview_tip: string | null;
        status: string;
        published_question_id?: string | null;
        moderated_by?: string | null;
        rejection_reason?: string | null;
        created_at: string;
        updated_at?: string;
      }>
    ).map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      categoryId: row.category_id,
      categoryName: row.categories?.name ?? 'General',
      topic: row.topic,
      difficulty: row.difficulty as PendingCommunitySubmission['difficulty'],
      type: row.type as PendingCommunitySubmission['type'],
      shortSummary: row.short_summary,
      explanation: row.explanation,
      options: row.options,
      correctAnswer: row.correct_answer,
      codeSnippet: row.code_snippet,
      interviewTip: row.interview_tip,
      status: (row.status as PendingCommunitySubmission['status']) || 'pending',
      publishedQuestionId: row.published_question_id ?? null,
      moderatedBy: row.moderated_by ?? null,
      rejectionReason: row.rejection_reason ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  /**
   * Fetches a single community submission by ID from public.community_questions.
   * Authorized strictly via Supabase RLS (Admins read all community questions).
   */
  async getCommunitySubmissionById(
    submissionId: string
  ): Promise<PendingCommunitySubmission | null> {
    if (!submissionId) return null;

    const { data, error } = await supabase
      .from('community_questions')
      .select('*, categories(name)')
      .eq('id', submissionId)
      .maybeSingle();

    if (error || !data) {
      if (error) {
        console.error('[InterviewHub] Error fetching submission by ID:', error);
      }
      return null;
    }

    const row = data as {
      id: string;
      user_id: string;
      title: string;
      category_id: string;
      categories?: { name: string } | null;
      topic: string;
      difficulty: string;
      type: string;
      short_summary: string;
      explanation: string;
      options: string[] | null;
      correct_answer: string | null;
      code_snippet: string | null;
      interview_tip: string | null;
      status: string;
      published_question_id?: string | null;
      moderated_by?: string | null;
      rejection_reason?: string | null;
      created_at: string;
      updated_at?: string;
    };

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      categoryId: row.category_id,
      categoryName: row.categories?.name ?? 'General',
      topic: row.topic,
      difficulty: row.difficulty as PendingCommunitySubmission['difficulty'],
      type: row.type as PendingCommunitySubmission['type'],
      shortSummary: row.short_summary,
      explanation: row.explanation,
      options: row.options,
      correctAnswer: row.correct_answer,
      codeSnippet: row.code_snippet,
      interviewTip: row.interview_tip,
      status: (row.status as PendingCommunitySubmission['status']) || 'pending',
      publishedQuestionId: row.published_question_id ?? null,
      moderatedBy: row.moderated_by ?? null,
      rejectionReason: row.rejection_reason ?? null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  },

  /**
   * Atomically approves a pending community submission and publishes it to public.questions.
   * Calls public.approve_community_question RPC strictly.
   */
  async approveCommunitySubmission(submissionId: string): Promise<ApproveSubmissionResult> {
    const { data, error } = await supabase.rpc('approve_community_question', {
      p_submission_id: submissionId,
    });

    if (error) {
      console.error('[InterviewHub] Error approving submission:', error);
      throw new Error(error.message || 'Failed to approve community submission.');
    }

    return data as ApproveSubmissionResult;
  },

  /**
   * Atomically rejects a pending community submission with a required rejection reason.
   * Calls public.reject_community_question RPC strictly.
   */
  async rejectCommunitySubmission(
    submissionId: string,
    rejectionReason: string
  ): Promise<RejectSubmissionResult> {
    const { data, error } = await supabase.rpc('reject_community_question', {
      p_submission_id: submissionId,
      p_rejection_reason: rejectionReason.trim(),
    });

    if (error) {
      console.error('[InterviewHub] Error rejecting submission:', error);
      throw new Error(error.message || 'Failed to reject community submission.');
    }

    return data as RejectSubmissionResult;
  },

  /**
   * Fetches exact count of pending submissions for the Admin dashboard summary.
   */
  async getPendingSubmissionsCount(): Promise<number> {
    const { count, error } = await supabase
      .from('community_questions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('[InterviewHub] Error fetching pending submissions count:', error);
      return 0;
    }

    return count ?? 0;
  },

  /**
   * Aggregates admin dashboard metrics.
   */
  async getAdminStats(): Promise<AdminStats> {
    const pendingCount = await this.getPendingSubmissionsCount();

    const { count: categoriesCount } = await supabase
      .from('categories')
      .select('id', { count: 'exact', head: true });

    return {
      pendingSubmissionsCount: pendingCount,
      totalCategoriesCount: categoriesCount ?? 0,
    };
  },
};
