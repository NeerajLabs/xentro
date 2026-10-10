"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { AuthInput } from "@/components/auth/AuthInput";
import { authService } from "@/lib/auth/authService";
import { User, PersonalProfile, EducationRecord, StructuredLocation } from "@/lib/auth/types";
import { INDIAN_CITIES } from "@/data/indianCities";
import {
  UserCircle2,
  Camera,
  Briefcase,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Edit3,
  Loader2,
  CheckCircle2,
  MapPin,
  Building2,
  Rocket,
  AlertCircle,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS = [
  "Student",
  "Working Professional",
  "Aspiring Entrepreneur",
  "Researcher",
  "Freelancer",
  "Other",
];

const ECOSYSTEM_GOALS_LIST = [
  "Networking",
  "Mentorship",
  "Learning",
  "Startup Opportunities",
  "Collaboration",
];

const DEFAULT_SKILLS = [
  "Product Strategy",
  "Go-To-Market",
  "Engineering Leadership",
  "Fundraising",
  "UX & Design",
  "Machine Learning",
];

const DEFAULT_INDUSTRIES = [
  "Artificial Intelligence",
  "Fintech",
  "Enterprise SaaS",
  "Deeptech",
  "Healthtech",
  "Climate & Cleantech",
  "EdTech",
  "Web3",
];

export default function PersonalProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Profile fields
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");

  // Location (Method A & B)
  const [locationMode, setLocationMode] = useState<"select" | "manual">("select");
  const [selectedCity, setSelectedCity] = useState("");
  const [citySearchQuery, setCitySearchQuery] = useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [manualCity, setManualCity] = useState("");
  const [manualState, setManualState] = useState("");
  const [manualCountry, setManualCountry] = useState("India");

  // Current Professional Role & Organization
  const [currentRole, setCurrentRole] = useState("Student");
  const [currentOrganization, setCurrentOrganization] = useState("");
  const [isOrgNotApplicable, setIsOrgNotApplicable] = useState(false);

  // Multiple Education Records
  const [educationList, setEducationList] = useState<EducationRecord[]>([]);
  const [isAddingEducation, setIsAddingEducation] = useState(false);
  const [editingEducationIndex, setEditingEducationIndex] = useState<number | null>(null);
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDegree, setEduDegree] = useState("");
  const [eduFieldOfStudy, setEduFieldOfStudy] = useState("");
  const [eduStartYear, setEduStartYear] = useState("");
  const [eduEndYear, setEduEndYear] = useState("");
  const [eduCurrentlyStudying, setEduCurrentlyStudying] = useState(false);
  const [eduError, setEduError] = useState("");

  // Optional fields
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState<string[]>(DEFAULT_SKILLS.slice(0, 3));
  const [skillInput, setSkillInput] = useState("");
  const [industries, setIndustries] = useState<string[]>(DEFAULT_INDUSTRIES.slice(0, 3));
  const [ecosystemGoals, setEcosystemGoals] = useState<string[]>(["Networking", "Startup Opportunities"]);
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [otherLink, setOtherLink] = useState("");

  // Stages & Progress State
  const [saveStage, setSaveStage] = useState<"idle" | "saving" | "launch" | "error">("idle");
  const [savingStepIndex, setSavingStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const savingSteps = [
    "Validating Your Profile",
    "Saving Profile Information",
    "Finalizing Account Setup",
    "Preparing Your Explorer Dashboard",
  ];

  // Initialize and load user data
  useEffect(() => {
    let active = authService.getCurrentUser();
    if (!active && typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("xentro_current_user") || sessionStorage.getItem("xentro_current_user");
        if (raw) active = JSON.parse(raw);
      } catch (_) {}
    }

    if (active) {
      setUser(active);
      if (active.fullName) setFullName(active.fullName);
      if (active.avatar) setPhotoPreview(active.avatar);
    }

    // Attempt to load existing canonical profile
    authService.fetchUserProfileFromBackend().then((p) => {
      if (p) {
        if (p.fullName) setFullName(p.fullName);
        if (p.headline) setHeadline(p.headline);
        if (p.photoUrl) setPhotoPreview(p.photoUrl);
        if (p.currentRole) setCurrentRole(p.currentRole);
        if (p.currentOrganization) setCurrentOrganization(p.currentOrganization);
        if (p.bio) setBio(p.bio);
        if (p.skills?.length) setSkills(p.skills);
        if (p.industries?.length) setIndustries(p.industries);
        if (p.ecosystemGoals?.length) setEcosystemGoals(p.ecosystemGoals);
        if (p.linkedin) setLinkedin(p.linkedin);
        if (p.website) setWebsite(p.website);
        if (p.otherLinks?.length) setOtherLink(p.otherLinks[0]);

        const rawEdu: any = p.education;
        if (Array.isArray(rawEdu)) {
          setEducationList(rawEdu as EducationRecord[]);
        } else if (p.educationEntries?.length) {
          setEducationList(p.educationEntries);
        } else if (typeof rawEdu === "string" && rawEdu.trim()) {
          setEducationList([
            {
              institution: rawEdu.trim(),
              degree: "",
              fieldOfStudy: "",
              startYear: "",
              endYear: "",
              currentlyStudying: false,
            },
          ]);
        }

        if (p.structuredLocation?.city) {
          setSelectedCity(`${p.structuredLocation.city}, ${p.structuredLocation.state}`);
        } else if (p.location) {
          setSelectedCity(p.location);
        }
      }
    });
  }, []);

  // Filter Indian cities for Method A
  const filteredCities = INDIAN_CITIES.filter((c) =>
    `${c.city}, ${c.state}`.toLowerCase().includes(citySearchQuery.toLowerCase())
  ).slice(0, 10);

  // Photo select handler
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size exceeds 5MB limit. Please choose a smaller image.");
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload directly to media storage
      try {
        setIsUploadingPhoto(true);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data?.success && data?.url) {
          setPhotoPreview(data.url);
        }
      } catch (err) {
        console.warn("Upload fallback notice:", err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  // Education Add / Save handler
  const handleSaveEducationEntry = () => {
    if (!eduInstitution.trim()) {
      setEduError("Institution name is required.");
      return;
    }

    const newRecord: EducationRecord = {
      institution: eduInstitution.trim(),
      degree: eduDegree.trim(),
      fieldOfStudy: eduFieldOfStudy.trim(),
      startYear: eduStartYear.trim(),
      endYear: eduCurrentlyStudying ? "Present" : eduEndYear.trim(),
      currentlyStudying: eduCurrentlyStudying,
    };

    if (editingEducationIndex !== null) {
      const updated = [...educationList];
      updated[editingEducationIndex] = newRecord;
      setEducationList(updated);
    } else {
      setEducationList([...educationList, newRecord]);
    }

    // Reset form
    setEduInstitution("");
    setEduDegree("");
    setEduFieldOfStudy("");
    setEduStartYear("");
    setEduEndYear("");
    setEduCurrentlyStudying(false);
    setIsAddingEducation(false);
    setEditingEducationIndex(null);
    setEduError("");
  };

  const handleEditEducation = (index: number) => {
    const rec = educationList[index];
    setEduInstitution(rec.institution);
    setEduDegree(rec.degree);
    setEduFieldOfStudy(rec.fieldOfStudy);
    setEduStartYear(rec.startYear);
    setEduEndYear(rec.endYear === "Present" ? "" : rec.endYear);
    setEduCurrentlyStudying(rec.currentlyStudying || rec.endYear === "Present");
    setEditingEducationIndex(index);
    setIsAddingEducation(true);
  };

  const handleDeleteEducation = (index: number) => {
    setEducationList(educationList.filter((_, i) => i !== index));
  };

  // Skills & Goals
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (s: string) => {
    setSkills(skills.filter((item) => item !== s));
  };

  const toggleGoal = (g: string) => {
    if (ecosystemGoals.includes(g)) {
      setEcosystemGoals(ecosystemGoals.filter((item) => item !== g));
    } else {
      setEcosystemGoals([...ecosystemGoals, g]);
    }
  };

  // Primary Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      alert("Please provide your full name.");
      return;
    }

    setSaveStage("saving");
    setSavingStepIndex(0);
    setErrorMessage("");

    try {
      // 1. Validating
      setSavingStepIndex(0);
      await new Promise((r) => setTimeout(r, 400));

      // Resolve final photo URL
      let finalPhotoUrl = photoPreview;
      if (photoFile && (!photoPreview || photoPreview.startsWith("data:") || photoPreview.startsWith("blob:"))) {
        try {
          const fd = new FormData();
          fd.append("file", photoFile);
          const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
          const uploadData = await uploadRes.json();
          if (uploadData?.success && uploadData?.url) {
            finalPhotoUrl = uploadData.url;
          }
        } catch (_) {}
      }

      // Resolve location
      let formattedLocation = "";
      let structuredLoc: StructuredLocation = {
        city: "",
        state: "",
        country: "India",
        isManual: false,
      };

      if (locationMode === "select") {
        formattedLocation = selectedCity;
        const [c, s] = selectedCity.split(",").map((x) => x.trim());
        structuredLoc = {
          city: c || selectedCity,
          state: s || "",
          country: "India",
          isManual: false,
        };
      } else {
        formattedLocation = `${manualCity.trim()}, ${manualState.trim()}, ${manualCountry.trim()}`.replace(/^[,\s]+|[,\s]+$/g, "");
        structuredLoc = {
          city: manualCity.trim(),
          state: manualState.trim(),
          country: manualCountry.trim() || "India",
          isManual: true,
        };
      }

      // 2. Saving Profile Information
      setSavingStepIndex(1);

      const profilePayload: PersonalProfile = {
        photoUrl: finalPhotoUrl || undefined,
        fullName: fullName.trim(),
        headline: headline.trim(),
        location: formattedLocation,
        structuredLocation: structuredLoc,
        currentRole: currentRole,
        currentOrganization: isOrgNotApplicable ? "N/A" : currentOrganization.trim(),
        education: educationList,
        educationEntries: educationList,
        bio: bio.trim(),
        professionalExperience: "",
        skills,
        areasOfExpertise: skills,
        industries,
        startupInterests: [],
        entrepreneurshipInterests: [],
        ecosystemGoals,
        linkedin: linkedin.trim(),
        website: website.trim(),
        otherLinks: otherLink.trim() ? [otherLink.trim()] : [],
      };

      // 3. Finalizing Account Setup (Durable MongoDB commit)
      setSavingStepIndex(2);
      await authService.savePersonalProfile(profilePayload);

      // 4. Preparing Explorer Dashboard
      setSavingStepIndex(3);
      await new Promise((r) => setTimeout(r, 600));

      // Successfully saved! Transition to Section 8: Final Launch Xentro Screen
      setSaveStage("launch");
    } catch (err: any) {
      console.error("Profile save error:", err);
      setErrorMessage(err?.message || "An unexpected error occurred while saving your profile. Please retry.");
      setSaveStage("error");
    }
  };

  const handleLaunchXentro = () => {
    // Complete onboarding and navigate to Explorer Dashboard
    authService.completeOnboarding("Explorer");
    router.push("/");
  };

  // Profile Saving Loading Screen (Section 7)
  if (saveStage === "saving") {
    return (
      <main className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white">
        <div className="w-full max-w-md p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E3E5E3] dark:border-[#262928] shadow-xentro-card text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>

          <h2 className="font-manrope font-bold text-2xl mb-2">Saving Your Explorer Profile</h2>
          <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] mb-8">
            Establishing your persistent personal identity across the Xentro network.
          </p>

          <div className="space-y-4 text-left">
            {savingSteps.map((stepName, idx) => {
              const isDone = idx < savingStepIndex;
              const isCurrent = idx === savingStepIndex;
              return (
                <div key={stepName} className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      isDone
                        ? "bg-[#D9FF3F] text-[#101212]"
                        : isCurrent
                        ? "border-2 border-[#D9FF3F] text-[#D9FF3F] animate-pulse"
                        : "border border-[#565B59] text-[#565B59]"
                    )}
                  >
                    {isDone ? "✓" : idx + 1}
                  </div>
                  <span
                    className={cn(
                      "text-xs font-inter transition-colors",
                      isDone
                        ? "text-[#101212] dark:text-white font-medium"
                        : isCurrent
                        ? "text-[#101212] dark:text-[#D9FF3F] font-semibold"
                        : "text-[#565B59] dark:text-[#7D8280]"
                    )}
                  >
                    {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // Error State with Retry
  if (saveStage === "error") {
    return (
      <main className="min-h-screen w-full flex flex-col justify-center items-center p-6 bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white">
        <div className="w-full max-w-md p-8 rounded-2xl bg-white dark:bg-[#181B1A] border border-red-500/30 shadow-xentro-card text-center">
          <div className="w-14 h-14 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="font-manrope font-bold text-xl mb-2">Save Interrupted</h2>
          <p className="font-inter text-xs text-[#565B59] dark:text-[#B6B8B7] mb-6">
            {errorMessage || "Unable to save your profile to the database. Your entered information is preserved."}
          </p>
          <button
            onClick={() => setSaveStage("idle")}
            className="w-full py-3 rounded-xl font-inter font-semibold text-xs bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors"
          >
            Review &amp; Retry
          </button>
        </div>
      </main>
    );
  }

  // Final "Launch Xentro" Screen (Section 8)
  if (saveStage === "launch") {
    const initials = (fullName || "User")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    return (
      <main className="min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white">
        <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
          <BrandLogo size={42} showWordmark={true} />
          <ThemeToggle />
        </header>

        <div className="w-full max-w-md mx-auto my-auto text-center py-8 animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-[#181B1A] p-8 sm:p-10 rounded-3xl border border-[#E3E5E3] dark:border-[#262928] shadow-xentro-card relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#D9FF3F] via-[#C7F020] to-[#9EBE12]" />

            {/* Avatar Preview */}
            <div className="relative w-24 h-24 mx-auto mb-5 rounded-full overflow-hidden border-4 border-[#D9FF3F] shadow-md bg-[#262928] flex items-center justify-center">
              {photoPreview ? (
                <img src={photoPreview} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                <span className="font-manrope font-bold text-2xl text-[#D9FF3F]">{initials}</span>
              )}
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9FF3F]/15 text-xs font-inter font-semibold text-[#101212] dark:text-[#D9FF3F] mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Explorer Profile Created</span>
            </div>

            <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-[#101212] dark:text-white mb-1.5">
              {fullName}
            </h1>

            {headline && (
              <p className="font-inter text-xs text-[#565B59] dark:text-[#B6B8B7] mb-2 px-4 line-clamp-2">
                {headline}
              </p>
            )}

            {(selectedCity || manualCity) && (
              <div className="flex items-center justify-center gap-1 text-[11px] font-inter text-[#565B59] dark:text-[#7D8280] mb-6">
                <MapPin className="w-3.5 h-3.5" />
                <span>{locationMode === "select" ? selectedCity : `${manualCity}, ${manualState}`}</span>
              </div>
            )}

            <p className="font-inter text-xs text-[#565B59] dark:text-[#B6B8B7] mb-8">
              Your default Explorer personal account is fully activated. You are ready to explore startups, connect with mentors, and join the ecosystem.
            </p>

            {/* Launch Xentro CTA Button */}
            <button
              onClick={handleLaunchXentro}
              className="w-full py-4 px-6 rounded-2xl font-manrope font-bold text-base bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:shadow-[#D9FF3F]/20 cursor-pointer"
            >
              <span>Launch Xentro</span>
              <Rocket className="w-5 h-5 fill-[#101212]" />
            </button>
          </div>
        </div>

        <footer className="w-full max-w-2xl mx-auto text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
          XENTRO &bull; CONNECT PEOPLE. CREATE OPPORTUNITY.
        </footer>
      </main>
    );
  }

  // Primary Step 3 Profile Form
  return (
    <main className="min-h-screen w-full flex flex-col justify-between p-6 sm:p-10 bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white transition-colors duration-200">
      {/* Top Header */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between">
        <BrandLogo size={42} showWordmark={true} />
        <ThemeToggle />
      </header>

      {/* Main Container */}
      <div className="w-full max-w-2xl mx-auto my-8">
        {/* Progress Indicator: Step 3 */}
        <div className="mb-6">
          <ProgressIndicator currentStep={3} />
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-10 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-xentro-card transition-colors">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9FF3F]/15 text-xs font-inter font-semibold text-[#101212] dark:text-[#D9FF3F] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 3 &bull; Profile Setup</span>
            </span>
            <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-[#101212] dark:text-white mb-2">
              Set up your Explorer Profile
            </h1>
            <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7]">
              Build your authentic identity on Xentro. This information powers your public profile and dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Profile Picture */}
            <div className="flex items-center gap-5 p-4 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928]">
              <div className="relative w-20 h-20 rounded-full overflow-hidden bg-[#E3E5E3] dark:bg-[#262928] flex items-center justify-center border-2 border-[#D9FF3F] shrink-0">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle2 className="w-12 h-12 text-[#565B59] dark:text-[#B6B8B7]" />
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-[#D9FF3F] animate-spin" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <label className="text-xs font-inter font-bold text-[#101212] dark:text-white block mb-1">
                  Profile Picture
                </label>
                <p className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7] mb-2.5">
                  Square JPG or PNG, maximum 5MB.
                </p>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-semibold bg-white dark:bg-[#181B1A] border border-[#E3E5E3] dark:border-[#262928] hover:border-[#D9FF3F] cursor-pointer transition-colors shadow-sm">
                  <Camera className="w-3.5 h-3.5 text-[#565B59] dark:text-[#D9FF3F]" />
                  <span>{photoPreview ? "Change Photo" : "Upload Photo"}</span>
                  <input type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
                </label>
              </div>
            </div>

            {/* 2. Full Name & Headline */}
            <div className="space-y-4">
              <AuthInput
                id="fullName"
                label="Full Name"
                placeholder="Enter full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                    Professional Headline
                  </label>
                  <span className="text-[11px] font-inter text-[#565B59] dark:text-[#7D8280]">
                    {headline.length}/160
                  </span>
                </div>
                <input
                  id="headline"
                  type="text"
                  maxLength={160}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. AI Researcher | Tech Founder | Final Year Student @ IIT"
                  className="w-full px-3.5 py-3 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
                />
              </div>
            </div>

            {/* 3. Location (Method A: Select City + Method B: Manual Entry) */}
            <div className="space-y-2 p-4 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-inter font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D9FF3F]" />
                  <span>Location</span>
                </label>
                <button
                  type="button"
                  onClick={() => setLocationMode(locationMode === "select" ? "manual" : "select")}
                  className="text-[11px] font-inter text-[#D9FF3F] hover:underline"
                >
                  {locationMode === "select" ? "Can't find your city? Enter manually" : "← Select from Indian Cities"}
                </button>
              </div>

              {locationMode === "select" ? (
                <div className="relative">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search Indian city (e.g. Bengaluru, Mumbai, Delhi)..."
                      value={citySearchQuery || selectedCity}
                      onChange={(e) => {
                        setCitySearchQuery(e.target.value);
                        setSelectedCity(e.target.value);
                        setIsCityDropdownOpen(true);
                      }}
                      onFocus={() => setIsCityDropdownOpen(true)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-3 text-[#565B59]" />
                  </div>

                  {isCityDropdownOpen && (
                    <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] shadow-lg">
                      {filteredCities.length > 0 ? (
                        filteredCities.map((item) => (
                          <button
                            key={`${item.city}-${item.state}`}
                            type="button"
                            onClick={() => {
                              setSelectedCity(`${item.city}, ${item.state}`);
                              setCitySearchQuery("");
                              setIsCityDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-xs font-inter hover:bg-[#D9FF3F]/15 dark:hover:bg-[#262928] text-[#101212] dark:text-white transition-colors"
                          >
                            <span className="font-semibold">{item.city}</span>,{" "}
                            <span className="text-[#565B59] dark:text-[#B6B8B7]">{item.state}</span>
                          </button>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-[#565B59] text-center">
                          No matching city found.{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setLocationMode("manual");
                              setIsCityDropdownOpen(false);
                            }}
                            className="text-[#D9FF3F] underline"
                          >
                            Switch to manual entry
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="City Name"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    className="p-2.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:ring-2 focus:ring-[#D9FF3F] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="State / Province"
                    value={manualState}
                    onChange={(e) => setManualState(e.target.value)}
                    className="p-2.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:ring-2 focus:ring-[#D9FF3F] focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={manualCountry}
                    onChange={(e) => setManualCountry(e.target.value)}
                    className="p-2.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:ring-2 focus:ring-[#D9FF3F] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* 4. Current Professional Role & Organization */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white block">
                  Current Professional Role
                </label>
                <select
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                  className="w-full px-3.5 py-3 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <span className="text-[10px] text-[#565B59] dark:text-[#7D8280] block">
                  Represents your professional identity. Explorer account permissions remain intact.
                </span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white block">
                  Current Organization / Affiliation
                </label>
                <input
                  type="text"
                  disabled={isOrgNotApplicable}
                  value={isOrgNotApplicable ? "Not Applicable" : currentOrganization}
                  onChange={(e) => setCurrentOrganization(e.target.value)}
                  placeholder="e.g. Microsoft / IIT Bombay / Stealth Venture"
                  className={cn(
                    "w-full px-3.5 py-3 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]",
                    isOrgNotApplicable && "opacity-60 cursor-not-allowed bg-neutral-100 dark:bg-neutral-800"
                  )}
                />
                <label className="inline-flex items-center gap-1.5 text-[11px] text-[#565B59] dark:text-[#B6B8B7] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={isOrgNotApplicable}
                    onChange={(e) => {
                      setIsOrgNotApplicable(e.target.checked);
                      if (e.target.checked) setCurrentOrganization("");
                    }}
                    className="accent-[#D9FF3F] rounded"
                  />
                  <span>Not applicable / Independent</span>
                </label>
              </div>
            </div>

            {/* 5. Multiple Education Records */}
            <div className="space-y-3 p-4 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928]">
              <div className="flex items-center justify-between">
                <label className="text-xs font-inter font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-[#D9FF3F]" />
                  <span>Education History</span>
                  {educationList.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[10px] font-bold text-[#101212] dark:text-[#D9FF3F]">
                      {educationList.length}
                    </span>
                  )}
                </label>
                {!isAddingEducation && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingEducationIndex(null);
                      setEduInstitution("");
                      setEduDegree("");
                      setEduFieldOfStudy("");
                      setEduStartYear("");
                      setEduEndYear("");
                      setEduCurrentlyStudying(false);
                      setIsAddingEducation(true);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30 hover:bg-[#D9FF3F]/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Education</span>
                  </button>
                )}
              </div>

              {/* Empty state prompt — shown when no entries added yet */}
              {educationList.length === 0 && !isAddingEducation && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingEducationIndex(null);
                    setEduInstitution("");
                    setEduDegree("");
                    setEduFieldOfStudy("");
                    setEduStartYear("");
                    setEduEndYear("");
                    setEduCurrentlyStudying(false);
                    setIsAddingEducation(true);
                  }}
                  className="w-full flex flex-col items-center justify-center gap-2 p-5 rounded-xl border-2 border-dashed border-[#CDD1CE] dark:border-[#262928] hover:border-[#D9FF3F] hover:bg-[#D9FF3F]/5 transition-all cursor-pointer group"
                >
                  <GraduationCap className="w-8 h-8 text-[#565B59] dark:text-[#565B59] group-hover:text-[#D9FF3F] transition-colors" />
                  <div className="text-center">
                    <p className="text-xs font-inter font-semibold text-[#565B59] dark:text-[#B6B8B7] group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F] transition-colors">
                      No education added yet
                    </p>
                    <p className="text-[11px] font-inter text-[#8E9290] mt-0.5">
                      Click to add your school, college, or university
                    </p>
                  </div>
                </button>
              )}

              {/* Education list cards */}
              {educationList.length > 0 && (
                <div className="space-y-2">
                  {educationList.map((rec, idx) => (
                    <div
                      key={idx}
                      className="flex items-start justify-between p-3 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E3E5E3] dark:border-[#262928]"
                    >
                      <div>
                        <div className="text-xs font-semibold text-[#101212] dark:text-white">
                          {rec.institution}
                        </div>
                        <div className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          {[rec.degree, rec.fieldOfStudy].filter(Boolean).join(" • ")}
                        </div>
                        <div className="text-[10px] text-[#7D8280]">
                          {[rec.startYear, rec.endYear || (rec.currentlyStudying ? "Present" : "")].filter(Boolean).join(" – ")}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleEditEducation(idx)}
                          className="p-1 text-[#565B59] hover:text-[#D9FF3F] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEducation(idx)}
                          className="p-1 text-[#565B59] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add / Edit Education Form Modal / Expanded Box */}
              {isAddingEducation && (
                <div className="p-4 rounded-xl bg-white dark:bg-[#181B1A] border-2 border-[#D9FF3F]/40 space-y-3">
                  <div className="text-xs font-bold text-[#101212] dark:text-white">
                    {editingEducationIndex !== null ? "Edit Education Entry" : "Add Education Entry"}
                  </div>

                  {eduError && <div className="text-xs text-red-500">{eduError}</div>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Institution / University Name *"
                      value={eduInstitution}
                      onChange={(e) => setEduInstitution(e.target.value)}
                      className="p-2.5 rounded-lg border border-[#E3E5E3] dark:border-[#262928] bg-[#F7F8F6] dark:bg-[#0D0F0F] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-1 focus:ring-[#D9FF3F]"
                    />
                    <input
                      type="text"
                      placeholder="Degree / Qualification (e.g. B.Tech, MBA)"
                      value={eduDegree}
                      onChange={(e) => setEduDegree(e.target.value)}
                      className="p-2.5 rounded-lg border border-[#E3E5E3] dark:border-[#262928] bg-[#F7F8F6] dark:bg-[#0D0F0F] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-1 focus:ring-[#D9FF3F]"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Field of Study (e.g. Computer Science, Economics)"
                    value={eduFieldOfStudy}
                    onChange={(e) => setEduFieldOfStudy(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[#E3E5E3] dark:border-[#262928] bg-[#F7F8F6] dark:bg-[#0D0F0F] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-1 focus:ring-[#D9FF3F]"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Start Year (e.g. 2020)"
                      value={eduStartYear}
                      onChange={(e) => setEduStartYear(e.target.value)}
                      className="p-2.5 rounded-lg border border-[#E3E5E3] dark:border-[#262928] bg-[#F7F8F6] dark:bg-[#0D0F0F] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59]"
                    />
                    <input
                      type="text"
                      disabled={eduCurrentlyStudying}
                      placeholder={eduCurrentlyStudying ? "Present" : "End Year (e.g. 2024)"}
                      value={eduCurrentlyStudying ? "" : eduEndYear}
                      onChange={(e) => setEduEndYear(e.target.value)}
                      className="p-2.5 rounded-lg border border-[#E3E5E3] dark:border-[#262928] bg-[#F7F8F6] dark:bg-[#0D0F0F] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] disabled:opacity-50"
                    />
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-xs text-[#565B59] dark:text-[#B6B8B7] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={eduCurrentlyStudying}
                      onChange={(e) => setEduCurrentlyStudying(e.target.checked)}
                      className="accent-[#D9FF3F] rounded"
                    />
                    <span>Currently studying here</span>
                  </label>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingEducation(false);
                        setEditingEducationIndex(null);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-[#101212] dark:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveEducationEntry}
                      className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020]"
                    >
                      {editingEducationIndex !== null ? "Update" : "Add"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 6. Short Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                About / Short Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Share a brief introduction of your journey, focus, and what drives you."
                className="w-full p-3.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-2 focus:ring-[#D9FF3F] resize-none"
              />
            </div>

            {/* 7. Skills & Areas of Expertise */}
            <div className="space-y-2">
              <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                Skills &amp; Expertise
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-inter font-semibold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/30"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill (e.g. AI, React, FinTech)..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                  className="flex-1 p-2.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-[#101212] dark:text-white hover:bg-[#D9FF3F] hover:text-[#101212] transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* 8. Ecosystem Goals */}
            <div className="space-y-2">
              <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                Ecosystem Goals
              </label>
              <p className="text-[11px] text-[#565B59] dark:text-[#7D8280]">
                Select what you want to achieve on Xentro:
              </p>
              <div className="flex flex-wrap gap-2">
                {ECOSYSTEM_GOALS_LIST.map((goal) => {
                  const isSelected = ecosystemGoals.includes(goal);
                  return (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => toggleGoal(goal)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-xs font-inter font-semibold transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#D9FF3F] text-[#101212] shadow-sm"
                          : "bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] border border-[#E3E5E3] dark:border-[#262928] hover:border-[#D9FF3F]"
                      )}
                    >
                      {goal}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 9. Public Links */}
            <div className="space-y-3 pt-2 border-t border-[#E3E5E3] dark:border-[#262928]">
              <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white block">
                Public Links &amp; Profiles
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AuthInput
                  id="linkedin"
                  label="LinkedIn"
                  placeholder="https://linkedin.com/in/..."
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                />
                <AuthInput
                  id="website"
                  label="Website / Portfolio"
                  placeholder="https://yourname.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
                <AuthInput
                  id="otherLink"
                  label="Other Link (X / Github)"
                  placeholder="https://..."
                  value={otherLink}
                  onChange={(e) => setOtherLink(e.target.value)}
                />
              </div>
            </div>

            {/* Submit CTA */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] shadow-sm transition-all cursor-pointer"
              >
                <span>Save &amp; Complete Setup</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-2xl mx-auto text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
        XENTRO &bull; CONNECT PEOPLE. CREATE OPPORTUNITY.
      </footer>
    </main>
  );
}
