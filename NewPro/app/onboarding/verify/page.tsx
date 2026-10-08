"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { authService } from "@/lib/auth/authService";
import { getBackendBaseUrl } from "@/lib/backendUrl";
import { User } from "@/lib/auth/types";
import {
  Mail,
  ArrowRight,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Edit2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function VerifyAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [newEmailValue, setNewEmailValue] = useState("");

  useEffect(() => {
    const active = authService.getCurrentUser();
    if (!active) {
      router.push("/signup");
      return;
    }
    setUser(active);
    setNewEmailValue(active.email);

    // If user arrived without an email, redirect to signup
    if (!active.email) {
      router.push("/signup");
    }
  }, [router]);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleOtpChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean && val !== "") return;

    const newOtp = [...otp];
    newOtp[index] = clean.slice(-1);
    setOtp(newOtp);
    setError(null);

    // Auto advance focus
    if (clean && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    setError(null);
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    setIsVerifying(true);
    setError(null);

    try {
      let verifiedOnBackend = false;
      // 1. Verify with backend MongoDB / Redis API
      if (user?.email) {
        try {
          const backendUrl = getBackendBaseUrl();
          const resp = await fetch(`${backendUrl}/auth/otp/verify/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: user.email.trim().toLowerCase(), code: code.trim() })
          });
          const data = await resp.json();
          if (resp.ok && data?.success) {
            verifiedOnBackend = true;
            if (data.data?.tokens?.accessToken) {
              localStorage.setItem("xentro_access_token", data.data.tokens.accessToken);
              document.cookie = `xentro_session=${data.data.tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;
            }
          } else {
            setError(data?.message || "Invalid verification code. Please check and try again.");
            setIsVerifying(false);
            return;
          }
        } catch (backendErr) {
          console.warn("Backend verification unreachable, falling back to local auth simulation:", backendErr);
        }
      }

      // 2. Complete session verification locally
      const ok = await authService.verifyEmailCode(code);

      if (ok || verifiedOnBackend) {
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/onboarding/profile");
        }, 1000);
      } else {
        setError("Invalid verification code. Please check and try again.");
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;
    setResendCountdown(60);
    setError(null);
    setOtp(["", "", "", "", "", ""]);

    if (user?.email) {
      try {
        const backendUrl = getBackendBaseUrl();
        const resp = await fetch(`${backendUrl}/auth/otp/send/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: user.email.trim().toLowerCase() })
        });
        const data = await resp.json();
        if (!resp.ok || !data?.success) {
          setError(data?.message || "Failed to dispatch verification code.");
        }
      } catch {
        // Fallback
      }
    }
  };

  const handleSaveNewContact = () => {
    if (!newEmailValue.trim()) return;
    const updated = authService.updateContact(newEmailValue, undefined);
    if (updated) setUser(updated);
    setIsEditingContact(false);
    setResendCountdown(30);
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <BrandLogo size={42} showWordmark={true} />
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <div className="w-full max-w-xl mx-auto my-8">
        {/* Progress Indicator: Step 02 */}
        <div className="mb-6">
          <ProgressIndicator currentStep={2} />
        </div>

        {/* Verification Card */}
        <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-10 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-xentro-card transition-colors">
          {/* Card Header */}
          <div className="mb-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-[#101212] dark:text-white mb-2">
              Verify your email
            </h1>
            <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
              We&apos;ve sent a 6-digit verification code to your email to activate your personal Xentro account.
            </p>
          </div>

          {/* Active Contact Display & Change Option */}
          <div className="p-3.5 mb-6 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928] flex items-center justify-between">
            {isEditingContact ? (
              <div className="w-full flex items-center gap-2">
                <input
                  type="email"
                  value={newEmailValue}
                  onChange={(e) => setNewEmailValue(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D9FF3F]"
                  placeholder="Enter email address"
                />
                <button
                  type="button"
                  onClick={handleSaveNewContact}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#D9FF3F] text-[#101212]"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingContact(false)}
                  className="px-2 py-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7]"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <>
                <div className="text-left flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#D9FF3F]/15 flex items-center justify-center text-[#101212] dark:text-[#D9FF3F]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7]">
                      Verification code sent to:
                    </p>
                    <p className="font-inter font-semibold text-xs sm:text-sm text-[#101212] dark:text-white">
                      {user?.email || "alex@xentro.network"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingContact(true)}
                  className="inline-flex items-center gap-1 text-xs font-inter font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-[#D9FF3F] transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Change</span>
                </button>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-inter text-center animate-in fade-in">
              {error}
            </div>
          )}

          {/* Success State */}
          {isSuccess ? (
            <div className="py-8 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center mx-auto mb-3 shadow-md">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="font-manrope font-bold text-xl text-[#101212] dark:text-white mb-1">
                Email Verified!
              </h2>
              <p className="font-inter text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Advancing to Step 03: Personal Profile...
              </p>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6">
              {/* 6-Digit OTP Box Grid */}
              <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-manrope font-bold rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-[#101212] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF3F] transition-all"
                  />
                ))}
              </div>

              {/* Resend Code Action */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCountdown > 0}
                  className="inline-flex items-center gap-1.5 text-xs font-inter font-medium text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-[#D9FF3F] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", resendCountdown === 0 && "animate-spin-slow")} />
                  <span>
                    {resendCountdown > 0
                      ? `Resend code in ${resendCountdown}s`
                      : "Resend verification code"}
                  </span>
                </button>
              </div>

              {/* Verify & Continue CTA */}
              <button
                type="submit"
                disabled={isVerifying || otp.join("").length < 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-inter font-semibold text-sm transition-all duration-150 select-none bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => router.push("/onboarding/profile")}
                  className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white"
                >
                  Skip verification &rarr;
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const demoOtp = ["1", "2", "3", "4", "5", "6"];
                    setOtp(demoOtp);
                    authService.verifyEmailCode("123456").then(() => {
                      setIsSuccess(true);
                      setTimeout(() => router.push("/onboarding/profile"), 800);
                    });
                  }}
                  className="text-xs font-inter text-[#101212] dark:text-[#D9FF3F] hover:underline"
                >
                  Auto-fill demo code
                </button>
              </div>
            </form>
          )}

          {/* Tip */}
          <div className="mt-4 pt-3 border-t border-[#E3E5E3] dark:border-[#262928] text-center">
            <p className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7]">
              Simulation tip: Enter any 6-digit code (e.g. <code>123456</code>) or click Auto-fill to proceed.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-xl mx-auto text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
        XENTRO &bull; CONNECT PEOPLE. CREATE OPPORTUNITY.
      </footer>
    </main>
  );
}
