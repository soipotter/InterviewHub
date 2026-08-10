import { useState, useEffect, useCallback } from 'react';
import { Difficulty, QuestionType } from '../../questions/types/question';
import {
  CategoryOption,
  CommunityQuestionFormErrors,
  CommunityQuestionFormValues,
  CommunityQuestionSubmissionResult,
} from '../types/community';
import { communityService } from '../services/communityService';
import { validateCommunityQuestion } from '../utils/validateCommunityQuestion';

type FormState = 'idle' | 'submitting' | 'success' | 'error';

const EMPTY_OPTIONS: [string, string, string, string] = ['', '', '', ''];

function buildInitialValues(): CommunityQuestionFormValues {
  return {
    title: '',
    categoryId: '',
    topic: '',
    difficulty: '',
    type: '',
    shortSummary: '',
    explanation: '',
    options: [...EMPTY_OPTIONS] as [string, string, string, string],
    correctAnswer: '',
    codeSnippet: '',
    interviewTip: '',
  };
}

export function useCommunityQuestionForm() {
  const [values, setValues] = useState<CommunityQuestionFormValues>(buildInitialValues);
  const [errors, setErrors] = useState<CommunityQuestionFormErrors>({});
  const [touched, setTouched] = useState(false);
  const [formState, setFormState] = useState<FormState>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<CommunityQuestionSubmissionResult | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    let isMounted = true;
    communityService.getCategories().then((cats) => {
      if (isMounted) {
        setCategories(cats);
        setCategoriesLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Re-validate when touched
  useEffect(() => {
    if (touched) {
      setErrors(validateCommunityQuestion(values));
    }
  }, [values, touched]);

  // Field updaters
  const setField = useCallback(
    <K extends keyof CommunityQuestionFormValues>(
      field: K,
      value: CommunityQuestionFormValues[K]
    ) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const setOption = useCallback((index: 0 | 1 | 2 | 3, value: string) => {
    setValues((prev) => {
      const next: [string, string, string, string] = [...prev.options] as [
        string,
        string,
        string,
        string,
      ];
      next[index] = value;
      // If the correct answer was set to the old value of this option, clear it
      const newCorrect = prev.correctAnswer === prev.options[index] ? '' : prev.correctAnswer;
      return { ...prev, options: next, correctAnswer: newCorrect };
    });
  }, []);

  // When type changes, reset answer-config state to prevent stale cross-type state
  const setType = useCallback((newType: QuestionType | '') => {
    setValues((prev) => ({
      ...prev,
      type: newType,
      options: [...EMPTY_OPTIONS] as [string, string, string, string],
      correctAnswer: '',
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (formState === 'submitting') return;
    setTouched(true);
    const validationErrors = validateCommunityQuestion(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setFormState('submitting');
    setSubmitError(null);

    try {
      const input = {
        title: values.title.trim(),
        categoryId: values.categoryId,
        topic: values.topic.trim(),
        difficulty: values.difficulty as Difficulty,
        type: values.type as QuestionType,
        shortSummary: values.shortSummary.trim(),
        explanation: values.explanation.trim(),
        options: values.type === 'Multiple Choice' ? values.options.map((o) => o.trim()) : null,
        correctAnswer: values.correctAnswer.trim(),
        codeSnippet: values.codeSnippet.trim() || null,
        interviewTip: values.interviewTip.trim() || null,
      };

      const res = await communityService.submitCommunityQuestion(input);
      setResult(res);
      setFormState('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed. Please try again.';
      setSubmitError(msg);
      setFormState('error');
    }
  }, [values, formState]);

  const resetForm = useCallback(() => {
    setValues(buildInitialValues());
    setErrors({});
    setTouched(false);
    setFormState('idle');
    setSubmitError(null);
    setResult(null);
  }, []);

  const isSubmitting = formState === 'submitting';
  const isSuccess = formState === 'success';

  return {
    values,
    errors,
    formState,
    isSubmitting,
    isSuccess,
    submitError,
    result,
    categories,
    categoriesLoading,
    setField,
    setOption,
    setType,
    handleSubmit,
    resetForm,
  };
}
