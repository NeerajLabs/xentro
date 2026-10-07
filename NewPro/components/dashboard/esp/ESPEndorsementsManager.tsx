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
  Filter,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Send,
  Building2,
  FileCheck,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  ESPEndorsement,
  ESPRelationshipType,
} from '@/types/esp';
import {
  getStoredESPEndorsements,
  saveStoredESPEndorsements,
} from '@/data/espWorkspaceData';
import { logAuditEvent, evaluateEndorsementEntitlement } from '@/lib/espDomainService';
import { getUserProfile } from '@/lib/userProfile';
import {
  Eye,
  Edit3,
  CalendarPlus,
  History as HistoryIcon,
} from 'lucide-react';

export const ESPEndorsementsManager: React.FC = () => {
  const { showToast } = useToast();
  const user = typeof window !== 'undefined' ? getUserProfile() : null;
  const actorName = user?.name || 'Administrator';
  const actorRole = user?.roleTitle || 'Primary Admin / Owner';

  const [endorsements, setEndorsements] = useState<ESPEndorsement[]>([]);
  const [activeTab, setActiveTab] = useState<
    'all' | 'active' | 'expiring' | 'pending' | 'expired' | 'revoked' | 'history'
  >('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [isEndorseModalOpen, setIsEndorseModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Endorse Modal Form State (9-step conceptual progression in 5 UI steps)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [startupSearchTerm, setStartupSearchTerm] = useState('');
  const [selectedStartupName, setSelectedStartupName] = useState('');
  const [relationshipType, setRelationshipType] = useState<ESPRelationshipType>('Incubated');
  const [programName, setProgramName] = useState('');
  const [cohortName, setCohortName] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split('T')[0];
  });
  const [grantEntitlement, setGrantEntitlement] = useState(true);
  const [notes, setNotes] = useState('');
  const [chkBoardApproval, setChkBoardApproval] = useState(false);
  const [chkIdentityVerified, setChkIdentityVerified] = useState(false);
  const [chkDpiitChecked, setChkDpiitChecked] = useState(false);
  const [legalDeclaration, setLegalDeclaration] = useState(false);

  // Modals for actions
  const [selectedForView, setSelectedForView] = useState<ESPEndorsement | null>(null);
  const [selectedForEdit, setSelectedForEdit] = useState<ESPEndorsement | null>(null);
  const [selectedForExtend, setSelectedForExtend] = useState<ESPEndorsement | null>(null);
  const [selectedForRevoke, setSelectedForRevoke] = useState<ESPEndorsement | null>(null);
  const [selectedForHistory, setSelectedForHistory] = useState<ESPEndorsement | null>(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [extendMonths, setExtendMonths] = useState<number>(12);

  // Invite Modal State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStartupName, setInviteStartupName] = useState('');

  useEffect(() => {
    setEndorsements(getStoredESPEndorsements());
  }, []);

  const activeCount = endorsements.filter((e) => e.status === 'active').length;
  const expiringCount = endorsements.filter((e) => e.status === 'expiring_soon').length;
  const pendingCount = endorsements.filter((e) => e.status === 'pending').length;
  const revokedCount = endorsements.filter((e) => e.status === 'revoked' || e.status === 'expired').length;

  const filteredEndorsements = endorsements.filter((e) => {
    if (activeTab === 'active' && e.status !== 'active') return false;
    if (activeTab === 'pending' && e.status !== 'pending') return false;
    if (activeTab === 'expiring' && e.status !== 'expiring_soon') return false;
    if (activeTab === 'expired' && e.status !== 'revoked' && e.status !== 'expired') return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.startupName.toLowerCase().includes(q) ||
      (e.relationshipType?.toLowerCase().includes(q) ?? false) ||
      e.programName.toLowerCase().includes(q)
    );
  });

  const handleCompleteEndorsement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalDeclaration) {
      showToast('Please confirm the legal accreditation declaration.', 'error');
      return;
    }

    const entitlementCalc = evaluateEndorsementEntitlement(relationshipType, 'active');

    const newEndorsement: ESPEndorsement = {
      id: `end_${Date.now()}`,
      startupId: `st_${Date.now()}`,
      startupName: selectedStartupName,
      startupLogo: '/images/profile_avatar.webp',
      relationshipType,
      status: 'active',
      programName,
      cohortName,
      startDate,
      endDate,
      issuedAt: new Date().toISOString().split('T')[0],
      expiresAt: endDate,
      endorsedBy: `${actorName} (${user?.roleTitle || 'Director'})`,
      startupProEntitlementGranted: entitlementCalc.eligibleForStartupPro && grantEntitlement,
      entitlement: entitlementCalc.tier,
      verificationChecklist: {
        institutionalAffiliationVerified: true,
        foundersIdentityVerified: chkIdentityVerified,
        governanceAndComplianceCleared: chkDpiitChecked,
        resolutionApproved: chkBoardApproval,
      },
      notes,
      history: [
        {
          action: 'Endorsement Issued',
          timestamp: new Date().toLocaleDateString(),
          actor: actorName,
          note: `Conferred official ${relationshipType} affiliation for ${programName}.`,
        },
      ],
    };

    const updated = [newEndorsement, ...endorsements];
    setEndorsements(updated);
    saveStoredESPEndorsements(updated);

    logAuditEvent(
      'Endorsement Created',
      'Endorsement',
      actorName,
      actorRole,
      `Issued Verified ESP Endorsement to ${selectedStartupName} (${relationshipType}). Startup Pro entitlement granted.`
    );

    showToast(`Issued Verified ESP Endorsement to ${selectedStartupName}!`, 'success');
    setIsEndorseModalOpen(false);
    setCurrentStep(1);
  };

  const handleConfirmRevoke = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForRevoke) return;

    const updated = endorsements.map((e) =>
      e.id === selectedForRevoke.id
        ? {
            ...e,
            status: 'revoked' as const,
            history: [
              ...(e.history || []),
              {
                action: 'Endorsement Revoked',
                timestamp: new Date().toLocaleDateString(),
                actor: actorName,
                note: revokeReason,
              },
            ],
          }
        : e
    );
    setEndorsements(updated);
    saveStoredESPEndorsements(updated);

    logAuditEvent(
      'Endorsement Revoked',
      'Endorsement',
      actorName,
      actorRole,
      `Revoked endorsement for ${selectedForRevoke.startupName}. Reason: ${revokeReason}`
    );

    showToast(`Revoked endorsement for ${selectedForRevoke.startupName}. Entitlements suspended.`, 'info');
    setSelectedForRevoke(null);
  };

  const handleConfirmExtend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForExtend) return;

    const currentExpiry = new Date(selectedForExtend.expiresAt || Date.now());
    currentExpiry.setMonth(currentExpiry.getMonth() + extendMonths);
    const newExpiryStr = currentExpiry.toISOString().split('T')[0];

    const updated = endorsements.map((e) =>
      e.id === selectedForExtend.id
        ? {
            ...e,
            status: 'active' as const,
            expiresAt: newExpiryStr,
            history: [
              ...(e.history || []),
              {
                action: `Endorsement Extended by +${extendMonths} Months`,
                timestamp: new Date().toLocaleDateString(),
                actor: actorName,
                note: `Extended validity through ${newExpiryStr}`,
              },
            ],
          }
        : e
    );
    setEndorsements(updated);
    saveStoredESPEndorsements(updated);

    logAuditEvent(
      'Endorsement Extended',
      'Endorsement',
      actorName,
      actorRole,
      `Extended endorsement for ${selectedForExtend.startupName} by +${extendMonths} months (New Expiry: ${newExpiryStr})`
    );

    showToast(`Extended endorsement for ${selectedForExtend.startupName} to ${newExpiryStr}`, 'success');
    setSelectedForExtend(null);
  };

  const handleRenew = (id: string, name: string) => {
    const updated = endorsements.map((e) =>
      e.id === id
        ? {
            ...e,
            status: 'active' as const,
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            history: [
              ...(e.history || []),
              {
                action: 'Endorsement Renewed',
                timestamp: new Date().toLocaleDateString(),
                actor: actorName,
                note: 'Annual renewal approved.',
              },
            ],
          }
        : e
    );
    setEndorsements(updated);
    saveStoredESPEndorsements(updated);

    logAuditEvent(
      'Endorsement Renewed',
      'Endorsement',
      actorName,
      actorRole,
      `Renewed active endorsement for ${name} for +12 months.`
    );
    showToast(`Renewed endorsement for ${name} by +12 months.`, 'success');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForEdit) return;

    const updated = endorsements.map((item) =>
      item.id === selectedForEdit.id ? selectedForEdit : item
    );
    setEndorsements(updated);
    saveStoredESPEndorsements(updated);

    logAuditEvent(
      'Endorsement Updated',
      'Endorsement',
      actorName,
      actorRole,
      `Updated parameters and notes for ${selectedForEdit.startupName}.`
    );
    showToast(`Updated endorsement record for ${selectedForEdit.startupName}`, 'success');
    setSelectedForEdit(null);
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    logAuditEvent(
      'Member Invited',
      'Members',
      actorName,
      actorRole,
      `Sent onboarding invite to ${inviteEmail} for startup ${inviteStartupName}`
    );
    showToast(`Sent onboarding invite to ${inviteEmail} for ${inviteStartupName}!`, 'success');
    setInviteEmail('');
    setInviteStartupName('');
    setIsInviteModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Actions */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Institutional Endorsement Engine
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]">
              Startup Pro Granting Authority
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Issue verified institutional affiliations, non-dilutive support credentials, and ecosystem verification badges.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsInviteModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Invite External Startup</span>
          </button>

          <button
            onClick={() => {
              setCurrentStep(1);
              setIsEndorseModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>+ Endorse Startup</span>
          </button>
        </div>
      </div>

      {/* 1. Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Active Endorsements
          </span>
          <p className="text-2xl font-bold font-sora text-emerald-600 dark:text-emerald-400">
            {activeCount}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Active Startup Pro grants
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Expiring Within 30 Days
          </span>
          <p className="text-2xl font-bold font-sora text-amber-500">
            {expiringCount}
          </p>
          <p className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
            Action required: Renew
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Pending Approval
          </span>
          <p className="text-2xl font-bold font-sora text-cyan-500">
            {pendingCount}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Under academic review
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-1.5">
          <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] block">
            Revoked / Inactive
          </span>
          <p className="text-2xl font-bold font-sora text-[#565B59] dark:text-[#B6B8B7]">
            {revokedCount}
          </p>
          <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
            Archived credential log
          </p>
        </div>
      </div>

      {/* 2. Subnav & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] overflow-x-auto no-scrollbar">
          {[
            { id: 'active', label: `Active (${activeCount})` },
            { id: 'pending', label: `Pending (${pendingCount})` },
            { id: 'expiring', label: `Expiring Soon (${expiringCount})` },
            { id: 'expired', label: `Expired (${revokedCount})` },
            { id: 'history', label: 'History' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                  : 'text-[#565B59] dark:text-[#B6B8B7]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#565B59]" />
          <input
            type="text"
            placeholder="Search endorsed startups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
          />
        </div>
      </div>

      {/* 3. Endorsements Table */}
      {/* 3. Endorsements Table / History Table */}
      <div className="rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] bg-white dark:bg-[#181B1A] overflow-hidden shadow-subtle">
        {activeTab === 'history' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Action / Event</th>
                  <th className="py-3 px-4">Startup Entity</th>
                  <th className="py-3 px-4">Authorized Actor</th>
                  <th className="py-3 px-4">Relationship</th>
                  <th className="py-3 px-4">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-[#101212] dark:text-white">
                {(() => {
                  const historyItems = endorsements.flatMap((e) =>
                    (e.history || []).map((h, idx) => ({
                      key: `${e.id}-${idx}`,
                      date: h.timestamp,
                      action: h.action,
                      startup: e.startupName,
                      actor: h.actor || 'System',
                      rel: e.relationshipType || 'Affiliated',
                      note: h.note || '',
                    }))
                  );
                  if (historyItems.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                          No endorsement audit history recorded yet.
                        </td>
                      </tr>
                    );
                  }
                  return historyItems.map((item) => (
                    <tr key={item.key} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#101212] dark:text-white">{item.action}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#101212] dark:text-white">
                        {item.startup}
                      </td>
                      <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                        {item.actor}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                          {item.rel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        {item.note}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-[#202422] border-b border-gray-100 dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] uppercase font-bold text-[10px]">
                <tr>
                  <th className="py-3 px-4">Startup Entity</th>
                  <th className="py-3 px-4">Relationship Type</th>
                  <th className="py-3 px-4">Program / Cohort</th>
                  <th className="py-3 px-4">Entitlement Status</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-[#101212] dark:text-white">
              {filteredEndorsements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                    No endorsements found in this view. Click &quot;Endorse Startup&quot; to grant institutional endorsement.
                  </td>
                </tr>
              ) : (
                filteredEndorsements.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={e.startupLogo || '/images/profile_avatar.webp'}
                        alt={e.startupName}
                        className="w-8 h-8 rounded-xl object-cover border border-gray-200 dark:border-[#262A29]"
                      />
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{e.startupName}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500/20" />
                        </div>
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                          Endorsed by: {e.endorsedBy}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F]">
                      {e.relationshipType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                    <span className="font-medium text-[#101212] dark:text-white block">{e.programName}</span>
                    <span className="text-[10px]">{e.cohortName || 'General Portfolio'}</span>
                  </td>
                  <td className="py-3.5 px-4">
                    {e.status === 'active' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Startup Pro Granted</span>
                      </span>
                    )}
                    {e.status === 'expiring_soon' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1 w-fit">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Expiring Soon</span>
                      </span>
                    )}
                    {e.status === 'pending' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 flex items-center gap-1 w-fit">
                        <Clock className="w-3 h-3" />
                        <span>Pending Approval</span>
                      </span>
                    )}
                    {e.status === 'revoked' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1 w-fit">
                        <XCircle className="w-3 h-3" />
                        <span>Revoked</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[#565B59] dark:text-[#B6B8B7]">
                    {e.expiresAt}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* 1. View Details */}
                      <button
                        onClick={() => setSelectedForView(e)}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors cursor-pointer"
                        title="View Full Endorsement Details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {/* 2. Edit Endorsement */}
                      <button
                        onClick={() => setSelectedForEdit(e)}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors cursor-pointer"
                        title="Edit Relationship & Parameters"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      {/* 3. Extend Validity */}
                      <button
                        onClick={() => setSelectedForExtend(e)}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors cursor-pointer"
                        title="Extend Endorsement (+6 / +12 Mo)"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" />
                      </button>

                      {/* 4. Renew Status */}
                      {(e.status === 'expiring_soon' || e.status === 'expired' || e.status === 'revoked') && (
                        <button
                          onClick={() => handleRenew(e.id, e.startupName)}
                          className="px-2 py-1 rounded-lg text-[11px] font-bold bg-[#D9FF3F] text-[#101212] hover:bg-[#C7F020] transition-colors cursor-pointer flex items-center gap-1"
                          title="Renew Endorsement for 12 Months"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Renew</span>
                        </button>
                      )}

                      {/* 5. Revoke Endorsement */}
                      {e.status === 'active' && (
                        <button
                          onClick={() => setSelectedForRevoke(e)}
                          className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          title="Revoke Endorsement Credentials"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* 6. View History */}
                      <button
                        onClick={() => setSelectedForHistory(e)}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white transition-colors cursor-pointer"
                        title="View Endorsement Audit History"
                      >
                        <HistoryIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* 4. Multi-Step Endorsement Modal (9-Step Progression in 5 Steps) */}
      {isEndorseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Issue Verified ESP Endorsement
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Step {currentStep} of 5: Accreditation & Pro Entitlement Issuance
                </p>
              </div>
              <button
                onClick={() => setIsEndorseModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Progress Pills */}
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 rounded-full ${
                    currentStep >= s
                      ? 'bg-[#D9FF3F]'
                      : 'bg-gray-200 dark:bg-[#202422]'
                  }`}
                />
              ))}
            </div>

            {/* Step 1: Search Startup & Select Startup */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  1. Search & Select Startup Entity
                </h4>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Startup Entity Name</label>
                  <input
                    type="text"
                    placeholder="Enter startup name to endorse..."
                    value={selectedStartupName}
                    onChange={(e) => setSelectedStartupName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                {selectedStartupName && (
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Selected: <span className="font-bold text-[#101212] dark:text-white">{selectedStartupName}</span>. Endorsement links this startup to your verified institution and enables the Verified ESP Endorsement badge on their public profile.
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => {
                      if (!selectedStartupName.trim()) {
                        showToast('Please enter a startup name to continue', 'error');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Select Relationship</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Select Relationship */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  2. Select Institutional Relationship
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(
                    [
                      'Pre-Incubated',
                      'Incubated',
                      'Accelerated',
                      'Portfolio Startup',
                      'Program Participant',
                      'Alumni Startup',
                      'Institution-Supported Startup',
                    ] as ESPRelationshipType[]
                  ).map((rel) => (
                    <button
                      key={rel}
                      type="button"
                      onClick={() => setRelationshipType(rel)}
                      className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between cursor-pointer transition-all ${
                        relationshipType === rel
                          ? 'bg-[#D9FF3F]/20 border-[#D9FF3F] text-[#101212] dark:text-[#D9FF3F]'
                          : 'bg-gray-50 dark:bg-[#202422] border-gray-200 dark:border-[#262A29] text-[#101212] dark:text-white'
                      }`}
                    >
                      <span>{rel}</span>
                      {relationshipType === rel && <Check className="w-4 h-4 text-[#D9FF3F]" />}
                    </button>
                  ))}
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Program & Cohort</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Select Program & Select Cohort */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  3. Select Program & Cohort
                </h4>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Institutional Program
                  </label>
                  <select
                    value={programName}
                    onChange={(e) => setProgramName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    <option value="Lab32 - Scale Acceleration Cohort 12">Lab32 - Scale Acceleration Program</option>
                    <option value="Boeing India Aviation Innovation Challenge">Boeing India Aviation Challenge</option>
                    <option value="T-Angel Seed Investment Program">T-Angel Seed Investment Program</option>
                    <option value="RubriX - Product Formulation Bootcamp">RubriX - Product Formulation Bootcamp</option>
                    <option value="General Institutional Incubation Track">General Institutional Incubation Track</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">
                    Cohort Assignment
                  </label>
                  <input
                    type="text"
                    value={cohortName}
                    onChange={(e) => setCohortName(e.target.value)}
                    placeholder="e.g. Cohort 12 (Fall 2026)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(4)}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Set Dates</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Set Start Date & Set End Date */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  4. Set Validity Period
                </h4>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setMonth(d.getMonth() + 6);
                      setEndDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] text-xs font-bold hover:border-[#D9FF3F] text-[#101212] dark:text-white cursor-pointer"
                  >
                    6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 1);
                      setEndDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-[#D9FF3F] bg-[#D9FF3F]/10 text-xs font-bold text-[#101212] dark:text-[#D9FF3F] cursor-pointer"
                  >
                    12 Months (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setFullYear(d.getFullYear() + 2);
                      setEndDate(d.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-[#262A29] text-xs font-bold hover:border-[#D9FF3F] text-[#101212] dark:text-white cursor-pointer"
                  >
                    24 Months
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101212] dark:text-white">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#101212] dark:text-white">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#101212] dark:text-white">Endorsement Verification Notes</label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setCurrentStep(5)}
                    className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Entitlement & Review</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 5: Determine Entitlement Eligibility & Send Endorsement Request */}
            {currentStep === 5 && (
              <form onSubmit={handleCompleteEndorsement} className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#B6B8B7]">
                  5. Determine Entitlement Eligibility & Confirmation
                </h4>

                <div className="p-4 rounded-xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#101212] dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#D9FF3F]" />
                      <span>Startup Pro Entitlement (Non-Dilutive Grant)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      Eligible
                    </span>
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    Includes $150K cloud & prototyping credits, institutional due diligence locker verification, and direct investor syndicate introductions.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#565B59]">Startup:</span>
                    <span className="font-bold text-[#101212] dark:text-white">{selectedStartupName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565B59]">Relationship:</span>
                    <span className="font-bold text-[#D9FF3F]">{relationshipType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565B59]">Program:</span>
                    <span className="font-bold text-[#101212] dark:text-white">{programName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#565B59]">Period:</span>
                    <span className="font-medium text-[#101212] dark:text-white">{startDate} to {endDate}</span>
                  </div>
                </div>

                <label className="flex items-start gap-2.5 text-xs text-[#565B59] dark:text-[#B6B8B7] cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={legalDeclaration}
                    onChange={(e) => setLegalDeclaration(e.target.checked)}
                    className="w-4 h-4 accent-[#D9FF3F] shrink-0 mt-0.5"
                  />
                  <span>
                    I confirm as an authorized institutional representative that this venture is actively enrolled and meets our ecosystem qualification criteria.
                  </span>
                </label>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                  >
                    Send Endorsement Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal: View Endorsement Details */}
      {selectedForView && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div className="flex items-center gap-3">
                <img
                  src={selectedForView.startupLogo || '/images/profile_avatar.webp'}
                  alt={selectedForView.startupName}
                  className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-[#262A29]"
                />
                <div>
                  <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                    {selectedForView.startupName}
                  </h3>
                  <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    Endorsement Record #{selectedForView.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedForView(null)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59]">Relationship Type</span>
                <p className="font-bold text-[#101212] dark:text-white">{selectedForView.relationshipType}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59]">Program</span>
                <p className="font-bold text-[#101212] dark:text-white">{selectedForView.programName}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59]">Cohort</span>
                <p className="font-bold text-[#101212] dark:text-white">{selectedForView.cohortName || 'General Portfolio'}</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-[#565B59]">Expiry Date</span>
                <p className="font-bold text-[#101212] dark:text-white">{selectedForView.expiresAt}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#D9FF3F]/10 border border-[#D9FF3F]/30 text-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#101212] dark:text-white block">Entitlement Conferred</span>
              <p className="font-bold text-[#101212] dark:text-white">{selectedForView.entitlement || 'Startup Pro Entitlement (12 Months)'}</p>
            </div>

            {selectedForView.notes && (
              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-[#565B59] block">Verification Notes</span>
                <p className="text-[#565B59] dark:text-[#B6B8B7]">{selectedForView.notes}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedForView(null)}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Endorsement */}
      {selectedForEdit && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Edit Endorsement
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {selectedForEdit.startupName}
                </p>
              </div>
              <button
                onClick={() => setSelectedForEdit(null)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Relationship Type</label>
                <select
                  value={selectedForEdit.relationshipType}
                  onChange={(e) =>
                    setSelectedForEdit({
                      ...selectedForEdit,
                      relationshipType: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                >
                  {[
                    'Pre-Incubated',
                    'Incubated',
                    'Accelerated',
                    'Portfolio Startup',
                    'Program Participant',
                    'Alumni Startup',
                    'Institution-Supported Startup',
                  ].map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Program</label>
                <input
                  type="text"
                  value={selectedForEdit.programName}
                  onChange={(e) => setSelectedForEdit({ ...selectedForEdit, programName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Notes</label>
                <textarea
                  rows={2}
                  value={selectedForEdit.notes || ''}
                  onChange={(e) => setSelectedForEdit({ ...selectedForEdit, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForEdit(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Extend Endorsement */}
      {selectedForExtend && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Extend Validity Period
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {selectedForExtend.startupName}
                </p>
              </div>
              <button
                onClick={() => setSelectedForExtend(null)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmExtend} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Extension Duration</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setExtendMonths(6)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                      extendMonths === 6
                        ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#101212] dark:text-[#D9FF3F]'
                        : 'border-gray-200 dark:border-[#262A29] text-[#565B59]'
                    }`}
                  >
                    +6 Months
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtendMonths(12)}
                    className={`p-3 rounded-xl border text-xs font-bold text-center cursor-pointer ${
                      extendMonths === 12
                        ? 'border-[#D9FF3F] bg-[#D9FF3F]/10 text-[#101212] dark:text-[#D9FF3F]'
                        : 'border-gray-200 dark:border-[#262A29] text-[#565B59]'
                    }`}
                  >
                    +12 Months (Recommended)
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForExtend(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Confirm Extension
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Revoke Endorsement */}
      {selectedForRevoke && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-rose-600 dark:text-rose-400 font-heading">
                  Revoke Institutional Endorsement
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Venture: {selectedForRevoke.startupName}
                </p>
              </div>
              <button
                onClick={() => setSelectedForRevoke(null)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmRevoke} className="space-y-4">
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                Revoking this endorsement will suspend the Verified ESP Endorsement badge on their profile and terminate complimentary Startup Pro entitlements.
              </p>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">Reason for Revocation</label>
                <input
                  type="text"
                  required
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedForRevoke(null)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Confirm Revocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: History Timeline */}
      {selectedForHistory && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Endorsement Audit History
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {selectedForHistory.startupName}
                </p>
              </div>
              <button
                onClick={() => setSelectedForHistory(null)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {(selectedForHistory.history || [
                { action: 'Endorsement Approved', timestamp: selectedForHistory.issuedAt || '2026-01-15', actor: selectedForHistory.endorsedBy, note: 'Initial accreditation.' }
              ]).map((h, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#101212] dark:text-white">{h.action}</span>
                    <span className="text-[10px] text-[#565B59]">{h.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{h.note}</p>
                  {h.actor && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                      Actor: {h.actor}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedForHistory(null)}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] text-[#101212] text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Invite External Startup Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white font-heading">
                  Invite Startup to Ecosystem
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Send official incubation invitation to onboard on Xentro
                </p>
              </div>
              <button
                onClick={() => setIsInviteModalOpen(false)}
                className="p-1 rounded-lg text-[#565B59] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  Startup Venture Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NextGen Biotics"
                  value={inviteStartupName}
                  onChange={(e) => setInviteStartupName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#101212] dark:text-white">
                  Founder Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="founder@venture.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-[#262A29] text-xs font-bold text-[#565B59] dark:text-[#B6B8B7] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 cursor-pointer"
                >
                  Send Onboarding Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

