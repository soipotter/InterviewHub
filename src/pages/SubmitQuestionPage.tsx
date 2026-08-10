import React from 'react';
import { Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Radio } from '../components/ui/Radio';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { useCommunityQuestionForm } from '../features/community/hooks/useCommunityQuestionForm';
import type { CommunityQuestionFormErrors } from '../features/community/types/community';

// ──────────────────────────────────────────────────────────────────────────────
// Form Section wrapper
// ──────────────────────────────────────────────────────────────────────────────
const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Card className="border-slate-800 bg-slate-950/80">
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-semibold text-indigo-400 uppercase tracking-wider">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="flex flex-col gap-5">{children}</CardContent>
  </Card>
);

// ──────────────────────────────────────────────────────────────────────────────
// Success State
// ──────────────────────────────────────────────────────────────────────────────
const SuccessView: React.FC<{ onSubmitAnother: () => void }> = ({ onSubmitAnother }) => (
  <div className="flex flex-col items-center gap-6 py-16 text-center max-w-lg mx-auto">
    <div className="w-16 h-16 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-3xl">
      ✓
    </div>
    <div className="flex flex-col gap-2">
      <h2 className="text-xl font-bold text-white">Question submitted for review.</h2>
      <p className="text-sm text-slate-400">
        Thanks for contributing. Your submission will be reviewed before it appears in the public
        question bank.
      </p>
    </div>
    <div className="flex flex-wrap gap-3 justify-center">
      <Button variant="primary" size="md" onClick={onSubmitAnother} id="submit-another-btn">
        Submit Another Question
      </Button>
      <Link to="/questions">
        <Button variant="outline" size="md" id="browse-questions-btn">
          Browse Question Bank
        </Button>
      </Link>
    </div>
  </div>
);

