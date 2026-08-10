import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { Spinner } from '../../../components/ui/Spinner';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { AppShell } from '../../../components/layout/AppShell';

export interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * Product-safe Unauthorized view rendered when a non-admin authenticated user accesses an admin route.
 */
export const UnauthorizedView: React.FC = () => (
  <AppShell>
    <div className="flex items-center justify-center min-h-[60vh] py-12">
      <Card className="max-w-md w-full border-slate-800 bg-slate-950/90 text-center">
        <CardContent className="flex flex-col items-center gap-6 p-8">
          <div className="w-16 h-16 rounded-full bg-rose-950/60 border border-rose-500/30 flex items-center justify-center text-2xl font-bold text-rose-400">
            🛡️
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-xl font-bold text-white">403 — Access Restricted</h1>
            <p className="text-sm text-slate-400">
              You don&apos;t have permission to access this page. Admin privileges are required.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center w-full">
            <Link to="/dashboard" className="flex-1">
              <Button variant="primary" size="md" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button variant="outline" size="md" className="w-full">
                Back Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  </AppShell>
);

/**
 * AdminGuard protects Admin UI routes.
 *
 * NOTE: AdminGuard is a FRONTEND UX CONTROL ONLY.
 * Server-side security & authorization are strictly enforced by Supabase RLS policies
 * and SECURITY DEFINER RPCs on public.users and public.community_questions.
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs font-mono text-slate-400">Verifying authorization...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const intendedPath = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${intendedPath}`} replace />;
  }

  if (user?.role !== 'admin') {
    return <UnauthorizedView />;
  }

  return <>{children}</>;
};

export default AdminGuard;
