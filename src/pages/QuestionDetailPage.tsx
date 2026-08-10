import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/ErrorState';
import { useQuestionDetail } from '../features/questions/hooks/useQuestionDetail';
import { QuestionMetadata } from '../features/questions/components/QuestionMetadata';
import { QuestionExplanation } from '../features/questions/components/QuestionExplanation';
import { QuestionReferences } from '../features/questions/components/QuestionReferences';
import { RelatedQuestions } from '../features/questions/components/RelatedQuestions';

export const QuestionDetailPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const { question, relatedQuestions, isLoading, isError, isNotFound, refetch } =
    useQuestionDetail(questionId);

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
      <div className="flex flex-col gap-6 text-left pb-16">
        {/* Back Navigation Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <Link to="/questions">
            <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
              ← Back to Questions
            </Button>
          </Link>
          {question && <span className="text-xs font-mono text-slate-500">ID: {question.id}</span>}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-6 py-4">
            <div className="flex items-center gap-3">
              <Skeleton variant="text" width="100px" height="24px" />
              <Skeleton variant="text" width="80px" height="24px" />
            </div>
            <Skeleton variant="text" width="80%" height="36px" />
            <Skeleton variant="rectangular" height="120px" />
            <Skeleton variant="rectangular" height="200px" />
          </div>
        )}

        {/* Not Found State */}
        {!isLoading && (isNotFound || !question) && (
          <div className="py-8">
            <ErrorState
              title="Question Not Found"
              message="The requested interview question ID does not exist or may have been moved."
              onRetry={refetch}
            />
            <div className="flex justify-center mt-4">
              <Link to="/questions">
                <Button variant="primary" size="md">
                  Return to Question Bank
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && isError && !isNotFound && (
          <div className="py-8">
            <ErrorState
              title="Failed to Load Detail"
              message="An error occurred while loading this question's details. Please try again."
              onRetry={refetch}
            />
          </div>
        )}

        {/* Question Detail Content State */}
        {!isLoading && !isError && !isNotFound && question && (
          <div className="flex flex-col gap-8">
            {/* Header & Metadata */}
            <QuestionMetadata question={question} />

            {/* Question Options, Reveal Mechanics & Explanation */}
            <QuestionExplanation question={question} />

            {/* References */}
            <QuestionReferences sources={question.sources} />

            {/* Related Questions */}
            <RelatedQuestions relatedQuestions={relatedQuestions} />
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default QuestionDetailPage;
