"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { DocumentUpload } from "@/components/onboarding/DocumentUpload";
import { AuthInput } from "@/components/auth/AuthInput";
import { authService } from "@/lib/auth/authService";
import {
  Rocket,
  Compass,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Building2,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RoleType = "Startup" | "Mentor" | "Investor";

function DetailsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [role, setRole] = useState<RoleType>("Startup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // STARTUP Form States
  const [startupName, setStartupName] = useState("");
  const [isRegistered, setIsRegistered] = useState<"yes" | "no">("yes");
  // If Registered == Yes
  const [regName, setRegName] = useState("");
  const [entityType, setEntityType] = useState<"MSME" | "PVT" | "LLC" | "OPC" | "GST">("PVT");
  const [regNo, setRegNo] = useState("");
  const [startupRegDoc, setStartupRegDoc] = useState<File | null>(null);
  // If Registered == No
  const [founderName, setFounderName] = useState("");
  const [startupAadhar, setStartupAadhar] = useState("");
  const [startupUnregDoc, setStartupUnregDoc] = useState<File | null>(null);

  // MENTOR Form States
  const [mentorName, setMentorName] = useState("");
  const [mentorDob, setMentorDob] = useState("");
  const [mentorAadhar, setMentorAadhar] = useState("");
  const [mentorDoc, setMentorDoc] = useState<File | null>(null);

  // INVESTOR Form States
  const [investorType, setInvestorType] = useState<"Individual" | "Angel Investor" | "VC Firm">("Individual");
  // If Investor == Individual
  const [investorName, setInvestorName] = useState("");
  const [investorAadhar, setInvestorAadhar] = useState("");
  const [investorDob, setInvestorDob] = useState("");
  const [investorAadharDoc, setInvestorAadharDoc] = useState<File | null>(null);
  // If Investor == Angel Investor / VC Firm
  const [investorRegType, setInvestorRegType] = useState("SEBI Accredited");
  const [firmRegNo, setFirmRegNo] = useState("");
  const [investorDoc, setInvestorDoc] = useState<File | null>(null);

  // Form errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const roleParam = searchParams ? (searchParams.get("role") as RoleType | null) : null;
    if (roleParam && (roleParam === "Startup" || roleParam === "Mentor" || roleParam === "Investor")) {
      setRole(roleParam);
    } else {
      // Check session
      const stored = sessionStorage.getItem("xentro_user_preference") as RoleType | null;
      if (stored) setRole(stored);
    }

    const user = authService.getCurrentUser();
    if (user?.fullName) {
      setFounderName(user.fullName);
      setMentorName(user.fullName);
      setInvestorName(user.fullName);
    }
  }, [searchParams]);

  const handleAadhaarChange = (val: string, setter: (s: string) => void) => {
    // Only allow numbers and spaces, limit to 14 chars formatted (12 digits)
    const cleaned = val.replace(/\D/g, "").slice(0, 12);
    let formatted = cleaned;
    if (cleaned.length > 4 && cleaned.length <= 8) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4)}`;
    } else if (cleaned.length > 8) {
      formatted = `${cleaned.slice(0, 4)} ${cleaned.slice(4, 8)} ${cleaned.slice(8)}`;
    }
    setter(formatted);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (role === "Startup") {
      if (!startupName.trim()) newErrors.startupName = "Startup name is required";

      if (isRegistered === "yes") {
        if (!regName.trim()) newErrors.regName = "Registered name is required";
        if (!regNo.trim()) newErrors.regNo = "Registration number is required";
        if (!startupRegDoc) newErrors.startupRegDoc = "Registration document is required";
      } else {
        if (!founderName.trim()) newErrors.founderName = "Founder name is required";
        if (!startupAadhar.trim() || startupAadhar.replace(/\s/g, "").length < 12) {
          newErrors.startupAadhar = "Enter a valid 12-digit Aadhaar number";
        }
        if (!startupUnregDoc) newErrors.startupUnregDoc = "Identity / verification document is required";
      }
    } else if (role === "Mentor") {
      if (!mentorName.trim()) newErrors.mentorName = "Full name is required";
      if (!mentorDob.trim()) newErrors.mentorDob = "Date of Birth is required";
      if (!mentorAadhar.trim() || mentorAadhar.replace(/\s/g, "").length < 12) {
        newErrors.mentorAadhar = "Enter a valid 12-digit Aadhaar number";
      }
      if (!mentorDoc) newErrors.mentorDoc = "Credentials / ID document is required";
    } else if (role === "Investor") {
      if (investorType === "Individual") {
        if (!investorName.trim()) newErrors.investorName = "Full name is required";
        if (!investorAadhar.trim() || investorAadhar.replace(/\s/g, "").length < 12) {
          newErrors.investorAadhar = "Enter a valid 12-digit Aadhaar number";
        }
        if (!investorDob.trim()) newErrors.investorDob = "Date of Birth is required";
        if (!investorAadharDoc) newErrors.investorAadharDoc = "Aadhaar document is required";
      } else {
        if (!investorRegType.trim()) newErrors.investorRegType = "Registration type is required";
        if (!firmRegNo.trim()) newErrors.firmRegNo = "Entity / Registration number is required";
        if (!investorDoc) newErrors.investorDoc = "Accreditation / Registration document is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <BrandLogo size={42} showWordmark={true} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Verification Card */}
      <div className="w-full max-w-2xl mx-auto my-10">
        <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-10 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-xentro-card transition-colors">
          {/* Progress Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9FF3F]/15 text-xs font-inter font-semibold text-[#101212] dark:text-[#D9FF3F]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Step 2 &bull; Role Details &amp; Verification</span>
            </span>

            {/* Static Role Badge Indicator */}
            <span className="text-xs font-inter font-semibold px-3 py-1 rounded-full bg-[#D9FF3F] text-[#101212]">
              {role}
            </span>
          </div>

          <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-[#101212] dark:text-white mb-2">
            {role === "Startup" && "Startup Details"}
            {role === "Mentor" && "Mentor Verification Details"}
            {role === "Investor" && "Investor Profile & Registration"}
          </h1>
          <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] mb-8">
            Please provide your authentic details for identity verification and customized network access.
          </p>

          {/* SUCCESS MODAL / OVERLAY */}
          {isSuccess ? (
            <div className="py-8 px-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center mx-auto mb-5 shadow-lg">
                <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
              </div>
              <h2 className="font-manrope font-bold text-2xl text-[#101212] dark:text-white mb-2">
                Details Submitted Successfully!
              </h2>
              <p className="font-inter text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto mb-8">
                Your <strong>{role}</strong> credentials have been verified and secured under the XENTRO Zero-Knowledge Protocol. You now have full access to the XENTRO Hub.
              </p>
              <button
                type="button"
                onClick={() => alert(`Entering XENTRO Hub as verified ${role}!`)}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] shadow-sm transition-all"
              >
                <span>Launch XENTRO Hub Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* ========================================================
                  1. STARTUP FLOW (Based on Whiteboard)
                  ======================================================== */}
              {role === "Startup" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Startup Name */}
                  <AuthInput
                    id="startupName"
                    label="Startup Name (St. Name)"
                    placeholder="Enter your startup name"
                    value={startupName}
                    onChange={(e) => setStartupName(e.target.value)}
                    error={errors.startupName}
                    touched={Boolean(errors.startupName)}
                    required
                  />

                  {/* Registered or Not Toggle */}
                  <div className="w-full flex flex-col space-y-2">
                    <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-[#FFFFFF]">
                      Registered or Not? <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setIsRegistered("yes")}
                        className={cn(
                          "py-3 px-4 rounded-xl text-xs font-inter font-semibold border transition-all flex items-center justify-center gap-2",
                          isRegistered === "yes"
                            ? "border-[#D9FF3F] bg-[#D9FF3F]/15 text-[#101212] dark:text-white ring-2 ring-[#D9FF3F]/30"
                            : "border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] hover:border-[#B6B8B7]"
                        )}
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Yes, Registered</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsRegistered("no")}
                        className={cn(
                          "py-3 px-4 rounded-xl text-xs font-inter font-semibold border transition-all flex items-center justify-center gap-2",
                          isRegistered === "no"
                            ? "border-[#D9FF3F] bg-[#D9FF3F]/15 text-[#101212] dark:text-white ring-2 ring-[#D9FF3F]/30"
                            : "border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] hover:border-[#B6B8B7]"
                        )}
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>No (Early / Unregistered)</span>
                      </button>
                    </div>
                  </div>

                  {/* BRANCH: YES REGISTERED */}
                  {isRegistered === "yes" ? (
                    <div className="space-y-5 p-5 rounded-xl bg-[#F7F8F6]/60 dark:bg-[#0D0F0F]/60 border border-[#E3E5E3] dark:border-[#262928] animate-in fade-in duration-200">
                      {/* Registered Name */}
                      <AuthInput
                        id="regName"
                        label="Registered Company Name (Reg. Name)"
                        placeholder="e.g. Acme Tech Private Limited"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        error={errors.regName}
                        touched={Boolean(errors.regName)}
                        required
                      />

                      {/* Type of Entity: MSME, PVT, LLC, OPC, GST */}
                      <div className="space-y-2">
                        <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-[#FFFFFF]">
                          Registration Entity Type (Type) <span className="text-[#EF4444]">*</span>
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {(["MSME", "PVT", "LLC", "OPC", "GST"] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setEntityType(t)}
                              className={cn(
                                "px-4 py-2 rounded-lg text-xs font-inter font-bold transition-all border",
                                entityType === t
                                  ? "bg-[#D9FF3F] text-[#101212] border-[#D9FF3F] shadow-sm"
                                  : "border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] hover:border-[#101212] dark:hover:border-white"
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Registration Number */}
                      <AuthInput
                        id="regNo"
                        label="Registration Number (Reg. No)"
                        placeholder="e.g. CIN / LLPIN / Udyam / GSTIN"
                        value={regNo}
                        onChange={(e) => setRegNo(e.target.value)}
                        error={errors.regNo}
                        touched={Boolean(errors.regNo)}
                        required
                      />

                      {/* Upload Document */}
                      <DocumentUpload
                        label="Upload Document (Upload DOC)"
                        hint="Certificate of Incorporation, GST, or MSME Udyam"
                        onFileSelect={(file) => setStartupRegDoc(file)}
                        error={errors.startupRegDoc}
                        required
                      />
                    </div>
                  ) : (
                    /* BRANCH: NO NOT REGISTERED */
                    <div className="space-y-5 p-5 rounded-xl bg-[#F7F8F6]/60 dark:bg-[#0D0F0F]/60 border border-[#E3E5E3] dark:border-[#262928] animate-in fade-in duration-200">
                      {/* Founder Name */}
                      <AuthInput
                        id="founderName"
                        label="Founder Name (Found Name)"
                        placeholder="Enter primary founder name"
                        value={founderName}
                        onChange={(e) => setFounderName(e.target.value)}
                        error={errors.founderName}
                        touched={Boolean(errors.founderName)}
                        required
                      />

                      {/* Aadhaar Number */}
                      <AuthInput
                        id="startupAadhar"
                        label="Aadhaar Number (ADHar no)"
                        placeholder="XXXX XXXX XXXX (12 Digits)"
                        value={startupAadhar}
                        onChange={(e) => handleAadhaarChange(e.target.value, setStartupAadhar)}
                        error={errors.startupAadhar}
                        touched={Boolean(errors.startupAadhar)}
                        maxLength={14}
                        required
                      />

                      {/* Upload Document */}
                      <DocumentUpload
                        label="Upload Document (Upload DOC)"
                        hint="Founder Government ID Proof or Pitch Deck"
                        onFileSelect={(file) => setStartupUnregDoc(file)}
                        error={errors.startupUnregDoc}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================
                  2. MENTOR FLOW (DOB only, Age removed)
                  ======================================================== */}
              {role === "Mentor" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Name */}
                  <AuthInput
                    id="mentorName"
                    label="Full Name (Name)"
                    placeholder="Enter your full legal name"
                    value={mentorName}
                    onChange={(e) => setMentorName(e.target.value)}
                    error={errors.mentorName}
                    touched={Boolean(errors.mentorName)}
                    required
                  />

                  {/* Date of Birth (DOB) - Age removed */}
                  <AuthInput
                    id="mentorDob"
                    type="date"
                    label="Date of Birth (DOB)"
                    placeholder="YYYY-MM-DD"
                    value={mentorDob}
                    onChange={(e) => setMentorDob(e.target.value)}
                    error={errors.mentorDob}
                    touched={Boolean(errors.mentorDob)}
                    required
                  />

                  {/* Aadhaar Number */}
                  <AuthInput
                    id="mentorAadhar"
                    label="Aadhaar Number (ADHar)"
                    placeholder="XXXX XXXX XXXX (12 Digits)"
                    value={mentorAadhar}
                    onChange={(e) => handleAadhaarChange(e.target.value, setMentorAadhar)}
                    error={errors.mentorAadhar}
                    touched={Boolean(errors.mentorAadhar)}
                    maxLength={14}
                    required
                  />

                  {/* Upload Document */}
                  <DocumentUpload
                    label="Upload Document (Upload Doc)"
                    hint="Professional CV, LinkedIn Verification, or ID Proof"
                    onFileSelect={(file) => setMentorDoc(file)}
                    error={errors.mentorDoc}
                    required
                  />
                </div>
              )}

              {/* ========================================================
                  3. INVESTOR FLOW (Differentiated: Individual vs Angel/VC Firm)
                  ======================================================== */}
              {role === "Investor" && (
                <div className="space-y-5 animate-in fade-in duration-200">
                  {/* Investor Type: Individual, Angel Investor, VC Firm */}
                  <div className="space-y-2">
                    <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-[#FFFFFF]">
                      Investor Category (Type) <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(["Individual", "Angel Investor", "VC Firm"] as const).map((it) => (
                        <button
                          key={it}
                          type="button"
                          onClick={() => {
                            setInvestorType(it);
                            setErrors({});
                          }}
                          className={cn(
                            "py-3 px-3 rounded-xl text-xs font-inter font-bold transition-all border text-center",
                            investorType === it
                              ? "bg-[#D9FF3F] text-[#101212] border-[#D9FF3F] shadow-sm"
                              : "border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] hover:border-[#101212] dark:hover:border-white"
                          )}
                        >
                          {it}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* BRANCH A: INDIVIDUAL INVESTOR
                      (Requires: Name, Aadhaar Number, DOB, Upload Aadhaar) */}
                  {investorType === "Individual" ? (
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Name */}
                      <AuthInput
                        id="investorName"
                        label="Full Name (Name)"
                        placeholder="Enter your full legal name"
                        value={investorName}
                        onChange={(e) => setInvestorName(e.target.value)}
                        error={errors.investorName}
                        touched={Boolean(errors.investorName)}
                        required
                      />

                      {/* Aadhaar Number */}
                      <AuthInput
                        id="investorAadhar"
                        label="Aadhaar Number (ADHar no)"
                        placeholder="XXXX XXXX XXXX (12 Digits)"
                        value={investorAadhar}
                        onChange={(e) => handleAadhaarChange(e.target.value, setInvestorAadhar)}
                        error={errors.investorAadhar}
                        touched={Boolean(errors.investorAadhar)}
                        maxLength={14}
                        required
                      />

                      {/* Date of Birth (DOB) */}
                      <AuthInput
                        id="investorDob"
                        type="date"
                        label="Date of Birth (DOB)"
                        placeholder="YYYY-MM-DD"
                        value={investorDob}
                        onChange={(e) => setInvestorDob(e.target.value)}
                        error={errors.investorDob}
                        touched={Boolean(errors.investorDob)}
                        required
                      />

                      {/* Upload Aadhaar */}
                      <DocumentUpload
                        label="Upload Aadhaar (Upload Doc)"
                        hint="Front &amp; back of Aadhaar Card or e-Aadhaar PDF"
                        onFileSelect={(file) => setInvestorAadharDoc(file)}
                        error={errors.investorAadharDoc}
                        required
                      />
                    </div>
                  ) : (
                    /* BRANCH B: ANGEL INVESTOR / VC FIRM
                       (Requires: Type of Registration, Entity / VC Firm Reg No, Doc Upload) */
                    <div className="space-y-5 animate-in fade-in duration-200">
                      {/* Type of Registration */}
                      <AuthInput
                        id="investorRegType"
                        label="Type of Registration (Type of reg.)"
                        placeholder="e.g. SEBI Category I/II AIF, Angel Network, Accredited"
                        value={investorRegType}
                        onChange={(e) => setInvestorRegType(e.target.value)}
                        error={errors.investorRegType}
                        touched={Boolean(errors.investorRegType)}
                        required
                      />

                      {/* VC Firm / Entity Reg No */}
                      <AuthInput
                        id="firmRegNo"
                        label="Entity / VC Firm Registration Number (VC Firm reg no)"
                        placeholder="e.g. IN/AIF1/... or Corporate Reg Number"
                        value={firmRegNo}
                        onChange={(e) => setFirmRegNo(e.target.value)}
                        error={errors.firmRegNo}
                        touched={Boolean(errors.firmRegNo)}
                        required
                      />

                      {/* Document Upload */}
                      <DocumentUpload
                        label="Upload Document (Doc upload)"
                        hint="SEBI License, Fund Charter, or Accreditation certificate"
                        onFileSelect={(file) => setInvestorDoc(file)}
                        error={errors.investorDoc}
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E3E5E3] dark:border-[#262928]">
                <Link
                  href="/onboarding"
                  className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors"
                >
                  &larr; Back to Role Selection
                </Link>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] active:scale-[0.99] disabled:opacity-50 transition-all shadow-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-[#101212]" />
                      <span>Verifying &amp; Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit &amp; Enter XENTRO Hub</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
        XENTRO &bull; CONNECT PEOPLE. CREATE OPPORTUNITY.
      </footer>
    </main>
  );
}

export default function OnboardingDetailsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#F7F8F6] dark:bg-[#0D0F0F]"><Loader2 className="w-8 h-8 animate-spin text-[#101212] dark:text-[#D9FF3F]" /></div>}>
      <DetailsContent />
    </Suspense>
  );
}
