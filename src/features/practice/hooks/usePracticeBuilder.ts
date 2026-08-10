import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, Difficulty, Question, QuestionType } from '../../questions/types/question';
import { QuizConfig } from '../types/practice';
import { practiceService } from '../services/practiceService';

export function usePracticeBuilder() {
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | 'All'>('All');
  const [difficulty, setDifficulty] = useState<Difficulty | 'All'>('All');
  const [type, setType] = useState<QuestionType | 'All'>('All');
  const [requestedCount, setRequestedCount] = useState<number>(5);

  const [matchingQuestions, setMatchingQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isStarting, setIsStarting] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    practiceService
      .getMatchingQuestions({ category, difficulty, type })
      .then((qs) => {
        if (isMounted) {
          setMatchingQuestions(qs);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setMatchingQuestions([]);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [category, difficulty, type]);

  const availableCount = matchingQuestions.length;
  const actualCount = Math.min(requestedCount, availableCount);
  const isValidConfig = availableCount > 0 && actualCount > 0;

  const startQuiz = async () => {
    if (!isValidConfig || isStarting) return;

    setIsStarting(true);
    try {
      const config: QuizConfig = {
        category,
        difficulty,
        type,
        count: actualCount,
      };

      const quizState = await practiceService.generateQuiz(config);
      navigate(`/practice/${quizState.id}`);
    } finally {
      setIsStarting(false);
    }
  };

  return {
    category,
    setCategory,
    difficulty,
    setDifficulty,
    type,
    setType,
    requestedCount,
    setRequestedCount,
    availableCount,
    actualCount,
    isValidConfig,
    isLoading,
    isStarting,
    startQuiz,
  };
}
