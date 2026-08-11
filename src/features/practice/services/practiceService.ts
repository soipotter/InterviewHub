import { supabase } from '../../../services/supabase';
import { Category, Question, QuestionType, Difficulty } from '../../questions/types/question';
import { DbQuestionRow, mapRowToQuestion } from '../../questions/utils/mapQuestion';
import { QuizConfig, QuizState, QuizAttemptResult, QuestionResultItem } from '../types/practice';
import { invalidateDashboardCache } from '../../dashboard/hooks/useDashboard';

const QUIZ_STORAGE_PREFIX = 'ih_quiz_';

/**
 * Fisher-Yates array shuffling utility (non-mutating)
 */
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface RpcQuestionItem {
  id: string;
  title: string;
  slug: string;
  category: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  shortSummary: string;
  explanationMarkdown?: string;
  codeSnippet?: string;
  interviewTip?: string;
  options?: string[];
  correctAnswer?: string;
  tags?: string[];
}

interface RpcQuestionResultItem {
  questionId: string;
  questionTitle: string;
  category: Category;
  difficulty: Difficulty;
  type: QuestionType;
  selectedAnswer?: string;
  correctAnswer?: string;
  isCorrect: boolean;
  explanationMarkdown?: string;
  interviewTip?: string;
}

export const practiceService = {
  /**
   * Fetches published candidate questions from Supabase public.questions table matching Practice Builder filters
   */
  async getMatchingQuestions(config: Partial<QuizConfig>): Promise<Question[]> {
    let query = supabase
      .from('questions')
      .select('*, categories!inner(*)')
      .eq('status', 'published');

    if (config.category && config.category !== 'All') {
      query = query.eq('categories.name', config.category);
    }

    if (config.difficulty && config.difficulty !== 'All') {
      query = query.eq('difficulty', config.difficulty);
    }

    if (config.type && config.type !== 'All') {
      query = query.eq('type', config.type);
    } else {
      query = query.in('type', ['Multiple Choice', 'True/False', 'multiple_choice', 'true_false']);
    }

    const { data, error } = await query;
    if (error || !data) {
      console.error('[InterviewHub] Error fetching matching quiz questions from Supabase:', error);
      return [];
    }

    return ((data as unknown as DbQuestionRow[]) || []).map(mapRowToQuestion);
  },

  /**
   * Generates a practice quiz instance.
   * - Authenticated: Creates a server-authoritative session via create_practice_session RPC.
   * - Anonymous: Generates a temporary local session from Supabase questions in sessionStorage.
   */
  async generateQuiz(config: QuizConfig): Promise<QuizState> {
    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;

    if (currentUser) {
      // Authenticated flow: call server RPC to issue practice session
      const { data, error } = await supabase.rpc('create_practice_session', {
        p_category: config.category,
        p_difficulty: config.difficulty,
        p_type: config.type,
        p_count: config.count,
      });

      if (!error && data && data.sessionId) {
        const questions: Question[] = ((data.questions as RpcQuestionItem[]) || []).map((q) => ({
          id: q.id,
          title: q.title,
          slug: q.slug,
          category: q.category as Category,
          topic: q.topic,
          difficulty: q.difficulty,
          type: q.type,
          shortSummary: q.shortSummary,
          explanationMarkdown: q.explanationMarkdown,
          codeSnippet: q.codeSnippet,
          interviewTip: q.interviewTip,
          options: Array.isArray(q.options) ? q.options : [],
          correctAnswer: q.correctAnswer,
          tags: Array.isArray(q.tags) ? q.tags : [],
          estimatedMinutes: 3,
        }));

        const quizId = data.sessionId;
        const quizState: QuizState = {
          id: quizId,
          sessionId: data.sessionId,
          config: data.config || config,
          questions,
          currentQuestionIndex: 0,
          selectedAnswers: {},
          startedAt: Date.now(),
          isCompleted: false,
        };

        this.saveQuizState(quizState);
        return quizState;
      }
    }

    // Anonymous flow: local randomized quiz in sessionStorage
    const matching = await this.getMatchingQuestions(config);
    const randomized = shuffleArray(matching);
    const selectedQuestions = randomized.slice(0, Math.min(config.count, matching.length));

    const quizId = `quiz_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const quizState: QuizState = {
      id: quizId,
      config,
      questions: selectedQuestions,
      currentQuestionIndex: 0,
      selectedAnswers: {},
      startedAt: Date.now(),
      isCompleted: false,
    };

    this.saveQuizState(quizState);
    return quizState;
  },

  /**
   * Retrieves active quiz state by ID from sessionStorage.
   */
  getQuizById(quizId: string): QuizState | null {
    try {
      const json = sessionStorage.getItem(`${QUIZ_STORAGE_PREFIX}${quizId}`);
      if (!json) return null;
      return JSON.parse(json) as QuizState;
    } catch {
      return null;
    }
  },

  /**
   * Asynchronously retrieves active quiz state from sessionStorage or restores from server RPC if authenticated.
   */
  async getQuizByIdAsync(quizId: string): Promise<QuizState | null> {
    const local = this.getQuizById(quizId);
    if (local) return local;

    // Try restoring from Supabase server RPC if quizId is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quizId);
    if (!isUuid) return null;

    try {
      const { data, error } = await supabase.rpc('get_practice_session', { p_session_id: quizId });
      if (error || !data) return null;

      const questions: Question[] = ((data.questions as RpcQuestionItem[]) || []).map((q) => ({
        id: q.id,
        title: q.title,
        slug: q.slug,
        category: q.category as Category,
        topic: q.topic,
        difficulty: q.difficulty,
        type: q.type,
        shortSummary: q.shortSummary,
        explanationMarkdown: q.explanationMarkdown,
        codeSnippet: q.codeSnippet,
        interviewTip: q.interviewTip,
        options: Array.isArray(q.options) ? q.options : [],
        correctAnswer: q.correctAnswer,
        tags: Array.isArray(q.tags) ? q.tags : [],
        estimatedMinutes: 3,
      }));

      const restored: QuizState = {
        id: data.sessionId,
        sessionId: data.sessionId,
        config: data.config,
        questions,
        currentQuestionIndex: 0,
        selectedAnswers: {},
        startedAt: new Date(data.createdAt).getTime(),
        isCompleted: data.status === 'completed',
        completedAt: data.completedAt ? new Date(data.completedAt).getTime() : undefined,
      };

      this.saveQuizState(restored);
      return restored;
    } catch {
      return null;
    }
  },

  /**
   * Saves updated active quiz state to sessionStorage
   */
  saveQuizState(quizState: QuizState): void {
    try {
      sessionStorage.setItem(`${QUIZ_STORAGE_PREFIX}${quizState.id}`, JSON.stringify(quizState));
    } catch {
      // Ignore storage errors
    }
  },

  /**
   * Finishes active quiz, computes score and question result items server-side via RPC for authenticated users,
   * or locally for anonymous users.
   */
  async finishQuiz(quizId: string): Promise<QuizAttemptResult | null> {
    const quizState = await this.getQuizByIdAsync(quizId) || this.getQuizById(quizId);
    if (!quizState) return null;

    const { data: authData } = await supabase.auth.getUser();
    const currentUser = authData?.user;
    const sessionId = quizState.sessionId || (quizState.id.length === 36 ? quizState.id : null);

    if (currentUser && sessionId) {
      // Authenticated flow: call submit_practice_session RPC
      const answersPayload = quizState.questions.map((q) => ({
        questionId: q.id,
        selectedAnswer: quizState.selectedAnswers[q.id] || null,
      }));

      const { data, error } = await supabase.rpc('submit_practice_session', {
        p_session_id: sessionId,
        p_answers: answersPayload,
      });

      if (!error && data && data.attemptId) {
        quizState.isCompleted = true;
        quizState.completedAt = Date.now();
        this.saveQuizState(quizState);

        const questionResults: QuestionResultItem[] = ((data.questionResults as RpcQuestionResultItem[]) || []).map((qr) => ({
          questionId: qr.questionId,
          questionTitle: qr.questionTitle,
          category: qr.category as Category,
          difficulty: qr.difficulty,
          type: qr.type,
          selectedAnswer: qr.selectedAnswer || undefined,
          correctAnswer: qr.correctAnswer || undefined,
          isCorrect: qr.isCorrect,
          explanationMarkdown: qr.explanationMarkdown || '',
          interviewTip: qr.interviewTip || undefined,
        }));

        invalidateDashboardCache();

        return {
          attemptId: data.attemptId,
          quizId: data.quizId || `quiz_${sessionId}`,
          config: data.config || quizState.config,
          totalQuestions: data.totalQuestions,
          correctAnswersCount: data.correctAnswersCount,
          incorrectAnswersCount: data.incorrectAnswersCount,
          scorePercentage: data.scorePercentage,
          startedAt: quizState.startedAt,
          completedAt: Date.now(),
          questionResults,
        };
      } else if (error) {
        console.error('[InterviewHub] RPC error submitting practice session:', error);
      }
    }

    // Anonymous flow: local score computation, sessionStorage-only
    const completedAt = Date.now();
    let correctCount = 0;

    const questionResults: QuestionResultItem[] = quizState.questions.map((q) => {
      const selected = quizState.selectedAnswers[q.id];
      const isCorrect = Boolean(selected && selected === q.correctAnswer);
      if (isCorrect) correctCount++;

      return {
        questionId: q.id,
        questionTitle: q.title,
        category: q.category,
        difficulty: q.difficulty,
        type: q.type,
        selectedAnswer: selected,
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanationMarkdown: q.explanationMarkdown || q.shortSummary,
        interviewTip: q.interviewTip,
      };
    });

    const totalQuestions = quizState.questions.length;
    const incorrectCount = totalQuestions - correctCount;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    const attemptId = `att_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const attemptResult: QuizAttemptResult = {
      attemptId,
      quizId: quizState.id,
      config: quizState.config,
      totalQuestions,
      correctAnswersCount: correctCount,
      incorrectAnswersCount: incorrectCount,
      scorePercentage,
      startedAt: quizState.startedAt,
      completedAt,
      questionResults,
    };

    // Mark local active quiz completed
    quizState.isCompleted = true;
    quizState.completedAt = completedAt;
    this.saveQuizState(quizState);

    return attemptResult;
  },

  /**
   * Retrieves a completed quiz attempt result by ID from Supabase.
   */
  async getAttemptResult(attemptId: string): Promise<QuizAttemptResult | null> {
    const { data: attemptRow, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attemptId)
      .maybeSingle();

    if (attemptError || !attemptRow) {
      return null;
    }

    const { data: answersRows, error: answersError } = await supabase
      .from('quiz_answers')
      .select('*, questions(*, categories(*))')
      .eq('attempt_id', attemptId);

    if (answersError) {
      console.error('[InterviewHub] Error fetching quiz answers:', answersError);
    }

    const questionResults: QuestionResultItem[] = (
      (answersRows as Array<{
        question_id: string;
        selected_answer?: string | null;
        is_correct: boolean;
        questions?:
          | {
              title?: string;
              difficulty?: string;
              type?: string;
              correct_answer?: string;
              explanation?: string;
              short_summary?: string;
              interview_tip?: string;
              categories?: { name?: string } | Array<{ name?: string }> | null;
            }
          | Array<{
              title?: string;
              difficulty?: string;
              type?: string;
              correct_answer?: string;
              explanation?: string;
              short_summary?: string;
              interview_tip?: string;
              categories?: { name?: string } | Array<{ name?: string }> | null;
            }>
          | null;
      }>) || []
    ).map((ansRow) => {
      const qRow = Array.isArray(ansRow.questions) ? ansRow.questions[0] : ansRow.questions;
      const catData = qRow?.categories
        ? Array.isArray(qRow.categories)
          ? qRow.categories[0]
          : qRow.categories
        : null;
      const categoryName = (catData?.name as Category) || attemptRow.config?.category || 'HTML';

      return {
        questionId: ansRow.question_id,
        questionTitle: qRow?.title || 'Question',
        category: categoryName,
        difficulty:
          (qRow?.difficulty as 'Beginner' | 'Junior' | 'Intermediate') ||
          attemptRow.config?.difficulty ||
          'Junior',
        type: (qRow?.type as 'Multiple Choice' | 'True/False') || 'Multiple Choice',
        selectedAnswer: ansRow.selected_answer || undefined,
        correctAnswer: qRow?.correct_answer || undefined,
        isCorrect: ansRow.is_correct,
        explanationMarkdown: qRow?.explanation || qRow?.short_summary || '',
        interviewTip: qRow?.interview_tip || undefined,
      };
    });

    const startedAt = new Date(attemptRow.started_at).getTime();
    const completedAt = new Date(attemptRow.completed_at).getTime();

    return {
      attemptId: attemptRow.id,
      quizId: attemptRow.quiz_id,
      config: attemptRow.config,
      totalQuestions: attemptRow.total_questions,
      correctAnswersCount: attemptRow.correct_count,
      incorrectAnswersCount: attemptRow.incorrect_count,
      scorePercentage: attemptRow.score_percentage,
      startedAt,
      completedAt,
      questionResults,
    };
  },

  /**
   * Retrieves completed attempt history for user from Supabase.
   */
  async getUserAttempts(userId?: string, limit?: number): Promise<QuizAttemptResult[]> {
    let query = supabase
      .from('quiz_attempts')
      .select('*')
      .order('completed_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    const { data: attemptsRows, error } = await query;
    if (error || !attemptsRows || attemptsRows.length === 0) {
      return [];
    }

    const results = await Promise.all(
      attemptsRows.map((attemptRow) => this.getAttemptResult(attemptRow.id))
    );

    return results.filter((res): res is QuizAttemptResult => res !== null);
  },

  /**
   * Lightweight aggregate query over ALL quiz_attempts for a user.
   * Single query, no joins, no N+1. Returns lifetime totals.
   */
  async getAttemptAggregates(userId: string): Promise<{
    practiceAttempts: number;
    questionsCompleted: number;
    totalCorrect: number;
  }> {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('total_questions, correct_count')
      .eq('user_id', userId);

    if (error || !data || data.length === 0) {
      return { practiceAttempts: 0, questionsCompleted: 0, totalCorrect: 0 };
    }

    return {
      practiceAttempts: data.length,
      questionsCompleted: data.reduce((sum, r) => sum + (r.total_questions || 0), 0),
      totalCorrect: data.reduce((sum, r) => sum + (r.correct_count || 0), 0),
    };
  },

  /**
   * Per-category breakdown over ALL quiz_answers for a user's attempts.
   * Single query with joins to questions→categories. No N+1.
   */
  async getCategoryBreakdown(userId: string): Promise<
    Array<{ category: string; correct: number; total: number }>
  > {
    // Step 1: Get all attempt IDs for this user (lightweight, no joins)
    const { data: attempts, error: attError } = await supabase
      .from('quiz_attempts')
      .select('id')
      .eq('user_id', userId);

    if (attError || !attempts || attempts.length === 0) return [];

    const attemptIds = attempts.map((a) => a.id);

    // Step 2: Get all answers for those attempts with question category
    const { data: answers, error: ansError } = await supabase
      .from('quiz_answers')
      .select('is_correct, questions!inner(categories!inner(name))')
      .in('attempt_id', attemptIds);

    if (ansError || !answers) return [];

    // Step 3: Aggregate by category
    const catMap = new Map<string, { correct: number; total: number }>();

    answers.forEach((ans) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const row = ans as any;
      const catName: string =
        row.questions?.categories?.name ??
        (Array.isArray(row.questions?.categories)
          ? row.questions.categories[0]?.name
          : undefined) ??
        'Unknown';

      const existing = catMap.get(catName) || { correct: 0, total: 0 };
      existing.total += 1;
      if (row.is_correct) existing.correct += 1;
      catMap.set(catName, existing);
    });

    return Array.from(catMap.entries()).map(([category, data]) => ({
      category,
      correct: data.correct,
      total: data.total,
    }));
  },
};

