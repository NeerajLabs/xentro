"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

interface SuccessStateProps {
  userName?: string;
  redirectTo?: string;
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  userName,
  redirectTo = "/onboarding",
}) => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirectTo;
    }, 1800);
    return () => clearTimeout(timer);
  }, [redirectTo]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-300"
    >
      <div className="relative mb-6">
        {/* Pulsing Lime Ambient Halo */}
        <div className="absolute inset-0 rounded-full bg-[#D9FF3F]/30 blur-xl animate-pulse" />
        
        {/* Animated Checkmark Circle */}
        <div className="relative w-16 h-16 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center shadow-lg">
          <Check className="w-8 h-8 stroke-[3] animate-in zoom-in duration-300" />
        </div>
      </div>

      <h2 className="font-manrope font-bold text-2xl text-[#101212] dark:text-white mb-2">
        Account created successfully.
      </h2>

      <p className="font-inter text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-sm mb-6 leading-relaxed">
        {userName ? `Welcome aboard, ${userName}. ` : "Welcome to XENTRO. "}
        Preparing your personalized workspace...
      </p>

      {/* Transition Progress Line */}
      <div className="w-56 h-1.5 bg-[#E3E5E3] dark:bg-[#262928] rounded-full overflow-hidden relative">
        <div className="h-full bg-[#D9FF3F] rounded-full animate-progress shadow-[0_0_12px_rgba(217,255,63,0.5)]" />
      </div>
    </div>
  );
};
