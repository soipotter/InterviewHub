import React from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { useAdmin } from '../features/admin/hooks/useAdmin';

export const AdminCommunityPage: React.FC = () => {
  const { submissions, isLoading, error } = useAdmin();

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-5xl text-left">
        {/* Page Title & Read-Only Badge */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-white tracking-tight">
              Community Submissions Queue
            </h2>
            <p className="text-xs text-slate-400">
              Pending questions submitted by community members for admin review.
            </p>
          </div>
          <Badge variant="warning" size="md">
            Read-Only Moderation View (Phase 8B)
          </Badge>
        </div>

        {/* Read-Only Notice */}
        <Alert variant="info" title="Phase 8B Read-Only Moderation Queue">
          <p className="text-xs text-slate-300">
            Click on any pending submission below to inspect full question content, options,
            explanation, and code snippets. Moderation actions (Approve &amp; Publish into Question
            Bank, Reject) will be enabled in Phase 8C.
          </p>
        </Alert>

        {/* Submissions List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <Spinner size="md" />
            <span className="text-xs font-mono">Fetching pending submissions...</span>
          </div>
        ) : error ? (
          <Alert variant="error" title="Error Loading Submissions">
            <p className="text-xs text-slate-300">{error}</p>
          </Alert>
        ) : submissions.length === 0 ? (
          <Card className="border-slate-800 bg-slate-950/80 py-12 text-center">
            <CardContent className="flex flex-col items-center gap-3">
              <span className="text-3xl">🎉</span>
              <p className="text-sm font-semibold text-slate-200">
                No questions are waiting for review.
              </p>
              <p className="text-xs text-slate-400 max-w-sm">
                The community moderation queue is empty. New submissions will appear here
                automatically.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="text-xs font-mono text-slate-400">
              Showing {submissions.length} pending submission{submissions.length === 1 ? '' : 's'}
            </div>
            {submissions.map((sub) => (
              <Card
                key={sub.id}
                className="border-slate-800 bg-slate-950/90 hover:border-slate-700 transition-colors"
              >
                <CardHeader className="pb-3 border-b border-slate-800/60 flex flex-row items-start justify-between gap-4">
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="default" size="sm">
                        {sub.categoryName}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {sub.difficulty}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {sub.type}
                      </Badge>
                      <Badge variant="warning" size="sm" className="ml-auto">
                        Status: Pending
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-bold text-white mt-1">
                      {sub.title}
                    </CardTitle>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-4 pt-4 text-xs text-slate-300">
                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Topic
                    </span>
                    <p className="font-mono text-slate-200">{sub.topic}</p>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Short Summary
                    </span>
                    <p className="text-slate-300">{sub.shortSummary}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-slate-500 font-mono text-[11px]">
                      <span>Submitted: {new Date(sub.createdAt).toLocaleString()}</span>
                      <span className="ml-3">ID: {sub.id.slice(0, 8)}…</span>
                    </div>
                    <Link to={`/admin/community/${sub.id}`}>
                      <Button variant="primary" size="sm" id={`inspect-sub-${sub.id.slice(0, 8)}`}>
                        Inspect Detail &rarr;
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminCommunityPage;
