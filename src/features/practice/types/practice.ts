import { Category, Difficulty, Question, QuestionType } from '../../questions/types/question';

export interface QuizConfig {
  category: Category | 'All';
  difficulty: Difficulty | 'All';
  type: QuestionType | 'All';
  count: number;
}

export interface QuizState {
  id: string;
  sessionId?: string;
  config: QuizConfig;
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswers: Record<string, string>; // key: questionId, value: selectedOptionText
  startedAt: number;
  isCompleted: boolean;
  completedAt?: number;
}

export interface QuestionResultItem {
  questionId: string;
  questionTitle: string;
  category: Category;
  difficulty: Difficulty;
  type: QuestionType;
  selectedAnswer?: string;
  correctAnswer?: string;
  isCorrect: boolean;
  explanationMarkdown?: string;
  interviewTip?: string;
}

export interface QuizAttemptResult {
  attemptId: string;
  quizId: string;
  config: QuizConfig;
  totalQuestions: number;
  correctAnswersCount: number;
  incorrectAnswersCount: number;
  scorePercentage: number;
  startedAt: number;
  completedAt: number;
  questionResults: QuestionResultItem[];
}
