"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface StepItem {
  number: string;
  stepNumber: number;
  label: string;
  step: OnboardingStep;
}

const STEPS: StepItem[] = [
  { number: "01", stepNumber: 1, label: "Account", step: 1 },
  { number: "02", stepNumber: 2, label: "Email OTP", step: 2 },
  { number: "03", stepNumber: 3, label: "Profile", step: 3 },
  { number: "04", stepNumber: 4, label: "Choose Path", step: 4 },
  { number: "05", stepNumber: 5, label: "Launch", step: 5 },
];

interface ProgressIndicatorProps {
  currentStep: OnboardingStep;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  className,
}) => {
  const safeStep = Math.max(1, Math.min(5, currentStep)) as OnboardingStep;
  const currentStepItem = STEPS.find((s) => s.step === safeStep) || STEPS[0];
  const nextStepItem = STEPS.find((s) => s.step === safeStep + 1);

  // Track connects center of col 1 (10%) to center of col 5 (90%), total width 80%
  const progressPercent = ((safeStep - 1) / 4) * 80;

  return (
    <nav
      aria-label="Onboarding Progress"
      className={cn("w-full max-w-xl mx-auto py-2 select-none", className)}
    >
      <div className="relative w-full">
        {/* Background track line between center of Step 1 and Step 5 */}
        <div
          aria-hidden="true"
          className="absolute top-3.5 sm:top-4 left-[10%] right-[10%] h-[2px] bg-[#E3E5E3] dark:bg-[#262928] z-0"
        />

        {/* Active filled progress track */}
        <div
          aria-hidden="true"
          className="absolute top-3.5 sm:top-4 left-[10%] h-[2px] bg-[#D9FF3F] shadow-[0_0_8px_rgba(217,255,63,0.4)] transition-all duration-300 z-0"
          style={{ width: `${progressPercent}%` }}
        />

        {/* 5 Milestone Step Nodes */}
        <ol className="grid grid-cols-5 relative z-10 list-none m-0 p-0">
          {STEPS.map((item) => {
            const isCompleted = item.step < safeStep;
            const isCurrent = item.step === safeStep;
            const isUpcoming = item.step > safeStep;

            return (
              <li
                key={item.step}
                className="flex flex-col items-center text-center group cursor-default"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Step Circle Badge */}
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-mono font-bold transition-all duration-200 shrink-0",
                    isCompleted &&
                      "bg-[#D9FF3F] text-[#101212] ring-2 ring-[#D9FF3F]/30 shadow-xs",
                    isCurrent &&
                      "bg-[#D9FF3F] text-[#101212] ring-4 ring-[#D9FF3F]/25 shadow-[0_0_12px_rgba(217,255,63,0.35)] scale-105 font-extrabold",
                    isUpcoming &&
                      "bg-[#F2F4F2] dark:bg-[#181B1A] text-[#8E9290] dark:text-[#565B59] border border-[#D5D9D6] dark:border-[#262928]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : (
                    <span>{item.number}</span>
                  )}
                </div>

                {/* Step Label (Desktop & Tablet: single-line, non-wrapping) */}
                <div className="hidden sm:flex flex-col items-center mt-2 w-full px-0.5">
                  <span
                    className={cn(
                      "text-[9px] font-mono uppercase tracking-wider font-semibold leading-tight",
                      isCurrent
                        ? "text-[#101212] dark:text-[#D9FF3F]"
                        : isCompleted
                        ? "text-[#565B59] dark:text-[#8E9290]"
                        : "text-[#8E9290]/60 dark:text-[#565B59]/60"
                    )}
                  >
                    Step {item.number}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] sm:text-[11px] font-manrope font-bold tracking-tight whitespace-nowrap leading-tight mt-0.5 transition-colors",
                      isCurrent
                        ? "text-[#101212] dark:text-white"
                        : isCompleted
                        ? "text-[#565B59] dark:text-[#B6B8B7]"
                        : "text-[#8E9290] dark:text-[#565B59]"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile Active Step Summary Bar (< sm: prevents wrapping, keeps visual clarity) */}
      <div className="flex sm:hidden items-center justify-between mt-2.5 px-2 py-1.5 rounded-lg bg-[#F2F4F2] dark:bg-[#121413] border border-[#E3E5E3] dark:border-[#262928]">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#D9FF3F] text-[#101212]">
            Step {safeStep} of {STEPS.length}
          </span>
          <span className="text-xs font-manrope font-bold text-[#101212] dark:text-white">
            {currentStepItem.label}
          </span>
        </div>
        {nextStepItem && (
          <span className="text-[10px] font-inter text-[#8E9290] dark:text-[#6E7370]">
            Next: {nextStepItem.label}
          </span>
        )}
      </div>
    </nav>
  );
};
