import { supabase } from '../../../services/supabase';
import { Category, Question } from '../../questions/types/question';
import { DbQuestionRow, mapRowToQuestion } from '../../questions/utils/mapQuestion';
import { QuizConfig, QuizState, QuizAttemptResult, QuestionResultItem } from '../types/practice';

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
    }

    const { data, error } = await query;
    if (error || !data) {
      console.error('[InterviewHub] Error fetching matching quiz questions from Supabase:', error);
      return [];
    }

    return ((data as unknown as DbQuestionRow[]) || []).map(mapRowToQuestion);
  },

  /**
   * Generates a randomized practice quiz instance from Supabase questions and saves active state to sessionStorage
   */
  async generateQuiz(config: QuizConfig): Promise<QuizState> {
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
   * Retrieves active quiz state by ID from sessionStorage
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
   * Persists a finalized quiz attempt and per-question answer records atomically using PostgreSQL RPC save_quiz_attempt_with_answers.
   */
  async saveQuizAttemptToSupabase(attempt: QuizAttemptResult): Promise<void> {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      const attemptPayload = {
        attemptId: attempt.attemptId,
        user_id: currentUserId,
        quizId: attempt.quizId,
        config: attempt.config,
        totalQuestions: attempt.totalQuestions,
        correctAnswersCount: attempt.correctAnswersCount,
        incorrectAnswersCount: attempt.incorrectAnswersCount,
        scorePercentage: attempt.scorePercentage,
        startedAt: new Date(attempt.startedAt).toISOString(),
        completedAt: new Date(attempt.completedAt).toISOString(),
      };

      const answersPayload = attempt.questionResults.map((qr) => ({
        questionId: qr.questionId,
        selectedAnswer: qr.selectedAnswer || null,
        isCorrect: qr.isCorrect,
      }));

      // Atomically insert attempt parent and answer child records via RPC
      const { error } = await supabase.rpc('save_quiz_attempt_with_answers', {
        p_attempt: attemptPayload,
        p_answers: answersPayload,
      });

      if (error) {
        console.error('[InterviewHub] RPC error saving atomic quiz attempt:', error);
      }
    } catch (err) {
      console.error('[InterviewHub] Unexpected error persisting atomic quiz attempt:', err);
    }
  },

  /**
   * Finishes active quiz, computes score and question result items, and persists attempt to Supabase atomically.
   */
  async finishQuiz(quizId: string): Promise<QuizAttemptResult | null> {
    const quizState = this.getQuizById(quizId);
    if (!quizState) return null;

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

    // Save finalized attempt atomically to Supabase
    await this.saveQuizAttemptToSupabase(attemptResult);

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
  async getUserAttempts(userId?: string): Promise<QuizAttemptResult[]> {
    let query = supabase
      .from('quiz_attempts')
      .select('*')
      .order('completed_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data: attemptsRows, error } = await query;
    if (error || !attemptsRows || attemptsRows.length === 0) {
      return [];
    }

    const results: QuizAttemptResult[] = [];
    for (const attemptRow of attemptsRows) {
      const res = await this.getAttemptResult(attemptRow.id);
      if (res) results.push(res);
    }

    return results;
  },
};
