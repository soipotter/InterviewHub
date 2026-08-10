import React from 'react';
import { cn } from '../../lib/utils';
import { Button } from './Button';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'Failed to load content. Please check your connection and try again.',
  onRetry,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-rose-500/20 bg-rose-950/10 my-4 text-slate-100',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 mb-3 text-xl border border-rose-500/20">
        ⚠️
      </div>
      <h3 className="text-base font-bold text-rose-300">{title}</h3>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
