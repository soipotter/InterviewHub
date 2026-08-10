import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { Container } from './Container';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { Button } from '../ui/Button';

export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  logo?: React.ReactNode;
  navLinks?: React.ReactNode;
  userActions?: React.ReactNode;
  mobileNavLinks?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  logo,
  navLinks,
  userActions,
  mobileNavLinks,
  className,
  ...props
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const linkClass = (path: string) =>
    cn(
      'transition-colors font-medium',
      isActive(path)
        ? 'text-white font-bold border-b-2 border-indigo-500 pb-0.5'
        : 'text-slate-300 hover:text-white'
    );

  const defaultNavLinks = (
    <>
      <Link to="/questions" className={linkClass('/questions')}>
        Questions
      </Link>
      <Link to="/practice" className={linkClass('/practice')}>
        Practice
      </Link>
      <Link
        to="/daily-challenge"
        className={cn(
          'transition-colors font-semibold',
          isActive('/daily-challenge')
            ? 'text-amber-300 font-bold border-b-2 border-amber-400 pb-0.5'
            : 'text-amber-400 hover:text-amber-300'
        )}
      >
        ⚡ Daily
      </Link>
      {isAuthenticated && (
        <>
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            Dashboard
          </Link>

          <Link to="/progress" className={linkClass('/progress')}>
            Progress
          </Link>
          <Link to="/bookmarks" className={linkClass('/bookmarks')}>
            Bookmarks
          </Link>
          <Link to="/community/submit" className={linkClass('/community')}>
            Submit Q
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className={cn(
                'transition-colors font-semibold',
                isActive('/admin')
                  ? 'text-indigo-300 font-bold border-b-2 border-indigo-400 pb-0.5'
                  : 'text-indigo-400 hover:text-indigo-300'
              )}
            >
              🛡️ Admin
            </Link>
          )}
        </>
      )}
    </>
  );

  // User Actions State Resolution
  let resolvedUserActions: React.ReactNode;

  if (userActions) {
    // If a custom override is provided explicitly, use it
    resolvedUserActions = userActions;
  } else if (isLoading) {
    // Neutral loading skeleton while auth session is initializing (NO Log In / Log Out flash)
    resolvedUserActions = (
      <div className="flex items-center gap-2">
        <div className="h-8 w-20 bg-slate-800/60 rounded animate-pulse" />
      </div>
    );
  } else if (isAuthenticated) {
    // Authenticated state
    resolvedUserActions = (
      <div className="flex items-center gap-3">
        <span className="text-xs font-mono text-slate-300 hidden lg:inline-block">
          {user?.email}
        </span>
        <Button variant="outline" size="sm" onClick={handleLogout} id="header-logout-btn">
          Log Out
        </Button>
      </div>
    );
  } else {
    // Unauthenticated state
    resolvedUserActions = (
      <div className="flex items-center gap-2">
        <Link to="/login" id="header-login-link">
          <Button variant="outline" size="sm">
            Log In
          </Button>
        </Link>
        <Link to="/register" className="hidden sm:inline-block" id="header-register-link">
          <Button variant="primary" size="sm">
            Register
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md',
        className
      )}
      {...props}
    >
      <Container size="xl">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {logo || (
              <Link
                to="/"
                className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight hover:opacity-90 transition-opacity"
              >
                <span className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs text-white font-mono shadow-subtle">
                  IH
                </span>
                <span>InterviewHub</span>
              </Link>
            )}
            <nav className="hidden md:flex items-center gap-6 text-sm text-slate-300 font-medium">
              {navLinks || defaultNavLinks}
            </nav>
          </div>

          {/* Desktop User Actions */}
          <div className="hidden md:flex items-center gap-3">{resolvedUserActions}</div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {resolvedUserActions}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
              className="p-2 text-slate-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md"
            >
              {mobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900/95 py-4 px-2 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <nav className="flex flex-col gap-2 font-medium text-sm text-slate-200 text-left px-2">
              {mobileNavLinks || defaultNavLinks}
            </nav>
          </div>
        )}
      </Container>
    </header>
  );
};
