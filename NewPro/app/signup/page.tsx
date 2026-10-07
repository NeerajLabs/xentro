import React from "react";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { SignupForm } from "@/components/auth/SignupForm";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export const metadata = {
  title: "Sign Up / Create Account — XENTRO",
  description: "Join XENTRO and connect with people, ideas, capital, and opportunities.",
};

export default function SignUpPage() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F8F6] dark:bg-[#0D0F0F] transition-colors duration-200">
      {/* LEFT SIDE: Brand Visual Panel (Desktop 40%, Tablet sticky) */}
      <div className="hidden lg:block lg:w-[40%] h-screen sticky top-0 overflow-hidden">
        <AuthBrandPanel />
      </div>

      {/* MOBILE / TABLET HEADER (Stacked order on screens < 1024px) */}
      <div className="lg:hidden w-full bg-[#0D0F0F] text-white p-6 border-b border-[#262928] flex flex-col items-center text-center relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#D9FF3F]/10 blur-3xl pointer-events-none" />

        {/* Mobile top controls */}
        <div className="w-full flex items-center justify-between mb-4 z-10">
          <BrandLogo size={36} showWordmark={true} wordmarkClassName="text-white text-lg font-semibold" />
          <ThemeToggle />
        </div>

        {/* Short Brand Statement for Mobile */}
        <div className="z-10 py-2">
          <h2 className="font-sora font-semibold text-lg sm:text-xl text-white">
            Build your place in a more <span className="text-[#D9FF3F]">connected tomorrow.</span>
          </h2>
          <p className="font-inter text-xs text-[#B6B8B7] mt-1">
            PEOPLE &bull; IDEAS &bull; CAPITAL &bull; OPPORTUNITIES
          </p>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form Area (Desktop 60%) */}
      <div className="flex-1 lg:w-[60%] flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 overflow-y-auto min-h-screen">
        {/* Desktop Top Nav Controls */}
        <div className="hidden lg:flex items-center justify-end w-full max-w-md mx-auto mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-inter font-medium text-[#565B59] dark:text-[#B6B8B7]">
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-4 py-2">
          <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-8 rounded-2xl border border-[#CDD1CE] dark:border-[#262928] shadow-xentro-card transition-colors duration-200">
            <SignupForm />
          </div>
        </div>

        {/* Bottom Legal / Accessibility Info */}
        <div className="w-full max-w-md mx-auto mt-6 pb-4 text-center">
          <p className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7]">
            Secured by XENTRO Zero-Knowledge Protocol &bull; 256-Bit SSL Encryption
          </p>
        </div>
      </div>
    </main>
  );
}
