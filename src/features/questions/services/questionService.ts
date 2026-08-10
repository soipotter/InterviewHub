import { supabase } from '../../../services/supabase';
import { Category, Question, QuestionFilters, QuestionResponse } from '../types/question';
import { DbQuestionRow, mapRowToQuestion } from '../utils/mapQuestion';

const PAGE_SIZE = 10;

export const questionService = {
  /**
   * Fetches questions matching the provided filters from Supabase public.questions table.
   * Performs server-side category, difficulty, type filtering, ILIKE search, and pagination.
   */
  async getQuestions(filters: QuestionFilters = {}): Promise<QuestionResponse> {
    const requestedPage = filters.page && filters.page > 0 ? filters.page : 1;
    const from = (requestedPage - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('questions')
      .select('*, categories!inner(*)', { count: 'exact' })
      .eq('status', 'published');

    if (filters.category && filters.category !== 'All') {
      query = query.eq('categories.name', filters.category);
    }

    if (filters.difficulty && filters.difficulty !== 'All') {
      query = query.eq('difficulty', filters.difficulty);
    }

    if (filters.type && filters.type !== 'All') {
      query = query.eq('type', filters.type);
    }

    if (filters.q && filters.q.trim()) {
      const searchTerm = `%${filters.q.trim()}%`;
      query = query.or(
        `title.ilike.${searchTerm},short_summary.ilike.${searchTerm},topic.ilike.${searchTerm}`
      );
    }

    query = query.order('id', { ascending: true }).range(from, to);

    const { data, count, error } = await query;

    if (error) {
      console.error('[InterviewHub] Error fetching questions from Supabase:', error);
      return {
        data: [],
        total: 0,
        page: requestedPage,
        totalPages: 0,
        pageSize: PAGE_SIZE,
      };
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / PAGE_SIZE);
    const mappedQuestions = ((data as unknown as DbQuestionRow[]) || []).map(mapRowToQuestion);

    return {
      data: mappedQuestions,
      total,
      page: requestedPage,
      totalPages,
      pageSize: PAGE_SIZE,
    };
  },

  /**
   * Fetches a single published question by ID or slug from Supabase.
   */
  async getQuestionById(idOrSlug: string): Promise<Question | null> {
    let query = supabase.from('questions').select('*, categories(*)').eq('status', 'published');

    if (idOrSlug.startsWith('q-')) {
      query = query.eq('id', idOrSlug);
    } else {
      query = query.eq('slug', idOrSlug);
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      return null;
    }

    return mapRowToQuestion(data as unknown as DbQuestionRow);
  },

  /**
   * Fetches related published questions based on matching category from Supabase.
   */
  async getRelatedQuestions(
    currentQuestionId: string,
    category: Category,
    limit: number = 3
  ): Promise<Question[]> {
    const { data, error } = await supabase
      .from('questions')
      .select('*, categories!inner(*)')
      .eq('status', 'published')
      .neq('id', currentQuestionId)
      .eq('categories.name', category)
      .limit(limit);

    if (error || !data || data.length === 0) {
      const { data: fallbackData } = await supabase
        .from('questions')
        .select('*, categories(*)')
        .eq('status', 'published')
        .neq('id', currentQuestionId)
        .limit(limit);

      return ((fallbackData as unknown as DbQuestionRow[]) || []).map(mapRowToQuestion);
    }

    return (data as unknown as DbQuestionRow[]).map(mapRowToQuestion);
  },
};
