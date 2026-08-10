import { Difficulty, QuestionType } from '../../questions/types/question';

// ============================================================================
// Community Submission Form Types
// ============================================================================

/**
 * Raw form state managed by the hook. All user-editable fields only.
 * Protected DB fields (user_id, status, moderated_by, rejection_reason)
 * are intentionally absent — they are set by the database RPC.
 */
export interface CommunityQuestionFormValues {
  title: string;
  categoryId: string; // UUID from public.categories
  topic: string;
  difficulty: Difficulty | '';
  type: QuestionType | '';
  shortSummary: string;
  explanation: string;
  // Multiple Choice options (4 text inputs)
  options: [string, string, string, string];
  correctAnswer: string; // must match one of options (MC) or 'True'/'False' (TF)
  codeSnippet: string;
  interviewTip: string;
}

/**
 * Typed field-level validation errors.
 * Keys match CommunityQuestionFormValues fields.
 */
export type CommunityQuestionFormErrors = Partial<
  Record<
    keyof CommunityQuestionFormValues | 'options_0' | 'options_1' | 'options_2' | 'options_3',
    string
  >
>;

/**
 * Cleaned, type-validated input sent to communityService.submitCommunityQuestion().
 * Matches the deployed RPC parameter list exactly.
 */
export interface CommunityQuestionSubmissionInput {
  title: string;
  categoryId: string;
  topic: string;
  difficulty: Difficulty;
  type: QuestionType;
  shortSummary: string;
  explanation: string;
  options: string[] | null; // null for True/False
  correctAnswer: string;
  codeSnippet: string | null;
  interviewTip: string | null;
}

/**
 * Typed result returned from communityService.submitCommunityQuestion().
 */
export interface CommunityQuestionSubmissionResult {
  id: string;
  status: 'pending';
  message: string;
}

/**
 * Category option for the form Select.
 */
export interface CategoryOption {
  id: string; // UUID from public.categories
  name: string; // Display name e.g. 'JavaScript'
  slug: string;
}
