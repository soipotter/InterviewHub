import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  const defaultNavLinks = (
    <>
      <Link to="/questions" className="hover:text-white transition-colors">
        Questions
      </Link>
      <Link to="/practice" className="hover:text-white transition-colors">
        Practice
      </Link>
      <Link
        to="/daily-challenge"
        className="hover:text-white transition-colors font-semibold text-amber-400 hover:text-amber-300"
      >
        ⚡ Daily
      </Link>
      {isAuthenticated && (
        <>
          <Link to="/dashboard" className="hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link to="/progress" className="hover:text-white transition-colors">
            Progress
          </Link>
          {user?.role === 'admin' && (
            <Link
              to="/admin"
              className="hover:text-white transition-colors font-semibold text-indigo-400 hover:text-indigo-300"
            >
              🛡️ Admin
            </Link>
          )}
        </>
      )}
    </>
  );

  const defaultUserActions = isAuthenticated ? (
    <div className="flex items-center gap-3">
      <span className="text-xs font-mono text-slate-300 hidden lg:inline-block">{user?.email}</span>
      <Button variant="outline" size="sm" onClick={handleLogout}>
        Log Out
      </Button>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <Link to="/login">
        <Button variant="outline" size="sm">
          Log In
        </Button>
      </Link>
      <Link to="/register" className="hidden sm:inline-block">
        <Button variant="primary" size="sm">
          Register
        </Button>
      </Link>
    </div>
  );

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
          <div className="hidden md:flex items-center gap-3">
            {userActions || defaultUserActions}
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="flex md:hidden items-center gap-2">
            {userActions || defaultUserActions}
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
