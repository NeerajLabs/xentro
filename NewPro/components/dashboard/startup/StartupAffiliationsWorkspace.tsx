'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Send,
  Building2,
  FileCheck,
  RefreshCw,
  Copy,
  Link2,
  Globe,
  Eye,
  Trash2,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { entityContextService } from '@/lib/entityContextService';
import { getUserProfile } from '@/lib/userProfile';

export const StartupAffiliationsWorkspace: React.FC = () => {
  const { showToast } = useToast();
  const user = typeof window !== 'undefined' ? getUserProfile() : null;

  const [affiliations, setAffiliations] = useState<any[]>([]);
  const [pendingInvitations, setPendingInvitations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Redeem modal state
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [visibilityConsent, setVisibilityConsent] = useState(true);
  const [isRedeeming, setIsRedeeming] = useState(false);

  // Revoke modal state
  const [selectedForRevoke, setSelectedForRevoke] = useState<any | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);

  const loadAffiliations = async () => {
    const eid = entityContextService.getActiveEntityId() || 'startup_demo_entity';
    try {
      setIsLoading(true);
      setApiError(null);
      const res = await fetch(`/api/affiliates?startupId=${encodeURIComponent(eid)}`);
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        if (Array.isArray(json.data.affiliations)) {
          setAffiliations(json.data.affiliations);
        }
        if (Array.isArray(json.data.links)) {
          setPendingInvitations(json.data.links.filter((l: any) => l.status === 'PENDING' && !l.isRedeemed));
        }
      } else {
        setApiError(json.message || 'Failed to load affiliations from server');
      }
    } catch (err: any) {
      setApiError(err.message || 'Network error loading affiliations');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAffiliations();
  }, []);

  const handleAccept = async (invitation: any) => {
    const eid = entityContextService.getActiveEntityId() || 'startup_demo_entity';
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACCEPT',
          code: invitation.code,
          startupEntityId: eid,
          userId: user?.id,
          startupVisibilityConsent: true,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.message || 'Could not accept affiliation offer', 'error');
        return;
      }
      showToast('Affiliation accepted! Entitlements active.', 'success');
      loadAffiliations();
      window.dispatchEvent(new CustomEvent('xentro-startup-endorsements-changed'));
    } catch (err: any) {
      showToast(err.message || 'Error accepting affiliation', 'error');
    }
  };

  const handleDecline = async (invitation: any) => {
    const eid = entityContextService.getActiveEntityId() || 'startup_demo_entity';
    try {
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DECLINE',
          code: invitation.code,
          startupEntityId: eid,
          userId: user?.id,
          declineReason: 'Declined by founder from Affiliations dashboard',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.message || 'Could not decline affiliation offer', 'error');
        return;
      }
      showToast('Affiliation offer declined.', 'info');
      loadAffiliations();
      window.dispatchEvent(new CustomEvent('xentro-startup-endorsements-changed'));
    } catch (err: any) {
      showToast(err.message || 'Error declining affiliation', 'error');
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!redeemCode.trim()) {
      showToast('Please enter an affiliation invitation code.', 'error');
      return;
    }
    const eid = entityContextService.getActiveEntityId() || 'startup_demo_entity';
    try {
      setIsRedeeming(true);
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACCEPT',
          code: redeemCode.trim(),
          startupEntityId: eid,
          userId: user?.id,
          startupVisibilityConsent: visibilityConsent,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.message || 'Invalid or expired affiliation code.', 'error');
        return;
      }
      showToast('Affiliation code redeemed successfully!', 'success');
      setIsRedeemModalOpen(false);
      setRedeemCode('');
      loadAffiliations();
      window.dispatchEvent(new CustomEvent('xentro-startup-endorsements-changed'));
    } catch (err: any) {
      showToast(err.message || 'Error redeeming affiliation code', 'error');
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleToggleVisibility = async (affiliationId: string, currentConsent: boolean) => {
    const eid = entityContextService.getActiveEntityId() || 'startup_demo_entity';
    try {
      const nextConsent = !currentConsent;
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_VISIBILITY',
          affiliationId,
          entityId: eid,
          entitySide: 'STARTUP',
          visibilityConsent: nextConsent,
          userId: user?.id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.message || 'Failed to update visibility consent', 'error');
        return;
      }
      showToast(`Public visibility ${nextConsent ? 'granted' : 'withheld'}.`, 'info');
      loadAffiliations();
    } catch (err: any) {
      showToast(err.message || 'Error updating visibility', 'error');
    }
  };

  const handleConfirmRevoke = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRevoke) return;
    const eid = entityContextService.getActiveEntityId() || 'startup_demo_entity';
    try {
      setIsRevoking(true);
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REVOKE',
          affiliationId: selectedForRevoke.id,
          revokedBySide: 'STARTUP',
          revokedByUserId: user?.id,
          revocationReason: revokeReason || 'Terminated by startup founder',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.message || 'Failed to terminate affiliation', 'error');
        return;
      }
      showToast('Affiliation relationship terminated.', 'info');
      setSelectedForRevoke(null);
      setRevokeReason('');
      loadAffiliations();
      window.dispatchEvent(new CustomEvent('xentro-startup-endorsements-changed'));
    } catch (err: any) {
      showToast(err.message || 'Error terminating affiliation', 'error');
    } finally {
      setIsRevoking(false);
    }
  };

  const activeAffiliations = affiliations.filter((a) => a.status === 'Active');
  const pastAffiliations = affiliations.filter((a) => a.status === 'Revoked');

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
              <Award className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold font-sora text-[#101212] dark:text-white">
              Institutional Affiliations & Endorsements
            </h2>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Manage official partner incubators (ESP), university accelerators, complimentary Startup Pro entitlements, and public verified badges.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAffiliations}
            disabled={isLoading}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-gray-400 hover:text-[#101212] dark:hover:text-white"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsRedeemModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>Redeem Invite Code</span>
          </button>
        </div>
      </div>

      {apiError && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>Showing offline cached affiliation records: {apiError}</span>
          </div>
          <button onClick={loadAffiliations} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* 2. Inbound Pending Invitations Banner */}
      {pendingInvitations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold font-sora uppercase tracking-wider text-[#565B59] dark:text-[#7A807D]">
            Pending Invitations ({pendingInvitations.length})
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#101212] dark:text-white">
                      {inv.issuingOrgName || 'Incubator / Institution'}
                    </span>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#101212] text-[#D9FF3F] uppercase">
                      {inv.issuingOrgType || 'ESP'}
                    </span>
                  </div>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Program: <strong>{inv.programName || 'Incubation Program'}</strong> &bull; Cohort: {inv.cohort || 'Current Cohort'}
                  </p>
                  <p className="text-[11px] text-[#565B59] dark:text-[#7A807D]">
                    {inv.issuingOrgType === 'ESP'
                      ? '⚡ Accepting grants complimentary Startup Pro platform access for the program duration.'
                      : '🎓 Institutional collaboration badge with academic and talent network.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => handleDecline(inv)}
                    className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#202422]"
                  >
                    Decline
                  </button>
                  <button
                    onClick={() => handleAccept(inv)}
                    className="px-4 py-1.5 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold shadow-2xs hover:opacity-90"
                  >
                    Accept Affiliation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Active Affiliations */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold font-sora uppercase tracking-wider text-[#565B59] dark:text-[#7A807D]">
          Active Relationships ({activeAffiliations.length})
        </h3>

        {activeAffiliations.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-2">
            <Award className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-sm font-bold text-[#101212] dark:text-white">No active affiliations linked</h4>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
              If your startup is incubated by an authorized partner or university, ask your program manager for an invitation link or redeem an invite code.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeAffiliations.map((aff) => {
              const isMutual = aff.mutualVisibilityConsent !== false && aff.startupVisibilityConsent !== false;
              return (
                <div
                  key={aff.id}
                  className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-[#101212] dark:text-white">
                          {aff.issuingOrgName || 'Incubator Partner'}
                        </span>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#D9FF3F] text-[#101212] uppercase">
                          {aff.issuingOrgType || 'ESP'}
                        </span>
                      </div>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        {aff.programName || 'Incubation Program'} &bull; {aff.cohort || 'Cohort 2026'}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedForRevoke(aff)}
                      className="text-xs font-bold text-gray-400 hover:text-red-500"
                      title="Terminate relationship"
                    >
                      Leave
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#565B59] dark:text-[#7A807D]">Entitlement:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{aff.issuingOrgType === 'ESP' ? 'Complimentary Startup Pro' : 'Institutional Badge'}</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#565B59] dark:text-[#7A807D]">Established:</span>
                      <span className="font-medium text-[#101212] dark:text-white">
                        {aff.acceptedAt ? aff.acceptedAt.split('T')[0] : (aff.createdAt ? aff.createdAt.split('T')[0] : 'Active')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#565B59] dark:text-[#7A807D]">Public Badge:</span>
                      <button
                        onClick={() => handleToggleVisibility(aff.id, aff.startupVisibilityConsent !== false)}
                        className={`font-bold underline text-[11px] cursor-pointer ${
                          isMutual ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500'
                        }`}
                      >
                        {isMutual ? 'Visible on Profile (Click to hide)' : 'Hidden (Click to display)'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Past Affiliations History */}
      {pastAffiliations.length > 0 && (
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-bold font-sora uppercase tracking-wider text-[#565B59] dark:text-[#7A807D]">
            Affiliation History (Past / Terminated)
          </h3>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] divide-y divide-gray-100 dark:divide-[#262A29]">
            {pastAffiliations.map((past) => (
              <div key={past.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#101212] dark:text-white">{past.issuingOrgName}</span>
                  <span className="text-[11px] text-[#565B59] dark:text-[#7A807D] ml-2">
                    ({past.programName || 'Program'})
                  </span>
                </div>
                <span className="text-gray-400 text-[11px]">
                  Terminated {past.revokedAt ? past.revokedAt.split('T')[0] : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redeem Code Modal */}
      {isRedeemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#101212] dark:text-white">Redeem Affiliation Code</h3>
              <button onClick={() => setIsRedeemModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRedeemCode} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#101212] dark:text-white block">Invitation Code:</label>
                <input
                  type="text"
                  placeholder="e.g. XENTRO-AB12-CD34"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] font-mono text-xs uppercase"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[#565B59] dark:text-[#B6B8B7]">
                <input
                  type="checkbox"
                  checked={visibilityConsent}
                  onChange={(e) => setVisibilityConsent(e.target.checked)}
                  className="rounded text-[#D9FF3F]"
                />
                <span>Display verified endorsement badge on public profile</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRedeemModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRedeeming}
                  className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold disabled:opacity-50"
                >
                  {isRedeeming ? 'Redeeming...' : 'Activate Affiliation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Relationship Modal */}
      {selectedForRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-[#101212] dark:text-white">
              Terminate Affiliation with {selectedForRevoke.issuingOrgName}?
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              Either party may terminate this relationship at any time. Sponsored platform entitlements derived exclusively from this relationship will revert unless you maintain an independent subscription or another qualifying affiliation.
            </p>

            <form onSubmit={handleConfirmRevoke} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Reason (optional)"
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full p-2 rounded-xl border border-gray-200 dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForRevoke(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-white"
                >
                  Keep Relationship
                </button>
                <button
                  type="submit"
                  disabled={isRevoking}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {isRevoking ? 'Terminating...' : 'Confirm Termination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
