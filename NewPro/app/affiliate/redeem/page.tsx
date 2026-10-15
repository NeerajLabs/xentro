'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  XCircle,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';
import { entityContextService } from '@/lib/entityContextService';
import { getUserProfile } from '@/lib/userProfile';

interface InvitationPreview {
  id: string;
  issuingEntityId: string;
  issuingOrgName: string;
  issuingOrgType: 'ESP' | 'Institution';
  issuingLogo?: string | null;
  category: string;
  programName: string;
  cohort: string;
  intendedStartupName?: string | null;
  intendedStartupId?: string | null;
  expiresAt: string;
  isExpired: boolean;
  isRedeemed: boolean;
  isDeclined: boolean;
  isRevoked: boolean;
  isIssuerSuspended?: boolean;
  status: string;
  benefits: string[];
}

function RedeemContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawCode = searchParams.get('code') || '';

  const [code, setCode] = useState(rawCode.trim().toUpperCase());
  const [preview, setPreview] = useState<InvitationPreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [visibilityConsent, setVisibilityConsent] = useState(true);
  const [isDeclined, setIsDeclined] = useState(false);

  // Authenticated context
  const [user, setUser] = useState<any>(null);
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const u = getUserProfile();
      setUser(u);
    } catch {}
    try {
      const eid = entityContextService.getActiveEntityId();
      setActiveEntityId(eid);
    } catch {}
  }, []);

  // Fetch invitation preview
  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/affiliates?previewCode=${encodeURIComponent(code)}`);
        const json = await res.json();

        if (!res.ok || !json.success) {
          setErrorMsg(json.message || 'Invitation not found or invalid.');
          setPreview(null);
          return;
        }

        setPreview(json.data);
      } catch (err: any) {
        setErrorMsg(err.message || 'Error connecting to verification server.');
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [code]);

  const handleAccept = async () => {
    if (!preview) return;

    // Resolve startup entity id and user id
    const resolvedStartupId = activeEntityId || preview.intendedStartupId || 'st_1';
    const resolvedUserId = user?.id || 'founder_user';

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACCEPT',
          code,
          startupEntityId: resolvedStartupId,
          userId: resolvedUserId,
          mutualVisibilityConsent: visibilityConsent,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || 'Failed to accept invitation.');
        return;
      }

      setSuccessMsg(
        json.message ||
          (preview.issuingOrgType === 'ESP'
            ? `Official affiliation established with ${preview.issuingOrgName}! Startup Pro platform unlocked.`
            : `Official affiliation established with ${preview.issuingOrgName}!`)
      );

      // Trigger global event so open dashboards refresh
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('xentro-startup-endorsements-changed'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected error accepting affiliation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!preview) return;

    const resolvedStartupId = activeEntityId || preview.intendedStartupId || 'st_1';
    const resolvedUserId = user?.id || 'founder_user';

    setActionLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DECLINE',
          code,
          startupEntityId: resolvedStartupId,
          userId: resolvedUserId,
          reason: 'Declined by startup founder via direct redemption page',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorMsg(json.message || 'Failed to decline invitation.');
        return;
      }

      setIsDeclined(true);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('xentro-startup-endorsements-changed'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unexpected error declining affiliation.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#101212] text-[#101212] dark:text-white flex flex-col justify-between p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Navigation Bar */}
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between pb-6 border-b border-gray-200 dark:border-[#262A29]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D9FF3F] flex items-center justify-center font-black text-[#101212] text-xl shadow-xs">
            X
          </div>
          <div>
            <span className="text-base font-bold tracking-tight font-sora block text-[#101212] dark:text-white">
              XENTRO
            </span>
            <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] uppercase tracking-wider block font-semibold">
              Affiliation Link System &bull; V1
            </span>
          </div>
        </div>

        <button
          onClick={() => router.push('/')}
          className="text-xs font-semibold text-[#565B59] hover:text-[#101212] dark:text-[#B6B8B7] dark:hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Startup Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl w-full mx-auto my-auto py-8">
        {/* Loading State */}
        {loading && (
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center mx-auto animate-pulse">
              <Award className="w-6 h-6 text-emerald-600 dark:text-[#D9FF3F]" />
            </div>
            <h2 className="text-lg font-bold font-sora">Verifying Affiliation Invitation...</h2>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              Validating cryptographic token hash and organization credentials on Xentro Atlas.
            </p>
          </div>
        )}

        {/* Success Screen */}
        {!loading && successMsg && (
          <div className="bg-white dark:bg-[#181B1A] border border-emerald-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl space-y-6 text-center animate-scale-up">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9 stroke-[2.2]" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Affiliation Formally Established
              </span>
              <h2 className="text-2xl font-bold font-sora text-[#101212] dark:text-white">
                Welcome to {preview?.issuingOrgName}!
              </h2>
              <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto leading-relaxed">
                {successMsg}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-left text-xs space-y-2">
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span>Issuing Partner:</span>
                <strong className="text-[#101212] dark:text-white">{preview?.issuingOrgName}</strong>
              </div>
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span>Program & Cohort:</span>
                <strong className="text-[#101212] dark:text-white">
                  {preview?.programName} ({preview?.cohort})
                </strong>
              </div>
              <div className="flex items-center justify-between text-[#565B59] dark:text-[#B6B8B7]">
                <span>Platform Tier:</span>
                <span className="font-bold text-emerald-600 dark:text-[#D9FF3F]">
                  {preview?.issuingOrgType === 'ESP' ? 'Startup Pro (Sponsored)' : 'Institutional Venture'}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push('/')}
              className="w-full py-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] font-bold text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Launch Startup Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Declined Screen */}
        {!loading && !successMsg && isDeclined && (
          <div className="bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] rounded-3xl p-8 sm:p-10 shadow-xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#202422] text-[#565B59] flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold font-sora">Invitation Declined</h2>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                You have declined the affiliation offer from {preview?.issuingOrgName}. No relationship was created.
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold transition-all"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {/* Error / Not Found / Expired Screen */}
        {!loading && !successMsg && !isDeclined && (!preview || errorMsg) && (
          <div className="bg-white dark:bg-[#181B1A] border border-rose-500/30 rounded-3xl p-8 sm:p-10 shadow-xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold font-sora text-rose-600 dark:text-rose-400">
                Invalid or Expired Invitation
              </h2>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto">
                {errorMsg || 'This single-use affiliation invitation could not be verified or has exceeded its 7-day validity window.'}
              </p>
            </div>

            {/* Manual Code Retry Input */}
            <div className="max-w-sm mx-auto pt-2 space-y-3">
              <input
                type="text"
                placeholder="Enter 16-character code (XENTRO-XXXX-XXXX)"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-mono tracking-wider text-center text-[#101212] dark:text-[#D9FF3F] uppercase focus:outline-hidden focus:border-[#D9FF3F]"
              />
              <button
                onClick={() => {
                  if (code.trim()) {
                    router.push(`/affiliate/redeem?code=${encodeURIComponent(code.trim().toUpperCase())}`);
                  }
                }}
                className="w-full py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                Retry Code Verification
              </button>
            </div>
          </div>
        )}

        {/* Valid Invitation Preview & Acceptance Card */}
        {!loading && !successMsg && !isDeclined && preview && !errorMsg && (
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#262A29] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {preview.issuingOrgType === 'ESP' ? 'Ecosystem Partner Affiliation' : 'Institutional Affiliation'}
                </span>
                <span className="text-[11px] font-medium text-[#565B59] dark:text-[#B6B8B7] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Valid for 7 days</span>
                </span>
              </div>

              <span className="text-[11px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                Code: <strong className="text-[#101212] dark:text-[#D9FF3F]">{code}</strong>
              </span>
            </div>

            {/* Issuing Organization Profile Preview */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D9FF3F]/30 to-emerald-500/20 border border-[#D9FF3F]/40 flex items-center justify-center font-bold text-xl text-[#101212] dark:text-white shrink-0 shadow-xs">
                {preview.issuingOrgName.charAt(0)}
              </div>
              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
                  {preview.issuingOrgName}
                </h1>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Program: <strong className="text-[#101212] dark:text-white font-semibold">{preview.programName}</strong> &bull; Cohort: <strong className="text-[#101212] dark:text-white font-semibold">{preview.cohort}</strong>
                </p>
                {preview.intendedStartupName && (
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    🎯 Designated for: <strong>{preview.intendedStartupName}</strong>
                  </p>
                )}
              </div>
            </div>

            {/* Benefits Included */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7] block">
                Formal Affiliation Entitlements:
              </span>
              <ul className="space-y-2">
                {preview.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs font-semibold text-[#101212] dark:text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Mutual Visibility Consent Toggle (Section 9) */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] cursor-pointer hover:border-[#D9FF3F]/50 transition-colors">
              <input
                type="checkbox"
                checked={visibilityConsent}
                onChange={(e) => setVisibilityConsent(e.target.checked)}
                className="w-4 h-4 accent-[#D9FF3F] shrink-0 mt-0.5"
              />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-[#101212] dark:text-white block">
                  Mutual Public Profile Visibility Consent
                </span>
                <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] block leading-relaxed">
                  Allow this institutional endorsement badge and partnership association to appear on your public Xentro profile.
                </span>
              </div>
            </label>

            {/* Notice: No RBAC mutation */}
            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              🔒 <strong>Data Security & Autonomy:</strong> Affiliation is an independent institutional relationship. It does <em>not</em> grant employee seats, transfer entity ownership, or alter your internal team permissions.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={handleAccept}
                disabled={actionLoading}
                className="w-full sm:flex-1 py-3 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>{actionLoading ? 'Activating Affiliation...' : 'Accept Affiliation & Connect'}</span>
              </button>

              <button
                onClick={handleDecline}
                disabled={actionLoading}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] transition-all cursor-pointer"
              >
                Decline
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center pt-6 border-t border-gray-200 dark:border-[#262A29] text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
        Xentro Technologies &bull; Secure Institutional Affiliation & Entitlement Infrastructure
      </footer>
    </div>
  );
}

export default function AffiliateRedeemPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#101212] flex items-center justify-center text-xs font-bold text-[#565B59]">
          Loading invitation...
        </div>
      }
    >
      <RedeemContent />
    </Suspense>
  );
}
