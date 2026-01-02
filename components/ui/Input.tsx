"use client";

import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border bg-input px-3 py-2 text-sm shadow-sm transition-all duration-300",
            "placeholder:text-muted-foreground/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b35]/30 focus-visible:border-[#ff6b35] focus-visible:shadow-[0_0_15px_rgba(255,107,53,0.2)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-destructive/60 focus-visible:border-destructive focus-visible:ring-destructive/20"
              : "border-input hover:border-border/80",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
