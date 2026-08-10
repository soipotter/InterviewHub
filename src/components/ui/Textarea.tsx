import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      showCount = false,
      maxLength,
      value,
      className,
      id,
      required,
      disabled,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const helperId = `${textareaId}-helper`;

    const currentLength = typeof value === 'string' ? value.length : 0;

    return (
      <div className="w-full flex flex-col gap-1.5 text-left">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-slate-300">
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full bg-slate-900 border text-sm text-slate-100 placeholder-slate-500 rounded-md p-3 transition-colors resize-y',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent',
            'disabled:bg-slate-800/40 disabled:text-slate-500 disabled:cursor-not-allowed',
            error
              ? 'border-rose-500 focus-visible:ring-rose-500'
              : 'border-slate-700 hover:border-slate-600',
            className
          )}
          {...props}
        />
        <div className="flex justify-between items-center text-xs">
          <div>
            {error ? (
              <p id={errorId} className="text-rose-400 font-medium">
                {error}
              </p>
            ) : helperText ? (
              <p id={helperId} className="text-slate-400">
                {helperText}
              </p>
            ) : null}
          </div>
          {showCount && maxLength && (
            <span className="text-slate-500 ml-auto font-mono">
              {currentLength}/{maxLength}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
