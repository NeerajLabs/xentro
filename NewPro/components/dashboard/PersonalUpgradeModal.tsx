'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  GraduationCap,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ArrowRight,
  Send,
  Loader2,
  Check,
  Building,
  User,
  Info,
  KeyRound,
  RotateCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile, saveUserProfile } from '@/lib/userProfile';
import { investorOrganizationService } from '@/lib/investorOrganizationService';

interface PersonalUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  onApplicationSubmitted?: () => void;
}

export const PersonalUpgradeModal: React.FC<PersonalUpgradeModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onApplicationSubmitted,
}) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(currentUserProfile || getUserProfile());
  const [selectedTarget, setSelectedTarget] = useState<'mentor' | 'investor'>('mentor');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [currentOrg, setCurrentOrg] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState('');
  const [linkedin, setLinkedin] = useState('');

  // Mentor specific
  const [mentorExpertise, setMentorExpertise] = useState('');
  const [yearsExperience, setYearsExperience] = useState('5+ years');
  const [mentorshipMotivation, setMentorshipMotivation] = useState('');

  // Investor specific
  const [chequeSize, setChequeSize] = useState('$10k - $50k');
  const [preferredStage, setPreferredStage] = useState('Seed');
  const [sectorsOfInterest, setSectorsOfInterest] = useState('');

  // Conflict detection
  const [hasInvestorOrgConflict, setHasInvestorOrgConflict] = useState(false);

  // OTP State Machine
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const p = currentUserProfile || getUserProfile();
      setProfile(p);
      setFullName(p.name || '');
      setEmail(p.email || '');
      setCurrentRole(p.currentRole || p.roleTitle || '');
      setCurrentOrg(p.currentOrganization || p.organization || '');
      setHeadline(p.headline || '');
      setBio(p.bio || '');
      setSkills(Array.isArray(p.skills) ? p.skills.join(', ') : '');
      setLinkedin(p.linkedin || '');
      setSectorsOfInterest(Array.isArray(p.industries) ? p.industries.join(', ') : '');
      setOtpStep(false);
      setOtpCode('');
      setChallengeId('');
      setCountdown(0);

      // Conflict detection: Explorer belonging to Investor Org cannot convert to Mentor
      const memberships = investorOrganizationService.getAllMemberships();
      const activeInvestorMemberships = memberships.filter((m) => m.status === 'active');
      setHasInvestorOrgConflict(activeInvestorMemberships.length > 0);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  const targetPurpose = selectedTarget === 'mentor' ? 'MENTOR_CONVERSION' : 'INDIVIDUAL_INVESTOR_CONVERSION';
  const roleLabel = selectedTarget === 'mentor' ? 'Mentor' : 'Individual Investor';

  // Step 1: Send OTP to personal email
  const handleSendOtp = async () => {
    if (selectedTarget === 'mentor' && hasInvestorOrgConflict) {
      showToast(
        'Conversion blocked: Mentors are strictly prohibited from holding active Investor Organization memberships.',
        'error'
      );
      return;
    }

    const targetEmail = (email || profile.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('A registered personal email address is required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          purpose: targetPurpose,
          name: fullName.trim() || profile.name,
        }),
      });

      const data = await res.json();
      const hasChallenge = Boolean(data.challengeId || data.data?.challengeId);
      if ((res.ok && data.success) || hasChallenge || data.status === 'cooldown_active') {
        setOtpStep(true);
        setChallengeId(data.challengeId || data.data?.challengeId || '');
        setMaskedEmail(data.maskedEmail || targetEmail);
        setCountdown(data.cooldownSeconds || 60);
        showToast(
          data.message || `Verification code sent to ${data.maskedEmail || targetEmail}`,
          'info'
        );
      } else {
        showToast(data?.message || 'Failed to dispatch verification code.', 'error');
      }
    } catch {
      showToast('Network error while requesting verification code.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify OTP and activate permanent conversion
  const handleVerifyAndActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otpStep) {
      await handleSendOtp();
      return;
    }

    if (!otpCode || otpCode.trim().length !== 6) {
      showToast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetEmail = (email || profile.email || '').trim().toLowerCase();

      // 1. Verify OTP with challenge binding
      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          code: otpCode.trim(),
          purpose: targetPurpose,
          challengeId,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        showToast(verifyData?.message || 'Invalid or expired verification code.', 'error');
        setIsSubmitting(false);
        return;
      }

      // 2. Finalize permanent conversion in MongoDB
      const targetRoleTitle = selectedTarget === 'mentor' ? 'Mentor' : 'Investor';

      const payload = {
        userId: profile.id,
        userEmail: targetEmail,
        userName: fullName.trim(),
        targetRole: targetRoleTitle,
        challengeId,
        headline,
        bio,
        currentRole,
        currentOrganization: currentOrg,
        skills,
        linkedin,
        mentorDetails: selectedTarget === 'mentor' ? { mentorExpertise, yearsExperience, mentorshipMotivation } : undefined,
        investorDetails: selectedTarget === 'investor' ? { chequeSize, preferredStage, sectorsOfInterest } : undefined,
      };

      const res = await fetch('/api/roles/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Direct permanent conversion successful: update active session and profile
        const newRole = selectedTarget;
        const updatedProfile = {
          ...profile,
          role: newRole,
          roleTitle: roleLabel,
          headline: headline || profile.headline,
          bio: bio || profile.bio,
        };

        saveUserProfile(updatedProfile);
        try {
          localStorage.setItem('xentro_active_role', newRole);
          const rawUser = localStorage.getItem('xentro_current_user');
          if (rawUser) {
            const parsed = JSON.parse(rawUser);
            parsed.role = newRole;
            parsed.accountType = targetRoleTitle;
            parsed.primaryRole = targetRoleTitle;
            parsed.roleTitle = roleLabel;
            parsed.activeRoles = [targetRoleTitle];
            localStorage.setItem('xentro_current_user', JSON.stringify(parsed));
          }
        } catch (_) {}

        window.dispatchEvent(new CustomEvent('xentro-role-changed', { detail: { role: newRole, profile: updatedProfile } }));

        showToast(
          `${roleLabel} account verified & activated successfully! Redirecting to dashboard...`,
          'success'
        );

        if (onApplicationSubmitted) onApplicationSubmitted();
        onClose();

        // Redirect directly to the newly activated role dashboard
        setTimeout(() => {
          window.location.href = '/?tab=dashboard';
        }, 600);
      } else {
        showToast(data?.message || 'Failed to activate account. Please retry.', 'error');
      }
    } catch {
      showToast('A network error occurred while activating your account.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white dark:bg-[#181B1A] rounded-3xl border border-[#E5E7EB] dark:border-[#262A29] shadow-2xl">
        {/* Header Banner */}
        <div className="p-6 sm:p-7 border-b border-[#E5E7EB] dark:border-[#262A29] relative bg-gradient-to-r from-[#141816] via-[#101412] to-[#0A0D0C] text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 text-xs font-mono font-bold text-[#D9FF3F] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Permanent Account Upgrade</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
            Upgrade Your Explorer Account
          </h2>
          <p className="text-xs text-[#B6B8B7] mt-1 max-w-lg leading-relaxed">
            Permanent role conversion. Your User ID ({profile.id}), connections, messages, and history are preserved as your dedicated dashboard is activated.
          </p>

          {/* Role Choice Switcher Tabs */}
          {!otpStep && (
            <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-white/5 rounded-2xl border border-white/10">
              <button
                type="button"
                onClick={() => setSelectedTarget('mentor')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTarget === 'mentor'
                    ? 'bg-[#D9FF3F] text-[#101212] shadow-md'
                    : 'text-[#B6B8B7] hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Mentor</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTarget('investor')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedTarget === 'investor'
                    ? 'bg-[#D9FF3F] text-[#101212] shadow-md'
                    : 'text-[#B6B8B7] hover:text-white'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Individual Investor</span>
              </button>
            </div>
          )}
        </div>

        <div className="p-6 sm:p-7 space-y-6">
          {/* Conflict Warning for Mentor */}
          {selectedTarget === 'mentor' && hasInvestorOrgConflict && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
              <div>
                <p className="font-bold">Investor Organization Membership Conflict Detected</p>
                <p className="mt-1 opacity-90">
                  Mentors are strictly prohibited from holding active Investor Organization memberships. You must resign from your Investor Organization before upgrading to Mentor.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleVerifyAndActivate} className="space-y-4">
            {/* Step 1: Profile & Role Details */}
            {!otpStep ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      required
                      disabled
                      value={email}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white opacity-75 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                    Professional Headline
                  </label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Senior Partner @ VentureLab | Former CTO"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                    Bio / Summary
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Briefly describe your background, expertise, and focus areas..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                  />
                </div>

                {/* Mentor-Specific Fields */}
                {selectedTarget === 'mentor' && (
                  <div className="p-4 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/20 space-y-3">
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-[#9EBE12]" />
                      Mentor Specialization
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                          Primary Domain Expertise
                        </label>
                        <input
                          type="text"
                          value={mentorExpertise}
                          onChange={(e) => setMentorExpertise(e.target.value)}
                          placeholder="e.g. AI Product Growth, Fintech Regs"
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                          Years of Experience
                        </label>
                        <select
                          value={yearsExperience}
                          onChange={(e) => setYearsExperience(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                        >
                          <option value="3-5 years">3 - 5 years</option>
                          <option value="5-10 years">5 - 10 years</option>
                          <option value="10+ years">10+ years</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                        Mentorship Philosophy &amp; Motivation
                      </label>
                      <input
                        type="text"
                        value={mentorshipMotivation}
                        onChange={(e) => setMentorshipMotivation(e.target.value)}
                        placeholder="What drives you to mentor founders on Xentro?"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                      />
                    </div>
                  </div>
                )}

                {/* Investor-Specific Fields */}
                {selectedTarget === 'investor' && (
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-3">
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      Investment Preferences
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                          Typical Cheque Size
                        </label>
                        <select
                          value={chequeSize}
                          onChange={(e) => setChequeSize(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                        >
                          <option value="$5k - $15k">$5k - $15k</option>
                          <option value="$15k - $50k">$15k - $50k</option>
                          <option value="$50k - $150k">$50k - $150k</option>
                          <option value="$150k+">$150k+</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                          Preferred Stage
                        </label>
                        <select
                          value={preferredStage}
                          onChange={(e) => setPreferredStage(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                        >
                          <option value="Idea">Idea / Pre-Seed</option>
                          <option value="Seed">Seed</option>
                          <option value="Series A">Series A</option>
                          <option value="All Stages">All Stages</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                        Sectors of Interest
                      </label>
                      <input
                        type="text"
                        value={sectorsOfInterest}
                        onChange={(e) => setSectorsOfInterest(e.target.value)}
                        placeholder="e.g. AI / ML, B2B SaaS, HealthTech"
                        className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Step 2: OTP Verification Card */
              <div className="p-5 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/30 space-y-4 animate-fade-slide">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#9EBE12]" />
                    <span className="font-bold text-xs text-[#101212] dark:text-[#D9FF3F]">
                      Verify Consent to Convert Personal Account
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpStep(false)}
                    className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] hover:underline cursor-pointer"
                  >
                    Edit Details
                  </button>
                </div>

                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  To authorize the permanent conversion to <strong>{roleLabel}</strong>, enter the 6-digit verification code sent to <strong>{maskedEmail || email}</strong>:
                </p>

                <div className="space-y-2">
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl text-lg font-mono tracking-widest text-center bg-white dark:bg-[#181B1A] border border-[#D9FF3F] text-[#101212] dark:text-white font-black"
                  />

                  <div className="flex items-center justify-between text-[11px] text-[#565B59] dark:text-[#8E9290]">
                    <span>Valid for 10 minutes</span>
                    {countdown > 0 ? (
                      <span className="font-mono">Resend available in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSubmitting}
                        className="text-[#9EBE12] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Resend Verification Code</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Permanent Conversion Warning */}
            <div className="pt-2 text-[11px] text-[#565B59] dark:text-[#8E9290]">
              <span className="font-semibold text-amber-600 dark:text-amber-400">Important:</span> This account conversion is permanent. Your personal User ID ({profile.id}), connections, messages, and profile history are preserved as your {roleLabel} dashboard is activated.
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (otpStep) setOtpStep(false);
                  else onClose();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                {otpStep ? 'Back' : 'Close'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting || (selectedTarget === 'mentor' && hasInvestorOrgConflict)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{otpStep ? 'Verifying & Activating...' : 'Sending Code...'}</span>
                  </>
                ) : !otpStep ? (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Verification Code</span>
                  </>
                ) : selectedTarget === 'mentor' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify &amp; Activate Mentor</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verify &amp; Activate Investor</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
