import React from 'react';
import { cn } from '../../lib/utils';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  onDismiss?: () => void;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string; title: string }> = {
  info: {
    container: 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200',
    icon: 'ℹ',
    title: 'text-cyan-400',
  },
  success: {
    container: 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200',
    icon: '✓',
    title: 'text-emerald-400',
  },
  warning: {
    container: 'bg-amber-950/40 border-amber-500/30 text-amber-200',
    icon: '⚠',
    title: 'text-amber-400',
  },
  error: {
    container: 'bg-rose-950/40 border-rose-500/30 text-rose-200',
    icon: '✕',
    title: 'text-rose-400',
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  onDismiss,
  className,
  children,
  ...props
}) => {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border text-xs leading-relaxed text-left',
        styles.container,
        className
      )}
      role="alert"
      {...props}
    >
      <span className={cn('font-bold text-sm select-none', styles.title)}>{styles.icon}</span>
      <div className="flex-1">
        {title && <h4 className={cn('font-bold text-sm mb-0.5', styles.title)}>{title}</h4>}
        <div>{children}</div>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-400 hover:text-white p-0.5 rounded focus-visible:outline-none cursor-pointer"
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      )}
    </div>
  );
};
