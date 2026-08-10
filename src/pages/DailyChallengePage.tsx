import { useState, useEffect, useCallback } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { Spinner } from '../components/ui/Spinner';
import { ErrorState } from '../components/ui/ErrorState';
import { Alert } from '../components/ui/Alert';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useDailyChallenge } from '../features/dailyChallenge/hooks/useDailyChallenge';
import { useDailyChallengeRunner } from '../features/dailyChallenge/hooks/useDailyChallengeRunner';
import { useDailyChallengeStats } from '../features/dailyChallenge/hooks/useDailyChallengeStats';
import { DailyChallengeHeader } from '../features/dailyChallenge/components/DailyChallengeHeader';
import { DailyChallengeProgress } from '../features/dailyChallenge/components/DailyChallengeProgress';
import { DailyChallengeNavigation } from '../features/dailyChallenge/components/DailyChallengeNavigation';
import { DailyChallengeSubmitModal } from '../features/dailyChallenge/components/DailyChallengeSubmitModal';
import { DailyChallengeResultView } from '../features/dailyChallenge/components/DailyChallengeResult';
import { DailyChallengeResult } from '../features/dailyChallenge/hooks/useDailyChallengeRunner';
import { QuizQuestion } from '../features/practice/components/QuizQuestion';
import { useAuth } from '../features/auth/hooks/useAuth';
import { dailyChallengeService } from '../features/dailyChallenge/services/dailyChallengeService';
import { practiceService } from '../features/practice/services/practiceService';

export default function DailyChallengePage() {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id ?? null;

  const { challenge, isLoading, error } = useDailyChallenge();

  // Check if authenticated user already completed today's challenge
  const [persistedResult, setPersistedResult] = useState<DailyChallengeResult | null>(null);
  const [isCheckingCompletion, setIsCheckingCompletion] = useState<boolean>(false);

  const checkExistingCompletion = useCallback(async () => {
    if (!isAuthenticated || !userId || !challenge) return;
    setIsCheckingCompletion(true);
    try {
      const completion = await dailyChallengeService.getTodayCompletion(userId, challenge.id);
      if (completion?.attemptId) {
        const attemptResult = await practiceService.getAttemptResult(completion.attemptId);
        if (attemptResult) {
          setPersistedResult({
            challengeId: challenge.id,
            challengeDate: challenge.challengeDate,
            totalQuestions: 5,
            correctAnswersCount: attemptResult.correctAnswersCount,
            incorrectAnswersCount: attemptResult.incorrectAnswersCount,
            scorePercentage: attemptResult.scorePercentage,
            startedAt: attemptResult.startedAt,
            completedAt: attemptResult.completedAt,
            questionResults: attemptResult.questionResults,
            attemptId: completion.attemptId,
            completionId: completion.id,
          });
        }
      }
    } catch {
      // non-fatal: user will see runner
    } finally {
      setIsCheckingCompletion(false);
    }
  }, [isAuthenticated, userId, challenge]);

  useEffect(() => {
    void checkExistingCompletion();
  }, [checkExistingCompletion]);

  const {
    currentIndex,
    currentQuestion,
    selectedAnswers,
    unansweredCount,
    isSubmitModalOpen,
    setIsSubmitModalOpen,
    result: localResult,
    isSubmitting,
    submitError,
    clearSubmitError,
    selectOption,
    goToPrevious,
    goToNext,
    handleSubmitClick,
    confirmSubmit,
  } = useDailyChallengeRunner(challenge, userId);

  // Active result = persisted (restored) OR freshly submitted
  const activeResult = persistedResult ?? localResult;

  // Stats — refresh after successful submission
  const { stats, refresh: refreshStats } = useDailyChallengeStats(userId, challenge?.id);

  // Refresh stats after result becomes available
  useEffect(() => {
    if (activeResult && isAuthenticated) {
      refreshStats();
    }
  }, [activeResult, isAuthenticated, refreshStats]);

  const pageIsLoading = isLoading || isCheckingCompletion;

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">
        {/* Loading state */}
        {pageIsLoading && (
          <div className="flex flex-col items-center justify-center min-h-[320px] gap-4">
            <Spinner size="lg" />
            <p className="text-slate-400 text-sm">Loading today's challenge…</p>
          </div>
        )}

        {/* Error state */}
        {!pageIsLoading && error && <ErrorState title="Challenge Unavailable" message={error} />}

        {/* Result state (persisted or freshly submitted) */}
        {!pageIsLoading && !error && activeResult && (
          <>
            <DailyChallengeHeader challengeDate={activeResult.challengeDate} />
            <DailyChallengeResultView
              result={activeResult}
              isAuthenticated={isAuthenticated}
              stats={stats}
            />
          </>
        )}

        {/* Active challenge runner state */}
        {!pageIsLoading && !error && challenge && !activeResult && currentQuestion && (
          <>
            <DailyChallengeHeader challengeDate={challenge.challengeDate} />

            <DailyChallengeProgress
              currentIndex={currentIndex}
              totalQuestions={5}
              selectedAnswers={selectedAnswers}
              questionIds={challenge.questions.map((q) => q.question.id)}
            />

            {/* Submission error alert — answers preserved, retry possible */}
            {submitError && (
              <Alert variant="error" title="Submission Failed">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-xs text-slate-300">{submitError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearSubmitError();
                      void confirmSubmit();
                    }}
                    id="dc-retry-submit"
                  >
                    Retry Submission
                  </Button>
                </div>
              </Alert>
            )}

            <Card className="border-slate-800 bg-slate-950/90 shadow-2xl">
              <CardContent className="pt-6 pb-4">
                <QuizQuestion
                  question={currentQuestion.question}
                  selectedOption={selectedAnswers[currentQuestion.question.id]}
                  onSelectOption={selectOption}
                />
              </CardContent>
            </Card>

            <DailyChallengeNavigation
              currentIndex={currentIndex}
              totalQuestions={5}
              onPrevious={goToPrevious}
              onNext={goToNext}
              onSubmit={handleSubmitClick}
              isSubmitting={isSubmitting}
            />
          </>
        )}
      </div>

      {/* Unanswered questions confirmation modal */}
      {challenge && !activeResult && (
        <DailyChallengeSubmitModal
          isOpen={isSubmitModalOpen}
          unansweredCount={unansweredCount}
          onClose={() => setIsSubmitModalOpen(false)}
          onConfirm={() => void confirmSubmit()}
        />
      )}
    </AppShell>
  );
}
