"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
  className?: string;
}

const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ className, type, label, error, helperText, rightElement, id, ...props }, ref) => {
    const inputId = id || React.useId();

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-muted-foreground ml-0.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border bg-input px-3 py-2 text-sm shadow-sm transition-all duration-200",
              "placeholder:text-muted-foreground/60",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:border-ring",
              "disabled:cursor-not-allowed disabled:opacity-50",
              error
                ? "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20"
                : "border-input hover:border-border/80",
              rightElement && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {rightElement && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {(helperText || error) && (
          <p className={cn(
            "text-[11px] ml-0.5",
            error ? "text-destructive" : "text-muted-foreground"
          )}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);
FormInput.displayName = "FormInput";

export { FormInput };
