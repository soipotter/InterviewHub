import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../../../components/ui/Spinner';

export interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <span className="text-xs font-mono text-slate-400">Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const intendedPath = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?redirect=${intendedPath}`} replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
