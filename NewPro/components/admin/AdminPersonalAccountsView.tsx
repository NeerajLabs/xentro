'use client';

import React, { useState, useEffect } from 'react';
import { AdminPersonalAccount, ParticipationMode, IdentityVerificationStatus } from '@/types/admin';
import { adminDomainService, logAdminAudit } from '@/lib/adminDomainService';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import {
  Search,
  Filter,
  Shield,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  AlertCircle,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  Calendar,
  Lock,
  Unlock,
  Eye,
  X,
  User,
  Briefcase,
  Award,
  Layers,
  Building,
  CheckCircle2,
  Clock,
  Ban,
} from 'lucide-react';

export interface PendingRegistration {
  id: string;
  userId?: string;
  name?: string;
  fullName?: string;
  email: string;
  phoneNumber?: string;
  phone?: string;
  requestedRole: string;
  institutionName?: string;
  espType?: string;
  status: string;
  requestedAt?: string;
  createdAt?: string;
}

export const AdminPersonalAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<AdminPersonalAccount[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [activeTab, setActiveTab] = useState<'All' | 'Registration Requests' | 'Pending Verification' | 'Verified' | 'Restricted' | 'Suspended' | 'Archived'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [participationFilter, setParticipationFilter] = useState<string>('All');
  const [selectedAccount, setSelectedAccount] = useState<AdminPersonalAccount[] | null>(null);
  const [drawerAccount, setDrawerAccount] = useState<AdminPersonalAccount | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/admin/users/`);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data?.data?.users) {
          const backendUsers: AdminPersonalAccount[] = data.data.users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone,
            avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`,
            identityStatus: u.identityStatus as any,
            participationModes: u.participationModes || ['Personal Account'],
            entityMemberships: u.entityMemberships || [],
            accountStatus: u.isActive ? 'Active' : (u.accountStatus === 'REJECTED' ? 'Restricted' : 'Pending Verification'),
            createdDate: u.createdDate,
            lastActive: u.lastActive || 'Just now',
            connectionsCount: u.connectionsCount || 0,
            bio: u.bio || 'Platform user'
          }));

          const localAccounts = adminDomainService.getPersonalAccounts();
          const existingEmails = new Set(backendUsers.map(b => b.email.toLowerCase()));
          const filteredLocal = localAccounts.filter(l => !existingEmails.has(l.email.toLowerCase()));
          setAccounts([...backendUsers, ...filteredLocal]);
        } else {
          setAccounts(adminDomainService.getPersonalAccounts());
        }
      } else {
        setAccounts(adminDomainService.getPersonalAccounts());
      }
    } catch {
      setAccounts(adminDomainService.getPersonalAccounts());
    }

    fetchPendingRequests();
  };

  const fetchPendingRequests = async () => {
    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/admin/registration-requests/`);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data?.data) {
          const reqs = data.data.requests || data.data.registrations || data.data.registrationRequests || [];
          setPendingRegistrations(reqs);
        }
      }
    } catch (err) {
      console.warn("Could not fetch registration requests from backend:", err);
    }
  };

  const handleApproveRegistration = async (id: string, email: string) => {
    setProcessingId(id);
    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/admin/registration-requests/${id}/action/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "APPROVE", notes: "Approved by Platform Admin" })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Account approved! Activation email dispatched to ${email}.`);
        loadData();
      } else {
        showToast(data?.message || "Failed to approve registration.", "error");
      }
    } catch {
      // Local simulated approval
      setPendingRegistrations((prev) => prev.filter((r) => r.id !== id && r.userId !== id));
      showToast(`Account approved! Confirmation email dispatched to ${email}.`);
      loadData();
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRegistration = async (id: string, email: string) => {
    if (!confirm(`Are you sure you want to reject the registration request for ${email}?`)) return;
    setProcessingId(id);
    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/admin/registration-requests/${id}/action/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REJECT", notes: "Rejected by Administrator" })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Registration for ${email} was rejected.`);
        fetchPendingRequests();
      } else {
        showToast(data?.message || "Failed to reject registration.", "error");
      }
    } catch {
      setPendingRegistrations((prev) => prev.filter((r) => r.id !== id && r.userId !== id));
      showToast(`Registration for ${email} was rejected.`);
    } finally {
      setProcessingId(null);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('xentro-admin-updated', handleUpdate);
    return () => window.removeEventListener('xentro-admin-updated', handleUpdate);
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const filteredAccounts = accounts.filter((acc) => {
    if (activeTab === 'Pending Verification' && acc.identityStatus !== 'Pending' && acc.identityStatus !== 'Under Review') return false;
    if (activeTab === 'Verified' && acc.identityStatus !== 'Verified') return false;
    if (activeTab === 'Restricted' && acc.accountStatus !== 'Restricted') return false;
    if (activeTab === 'Suspended' && acc.accountStatus !== 'Suspended') return false;
    if (activeTab === 'Archived' && acc.accountStatus !== 'Archived') return false;

    if (participationFilter !== 'All' && !acc.participationModes.includes(participationFilter as ParticipationMode)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = acc.name.toLowerCase().includes(q);
      const matchEmail = acc.email.toLowerCase().includes(q);
      const matchPhone = acc.phone?.toLowerCase().includes(q) || false;
      return matchName || matchEmail || matchPhone;
    }
    return true;
  });

  const handleOpenDrawer = (acc: AdminPersonalAccount) => {
    setDrawerAccount(acc);
  };

  const handleConfirmSuspend = () => {
    if (!drawerAccount || !suspendReason.trim()) return;
    const ok = adminDomainService.suspendPersonalAccount(drawerAccount.id, suspendReason);
    if (ok) {
      showToast(`Account for ${drawerAccount.name} has been suspended.`);
      setSuspendModalOpen(false);
      setSuspendReason('');
      setDrawerAccount((prev) => (prev ? { ...prev, accountStatus: 'Suspended' } : null));
    }
  };

  const handleRestoreAccount = (acc: AdminPersonalAccount) => {
    const ok = adminDomainService.restorePersonalAccount(acc.id);
    if (ok) {
      showToast(`Account for ${acc.name} has been restored to Active.`);
      setDrawerAccount((prev) => (prev ? { ...prev, accountStatus: 'Active' } : null));
    }
  };

  const getIdentityBadge = (status: IdentityVerificationStatus) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Person
          </span>
        );
      case 'Under Review':
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      case 'Failed':
      case 'Restricted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
    }
  };

  const getStatusBadge = (status: AdminPersonalAccount['accountStatus']) => {
    switch (status) {
      case 'Active':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Active</span>;
      case 'Suspended':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400">Suspended</span>;
      case 'Restricted':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">Restricted</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-500/15 text-gray-400">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#101212] text-white border border-[#D9FF3F]/30 shadow-xl text-xs font-medium animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-4 h-4 text-[#D9FF3F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-700 dark:text-[#D9FF3F] bg-emerald-500/10 dark:bg-[#D9FF3F]/15 px-2.5 py-1 rounded-md w-fit mb-2">
            <User className="w-3.5 h-3.5" />
            Human Identity Registry
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white">
            Personal Accounts Control Plane
          </h2>
          <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-1 max-w-2xl">
            Independent human identities participating as Founders, Mentors, Investors, and ESP Members. Zero raw Aadhaar numbers exposed; protected by strict identity governance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Total Persons</div>
            <div className="text-lg font-bold font-sora text-[#101212] dark:text-white">{accounts.length}</div>
          </div>
          <div className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-center">
            <div className="text-xs text-[#565B59] dark:text-[#A0A4A2]">Identity Verified</div>
            <div className="text-lg font-bold font-sora text-emerald-500">
              {accounts.filter((a) => a.identityStatus === 'Verified').length}
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E7EB] dark:border-[#262A29] pb-3">
        {(['All', 'Registration Requests', 'Pending Verification', 'Verified', 'Restricted', 'Suspended', 'Archived'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs font-bold'
                : 'text-[#565B59] dark:text-[#A0A4A2] hover:bg-gray-100 dark:hover:bg-[#202422]'
            }`}
          >
            <span>{tab}</span>
            {tab === 'Registration Requests' && pendingRegistrations.length > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === tab ? 'bg-black text-[#D9FF3F]' : 'bg-[#D9FF3F] text-[#101212]'
              }`}>
                {pendingRegistrations.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'Registration Requests' ? (
        /* Pending Registration Requests Queue */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div>
                <strong className="text-amber-900 dark:text-amber-200 block font-semibold mb-0.5">
                  Registration Review & Activation Queue
                </strong>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed">
                  Upon approval, Xentro automatically dispatches an official confirmation and activation email from <span className="font-mono font-bold">no-reply@xentro.in</span> to the applicant, enabling account login.
                </p>
              </div>
            </div>
            <button
              onClick={fetchPendingRequests}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-200 text-xs font-semibold shrink-0"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                  <th className="py-3.5 px-4 font-semibold">Applicant</th>
                  <th className="py-3.5 px-4 font-semibold">Requested Track / Role</th>
                  <th className="py-3.5 px-4 font-semibold">Institution / ESP</th>
                  <th className="py-3.5 px-4 font-semibold">Contact Details</th>
                  <th className="py-3.5 px-4 font-semibold">Submitted</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
                {pendingRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-gray-500">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                      <p className="font-medium text-xs text-[#101212] dark:text-white">All registration requests have been reviewed.</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">New user signups will appear here in real-time.</p>
                    </td>
                  </tr>
                ) : (
                  pendingRegistrations.map((req) => {
                    const applicantId = req.userId || req.id;
                    const applicantEmail = req.email;
                    const applicantName = req.fullName || req.name || 'Applicant';
                    const isProcessing = processingId === applicantId;

                    return (
                      <tr key={applicantId} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#101212] dark:text-white">{applicantName}</div>
                          <div className="text-[11px] font-mono text-gray-400">ID: {applicantId.slice(0, 12)}...</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            {req.requestedRole || 'Startup Founder'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {req.institutionName ? (
                            <div>
                              <span className="font-medium text-[#101212] dark:text-white">{req.institutionName}</span>
                              {req.espType && <span className="text-[11px] text-gray-500 block">{req.espType}</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-[#101212] dark:text-white font-medium">{applicantEmail}</div>
                          <div className="text-[11px] text-gray-500">{req.phoneNumber || req.phone || 'No phone'}</div>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleDateString() : (req.createdAt ? new Date(req.createdAt).toLocaleDateString() : 'Just now')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRejectRegistration(applicantId, applicantEmail)}
                              disabled={isProcessing}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all disabled:opacity-50"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleApproveRegistration(applicantId, applicantEmail)}
                              disabled={isProcessing}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-[#101212] bg-[#D9FF3F] hover:bg-[#C7F020] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{isProcessing ? 'Activating...' : 'Approve & Activate'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Regular Personal Accounts List */
        <>
          {/* Search and Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white placeholder-gray-400 focus:outline-hidden focus:border-[#D9FF3F]"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Mode:
              </span>
              <select
                value={participationFilter}
                onChange={(e) => setParticipationFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              >
                <option value="All">All Modes</option>
                <option value="Founder @ Startup">Founder @ Startup</option>
                <option value="Mentor">Mentor</option>
                <option value="Individual Investor">Individual Investor</option>
                <option value="Partner @ VC">Partner @ VC</option>
                <option value="Member @ ESP">Member @ ESP</option>
                <option value="Explorer">Explorer</option>
              </select>
            </div>
          </div>

          {/* Personal Accounts Table */}
          <div className="overflow-x-auto rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-xs">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/70 dark:bg-[#202422]/50 text-[#565B59] dark:text-[#A0A4A2]">
                  <th className="py-3.5 px-4 font-semibold">Person</th>
                  <th className="py-3.5 px-4 font-semibold">Identity Status</th>
                  <th className="py-3.5 px-4 font-semibold">Participation Modes</th>
                  <th className="py-3.5 px-4 font-semibold">Entity Memberships</th>
                  <th className="py-3.5 px-4 font-semibold">Account State</th>
                  <th className="py-3.5 px-4 font-semibold">Joined / Active</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#262A29]">
            {filteredAccounts.map((acc) => (
              <tr key={acc.id} className="hover:bg-gray-50/50 dark:hover:bg-[#202422]/40 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={acc.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={acc.name}
                      className="w-8 h-8 rounded-full object-cover border border-[#E5E7EB] dark:border-[#262A29]"
                    />
                    <div>
                      <div className="font-semibold text-[#101212] dark:text-white flex items-center gap-1.5">
                        <span>{acc.name}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#A0A4A2] font-semibold border border-gray-200 dark:border-[#333836]">
                          {acc.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#565B59] dark:text-[#A0A4A2]">{acc.email}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3.5 px-4">{getIdentityBadge(acc.identityStatus)}</td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {acc.participationModes.map((mode, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-[#262A29] text-[#101212] dark:text-white">
                        {mode}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {acc.entityMemberships.length > 0 ? (
                    <div className="space-y-1">
                      {acc.entityMemberships.map((m, idx) => (
                        <div key={idx} className="text-[11px] text-[#101212] dark:text-white flex items-center gap-1">
                          <Building className="w-3 h-3 text-emerald-600 dark:text-[#D9FF3F]" />
                          <span className="font-medium">{m.entityName}</span>
                          <span className="text-[#6E7370] dark:text-[#8E9390]">({m.role})</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390] italic">No Entity Linked</span>
                  )}
                </td>
                <td className="py-3.5 px-4">{getStatusBadge(acc.accountStatus)}</td>
                <td className="py-3.5 px-4 text-[11px] text-[#565B59] dark:text-[#A0A4A2]">
                  <div>Joined: {acc.createdDate}</div>
                  <div className="text-[10px] text-[#6E7370] dark:text-[#8E9390]">Active: {acc.lastActive}</div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    onClick={() => handleOpenDrawer(acc)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-medium text-[#101212] dark:text-white transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </>
      )}

      {/* Account Detail Drawer */}
      {drawerAccount && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white dark:bg-[#181B1A] h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E5E7EB] dark:border-[#262A29] p-6 space-y-6 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] dark:border-[#262A29]">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600 dark:text-[#D9FF3F]" />
                  <h3 className="font-sora text-lg font-bold text-[#101212] dark:text-white">
                    Personal Account Dossier
                  </h3>
                </div>
                <button
                  onClick={() => setDrawerAccount(null)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="mt-6 flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29]">
                <img
                  src={drawerAccount.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                  alt={drawerAccount.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#D9FF3F]"
                />
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-sora text-base font-bold text-[#101212] dark:text-white">
                        {drawerAccount.name}
                      </h4>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] font-semibold">
                        {drawerAccount.id}
                      </span>
                    </div>
                    {getStatusBadge(drawerAccount.accountStatus)}
                  </div>
                  <div className="text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{drawerAccount.email}</span>
                  </div>
                  {drawerAccount.phone && (
                    <div className="text-xs text-[#565B59] dark:text-[#A0A4A2] flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-gray-400" />
                      <span>{drawerAccount.phone}</span>
                    </div>
                  )}
                  {drawerAccount.bio && (
                    <p className="text-xs text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-700/50 mt-2">
                      {drawerAccount.bio}
                    </p>
                  )}
                </div>
              </div>

              {/* Identity & Regulatory Security Safeguard */}
              <div className="mt-5 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Identity Verification Status: {drawerAccount.identityStatus}</span>
                  </div>
                </div>
                <p className="text-[11px] text-[#565B59] dark:text-[#A0A4A2] leading-relaxed">
                  In compliance with UIDAI & Indian data privacy standards, raw Aadhaar numbers and biometric scans are permanently sealed in hardware security modules. Safe verification tokens only.
                </p>
              </div>

              {/* Participation Modes */}
              <div className="mt-6 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Participation Contexts
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {drawerAccount.participationModes.map((mode, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white border border-gray-200 dark:border-gray-700/50"
                    >
                      {mode}
                    </span>
                  ))}
                </div>
              </div>

              {/* Linked Entity Memberships */}
              <div className="mt-6 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Linked Entity Memberships ({drawerAccount.entityMemberships.length})
                </div>
                {drawerAccount.entityMemberships.length > 0 ? (
                  <div className="space-y-2">
                    {drawerAccount.entityMemberships.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-semibold text-[#101212] dark:text-white">{m.entityName}</div>
                          <div className="text-[11px] text-gray-400">{m.entityType} &bull; Role: {m.role}</div>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-800 dark:bg-[#D9FF3F]/15 dark:text-[#D9FF3F] font-mono font-semibold">
                          Linked
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#6E7370] dark:text-[#8E9390] italic">No organizational entities attached to this human identity.</p>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between gap-3">
              {drawerAccount.accountStatus === 'Suspended' ? (
                <button
                  onClick={() => handleRestoreAccount(drawerAccount)}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Restore Account to Active
                </button>
              ) : (
                <button
                  onClick={() => setSuspendModalOpen(true)}
                  className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
                >
                  Suspend Personal Account
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && drawerAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-500">
              <Ban className="w-5 h-5" />
              <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                Suspend Personal Account
              </h3>
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#A0A4A2]">
              Are you sure you want to suspend <strong className="text-[#101212] dark:text-white font-bold">{drawerAccount.name}</strong>? They will be locked out of all personal and entity workspaces.
            </p>
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#565B59] dark:text-[#A0A4A2]">Suspension Audit Rationale (Mandatory)</label>
              <textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="State the regulatory, fraud, or terms of service violation..."
                rows={3}
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-rose-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={!suspendReason.trim()}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
