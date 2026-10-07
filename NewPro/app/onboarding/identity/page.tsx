"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { AuthInput } from "@/components/auth/AuthInput";
import { authService } from "@/lib/auth/authService";
import { User, IdentityVerificationData, IdentityVerificationState } from "@/lib/auth/types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  RotateCcw,
  ArrowRight,
  Loader2,
  Lock,
  EyeOff,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATE_CONFIG: Record<
  IdentityVerificationState,
  { label: string; icon: React.ElementType; colorClass: string; bgClass: string; borderClass: string; message: string }
> = {
  NOT_SUBMITTED: {
    label: "Not Submitted",
    icon: Clock,
    colorClass: "text-[#565B59] dark:text-[#B6B8B7]",
    bgClass: "bg-gray-100 dark:bg-[#181B1A]",
    borderClass: "border-gray-300 dark:border-[#262928]",
    message: "Identity verification documents have not been submitted yet.",
  },
  PENDING: {
    label: "Pending Submission",
    icon: Clock,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    message: "Awaiting submission of your identity credentials.",
  },
  UNDER_REVIEW: {
    label: "Under Review",
    icon: Clock,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
    borderClass: "border-amber-500/30",
    message: "Your identity documents are currently being securely processed by the verification authority.",
  },
  VERIFIED: {
    label: "Identity Verified ✓",
    icon: CheckCircle2,
    colorClass: "text-[#101212] dark:text-[#D9FF3F]",
    bgClass: "bg-[#D9FF3F]/15",
    borderClass: "border-[#D9FF3F]/40",
    message: "Your identity has been verified under XENTRO Zero-Knowledge Protocol.",
  },
  FAILED: {
    label: "Verification Failed",
    icon: AlertTriangle,
    colorClass: "text-red-500",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30",
    message: "Verification could not be completed. Please review the requirements and re-attempt.",
  },
  RESUBMISSION_REQUIRED: {
    label: "Resubmission Required",
    icon: RotateCcw,
    colorClass: "text-orange-500",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30",
    message: "The uploaded document was unreadable or incomplete. Please upload a clearer copy.",
  },
  REVERIFICATION_REQUIRED: {
    label: "Reverification Required",
    icon: RotateCcw,
    colorClass: "text-orange-500",
    bgClass: "bg-orange-500/10",
    borderClass: "border-orange-500/30",
    message: "Periodic regulatory reverification is required for continued high-tier access.",
  },
  RESTRICTED: {
    label: "Restricted",
    icon: Ban,
    colorClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-600/10",
    borderClass: "border-red-600/30",
    message: "Account restricted pending manual compliance verification.",
  },
};

