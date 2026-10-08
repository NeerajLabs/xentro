"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ProgressIndicator } from "@/components/onboarding/ProgressIndicator";
import { AuthInput } from "@/components/auth/AuthInput";
import { authService } from "@/lib/auth/authService";
import { User, PersonalProfile } from "@/lib/auth/types";
import {
  UserCircle2,
  Camera,
  Briefcase,
  GraduationCap,
  Sparkles,
  Link2,
  Globe,
  ArrowRight,
  Plus,
  X,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const DEFAULT_SKILLS = [
  "Product Strategy",
  "Go-To-Market",
  "Engineering Leadership",
  "Fundraising",
  "UX & Design",
  "Machine Learning",
];

export default function PersonalProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // Form Fields
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [currentRole, setCurrentRole] = useState("");
  const [currentOrganization, setCurrentOrganization] = useState("");
  const [education, setEducation] = useState("");
  const [professionalExperience, setProfessionalExperience] = useState("");
  const [skills, setSkills] = useState<string[]>(DEFAULT_SKILLS.slice(0, 3));
  const [skillInput, setSkillInput] = useState("");
  const [industries, setIndustries] = useState<string[]>(DEFAULT_INDUSTRIES.slice(0, 3));
  const [startupInterests, setStartupInterests] = useState<string[]>([
    "Early Stage Pre-Seed",
    "Product-Market Fit",
  ]);
  const [interestInput, setInterestInput] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [website, setWebsite] = useState("");
  const [otherLink, setOtherLink] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const active = authService.getCurrentUser();
    if (!active) {
      router.push("/signup");
      return;
    }
    setUser(active);
    setFullName(active.fullName);

    const applyProfile = (p: Partial<PersonalProfile>) => {
      if (p.fullName) setFullName(p.fullName);
      if (p.headline) setHeadline(p.headline);
      if (p.location) setLocation(p.location);
      if (p.bio) setBio(p.bio);
      if (p.currentRole) setCurrentRole(p.currentRole);
      if (p.currentOrganization) setCurrentOrganization(p.currentOrganization);
      if (p.education) setEducation(p.education);
      if (p.professionalExperience) setProfessionalExperience(p.professionalExperience);
      if (p.skills?.length) setSkills(p.skills);
      if (p.industries?.length) setIndustries(p.industries);
      if (p.startupInterests?.length) setStartupInterests(p.startupInterests);
      if (p.linkedin) setLinkedin(p.linkedin);
      if (p.website) setWebsite(p.website);
      if (p.otherLinks?.length) setOtherLink(p.otherLinks[0]);
      if (p.photoUrl) setPhotoPreview(p.photoUrl);
    };

    const existing = authService.getPersonalProfile();
    if (existing) {
      applyProfile(existing);
    } else if (active && ((active as any).headline || (active as any).personalProfile)) {
      applyProfile({
        fullName: active.fullName,
        headline: (active as any).headline || (active as any).personalProfile?.headline || "",
        location: (active as any).location || (active as any).personalProfile?.location || "",
        bio: (active as any).bio || (active as any).personalProfile?.bio || "",
        currentRole: (active as any).currentRole || (active as any).personalProfile?.currentRole || "",
        currentOrganization: (active as any).currentOrganization || (active as any).organization || (active as any).personalProfile?.currentOrganization || "",
        education: (active as any).education || (active as any).personalProfile?.education || "",
        professionalExperience: (active as any).professionalExperience || (active as any).experienceSummary || (active as any).personalProfile?.professionalExperience || "",
        skills: (active as any).skills || (active as any).personalProfile?.skills || [],
        industries: (active as any).industries || (active as any).personalProfile?.industries || [],
        startupInterests: (active as any).startupInterests || (active as any).personalProfile?.startupInterests || [],
        linkedin: (active as any).linkedin || (active as any).personalProfile?.linkedin || "",
        website: (active as any).website || (active as any).personalProfile?.website || "",
        otherLinks: (active as any).otherLinks || ((active as any).otherLink ? [(active as any).otherLink] : []) || [],
      });
    }

    // Also fetch fresh from MongoDB to guarantee persistence across sign-out & refresh
    authService.fetchUserProfileFromBackend().then((serverProfile) => {
      if (serverProfile) {
        applyProfile(serverProfile);
      }
    });
  }, [router]);

  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
    }
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const toggleIndustry = (ind: string) => {
    if (industries.includes(ind)) {
      setIndustries(industries.filter((i) => i !== ind));
    } else {
      setIndustries([...industries, ind]);
    }
  };

  const handleAddInterest = () => {
    if (!interestInput.trim()) return;
    if (!startupInterests.includes(interestInput.trim())) {
      setStartupInterests([...startupInterests, interestInput.trim()]);
    }
    setInterestInput("");
  };

  const handleRemoveInterest = (item: string) => {
    setStartupInterests(startupInterests.filter((i) => i !== item));
  };

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      // Instant local preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        setPhotoPreview(ev.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Durably upload to MongoDB Atlas media_uploads collection
      try {
        setIsUploadingPhoto(true);
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data?.success && data?.url) {
          setPhotoPreview(data.url);
        }
      } catch (uploadErr) {
        console.warn("Profile photo upload warning:", uploadErr);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalPhotoUrl = photoPreview;
    if (photoFile && (!photoPreview || photoPreview.startsWith("data:") || photoPreview.startsWith("blob:"))) {
      try {
        const fd = new FormData();
        fd.append("file", photoFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (data?.success && data?.url) {
          finalPhotoUrl = data.url;
        }
      } catch (uploadErr) {
        console.warn("Upload error during submit:", uploadErr);
      }
    }

    const profileData: PersonalProfile = {
      photoUrl: finalPhotoUrl || undefined,
      fullName: fullName.trim() || user?.fullName || "Verified User",
      headline: headline.trim(),
      location: location.trim(),
      bio: bio.trim(),
      currentRole: currentRole.trim(),
      currentOrganization: currentOrganization.trim(),
      education: education.trim(),
      professionalExperience: professionalExperience.trim(),
      skills,
      areasOfExpertise: skills,
      industries,
      startupInterests,
      entrepreneurshipInterests: startupInterests,
      linkedin: linkedin.trim(),
      website: website.trim(),
      otherLinks: otherLink.trim() ? [otherLink.trim()] : [],
    };

    // Save to local storage and persist to MongoDB
    await authService.savePersonalProfile(profileData);

    // Clear stale path selection so user lands squarely on Step 4 (Choose Path)
    if (typeof window !== "undefined") {
      localStorage.removeItem("xentro_selected_path_step4");
      sessionStorage.removeItem("xentro_selected_path_step4");
    }

    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      router.push("/onboarding?step=4");
    }, 1000);
  };

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

        {/* Profile Card */}
        <div className="bg-white dark:bg-[#181B1A] p-6 sm:p-10 rounded-2xl border border-[#E3E5E3] dark:border-[#262928] shadow-xentro-card transition-colors">
          <div className="mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D9FF3F]/15 text-xs font-inter font-semibold text-[#101212] dark:text-[#D9FF3F] mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step 3 &bull; Personal Profile</span>
            </span>
            <h1 className="font-manrope font-bold text-2xl sm:text-3xl text-[#101212] dark:text-white mb-2">
              Complete your profile
            </h1>
            <p className="font-inter text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7]">
              Build your presence across the Xentro network. Connect with founders, mentors, investors, and opportunities.
            </p>
          </div>

          {isSuccess ? (
            <div className="py-12 text-center animate-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-[#D9FF3F] text-[#101212] flex items-center justify-center mx-auto mb-3 shadow-md">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <h2 className="font-manrope font-bold text-xl text-[#101212] dark:text-white mb-1">
                Profile Saved!
              </h2>
              <p className="font-inter text-xs text-[#565B59] dark:text-[#B6B8B7]">
                Advancing to Step 04: Choose Path...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photo Upload & Preview */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-[#F7F8F6] dark:bg-[#0D0F0F] border border-[#E3E5E3] dark:border-[#262928]">
                <div className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#E3E5E3] dark:bg-[#262928] flex items-center justify-center border-2 border-[#D9FF3F]">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserCircle2 className="w-12 h-12 text-[#565B59] dark:text-[#B6B8B7]" />
                  )}
                </div>

                <div className="flex-1">
                  <label className="text-xs font-inter font-bold text-[#101212] dark:text-white block mb-1">
                    Profile Photo
                  </label>
                  <p className="text-[11px] font-inter text-[#565B59] dark:text-[#B6B8B7] mb-2.5">
                    Recommended: Square JPG or PNG, at least 400x400px.
                  </p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-inter font-semibold bg-white dark:bg-[#181B1A] border border-[#E3E5E3] dark:border-[#262928] hover:border-[#D9FF3F] cursor-pointer transition-colors shadow-sm">
                    <Camera className="w-3.5 h-3.5 text-[#565B59] dark:text-[#D9FF3F]" />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Full Name & Headline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="profileFullName"
                  label="Full Name"
                  placeholder="Enter full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <AuthInput
                  id="headline"
                  label="Professional Headline"
                  placeholder="e.g. AI Researcher | Tech Founder"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
              </div>

              {/* Location & Current Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="location"
                  label="Location"
                  placeholder="e.g. Bengaluru, India / Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />

                <AuthInput
                  id="currentRole"
                  label="Current Role"
                  placeholder="e.g. Founder, Architect, VP"
                  value={currentRole}
                  onChange={(e) => setCurrentRole(e.target.value)}
                />
              </div>

              {/* Current Organization & Education */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <AuthInput
                  id="currentOrg"
                  label="Current Organization / Institution"
                  placeholder="e.g. Stealth AI / IIT Madras"
                  value={currentOrganization}
                  onChange={(e) => setCurrentOrganization(e.target.value)}
                />

                <AuthInput
                  id="education"
                  label="Education"
                  placeholder="e.g. B.Tech / MBA / Self-Taught"
                  value={education}
                  onChange={(e) => setEducation(e.target.value)}
                />
              </div>

              {/* Short Bio */}
              <div className="space-y-1.5">
                <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                  Short Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief introduction of your journey, focus, and what drives you."
                  className="w-full p-3.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white placeholder-[#565B59] focus:outline-none focus:ring-2 focus:ring-[#D9FF3F] resize-none"
                />
              </div>

              {/* Professional Experience */}
              <AuthInput
                id="experience"
                label="Professional Experience Summary"
                placeholder="e.g. 8+ years building enterprise SaaS and fintech platforms"
                value={professionalExperience}
                onChange={(e) => setProfessionalExperience(e.target.value)}
              />

              {/* Skills & Areas of Expertise */}
              <div className="space-y-2">
                <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                  Skills &amp; Areas of Expertise
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
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    placeholder="Add a skill (e.g. Python, Fundraising, M&A) and press Add"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E3E5E3] dark:border-[#262928] text-xs font-inter font-semibold text-[#101212] dark:text-white hover:border-[#D9FF3F]"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Industries */}
              <div className="space-y-2">
                <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                  Industries of Focus
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_INDUSTRIES.map((ind) => {
                    const active = industries.includes(ind);
                    return (
                      <button
                        key={ind}
                        type="button"
                        onClick={() => toggleIndustry(ind)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-inter font-semibold border transition-all",
                          active
                            ? "bg-[#D9FF3F] text-[#101212] border-[#D9FF3F] shadow-sm"
                            : "border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7] hover:border-[#101212] dark:hover:border-white"
                        )}
                      >
                        {ind}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Startup & Entrepreneurship Interests */}
              <div className="space-y-2">
                <label className="text-xs font-inter font-semibold uppercase tracking-wider text-[#101212] dark:text-white">
                  Startup &amp; Entrepreneurship Interests
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {startupInterests.map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-inter font-semibold bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white border border-[#E3E5E3] dark:border-[#262928]"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveInterest(item)}
                        className="hover:text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={interestInput}
                    onChange={(e) => setInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddInterest();
                      }
                    }}
                    placeholder="Add an interest (e.g. Mentoring, Angel syndicate, Pitch decks)"
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E3E5E3] dark:border-[#262928] bg-white dark:bg-[#181B1A] text-xs font-inter text-[#101212] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]"
                  />
                  <button
                    type="button"
                    onClick={handleAddInterest}
                    className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E3E5E3] dark:border-[#262928] text-xs font-inter font-semibold text-[#101212] dark:text-white hover:border-[#D9FF3F]"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Social & Web Links */}
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
                  disabled={isSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-inter font-semibold text-sm bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] active:bg-[#9EBE12] shadow-sm transition-all"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving profile...</span>
                    </>
                  ) : (
                    <>
                      <span>Save &amp; Continue to Ecosystem</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full max-w-2xl mx-auto text-center text-xs text-[#565B59] dark:text-[#B6B8B7]">
        XENTRO &bull; CONNECT PEOPLE. CREATE OPPORTUNITY.
      </footer>
    </main>
  );
}
