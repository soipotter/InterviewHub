import React from 'react';
import { cn } from '../../lib/utils';
import { Header } from './Header';
import { Footer } from './Footer';
import { Container } from './Container';

export interface AppShellProps {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ header, footer, children, className }) => {
  return (
    <div className={cn('min-h-screen flex flex-col bg-slate-900 text-slate-100 overflow-x-hidden', className)}>
      {header || <Header />}
      <main className="flex-1 py-8 overflow-x-hidden">
        <Container size="xl">{children}</Container>
      </main>
      {footer || <Footer />}
    </div>
  );
};