export default function IdentityVerificationPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [existingRecord, setExistingRecord] = useState<IdentityVerificationData | null>(null);

  // Form Fields
  const [nameAsPerAadhaar, setNameAsPerAadhaar] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState<string>("Prefer not to say");
  const [address, setAddress] = useState("");
  const [consent, setConsent] = useState(false);

  // Submission & Validation States
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeState, setActiveState] = useState<IdentityVerificationState>("NOT_SUBMITTED");

  useEffect(() => {
    const active = authService.getCurrentUser();
    if (!active) {
      router.push("/signup");
      return;
    }
    setUser(active);
    setNameAsPerAadhaar(active.fullName);

    const storedIdentity = authService.getIdentityVerification();
    if (storedIdentity) {
      setExistingRecord(storedIdentity);
      setActiveState(storedIdentity.status);
    }
  }, [router]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!nameAsPerAadhaar.trim()) {
      newErrors.nameAsPerAadhaar = "Enter your full legal name.";
    }

    if (!consent && !existingRecord) {
      newErrors.consent = "Please provide identity verification consent.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const record = await authService.submitIdentityVerification({
        nameAsPerAadhaar,
        dob,
        gender,
        address,
      });
      setExistingRecord(record);
      setActiveState("VERIFIED");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateState = (st: IdentityVerificationState) => {
    setActiveState(st);
    authService.setIdentityVerificationState(st, STATE_CONFIG[st].message);
  };

  const currentConfig = STATE_CONFIG[activeState];
  const StateIcon = currentConfig.icon;

  return (
    <main className="min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <BrandLogo size={42} showWordmark={true} />
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <div className="w-full max-w-2xl mx-auto my-8">
        {/* Progress Indicator: Step 03 */}
        <div className="mb-6">
          <ProgressIndicator currentStep={3} />
        </div>

        {/* Verification Card */}
        <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-10 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-xentro-card transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9FF3F]/15 text-xs font-inter font-semibold text-[#101212] dark:text-[#D9FF3F]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Identity Verification</span>
            </span>

            {/* Current State Pill */}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-inter font-bold border",
                currentConfig.bgClass,
                currentConfig.colorClass,
                currentConfig.borderClass
              )}
            >
              <StateIcon className="w-3.5 h-3.5" />
              <span>{currentConfig.label}</span>
            </span>
          </div>

          <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-[#101212] dark:text-white mb-2">
            Verify your identity
          </h1>
          <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] mb-6">
            Your identity verification helps keep the Xentro ecosystem trusted and secure.
          </p>

          {/* SENSITIVE DATA PRIVACY NOTICE */}
          <div className="p-3.5 mb-6 rounded-xl bg-[#0D0F0F] border border-[#262928] flex items-start gap-3 text-xs font-inter text-[#B6B8B7]">
            <Lock className="w-4 h-4 text-[#D9FF3F] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white mb-0.5">Strict Identity Privacy Protocol</p>
              <p className="text-[11px] leading-relaxed">
                Your personal details are processed securely under the Xentro Privacy Protocol and never displayed across public profiles or shared with third parties without your explicit consent.
              </p>
            </div>
          </div>

          {/* If already submitted and verified: display summary */}
          {activeState === "VERIFIED" && existingRecord ? (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/30 text-center">
                <div className="w-12 h-12 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center mx-auto mb-3 shadow-md">
                  <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h3 className="font-manrope font-bold text-lg text-[#101212] dark:text-white mb-1">
                  Identity Verified ✓
                </h3>
                <p className="font-inter text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
                  {currentConfig.message}
                </p>
              </div>

              {/* Metadata Summary */}
              <div className="p-4 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928] space-y-3">
                <div className="flex items-center justify-between text-xs font-inter">
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">Verified Legal Name</span>
                  <span className="font-semibold text-[#101212] dark:text-white">{existingRecord.nameAsPerAadhaar}</span>
                </div>
                {existingRecord.maskedAadhaar && existingRecord.maskedAadhaar !== "VERIFIED" && (
                  <div className="flex items-center justify-between text-xs font-inter">
                    <span className="text-[#565B59] dark:text-[#B6B8B7] flex items-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5 text-[#565B59]" />
                      <span>ID (Masked)</span>
                    </span>
                    <span className="font-mono font-bold text-[#101212] dark:text-[#D9FF3F]">
                      {existingRecord.maskedAadhaar}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs font-inter">
                  <span className="text-[#565B59] dark:text-[#B6B8B7]">Verification Protocol</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero-Knowledge Validated</span>
                </div>
              </div>

              {/* Action: Proceed to Profile */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => handleSimulateState("RESUBMISSION_REQUIRED")}
                  className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white underline underline-offset-2"
                >
                  Need to update or reverify?
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/onboarding/profile")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] shadow-sm transition-all"
                >
                  <span>Continue to Personal Profile</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Main Form for Submission / Resubmission */
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              {/* Full Legal Name */}
              <AuthInput
                id="nameAsPerAadhaar"
                label="Full Legal Name"
                placeholder="Enter your full legal name"
                value={nameAsPerAadhaar}
                onChange={(e) => setNameAsPerAadhaar(e.target.value)}
                error={errors.nameAsPerAadhaar}
                touched={Boolean(errors.nameAsPerAadhaar)}
                required
              />

              {/* Optional/Conditional Fields: DOB, Gender, Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="dob"
                  type="date"
                  label="Date of Birth (Optional)"
                  placeholder="YYYY-MM-DD"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />

                <div className="space-y-1.5">
                  <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                    Gender (Optional)
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full py-3.5 px-3.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
                  >
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Address (Optional) */}
              <AuthInput
                id="address"
                label="Residential Address (Optional)"
                placeholder="City, State, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              {/* Identity Consent Checkbox */}
              <div>
                <label className="relative flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#E3E5E3] dark:border-[#262928] text-[#101212] focus:ring-[#D9FF3F] accent-[#D9FF3F] cursor-pointer"
                  />
                  <span className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    I consent to Xentro&apos;s identity verification process and declare that the identity details provided belong to me and are authentic.
                  </span>
                </label>
                {errors.consent && (
                  <p role="alert" className="text-xs text-red-500 mt-1 font-inter animate-in fade-in">
                    {errors.consent}
                  </p>
                )}
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-inter font-semibold text-sm transition-all duration-150 select-none bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#101212]" />
                    <span>Verifying identity...</span>
                  </>
                ) : (
                  <>
                    <span>Submit &amp; Verify Identity</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* State Machine Switcher (For compliance testing of all 8 states) */}
          <div className="mt-8 pt-5 border-t border-[#E3E5E3] dark:border-[#262928]">
            <p className="text-[11px] font-inter uppercase tracking-wider font-bold text-[#565B59] dark:text-[#B6B8B7] mb-2.5">
              Test Verification State Machine (8 States Spec):
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  "NOT_SUBMITTED",
                  "PENDING",
                  "UNDER_REVIEW",
                  "VERIFIED",
                  "FAILED",
                  "RESUBMISSION_REQUIRED",
                  "REVERIFICATION_REQUIRED",
                  "RESTRICTED",
                ] as IdentityVerificationState[]
              ).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleSimulateState(st)}
                  className={cn(
                    "text-[10px] font-inter font-semibold px-2 py-1 rounded-md border transition-all",
                    activeState === st
                      ? "bg-[#D9FF3F] text-[#101212] border-[#D9FF3F]"
                      : "border-[#E3E5E3] dark:border-[#262928] text-[#565B59] dark:text-[#B6B8B7] hover:border-[#101212] dark:hover:border-white"
                  )}
                >
                  {STATE_CONFIG[st].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-2xl mx-auto text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
        XENTRO &bull; CONNECT PEOPLE. CREATE OPPORTUNITY.
      </footer>
    </main>
  );
}
