import React from 'react';
import { Link } from 'react-router-dom';
import { AdminLayout } from '../features/admin/components/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { useAdmin } from '../features/admin/hooks/useAdmin';

export const AdminDashboardPage: React.FC = () => {
  const { stats, isLoading, error } = useAdmin();

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 max-w-4xl">
        {/* Scope Note Banner */}
        <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-lg p-4 flex flex-col gap-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-indigo-400">
              Phase 8A Security Foundation Active
            </span>
            <Badge variant="default" size="sm">
              Read-Only Foundation
            </Badge>
          </div>
          <p className="text-xs text-slate-300">
            This administration portal is secured by Supabase RLS policies. Moderation actions
            (Approve / Reject) are currently disabled and will arrive in Phase 8B / 8C.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Community Moderation Queue */}
          <Card className="border-slate-800 bg-slate-950/80 hover:border-slate-700 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-300">
                Community Moderation Queue
              </CardTitle>
              <span className="text-lg">💬</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-left">
              {isLoading ? (
                <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                  <Spinner size="sm" /> Loading pending count…
                </div>
              ) : error ? (
                <p className="text-xs text-rose-400">{error}</p>
              ) : (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-white">
                    {stats?.pendingSubmissionsCount ?? 0}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Questions Pending Review
                  </span>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Review interview questions submitted by community members before they enter the
                public question bank.
              </p>
              <Link to="/admin/community">
                <Button variant="primary" size="sm" className="w-full sm:w-auto">
                  View Moderation Queue &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 2: Question Taxonomy & System Scope */}
          <Card className="border-slate-800 bg-slate-950/80">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-slate-300">
                Frontend Question Bank Scope
              </CardTitle>
              <span className="text-lg">📚</span>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-left">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-indigo-400">
                  {isLoading ? '…' : (stats?.totalCategoriesCount ?? 7)}
                </span>
                <span className="text-xs text-slate-400 font-medium">Active MVP Categories</span>
              </div>
              <p className="text-xs text-slate-400">
                HTML, CSS, JavaScript, React, TypeScript, Web Fundamentals, and Git.
              </p>
              <Link to="/questions">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Browse Public Question Bank &rarr;
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
