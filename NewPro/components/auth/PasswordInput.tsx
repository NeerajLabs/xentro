"use client";

import React, { useState, forwardRef } from "react";
import { Eye, EyeOff, Check, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { evaluatePasswordStrength, PasswordStrength } from "@/lib/auth/validation";

export interface PasswordInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  touched?: boolean;
  showStrengthMeter?: boolean;
  onPasswordChange?: (value: string) => void;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  (
    {
      id,
      label,
      error,
      touched,
      showStrengthMeter = false,
      value,
      onChange,
      onPasswordChange,
      className,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputId = id || props.name || "password";
    const errorId = `${inputId}-error`;
    const hasError = Boolean(touched && error);

    const stringValue = typeof value === "string" ? value : "";
    const strength: PasswordStrength = evaluatePasswordStrength(stringValue);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (onChange) onChange(e);
      if (onPasswordChange) onPasswordChange(e.target.value);
    };

    const getStrengthColor = (score: number) => {
      switch (score) {
        case 1:
          return "bg-[#EF4444]";
        case 2:
          return "bg-[#F59E0B]";
        case 3:
          return "bg-[#84CC16]";
        case 4:
          return "bg-[#D9FF3F]";
        default:
          return "bg-[#E3E5E3] dark:bg-[#262928]";
      }
    };

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
          
          {showStrengthMeter && stringValue.length > 0 && (
            <span className="text-xs font-inter font-medium text-[#565B59] dark:text-[#B6B8B7]">
              Strength: <span className="font-semibold text-[#101212] dark:text-[#D9FF3F]">{strength.label}</span>
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            type={showPassword ? "text" : "password"}
            value={value}
            onChange={handleInputChange}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={cn(
              "w-full px-3.5 py-3 pr-11 rounded-xl text-sm font-inter transition-all duration-150",
              "bg-white dark:bg-[#181B1A]",
              "text-[#101212] dark:text-white placeholder-[#565B59] dark:placeholder-[#B6B8B7]",
              "border",
              hasError
                ? "border-[#EF4444] focus:border-[#EF4444] focus:ring-2 focus:ring-[#EF4444]/20"
                : "border-[#CDD1CE] dark:border-[#262928] focus:border-[#101212] dark:focus:border-[#D9FF3F] focus:ring-2 focus:ring-[#D9FF3F]/30",
              className
            )}
            {...props}
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3 p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D9FF3F]"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Minimal Password Strength Feedback */}
        {showStrengthMeter && stringValue.length > 0 && (
          <div className="pt-1 space-y-1.5 animate-in fade-in duration-200">
            <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    strength.score >= step
                      ? getStrengthColor(strength.score)
                      : "bg-[#E3E5E3] dark:bg-[#262928]"
                  )}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7]">
              <div
                className={cn(
                  "w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px]",
                  strength.hasMinLength
                    ? "bg-[#D9FF3F] text-[#101212]"
                    : "bg-[#E3E5E3] dark:bg-[#262928] text-transparent"
                )}
              >
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className={strength.hasMinLength ? "text-[#101212] dark:text-white font-medium" : ""}>
                At least 8 characters
              </span>
            </div>
          </div>
        )}

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

PasswordInput.displayName = "PasswordInput";
