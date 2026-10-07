"use client";

import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuthInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  touched?: boolean;
  hint?: string;
  rightElement?: React.ReactNode;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ id, label, error, touched, hint, rightElement, className, ...props }, ref) => {
    const inputId = id || props.name || "input";
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const hasError = Boolean(touched && error);

    return (
      <div className="w-full flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <label
            htmlFor={inputId}
            className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-[#FFFFFF]"
          >
            {label}
            {props.required && <span className="text-[#EF4444] ml-1" aria-hidden="true">*</span>}
          </label>
          {hint && !hasError && (
            <span id={hintId} className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              {hint}
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : hint ? hintId : undefined}
            className={cn(
              "w-full px-3.5 py-3 rounded-xl text-sm font-inter transition-all duration-150",
              "bg-white dark:bg-[#181B1A]",
              "text-[#101212] dark:text-white placeholder-[#565B59] dark:placeholder-[#B6B8B7] dark:[color-scheme:dark]",
              "border",
              hasError
                ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20"
                : "border-[#CDD1CE] dark:border-[#262928] focus:border-[#101212] dark:focus:border-[#D9FF3F] focus:ring-2 focus:ring-[#D9FF3F]/30",
              rightElement ? "pr-11" : "",
              className
            )}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="flex items-center gap-1.5 text-xs text-[#DC2626] dark:text-[#F87171] mt-1 font-inter animate-in fade-in slide-in-from-top-1"
          >
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
