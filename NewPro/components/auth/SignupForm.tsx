"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, ArrowRight } from "lucide-react";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { GoogleAuthButton } from "./GoogleAuthButton";
import { AuthDivider } from "./AuthDivider";
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
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPendingApproval, setIsPendingApproval] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

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
      // 1. Submit to Django backend signup pipeline
      let backendSuccess = false;
      try {
        const backendUrl = getBackendBaseUrl();
        const resp = await fetch(`${backendUrl}/auth/signup/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: formData.fullName,
            email: formData.email,
            phoneNumber: formData.phoneNumber,
            password: formData.password,
            role: "Explorer",
            accountType: "Explorer",
            userType: "Explorer",
          })
        });
        const data = await resp.json();
        if (resp.ok && data?.success) {
          // Synchronize local fallback authService with real backend user ID & username
          await authService.signUpWithEmail(formData, data?.data?.user);
          if (data.data?.requiresApproval) {
            setIsPendingApproval(true);
          } else {
            setIsSuccess(true);
          }
          return;
        } else if (data?.message) {
          setGeneralError({
            message: data.message,
            type: "SERVER_ERROR",
          });
          setIsSubmitting(false);
          return;
        }
      } catch (backendFetchErr) {
        console.warn("Backend signup request failed, falling back to local auth simulation:", backendFetchErr);
      }

      // 2. Local fallback registration
      const result = await authService.signUpWithEmail(formData);
      if (result.success) {
        setIsSuccess(true);
      } else if (result.error) {
        setGeneralError({
          message: result.error.message,
          type: result.error.type,
        });
      }
    } catch {
      setGeneralError({
        message: "Something went wrong during signup. Please try again.",
        type: "UNKNOWN",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGeneralError(null);
    setIsGoogleLoading(true);

    try {
      const result = await authService.signInWithGoogle();
      if (result.success) {
        setIsSuccess(true);
      } else if (result.error) {
        if (result.error.type !== "GOOGLE_CANCELLED") {
          setGeneralError({
            message: result.error.message,
            type: result.error.type,
          });
        }
      }
    } catch {
      setGeneralError({
        message: "Something went wrong. Please try again.",
        type: "UNKNOWN",
      });
    } finally {
      setIsGoogleLoading(false);
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
    return <SuccessState userName={formData.fullName} redirectTo="/onboarding/verify" />;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Form Title & Subtitle */}
      <div className="mb-6 text-left">
        <h1 className="font-manrope font-bold text-2xl sm:text-3xl lg:text-[34px] tracking-tight text-[#101212] dark:text-white leading-[1.2] mb-2">
          Create your Xentro account
        </h1>
        <p className="font-inter text-sm sm:text-base text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
          Start by creating your personal account.
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

      {/* Main Signup Form */}
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
          value={formData.phoneNumber}
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
          disabled={isSubmitting || isGoogleLoading}
          className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-inter font-semibold text-sm transition-all duration-150 select-none bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#101212] shadow-sm hover:shadow"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-[#101212]" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <AuthDivider label="OR" />

      {/* Google Authentication */}
      <GoogleAuthButton
        onClick={handleGoogleSignIn}
        isLoading={isGoogleLoading}
        disabled={isSubmitting}
      />

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
