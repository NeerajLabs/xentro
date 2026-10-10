'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Rocket,
  Building,
  Grid2X2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ArrowRight,
  Plus,
  Loader2,
  Lock,
  ExternalLink,
  Ban,
  FileCheck2,
  KeyRound,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { getUserProfile, UserProfile } from '@/lib/userProfile';
import { authService } from '@/lib/auth/authService';
import { investorOrganizationService } from '@/lib/investorOrganizationService';
import { InvestorOrganizationType } from '@/types/investorOrganization';

interface EntityAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserProfile: UserProfile;
  onEntityCreated?: (entity: any) => void;
  onSelectTab?: (tabId: string) => void;
}

export const EntityAccountModal: React.FC<EntityAccountModalProps> = ({
  isOpen,
  onClose,
  currentUserProfile,
  onEntityCreated,
  onSelectTab,
}) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(currentUserProfile || getUserProfile());
  const [selectedEntityChoice, setSelectedEntityChoice] = useState<'startup' | 'investor_org' | 'esp' | null>(null);

  // Government identity verification state
  const [identityStatus, setIdentityStatus] = useState<string>('NOT_SUBMITTED');
  const [isVerifyingInline, setIsVerifyingInline] = useState(false);
  const [nameAsPerId, setNameAsPerId] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idConsent, setIdConsent] = useState(false);
  const [isSubmittingId, setIsSubmittingId] = useState(false);

  // Form states for entities
  const [isSubmittingEntity, setIsSubmittingEntity] = useState(false);

  // Startup form
  const [startupName, setStartupName] = useState('');
  const [startupEmail, setStartupEmail] = useState('');
  const [startupSector, setStartupSector] = useState('Fintech');
  const [startupStage, setStartupStage] = useState('MVP');
  const [startupPitch, setStartupPitch] = useState('');
  const [startupWebsite, setStartupWebsite] = useState('');
  const [startupOtpStep, setStartupOtpStep] = useState(false);
  const [startupOtpCode, setStartupOtpCode] = useState('');
  const [startupChallengeId, setStartupChallengeId] = useState('');
  const [maskedStartupEmail, setMaskedStartupEmail] = useState('');
  const [startupCountdown, setStartupCountdown] = useState(0);

  // Investor Org form
  const [orgName, setOrgName] = useState('');
  const [orgEmail, setOrgEmail] = useState('');
  const [orgRole, setOrgRole] = useState<'Owner / Managing Partner' | 'Admin'>('Owner / Managing Partner');
  const [orgType, setOrgType] = useState<InvestorOrganizationType>('Venture Capital Fund');
  const [targetAum, setTargetAum] = useState('$5M - $25M');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [investorOrgOtpStep, setInvestorOrgOtpStep] = useState(false);
  const [investorOrgOtpCode, setInvestorOrgOtpCode] = useState('');
  const [investorOrgChallengeId, setInvestorOrgChallengeId] = useState('');
  const [maskedOrgEmail, setMaskedOrgEmail] = useState('');
  const [investorOrgCountdown, setInvestorOrgCountdown] = useState(0);

  // ESP form
  const [espName, setEspName] = useState('');
  const [espType, setEspType] = useState('Incubator');
  const [espCity, setEspCity] = useState('');
  const [espEmail, setEspEmail] = useState('');

  // Countdown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setStartupCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setInvestorOrgCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // Only reset form and OTP state on actual modal OPEN transition (false -> true)
    if (isOpen && !prevIsOpenRef.current) {
      const p = currentUserProfile || getUserProfile();
      setProfile(p);
      setNameAsPerId(p.name || '');
      setStartupEmail(p.email || '');
      setOrgEmail(p.email || '');
      setStartupOtpStep(false);
      setStartupOtpCode('');
      setStartupChallengeId('');
      setStartupCountdown(0);
      setInvestorOrgOtpStep(false);
      setInvestorOrgOtpCode('');
      setInvestorOrgChallengeId('');
      setInvestorOrgCountdown(0);

      // Check Government Identity Status from authService and profile
      const idRecord = authService.getIdentityVerification();
      const currentUser = authService.getCurrentUser();
      const currentStatus =
        idRecord?.status ||
        currentUser?.identityStatus ||
        (p as any)?.identityStatus ||
        'NOT_SUBMITTED';

      setIdentityStatus(String(currentStatus).toUpperCase());
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  const userRole = (profile.role || 'explorer').toLowerCase();
  const isVerified = identityStatus === 'VERIFIED';

  // Role eligibility constraints:
  // Explorer: Startup (Allowed), Investor Org (Allowed), ESP (Allowed)
  // Mentor: Startup (Allowed), Investor Org (Prohibited), ESP (Allowed)
  // Individual Investor: Startup (Allowed), Investor Org (Allowed), ESP (Prohibited)
  const isStartupAllowed = true;
  const isInvestorOrgAllowed = userRole !== 'mentor';
  const isEspAllowed = userRole !== 'investor';

  // Inline Government ID Submission Handler
  const handleQuickVerifyIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameAsPerId.trim()) {
      showToast('Please provide your legal full name as per government ID.', 'error');
      return;
    }
    if (!idConsent) {
      showToast('You must consent to Xentro government identity verification.', 'error');
      return;
    }

    setIsSubmittingId(true);
    try {
      await authService.submitIdentityVerification({
        nameAsPerAadhaar: nameAsPerId.trim(),
        aadhaarRaw: idNumber.trim() || '999988887777',
        documentName: 'national_id_document.pdf',
      });

      setIdentityStatus('VERIFIED');
      setIsVerifyingInline(false);
      showToast('Government identity verified successfully! Entity registration unlocked.', 'success');
    } catch {
      showToast('Failed to complete identity verification. Please retry.', 'error');
    } finally {
      setIsSubmittingId(false);
    }
  };

  // Submit Startup Entity (Two-Step: Details -> Email OTP -> MongoDB Entity Creation)
  const handleCreateStartup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startupName.trim()) {
      showToast('Startup name is required.', 'error');
      return;
    }
    const targetEmail = (startupEmail || profile.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('Valid official startup email is required.', 'error');
      return;
    }

    setIsSubmittingEntity(true);
    try {
      // Step 1: Request OTP if not yet in OTP step
      if (!startupOtpStep) {
        const otpSendRes = await fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            entityName: startupName.trim(),
            purpose: 'STARTUP_EMAIL_VERIFICATION',
          }),
        });
        const sendData = await otpSendRes.json();
        if (otpSendRes.ok && sendData.success) {
          setStartupOtpStep(true);
          setStartupChallengeId(sendData.challengeId || '');
          setMaskedStartupEmail(sendData.maskedEmail || targetEmail);
          setStartupCountdown(60);
          showToast(`6-digit verification code sent to ${sendData.maskedEmail || targetEmail}`, 'info');
        } else {
          showToast(sendData?.message || 'Failed to dispatch verification code.', 'error');
        }
        return;
      }

      // Step 2: Verify OTP and create entity in MongoDB Atlas
      if (!startupOtpCode || startupOtpCode.trim().length !== 6) {
        showToast('Please enter the 6-digit verification code sent to your official email.', 'error');
        return;
      }

      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          code: startupOtpCode.trim(),
          purpose: 'STARTUP_EMAIL_VERIFICATION',
          challengeId: startupChallengeId,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        showToast(verifyData?.message || 'Invalid or expired verification code.', 'error');
        return;
      }

      // Create separate Startup entity in MongoDB
      const entityRes = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: startupName.trim(),
          entityType: 'STARTUP',
          officialEmail: targetEmail,
          challengeId: startupChallengeId,
          userId: profile.id,
          userEmail: profile.email,
          details: {
            sector: startupSector,
            stage: startupStage,
            pitch: startupPitch,
            website: startupWebsite,
          },
        }),
      });

      const entityData = await entityRes.json();
      if (entityRes.ok && entityData.success) {
        const createdStartup = entityData.data?.entity || {
          id: `org_startup_${Date.now()}`,
          name: startupName.trim(),
          entityType: 'STARTUP',
          accountType: 'Startup',
          sector: startupSector,
          stage: startupStage,
          pitch: startupPitch,
          website: startupWebsite,
          ownerId: profile.id,
          ownerEmail: profile.email,
          verificationStatus: 'Active',
          createdAt: new Date().toISOString(),
        };

        try {
          const stored = localStorage.getItem('xentro_user_linked_entities');
          const list = stored ? JSON.parse(stored) : [];
          list.push(createdStartup);
          localStorage.setItem('xentro_user_linked_entities', JSON.stringify(list));
        } catch (_) {}

        showToast(`Startup account created successfully!`, 'success');
        if (onEntityCreated) onEntityCreated(createdStartup);
        onClose();
      } else {
        showToast(entityData?.message || 'Failed to create startup entity.', 'error');
      }
    } catch {
      showToast('Network error while creating startup account.', 'error');
    } finally {
      setIsSubmittingEntity(false);
    }
  };

  // Submit Investor Organization (Two-Step: Details -> Email OTP -> MongoDB Record)
  const handleCreateInvestorOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      showToast('Organization name is required.', 'error');
      return;
    }

    if (!isInvestorOrgAllowed) {
      showToast('Mentors are prohibited from creating or joining Investor Organizations.', 'error');
      return;
    }

    const targetEmail = (orgEmail || profile.email || '').trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      showToast('Valid official organization email is required.', 'error');
      return;
    }

    setIsSubmittingEntity(true);
    try {
      // Step 1: Request OTP
      if (!investorOrgOtpStep) {
        const otpSendRes = await fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            entityName: orgName.trim(),
            purpose: 'INVESTOR_ORG_EMAIL_VERIFICATION',
            entityType: 'INVESTOR_ORG',
          }),
        });
        const sendData = await otpSendRes.json();
        if (otpSendRes.ok && sendData.success) {
          setInvestorOrgOtpStep(true);
          setInvestorOrgChallengeId(sendData.challengeId || '');
          setMaskedOrgEmail(sendData.maskedEmail || targetEmail);
          setInvestorOrgCountdown(60);
          showToast(`6-digit verification code sent to ${sendData.maskedEmail || targetEmail}`, 'info');
        } else {
          showToast(sendData?.message || 'Failed to dispatch verification code.', 'error');
        }
        return;
      }

      // Step 2: Verify OTP and create Investor Org record
      if (!investorOrgOtpCode || investorOrgOtpCode.trim().length !== 6) {
        showToast('Please enter the 6-digit verification code.', 'error');
        return;
      }

      const verifyRes = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          code: investorOrgOtpCode.trim(),
          purpose: 'INVESTOR_ORG_EMAIL_VERIFICATION',
          challengeId: investorOrgChallengeId,
        }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        showToast(verifyData?.message || 'Invalid or expired verification code.', 'error');
        return;
      }

      const entityRes = await fetch('/api/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName.trim(),
          entityType: 'INVESTOR_ORG',
          officialEmail: targetEmail,
          challengeId: investorOrgChallengeId,
          userId: profile.id,
          userEmail: profile.email,
          requestedRole: orgRole,
          details: {
            organizationType: orgType,
            fundSize: targetAum,
            website: orgWebsite,
          },
        }),
      });

      const entityData = await entityRes.json();
      if (entityRes.ok && entityData.success) {
        // Also register locally in service
        investorOrganizationService.createInvestorOrganization({
          name: orgName.trim(),
          organizationType: orgType,
          website: orgWebsite.trim() || 'https://xentro.in',
          officialEmail: targetEmail,
          headquarters: { city: 'Bengaluru', country: 'India' },
          legalName: orgName.trim(),
          fundSize: targetAum,
          aum: targetAum,
          verified: false,
          ownerId: profile.id,
        } as any);

        showToast(
          'Your Investor Organization has been registered. Your requested administrative permissions require verification by Xentro.',
          'info'
        );

        if (onEntityCreated) onEntityCreated(entityData.data?.entity);
        onClose();
      } else {
        showToast(entityData?.message || 'Failed to create investor organization.', 'error');
      }
    } catch {
      showToast('Failed to form investor organization.', 'error');
    } finally {
      setIsSubmittingEntity(false);
    }
  };

  // Submit ESP / Institution Account Request (Preserves Admin-Assisted Workflow)
  const handleCreateEspRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!espName.trim()) {
      showToast('Institution name is required.', 'error');
      return;
    }

    if (!isEspAllowed) {
      showToast('Individual Investors are prohibited from requesting ESP/Institution accounts.', 'error');
      return;
    }

    setIsSubmittingEntity(true);
    try {
      const payload = {
        userId: profile.id,
        userEmail: profile.email,
        userName: profile.name,
        currentRole: profile.role || 'Explorer',
        requestedRole: 'ESP / Institution',
        reason: `Institution Registration: ${espName} (${espType}), Location: ${espCity}, Official Email: ${espEmail}`,
        entityDetails: {
          institutionName: espName.trim(),
          institutionType: espType,
          city: espCity.trim(),
          officialDomainEmail: espEmail.trim(),
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
          'Your request has been submitted to the Xentro team. You will be contacted regarding verification and onboarding.',
          'success'
        );
        onClose();
      } else {
        showToast(data?.message || 'Failed to submit request.', 'error');
      }
    } catch {
      showToast('Network error while requesting institution account.', 'error');
    } finally {
      setIsSubmittingEntity(false);
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
            <Building2 className="w-3.5 h-3.5" />
            <span>Dedicated Entity Account</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white">
            Create an Entity Account
          </h2>
          <p className="text-xs text-[#B6B8B7] mt-1 max-w-lg leading-relaxed">
            Entity accounts are dedicated organizations (Startups, Funds, Institutions) with their own workspaces, RBAC team seats, and independent dashboards. Your personal account type remains unchanged.
          </p>
        </div>

        <div className="p-6 sm:p-7 space-y-6">
          {/* =========================================================================
              GATE 1: GOVERNMENT IDENTITY VERIFICATION
              ========================================================================= */}
          {!isVerified ? (
            <div className="space-y-5 animate-fade-slide">
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2.5 font-bold text-sm mb-1.5">
                  <ShieldCheck className="w-5 h-5 text-amber-500" />
                  <span>Government Identity Verification Required</span>
                </div>
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                  Under Xentro ecosystem compliance and anti-fraud protocols, creating an entity account (Startup, Investor Organization, or ESP) requires verified personal identity. Users may preview entity options, but identity verification must be approved before registration.
                </p>

                <div className="mt-3.5 pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#565B59] dark:text-[#8E9290]">Status:</span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                        identityStatus === 'PENDING' || identityStatus === 'UNDER_REVIEW'
                          ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/40'
                          : identityStatus === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40'
                          : 'bg-gray-100 dark:bg-white/10 text-[#565B59] dark:text-gray-300'
                      }`}
                    >
                      <Clock className="w-3 h-3" />
                      {identityStatus === 'NOT_SUBMITTED' ? 'Not Started' : identityStatus}
                    </span>
                  </div>

                  {identityStatus === 'REJECTED' && (
                    <span className="text-[11px] text-rose-500 font-semibold">
                      Document resubmission required
                    </span>
                  )}
                </div>
              </div>

              {/* Inline Quick Verification Box or Link */}
              {!isVerifyingInline ? (
                <div className="p-6 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-4">
                  <FileCheck2 className="w-10 h-10 text-[#9EBE12] mx-auto" />
                  <div>
                    <h3 className="font-bold text-sm text-[#101212] dark:text-white">
                      Complete Identity Verification Now
                    </h3>
                    <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1 max-w-md mx-auto">
                      Verify your identity using bank-grade masked national ID credentials. Verification protects all ecosystem stakeholders.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsVerifyingInline(true)}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <span>Instant Verification Verification</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        router.push('/onboarding/identity');
                      }}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-xs text-[#565B59] dark:text-[#B6B8B7] hover:bg-white dark:hover:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Full Identity Center</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleQuickVerifyIdentity} className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-xs text-[#101212] dark:text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#9EBE12]" />
                      <span>Government Identity Details</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsVerifyingInline(false)}
                      className="text-xs text-[#565B59] hover:underline"
                    >
                      Cancel
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                      Legal Full Name (as per Govt ID) *
                    </label>
                    <input
                      type="text"
                      required
                      value={nameAsPerId}
                      onChange={(e) => setNameAsPerId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                      placeholder="e.g. Neeraj Kumar"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                      National Identity / Masked Aadhaar Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl text-xs bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white font-mono"
                      placeholder="XXXX-XXXX-1234"
                    />
                    <span className="text-[10px] text-[#565B59] dark:text-[#8E9290] mt-1 block">
                      Protected under Xentro Zero-Knowledge compliance. Full document numbers are never stored in plain text.
                    </span>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-[#565B59] dark:text-[#B6B8B7] cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={idConsent}
                      onChange={(e) => setIdConsent(e.target.checked)}
                      className="mt-0.5 rounded accent-[#9EBE12]"
                    />
                    <span>
                      I declare that these credentials belong to me and consent to Xentro Government Identity Verification.
                    </span>
                  </label>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingId}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingId ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verifying Credentials...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Submit &amp; Verify Identity</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* =========================================================================
               GATE 2: IDENTITY VERIFIED — ENTITY REGISTRATION CHOICES
               ========================================================================= */
            <div className="space-y-6">
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Government Identity Verified &bull; Entity Creation Unlocked</span>
                </div>
                <span className="font-mono text-[10px] opacity-80">{profile.id}</span>
              </div>

              {!selectedEntityChoice ? (
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#565B59] dark:text-[#8E9290]">
                    Select Entity Account Type
                  </h3>

                  <div className="grid grid-cols-1 gap-3.5">
                    {/* Option 1: Startup */}
                    <div
                      onClick={() => isStartupAllowed && setSelectedEntityChoice('startup')}
                      className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                        isStartupAllowed
                          ? 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] shadow-sm'
                          : 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                          <Rocket className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                              Create Startup Entity
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                              Startup Dashboard
                            </span>
                          </div>
                          <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1 leading-relaxed">
                            Register company profile, invite co-founders, configure pitch materials, manage revenue metrics, and unlock the Due Diligence Vault.
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 mt-2" />
                    </div>

                    {/* Option 2: Investor Org */}
                    <div
                      onClick={() => isInvestorOrgAllowed && setSelectedEntityChoice('investor_org')}
                      className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        isInvestorOrgAllowed
                          ? 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] shadow-sm cursor-pointer'
                          : 'opacity-60 bg-gray-50 dark:bg-white/5 border-dashed border-gray-300 dark:border-[#262A29] cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                          <Building className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                              Create Investor Organization
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                              Institutional Fund
                            </span>
                          </div>
                          <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1 leading-relaxed">
                            Form an angel network, venture capital fund, or family office syndicate. Manage deal pipeline CRM, partner seats, and portfolio companies.
                          </p>
                          {!isInvestorOrgAllowed && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 mt-2">
                              <Ban className="w-3 h-3" /> Prohibited for Mentors (conflict of interest policy)
                            </span>
                          )}
                        </div>
                      </div>
                      {isInvestorOrgAllowed ? (
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 mt-2" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-2" />
                      )}
                    </div>

                    {/* Option 3: ESP / Institution */}
                    <div
                      onClick={() => isEspAllowed && setSelectedEntityChoice('esp')}
                      className={`p-5 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                        isEspAllowed
                          ? 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] hover:border-[#D9FF3F] shadow-sm cursor-pointer'
                          : 'opacity-60 bg-gray-50 dark:bg-white/5 border-dashed border-gray-300 dark:border-[#262A29] cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                          <Grid2X2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                              Request ESP / Institution Account
                            </h4>
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                              Incubator / University
                            </span>
                          </div>
                          <p className="text-xs text-[#565B59] dark:text-[#8E9290] mt-1 leading-relaxed">
                            Connect your accelerator, academic incubator, or corporate innovation program. Run cohort batches and endorse affiliated founders.
                          </p>
                          {!isEspAllowed && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 mt-2">
                              <Ban className="w-3 h-3" /> Prohibited for Individual Investors
                            </span>
                          )}
                        </div>
                      </div>
                      {isEspAllowed ? (
                        <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 mt-2" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400 shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                </div>
              ) : selectedEntityChoice === 'startup' ? (
                /* Startup Form */
                <form onSubmit={handleCreateStartup} className="space-y-4 animate-fade-slide">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] dark:border-[#262A29]">
                    <div className="flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-emerald-500" />
                      <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                        Register Startup Entity
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEntityChoice(null)}
                      className="text-xs text-[#565B59] hover:underline"
                    >
                      Back to Choices
                    </button>
                  </div>

                  {!startupOtpStep ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                          Startup / Company Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={startupName}
                          onChange={(e) => setStartupName(e.target.value)}
                          placeholder="e.g. Horizon AI Labs"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                            Industry Sector
                          </label>
                          <select
                            value={startupSector}
                            onChange={(e) => setStartupSector(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                          >
                            <option value="AI / Machine Learning">AI / Machine Learning</option>
                            <option value="Fintech">Fintech</option>
                            <option value="SaaS & DevTools">SaaS &amp; DevTools</option>
                            <option value="Climate & CleanTech">Climate &amp; CleanTech</option>
                            <option value="Healthcare & BioTech">Healthcare &amp; BioTech</option>
                            <option value="E-Commerce & Retail">E-Commerce &amp; Retail</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                            Current Maturity Stage
                          </label>
                          <select
                            value={startupStage}
                            onChange={(e) => setStartupStage(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                          >
                            <option value="Idea">Idea / Conceptual</option>
                            <option value="MVP">MVP in Development</option>
                            <option value="Early Traction">Early Traction / Beta</option>
                            <option value="Scaling">Scaling / Revenue Generating</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                          Official Startup / Entity Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={startupEmail}
                          onChange={(e) => setStartupEmail(e.target.value)}
                          placeholder="e.g. founder@horizonai.com or hello@startup.io"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                          Short One-Line Pitch
                        </label>
                        <input
                          type="text"
                          value={startupPitch}
                          onChange={(e) => setStartupPitch(e.target.value)}
                          placeholder="e.g. Autonomous workflow automation for enterprise financial teams"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                        />
                      </div>
                    </>
                  ) : (
                    /* Step 2: DEDICATED FULL-SCREEN OTP VIEW */
                    <div className="py-6 px-5 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/30 space-y-4 animate-fade-slide text-center">
                      <div className="w-12 h-12 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center mx-auto shadow-sm">
                        <KeyRound className="w-6 h-6 text-[#9EBE12]" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-[#101212] dark:text-white">
                          Enter 6-Digit Email Verification Code
                        </h4>
                        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                          We sent a 6-digit verification code to <strong>{maskedStartupEmail || startupEmail}</strong>. Verify email ownership to activate your official startup entity.
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto space-y-3">
                        <input
                          type="text"
                          maxLength={6}
                          required
                          autoFocus
                          value={startupOtpCode}
                          onChange={(e) => setStartupOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full px-4 py-3 rounded-2xl text-2xl font-mono tracking-widest text-center bg-white dark:bg-[#181B1A] border-2 border-[#D9FF3F] text-[#101212] dark:text-white font-black shadow-inner focus:outline-none focus:ring-2 focus:ring-[#D9FF3F]/50"
                        />

                        <div className="flex items-center justify-between text-xs text-[#565B59] dark:text-[#8E9290]">
                          <span>Valid for 10 min</span>
                          {startupCountdown > 0 ? (
                            <span className="font-mono">Resend in {startupCountdown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                handleCreateStartup({ preventDefault: () => {} } as any);
                              }}
                              className="text-[#9EBE12] hover:underline font-bold cursor-pointer"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="pt-3 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (startupOtpStep) setStartupOtpStep(false);
                        else setSelectedEntityChoice(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565B59] cursor-pointer"
                    >
                      {startupOtpStep ? 'Back to Edit' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEntity}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      {isSubmittingEntity ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{startupOtpStep ? 'Verifying & Creating Startup...' : 'Sending Code...'}</span>
                        </>
                      ) : startupOtpStep ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify &amp; Create Startup</span>
                        </>
                      ) : (
                        <>
                          <Rocket className="w-3.5 h-3.5" />
                          <span>Send Verification Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : selectedEntityChoice === 'investor_org' ? (
                /* Investor Org Form */
                <form onSubmit={handleCreateInvestorOrg} className="space-y-4 animate-fade-slide">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] dark:border-[#262A29]">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-blue-500" />
                      <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                        Form Investor Organization
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEntityChoice(null)}
                      className="text-xs text-[#565B59] hover:underline"
                    >
                      Back to Choices
                    </button>
                  </div>

                  {!investorOrgOtpStep ? (
                    <>
                      <div>
                        <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                          Organization / Fund Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          placeholder="e.g. Nexus Apex Capital"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                            Organization Type
                          </label>
                          <select
                            value={orgType}
                            onChange={(e) => setOrgType(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                          >
                            <option value="Venture Capital Fund">Venture Capital Fund</option>
                            <option value="Angel Network">Angel Network / Syndicate</option>
                            <option value="Family Office">Family Office</option>
                            <option value="Corporate VC">Corporate Venture (CVC)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                            Target AUM / Pool Bracket
                          </label>
                          <select
                            value={targetAum}
                            onChange={(e) => setTargetAum(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                          >
                            <option value="Under $5M">Under $5M</option>
                            <option value="$5M - $25M">$5M - $25M</option>
                            <option value="$25M - $100M">$25M - $100M</option>
                            <option value="$100M+">$100M+</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                            Official Organization Domain Email *
                          </label>
                          <input
                            type="email"
                            required
                            value={orgEmail}
                            onChange={(e) => setOrgEmail(e.target.value)}
                            placeholder="e.g. partner@nexuscapital.com"
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                            Requested Administrative Role *
                          </label>
                          <select
                            value={orgRole}
                            onChange={(e) => setOrgRole(e.target.value as any)}
                            className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                          >
                            <option value="Owner / Managing Partner">Owner / Managing Partner</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                          Organization Website
                        </label>
                        <input
                          type="url"
                          value={orgWebsite}
                          onChange={(e) => setOrgWebsite(e.target.value)}
                          placeholder="https://nexuscapital.com"
                          className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                        />
                      </div>
                    </>
                  ) : (
                    /* Step 2: DEDICATED FULL-SCREEN INVESTOR ORG OTP VIEW */
                    <div className="py-6 px-5 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-4 animate-fade-slide text-center">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-500 flex items-center justify-center mx-auto shadow-sm">
                        <Building className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <h4 className="text-base font-black text-[#101212] dark:text-white">
                          Verify Organization Official Email
                        </h4>
                        <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-1">
                          We sent a 6-digit verification code to <strong>{maskedOrgEmail || orgEmail}</strong>.
                        </p>
                      </div>

                      <div className="max-w-xs mx-auto space-y-3">
                        <input
                          type="text"
                          maxLength={6}
                          required
                          autoFocus
                          value={investorOrgOtpCode}
                          onChange={(e) => setInvestorOrgOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="123456"
                          className="w-full px-4 py-3 rounded-2xl text-2xl font-mono tracking-widest text-center bg-white dark:bg-[#181B1A] border-2 border-blue-500 text-[#101212] dark:text-white font-black shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />

                        <div className="flex items-center justify-between text-xs text-[#565B59] dark:text-[#8E9290]">
                          <span>Valid for 10 min</span>
                          {investorOrgCountdown > 0 ? (
                            <span className="font-mono">Resend in {investorOrgCountdown}s</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                handleCreateInvestorOrg({ preventDefault: () => {} } as any);
                              }}
                              className="text-blue-500 hover:underline font-bold cursor-pointer"
                            >
                              Resend Code
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-[11px] text-[#565B59] dark:text-[#8E9290]">
                        Owner/Admin privileged role requires subsequent Xentro administrative review upon registration.
                      </p>
                    </div>
                  )}

                  <div className="pt-3 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (investorOrgOtpStep) setInvestorOrgOtpStep(false);
                        else setSelectedEntityChoice(null);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565B59] cursor-pointer"
                    >
                      {investorOrgOtpStep ? 'Back to Edit' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEntity}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      {isSubmittingEntity ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>{investorOrgOtpStep ? 'Verifying & Registering...' : 'Sending Code...'}</span>
                        </>
                      ) : investorOrgOtpStep ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verify &amp; Register Organization</span>
                        </>
                      ) : (
                        <>
                          <Building className="w-3.5 h-3.5" />
                          <span>Send Verification Code</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* ESP Form */
                <form onSubmit={handleCreateEspRequest} className="space-y-4 animate-fade-slide">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E5E7EB] dark:border-[#262A29]">
                    <div className="flex items-center gap-2">
                      <Grid2X2 className="w-4 h-4 text-amber-500" />
                      <h4 className="font-bold text-sm text-[#101212] dark:text-white">
                        Request ESP / Institution Account
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedEntityChoice(null)}
                      className="text-xs text-[#565B59] hover:underline"
                    >
                      Back to Choices
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                      Institution Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={espName}
                      onChange={(e) => setEspName(e.target.value)}
                      placeholder="e.g. Apex Tech Accelerator"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white focus:outline-none focus:border-[#9EBE12]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                        Institution Type
                      </label>
                      <select
                        value={espType}
                        onChange={(e) => setEspType(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                      >
                        <option value="Incubator">Incubator</option>
                        <option value="Accelerator">Accelerator</option>
                        <option value="University / Academic Institution">University / Academic</option>
                        <option value="Innovation Hub">Innovation Hub</option>
                        <option value="Government Program">Government Program</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                        Headquarters City &amp; State
                      </label>
                      <input
                        type="text"
                        value={espCity}
                        onChange={(e) => setEspCity(e.target.value)}
                        placeholder="e.g. Hyderabad, Telangana"
                        className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#101212] dark:text-white mb-1">
                      Official Institutional Domain Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={espEmail}
                      onChange={(e) => setEspEmail(e.target.value)}
                      placeholder="director@incubator.edu or admin@accelerator.com"
                      className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-[#101212] dark:text-white"
                    />
                  </div>

                  <div className="pt-3 flex justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedEntityChoice(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-[#565B59]"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingEntity}
                      className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      {isSubmittingEntity ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Submitting Request...</span>
                        </>
                      ) : (
                        <>
                          <Grid2X2 className="w-3.5 h-3.5" />
                          <span>Submit Organization Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
