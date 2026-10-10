"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { AuthInput } from "@/components/auth/AuthInput";
import { authService } from "@/lib/auth/authService";
import { getBackendBaseUrl } from "@/lib/backendUrl";
import { completeOnboardingAndHandoff, getNewProUrl } from "@/lib/auth/xentroHandoff";
import { logoutFromNewPro } from "@/lib/authGuard";
import { User, ParticipationPath, StartupEntity, InvestorOrgEntity, EspRequest } from "@/lib/auth/types";
import {
  Rocket,
  Compass,
  TrendingUp,
  Building2,
  Globe2,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  LogOut,
  X,
  Loader2,
  Search,
  Building,
  UserCheck,
  FileCheck,
  ExternalLink,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PARTICIPATION_PATHS = [
  {
    id: "startup" as const,
    title: "Create a Startup",
    description: "Build, grow, and connect with mentors, investors and opportunities.",
    icon: Rocket,
    type: "Entity Account",
    typeBadge: "Creates Entity",
  },
  {
    id: "mentor" as const,
    title: "Become a Mentor",
    description: "Share knowledge, experience and guidance with emerging founders.",
    icon: Compass,
    type: "Personal Role",
    typeBadge: "Personal Role",
  },
  {
    id: "investor" as const,
    title: "Become an Investor",
    description: "Discover startups, opportunities and investment possibilities.",
    icon: TrendingUp,
    type: "Individual or Entity",
    typeBadge: "Role or Entity",
  },
  {
    id: "esp" as const,
    title: "Request an Institution / ESP Account",
    description: "Connect your institution with the Xentro ecosystem.",
    icon: Building2,
    type: "Entity Request",
    typeBadge: "Requires Review",
  },
  {
    id: "explorer" as const,
    title: "Explore the Ecosystem",
    description: "Discover startups, mentors, investors, ESPs and opportunities.",
    icon: Globe2,
    type: "Personal Access",
    typeBadge: "Instant Access",
  },
];

const ESP_ORG_TYPES = [
  "School",
  "College",
  "University",
  "Pre-Incubator",
  "Incubator",
  "Accelerator",
  "Innovation Hub",
  "Entrepreneurship Cell",
  "Government Startup Organization",
  "Corporate Innovation Program",
  "Research Commercialization Centre",
  "Startup Support Organization",
  "Ecosystem Organization",
  "Other",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [activeModal, setActiveModal] = useState<"startup" | "mentor" | "investor" | "esp" | "explorer" | null>(null);
  const [completedPaths, setCompletedPaths] = useState<string[]>([]);
  const [isPathSelected, setIsPathSelected] = useState<boolean>(false);
  const [newProRedirectUrl, setNewProRedirectUrl] = useState<string>("");

  // Startup Entity Form State
  const [startupName, setStartupName] = useState("");
  const [isDuplicateChecked, setIsDuplicateChecked] = useState(false);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [isDuplicateNameAvailable, setIsDuplicateNameAvailable] = useState(true);
  const [startupRegType, setStartupRegType] = useState<StartupEntity["regType"]>("Pvt Ltd");
  const [startupRegNo, setStartupRegNo] = useState("");
  const [startupStage, setStartupStage] = useState<StartupEntity["stage"]>("Early Traction");
  const [startupIndustry, setStartupIndustry] = useState("");
  const [startupLocation, setStartupLocation] = useState("");
  const [startupWebsite, setStartupWebsite] = useState("");
  const [startupOfficialEmail, setStartupOfficialEmail] = useState("");
  const [isStartupEmailVerified, setIsStartupEmailVerified] = useState(false);
  const [startupEmailCode, setStartupEmailCode] = useState("");
  const [isCreatingStartup, setIsCreatingStartup] = useState(false);
  const [createdStartup, setCreatedStartup] = useState<StartupEntity | null>(null);

  // Mentor Setup Form State
  const [mentorRole, setMentorRole] = useState("");
  const [mentorOrg, setMentorOrg] = useState("");
  const [mentorExp, setMentorExp] = useState("");
  const [mentorAreas, setMentorAreas] = useState("");
  const [isActivatingMentor, setIsActivatingMentor] = useState(false);

  // Investor Flow State
  const [investorMode, setInvestorMode] = useState<"choose" | "individual" | "org" | "org_success">("choose");
  const [investorOrgSearch, setInvestorOrgSearch] = useState("");
  const [investorOrgFound, setInvestorOrgFound] = useState<boolean | null>(null);
  const [investorOrgName, setInvestorOrgName] = useState("");
  const [investorOrgRegType, setInvestorOrgRegType] = useState("SEBI Category I/II AIF");
  const [investorOrgRegNo, setInvestorOrgRegNo] = useState("");
  const [investorOrgOfficialEmail, setInvestorOrgOfficialEmail] = useState("");
  const [investorOrgRole, setInvestorOrgRole] = useState("");
  const [isProcessingInvestor, setIsProcessingInvestor] = useState(false);

  // ESP / Institution Request State
  const [espInstName, setEspInstName] = useState("");
  const [espOrgType, setEspOrgType] = useState("Incubator");
  const [espWebsite, setEspWebsite] = useState("");
  const [espOfficialEmail, setEspOfficialEmail] = useState("");
  const [espPhone, setEspPhone] = useState("");
  const [espCity, setEspCity] = useState("");
  const [espState, setEspState] = useState("");
  const [espCountry, setEspCountry] = useState("India");
  const [espApplicantName, setEspApplicantName] = useState("");
  const [espDesignation, setEspDesignation] = useState("");
  const [espDept, setEspDept] = useState("");
  const [espInstEmail, setEspInstEmail] = useState("");
  const [espApplicantPhone, setEspApplicantPhone] = useState("");
  const [espLinkedin, setEspLinkedin] = useState("");
  const [espAuthorized, setEspAuthorized] = useState<"yes" | "no">("yes");
  const [isSubmittingEsp, setIsSubmittingEsp] = useState(false);
  const [espSubmittedRequest, setEspSubmittedRequest] = useState<EspRequest | null>(null);
  const [personalProfile, setPersonalProfile] = useState<any>(null);

  useEffect(() => {
    const active = authService.getCurrentUser();
    if (!active) {
      router.push("/signup");
      return;
    }
    setUser(active);
    if (typeof window !== "undefined" && (localStorage.getItem("xentro_onboarding_complete") === "true" || active.onboardingCompleted)) {
      router.push("/");
      return;
    }
    setEspApplicantName(active.fullName);
    setStartupOfficialEmail(`team@${active.email.split("@")[1] || "company.com"}`);
    setInvestorOrgOfficialEmail(`partner@${active.email.split("@")[1] || "vcfirm.com"}`);

    const prof = authService.getPersonalProfile();
    setPersonalProfile(prof);

    // If coming from Step 3 (profile) or with step=4, or no path selected yet:
    // User is firmly on Step 4 (Choose Path)!
    const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const isExplicitStep4 = urlParams ? urlParams.get("step") === "4" : false;
    const storedChosen = typeof window !== "undefined" ? localStorage.getItem("xentro_selected_path_step4") : null;

    if (isExplicitStep4 || !storedChosen) {
      setIsPathSelected(false);
      setCompletedPaths([]);
    } else {
      setIsPathSelected(true);
      setCompletedPaths([storedChosen]);
    }
  }, [router]);

  const handleGoToFeed = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("xentro_onboarding_complete", "true");
      window.location.href = "/";
    }
  };

  const handleSignOut = () => {
    logoutFromNewPro();
  };

  // 1. Startup Logic
  const handleCheckStartupDuplicate = async () => {
    if (!startupName.trim()) return;
    setIsDuplicateChecking(true);
    await new Promise((r) => setTimeout(r, 600));
    // Simulate check: unavailable only if name is "Xentro"
    const available = startupName.toLowerCase().trim() !== "xentro";
    setIsDuplicateNameAvailable(available);
    setIsDuplicateChecked(true);
    setIsDuplicateChecking(false);
  };

  const handleVerifyStartupEmail = async () => {
    if (startupEmailCode.length === 6) {
      setIsStartupEmailVerified(true);
    }
  };

  const handleCreateStartupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingStartup(true);

    const startup = await authService.createStartupEntity({
      startupName: startupName.trim(),
      founderName: user?.fullName || "Founder",
      regType: startupRegType,
      regNo: startupRegNo.trim(),
      stage: startupStage,
      industry: startupIndustry,
      location: startupLocation,
      website: startupWebsite.trim(),
      description: "Next-generation venture connected via Xentro ecosystem.",
      officialEmail: startupOfficialEmail.trim(),
      isOfficialEmailVerified: false,
    });

    setIsCreatingStartup(false);
    setCreatedStartup(startup);
    setCompletedPaths(["Startup Founder"]);
    setIsPathSelected(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("xentro_selected_path_step4", "Startup Founder");
    }
    setActiveModal(null);

    const { redirectUrl } = completeOnboardingAndHandoff("startup", {
      organization: startupName.trim(),
      sector: startupIndustry,
      stageOrFocus: startupStage,
      location: startupLocation,
    });
    setNewProRedirectUrl(redirectUrl);
  };

  // 2. Mentor Logic
  const handleActivateMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActivatingMentor(true);
    await authService.activateMentorRole({
      professionalRole: mentorRole,
      organization: mentorOrg,
      yearsOfExperience: mentorExp,
      mentorshipAreas: mentorAreas.split(",").map((s) => s.trim()),
    });
    setIsActivatingMentor(false);
    setCompletedPaths(["Mentor"]);
    setIsPathSelected(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("xentro_selected_path_step4", "Mentor");
    }
    setActiveModal(null);

    const { redirectUrl } = completeOnboardingAndHandoff("mentor", {
      organization: mentorOrg,
      roleTitle: mentorRole,
      sector: mentorAreas,
    });
    setNewProRedirectUrl(redirectUrl);
  };

  // 3. Investor Logic
  const handleActivateIndividualInvestor = async () => {
    setIsProcessingInvestor(true);
    await authService.activateIndividualInvestorRole();
    setIsProcessingInvestor(false);
    setCompletedPaths(["Individual Investor"]);
    setIsPathSelected(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("xentro_selected_path_step4", "Individual Investor");
    }
    setActiveModal(null);

    const { redirectUrl } = completeOnboardingAndHandoff("investor", {
      roleTitle: "Angel Investor",
      organization: "Individual Investor",
    });
    setNewProRedirectUrl(redirectUrl);
  };

  const handleSearchInvestorOrg = async () => {
    if (!investorOrgSearch.trim()) return;
    setIsProcessingInvestor(true);
    await new Promise((r) => setTimeout(r, 600));
    const exists = investorOrgSearch.toLowerCase().includes("sequoia") || investorOrgSearch.toLowerCase().includes("nexus");
    setInvestorOrgFound(exists);
    setIsProcessingInvestor(false);
  };

  const handleRegisterInvestorOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingInvestor(true);
    await authService.registerInvestorOrg({
      orgName: investorOrgName.trim() || investorOrgSearch.trim(),
      regType: investorOrgRegType,
      regNo: investorOrgRegNo.trim() || "IN/AIF1/23-24/0981",
      officialEmail: investorOrgOfficialEmail.trim(),
      website: "https://venturefirm.com",
      applicantRole: investorOrgRole,
      isMembershipRequested: investorOrgFound === true,
    });
    setIsProcessingInvestor(false);
    setCompletedPaths(["Institutional Investor"]);
    setIsPathSelected(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("xentro_selected_path_step4", "Institutional Investor");
    }

    const effectiveOrgName = investorOrgName.trim() || investorOrgSearch.trim() || "My Investment Fund";
    const dynamicOrgId = `org_${effectiveOrgName.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30)}_${Date.now().toString(36)}`;

    const { redirectUrl } = completeOnboardingAndHandoff(
      "investor",
      {
        roleTitle: investorOrgRole,
        organization: effectiveOrgName,
      },
      {
        type: "organization",
        organizationId: dynamicOrgId,
      }
    );
    setNewProRedirectUrl(redirectUrl);
    setInvestorMode("org_success");
  };

  // 4. ESP Request Logic
  const handleSubmitEsp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEsp(true);

    try {
      const backendUrl = getBackendBaseUrl();
      await fetch(`${backendUrl}/auth/esp-request/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: espInstName.trim(),
          organizationType: espOrgType,
          website: espWebsite.trim() || "https://institution.edu",
          officialEmail: espOfficialEmail.trim() || user?.email,
          contactNumber: espPhone.trim() || user?.phoneNumber,
          city: espCity.trim(),
          state: espState.trim(),
          country: espCountry.trim(),
          applicantName: espApplicantName.trim() || user?.fullName,
          designation: espDesignation.trim(),
          department: espDept.trim(),
          institutionalEmail: espInstEmail.trim() || user?.email,
          phone: espApplicantPhone.trim() || user?.phoneNumber,
        })
      });
    } catch (backendErr) {
      console.warn("Backend ESP request failed:", backendErr);
    }

    const req = await authService.submitEspRequest({
      institutionName: espInstName.trim(),
      organizationType: espOrgType,
      website: espWebsite.trim() || "https://institution.edu",
      officialEmail: espOfficialEmail.trim() || "innovation@institution.edu",
      contactNumber: espPhone.trim() || "+91 80 2345 6789",
      city: espCity.trim() || "Bengaluru",
      state: espState.trim() || "Karnataka",
      country: espCountry.trim() || "India",
      applicantName: espApplicantName.trim() || user?.fullName || "Applicant",
      designation: espDesignation.trim(),
      department: espDept.trim(),
      institutionalEmail: espInstEmail.trim() || user?.email || "applicant@institution.edu",
      phone: espApplicantPhone.trim() || user?.phoneNumber || "+91 98765 43210",
      linkedin: espLinkedin.trim(),
      isAuthorizedRepresentative: espAuthorized === "yes",
    });
    setIsSubmittingEsp(false);
    setEspSubmittedRequest(req);
    setCompletedPaths((p) => [...p, "ESP Applicant"]);
    setIsPathSelected(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("xentro_selected_path_step4", "ESP Applicant");
    }
  };

  // 5. Explorer Logic
  const handleActivateExplorer = async () => {
    await authService.activateExplorerAccess();
    setCompletedPaths(["Explorer"]);
    setIsPathSelected(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("xentro_selected_path_step4", "Explorer");
    }
    setActiveModal(null);
  };

  const handleLaunchHubWithRole = (
    role: "startup" | "mentor" | "investor" | "esp" | "explorer",
    investorContext?: { type: "individual" | "organization"; organizationId?: string }
  ) => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push("/signup");
      return;
    }
    const details: any = {};
    if (role === "startup" && createdStartup) {
      details.organization = createdStartup.startupName;
      details.sector = createdStartup.industry;
      details.stageOrFocus = createdStartup.stage;
      details.location = createdStartup.location;
    }
    const { redirectUrl } = completeOnboardingAndHandoff(role, details, investorContext);
    window.location.href = redirectUrl;
  };

  const handleLaunchHub = () => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      router.push("/signup");
      return;
    }

    // Default to guest/explorer - only upgrade to a concrete role when a path was completed
    let role: "startup" | "mentor" | "investor" | "esp" | "explorer" = "explorer";
    let investorContext: { type: "individual" | "organization"; organizationId?: string } | undefined = undefined;
    const details: any = {};

    if (completedPaths.includes("Startup Founder")) {
      role = "startup";
      if (createdStartup) {
        details.organization = createdStartup.startupName;
        details.sector = createdStartup.industry;
        details.stageOrFocus = createdStartup.stage;
        details.location = createdStartup.location;
      }
    } else if (completedPaths.includes("Mentor")) {
      role = "mentor";
    } else if (completedPaths.includes("Institutional Investor")) {
      role = "investor";
      investorContext = { type: "organization", organizationId: "org_apex_vc" };
    } else if (completedPaths.includes("Individual Investor")) {
      role = "investor";
      investorContext = { type: "individual" };
    } else if (completedPaths.includes("ESP Applicant")) {
      role = "esp";
    }

    const { redirectUrl } = completeOnboardingAndHandoff(role, details, investorContext);
    window.location.href = redirectUrl;
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between">
        <BrandLogo size={42} showWordmark={true} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button
            type="button"
            onClick={handleGoToFeed}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-inter font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors shadow-sm"
          >
            <span>Go to Feed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-medium text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-[#E3E5E3]/40 dark:hover:bg-[#262928] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto my-8">
        {/* Progress Indicator: Step 04 or Step 05 */}
        <div className="mb-6">
          <ProgressIndicator currentStep={isPathSelected && completedPaths.length > 0 ? 5 : 4} />
        </div>

        {/* Content Box */}
        {isPathSelected && completedPaths.length > 0 ? (
          /* Step 5: Launch View */
          <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-10 lg:p-12 rounded-2xl border border-[#CDD1CE] dark:border-[#262928] shadow-xentro-card transition-colors animate-fade-slide">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9FF3F]/15 text-xs font-inter font-semibold text-[#101212] dark:text-[#D9FF3F] mb-3">
                <Rocket className="w-3.5 h-3.5" />
                <span>Step 5 • Launch</span>
              </span>
              <h1 className="font-manrope font-bold text-2xl sm:text-3xl lg:text-4xl text-[#101212] dark:text-white mb-3">
                You're ready to launch Xentro Hub
              </h1>
              <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Your account details, verified email, personal profile, and participation path are confirmed and persisted to the ecosystem.
              </p>
            </div>

            {/* Profile & Role Summary Card */}
            <div className="max-w-2xl mx-auto bg-[#F7F8F6] dark:bg-[#0D0F0F] rounded-2xl border border-[#E3E5E3] dark:border-[#262928] p-6 sm:p-7 mb-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-[#D9FF3F] bg-gray-100 dark:bg-gray-800 flex-shrink-0 flex items-center justify-center">
                  {personalProfile?.photoUrl ? (
                    <img
                      src={personalProfile.photoUrl}
                      alt={user?.fullName || "User avatar"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold font-manrope text-[#101212] dark:text-white">
                      {(user?.fullName || "U").charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center text-[10px] font-black border-2 border-white dark:border-[#0D0F0F]">
                    ✓
                  </span>
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h2 className="text-lg font-bold font-manrope text-[#101212] dark:text-white truncate">
                        {user?.fullName || "Verified User"}
                      </h2>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] truncate">
                        {user?.email} • <span className="text-emerald-500 font-semibold">Verified</span>
                      </p>
                    </div>

                    <div className="flex sm:justify-end">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-inter font-bold bg-[#D9FF3F] text-[#101212] shadow-2xs">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{completedPaths[0] || "Explorer"}</span>
                      </span>
                    </div>
                  </div>

                  {personalProfile?.headline && (
                    <p className="text-xs font-inter text-[#101212] dark:text-white/90 font-medium mt-2">
                      {personalProfile.headline}
                    </p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#E3E5E3] dark:border-[#262928] text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                    {personalProfile?.currentRole && (
                      <div>
                        <span className="font-semibold text-[#101212] dark:text-white">Role: </span>
                        {personalProfile.currentRole}
                      </div>
                    )}
                    {personalProfile?.currentOrganization && (
                      <div>
                        <span className="font-semibold text-[#101212] dark:text-white">Org: </span>
                        {personalProfile.currentOrganization}
                      </div>
                    )}
                    {personalProfile?.location && (
                      <div>
                        <span className="font-semibold text-[#101212] dark:text-white">Location: </span>
                        {personalProfile.location}
                      </div>
                    )}
                    {user?.id && (
                      <div>
                        <span className="font-semibold text-[#101212] dark:text-white">ID: </span>
                        {user.id}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Launch Action Buttons */}
            <div className="pt-6 border-t border-[#E3E5E3] dark:border-[#262928] flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.removeItem("xentro_selected_path_step4");
                  }
                  setIsPathSelected(false);
                  setCompletedPaths([]);
                  router.push("/onboarding?step=4");
                }}
                className="text-xs font-inter font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                ← Change Participation Path (Back to Step 4)
              </button>

              <button
                type="button"
                onClick={handleLaunchHub}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] shadow-sm transition-all cursor-pointer group"
              >
                <span>Launch XENTRO Hub</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 4: Choose Path View */
          <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-10 lg:p-12 rounded-2xl border border-[#CDD1CE] dark:border-[#262928] shadow-xentro-card transition-colors animate-fade-slide">
            {/* Header */}
            <div className="text-center max-w-2xl mx-auto mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9FF3F]/15 text-xs font-inter font-semibold text-[#101212] dark:text-[#D9FF3F] mb-3">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Step 4 • Choose Your Path</span>
              </span>
              <h1 className="font-manrope font-bold text-2xl sm:text-3xl lg:text-4xl text-[#101212] dark:text-white mb-3">
                What would you like to do on Xentro?
              </h1>
              <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Select your primary participation path. Because your verified <strong>Personal Account</strong> is established, you can add further entities, advisory roles, or institutional ties at any time.
              </p>
            </div>

            {/* 5 Participation Path Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {PARTICIPATION_PATHS.map((path) => {
                const Icon = path.icon;
                return (
                  <button
                    key={path.id}
                    type="button"
                    onClick={() => setActiveModal(path.id)}
                    className="text-left p-6 rounded-2xl border transition-all duration-200 flex flex-col justify-between group hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#D9FF3F] border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] hover:border-[#D9FF3F]"
                  >
                    <div>
                      {/* Top Row: Icon + Type Badge */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center group-hover:bg-[#D9FF3F] group-hover:text-[#101212] transition-colors">
                          <Icon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="text-[10px] font-inter font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#565B59] dark:text-[#B6B8B7] border border-[#E3E5E3] dark:border-[#262928]">
                          {path.typeBadge}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="font-manrope font-bold text-lg text-[#101212] dark:text-white mb-1.5 group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F] transition-colors">
                        {path.title}
                      </h3>

                      {/* Description */}
                      <p className="font-inter text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed mb-4">
                        {path.description}
                      </p>
                    </div>

                    {/* Bottom Action Pill */}
                    <div className="flex items-center gap-1 text-xs font-inter font-bold text-[#101212] dark:text-[#D9FF3F] pt-3 border-t border-[#E3E5E3] dark:border-[#262928]">
                      <span>Select Path</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Row */}
            <div className="pt-6 border-t border-[#E3E5E3] dark:border-[#262928] flex flex-col sm:flex-row items-center justify-between gap-4">
              <Link
                href="/onboarding/profile"
                className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white"
              >
                &larr; Back to Step 03: Personal Profile
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: CREATE A STARTUP ENTITY
          ========================================================================= */}
      {activeModal === "startup" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181B1A] p-6 sm:p-8 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center">
                <Rocket className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-manrope font-bold text-xl text-[#101212] dark:text-white">
                  Create a Startup Entity
                </h2>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                  Maintains separation between your Personal Account and Startup Entity.
                </p>
              </div>
            </div>

            {createdStartup ? (
              <div className="py-6 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-[#D9FF3F] mx-auto mb-3" />
                <h3 className="font-manrope font-bold text-lg text-[#101212] dark:text-white mb-1">
                  {createdStartup.startupName} Registered!
                </h3>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] mb-6">
                  Startup Entity created. Creator assigned as <strong>Founder / Owner</strong>.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => handleLaunchHubWithRole("startup")}
                    className="px-6 py-2.5 rounded-xl text-xs font-inter font-semibold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <span>Launch XENTRO Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateStartupSubmit} className="space-y-4">
                {/* 1. Duplicate Check */}
                <div className="space-y-1.5">
                  <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                    Startup / Company Name &bull; Duplicate Check
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={startupName}
                      onChange={(e) => {
                        setStartupName(e.target.value);
                        setIsDuplicateChecked(false);
                      }}
                      placeholder="e.g. Acme Quantum AI"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
                      required
                    />
                    <button
                      type="button"
                      onClick={handleCheckStartupDuplicate}
                      disabled={isDuplicateChecking || !startupName.trim()}
                      className="px-4 py-2.5 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928] text-xs font-inter font-semibold text-[#101212] dark:text-white hover:border-[#D9FF3F] disabled:opacity-50"
                    >
                      {isDuplicateChecking ? "Checking..." : "Check Name"}
                    </button>
                  </div>
                  {isDuplicateChecked && (
                    <p
                      className={cn(
                        "text-xs font-inter",
                        isDuplicateNameAvailable ? "text-emerald-500" : "text-red-500"
                      )}
                    >
                      {isDuplicateNameAvailable
                        ? "✓ Name is available across the Xentro registry."
                        : "✗ Name already taken by another registered entity. Choose a variation."}
                    </p>
                  )}
                </div>

                {/* 2. Registration Type & Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-inter font-semibold text-[#101212] dark:text-white">
                      Registration Type
                    </label>
                    <select
                      value={startupRegType}
                      onChange={(e) => setStartupRegType(e.target.value as any)}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D9FF3F]"
                    >
                      <option value="Pvt Ltd">Pvt Ltd</option>
                      <option value="LLP">LLP</option>
                      <option value="MSME">MSME</option>
                      <option value="OPC">OPC</option>
                      <option value="GST">GST</option>
                      <option value="Other">Other / Unregistered</option>
                    </select>
                  </div>

                  <AuthInput
                    id="startupRegNo"
                    label="Registration Number (CIN/LLPIN/Udyam)"
                    placeholder="e.g. U72900KA2024PTC123456"
                    value={startupRegNo}
                    onChange={(e) => setStartupRegNo(e.target.value)}
                  />
                </div>

                {/* 3. Stage & Industry */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-inter font-semibold text-[#101212] dark:text-white">
                      Startup Stage
                    </label>
                    <select
                      value={startupStage}
                      onChange={(e) => setStartupStage(e.target.value as any)}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D9FF3F]"
                    >
                      <option value="Idea">Idea</option>
                      <option value="Prototype">Prototype</option>
                      <option value="Early Traction">Early Traction</option>
                      <option value="Scaling">Scaling</option>
                      <option value="Growth">Growth</option>
                    </select>
                  </div>

                  <AuthInput
                    id="startupIndustry"
                    label="Industry / Domain"
                    placeholder="e.g. Deeptech, Fintech"
                    value={startupIndustry}
                    onChange={(e) => setStartupIndustry(e.target.value)}
                  />
                </div>

                {/* 4. Separate Startup Official Email */}
                <div className="space-y-1.5 p-3 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928]">
                  <label className="text-xs font-inter font-semibold text-[#101212] dark:text-white block">
                    Separate Startup Official Email <span className="text-red-500">*</span>
                  </label>
                  <p className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7]">
                    Must be distinct from personal email for entity communications (e.g. founders@acme.ai).
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={startupOfficialEmail}
                      onChange={(e) => {
                        setStartupOfficialEmail(e.target.value);
                        setIsStartupEmailVerified(false);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white"
                      placeholder="founders@company.com"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setIsStartupEmailVerified(true)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-inter font-semibold transition-colors",
                        isStartupEmailVerified
                          ? "bg-emerald-500 text-white"
                          : "bg-[#D9FF3F] text-[#101212]"
                      )}
                    >
                      {isStartupEmailVerified ? "✓ Verified" : "Verify Email"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingStartup || !startupName.trim()}
                  className="w-full py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] disabled:opacity-50"
                >
                  {isCreatingStartup ? "Creating Entity..." : "Create Startup Entity →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: BECOME A MENTOR (PERSONAL ROLE)
          ========================================================================= */}
      {activeModal === "mentor" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181B1A] p-6 sm:p-8 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center">
                <Compass className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-manrope font-bold text-xl text-[#101212] dark:text-white">
                  Activate Mentor Personal Role
                </h2>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                  Mentor is a <strong>Personal Role</strong>. Identity verification is already complete and not repeated.
                </p>
              </div>
            </div>

            {completedPaths.includes("Mentor") ? (
              <div className="py-6 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-[#D9FF3F] mx-auto mb-3" />
                <h3 className="font-manrope font-bold text-lg text-[#101212] dark:text-white mb-1">
                  Mentor Role Active!
                </h3>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] mb-6">
                  You are now accredited to review founder applications, host office hours, and guide ventures.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => handleLaunchHubWithRole("mentor")}
                    className="px-6 py-2.5 rounded-xl text-xs font-inter font-semibold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <span>Launch XENTRO Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2.5 rounded-xl text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleActivateMentor} className="space-y-4">
                <AuthInput
                  id="mentorRole"
                  label="Professional Role"
                  placeholder="e.g. Chief Product Officer, Venture Partner"
                  value={mentorRole}
                  onChange={(e) => setMentorRole(e.target.value)}
                  required
                />

                <AuthInput
                  id="mentorOrg"
                  label="Organization / Company"
                  placeholder="e.g. Sequoia, Google, Stripe"
                  value={mentorOrg}
                  onChange={(e) => setMentorOrg(e.target.value)}
                  required
                />

                <AuthInput
                  id="mentorExp"
                  label="Years of Experience"
                  placeholder="e.g. 12+ years"
                  value={mentorExp}
                  onChange={(e) => setMentorExp(e.target.value)}
                  required
                />

                <div className="space-y-1">
                  <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                    Mentorship Focus Areas
                  </label>
                  <textarea
                    rows={2}
                    value={mentorAreas}
                    onChange={(e) => setMentorAreas(e.target.value)}
                    placeholder="e.g. Seed Fundraising, GTM Strategy, Technical Architecture"
                    className="w-full p-3 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#D9FF3F]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928] text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                  Identity status: <strong className="text-emerald-500">Identity Verified ✓</strong> (No duplicate Aadhaar submission required)
                </div>

                <button
                  type="submit"
                  disabled={isActivatingMentor}
                  className="w-full py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12]"
                >
                  {isActivatingMentor ? "Activating Role..." : "Activate Mentor Role →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: BECOME AN INVESTOR (INDIVIDUAL VS ORG)
          ========================================================================= */}
      {activeModal === "investor" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181B1A] p-6 sm:p-8 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setActiveModal(null);
                setInvestorMode("choose");
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center">
                <TrendingUp className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-manrope font-bold text-xl text-[#101212] dark:text-white">
                  How will you invest?
                </h2>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                  Choose between a Personal Role or an Entity Account.
                </p>
              </div>
            </div>

            {investorMode === "choose" ? (
              <div className="space-y-4 py-2">
                <button
                  type="button"
                  onClick={() => {
                    handleActivateIndividualInvestor();
                    setInvestorMode("individual");
                  }}
                  className="w-full text-left p-5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] hover:border-[#D9FF3F] bg-[#F7F8F6] dark:bg-[#0D0F0F] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-manrope font-bold text-base text-[#101212] dark:text-white group-hover:text-[#D9FF3F] transition-colors">
                      Individual Investor (Angel)
                    </span>
                    <span className="text-[10px] font-inter font-bold px-2 py-0.5 rounded bg-[#D9FF3F] text-[#101212]">
                      Personal Role
                    </span>
                  </div>
                  <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                    Invest your own capital directly. Uses your existing Personal Account with zero duplicate account creation.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setInvestorMode("org")}
                  className="w-full text-left p-5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] hover:border-[#D9FF3F] bg-[#F7F8F6] dark:bg-[#0D0F0F] transition-all group"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-manrope font-bold text-base text-[#101212] dark:text-white group-hover:text-[#D9FF3F] transition-colors">
                      Investor Organization (VC / Syndicate / Family Office)
                    </span>
                    <span className="text-[10px] font-inter font-bold px-2 py-0.5 rounded bg-white dark:bg-[#181B1A] border border-[#262928] text-white">
                      Entity Account
                    </span>
                  </div>
                  <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                    Invest on behalf of a fund, firm, or syndicate. Search existing org or create a new Investor Entity with official domain email.
                  </p>
                </button>
              </div>
            ) : investorMode === "individual" ? (
              <div className="py-6 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-[#D9FF3F] mx-auto mb-3" />
                <h3 className="font-manrope font-bold text-lg text-[#101212] dark:text-white mb-1">
                  Individual Investor Role Active!
                </h3>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] mb-6">
                  Your Personal Account now has direct Angel dealflow and syndication access.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => handleLaunchHubWithRole("investor", { type: "individual" })}
                    className="px-6 py-2.5 rounded-xl text-xs font-inter font-semibold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <span>Launch XENTRO Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      setInvestorMode("choose");
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : investorMode === "org_success" ? (
              <div className="py-6 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-12 h-12 text-[#D9FF3F] mx-auto mb-3" />
                <h3 className="font-manrope font-bold text-lg text-[#101212] dark:text-white mb-1">
                  Investor Organization Registered!
                </h3>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] mb-6">
                  {investorOrgName || investorOrgSearch || "Apex Ventures"} organization profile created with Institutional VC permissions.
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() =>
                      handleLaunchHubWithRole("investor", {
                        type: "organization",
                        organizationId: "org_apex_vc",
                      })
                    }
                    className="px-6 py-2.5 rounded-xl text-xs font-inter font-semibold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <span>Launch XENTRO Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveModal(null);
                      setInvestorMode("choose");
                    }}
                    className="px-4 py-2.5 rounded-xl text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              /* Org Flow: Search or Create */
              <form onSubmit={handleRegisterInvestorOrg} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                    Search Existing Investor Organization
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={investorOrgSearch}
                      onChange={(e) => setInvestorOrgSearch(e.target.value)}
                      placeholder="e.g. Nexus Venture Partners, Peak XV"
                      className="flex-1 px-3 py-2 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={handleSearchInvestorOrg}
                      className="px-3.5 py-2 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928] text-xs font-inter font-semibold"
                    >
                      Search
                    </button>
                  </div>
                  {investorOrgFound !== null && (
                    <p className="text-xs font-inter text-emerald-500">
                      {investorOrgFound
                        ? "✓ Organization found. You can submit a membership request."
                        : "Organization not found. You can create a new Investor Entity below."}
                    </p>
                  )}
                </div>

                <AuthInput
                  id="investorOrgName"
                  label="Organization Name"
                  placeholder="Firm / Fund Name"
                  value={investorOrgName || investorOrgSearch}
                  onChange={(e) => setInvestorOrgName(e.target.value)}
                  required
                />

                <AuthInput
                  id="investorOrgEmail"
                  label="Official Organization Email"
                  placeholder="investments@company.com"
                  value={investorOrgOfficialEmail}
                  onChange={(e) => setInvestorOrgOfficialEmail(e.target.value)}
                  required
                />

                <AuthInput
                  id="investorOrgRole"
                  label="Your Role at Firm"
                  placeholder="e.g. Managing Partner, Principal"
                  value={investorOrgRole}
                  onChange={(e) => setInvestorOrgRole(e.target.value)}
                  required
                />

                <button
                  type="submit"
                  disabled={isProcessingInvestor}
                  className="w-full py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12]"
                >
                  {isProcessingInvestor ? "Processing..." : "Register / Request Entity Membership →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: REQUEST AN INSTITUTION / ESP ACCOUNT
          ========================================================================= */}
      {activeModal === "esp" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white dark:bg-[#181B1A] p-6 sm:p-8 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center">
                <Building2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-manrope font-bold text-xl text-[#101212] dark:text-white">
                  Request an Institution / ESP Account
                </h2>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                  ESP entities are submitted for Xentro Admin Review &amp; authorization verification.
                </p>
              </div>
            </div>

            {espSubmittedRequest ? (
              <div className="py-6 text-center animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-7 h-7 stroke-[2.5]" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 mb-2">
                  <span>PENDING ADMIN APPROVAL</span>
                </div>
                <h3 className="font-manrope font-bold text-lg text-[#101212] dark:text-white mb-1">
                  Institution Application Under Review
                </h3>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto mb-6 leading-relaxed">
                  Your registration request for <strong>{espSubmittedRequest.institutionName}</strong> has been forwarded to Xentro Platform Administration. Once verified and approved, an activation email will be sent from <span className="font-mono text-emerald-500">no-reply@xentro.in</span> with sign-in instructions.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        localStorage.removeItem("xentro_onboarding_complete");
                        localStorage.removeItem("xentro_user_profile");
                      } catch (_) {}
                      window.location.href = "/signin";
                    }}
                    className="px-6 py-2.5 rounded-xl text-xs font-inter font-semibold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] shadow-sm transition-all"
                  >
                    Return to Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLaunchHubWithRole("explorer")}
                    className="px-4 py-2.5 rounded-xl text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white border border-[#E3E5E3] dark:border-[#262928]"
                  >
                    Explore Ecosystem as Guest
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitEsp} className="space-y-4">
                <AuthInput
                  id="espInstName"
                  label="Institution / Organization Name"
                  placeholder="e.g. Centre for Innovation, IIT Bombay"
                  value={espInstName}
                  onChange={(e) => setEspInstName(e.target.value)}
                  required
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-inter font-semibold text-[#101212] dark:text-white">
                      Organization Type
                    </label>
                    <select
                      value={espOrgType}
                      onChange={(e) => setEspOrgType(e.target.value)}
                      className="w-full py-2.5 px-3 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white"
                    >
                      {ESP_ORG_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  <AuthInput
                    id="espWebsite"
                    label="Official Website"
                    placeholder="https://incubator.edu"
                    value={espWebsite}
                    onChange={(e) => setEspWebsite(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <AuthInput
                    id="espOfficialEmail"
                    label="Official Institution Email"
                    placeholder="contact@institution.edu"
                    value={espOfficialEmail}
                    onChange={(e) => setEspOfficialEmail(e.target.value)}
                    required
                  />

                  <AuthInput
                    id="espPhone"
                    label="Contact Number"
                    placeholder="+91 80 2345 6789"
                    value={espPhone}
                    onChange={(e) => setEspPhone(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <AuthInput
                    id="espCity"
                    label="City"
                    placeholder="Bengaluru"
                    value={espCity}
                    onChange={(e) => setEspCity(e.target.value)}
                  />
                  <AuthInput
                    id="espState"
                    label="State"
                    placeholder="Karnataka"
                    value={espState}
                    onChange={(e) => setEspState(e.target.value)}
                  />
                  <AuthInput
                    id="espCountry"
                    label="Country"
                    placeholder="India"
                    value={espCountry}
                    onChange={(e) => setEspCountry(e.target.value)}
                  />
                </div>

                {/* Applicant Representation */}
                <div className="pt-2 border-t border-[#E3E5E3] dark:border-[#262928] space-y-3">
                  <span className="text-xs font-inter font-bold text-[#101212] dark:text-white uppercase tracking-wider block">
                    Applicant Authorization
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AuthInput
                      id="espDesignation"
                      label="Your Designation"
                      placeholder="e.g. Incubation Director"
                      value={espDesignation}
                      onChange={(e) => setEspDesignation(e.target.value)}
                      required
                    />

                    <AuthInput
                      id="espDept"
                      label="Department"
                      placeholder="e.g. Office of Innovation"
                      value={espDept}
                      onChange={(e) => setEspDept(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-inter font-semibold text-[#101212] dark:text-white block mb-1.5">
                      Are you authorized to represent this institution on Xentro? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-inter">
                        <input
                          type="radio"
                          name="authorized"
                          value="yes"
                          checked={espAuthorized === "yes"}
                          onChange={() => setEspAuthorized("yes")}
                          className="accent-[#D9FF3F]"
                        />
                        <span>Yes, I am authorized</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs font-inter">
                        <input
                          type="radio"
                          name="authorized"
                          value="no"
                          checked={espAuthorized === "no"}
                          onChange={() => setEspAuthorized("no")}
                          className="accent-[#D9FF3F]"
                        />
                        <span>No, applying on behalf</span>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingEsp || !espInstName.trim()}
                  className="w-full py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12]"
                >
                  {isSubmittingEsp ? "Submitting for Review..." : "Submit Institution Request →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: EXPLORER
          ========================================================================= */}
      {activeModal === "explorer" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#181B1A] p-6 sm:p-8 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-2xl">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] text-[#101212] flex items-center justify-center">
                <Globe2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <h2 className="font-manrope font-bold text-xl text-[#101212] dark:text-white">
                  Explore the Ecosystem
                </h2>
                <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7]">
                  Instant access on your existing Personal Account.
                </p>
              </div>
            </div>

            <p className="text-xs font-inter text-[#565B59] dark:text-[#B6B8B7] mb-4">
              As an Explorer, you can immediately access:
            </p>

            <ul className="space-y-2 mb-6 text-xs font-inter text-[#101212] dark:text-white">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
                <span>Discover verified startups, mentors, investors, and ESPs</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
                <span>Browse and apply to ecosystem grants, hackathons &amp; opportunities</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
                <span>Follow participants, connect with operators, and attend events</span>
              </li>
            </ul>

            <button
              type="button"
              onClick={() => {
                handleActivateExplorer();
                setActiveModal(null);
              }}
              className="w-full py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12]"
            >
              Activate Explorer Access &rarr;
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-4xl mx-auto text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
        XENTRO &bull; CONNECT PEOPLE. CREATE OPPORTUNITY.
      </footer>
    </main>
  );
}
