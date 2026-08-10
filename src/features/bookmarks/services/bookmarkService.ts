import { supabase } from '../../../services/supabase';
import { Question } from '../../questions/types/question';
import { DbQuestionRow, mapRowToQuestion } from '../../questions/utils/mapQuestion';

export const bookmarkService = {
  /**
   * Retrieves array of bookmarked question IDs for the specified user from Supabase public.bookmarks table.
   */
  async getBookmarkedQuestionIds(userId?: string): Promise<string[]> {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('bookmarks')
      .select('question_id')
      .eq('user_id', userId);

    if (error || !data) return [];
    return data.map((b) => b.question_id);
  },

  /**
   * Checks if a question ID is bookmarked by the user in Supabase.
   */
  async isBookmarked(userId: string | undefined, questionId: string): Promise<boolean> {
    if (!userId) return false;
    const { data, error } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('question_id', questionId)
      .maybeSingle();

    if (error || !data) return false;
    return true;
  },

  /**
   * Adds a question ID to user bookmarks in Supabase public.bookmarks table.
   */
  async addBookmark(userId: string | undefined, questionId: string): Promise<void> {
    if (!userId) return;
    const { error } = await supabase
      .from('bookmarks')
      .insert({ user_id: userId, question_id: questionId });

    if (error) {
      // 23505 is PostgreSQL unique constraint error (already bookmarked)
      if (error.code === '23505') return;
      console.error('[InterviewHub] Error adding bookmark:', error);
    }
  },

  /**
   * Removes a question ID from user bookmarks in Supabase public.bookmarks table.
   */
  async removeBookmark(userId: string | undefined, questionId: string): Promise<void> {
    if (!userId) return;
    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('user_id', userId)
      .eq('question_id', questionId);

    if (error) {
      console.error('[InterviewHub] Error removing bookmark:', error);
    }
  },

  /**
   * Retrieves full Question objects for all bookmarked question IDs from Supabase joined tables.
   */
  async getBookmarkedQuestions(userId?: string): Promise<Question[]> {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('bookmarks')
      .select('question_id, questions!inner(*, categories!inner(*))')
      .eq('user_id', userId)
      .eq('questions.status', 'published');

    if (error || !data) return [];

    return data
      .map((item: { questions: DbQuestionRow | DbQuestionRow[] | null }) => {
        if (!item.questions) return null;
        const qRow = Array.isArray(item.questions) ? item.questions[0] : item.questions;
        return mapRowToQuestion(qRow);
      })
      .filter((q): q is Question => q !== null);
  },
};
