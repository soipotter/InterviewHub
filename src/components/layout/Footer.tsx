import React from 'react';
import { cn } from '../../lib/utils';
import { Container } from './Container';

export type FooterProps = React.HTMLAttributes<HTMLElement>;

export const Footer: React.FC<FooterProps> = ({ className, ...props }) => {
  return (
    <footer
      className={cn(
        'w-full border-t border-slate-800 bg-slate-950 py-8 text-xs text-slate-400',
        className
      )}
      {...props}
    >
      <Container size="xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <p className="font-bold text-slate-200 text-sm mb-1">InterviewHub</p>
            <p className="text-slate-400">
              Technical interview preparation platform for IT students & junior developers.
            </p>
          </div>
          <p>
            © {new Date().getFullYear()} InterviewHub. Built with React, TypeScript & Tailwind CSS.
          </p>
        </div>
      </Container>
    </footer>
  );
};
