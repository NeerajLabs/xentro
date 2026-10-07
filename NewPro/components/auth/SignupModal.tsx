'use client';

import React, { useState } from 'react';
import {
  Rocket,
  GraduationCap,
  TrendingUp,
  Grid2X2,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  User,
  Building2,
  Mail,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { UserRole, UserProfile, saveUserProfile, GUEST_AVATAR, emptyProfileForRole } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';
import { isDevToolsEnabled } from '@/lib/devTools';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (role: UserRole) => void;
  initialRole?: UserRole;
}

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  initialRole = 'startup',
}) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<UserRole>(initialRole);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    roleTitle: '',
    sector: '',
    stageOrFocus: '',
    location: 'Bengaluru, India',
  });

  if (!isOpen) return null;

  // Manual signup from inside the hub is disabled in normal mode: it used to write
  // demo preset data into your real profile. Open the real Signup app instead.
  // Dev tools (?dev=1 or NEXT_PUBLIC_XENTRO_DEV_TOOLS) keep the local form for testing.
  if (!isDevToolsEnabled()) {
    if (typeof window !== 'undefined') {
      try {
        const signupUrl = process.env.NEXT_PUBLIC_SIGNUP_URL || process.env.NEXT_PUBLIC_SIGNUP_APP_URL;
        window.location.href = signupUrl ? `${signupUrl.replace(/\/+$/, '')}/onboarding` : '/onboarding';
      } catch {
        /* Fall through to local UI only if navigation is impossible */
      }
    }
    return null;
  }

  const roleOptions: Array<{
    role: UserRole;
    title: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    tagline: string;
    description: string;
    features: string[];
    accentColor: string;
  }> = [
    {
      role: 'startup',
      title: 'Startup & Founder',
      badge: 'Ventures',
      icon: Rocket,
      tagline: 'Build, fundraise & scale',
      description: 'Create your institutional startup identity, manage pitch decks, request investor diligence, and connect with mentors.',
      features: ['Due Diligence Data Room', 'Investor Pipeline Tracking', 'Grant & Cohort Applications', '1-on-1 Mentor Guidance'],
      accentColor: 'border-[#D9FF3F] bg-[#D9FF3F]/10',
    },
    {
      role: 'mentor',
      title: 'Mentor & Advisor',
      badge: 'Guidance',
      icon: GraduationCap,
      tagline: 'Guide high-potential founders',
      description: 'Host advisory calls, review technical architecture, guide startup cohorts, and expand your executive advisory portfolio.',
      features: ['Advisory Session Scheduler', 'Mentee Portfolio Tracker', 'Incoming Guidance Queue', 'Feedback & Ratings'],
      accentColor: 'border-blue-500 bg-blue-500/10',
    },
    {
      role: 'investor',
      title: 'Investor & Syndicate',
      badge: 'Capital',
      icon: TrendingUp,
      tagline: 'Evaluate deal flow & deploy capital',
      description: 'Access curated early-stage deal flow, review validated pitch decks, audit verified diligence lockers, and syndicate rounds.',
      features: ['Proprietary Deal Pipeline', 'Confidential Data Room Access', 'Syndicate Co-investments', 'Portfolio Analytics'],
      accentColor: 'border-emerald-500 bg-emerald-500/10',
    },
    {
      role: 'esp',
      title: 'ESP & Institution',
      badge: 'Ecosystem',
      icon: Grid2X2,
      tagline: 'Incubators, Accelerators & Universities',
      description: 'Manage cohort admissions, track startup milestones, allocate lab resources, and facilitate venture capital access.',
      features: ['Cohort Application Engine', 'Lab & GPU Resource Allocation', 'Milestone Review System', 'Demo Day Coordination'],
      accentColor: 'border-purple-500 bg-purple-500/10',
    },
  ];

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    // Pre-populate from your own stored data when available; otherwise start blank.
    // (Demo presets are showcase data for viewing others - never your profile.)
    const stored = emptyProfileForRole(role);
    const previous = formData;
    setFormData({
      name: stored.name || previous.name,
      email: stored.email || previous.email,
      organization: stored.organization || previous.organization,
      roleTitle: stored.roleTitle || previous.roleTitle,
      sector: stored.sector || previous.sector,
      stageOrFocus: stored.stageOrFocus || previous.stageOrFocus,
      location: stored.location || previous.location || 'Bengaluru, India',
    });
    setStep(2);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.organization.trim()) {
      showToast('Please fill in your name and organization', 'error');
      return;
    }

    const newProfile: UserProfile = {
      id: `user_${selectedRole}_${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim() || '',
      role: selectedRole,
      roleTitle: formData.roleTitle.trim(),
      organization: formData.organization.trim(),
      sector: formData.sector.trim(),
      stageOrFocus: formData.stageOrFocus.trim(),
      avatar: GUEST_AVATAR,
      location: formData.location.trim(),
      joinedAt: 'Today',
    };

    saveUserProfile(newProfile);
    showToast(`Welcome ${newProfile.name}! Registered as ${selectedRole.toUpperCase()}`, 'success');
    if (onComplete) {
      onComplete(selectedRole);
    }
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#181B1A] w-full max-w-2xl rounded-3xl shadow-floating border border-[#E5E7EB] dark:border-[#262A29] p-6 sm:p-8 max-h-[92vh] overflow-y-auto animate-fade-slide relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1.5 mb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Xentro Ecosystem Signup & Onboarding</span>
          </div>
          <h2 className="text-2xl font-bold font-sora text-[#101212] dark:text-white tracking-tight">
            {step === 1 ? 'Select Your Primary Ecosystem Role' : 'Create Your Ecosystem Profile'}
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            {step === 1
              ? 'Your dashboard tools, metrics, and network will customize dynamically around this role.'
              : `Customize your profile information as a verified ${selectedRole.toUpperCase()} member.`}
          </p>
        </div>

        {/* STEP 1: SELECT YOUR ROLE */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {roleOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = selectedRole === opt.role;
                return (
                  <div
                    key={opt.role}
                    onClick={() => handleRoleSelect(opt.role)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 group flex flex-col justify-between hover:scale-[1.01] ${
                      isSelected
                        ? `${opt.accentColor} border-current shadow-xs`
                        : 'border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/60 hover:border-gray-300 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white shadow-xs">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#181B1A] text-[#565B59] dark:text-[#B6B8B7]">
                          {opt.badge}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-[#101212] dark:text-white font-heading group-hover:text-[#9EBE12] transition-colors">
                          {opt.title}
                        </h4>
                        <p className="text-xs font-semibold text-[#101212] dark:text-[#D9FF3F]">
                          {opt.tagline}
                        </p>
                      </div>

                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                        {opt.description}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-gray-200/60 dark:border-[#262A29]/80 flex items-center justify-between text-xs font-bold text-[#101212] dark:text-white">
                      <span>Select Role</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: PROFILE DETAILS FORM */}
        {step === 2 && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-[#565B59] dark:text-[#B6B8B7]">Selected Role:</span>
                <span className="font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F]">
                  {selectedRole}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Role</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  Full Name / Primary Contact *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Your Full Name"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] transition-all"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@organization.com"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] transition-all"
                />
              </div>

              {/* Organization Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  {selectedRole === 'startup'
                    ? 'Startup / Venture Name *'
                    : selectedRole === 'mentor'
                    ? 'Current Organization / Advisory Firm *'
                    : selectedRole === 'investor'
                    ? 'Venture Firm / Angel Network *'
                    : 'Institution / Incubator Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="e.g. Acme Tech"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] transition-all"
                />
              </div>

              {/* Role Title */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  Title / Designation
                </label>
                <input
                  type="text"
                  value={formData.roleTitle}
                  onChange={(e) => setFormData({ ...formData, roleTitle: e.target.value })}
                  placeholder="e.g. Founder & CEO"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] transition-all"
                />
              </div>

              {/* Sector / Domain */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  Industry / Focus Sector
                </label>
                <input
                  type="text"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  placeholder="e.g. Enterprise AI & DeepTech"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] transition-all"
                />
              </div>

              {/* Stage / Check Size */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  {selectedRole === 'startup'
                    ? 'Current Round / Target'
                    : selectedRole === 'investor'
                    ? 'Typical Check Size'
                    : selectedRole === 'esp'
                    ? 'Cohort Focus'
                    : 'Advisory Areas'}
                </label>
                <input
                  type="text"
                  value={formData.stageOrFocus}
                  onChange={(e) => setFormData({ ...formData, stageOrFocus: e.target.value })}
                  placeholder="e.g. Seed Stage ($1.2M Target)"
                  className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white outline-none focus:border-[#D9FF3F] transition-all"
                />
              </div>
            </div>

            {/* Submit & Back Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-[#262A29]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Save Profile & Open Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
