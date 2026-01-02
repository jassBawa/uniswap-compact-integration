'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-3 py-2.5 bg-zinc-900 border rounded-lg text-zinc-100 
            placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950
            transition-all duration-200
            ${error 
              ? 'border-red-600 focus:ring-red-500' 
              : 'border-zinc-700 focus:ring-emerald-500'
            }
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-zinc-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