// ──────────────────────────────────────────────────────────────────────────────
// Main Page
// ──────────────────────────────────────────────────────────────────────────────
export const SubmitQuestionPage: React.FC = () => {
  const {
    values,
    errors,
    isSubmitting,
    isSuccess,
    submitError,
    categories,
    categoriesLoading,
    setField,
    setOption,
    setType,
    handleSubmit,
    resetForm,
  } = useCommunityQuestionForm();

  if (isSuccess) {
    return (
      <AppShell>
        <SuccessView onSubmitAnother={resetForm} />
      </AppShell>
    );
  }

  const categoryOptions = [
    { value: '', label: 'Select a category…', disabled: true },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const difficultyOptions = [
    { value: '', label: 'Select difficulty…', disabled: true },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Junior', label: 'Junior' },
    { value: 'Intermediate', label: 'Intermediate' },
  ];

  const typeOptions = [
    { value: '', label: 'Select question type…', disabled: true },
    { value: 'Multiple Choice', label: 'Multiple Choice' },
    { value: 'True/False', label: 'True/False' },
  ];

  const isMultipleChoice = values.type === 'Multiple Choice';
  const isTrueFalse = values.type === 'True/False';

  // Helper: render option-level error
  const optionError = (idx: 0 | 1 | 2 | 3): string | undefined =>
    (errors as CommunityQuestionFormErrors)[`options_${idx}`];

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col gap-2">
          <Badge variant="default" size="md" className="w-fit">
            Community Contribution
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Submit a Community Question
          </h1>
          <p className="text-sm text-slate-400">
            Share an interview question with the community. Your submission will be reviewed before
            it is added to the public question bank.
          </p>
        </div>

        {/* Global submission error */}
        {submitError && (
          <Alert variant="error" title="Submission Failed">
            <p className="text-xs text-slate-300">{submitError}</p>
          </Alert>
        )}

        {/* ── SECTION 1: Question Details ── */}
        <FormSection title="Question Details">
          <Input
            id="community-title"
            label="Question / Title"
            placeholder="e.g. What is the difference between let, const, and var?"
            required
            value={values.title}
            onChange={(e) => setField('title', e.target.value)}
            error={errors.title}
            disabled={isSubmitting}
            aria-describedby={errors.title ? 'community-title-error' : undefined}
          />

          {categoriesLoading ? (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Spinner size="sm" /> Loading categories…
            </div>
          ) : (
            <Select
              id="community-category"
              label="Category"
              required
              value={values.categoryId}
              onChange={(e) => setField('categoryId', e.target.value)}
              error={errors.categoryId}
              options={categoryOptions}
              disabled={isSubmitting}
            />
          )}

          <Input
            id="community-topic"
            label="Topic"
            placeholder="e.g. Closures, Flexbox, React Hooks"
            required
            value={values.topic}
            onChange={(e) => setField('topic', e.target.value)}
            error={errors.topic}
            helperText="The specific concept this question tests."
            disabled={isSubmitting}
          />

          <Select
            id="community-difficulty"
            label="Difficulty"
            required
            value={values.difficulty}
            onChange={(e) => setField('difficulty', e.target.value as typeof values.difficulty)}
            error={errors.difficulty}
            options={difficultyOptions}
            disabled={isSubmitting}
          />

          <Select
            id="community-type"
            label="Question Type"
            required
            value={values.type}
            onChange={(e) => setType(e.target.value as typeof values.type)}
            error={errors.type}
            options={typeOptions}
            disabled={isSubmitting}
          />

          <Textarea
            id="community-short-summary"
            label="Short Summary"
            required
            rows={2}
            placeholder="Briefly describe what concept this question tests (1–2 sentences)."
            value={values.shortSummary}
            onChange={(e) => setField('shortSummary', e.target.value)}
            error={errors.shortSummary}
            disabled={isSubmitting}
          />
        </FormSection>

        {/* ── SECTION 2: Answer Configuration ── */}
        {(isMultipleChoice || isTrueFalse) && (
          <FormSection title="Answer Configuration">
            {/* Multiple Choice Options */}
            {isMultipleChoice && (
              <fieldset className="flex flex-col gap-4" disabled={isSubmitting}>
                <legend className="text-xs font-semibold text-slate-300 mb-1">
                  Answer Options <span className="text-rose-400">*</span>
                </legend>
                {errors.options && (
                  <p className="text-xs text-rose-400 font-medium" role="alert">
                    {errors.options}
                  </p>
                )}
                {([0, 1, 2, 3] as const).map((idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex-1">
                      <Input
                        id={`community-option-${idx}`}
                        label={`Option ${idx + 1}`}
                        placeholder={`Answer option ${idx + 1}`}
                        required
                        value={values.options[idx]}
                        onChange={(e) => setOption(idx, e.target.value)}
                        error={optionError(idx)}
                        disabled={isSubmitting}
                      />
                    </div>
                    <div className="pt-6 flex-shrink-0">
                      <Radio
                        id={`community-correct-${idx}`}
                        name="community-correct-answer"
                        label="Correct"
                        checked={
                          values.correctAnswer !== '' &&
                          values.correctAnswer === values.options[idx].trim()
                        }
                        onChange={() => {
                          const trimmed = values.options[idx].trim();
                          if (trimmed) setField('correctAnswer', trimmed);
                        }}
                        disabled={isSubmitting || !values.options[idx].trim()}
                        aria-label={`Mark option ${idx + 1} as correct answer`}
                      />
                    </div>
                  </div>
                ))}
                {errors.correctAnswer && (
                  <p
                    id="community-correct-error"
                    className="text-xs text-rose-400 font-medium"
                    role="alert"
                  >
                    {errors.correctAnswer}
                  </p>
                )}
              </fieldset>
            )}

            {/* True/False Options */}
            {isTrueFalse && (
              <fieldset className="flex flex-col gap-3" disabled={isSubmitting}>
                <legend className="text-xs font-semibold text-slate-300">
                  Correct Answer <span className="text-rose-400">*</span>
                </legend>
                {errors.correctAnswer && (
                  <p className="text-xs text-rose-400 font-medium" role="alert">
                    {errors.correctAnswer}
                  </p>
                )}
                <div className="flex flex-col gap-2 pl-1">
                  <Radio
                    id="community-tf-true"
                    name="community-tf-answer"
                    label="True"
                    checked={values.correctAnswer === 'True'}
                    onChange={() => setField('correctAnswer', 'True')}
                    disabled={isSubmitting}
                  />
                  <Radio
                    id="community-tf-false"
                    name="community-tf-answer"
                    label="False"
                    checked={values.correctAnswer === 'False'}
                    onChange={() => setField('correctAnswer', 'False')}
                    disabled={isSubmitting}
                  />
                </div>
              </fieldset>
            )}
          </FormSection>
        )}

        {/* ── SECTION 3: Explanation & Interview Context ── */}
        <FormSection title="Explanation & Interview Context">
          <Textarea
            id="community-explanation"
            label="Explanation"
            required
            rows={5}
            placeholder="Explain why the correct answer is right. Include key concepts, examples, or nuances."
            value={values.explanation}
            onChange={(e) => setField('explanation', e.target.value)}
            error={errors.explanation}
            disabled={isSubmitting}
          />

          <Textarea
            id="community-code-snippet"
            label="Code Snippet (optional)"
            rows={4}
            placeholder="// Paste an illustrative code example here (optional)"
            value={values.codeSnippet}
            onChange={(e) => setField('codeSnippet', e.target.value)}
            disabled={isSubmitting}
            helperText="A brief code example that supports the question or explanation."
          />

          <Textarea
            id="community-interview-tip"
            label="Interview Tip (optional)"
            rows={3}
            placeholder="e.g. In interviews, emphasize practical use-cases over theoretical definitions."
            value={values.interviewTip}
            onChange={(e) => setField('interviewTip', e.target.value)}
            disabled={isSubmitting}
            helperText="Optional tip for candidates answering this question in a real interview."
          />
        </FormSection>

        {/* ── Submit ── */}
        <div className="flex flex-col gap-3 pb-12">
          <Button
            id="community-submit-btn"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={isSubmitting}
            onClick={() => void handleSubmit()}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? 'Submitting for review…' : 'Submit for Review'}
          </Button>
          <p className="text-xs text-slate-500">
            Your question will be reviewed by moderators before it is added to the public question
            bank.
          </p>
        </div>
      </div>
    </AppShell>
  );
};

export default SubmitQuestionPage;
