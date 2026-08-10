import { Question } from '../../questions/types/question';

export interface DailyChallengeQuestion {
  position: number;
  question: Question;
}

export interface DailyChallenge {
  id: string;
  challengeDate: string;
  createdAt: string;
  questions: DailyChallengeQuestion[];
}

export interface DailyChallengeCompletion {
  id: string;
  userId: string;
  challengeId: string;
  attemptId: string;
  completedAt: string;
  challengeDate?: string;
}

export interface DailyChallengeSubmitAnswer {
  questionId: string;
  selectedAnswer: string | null;
}

export interface DailyChallengeSubmitResult {
  completionId: string;
  attemptId: string;
  challengeId: string;
  challengeDate: string;
  correctCount: number;
  incorrectCount: number;
  scorePercentage: number;
  alreadyCompleted: boolean;
}

export interface DailyChallengeStats {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  totalCompletions: number;
}
