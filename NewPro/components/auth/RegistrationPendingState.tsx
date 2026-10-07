"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Mail, Clock, ArrowRight, CheckCircle2, Building, Sparkles } from "lucide-react";

interface RegistrationPendingStateProps {
  userName: string;
  email: string;
  role: string;
  institutionName?: string;
}

export const RegistrationPendingState: React.FC<RegistrationPendingStateProps> = ({
  userName,
  email,
  role,
  institutionName,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-6 px-2 text-center animate-in fade-in zoom-in-95 duration-300"
    >
      {/* Icon with glowing ambient halo */}
      <div className="relative mb-5">
        <div className="absolute inset-0 rounded-full bg-[#D9FF3F]/30 blur-2xl animate-pulse" />
        <div className="relative w-16 h-16 rounded-2xl bg-[#101212] dark:bg-[#1E2220] border-2 border-[#D9FF3F] text-[#D9FF3F] flex items-center justify-center shadow-xl">
          <Clock className="w-8 h-8 stroke-[2.5]" />
        </div>
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30 mb-3">
        <Sparkles className="w-3.5 h-3.5" />
        <span>REGISTRATION PENDING APPROVAL</span>
      </div>

      <h2 className="font-manrope font-bold text-2xl sm:text-[26px] text-[#101212] dark:text-white mb-2 leading-tight">
        Request Submitted to Admin
      </h2>

      <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-sm mb-6 leading-relaxed">
        Thank you, <span className="font-semibold text-[#101212] dark:text-white">{userName}</span>. Your registration request has been submitted to Xentro Platform Administration for verification.
      </p>

      {/* Summary Details Card */}
      <div className="w-full bg-[#F7F8F6] dark:bg-[#121413] rounded-xl border border-[#CDD1CE] dark:border-[#262928] p-4 mb-6 text-left space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#565B59] dark:text-[#8E9290]">Applicant Email:</span>
          <span className="font-medium font-mono text-[#101212] dark:text-white truncate max-w-[200px]">{email}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#565B59] dark:text-[#8E9290]">Requested Track:</span>
          <span className="font-semibold text-[#101212] dark:text-white flex items-center gap-1">
            {role}
            {institutionName ? ` (${institutionName})` : ""}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#565B59] dark:text-[#8E9290]">Review Status:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            In Review
          </span>
        </div>
      </div>

      {/* Step by step what happens next */}
      <div className="w-full text-left bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 space-y-2">
        <div className="flex items-start gap-2.5">
          <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-xs text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
            <strong className="text-[#101212] dark:text-white block mb-0.5">Email Activation Notification</strong>
            Once approved by our administration, you will receive an activation email from <span className="font-mono text-[#101212] dark:text-emerald-400">no-reply@xentro.in</span> confirming that your account is active and detailing login instructions.
          </div>
        </div>
        <div className="flex items-start gap-2.5 pt-1">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <div className="text-xs text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
            <strong className="text-[#101212] dark:text-white block mb-0.5">Instant Platform Access</strong>
            You will then be able to log in using your registered email and password or via sign-in OTP.
          </div>
        </div>
      </div>

      {/* Return to Sign in */}
      <Link
        href="/signin"
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-inter font-semibold text-xs sm:text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:scale-[0.99] transition-all shadow-sm"
      >
        <span>Return to Sign In</span>
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
};
