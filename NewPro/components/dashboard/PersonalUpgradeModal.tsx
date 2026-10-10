'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile } from '@/lib/userProfile';
import { investorOrganizationService } from '@/lib/investorOrganizationService';

interface PersonalUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  onApplicationSubmitted?: () => void;
}

interface ExistingRequest {
  id: string;
  requestId: string;
  requestedRole: string;
  currentRole: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
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
  const [existingRequests, setExistingRequests] = useState<ExistingRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
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

  // Check investor organization conflict for Mentor conversion
  const [hasInvestorOrgConflict, setHasInvestorOrgConflict] = useState(false);

  useEffect(() => {
    if (isOpen) {
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

      // Conflict detection: Explorer belonging to Investor Org cannot convert to Mentor
      const memberships = investorOrganizationService.getAllMemberships();
      const activeInvestorMemberships = memberships.filter((m) => m.status === 'active');
      setHasInvestorOrgConflict(activeInvestorMemberships.length > 0);

      fetchExistingApplications(p);
    }
  }, [isOpen, currentUserProfile]);

  const fetchExistingApplications = async (p: UserProfile) => {
    setIsLoadingRequests(true);
    try {
      const params = new URLSearchParams();
      if (p.id) params.set('userId', p.id);
      if (p.email) params.set('email', p.email);
      const res = await fetch(`/api/roles/request?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        const list = json?.data?.requests || json?.requests || [];
        setExistingRequests(list);
      }
    } catch (e) {
      console.warn('Failed to fetch role requests:', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  if (!isOpen) return null;

  // Find status for current target role
  const targetReq = existingRequests.find((r) =>
    selectedTarget === 'mentor'
      ? r.requestedRole.toLowerCase().includes('mentor')
      : r.requestedRole.toLowerCase().includes('investor')
  );

  const isPending = targetReq?.status === 'PENDING';
  const isApproved = targetReq?.status === 'APPROVED';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTarget === 'mentor' && hasInvestorOrgConflict) {
      showToast(
        'Conversion blocked: You currently belong to an Investor Organization. Please resolve or leave your Investor Organization membership before converting to Mentor.',
        'error'
      );
      return;
    }

    if (isPending) {
      showToast('You already have a pending application under administrative review.', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const targetRoleTitle = selectedTarget === 'mentor' ? 'Mentor' : 'Investor';
      const reasonText =
        selectedTarget === 'mentor'
          ? `Mentor Conversion Request: ${mentorExpertise}. Experience: ${yearsExperience}. Motivation: ${mentorshipMotivation}`
          : `Individual Investor Conversion Request: Cheque size: ${chequeSize}, Preferred stage: ${preferredStage}, Sectors: ${sectorsOfInterest}`;

      const payload = {
        userId: profile.id,
        userEmail: email.trim().toLowerCase(),
        userName: fullName.trim(),
        currentRole: 'Explorer',
        requestedRole: targetRoleTitle,
        reason: reasonText,
        entityDetails: {
          headline,
          bio,
          currentRole,
          currentOrganization: currentOrg,
          skills,
          linkedin,
          mentorDetails: selectedTarget === 'mentor' ? { mentorExpertise, yearsExperience, mentorshipMotivation } : undefined,
          investorDetails: selectedTarget === 'investor' ? { chequeSize, preferredStage, sectorsOfInterest } : undefined,
        },
      };

      const res = await fetch('/api/roles/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          `Application for ${targetRoleTitle} submitted successfully! Our compliance team will review your dossier.`,
          'success'
        );
        if (onApplicationSubmitted) onApplicationSubmitted();
        await fetchExistingApplications(profile);
      } else {
        showToast(data?.message || 'Failed to submit application. Please retry.', 'error');
      }
    } catch {
      showToast('A network error occurred while submitting application.', 'error');
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
            <span>Personal Account Upgrade</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
            Upgrade Your Explorer Account
          </h2>
          <p className="text-xs text-[#B6B8B7] mt-1 max-w-lg leading-relaxed">
            Permanent personal role upgrade. Your personal User ID ({profile.id}), connections, messages, and saved profile data are preserved throughout conversion.
          </p>

          {/* Role Choice Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 mt-5 p-1 bg-white/5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setSelectedTarget('mentor')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTarget === 'mentor'
                  ? 'bg-[#D9FF3F] text-[#101212] shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Become Mentor</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTarget('investor')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedTarget === 'investor'
                  ? 'bg-[#D9FF3F] text-[#101212] shadow-md'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Become Individual Investor</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Status Banner if application already exists */}
          {targetReq && (
            <div
              className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
                isPending
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
                  : isApproved
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400'
              }`}
            >
              {isPending ? (
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              ) : isApproved ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold">
                  Application Status: {targetReq.status} (Ref #{targetReq.requestId})
                </div>
                <p className="mt-0.5 text-[11px] opacity-90">
                  {isPending &&
                    'Your application has been received and is currently under administrative compliance review. You will receive an email upon decision.'}
                  {isApproved &&
                    'This role upgrade has been approved. Your dedicated workspace is active.'}
                  {targetReq.status === 'REJECTED' &&
                    `Application not approved: ${targetReq.adminNotes || 'Requirements not met at this time.'}`}
                </p>
              </div>
            </div>
          )}

          {/* Conflict Alert for Mentors belonging to Investor Orgs */}
          {selectedTarget === 'mentor' && hasInvestorOrgConflict && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <span className="font-bold block">Organizational Conflict Detected</span>
                <span className="mt-0.5 text-[11px] block leading-relaxed">
                  You currently belong to an Investor Organization. Under Xentro compliance policies, Mentors cannot hold simultaneous memberships in Investor Organizations. You must resolve or leave your Investor Organization membership before completing conversion to Mentor.
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Prefilled Profile Details (Read-only summary) */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#9EBE12]" />
                  <span>Canonical Explorer Profile Information</span>
                </span>
                <span className="text-[10px] text-[#565B59] dark:text-[#8E9290]">Auto-Populated</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[11px] text-[#565B59] dark:text-[#8E9290] block">Applicant Name</span>
                  <span className="font-semibold text-[#101212] dark:text-white">{fullName}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#565B59] dark:text-[#8E9290] block">Registered Email</span>
                  <span className="font-semibold text-[#101212] dark:text-white">{email}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#565B59] dark:text-[#8E9290] block">Current Role / Title</span>
                  <span className="font-semibold text-[#101212] dark:text-white">{currentRole || 'Not specified'}</span>
                </div>
                <div>
                  <span className="text-[11px] text-[#565B59] dark:text-[#8E9290] block">Current Organization</span>
                  <span className="font-semibold text-[#101212] dark:text-white">{currentOrg || 'Not specified'}</span>
                </div>
              </div>

              {headline && (
                <div className="pt-2 border-t border-[#E5E7EB] dark:border-[#262A29] text-xs">
                  <span className="text-[11px] text-[#565B59] dark:text-[#8E9290] block">Professional Headline</span>
                  <span className="text-[#101212] dark:text-white italic">{headline}</span>
                </div>
              )}
            </div>

            {/* Target Role Specific Inputs */}
            {selectedTarget === 'mentor' ? (
              <>
                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Primary Advisory Expertise &amp; Domains *
                  </label>
                  <input
                    type="text"
                    required
                    value={mentorExpertise}
                    onChange={(e) => setMentorExpertise(e.target.value)}
                    placeholder="e.g. Go-To-Market Strategy, Product Architecture, Seed Fundraising"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Years of Professional / Advisory Experience
                    </label>
                    <select
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    >
                      <option value="3-5 years">3 - 5 years</option>
                      <option value="5+ years">5 - 10 years</option>
                      <option value="10+ years">10+ years</option>
                      <option value="15+ years">15+ years (Executive / Veteran)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      LinkedIn / Portfolio Link
                    </label>
                    <input
                      type="url"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Advisory Motivation &amp; Startup Stages You Guide *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={mentorshipMotivation}
                    onChange={(e) => setMentorshipMotivation(e.target.value)}
                    placeholder="Describe how you plan to support early-stage founders and the specific areas you evaluate during mentorship sessions..."
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Typical Cheque Size / Bracket *
                    </label>
                    <select
                      value={chequeSize}
                      onChange={(e) => setChequeSize(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    >
                      <option value="$5k - $25k">$5k - $25k (Micro Angel)</option>
                      <option value="$25k - $50k">$25k - $50k (Angel / Syndicate)</option>
                      <option value="$50k - $100k">$50k - $100k (Lead Angel)</option>
                      <option value="$100k+">$100k+ (Super Angel / High Net Worth)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                      Preferred Investment Stage
                    </label>
                    <select
                      value={preferredStage}
                      onChange={(e) => setPreferredStage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    >
                      <option value="Pre-Seed">Pre-Seed</option>
                      <option value="Seed">Seed</option>
                      <option value="Pre-Series A">Pre-Series A</option>
                      <option value="Series A+">Series A and Beyond</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Sectors / Verticals of Interest *
                  </label>
                  <input
                    type="text"
                    required
                    value={sectorsOfInterest}
                    onChange={(e) => setSectorsOfInterest(e.target.value)}
                    placeholder="e.g. AI/ML, B2B SaaS, Climate Tech, FinTech, DeepTech"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1.5">
                    Investor Profile / AngelList / LinkedIn URL
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/investor or AngelList URL"
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                  />
                </div>
              </>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7] hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="submit"
                disabled={isSubmitting || isPending || (selectedTarget === 'mentor' && hasInvestorOrgConflict)}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-md"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting Application...</span>
                  </>
                ) : isPending ? (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    <span>Application Under Review</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Conversion Application</span>
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
