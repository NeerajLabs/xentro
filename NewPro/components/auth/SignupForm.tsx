"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight, Mail, KeyRound, RefreshCw, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { AuthError } from "./AuthError";
import { TermsModal } from "./TermsModal";
import { SuccessState } from "./SuccessState";
import { RegistrationPendingState } from "./RegistrationPendingState";
import { SignUpFormData, FormErrors, AuthErrorType } from "@/lib/auth/types";
import { validateSignUpForm, validateField } from "@/lib/auth/validation";
import { authService } from "@/lib/auth/authService";
import { getBackendBaseUrl } from "@/lib/backendUrl";
import { getNewProUrl } from "@/lib/auth/xentroHandoff";

export const SignupForm: React.FC = () => {
  // Step state: "form" for initial details, "otp" for email code verification
  const [step, setStep] = useState<"form" | "otp">("form");
  const [otpCode, setOtpCode] = useState("");
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [otpInfoMessage, setOtpInfoMessage] = useState<string | null>(null);

  // Form values
  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
    agreedToPrivacy: false,
    consentIdentityVerification: false,
  });

  // Touched state for each field to avoid premature validation errors
  const [touched, setTouched] = useState<Record<keyof SignUpFormData, boolean>>({
    fullName: false,
    email: false,
    phoneNumber: false,
    password: false,
    confirmPassword: false,
    agreedToTerms: false,
    agreedToPrivacy: false,
    consentIdentityVerification: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [generalError, setGeneralError] = useState<{
    message: string;
    type: AuthErrorType;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

  useEffect(() => {
    let timer: any = null;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  // Terms & Privacy modal state
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    type: "terms" | "privacy";
  }>({
    isOpen: false,
    type: "terms",
  });

  const handleBlur = (field: keyof SignUpFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errorMsg = validateField(field, formData[field], formData);
    setErrors((prev) => ({ ...prev, [field]: errorMsg }));
  };

  const handleChange = (
    field: keyof SignUpFormData,
    value: string | boolean
  ) => {
    const updated = { ...formData, [field]: value };
    setFormData(updated);

    if (generalError) {
      setGeneralError(null);
    }

    if (touched[field]) {
      const errorMsg = validateField(field, value, updated);
      setErrors((prev) => ({ ...prev, [field]: errorMsg }));
    }

    // Revalidate confirmPassword when password changes
    if (field === "password" && touched.confirmPassword) {
      const confirmError = validateField("confirmPassword", formData.confirmPassword, updated);
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  };

  // Step 1: Validate form details and dispatch 6-digit OTP to user's email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setOtpInfoMessage(null);

    // Mark all fields touched
    setTouched({
      fullName: true,
      email: true,
      phoneNumber: true,
      password: true,
      confirmPassword: true,
      agreedToTerms: true,
      agreedToPrivacy: true,
      consentIdentityVerification: true,
    });

    const validationErrors = validateSignUpForm(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/auth/signup/otp/send/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });
      const data = await resp.json();

      if (resp.status === 409) {
        setGeneralError({
          message: "An account with this email already exists. Please sign in instead.",
          type: "EMAIL_EXISTS",
        });
        setIsSubmitting(false);
        return;
      }

      if (resp.ok && data?.success) {
        setStep("otp");
        setOtpCode("");
        setOtpCountdown(60);
        setOtpInfoMessage(`A 6-digit verification code has been dispatched to ${formData.email.trim().toLowerCase()}.`);
      } else {
        setGeneralError({
          message: data?.message || "Failed to dispatch verification code. Please check your email and try again.",
          type: "SERVER_ERROR",
        });
      }
    } catch {
      setGeneralError({
        message: "Unable to connect to verification server. Please verify your internet connection and try again.",
        type: "SERVER_ERROR",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    if (otpCountdown > 0 || isSubmitting) return;
    setIsSubmitting(true);
    setGeneralError(null);
    setOtpInfoMessage(null);

    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/auth/signup/otp/send/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email.trim().toLowerCase() }),
      });
      const data = await resp.json();

      if (resp.ok && data?.success) {
        setOtpCountdown(60);
        setOtpCode("");
        setOtpInfoMessage(`A fresh verification code was sent to ${formData.email.trim().toLowerCase()}.`);
      } else {
        setGeneralError({
          message: data?.message || "Failed to resend verification code. Please try again in a moment.",
          type: "SERVER_ERROR",
        });
      }
    } catch {
      setGeneralError({
        message: "Unable to reach verification service. Please try again.",
        type: "SERVER_ERROR",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify entered 6-digit OTP and complete user account registration
  const handleVerifyAndSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setGeneralError({
        message: "Please enter the complete 6-digit verification code.",
        type: "SERVER_ERROR",
      });
      return;
    }

    setIsSubmitting(true);
    setGeneralError(null);

    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/auth/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName.trim(),
          email: formData.email.trim().toLowerCase(),
          phoneNumber: formData.phoneNumber.trim(),
          password: formData.password,
          otp: otpCode.trim(),
          role: "Explorer",
          accountType: "Explorer",
          userType: "Explorer",
        }),
      });
      const data = await resp.json();

      if (resp.ok && data?.success) {
        if (data.data?.tokens?.accessToken) {
          localStorage.setItem("xentro_access_token", data.data.tokens.accessToken);
          document.cookie = `xentro_session=${data.data.tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;
        }

        await authService.signUpWithEmail(formData, data?.data?.user);

        if (data.data?.requiresApproval) {
          setIsPendingApproval(true);
        } else {
          setIsSuccess(true);
        }
      } else {
        setGeneralError({
          message: data?.message || "Invalid or expired verification code. Please request a new code.",
          type: "SERVER_ERROR",
        });
      }
    } catch {
      setGeneralError({
        message: "Unable to complete account registration. Please try again.",
        type: "SERVER_ERROR",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPendingApproval) {
    return (
      <RegistrationPendingState
        userName={formData.fullName || "User"}
        email={formData.email}
        role="Explorer"
        institutionName={undefined}
      />
    );
  }

  if (isSuccess) {
    return <SuccessState userName={formData.fullName} redirectTo="/onboarding" />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Form Title & Subtitle */}
      <div className="mb-6 text-left">
        <h1 className="font-manrope font-bold text-2xl sm:text-3xl lg:text-[34px] tracking-tight text-[#101212] dark:text-white leading-[1.2] mb-2">
          {step === "otp" ? "Verify your email" : "Create your Xentro account"}
        </h1>
        <p className="font-inter text-sm sm:text-base text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
          {step === "otp"
            ? "Enter the 6-digit security code sent to activate your personal account."
            : "Start by creating your personal account."}
        </p>
      </div>

      {/* General Authentication Error Banner */}
      {generalError && (
        <div className="mb-6">
          <AuthError
            message={generalError.message}
            type={generalError.type}
            onDismiss={() => setGeneralError(null)}
          />
        </div>
      )}

      {step === "otp" ? (
        /* STEP 2: Email OTP Verification Form */
        <form onSubmit={handleVerifyAndSignup} className="space-y-5">
          <div className="p-3.5 rounded-xl bg-[#121413] border border-[#D9FF3F]/30 text-xs text-[#E0E2E1] flex items-start gap-3">
            <div className="p-1 rounded-md bg-[#D9FF3F]/10 text-[#D9FF3F] shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div className="leading-relaxed flex-1">
              <div className="font-semibold text-white mb-0.5">Verification Code Dispatched</div>
              A 6-digit verification code was sent to{" "}
              <strong className="font-mono text-[#D9FF3F] font-semibold">{formData.email}</strong>. Valid for 10 minutes.
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#101212] dark:text-white flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#D9FF3F]" />
                <span>6-Digit Security Code *</span>
              </label>
              <span className="text-[10px] font-mono text-[#8E9290]">Valid for 10m</span>
            </div>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="&bull; &bull; &bull; &bull; &bull; &bull;"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              className="w-full text-center tracking-[0.6em] font-mono font-bold text-2xl py-3.5 rounded-xl border border-[#CDD1CE] dark:border-[#262928] bg-white dark:bg-[#101212] text-[#101212] dark:text-[#D9FF3F] focus:outline-hidden focus:border-[#D9FF3F] focus:ring-1 focus:ring-[#D9FF3F]/30 transition-all placeholder:text-[#565B59] placeholder:tracking-widest"
              required
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <button
              type="button"
              onClick={() => {
                setStep("form");
                setGeneralError(null);
              }}
              className="text-[#8E9290] hover:text-[#101212] dark:hover:text-white underline cursor-pointer flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back / Change Email</span>
            </button>
            <div>
              {otpCountdown > 0 ? (
                <span className="text-[11px] font-mono text-[#8E9290] flex items-center gap-1.5">
                  <RefreshCw className="w-3 h-3 text-[#D9FF3F] animate-spin" />
                  Resend in {otpCountdown}s
                </span>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleResendOtp}
                  className="text-xs font-semibold text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpCode.length < 6}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-inter font-semibold text-sm transition-all duration-150 select-none bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm font-bold"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#101212]" />
                <span>Verifying & Creating Account...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify & Complete Registration</span>
              </>
            )}
          </button>

          <div className="text-center pt-1">
            <span className="text-[10px] text-[#6E7370] dark:text-[#8E9290] flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#D9FF3F]" />
              Zero-Knowledge Verification &bull; Never share this code
            </span>
          </div>
        </form>
      ) : (
        /* STEP 1: Main Signup Form */
        <>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Full Name */}
            <AuthInput
              id="fullName"
              name="fullName"
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              autoComplete="name"
              value={formData.fullName}
              onChange={(e) => handleChange("fullName", e.target.value)}
              onBlur={() => handleBlur("fullName")}
              error={errors.fullName}
              touched={touched.fullName}
              required
            />

            {/* Personal Email */}
            <AuthInput
              id="email"
              name="email"
              type="email"
              label="Personal Email"
              placeholder="Enter your personal email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              onBlur={() => handleBlur("email")}
              error={errors.email}
              touched={touched.email}
              required
            />

            {/* Phone Number */}
            <AuthInput
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              label="Phone Number"
              placeholder="+91 98765 43210"
              autoComplete="tel"
              value={formData.phoneNumber || ""}
              onChange={(e) => handleChange("phoneNumber", e.target.value)}
              onBlur={() => handleBlur("phoneNumber")}
              error={errors.phoneNumber}
              touched={touched.phoneNumber}
              required
            />

            {/* Password */}
            <PasswordInput
              id="password"
              name="password"
              label="Password"
              placeholder="Create a password (min. 8 characters)"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              onBlur={() => handleBlur("password")}
              error={errors.password}
              touched={touched.password}
              showStrengthMeter={true}
              required
            />

            {/* Confirm Password */}
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              placeholder="Confirm your password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              error={errors.confirmPassword}
              touched={touched.confirmPassword}
              showStrengthMeter={false}
              required
            />

            {/* Legal & Consent Checkboxes */}
            <div className="pt-2 space-y-2.5">
              {/* Checkbox 1: Terms of Service */}
              <div>
                <label className="relative flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    id="agreedToTerms"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={(e) => handleChange("agreedToTerms", e.target.checked)}
                    onBlur={() => handleBlur("agreedToTerms")}
                    className="mt-0.5 w-4 h-4 rounded border-[#E3E5E3] dark:border-[#262928] text-[#101212] focus:ring-[#D9FF3F] accent-[#D9FF3F] cursor-pointer"
                  />
                  <span className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setModalState({ isOpen: true, type: "terms" })}
                      className="font-medium text-[#101212] dark:text-white underline underline-offset-2 hover:text-[#565B59] dark:hover:text-[#D9FF3F] transition-colors"
                    >
                      Terms of Service
                    </button>
                    .
                  </span>
                </label>
                {touched.agreedToTerms && errors.agreedToTerms && (
                  <p role="alert" className="text-xs text-[#DC2626] dark:text-[#F87171] mt-1 font-inter animate-in fade-in">
                    {errors.agreedToTerms}
                  </p>
                )}
              </div>

              {/* Checkbox 2: Privacy Policy */}
              <div>
                <label className="relative flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    id="agreedToPrivacy"
                    name="agreedToPrivacy"
                    checked={formData.agreedToPrivacy}
                    onChange={(e) => handleChange("agreedToPrivacy", e.target.checked)}
                    onBlur={() => handleBlur("agreedToPrivacy")}
                    className="mt-0.5 w-4 h-4 rounded border-[#E3E5E3] dark:border-[#262928] text-[#101212] focus:ring-[#D9FF3F] accent-[#D9FF3F] cursor-pointer"
                  />
                  <span className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setModalState({ isOpen: true, type: "privacy" })}
                      className="font-medium text-[#101212] dark:text-white underline underline-offset-2 hover:text-[#565B59] dark:hover:text-[#D9FF3F] transition-colors"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
                {touched.agreedToPrivacy && errors.agreedToPrivacy && (
                  <p role="alert" className="text-xs text-[#DC2626] dark:text-[#F87171] mt-1 font-inter animate-in fade-in">
                    {errors.agreedToPrivacy}
                  </p>
                )}
              </div>

              {/* Checkbox 3: Identity Verification Consent */}
              <div>
                <label className="relative flex items-start gap-3 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    id="consentIdentityVerification"
                    name="consentIdentityVerification"
                    checked={formData.consentIdentityVerification}
                    onChange={(e) => handleChange("consentIdentityVerification", e.target.checked)}
                    onBlur={() => handleBlur("consentIdentityVerification")}
                    className="mt-0.5 w-4 h-4 rounded border-[#E3E5E3] dark:border-[#262928] text-[#101212] focus:ring-[#D9FF3F] accent-[#D9FF3F] cursor-pointer"
                  />
                  <span className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                    I consent to Xentro&apos;s identity verification process.
                  </span>
                </label>
                {touched.consentIdentityVerification && errors.consentIdentityVerification && (
                  <p role="alert" className="text-xs text-[#DC2626] dark:text-[#F87171] mt-1 font-inter animate-in fade-in">
                    {errors.consentIdentityVerification}
                  </p>
                )}
              </div>
            </div>

            {/* Primary CTA: Create Account */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-inter font-semibold text-sm transition-all duration-150 select-none bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#101212] shadow-sm hover:shadow cursor-pointer font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#101212]" />
                  <span>Dispatching verification code...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </form>
        </>
      )}

      {/* Already have an account */}
      <div className="mt-8 text-center">
        <p className="text-xs sm:text-sm font-inter text-[#565B59] dark:text-[#B6B8B7]">
          Already have an account?{" "}
          <Link
            href="/signin"
            className="font-semibold text-[#101212] dark:text-white underline underline-offset-4 hover:text-[#565B59] dark:hover:text-[#D9FF3F] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>

      {/* Terms & Privacy Dialog */}
      <TermsModal
        isOpen={modalState.isOpen}
        type={modalState.type}
        onClose={() => setModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
