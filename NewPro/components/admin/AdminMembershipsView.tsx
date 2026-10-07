'use client';

import React, { useState, useEffect } from 'react';
import {
  AdminEntityMembership,
  AdminOwnershipRecord,
  AdminInvitationRecord,
  EntityType,
} from '@/types/admin';
import { adminDomainService, INITIAL_OWNERSHIP_RECORDS } from '@/lib/adminDomainService';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
  Eye,
  X,
  Mail,
  Building,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  Ban,
} from 'lucide-react';

const INITIAL_INVITATIONS: AdminInvitationRecord[] = [];

export const AdminMembershipsView: React.FC = () => {
  const [memberships, setMemberships] = useState<AdminEntityMembership[]>([]);
  const [ownerships, setOwnerships] = useState<AdminOwnershipRecord[]>(INITIAL_OWNERSHIP_RECORDS);
  const [invitations] = useState<AdminInvitationRecord[]>(INITIAL_INVITATIONS);
  const [activeTab, setActiveTab] = useState<'Memberships' | 'Ownership Registry' | 'Invitations'>('Memberships');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadData = () => {
    setMemberships(adminDomainService.getMemberships());
    setOwnerships(adminDomainService.getOwnershipRecords());
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('xentro-admin-updated', handleUpdate);
    return () => window.removeEventListener('xentro-admin-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleRevoke = (m: AdminEntityMembership) => {
    const ok = adminDomainService.revokeMembership(m.id, 'Administrative intervention');
    if (ok) {
      showToast(`Membership for ${m.personName} at ${m.entityName} has been revoked.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#101212] text-white border border-[#D9FF3F]/30 shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <Users className="w-3.5 h-3.5" />
            Institutional Governance & Access
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Memberships, Ownership & Invitations
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Administer multi-seat team memberships across Startups, Investor Organizations, and ESPs. Manage ultimate entity ownership and track cross-platform invitations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Active Memberships</div>
            <div className="text-lg font-bold font-sora text-[#101212] dark:text-white">{memberships.length}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Pending Invites</div>
            <div className="text-lg font-bold font-sora text-emerald-700 dark:text-[#D9FF3F]">{invitations.filter(i => i.status === 'Pending').length}</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        {(['Memberships', 'Ownership Registry', 'Invitations'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab
                ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
                : 'text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Tabs */}
      {activeTab === 'Memberships' && (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                <th className="py-3.5 px-4 font-semibold">Operating Person</th>
                <th className="py-3.5 px-4 font-semibold">Entity Organization</th>
                <th className="py-3.5 px-4 font-semibold">Assigned Role</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
                <th className="py-3.5 px-4 font-semibold">Joined / Invited By</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
              {memberships.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-[#101212] dark:text-white">{m.personName}</div>
                    <div className="text-[11px] text-gray-500 dark:text-gray-400">{m.personEmail}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-[#101212] dark:text-white">{m.entityName}</div>
                    <div className="text-[10px] text-emerald-700 dark:text-[#D9FF3F] font-medium">{m.entityType}</div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-[#565B59] dark:text-gray-300">{m.role}</td>
                  <td className="py-3.5 px-4">
                    {m.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                        <Ban className="w-3.5 h-3.5" /> {m.status}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-[11px] text-gray-500 dark:text-gray-400">
                    <div>{m.joinedDate}</div>
                    <div className="text-[10px] text-gray-500">By: {m.invitedBy}</div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {m.status === 'Active' && (
                      <button
                        onClick={() => handleRevoke(m)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-[11px] font-semibold transition-all"
                      >
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'Ownership Registry' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-500/20 text-xs text-[#565B59] dark:text-[#A0A4A2]">
            <p>
              Every institutional entity requires a verified primary owner. Ownership transfers require explicit audit rationale and cannot leave an entity ownerless.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                  <th className="py-3.5 px-4 font-semibold">Entity</th>
                  <th className="py-3.5 px-4 font-semibold">Entity Type</th>
                  <th className="py-3.5 px-4 font-semibold">Current Primary Owner</th>
                  <th className="py-3.5 px-4 font-semibold">Assigned Date</th>
                  <th className="py-3.5 px-4 font-semibold">Dispute State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
                {ownerships.map((o) => (
                  <tr key={o.entityId} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#101212] dark:text-white">{o.entityName}</div>
                      <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">ID: {o.entityId}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#565B59] dark:text-gray-300 font-medium">{o.entityType}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#101212] dark:text-white">{o.currentOwnerName}</div>
                      <div className="text-[11px] text-gray-500 dark:text-gray-400">{o.currentOwnerEmail}</div>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">{o.assignedDate}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <ShieldCheck className="w-3.5 h-3.5" /> Clear ({o.disputeStatus})
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'Invitations' && (
        <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                <th className="py-3.5 px-4 font-semibold">Invited Individual</th>
                <th className="py-3.5 px-4 font-semibold">Target Entity</th>
                <th className="py-3.5 px-4 font-semibold">Pre-Assigned Role</th>
                <th className="py-3.5 px-4 font-semibold">Invited By</th>
                <th className="py-3.5 px-4 font-semibold">Expires Date</th>
                <th className="py-3.5 px-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
              {invitations.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-[#101212] dark:text-white">{inv.inviteeEmail}</td>
                  <td className="py-3.5 px-4 font-medium text-[#101212] dark:text-white">{inv.entityName}</td>
                  <td className="py-3.5 px-4 text-[#565B59] dark:text-gray-300 font-medium">{inv.role}</td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">{inv.inviterName}</td>
                  <td className="py-3.5 px-4 text-gray-500 dark:text-gray-400">{inv.expiresDate}</td>
                  <td className="py-3.5 px-4">
                    {inv.status === 'Accepted' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 font-semibold">
                        <Clock className="w-3.5 h-3.5" /> Pending
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
