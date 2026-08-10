import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, id, disabled, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5 text-left">
        <input
          ref={ref}
          type="radio"
          id={radioId}
          disabled={disabled}
          className={cn(
            'h-4 w-4 border-slate-700 bg-slate-900 text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed mt-0.5',
            className
          )}
          {...props}
        />
        {(label || description) && (
          <div className="flex flex-col text-xs leading-tight">
            {label && (
              <label
                htmlFor={radioId}
                className={cn(
                  'font-medium text-slate-200 cursor-pointer select-none',
                  disabled && 'text-slate-500 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && <p className="text-slate-400 mt-0.5">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
