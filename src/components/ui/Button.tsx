import React from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-500 text-white shadow-subtle active:bg-indigo-700 disabled:bg-indigo-600/50 disabled:text-indigo-200',
  secondary:
    'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 active:bg-slate-800 disabled:bg-slate-800/50 disabled:text-slate-500',
  outline:
    'bg-transparent hover:bg-slate-800 text-indigo-400 border border-indigo-500/30 hover:border-indigo-500/60 active:bg-slate-800/80 disabled:border-slate-800 disabled:text-slate-600',
  ghost:
    'bg-transparent hover:bg-slate-800/60 text-slate-300 hover:text-white active:bg-slate-800 disabled:text-slate-600',
  danger:
    'bg-rose-600 hover:bg-rose-500 text-white shadow-subtle active:bg-rose-700 disabled:bg-rose-600/50 disabled:text-rose-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-md font-medium',
  lg: 'h-12 px-6 text-base gap-2.5 rounded-lg font-medium',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 cursor-pointer disabled:cursor-not-allowed select-none',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Spinner size={size === 'lg' ? 'md' : 'sm'} className="text-current" />
        ) : (
          leftIcon
        )}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
