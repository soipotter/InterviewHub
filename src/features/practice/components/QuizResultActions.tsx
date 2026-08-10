import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { QuizConfig } from '../types/practice';
import { practiceService } from '../services/practiceService';
import { Button } from '../../../components/ui/Button';

export interface QuizResultActionsProps {
  config: QuizConfig;
}

export const QuizResultActions: React.FC<QuizResultActionsProps> = ({ config }) => {
  const navigate = useNavigate();

  const handleRetrySameQuiz = async () => {
    const newQuizState = await practiceService.generateQuiz(config);
    navigate(`/practice/${newQuizState.id}`);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 py-4">
      <Button variant="primary" size="lg" onClick={handleRetrySameQuiz}>
        Retry Quiz (Same Config) ↺
      </Button>
      <Link to="/practice">
        <Button variant="outline" size="lg">
          Configure New Practice
        </Button>
      </Link>
      <Link to="/questions">
        <Button variant="ghost" size="lg" className="text-slate-300 hover:text-white">
          Browse Question Bank →
        </Button>
      </Link>
    </div>
  );
};
