import { supabase } from '../../../services/supabase';
import {
  CategoryOption,
  CommunityQuestionSubmissionInput,
  CommunityQuestionSubmissionResult,
} from '../types/community';

export const communityService = {
  /**
   * Fetches all public categories (name + id) from Supabase for the form Select.
   * Reuses the existing public.categories table already backing the question bank.
   */
  async getCategories(): Promise<CategoryOption[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('sort_order', { ascending: true });

    if (error || !data) {
      console.error('[InterviewHub] Error fetching categories:', error);
      return [];
    }

    return (data as Array<{ id: string; name: string; slug: string }>).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    }));
  },

  /**
   * Submits a community question via the secured submit_community_question RPC.
   *
   * ONLY calls supabase.rpc('submit_community_question').
   * Does NOT insert into public.questions.
   * Does NOT submit: user_id, status, moderated_by, rejection_reason.
   * Those fields are controlled exclusively by the database RPC.
   */
  async submitCommunityQuestion(
    input: CommunityQuestionSubmissionInput
  ): Promise<CommunityQuestionSubmissionResult> {
    const { data, error } = await supabase.rpc('submit_community_question', {
      p_title: input.title,
      p_category_id: input.categoryId,
      p_topic: input.topic,
      p_difficulty: input.difficulty,
      p_type: input.type,
      p_short_summary: input.shortSummary,
      p_explanation: input.explanation,
      p_options: input.options,
      p_correct_answer: input.correctAnswer,
      p_code_snippet: input.codeSnippet ?? null,
      p_interview_tip: input.interviewTip ?? null,
    });

    if (error) {
      console.error('[InterviewHub] Error submitting community question:', error);

      // Map known error types to user-friendly messages
      const msg = error.message ?? '';
      if (msg.includes('JWT') || msg.includes('auth') || msg.includes('Unauthorized')) {
        throw new Error('Your session has expired. Please sign in again.');
      }
      if (msg.includes('correct_answer') || msg.includes('options') || msg.includes('Invalid')) {
        throw new Error('Please review your question — ' + msg);
      }
      throw new Error("We couldn't submit your question. Please try again.");
    }

    const row = data as { id: string; status: string; message: string };
    return {
      id: row.id,
      status: 'pending',
      message: row.message,
    };
  },
};
