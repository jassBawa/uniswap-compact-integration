"use client";

import { Loader2 } from "lucide-react";

interface SpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-8 h-8",
};

export function Spinner({ size = "md", className = "" }: SpinnerProps) {
    return (
        <Loader2 className={`animate-spin ${sizes[size]} ${className}`} />
    );
}
