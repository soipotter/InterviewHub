import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizState } from '../types/practice';
import { practiceService } from '../services/practiceService';

export function useQuizRunner(quizId: string | undefined) {
  const navigate = useNavigate();

  const [quizState, setQuizState] = useState<QuizState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [isUnansweredModalOpen, setIsUnansweredModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!quizId) {
      setIsNotFound(true);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    practiceService.getQuizByIdAsync(quizId).then((loaded) => {
      if (!isMounted) return;
      if (!loaded) {
        setIsNotFound(true);
        setQuizState(null);
      } else {
        setQuizState(loaded);
        setIsNotFound(false);
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [quizId]);

  const currentIndex = quizState?.currentQuestionIndex ?? 0;
  const totalQuestions = quizState?.questions.length ?? 0;
  const currentQuestion = quizState?.questions[currentIndex];

  const selectedOption =
    currentQuestion && quizState ? quizState.selectedAnswers[currentQuestion.id] : undefined;

  const answeredCount = quizState ? Object.keys(quizState.selectedAnswers).length : 0;
  const unansweredCount = totalQuestions - answeredCount;

  const handleSelectOption = useCallback(
    (questionId: string, selectedOptionValue: string) => {
      if (!quizState) return;

      const updatedAnswers = {
        ...quizState.selectedAnswers,
        [questionId]: selectedOptionValue,
      };

      const updatedState: QuizState = {
        ...quizState,
        selectedAnswers: updatedAnswers,
      };

      setQuizState(updatedState);
      practiceService.saveQuizState(updatedState);
    },
    [quizState]
  );

  const selectOption = useCallback(
    (option: string) => {
      if (currentQuestion) {
        handleSelectOption(currentQuestion.id, option);
      }
    },
    [currentQuestion, handleSelectOption]
  );

  const handleNext = useCallback(() => {
    if (!quizState || currentIndex >= totalQuestions - 1) return;

    const updatedState: QuizState = {
      ...quizState,
      currentQuestionIndex: currentIndex + 1,
    };

    setQuizState(updatedState);
    practiceService.saveQuizState(updatedState);
  }, [quizState, currentIndex, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (!quizState || currentIndex <= 0) return;

    const updatedState: QuizState = {
      ...quizState,
      currentQuestionIndex: currentIndex - 1,
    };

    setQuizState(updatedState);
    practiceService.saveQuizState(updatedState);
  }, [quizState, currentIndex]);

  const confirmFinish = useCallback(async () => {
    if (!quizState) return;

    const attemptResult = await practiceService.finishQuiz(quizState.id);
    if (attemptResult) {
      navigate(`/results/${attemptResult.attemptId}`);
    }
  }, [quizState, navigate]);

  const handleFinishClick = useCallback(() => {
    if (unansweredCount > 0) {
      setIsUnansweredModalOpen(true);
    } else {
      confirmFinish();
    }
  }, [unansweredCount, confirmFinish]);

  return {
    quizState,
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedOption,
    selectOption,
    answeredCount,
    unansweredCount,
    isLoading,
    isNotFound,
    isUnansweredModalOpen,
    setIsUnansweredModalOpen,
    handleSelectOption,
    handleNext,
    handlePrevious,
    nextQuestion: handleNext,
    prevQuestion: handlePrevious,
    handleFinishClick,
    confirmFinish,
  };
}
