"use client";

import React from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthErrorType } from "@/lib/auth/types";

interface AuthErrorProps {
  message: string;
  type?: AuthErrorType;
  onDismiss?: () => void;
  className?: string;
}

export const AuthError: React.FC<AuthErrorProps> = ({
  message,
  type,
  onDismiss,
  className,
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className={cn(
        "relative flex items-start gap-3 p-3.5 rounded-xl text-xs font-inter leading-relaxed transition-all",
        "bg-[#FEF2F2] dark:bg-[#2A1515] border border-[#FCA5A5] dark:border-[#7F1D1D] text-[#991B1B] dark:text-[#FCA5A5]",
        "animate-in fade-in slide-in-from-top-2 duration-200",
        className
      )}
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#DC2626] dark:text-[#EF4444]" />
      
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {type === "EMAIL_EXISTS" && (
          <Link
            href="/signin"
            className="inline-block mt-1.5 font-semibold text-[#101212] dark:text-white underline underline-offset-2 hover:text-black dark:hover:text-[#D9FF3F]"
          >
            Go to Sign In &rarr;
          </Link>
        )}
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss alert"
          className="p-1 -mr-1 -mt-1 rounded-lg hover:bg-[#FEE2E2] dark:hover:bg-[#3B1C1C] text-[#991B1B] dark:text-[#FCA5A5] transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
