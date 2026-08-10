import React from 'react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-slate-800 bg-slate-900/40 my-4',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center h-12 w-12 rounded-full bg-slate-800/80 text-slate-400 mb-3 text-xl">
        {icon || '📭'}
      </div>
      <h3 className="text-base font-bold text-slate-200">{title}</h3>
      {description && (
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
