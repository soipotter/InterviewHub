import { Difficulty, QuestionType } from '../../questions/types/question';

export interface PendingCommunitySubmission {
  id: string;
  userId: string;
  title: string;
  categoryId: string;
  categoryName?: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  shortSummary: string;
  explanation: string;
  options: string[] | null;
  correctAnswer: string | null;
  codeSnippet: string | null;
  interviewTip: string | null;
  status: 'pending' | 'approved' | 'rejected';
  publishedQuestionId?: string | null;
  moderatedBy?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface AdminStats {
  pendingSubmissionsCount: number;
  totalCategoriesCount: number;
}

export interface ApproveSubmissionResult {
  submissionId: string;
  status: 'approved';
  publishedQuestionId: string;
  alreadyModerated: boolean;
  message: string;
}

export interface RejectSubmissionResult {
  submissionId: string;
  status: 'rejected';
  rejectionReason: string;
  alreadyModerated: boolean;
  message: string;
}
