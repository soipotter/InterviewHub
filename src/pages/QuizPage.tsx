import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useQuizRunner } from '../features/practice/hooks/useQuizRunner';
import { QuizHeader } from '../features/practice/components/QuizHeader';
import { QuizQuestion } from '../features/practice/components/QuizQuestion';
import { QuizNavigation } from '../features/practice/components/QuizNavigation';
import { UnansweredModal } from '../features/practice/components/UnansweredModal';

export const QuizPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const runner = useQuizRunner(quizId);

  return (
    <AppShell>
      <div className="flex flex-col gap-6 text-left pb-16 max-w-3xl mx-auto w-full">
        {/* Top Back Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <Link to="/practice">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              ← Exit Practice
            </Button>
          </Link>
          {quizId && <span className="text-xs font-mono text-slate-500">ID: {quizId}</span>}
        </div>

        {/* Loading State */}
        {runner.isLoading && (
          <div className="flex flex-col gap-6 py-4">
            <Skeleton variant="rectangular" height="16px" width="100%" />
            <Skeleton variant="text" height="32px" width="70%" />
            <Skeleton variant="rectangular" height="200px" width="100%" />
          </div>
        )}

        {/* Invalid Quiz ID / Not Found State */}
        {!runner.isLoading && (runner.isNotFound || !runner.currentQuestion) && (
          <div className="py-8">
            <ErrorState
              title="Quiz Not Found"
              message="The requested practice quiz session does not exist or has expired."
            />
            <div className="flex justify-center mt-4">
              <Link to="/practice">
                <Button variant="primary" size="md">
                  Return to Practice Builder
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Active Quiz Session State */}
        {!runner.isLoading && !runner.isNotFound && runner.currentQuestion && (
          <div className="flex flex-col gap-6 bg-slate-950/80 p-6 md:p-8 rounded-2xl border border-slate-800 shadow-2xl">
            {/* Header & Progress */}
            <QuizHeader
              currentIndex={runner.currentIndex}
              totalQuestions={runner.totalQuestions}
              category={runner.currentQuestion.category}
              difficulty={runner.currentQuestion.difficulty}
            />

            {/* Current Question & Options */}
            <QuizQuestion
              question={runner.currentQuestion}
              selectedOption={runner.selectedOption}
              onSelectOption={runner.selectOption}
            />

            {/* Navigation Controls */}
            <QuizNavigation
              currentIndex={runner.currentIndex}
              totalQuestions={runner.totalQuestions}
              onPrev={runner.prevQuestion}
              onNext={runner.nextQuestion}
              onFinish={runner.handleFinishClick}
            />
          </div>
        )}

        {/* Unanswered Questions Warning Modal */}
        <UnansweredModal
          isOpen={runner.isUnansweredModalOpen}
          onClose={() => runner.setIsUnansweredModalOpen(false)}
          unansweredCount={runner.unansweredCount}
          totalQuestions={runner.totalQuestions}
          onConfirmSubmit={runner.confirmFinish}
        />
      </div>
    </AppShell>
  );
};

export default QuizPage;
