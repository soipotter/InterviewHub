import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge, BadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { useCommunitySubmissionDetail } from '../features/admin/hooks/useCommunitySubmissionDetail';
import { useCommunityModeration } from '../features/admin/hooks/useCommunityModeration';

export const AdminCommunityDetailPage: React.FC = () => {
  const { submissionId } = useParams<{ submissionId: string }>();
  const { submission, isLoading, error, refetch } = useCommunitySubmissionDetail(submissionId);
  const {
    approveSubmission,
    rejectSubmission,
    isSubmitting,
    error: moderationError,
    clearError,
  } = useCommunityModeration();

  // Modals & local state
  const [showApproveModal, setShowApproveModal] = useState<boolean>(false);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [reasonFieldError, setReasonFieldError] = useState<string | null>(null);

  const getStatusBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'pending':
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'Approved & Published';
      case 'rejected':
        return 'Rejected';
      case 'pending':
      default:
        return 'Pending Review';
    }
  };

  const handleConfirmApprove = async () => {
    if (!submission) return;
    clearError();
    const res = await approveSubmission(submission.id);
    if (res) {
      setShowApproveModal(false);
      void refetch();
    }
  };

  const handleConfirmReject = async () => {
    if (!submission) return;
    if (!rejectionReason.trim()) {
      setReasonFieldError('Rejection reason is required.');
      return;
    }
    setReasonFieldError(null);
    clearError();
    const res = await rejectSubmission(submission.id, rejectionReason.trim());
    if (res) {
      setShowRejectModal(false);
      void refetch();
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20 text-slate-400 gap-3">
          <Spinner size="md" />
          <span className="text-xs font-mono">Loading submission detail...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="max-w-3xl mx-auto flex flex-col gap-6 text-left">
          <Link to="/admin/community">
            <Button variant="ghost" size="sm">
              &larr; Back to Moderation Queue
            </Button>
          </Link>
          <Alert variant="error" title="Error Loading Submission">
            <p className="text-xs text-slate-300">{error}</p>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  if (!submission) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto py-12 text-center flex flex-col items-center gap-4">
          <Card className="border-slate-800 bg-slate-950/80 w-full p-8">
            <CardContent className="flex flex-col items-center gap-4">
              <span className="text-3xl">🔍</span>
              <h2 className="text-lg font-bold text-white">Submission Not Found</h2>
              <p className="text-xs text-slate-400">
                The requested community submission does not exist or you do not have permission to
                view it.
              </p>
              <Link to="/admin/community">
                <Button variant="primary" size="sm">
                  &larr; Back to Moderation Queue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  const isMultipleChoice = submission.type === 'Multiple Choice';
  const isTrueFalse = submission.type === 'True/False';
  const isPending = submission.status === 'pending';
  const isApproved = submission.status === 'approved';
  const isRejected = submission.status === 'rejected';

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto flex flex-col gap-6 text-left pb-12">
        {/* Navigation & Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link to="/admin/community">
            <Button variant="outline" size="sm" id="back-to-queue-btn">
              &larr; Back to Moderation Queue
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Badge variant={getStatusBadgeVariant(submission.status)} size="md">
              Status: {getStatusLabel(submission.status)}
            </Badge>

            {/* Moderation Actions (Shown only for Pending submissions) */}
            {isPending && (
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowApproveModal(true)}
                  disabled={isSubmitting}
                  id="approve-submission-btn"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/40"
                >
                  ✓ Approve &amp; Publish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRejectionReason('');
                    setReasonFieldError(null);
                    setShowRejectModal(true);
                  }}
                  disabled={isSubmitting}
                  id="reject-submission-btn"
                  className="border-rose-500/40 text-rose-400 hover:bg-rose-950/40"
                >
                  ✕ Reject
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Moderation Error Alert */}
        {moderationError && (
          <Alert variant="error" title="Moderation Action Failed">
            <p className="text-xs text-slate-300">{moderationError}</p>
          </Alert>
        )}

        {/* Approved Success Banner */}
        {isApproved && (
          <Alert variant="success" title="Question Approved &amp; Published">
            <div className="flex flex-col gap-3">
              <p className="text-xs text-emerald-200">
                This community submission was approved and published atomically into the public
                Question Bank.
              </p>
              {submission.publishedQuestionId && (
                <div>
                  <Link to={`/questions/${submission.publishedQuestionId}`}>
                    <Button variant="primary" size="sm" id="view-published-question-btn">
                      View Published Question &rarr;
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Alert>
        )}

        {/* Rejected Banner */}
        {isRejected && (
          <Alert variant="error" title="Question Submission Rejected">
            <p className="text-xs text-rose-200">
              This submission was rejected by moderation and will not be published to the Question
              Bank.
            </p>
          </Alert>
        )}

        {/* ── SECTION 1: Submission Overview Metadata ── */}
        <Card className="border-slate-800 bg-slate-950/90">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Submission Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Category</span>
              <Badge variant="default" size="sm">
                {submission.categoryName}
              </Badge>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Difficulty</span>
              <Badge variant="secondary" size="sm">
                {submission.difficulty}
              </Badge>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Question Type</span>
              <Badge variant="secondary" size="sm">
                {submission.type}
              </Badge>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Submitted Date</span>
              <span className="font-mono text-slate-200">
                {new Date(submission.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-1">Topic</span>
              <span className="font-mono text-slate-200">{submission.topic}</span>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400 block mb-1">Submission ID</span>
              <span className="font-mono text-slate-400 text-[11px] select-all">
                {submission.id}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* ── SECTION 2: Question Title & Content ── */}
        <Card className="border-slate-800 bg-slate-950/90">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Question Content
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4 text-xs text-slate-200">
            <div>
              <span className="text-slate-400 font-semibold block mb-1 uppercase tracking-wider text-[11px]">
                Question / Title
              </span>
              <h1 className="text-lg font-bold text-white tracking-tight">{submission.title}</h1>
            </div>

            <div>
              <span className="text-slate-400 font-semibold block mb-1 uppercase tracking-wider text-[11px]">
                Short Summary
              </span>
              <p className="text-slate-300 bg-slate-900/60 p-3 rounded border border-slate-800">
                {submission.shortSummary}
              </p>
            </div>

            {submission.codeSnippet && (
              <div>
                <span className="text-slate-400 font-semibold block mb-1 uppercase tracking-wider text-[11px]">
                  Code Snippet
                </span>
                <pre className="bg-slate-900 p-4 rounded text-xs font-mono text-slate-200 overflow-x-auto border border-slate-800 leading-relaxed select-all">
                  <code>{submission.codeSnippet}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 3: Answer Configuration ── */}
        <Card className="border-slate-800 bg-slate-950/90">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Answer Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4 text-xs">
            {isMultipleChoice && submission.options && submission.options.length > 0 && (
              <div>
                <span className="text-slate-400 font-semibold block mb-2 uppercase tracking-wider text-[11px]">
                  Multiple Choice Options
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {submission.options.map((opt, idx) => {
                    const isCorrect = opt === submission.correctAnswer;
                    return (
                      <div
                        key={idx}
                        className={`p-3 rounded border text-xs flex items-center justify-between transition-colors ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 font-medium'
                            : 'bg-slate-900/40 border-slate-800 text-slate-300'
                        }`}
                      >
                        <span className="font-mono">
                          <span className="text-slate-500 mr-2">{idx + 1}.</span>
                          {opt}
                        </span>
                        {isCorrect && (
                          <Badge variant="success" size="sm">
                            ✓ Correct Answer
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {isTrueFalse && (
              <div>
                <span className="text-slate-400 font-semibold block mb-2 uppercase tracking-wider text-[11px]">
                  True / False Selection
                </span>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  {['True', 'False'].map((tfValue) => {
                    const isCorrect = submission.correctAnswer === tfValue;
                    return (
                      <div
                        key={tfValue}
                        className={`p-3 rounded border text-center text-xs font-bold transition-colors ${
                          isCorrect
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                            : 'bg-slate-900/40 border-slate-800 text-slate-500 opacity-60'
                        }`}
                      >
                        <div>{tfValue}</div>
                        {isCorrect && (
                          <span className="text-[10px] block mt-1 font-semibold text-emerald-400">
                            ✓ Correct
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 4: Explanation & Interview Context ── */}
        <Card className="border-slate-800 bg-slate-950/90">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              Explanation &amp; Interview Context
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 flex flex-col gap-4 text-xs text-slate-200">
            <div>
              <span className="text-slate-400 font-semibold block mb-1 uppercase tracking-wider text-[11px]">
                Explanation
              </span>
              <div className="bg-slate-900/60 p-4 rounded border border-slate-800 text-slate-200 leading-relaxed whitespace-pre-wrap">
                {submission.explanation}
              </div>
            </div>

            {submission.interviewTip && (
              <div>
                <span className="text-amber-400 font-semibold block mb-1 uppercase tracking-wider text-[11px]">
                  💡 Interview Tip
                </span>
                <div className="bg-amber-950/20 border border-amber-500/20 p-3.5 rounded text-amber-200 leading-relaxed">
                  {submission.interviewTip}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── SECTION 5: Rejection / Moderation Details (if applicable) ── */}
        {isRejected && submission.rejectionReason && (
          <Card className="border-rose-900/60 bg-rose-950/20">
            <CardHeader className="pb-2 border-b border-rose-900/40">
              <CardTitle className="text-xs font-semibold text-rose-400 uppercase tracking-wider">
                Rejection Reason
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3 text-xs text-rose-200">
              <p className="bg-slate-900/60 p-3 rounded border border-rose-950 font-mono text-rose-300">
                {submission.rejectionReason}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── APPROVAL CONFIRMATION MODAL ── */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => !isSubmitting && setShowApproveModal(false)}
        title="Approve & Publish Question?"
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-xs text-slate-300 leading-relaxed">
            This will atomically approve submission{' '}
            <span className="font-mono font-semibold text-white">
              &quot;{submission.title}&quot;
            </span>{' '}
            and publish it into the public Question Bank under category{' '}
            <span className="font-semibold text-indigo-400">{submission.categoryName}</span>.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApproveModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmApprove}
              isLoading={isSubmitting}
              id="confirm-approve-btn"
              className="bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              Approve &amp; Publish
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── REJECTION MODAL ── */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => !isSubmitting && setShowRejectModal(false)}
        title="Reject Community Submission"
      >
        <div className="flex flex-col gap-4 text-left">
          <p className="text-xs text-slate-300 leading-relaxed">
            Please provide a mandatory reason for rejecting{' '}
            <span className="font-mono font-semibold text-white">
              &quot;{submission.title}&quot;
            </span>
            .
          </p>
          <Textarea
            label="Rejection Reason"
            placeholder="Explain why this submission is being rejected (e.g. duplicate question, incorrect answer, insufficient detail)..."
            value={rejectionReason}
            onChange={(e) => {
              setRejectionReason(e.target.value);
              if (e.target.value.trim()) setReasonFieldError(null);
            }}
            error={reasonFieldError || undefined}
            rows={4}
            disabled={isSubmitting}
            id="rejection-reason-textarea"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRejectModal(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConfirmReject}
              isLoading={isSubmitting}
              id="confirm-reject-btn"
              className="bg-rose-600 hover:bg-rose-500 text-white"
            >
              Reject Submission
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default AdminCommunityDetailPage;
