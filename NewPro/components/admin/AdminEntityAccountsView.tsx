'use client';

import React, { useState, useEffect } from 'react';
import { AdminEntityAccount, EntityType } from '@/types/admin';
import { adminDomainService, logAdminAudit } from '@/lib/adminDomainService';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { getAdminSession } from '@/lib/adminAuth';
import {
  Building2,
  Building,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  Users,
  Mail,
  Globe,
  Sparkles,
  Lock,
  ArrowRight,
  Shield,
  Layers,
  ChevronRight,
  Ban,
  UserCheck,
} from 'lucide-react';

export const AdminEntityAccountsView: React.FC = () => {
  const [entities, setEntities] = useState<AdminEntityAccount[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Startup' | 'Investor Organization' | 'ESP' | 'Pending Verification'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [drawerEntity, setDrawerEntity] = useState<AdminEntityAccount | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [transferOwnerModalOpen, setTransferOwnerModalOpen] = useState(false);
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newOwnerEmail, setNewOwnerEmail] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const loadData = async () => {
    let entitiesList: any[] = [];
    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/admin/entities/`);
      if (resp.ok) {
        const d = await resp.json();
        entitiesList = d?.data?.entities || [];
      }
    } catch (e) {
      console.warn('Could not fetch entities from primary backend, falling back to local DB sync:', e);
    }

    if (!entitiesList.length) {
      try {
        const localResp = await fetch('/api/admin/entities');
        if (localResp.ok) {
          const localData = await localResp.json();
          entitiesList = localData?.data?.entities || [];
        }
      } catch (_) {}
    }

    setEntities(entitiesList);
  };

  const handleDeleteEntity = async (entity: AdminEntityAccount) => {
    if (!confirm(`Are you sure you want to permanently remove entity "${entity.name}"?`)) return;
    try {
      const backendUrl = getBackendBaseUrl();
      const session = getAdminSession();
      const resp = await fetch(`${backendUrl}/admin/entities/${entity.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.token ? { 'Authorization': `Bearer ${session.token}` } : {})
        },
        body: JSON.stringify({ reason: `Entity removed by Master Admin.` })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Entity "${entity.name}" successfully removed.`);
        if (drawerEntity?.id === entity.id) {
          setDrawerEntity(null);
        }
        loadData();
      } else {
        showToast(data?.message || 'Failed to remove entity.');
      }
    } catch {
      showToast('Network error while removing entity.');
    }
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

  const filteredEntities = entities.filter((ent) => {
    if (activeTab === 'Startup' && ent.type !== 'Startup') return false;
    if (activeTab === 'Investor Organization' && ent.type !== 'Investor Organization') return false;
    if (activeTab === 'ESP' && ent.type !== 'ESP') return false;
    if (activeTab === 'Pending Verification' && ent.verificationStatus !== 'Pending' && ent.verificationStatus !== 'Under Review') return false;

    if (statusFilter !== 'All' && ent.status !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ent.name.toLowerCase().includes(q);
      const matchEmail = ent.officialEmail.toLowerCase().includes(q);
      const matchOwner = ent.primaryOwner.name.toLowerCase().includes(q);
      const matchDomain = ent.domain?.toLowerCase().includes(q) || false;
      return matchName || matchEmail || matchOwner || matchDomain;
    }
    return true;
  });

  const handleToggleVerification = (entity: AdminEntityAccount) => {
    const nextVerif = entity.verificationStatus === 'Verified' ? 'Unverified' : 'Verified';
    const store = adminDomainService.getEntityAccounts();
    const target = store.find((e) => e.id === entity.id);
    if (target) {
      target.verificationStatus = nextVerif as any;
      logAdminAudit('ENTITY_VERIFICATION_TOGGLED', 'Entity Management', `Set verification status of ${entity.name} to ${nextVerif}`, entity.id);
      showToast(`Verification status for ${entity.name} updated to ${nextVerif}.`);
      setEntities([...store]);
      if (drawerEntity && drawerEntity.id === entity.id) {
        setDrawerEntity({ ...drawerEntity, verificationStatus: nextVerif as any });
      }
    }
  };

  const handleToggleSuspension = (entity: AdminEntityAccount) => {
    const nextStatus = entity.status === 'Suspended' ? 'Active' : 'Suspended';
    const store = adminDomainService.getEntityAccounts();
    const target = store.find((e) => e.id === entity.id);
    if (target) {
      target.status = nextStatus as any;
      logAdminAudit('ENTITY_STATUS_TOGGLED', 'Entity Management', `Set status of ${entity.name} to ${nextStatus}`, entity.id);
      showToast(`Status for ${entity.name} modified to ${nextStatus}.`);
      setEntities([...store]);
      if (drawerEntity && drawerEntity.id === entity.id) {
        setDrawerEntity({ ...drawerEntity, status: nextStatus as any });
      }
    }
  };

  const handleTransferOwnership = (e: React.FormEvent) => {
    e.preventDefault();
    if (!drawerEntity || !newOwnerName.trim() || !newOwnerEmail.trim() || !transferReason.trim()) return;

    const ok = adminDomainService.transferOwnership(drawerEntity.id, newOwnerName, newOwnerEmail, transferReason);
    if (ok) {
      showToast(`Ownership transferred to ${newOwnerName} (${newOwnerEmail}).`);
      setTransferOwnerModalOpen(false);
      setNewOwnerName('');
      setNewOwnerEmail('');
      setTransferReason('');
      setDrawerEntity((prev) =>
        prev
          ? {
              ...prev,
              primaryOwner: {
                id: `usr-transferred-${Date.now()}`,
                name: newOwnerName,
                email: newOwnerEmail,
              },
            }
          : null
      );
    }
  };

  const getTypeBadge = (type: EntityType) => {
    switch (type) {
      case 'Startup':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/20">Startup</span>;
      case 'Investor Organization':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Investor Org</span>;
      case 'ESP':
        return <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-[#D9FF3F]/10 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-300 dark:border-[#D9FF3F]/20">ESP Institution</span>;
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

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 dark:text-[#D9FF3F] bg-emerald-50 dark:bg-[#D9FF3F]/10 border border-emerald-200 dark:border-[#D9FF3F]/20 px-2.5 py-1 rounded-md w-fit mb-2">
            <Building2 className="w-3.5 h-3.5" />
            Institutional Entity Ledger
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Entity Accounts Administration
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Centralized governance for Startups, Investor Organizations, and Ecosystem Service Providers (ESPs). Manages institutional verification, primary administrators, multi-seat memberships, and access sources.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Total Entities</div>
            <div className="text-lg font-bold font-sora text-[#101212] dark:text-white">{entities.length}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Startups</div>
            <div className="text-lg font-bold font-sora text-blue-600 dark:text-blue-400">
              {entities.filter((e) => e.type === 'Startup').length}
            </div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">ESPs</div>
            <div className="text-lg font-bold font-sora text-emerald-700 dark:text-[#D9FF3F]">
              {entities.filter((e) => e.type === 'ESP').length}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        {(['All', 'Startup', 'Investor Organization', 'ESP', 'Pending Verification'] as const).map((tab) => (
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by entity name, email, owner, or domain..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-[#D9FF3F]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Restricted">Restricted</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Entity Table */}
      <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
              <th className="py-3.5 px-4 font-semibold">Entity Name</th>
              <th className="py-3.5 px-4 font-semibold">Type</th>
              <th className="py-3.5 px-4 font-semibold">Verification</th>
              <th className="py-3.5 px-4 font-semibold">Primary Owner / Admin</th>
              <th className="py-3.5 px-4 font-semibold">Members</th>
              <th className="py-3.5 px-4 font-semibold">Profile Visibility</th>
              <th className="py-3.5 px-4 font-semibold">Entitlement Source</th>
              <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
            {filteredEntities.map((ent) => (
              <tr key={ent.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-[#101212] dark:text-white">{ent.name}</div>
                  <div className="text-[11px] text-gray-400">{ent.domain || ent.officialEmail}</div>
                </td>
                <td className="py-3.5 px-4">{getTypeBadge(ent.type)}</td>
                <td className="py-3.5 px-4">
                  {ent.verificationStatus === 'Verified' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> {ent.verificationStatus}
                    </span>
                  )}
                </td>
                <td className="py-3.5 px-4">
                  <div className="text-[11px] font-medium text-[#101212] dark:text-white">{ent.primaryOwner.name}</div>
                  <div className="text-[10px] text-gray-400">{ent.primaryOwner.email}</div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-white">
                    <Users className="w-3 h-3 text-gray-400" />
                    {ent.memberCount} seats
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="text-[11px] font-medium text-[#565B59] dark:text-gray-300">
                    {ent.profileStatus}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="text-[11px] font-medium text-[#101212] dark:text-white">{ent.subscriptionTier}</div>
                  <div className="text-[10px] text-emerald-700 dark:text-[#D9FF3F] font-medium">{ent.entitlementSource}</div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => setDrawerEntity(ent)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-medium text-[#101212] dark:text-white transition-all border border-gray-200 dark:border-transparent"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Manage</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Entity Management Drawer */}
      {drawerEntity && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-[#181B1A] h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E5E7EB] dark:border-[#262A29] p-6 space-y-6 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] dark:border-[#262A29]">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600 dark:text-[#D9FF3F]" />
                  <h3 className="font-sora text-lg font-bold text-[#101212] dark:text-white">
                    Entity Governance Dossier
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerEntity(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Entity Overview Card */}
              <div className="mt-6 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-sora text-base font-bold text-[#101212] dark:text-white">
                    {drawerEntity.name}
                  </h4>
                  {getTypeBadge(drawerEntity.type)}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">Official Email:</span>
                    <p className="font-medium text-[#101212] dark:text-white">{drawerEntity.officialEmail}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Domain:</span>
                    <p className="font-medium text-[#101212] dark:text-white">{drawerEntity.domain || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Location:</span>
                    <p className="font-medium text-[#101212] dark:text-white">{drawerEntity.location || 'India'}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Created Date:</span>
                    <p className="font-medium text-[#101212] dark:text-white">{drawerEntity.createdDate}</p>
                  </div>
                </div>
              </div>

              {/* Primary Ownership Section */}
              <div className="mt-5 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Primary Owner / Administrator
                  </div>
                  <button
                    onClick={() => setTransferOwnerModalOpen(true)}
                    className="text-xs font-medium text-emerald-700 dark:text-[#D9FF3F] hover:underline"
                  >
                    Transfer Ownership
                  </button>
                </div>
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-[#101212] dark:text-white">
                    {drawerEntity.primaryOwner.name}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">{drawerEntity.primaryOwner.email}</div>
                  <div className="text-[10px] text-gray-500 font-mono">ID: {drawerEntity.primaryOwner.id}</div>
                </div>
              </div>

              {/* Entitlement & Access Source Audit */}
              <div className="mt-5 p-4 rounded-xl bg-emerald-50 dark:bg-[#D9FF3F]/5 border border-emerald-200 dark:border-[#D9FF3F]/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-[#D9FF3F]">
                    Entitlement Architecture
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 dark:bg-[#D9FF3F]/20 text-emerald-800 dark:text-[#D9FF3F] border border-emerald-500/20 dark:border-transparent">
                    {drawerEntity.subscriptionTier}
                  </span>
                </div>
                <div className="text-xs text-[#565B59] dark:text-[#A0A4A2] space-y-1">
                  <div>Access Source: <strong className="text-[#101212] dark:text-white">{drawerEntity.entitlementSource}</strong></div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Feature access is governed through the Xentro Entitlement Engine rather than raw payment flags.
                  </p>
                </div>
              </div>

              {/* Profile Visibility Controls */}
              <div className="mt-5 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Profile Visibility Status: {drawerEntity.profileStatus}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#181B1A]">
                    <span className="text-gray-500 dark:text-gray-400">Search Discovery:</span>
                    <p className="font-semibold text-[#101212] dark:text-white">
                      {drawerEntity.profileStatus === 'Ghost Mode' ? 'Disabled' : 'Active'}
                    </p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#181B1A]">
                    <span className="text-gray-500 dark:text-gray-400">Investor Matching:</span>
                    <p className="font-semibold text-[#101212] dark:text-white">
                      {drawerEntity.profileStatus === 'Ghost Mode' ? 'Disabled' : 'Active'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center gap-3">
              <button
                onClick={() => handleToggleVerification(drawerEntity)}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white text-xs font-bold transition-all border border-[#E5E7EB] dark:border-[#262A29]"
              >
                Toggle Verification
              </button>
              <button
                onClick={() => handleToggleSuspension(drawerEntity)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all"
              >
                {drawerEntity.status === 'Suspended' ? 'Restore Entity' : 'Suspend Entity'}
              </button>
              <button
                onClick={() => handleDeleteEntity(drawerEntity)}
                className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {transferOwnerModalOpen && drawerEntity && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleTransferOwnership}
            className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-2.5 text-emerald-700 dark:text-[#D9FF3F]">
              <UserCheck className="w-5 h-5" />
              <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                Transfer Entity Ownership
              </h3>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
              Transfer primary ownership of <strong className="text-[#101212] dark:text-white">{drawerEntity.name}</strong> to a verified personal account.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-400">New Owner Name</label>
                <input
                  type="text"
                  required
                  value={newOwnerName}
                  onChange={(e) => setNewOwnerName(e.target.value)}
                  placeholder="e.g. Sravan Kumar"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400">New Owner Official Email</label>
                <input
                  type="email"
                  required
                  value={newOwnerEmail}
                  onChange={(e) => setNewOwnerEmail(e.target.value)}
                  placeholder="e.g. sravan@xentro.io"
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400">Audit Justification / Board Resolution</label>
                <textarea
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="State the corporate restructuring, founder change, or board resolution reference..."
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTransferOwnerModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs"
              >
                Execute Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
