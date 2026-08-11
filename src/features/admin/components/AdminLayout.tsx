import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AppShell } from '../../../components/layout/AppShell';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../lib/utils';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/admin' },
    { label: 'Community Moderation', path: '/admin/community' },
    { label: 'Ingested Questions', path: '/admin/questions/imports' },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Admin Header Banner */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-xl">
              🛡️
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white tracking-tight">Admin Console</h1>
                <Badge variant="warning" size="sm">
                  Admin Security Foundation
                </Badge>
              </div>
              <p className="text-xs text-slate-400">
                InterviewHub Platform Administration &amp; Moderation Boundary
              </p>
            </div>
          </div>
        </div>

        {/* Admin Sub-navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-subtle'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Admin Main Content Area */}
        <div className="pt-2">{children}</div>
      </div>
    </AppShell>
  );
};
