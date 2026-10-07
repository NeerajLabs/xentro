"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface StepItem {
  number: string;
  label: string;
  step: OnboardingStep;
}

const STEPS: StepItem[] = [
  { number: "01", label: "Account", step: 1 },
  { number: "02", label: "Email OTP", step: 2 },
  { number: "03", label: "Profile", step: 3 },
  { number: "04", label: "Choose Path", step: 4 },
  { number: "05", label: "Launch", step: 5 },
];

interface ProgressIndicatorProps {
  currentStep: OnboardingStep;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  className,
}) => {
  return (
    <nav
      aria-label="Onboarding Progress"
      className={cn("w-full max-w-2xl mx-auto py-3 select-none", className)}
    >
      {/* Desktop/Tablet Horizontal Steps */}
      <ol className="flex items-center justify-between gap-2 sm:gap-4">
        {STEPS.map((item, index) => {
          const isCompleted = item.step < currentStep;
          const isCurrent = item.step === currentStep;

          return (
            <React.Fragment key={item.step}>
              <li className="flex items-center gap-2">
                {/* Step Circle / Badge */}
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs font-inter font-bold transition-all duration-200",
                    isCompleted
                      ? "bg-[#D9FF3F] text-[#101212]"
                      : isCurrent
                      ? "bg-[#D9FF3F] text-[#101212] ring-4 ring-[#D9FF3F]/20 shadow-sm"
                      : "bg-[#E3E5E3] dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] border border-[#E3E5E3] dark:border-[#262928]"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
                  ) : (
                    <span>{item.number}</span>
                  )}
                </div>

                {/* Step Label (Hidden on small mobile screens to prevent clutter) */}
                <div className="hidden sm:flex flex-col text-left">
                  <span
                    className={cn(
                      "text-[10px] font-inter uppercase tracking-wider font-semibold",
                      isCurrent
                        ? "text-[#101212] dark:text-[#D9FF3F]"
                        : isCompleted
                        ? "text-[#565B59] dark:text-[#B6B8B7]"
                        : "text-[#565B59]/60 dark:text-[#B6B8B7]/50"
                    )}
                  >
                    Step {item.number}
                  </span>
                  <span
                    className={cn(
                      "text-xs font-manrope font-bold",
                      isCurrent
                        ? "text-[#101212] dark:text-white"
                        : isCompleted
                        ? "text-[#565B59] dark:text-[#B6B8B7]"
                        : "text-[#565B59]/60 dark:text-[#B6B8B7]/50"
                    )}
                  >
                    {item.label}
                  </span>
                </div>
              </li>

              {/* Connecting line between steps */}
              {index < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "flex-1 h-[2px] rounded-full transition-all duration-200",
                    isCompleted
                      ? "bg-[#D9FF3F]"
                      : "bg-[#E3E5E3] dark:bg-[#262928]"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
