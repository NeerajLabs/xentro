"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthBrandPanel } from "@/components/auth/AuthBrandPanel";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthError } from "@/components/auth/AuthError";
import { authService } from "@/lib/auth/authService";
import { getBackendBaseUrl } from "@/lib/backendUrl";
import { Loader2, ArrowRight, ShieldCheck, User, Lock, KeyRound, Mail, RefreshCw, CheckCircle2 } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [loginMode, setLoginMode] = useState<"user" | "admin">("user");
  const [employeeId, setEmployeeId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.get("logout") === "true" || url.searchParams.get("reset") === "true") {
        authService.signOut();
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (_) {}
      }
      if (url.searchParams.get("role") === "admin" || url.searchParams.get("mode") === "admin") {
        setLoginMode("admin");
      }
    }
  }, []);

  const [userAuthMethod, setUserAuthMethod] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [statusNotice, setStatusNotice] = useState<{ type: "pending" | "info"; message: string } | null>(null);

  useEffect(() => {
    let timer: any = null;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your registered email address.");
      return;
    }
    setError(null);
    setStatusNotice(null);
    setOtpLoading(true);

    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/auth/signin/otp/send/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await resp.json();

      if (resp.status === 403 && data?.extra?.accountStatus === "PENDING_APPROVAL") {
        setStatusNotice({
          type: "pending",
          message: "Your account is pending administrator review. Once approved by Xentro Platform Administration, you will receive an activation email from no-reply@xentro.in."
        });
        setOtpLoading(false);
        return;
      }

      if (resp.status === 404) {
        setError("No account found with this email address. Please create an account first.");
        setOtpLoading(false);
        return;
      }

      if (resp.ok && data?.success) {
        setOtpSent(true);
        setOtpCountdown(60);
      } else {
        setError(data?.message || "Failed to dispatch verification code. Please check your email.");
      }
    } catch {
      setError("Unable to connect to authentication server. Please check your internet connection.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/auth/signin/otp/verify/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otpCode.trim() })
      });
      const data = await resp.json();

      if (resp.ok && data?.success && data?.data?.user) {
        const signedInUser = data.data.user;
        const tokens = data.data.tokens;
        if (tokens?.accessToken) {
          localStorage.setItem("xentro_access_token", tokens.accessToken);
          document.cookie = `xentro_session=${tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;
        }
        finalizeLogin(signedInUser, email.trim().toLowerCase());
        return;
      } else {
        setError(data?.message || "Invalid or expired verification code. Please request a new code.");
        setIsLoading(false);
      }
    } catch {
      setError("Unable to complete verification. Please check your internet connection and try again.");
      setIsLoading(false);
    }
  };

  const finalizeLogin = (signedInUser: any, normEmail: string) => {
    const displayName = signedInUser.fullName || signedInUser.name || normEmail.split("@")[0];
    const roles: string[] = signedInUser.activeRoles || [];
    const reqRole = signedInUser.registrationRequest?.requestedRole || "";
    const rawAccountType = (signedInUser.accountType || signedInUser.userType || signedInUser.primaryRole || reqRole || "").toString().toLowerCase();

    let activeRole = "explorer";
    if (rawAccountType.includes("startup") || roles.some((r) => r.toLowerCase().includes("startup") || r.toLowerCase().includes("founder"))) {
      activeRole = "startup";
    } else if (rawAccountType.includes("mentor") || roles.some((r) => r.toLowerCase().includes("mentor"))) {
      activeRole = "mentor";
    } else if (rawAccountType.includes("investor") || roles.some((r) => r.toLowerCase().includes("investor"))) {
      activeRole = "investor";
    } else if (rawAccountType.includes("esp") || roles.some((r) => r.toLowerCase().includes("esp"))) {
      activeRole = "esp";
    } else if (rawAccountType.includes("explorer") || roles.some((r) => r.toLowerCase().includes("explorer"))) {
      activeRole = "explorer";
    }

    const canonicalAccountType = activeRole === "esp" ? "ESP" : activeRole.charAt(0).toUpperCase() + activeRole.slice(1);

    const pProfile = signedInUser.personalProfile || {};
    const headline = signedInUser.headline || pProfile.headline || "";
    const loc = signedInUser.location || pProfile.location || "India";
    const defaultRoleTitle = activeRole === "mentor" ? "Angel Advisor & Mentor" : activeRole === "investor" ? "Investment Partner" : activeRole === "esp" ? "Incubator Administrator" : activeRole === "startup" ? "Founder & CEO" : "Ecosystem Explorer";
    const currentRole = signedInUser.currentRole || pProfile.currentRole || defaultRoleTitle;
    const currentOrg = signedInUser.currentOrganization || signedInUser.organization || pProfile.currentOrganization || signedInUser.entityName || (activeRole === "startup" ? displayName + " Innovations" : "Xentro Ecosystem");
    const education = signedInUser.education || pProfile.education || "";
    const bio = signedInUser.bio || pProfile.bio || "";
    const professionalExperience = signedInUser.professionalExperience || signedInUser.experienceSummary || pProfile.professionalExperience || "";
    const skills = signedInUser.skills || signedInUser.areasOfExpertise || pProfile.skills || [];
    const industries = signedInUser.industries || signedInUser.industriesOfFocus || pProfile.industries || [];
    const startupInterests = signedInUser.startupInterests || signedInUser.entrepreneurshipInterests || pProfile.startupInterests || [];
    const linkedin = signedInUser.linkedin || signedInUser.linkedinUrl || pProfile.linkedin || "";
    const website = signedInUser.website || signedInUser.websiteUrl || pProfile.website || "";
    const otherLinks = signedInUser.otherLinks || (signedInUser.otherLink ? [signedInUser.otherLink] : []) || pProfile.otherLinks || [];

    const personalProfileObj = {
      photoUrl: signedInUser.avatar || signedInUser.photoUrl,
      fullName: displayName,
      headline,
      location: loc,
      bio,
      currentRole,
      currentOrganization: currentOrg,
      education,
      professionalExperience,
      skills,
      areasOfExpertise: skills,
      industries,
      startupInterests,
      entrepreneurshipInterests: startupInterests,
      linkedin,
      website,
      otherLinks,
    };

    const profile = {
      id: signedInUser.id || "XU-" + Math.floor(100000 + Math.random() * 900000),
      name: displayName,
      email: signedInUser.email || normEmail,
      role: activeRole,
      roleTitle: currentRole,
      organization: currentOrg,
      sector: industries[0] || "Innovation Ecosystem",
      stageOrFocus: "Active",
      avatar: signedInUser.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(displayName)}`,
      location: loc,
      joinedAt: "Today",
      headline,
      bio,
      currentRole,
      currentOrganization: currentOrg,
      education,
      professionalExperience,
      experienceSummary: professionalExperience,
      skills,
      areasOfExpertise: skills,
      industries,
      industriesOfFocus: industries,
      startupInterests,
      entrepreneurshipInterests: startupInterests,
      linkedin,
      website,
      otherLink: otherLinks[0] || "",
      otherLinks,
    };

    localStorage.setItem("xentro_current_user", JSON.stringify(signedInUser));
    localStorage.setItem("xentro_personal_profile", JSON.stringify(personalProfileObj));
    localStorage.setItem("xentro_user_profile", JSON.stringify(profile));
    localStorage.setItem("xentro_active_role", activeRole);
    localStorage.setItem("xentro_account_type", canonicalAccountType);
    if (signedInUser.entityId) {
      localStorage.setItem("xentro_entity_id", signedInUser.entityId);
    }

    const hasChosenPath = Boolean(
      signedInUser.accountType ||
      signedInUser.userType ||
      signedInUser.primaryRole ||
      reqRole ||
      roles.some((r) => {
        const lower = r.toLowerCase();
        return lower.includes("startup") || lower.includes("mentor") || lower.includes("investor") || lower.includes("esp") || lower.includes("founder") || lower.includes("explorer");
      }) ||
      signedInUser.entityId ||
      signedInUser.accountStatus === "ACTIVE" ||
      signedInUser.createdAt
    );

    let hasEntities = Boolean(signedInUser.entityId);
    try {
      const storedEnts = localStorage.getItem("xentro_startup_entities");
      if (storedEnts && JSON.parse(storedEnts).length > 0) hasEntities = true;
    } catch (_) {}

    if (!hasChosenPath && !hasEntities) {
      document.cookie = `xentro_session=${encodeURIComponent(JSON.stringify({ userId: profile.id, role: activeRole, name: profile.name, profile }))}; path=/; max-age=86400; SameSite=Lax`;
      window.location.href = "/onboarding";
      return;
    }

    localStorage.setItem("xentro_onboarding_complete", "true");
    document.cookie = `xentro_session=${encodeURIComponent(JSON.stringify({ userId: profile.id, role: activeRole, name: profile.name, profile }))}; path=/; max-age=86400; SameSite=Lax`;

    window.location.href = "/";
  };

  const executeAdminLogin = async (empId: string, pass: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const { verifyAdminCredentials, setAdminSession } = await import("@/lib/adminAuth");
      const session = await verifyAdminCredentials(empId, pass);
      if (session) {
        setAdminSession(session);
        router.push("/admin/dashboard");
      } else {
        setError("Invalid Employee ID or Security Credential.");
      }
    } catch {
      setError("An authentication error occurred. Please verify your admin credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loginMode === "admin") {
      if (!employeeId || !adminPassword) {
        setError("Please enter your Employee ID and Administrative Password.");
        return;
      }
      await executeAdminLogin(employeeId, adminPassword);
      return;
    }

    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    setError(null);
    setStatusNotice(null);
    setIsLoading(true);

    try {
      const normEmail = email.trim().toLowerCase();
      let signedInUser: any = null;

      // 1. Try real Django Backend Auth first
      try {
        const backendUrl = getBackendBaseUrl();
        const resp = await fetch(`${backendUrl}/auth/signin/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: normEmail, password })
        });
        const data = await resp.json();

        // Check for pending review
        if (resp.status === 403 && data?.extra?.accountStatus === "PENDING_APPROVAL") {
          setStatusNotice({
            type: "pending",
            message: "Your account registration is under administrator review. You will receive an official activation email from no-reply@xentro.in with login instructions once approved."
          });
          setIsLoading(false);
          return;
        }

        if (data && data.success && data.data) {
          signedInUser = data.data.user;
          const tokens = data.data.tokens;
          if (tokens?.accessToken) {
            localStorage.setItem("xentro_access_token", tokens.accessToken);
            document.cookie = `xentro_session=${tokens.accessToken}; path=/; max-age=86400; SameSite=Lax`;
          }
        } else if (data?.message) {
          setError(data.message);
          setIsLoading(false);
          return;
        }
      } catch (backendErr) {
        console.warn("Backend auth fetch failed, falling back to local auth:", backendErr);
      }

      // 2. Fallback to MongoDB Atlas via /api/profile if backend proxy didn't return user
      if (!signedInUser) {
        try {
          const profRes = await fetch(`/api/profile?email=${encodeURIComponent(normEmail)}`);
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData?.data?.user || profData?.user) {
              signedInUser = profData.data?.user || profData.user;
            }
          }
        } catch (_) {}
      }

      // 3. Fallback to authService
      if (!signedInUser) {
        const res = await authService.signInWithEmail(email, password);
        if (res.success && res.user) {
          signedInUser = res.user;
        } else {
          setError(res.error?.message || "Unable to sign in. Please check your credentials.");
          setIsLoading(false);
          return;
        }
      }

      finalizeLogin(signedInUser, normEmail);
    } catch {
      setError("Unable to sign in. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F8F6] dark:bg-[#0D0F0F] transition-colors duration-200">
      {/* LEFT SIDE: Brand Visual Panel (Desktop 40%, Tablet sticky) */}
      <div className="hidden lg:block lg:w-[40%] h-screen sticky top-0 overflow-hidden">
        <AuthBrandPanel />
      </div>

      {/* MOBILE / TABLET HEADER (Stacked order on screens < 1024px) */}
      <div className="lg:hidden w-full bg-[#0D0F0F] text-white p-6 border-b border-[#262928] flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-[#D9FF3F]/10 blur-3xl pointer-events-none" />
        <div className="w-full flex items-center justify-between mb-4 z-10">
          <BrandLogo size={36} showWordmark={true} wordmarkClassName="text-white text-lg font-semibold" />
          <ThemeToggle />
        </div>
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

        {/* Main Card */}
        <div className="w-full max-w-md mx-auto my-4 py-2">
          <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-8 rounded-2xl border border-[#CDD1CE] dark:border-[#262928] shadow-xentro-card transition-colors duration-200">
            
            {/* Login Mode Toggle: User Sign In vs Employee / Admin */}
            <div className="flex items-center p-1 mb-6 rounded-xl bg-[#F0F2EE] dark:bg-[#121413] border border-[#E2E6E3] dark:border-[#222524]">
              <button
                type="button"
                onClick={() => {
                  setLoginMode("user");
                  setError(null);
                  setStatusNotice(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  loginMode === "user"
                    ? "bg-white dark:bg-[#1E2220] text-[#101212] dark:text-white shadow-xs"
                    : "text-[#565B59] dark:text-[#8E9290] hover:text-[#101212] dark:hover:text-white"
                }`}
              >
                User Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginMode("admin");
                  setError(null);
                  setStatusNotice(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginMode === "admin"
                    ? "bg-[#D9FF3F] text-[#101212] shadow-xs font-bold"
                    : "text-[#565B59] dark:text-[#8E9290] hover:text-[#101212] dark:hover:text-white"
                }`}
              >
                <span>Employee / Admin</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>

            <div className="mb-6">
              <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-[#101212] dark:text-white mb-2">
                {loginMode === "admin" ? "Administrative Portal" : "Sign in to XENTRO"}
              </h1>
              <p className="font-inter text-sm text-[#565B59] dark:text-[#B6B8B7]">
                {loginMode === "admin"
                  ? "Restricted internal access for Xentro staff and operators."
                  : "Welcome back. Enter your credentials to access your network."}
              </p>
            </div>

            {statusNotice && (
              <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-3 animate-in fade-in">
                <span className="p-1 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 mt-0.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </span>
                <div className="flex-1 leading-relaxed">
                  <strong className="block font-semibold text-amber-800 dark:text-amber-200 mb-0.5">Registration Under Review</strong>
                  {statusNotice.message}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-6">
                <AuthError message={error} onDismiss={() => setError(null)} />
              </div>
            )}

            {/* User Sign-In Method Selector (Password vs OTP) */}
            {loginMode === "user" && (
              <div className="flex items-center gap-2 mb-5 p-1 rounded-lg bg-gray-100 dark:bg-[#121413] border border-gray-200 dark:border-[#222524]">
                <button
                  type="button"
                  onClick={() => {
                    setUserAuthMethod("password");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    userAuthMethod === "password"
                      ? "bg-white dark:bg-[#1E2220] text-[#101212] dark:text-white shadow-xs font-semibold"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Password Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserAuthMethod("otp");
                    setError(null);
                  }}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                    userAuthMethod === "otp"
                      ? "bg-white dark:bg-[#1E2220] text-[#101212] dark:text-white shadow-xs font-semibold"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Email OTP Sign In
                </button>
              </div>
            )}

            {loginMode === "user" && userAuthMethod === "otp" ? (
              /* OTP Sign In Flow */
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-[#121413] border border-[#262928] text-xs text-[#A0A5A2] flex items-start gap-3">
                      <Mail className="w-4 h-4 text-[#D9FF3F] mt-0.5 shrink-0" />
                      <div className="leading-relaxed">
                        Enter your registered email address. We&apos;ll dispatch a secure, 6-digit one-time sign-in code directly to your inbox.
                      </div>
                    </div>

                    <AuthInput
                      label="Registered Email"
                      type="email"
                      placeholder="e.g. founder@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    <button
                      type="submit"
                      disabled={otpLoading || !email}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-inter font-semibold text-sm transition-all bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:scale-[0.99] disabled:opacity-50 cursor-pointer shadow-sm"
                    >
                      {otpLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Dispatching Security Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Sign-in Code</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-[#121413] border border-[#D9FF3F]/30 text-xs text-[#E0E2E1] flex items-start gap-3">
                      <div className="p-1 rounded-md bg-[#D9FF3F]/10 text-[#D9FF3F] shrink-0 mt-0.5">
                        <Mail className="w-4 h-4" />
                      </div>
                      <div className="leading-relaxed flex-1">
                        <div className="font-semibold text-white mb-0.5">Verification Code Dispatched</div>
                        A 6-digit authentication code was sent to <strong className="font-mono text-[#D9FF3F] font-semibold">{email}</strong>. Valid for 10 minutes.
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-[#101212] dark:text-white flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-[#D9FF3F]" />
                          <span>6-Digit Verification Code *</span>
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
                        className="w-full text-center tracking-[0.6em] font-mono font-bold text-2xl py-3 rounded-xl border border-[#CDD1CE] dark:border-[#262928] bg-white dark:bg-[#101212] text-[#101212] dark:text-[#D9FF3F] focus:outline-hidden focus:border-[#D9FF3F] focus:ring-1 focus:ring-[#D9FF3F]/30 transition-all placeholder:text-[#565B59] placeholder:tracking-widest"
                        required
                        autoFocus
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpSent(false);
                          setOtpCode("");
                          setError(null);
                        }}
                        className="text-[#8E9290] hover:text-[#101212] dark:hover:text-white underline cursor-pointer"
                      >
                        Change Email
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
                            disabled={otpLoading}
                            onClick={handleSendOtp}
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
                      disabled={isLoading || otpCode.length < 6}
                      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-inter font-semibold text-sm transition-all bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm font-bold"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying & Signing In...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Sign In</span>
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
                )}
              </div>
            ) : (
              /* Standard Password Sign In / Admin Sign In */
              <form onSubmit={handleSubmit} className="space-y-4">
                {loginMode === "user" ? (
                  <>
                    <AuthInput
                      label="Email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />

                    <PasswordInput
                      label="Password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </>
                ) : (
                  <>
                    <AuthInput
                      label="Employee ID or Admin Identifier"
                      type="text"
                      placeholder="Enter administrative ID"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      required
                    />

                    <PasswordInput
                      label="Security Credential / Passphrase"
                      placeholder="Enter administrative passphrase"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                  </>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-inter font-semibold text-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer ${
                    loginMode === "admin"
                      ? "bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] shadow-sm font-bold"
                      : "bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12]"
                  }`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>{loginMode === "admin" ? "Access Admin Console" : "Sign In"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {loginMode === "user" ? (
              <div className="mt-8 text-center">
                <p className="text-xs sm:text-sm font-inter text-[#565B59] dark:text-[#B6B8B7]">
                  Don&apos;t have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-semibold text-[#101212] dark:text-white underline underline-offset-4 hover:text-[#D9FF3F] transition-colors"
                  >
                    Create Account
                  </Link>
                </p>

                <div className="mt-4 pt-3 border-t border-[#CDD1CE]/40 dark:border-[#262928]/40">
                  <button
                    type="button"
                    onClick={() => {
                      authService.signOut();
                      try {
                        localStorage.clear();
                        sessionStorage.clear();
                      } catch (_) {}
                      window.location.href = '/signin?reset=true';
                    }}
                    className="text-[11px] font-mono text-[#8E9290] hover:text-[#DC2626] transition-colors underline"
                  >
                    Reset Browser Storage (Clean Slate)
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 pt-4 border-t border-[#CDD1CE] dark:border-[#262928] text-center">
                <p className="text-xs text-[#565B59] dark:text-[#8E9290]">
                  All administrative sessions and actions are logged and audited in accordance with XENTRO Security Policy.
                </p>
              </div>
            )}
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
