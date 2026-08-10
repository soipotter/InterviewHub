import { Difficulty, QuestionType } from '../../questions/types/question';
import { CommunityQuestionFormErrors, CommunityQuestionFormValues } from '../types/community';

const SUPPORTED_DIFFICULTIES: Difficulty[] = ['Beginner', 'Junior', 'Intermediate'];
const SUPPORTED_TYPES: QuestionType[] = ['Multiple Choice', 'True/False'];

/**
 * Pure client-side validation for community question form values.
 * Returns a map of field-level errors. Empty object = valid.
 * Database constraints remain the authoritative validation boundary.
 */
export function validateCommunityQuestion(
  values: CommunityQuestionFormValues
): CommunityQuestionFormErrors {
  const errors: CommunityQuestionFormErrors = {};

  // Title
  if (!values.title.trim()) {
    errors.title = 'Question title is required.';
  }

  // Category
  if (!values.categoryId) {
    errors.categoryId = 'Please select a category.';
  }

  // Topic
  if (!values.topic.trim()) {
    errors.topic = 'Topic is required.';
  }

  // Difficulty
  if (!values.difficulty || !SUPPORTED_DIFFICULTIES.includes(values.difficulty as Difficulty)) {
    errors.difficulty = 'Please select a difficulty level.';
  }

  // Type
  if (!values.type || !SUPPORTED_TYPES.includes(values.type as QuestionType)) {
    errors.type = 'Please select a question type.';
  }

  // Short Summary
  if (!values.shortSummary.trim()) {
    errors.shortSummary = 'Short summary is required.';
  }

  // Explanation
  if (!values.explanation.trim()) {
    errors.explanation = 'Explanation is required.';
  }

  // Correct Answer required for all types
  if (!values.correctAnswer.trim()) {
    errors.correctAnswer = 'Please select or provide a correct answer.';
  }

  // Multiple Choice specific
  if (values.type === 'Multiple Choice') {
    const trimmed = values.options.map((o) => o.trim());

    // Validate each individual option
    (trimmed as string[]).forEach((opt, idx) => {
      const key = `options_${idx}` as keyof CommunityQuestionFormErrors;
      if (!opt) {
        errors[key] = `Option ${idx + 1} cannot be empty.`;
      }
    });

    // Check for duplicates (case-insensitive)
    const normalized = trimmed.map((o) => o.toLowerCase());
    const hasDuplicates = normalized.some((val, idx) => val && normalized.indexOf(val) !== idx);
    if (hasDuplicates) {
      errors.options = 'All answer options must be unique.';
    }

    // Correct answer must be one of the options
    if (values.correctAnswer && !trimmed.includes(values.correctAnswer.trim())) {
      errors.correctAnswer = 'The correct answer must match one of the answer options exactly.';
    }
  }

  // True/False specific
  if (values.type === 'True/False') {
    if (values.correctAnswer !== 'True' && values.correctAnswer !== 'False') {
      errors.correctAnswer = 'Correct answer must be "True" or "False".';
    }
  }

  return errors;
}
