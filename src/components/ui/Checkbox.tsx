import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, error, className, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5 text-left">
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          disabled={disabled}
          className={cn(
            'h-4 w-4 rounded border-slate-700 bg-slate-900 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed mt-0.5',
            error && 'border-rose-500',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col text-xs leading-tight">
            {label && (
              <label
                htmlFor={checkboxId}
                className={cn(
                  'font-medium text-slate-200 cursor-pointer select-none',
                  disabled && 'text-slate-500 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && <p className="text-slate-400 mt-0.5">{description}</p>}
            {error && <p className="text-rose-400 font-medium mt-0.5">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
