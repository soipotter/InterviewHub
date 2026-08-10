import { useState, useCallback, useEffect, useRef } from 'react';
import { DailyChallenge } from '../types/dailyChallenge';
import { QuestionResultItem } from '../../practice/types/practice';
import { dailyChallengeService } from '../services/dailyChallengeService';

// Session storage key helpers — user-scoped to prevent cross-account leakage
function getStorageKey(challengeId: string, userId: string | null): string {
  if (userId) {
    return `ih_dc_user_${userId}_${challengeId}`;
  }
  return `ih_dc_guest_${challengeId}`;
}

function loadAnswersFromStorage(key: string): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

function clearStorage(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export interface DailyChallengeResult {
  challengeId: string;
  challengeDate: string;
  totalQuestions: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  scorePercentage: number;
  startedAt: number;
  completedAt: number;
  questionResults: QuestionResultItem[];
  /** Set when the result was persisted to DB (authenticated). undefined for anonymous. */
  attemptId?: string;
  completionId?: string;
}

export interface UseDailyChallengeRunnerReturn {
  currentIndex: number;
  currentQuestion: DailyChallenge['questions'][0] | null;
  selectedAnswers: Record<string, string>;
  answeredCount: number;
  unansweredCount: number;
  isSubmitModalOpen: boolean;
  setIsSubmitModalOpen: (open: boolean) => void;
  result: DailyChallengeResult | null;
  isSubmitting: boolean;
  submitError: string | null;
  clearSubmitError: () => void;
  selectOption: (optionText: string) => void;
  goToPrevious: () => void;
  goToNext: () => void;
  handleSubmitClick: () => void;
  confirmSubmit: () => Promise<void>;
}

export function useDailyChallengeRunner(
  challenge: DailyChallenge | null,
  userId: string | null
): UseDailyChallengeRunnerReturn {
  const storageKeyRef = useRef<string | null>(null);

  // Compute storage key only when challenge/userId are known
  if (challenge && storageKeyRef.current === null) {
    storageKeyRef.current = getStorageKey(challenge.id, userId);
  }
  // If userId changes (login/logout) while challenge is loaded, update key and wipe state
  const [prevUserId, setPrevUserId] = useState<string | null>(userId);
  if (userId !== prevUserId && challenge) {
    storageKeyRef.current = getStorageKey(challenge.id, userId);
    setPrevUserId(userId);
  }

  const storageKey = storageKeyRef.current;

  // Load persisted in-progress answers for this user/challenge
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(() => {
    if (!challenge) return {};
    const key = getStorageKey(challenge.id, userId);
    return loadAnswersFromStorage(key);
  });

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState<boolean>(false);
  const [result, setResult] = useState<DailyChallengeResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  // Persist selected answers to sessionStorage on every change
  useEffect(() => {
    if (!storageKey) return;
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(selectedAnswers));
    } catch {
      // ignore storage errors
    }
  }, [selectedAnswers, storageKey]);

  // Reset state when userId changes (auth boundary crossing)
  useEffect(() => {
    if (!challenge) return;
    const newKey = getStorageKey(challenge.id, userId);
    storageKeyRef.current = newKey;
    const savedAnswers = loadAnswersFromStorage(newKey);
    setSelectedAnswers(savedAnswers);
    setResult(null);
    setSubmitError(null);
    startedAtRef.current = Date.now();
  }, [userId, challenge]);

  const questions = challenge?.questions ?? [];
  const currentQuestion = questions[currentIndex] ?? null;
  const answeredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = 5 - answeredCount;

  const selectOption = useCallback(
    (optionText: string) => {
      if (!currentQuestion || isSubmitting) return;
      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQuestion.question.id]: optionText,
      }));
    },
    [currentQuestion, isSubmitting]
  );

  const goToPrevious = useCallback(() => {
    setCurrentIndex((i) => Math.max(0, i - 1));
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(4, i + 1));
  }, []);

  const clearSubmitError = useCallback(() => setSubmitError(null), []);

  const confirmSubmit = useCallback(async () => {
    if (!challenge || isSubmitting) return;
    setIsSubmitModalOpen(false);
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (userId) {
        // === AUTHENTICATED PATH: persist to Supabase atomically ===
        const answers = challenge.questions.map(({ question }) => ({
          questionId: question.id,
          selectedAnswer: selectedAnswers[question.id] ?? null,
        }));

        const submissionResult = await dailyChallengeService.submitDailyChallenge(
          challenge.id,
          answers,
          new Date(startedAtRef.current)
        );

        // Build result using DB-authoritative scores, but keep local answer/question enrichment
        const completedAt = Date.now();
        const questionResults: QuestionResultItem[] = challenge.questions.map(({ question }) => {
          const selected = selectedAnswers[question.id];
          // We don't receive per-question correctness from RPC, compute locally for review display
          // Note: RPC computed authoritative scores; local computation is for UI display only
          const isCorrect = Boolean(selected && selected === question.correctAnswer);
          return {
            questionId: question.id,
            questionTitle: question.title,
            category: question.category,
            difficulty: question.difficulty,
            type: question.type,
            selectedAnswer: selected,
            correctAnswer: question.correctAnswer,
            isCorrect,
            explanationMarkdown: question.explanationMarkdown || question.shortSummary,
            interviewTip: question.interviewTip,
          };
        });

        if (storageKey) clearStorage(storageKey);

        setResult({
          challengeId: challenge.id,
          challengeDate: submissionResult.challengeDate,
          totalQuestions: 5,
          correctAnswersCount: submissionResult.correctCount,
          incorrectAnswersCount: submissionResult.incorrectCount,
          scorePercentage: submissionResult.scorePercentage,
          startedAt: startedAtRef.current,
          completedAt,
          questionResults,
          attemptId: submissionResult.attemptId,
          completionId: submissionResult.completionId,
        });
      } else {
        // === ANONYMOUS PATH: local-only scoring, zero DB writes ===
        const completedAt = Date.now();
        let correctCount = 0;

        const questionResults: QuestionResultItem[] = challenge.questions.map(({ question }) => {
          const selected = selectedAnswers[question.id];
          const isCorrect = Boolean(selected && selected === question.correctAnswer);
          if (isCorrect) correctCount++;
          return {
            questionId: question.id,
            questionTitle: question.title,
            category: question.category,
            difficulty: question.difficulty,
            type: question.type,
            selectedAnswer: selected,
            correctAnswer: question.correctAnswer,
            isCorrect,
            explanationMarkdown: question.explanationMarkdown || question.shortSummary,
            interviewTip: question.interviewTip,
          };
        });

        const incorrectCount = 5 - correctCount;
        const scorePercentage = Math.round((correctCount / 5) * 100);

        if (storageKey) clearStorage(storageKey);

        setResult({
          challengeId: challenge.id,
          challengeDate: challenge.challengeDate,
          totalQuestions: 5,
          correctAnswersCount: correctCount,
          incorrectAnswersCount: incorrectCount,
          scorePercentage,
          startedAt: startedAtRef.current,
          completedAt,
          questionResults,
        });
      }
    } catch (err) {
      // Persistence failed: keep answers intact, show error
      const message = err instanceof Error ? err.message : 'Failed to submit. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [challenge, userId, selectedAnswers, isSubmitting, storageKey]);

  const handleSubmitClick = useCallback(() => {
    if (isSubmitting) return;
    if (unansweredCount > 0) {
      setIsSubmitModalOpen(true);
    } else {
      void confirmSubmit();
    }
  }, [unansweredCount, confirmSubmit, isSubmitting]);

  return {
    currentIndex,
    currentQuestion,
    selectedAnswers,
    answeredCount,
    unansweredCount,
    isSubmitModalOpen,
    setIsSubmitModalOpen,
    result,
    isSubmitting,
    submitError,
    clearSubmitError,
    selectOption,
    goToPrevious,
    goToNext,
    handleSubmitClick,
    confirmSubmit,
  };
}
