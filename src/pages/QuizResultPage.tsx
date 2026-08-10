import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { Alert } from '../components/ui/Alert';
import { useQuizResult } from '../features/practice/hooks/useQuizResult';
import { QuizResultSummary } from '../features/practice/components/QuizResultSummary';
import { QuizCategoryBreakdown } from '../features/practice/components/QuizCategoryBreakdown';
import { QuizWeakTopics } from '../features/practice/components/QuizWeakTopics';
import { QuizResultReview } from '../features/practice/components/QuizResultReview';
import { QuizResultActions } from '../features/practice/components/QuizResultActions';

export const QuizResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { result, isLoading, isNotFound } = useQuizResult(attemptId);

  const headerNav = (
    <>
      <Link to="/questions" className="hover:text-white transition-colors font-medium">
        Questions
      </Link>
      <Link to="/practice" className="hover:text-white transition-colors font-medium">
        Practice
      </Link>
      <Link to="/daily-challenge" className="hover:text-white transition-colors font-medium">
        Daily Challenge
      </Link>
    </>
  );

  const headerActions = (
    <Link to="/login">
      <Button variant="outline" size="sm">
        Log In
      </Button>
    </Link>
  );

  return (
    <AppShell
      header={
        <Header navLinks={headerNav} userActions={headerActions} mobileNavLinks={headerNav} />
      }
      footer={<Footer />}
    >
      <div className="flex flex-col gap-8 text-left pb-16 max-w-4xl mx-auto w-full">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <Link to="/practice">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              ← Practice Builder
            </Button>
          </Link>
          {attemptId && (
            <span className="text-xs font-mono text-slate-500">Attempt ID: {attemptId}</span>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-6 py-4">
            <Skeleton variant="rectangular" height="180px" width="100%" />
            <Skeleton variant="rectangular" height="140px" width="100%" />
            <Skeleton variant="rectangular" height="240px" width="100%" />
          </div>
        )}

        {/* Invalid Attempt ID / Not Found State */}
        {!isLoading && (isNotFound || !result) && (
          <div className="py-8">
            <ErrorState
              title="Attempt Result Not Found"
              message="The requested quiz attempt result does not exist in temporary session memory or has expired."
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

        {/* Loaded Attempt Result View */}
        {!isLoading && !isNotFound && result && (
          <div className="flex flex-col gap-8">
            {/* Anonymous Session Persistence Alert Banner */}
            <Alert variant="info" title="Temporary Session Result">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <span>
                  This quiz attempt is saved temporarily in your browser session memory. Create an
                  account or log in to persist your quiz history and track weak topics over time.
                </span>
                <Link to="/register" className="shrink-0">
                  <Button variant="primary" size="sm" className="whitespace-nowrap">
                    Register to Save →
                  </Button>
                </Link>
              </div>
            </Alert>

            {/* Score & Stat Summary Banner */}
            <QuizResultSummary result={result} />

            {/* Category Accuracy & Weak Topics Diagnostics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <QuizCategoryBreakdown result={result} />
              <QuizWeakTopics result={result} />
            </div>

            {/* Question-by-Question Review List */}
            <QuizResultReview result={result} />

            {/* Action CTAs */}
            <QuizResultActions config={result.config} />
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default QuizResultPage;
