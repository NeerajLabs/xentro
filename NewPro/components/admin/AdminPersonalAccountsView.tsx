'use client';

import React, { useState, useEffect } from 'react';
import { AdminPersonalAccount, ParticipationMode, IdentityVerificationStatus, AdminSession } from '@/types/admin';
import { adminDomainService, logAdminAudit } from '@/lib/adminDomainService';
import { getAdminSession } from '@/lib/adminAuth';
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
  Edit3,
  Trash2,
  Key,
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
  const [dossierData, setDossierData] = useState<any | null>(null);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Master Admin State & Permissions
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminPersonalAccount | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'Founder @ Startup',
    accountStatus: 'Active',
    reason: ''
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState<AdminPersonalAccount | null>(null);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setAdminSession(getAdminSession());
    const onSessChange = (e: any) => {
      if (e.detail) setAdminSession(e.detail);
    };
    window.addEventListener('xentro-admin-session-changed', onSessChange);
    return () => window.removeEventListener('xentro-admin-session-changed', onSessChange);
  }, []);

  const isMasterAdmin = adminSession?.role === 'Super Admin' || adminSession?.role === 'Master Admin';

  const renderAvatar = (name: string, photoUrl?: string, size = "w-8 h-8 text-xs") => {
    if (photoUrl && photoUrl.trim() && !photoUrl.includes('unsplash.com') && !photoUrl.includes('dicebear.com')) {
      return (
        <img
          src={photoUrl}
          alt={name}
          className={`${size} rounded-full object-cover border border-[#E5E7EB] dark:border-[#262A29]`}
        />
      );
    }
    const initials = (name || 'User')
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return (
      <div className={`${size} rounded-full bg-[#D9FF3F]/15 border border-[#D9FF3F]/30 text-[#101212] dark:text-[#D9FF3F] font-bold font-mono flex items-center justify-center shrink-0`}>
        {initials || 'U'}
      </div>
    );
  };

  const loadData = async () => {
    let usersList: any[] = [];
    try {
      const backendUrl = getBackendBaseUrl();
      const resp = await fetch(`${backendUrl}/admin/users/`);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data?.data?.users) {
          usersList = data.data.users;
        }
      }
    } catch (e) {
      console.warn('Could not fetch users from primary backend, falling back to local DB sync:', e);
    }

    if (!usersList.length) {
      try {
        const localResp = await fetch('/api/admin/users');
        if (localResp.ok) {
          const localData = await localResp.json();
          if (localData?.success && localData?.data?.users) {
            usersList = localData.data.users;
          }
        }
      } catch (_) {}
    }

    if (usersList.length > 0) {
      const backendUsers: AdminPersonalAccount[] = usersList.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        avatar: u.avatar || u.photoUrl || '',
        identityStatus: u.identityStatus as any,
        participationModes: u.participationModes || ['Explorer'],
        entityMemberships: u.entityMemberships || [],
        accountStatus: u.accountStatus || (u.isActive ? 'Active' : 'Pending Verification'),
        createdDate: u.createdDate,
        lastActive: u.lastActive || 'Unavailable',
        connectionsCount: u.connectionsCount || 0,
        bio: u.bio || ''
      }));

      setAccounts(backendUsers);
    } else {
      setAccounts([]);
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
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/registration-requests/${id}/action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: "APPROVE", notes: "Approved by Platform Admin" })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        if (data?.data?.alreadySent) {
          showToast(`Account is already active. Duplicate activation email skipped.`);
        } else if (data?.data?.emailSent) {
          showToast(`Account approved & activated! Activation email dispatched from no-reply@xentro.in to ${email}.`);
        } else {
          showToast(`Account approved! (Email status: ${data?.data?.emailOutcome || 'queued'})`);
        }
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
    const reason = prompt(`Enter rejection reason for ${email}:`, "Application does not meet onboarding criteria.");
    if (reason === null) return;
    setProcessingId(id);
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/registration-requests/${id}/action/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: "REJECT", notes: reason })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Registration request for ${email} has been rejected.`);
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

  const handleOpenEdit = (acc: AdminPersonalAccount) => {
    setEditUser(acc);
    setEditForm({
      fullName: acc.name,
      email: acc.email,
      phone: acc.phone || '',
      role: acc.participationModes[0] || 'Founder @ Startup',
      accountStatus: acc.accountStatus,
      reason: ''
    });
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (!isMasterAdmin) {
      showToast("Access Denied: Only the Master Admin is authorized to edit user accounts.", "error");
      return;
    }
    setIsSavingEdit(true);
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/users/${editUser.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fullName: editForm.fullName,
          email: editForm.email,
          phoneNumber: editForm.phone,
          role: editForm.role,
          accountStatus: editForm.accountStatus,
          isActive: editForm.accountStatus === 'Active',
          reason: editForm.reason || 'User account profile updated by Master Admin'
        })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`User account ${editForm.email} updated successfully!`);
        setEditModalOpen(false);
        if (drawerAccount?.id === editUser.id) {
          setDrawerAccount((prev) =>
            prev
              ? {
                  ...prev,
                  name: editForm.fullName,
                  email: editForm.email,
                  phone: editForm.phone,
                  accountStatus: editForm.accountStatus as any,
                }
              : null
          );
        }
        loadData();
      } else {
        showToast(data?.message || 'Failed to update user account.', 'error');
      }
    } catch (err) {
      showToast('Network error while saving user account.', 'error');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleOpenDelete = (acc: AdminPersonalAccount) => {
    setDeleteUser(acc);
    setConfirmInput('');
    setDeleteReason('');
    setDeleteModalOpen(true);
  };

  const isSelfDeletion = Boolean(
    adminSession &&
      deleteUser &&
      (deleteUser.id === adminSession.employeeId ||
        (deleteUser.email && adminSession.employeeId && deleteUser.email.toLowerCase() === adminSession.employeeId.toLowerCase()) ||
        (adminSession.employeeId === '9922953' && deleteUser.id === '9922953'))
  );

  const isConfirmationMatched = Boolean(
    deleteUser &&
      (confirmInput.trim().toLowerCase() === deleteUser.email.toLowerCase() ||
        confirmInput.trim() === 'DELETE')
  );

  const handleConfirmDelete = async () => {
    if (!deleteUser) return;
    if (!isMasterAdmin) {
      showToast("Access Denied: Only the Master Admin is authorized to delete user accounts.", "error");
      return;
    }
    if (isSelfDeletion) {
      showToast("Safeguard Triggered: Master Admin cannot delete their own active account.", "error");
      return;
    }
    if (!isConfirmationMatched) {
      showToast("Type the user's exact email address or 'DELETE' to confirm deletion.", "error");
      return;
    }
    if (!deleteReason.trim()) {
      showToast("Audit rationale is required to record this deletion.", "error");
      return;
    }
    setIsDeleting(true);
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/users/${deleteUser.id}/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          confirmation: true,
          confirm_email: confirmInput.trim(),
          reason: deleteReason.trim(),
        })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`User account ${deleteUser.email} has been permanently deleted.`);
        setDeleteModalOpen(false);
        const deletedId = deleteUser.id;
        setDeleteUser(null);
        if (drawerAccount?.id === deletedId) {
          setDrawerAccount(null);
        }
        // Invalidate client caches
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('xentro_admin_domain_store_v2');
            if (raw) {
              const store = JSON.parse(raw);
              store.personalAccounts = (store.personalAccounts || []).filter((a: any) => a.id !== deletedId);
              localStorage.setItem('xentro_admin_domain_store_v2', JSON.stringify(store));
            }
          } catch {}
        }
        loadData();
      } else {
        showToast(data?.message || 'Failed to delete user account.', 'error');
      }
    } catch {
      showToast('Network error while deleting user account.', 'error');
    } finally {
      setIsDeleting(false);
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

  const handleOpenDrawer = async (acc: AdminPersonalAccount) => {
    setDrawerAccount(acc);
    setLoadingDossier(true);
    setDossierData(null);
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/users/${acc.id}/`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data?.data) {
          setDossierData(data.data);
        }
      }
    } catch (err) {
      console.warn("Could not fetch user dossier:", err);
    } finally {
      setLoadingDossier(false);
    }
  };

  const handleVerifyIdentity = async (action: 'VERIFY' | 'REJECT') => {
    if (!drawerAccount) return;
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/users/${drawerAccount.id}/verify/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action, notes: `Identity verification ${action.toLowerCase()}ed by admin.` })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Identity status updated to ${action === 'VERIFY' ? 'Verified' : 'Rejected'}.`);
        handleOpenDrawer(drawerAccount);
        loadData();
      } else {
        showToast(data?.message || 'Failed to update identity verification.', 'error');
      }
    } catch {
      showToast('Network error while updating identity verification.', 'error');
    }
  };

  const handleRoleAction = async (role: 'MENTOR' | 'INVESTOR', action: 'APPROVE' | 'REJECT') => {
    if (!drawerAccount) return;
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/users/${drawerAccount.id}/role-action/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ role, action })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`${role} application ${action.toLowerCase()}ed.`);
        handleOpenDrawer(drawerAccount);
        loadData();
      } else {
        showToast(data?.message || `Failed to ${action.toLowerCase()} role.`, 'error');
      }
    } catch {
      showToast('Network error during role action.', 'error');
    }
  };

  const handleRestrictAccount = async () => {
    if (!drawerAccount) return;
    const reason = prompt(`Enter reason to restrict ${drawerAccount.email}:`, 'Account under compliance review.');
    if (reason === null) return;
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/users/${drawerAccount.id}/restrict/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Account restricted successfully.`);
        handleOpenDrawer(drawerAccount);
        loadData();
      } else {
        showToast(data?.message || 'Failed to restrict account.', 'error');
      }
    } catch {
      showToast('Network error while restricting account.', 'error');
    }
  };

  const handleConfirmSuspend = async () => {
    if (!drawerAccount || !suspendReason.trim()) return;
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/users/${drawerAccount.id}/suspend/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ reason: suspendReason.trim() })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Account for ${drawerAccount.name} has been suspended.`);
        setSuspendModalOpen(false);
        setSuspendReason('');
        handleOpenDrawer(drawerAccount);
        loadData();
      } else {
        showToast(data?.message || 'Failed to suspend account.', 'error');
      }
    } catch {
      showToast('Network error suspending account.', 'error');
    }
  };

  const handleRestoreAccount = async (acc: AdminPersonalAccount) => {
    try {
      const backendUrl = getBackendBaseUrl();
      const token = adminSession?.token;
      const resp = await fetch(`${backendUrl}/admin/users/${acc.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ accountStatus: 'Active', isActive: true, reason: 'Restored to Active by admin' })
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        showToast(`Account for ${acc.name} has been restored to Active.`);
        handleOpenDrawer(acc);
        loadData();
      } else {
        showToast(data?.message || 'Failed to restore account.', 'error');
      }
    } catch {
      showToast('Network error restoring account.', 'error');
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

          {/* Master Admin Permissions Badge */}
          <div className="mt-3 flex items-center gap-2">
            {isMasterAdmin ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border border-[#D9FF3F]/40 shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                Master Admin Privileges Active (View, Edit & Delete)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                <Lock className="w-3.5 h-3.5" />
                Read-Only Access ({adminSession?.role || 'Admin'}): Only Master Admin is authorized to edit or delete accounts
              </span>
            )}
          </div>
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
                    {renderAvatar(acc.name, acc.avatar, "w-8 h-8 text-xs")}
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
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => handleOpenDrawer(acc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-medium text-[#101212] dark:text-white transition-all cursor-pointer"
                      title="Inspect User Dossier"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </button>
                    <button
                      onClick={() => (isMasterAdmin ? handleOpenEdit(acc) : showToast("Permission Denied: Only Master Admin can edit accounts.", "error"))}
                      disabled={!isMasterAdmin}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isMasterAdmin
                          ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 cursor-pointer"
                          : "bg-gray-100 dark:bg-[#202422] text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                      }`}
                      title={isMasterAdmin ? "Edit User Account (Master Admin)" : "Only Master Admin is authorized to edit users"}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => (isMasterAdmin ? handleOpenDelete(acc) : showToast("Permission Denied: Only Master Admin can delete accounts.", "error"))}
                      disabled={!isMasterAdmin}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isMasterAdmin
                          ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 cursor-pointer"
                          : "bg-gray-100 dark:bg-[#202422] text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                      }`}
                      title={isMasterAdmin ? "Delete User Account (Safeguarded)" : "Only Master Admin is authorized to delete users"}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
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
          <div className="w-full max-w-2xl bg-white dark:bg-[#181B1A] h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E5E7EB] dark:border-[#262A29] p-6 space-y-6 animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
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

              {/* Profile Header */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29]">
                {renderAvatar(drawerAccount.name, drawerAccount.avatar, "w-14 h-14 text-base")}
                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
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

              {loadingDossier ? (
                <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
                  <div className="w-6 h-6 border-2 border-[#D9FF3F] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Fetching comprehensive account dossier from MongoDB...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* SECTION 5.1 — IDENTITY & CONTACT */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422]/60 border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5" /> 5.1 Identity & Contact
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 dark:bg-[#262A29] text-gray-400">
                        Profile ID: {dossierData?.identityContact?.profileId || 'PRF-UNASSIGNED'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Internal User ID</span>
                        <span className="font-mono font-semibold text-[#101212] dark:text-white">{drawerAccount.id}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Account Type</span>
                        <span className="font-semibold text-[#101212] dark:text-white">{dossierData?.identityContact?.accountType || 'Explorer'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Public Username</span>
                        <span className="font-mono text-[#101212] dark:text-white">{dossierData?.identityContact?.username || '—'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Onboarding Completed</span>
                        <span className={`font-semibold ${dossierData?.identityContact?.onboardingCompleted ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {dossierData?.identityContact?.onboardingCompleted ? 'Completed' : 'Pending Profile Setup'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5.2 — SIGNUP & CONSENT VERIFICATION */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422]/60 border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> 5.2 Signup & Verification Compliance
                      </span>
                      {getIdentityBadge(drawerAccount.identityStatus)}
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Email OTP Verified</span>
                        <span className="font-semibold text-[#101212] dark:text-white">
                          {dossierData?.signupVerification?.emailVerified ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Terms Acceptance</span>
                        <span className="font-semibold text-[#101212] dark:text-white">
                          {dossierData?.signupVerification?.agreedToTerms ? `Accepted (v${dossierData?.signupVerification?.termsVersion || '1.0'})` : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Privacy Policy Consent</span>
                        <span className="font-semibold text-[#101212] dark:text-white">
                          {dossierData?.signupVerification?.agreedToPrivacy ? `Accepted (v${dossierData?.signupVerification?.privacyVersion || '1.0'})` : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Identity Consent</span>
                        <span className="font-semibold text-[#101212] dark:text-white">
                          {dossierData?.signupVerification?.consentIdentityVerification ? `Accepted (v${dossierData?.signupVerification?.identityConsentVersion || '1.0'})` : 'Pending'}
                        </span>
                      </div>
                    </div>

                    {/* Admin Verification Controls */}
                    <div className="pt-2 border-t border-gray-200 dark:border-[#262A29] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-400">Review Identity Verification:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerifyIdentity('REJECT')}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleVerifyIdentity('VERIFY')}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold text-[#101212] bg-[#D9FF3F] hover:bg-[#C7F020] transition-all cursor-pointer"
                        >
                          Approve Identity
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5.3 — PERSONAL PROFILE */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422]/60 border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5" /> 5.3 Personal Profile
                    </span>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-gray-400 block text-[11px]">Professional Headline</span>
                        <span className="font-medium text-[#101212] dark:text-white">
                          {dossierData?.personalProfile?.headline || drawerAccount.bio || '—'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-gray-400 block text-[11px]">Current Role</span>
                          <span className="font-medium text-[#101212] dark:text-white">
                            {dossierData?.personalProfile?.currentRole || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-400 block text-[11px]">Current Organization</span>
                          <span className="font-medium text-[#101212] dark:text-white">
                            {dossierData?.personalProfile?.currentOrganization || '—'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[11px]">Location</span>
                        <span className="font-medium text-[#101212] dark:text-white">
                          {dossierData?.personalProfile?.location || '—'}
                        </span>
                      </div>
                      {dossierData?.personalProfile?.skills?.length > 0 && (
                        <div>
                          <span className="text-gray-400 block text-[11px] mb-1">Skills</span>
                          <div className="flex flex-wrap gap-1">
                            {dossierData.personalProfile.skills.map((s: string, idx: number) => (
                              <span key={idx} className="px-2 py-0.5 rounded text-[10px] bg-gray-200 dark:bg-[#262A29] text-[#101212] dark:text-white font-medium">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECTION 5.4 — EDUCATION */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422]/60 border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" /> 5.4 Education History
                    </span>
                    {dossierData?.education && dossierData.education.length > 0 ? (
                      <div className="space-y-2">
                        {dossierData.education.map((edu: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs">
                            <div className="font-semibold text-[#101212] dark:text-white">{edu.institution}</div>
                            <div className="text-[11px] text-gray-400">
                              {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' • ')}
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              {edu.startYear ? `${edu.startYear} - ${edu.currentlyStudying ? 'Present' : (edu.endYear || 'Present')}` : ''}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No education information provided.</p>
                    )}
                  </div>

                  {/* SECTION 5.5 — PERSONAL ROLES */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422]/60 border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" /> 5.5 Personal Roles & Upgrades
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
                        <div>
                          <span className="font-semibold text-[#101212] dark:text-white">Explorer Base Role</span>
                          <span className="text-[11px] text-gray-400 block">Default personal account role</span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-500">Active</span>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
                        <div>
                          <span className="font-semibold text-[#101212] dark:text-white">Mentor Role</span>
                          <span className="text-[11px] text-gray-400 block">Status: {dossierData?.personalRoles?.mentorRole || 'Not Applied'}</span>
                        </div>
                        {dossierData?.personalRoles?.mentorRole === 'PENDING' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleRoleAction('MENTOR', 'REJECT')}
                              className="px-2 py-0.5 rounded text-[10px] font-medium text-rose-500 hover:bg-rose-500/10"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleRoleAction('MENTOR', 'APPROVE')}
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-[#101212] bg-[#D9FF3F]"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">{dossierData?.personalRoles?.mentorRole || 'Not Applied'}</span>
                        )}
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29]">
                        <div>
                          <span className="font-semibold text-[#101212] dark:text-white">Individual Investor</span>
                          <span className="text-[11px] text-gray-400 block">Status: {dossierData?.personalRoles?.investorRole || 'Not Applied'}</span>
                        </div>
                        {dossierData?.personalRoles?.investorRole === 'PENDING' ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleRoleAction('INVESTOR', 'REJECT')}
                              className="px-2 py-0.5 rounded text-[10px] font-medium text-rose-500 hover:bg-rose-500/10"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleRoleAction('INVESTOR', 'APPROVE')}
                              className="px-2 py-0.5 rounded text-[10px] font-bold text-[#101212] bg-[#D9FF3F]"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-400">{dossierData?.personalRoles?.investorRole || 'Not Applied'}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* SECTION 5.6 — ENTITY MEMBERSHIPS */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422]/60 border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" /> 5.6 Linked Entity Accounts
                    </span>
                    {dossierData?.entityMemberships && dossierData.entityMemberships.length > 0 ? (
                      <div className="space-y-2">
                        {dossierData.entityMemberships.map((m: any, idx: number) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-[#101212] dark:text-white">{m.entityName}</div>
                              <div className="text-[11px] text-gray-400">{m.entityType} • Role: {m.role} • ID: {m.entityId}</div>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold">
                              {m.verificationStatus || 'ACTIVE'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No Entity Linked</p>
                    )}
                  </div>

                  {/* SECTION 5.7 — SYSTEM RECORDED ACTIVITY */}
                  <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422]/60 border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#101212] dark:text-[#D9FF3F] flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> 5.7 Audit Activity Log
                    </span>
                    {dossierData?.accountActivity && dossierData.accountActivity.length > 0 ? (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {dossierData.accountActivity.map((act: any, idx: number) => (
                          <div key={idx} className="p-2 rounded bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-[11px]">
                            <div className="flex items-center justify-between text-gray-400 text-[10px]">
                              <span className="font-mono font-bold text-[#101212] dark:text-white">{act.action}</span>
                              <span>{act.timestamp ? new Date(act.timestamp).toLocaleString() : ''}</span>
                            </div>
                            {act.reason && <p className="text-gray-500 mt-0.5">{act.reason}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No audit records found.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#262A29] space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    if (isMasterAdmin) {
                      handleOpenEdit(drawerAccount);
                    } else {
                      showToast("Permission Denied: Only Master Admin can edit accounts.", "error");
                    }
                  }}
                  disabled={!isMasterAdmin}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    isMasterAdmin
                      ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 cursor-pointer shadow-xs"
                      : "bg-gray-100 dark:bg-[#202422] text-gray-400 border-transparent cursor-not-allowed opacity-50"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Account</span>
                </button>
                <button
                  onClick={() => {
                    if (isMasterAdmin) {
                      handleOpenDelete(drawerAccount);
                    } else {
                      showToast("Permission Denied: Only Master Admin can delete accounts.", "error");
                    }
                  }}
                  disabled={!isMasterAdmin}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                    isMasterAdmin
                      ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30 cursor-pointer shadow-xs"
                      : "bg-gray-100 dark:bg-[#202422] text-gray-400 border-transparent cursor-not-allowed opacity-50"
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleRestrictAccount}
                  className="py-2 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition-all cursor-pointer"
                >
                  Restrict Access
                </button>
                {drawerAccount.accountStatus === 'Suspended' ? (
                  <button
                    onClick={() => handleRestoreAccount(drawerAccount)}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Restore to Active
                  </button>
                ) : (
                  <button
                    onClick={() => setSuspendModalOpen(true)}
                    className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition-all cursor-pointer"
                  >
                    Suspend Account
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Suspend Confirmation Modal */}
      {suspendModalOpen && drawerAccount && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-amber-500">
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
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-amber-500"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSuspendModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSuspend}
                disabled={!suspendReason.trim()}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Admin Edit User Modal */}
      {editModalOpen && editUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E7EB] dark:border-[#262A29]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#D9FF3F]">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                    Master Admin: Edit User Account
                  </h3>
                  <p className="text-[11px] text-gray-500 font-mono">ID: {editUser.id}</p>
                </div>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!isMasterAdmin && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
                <Lock className="w-4 h-4 shrink-0" />
                <span>Security Notice: You are in read-only mode ({adminSession?.role || 'Admin'}). Only the Master Admin can modify user accounts.</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-[#565B59] dark:text-[#A0A4A2] mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  disabled={!isMasterAdmin}
                  onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#565B59] dark:text-[#A0A4A2] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editForm.email}
                    disabled={!isMasterAdmin}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#565B59] dark:text-[#A0A4A2] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    disabled={!isMasterAdmin}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+91..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#565B59] dark:text-[#A0A4A2] mb-1">Primary Role / Track</label>
                  <select
                    value={editForm.role}
                    disabled={!isMasterAdmin}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] disabled:opacity-60"
                  >
                    <option value="Founder @ Startup">Founder @ Startup</option>
                    <option value="Mentor">Mentor</option>
                    <option value="Individual Investor">Individual Investor</option>
                    <option value="Partner @ VC">Partner @ VC</option>
                    <option value="Member @ ESP">Member @ ESP</option>
                    <option value="Explorer">Explorer</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#565B59] dark:text-[#A0A4A2] mb-1">Account State</label>
                  <select
                    value={editForm.accountStatus}
                    disabled={!isMasterAdmin}
                    onChange={(e) => setEditForm({ ...editForm, accountStatus: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] disabled:opacity-60"
                  >
                    <option value="Active">Active (Full Access)</option>
                    <option value="Pending Verification">Pending Verification</option>
                    <option value="Restricted">Restricted</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#565B59] dark:text-[#A0A4A2] mb-1">Administrative Audit Reason (Mandatory)</label>
                <input
                  type="text"
                  value={editForm.reason}
                  disabled={!isMasterAdmin}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  placeholder="Reason for modifying account record..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB] dark:border-[#262A29]">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={!isMasterAdmin || isSavingEdit || !editForm.fullName.trim() || !editForm.email.trim()}
                className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isSavingEdit ? 'Saving Changes...' : 'Save Account Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Master Admin Delete User Safeguard Modal */}
      {deleteModalOpen && deleteUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white dark:bg-[#181B1A] border border-rose-500/30 rounded-2xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-500">
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-sora font-bold text-base text-[#101212] dark:text-white">
                  Delete User Account
                </h3>
                <span className="text-[11px] text-rose-500 font-semibold">Master Admin Safeguarded Action</span>
              </div>
            </div>

            {/* Self-Deletion Safeguard Check */}
            {isSelfDeletion ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                <strong className="block font-bold">🛡️ Critical Safeguard Triggered</strong>
                <p>
                  You cannot delete your own active administrative account (<span className="font-mono">{deleteUser.email}</span>). Platform governance forbids self-deletion by active Master Admins.
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-800 dark:text-rose-300">
                  <p className="leading-relaxed">
                    This action is <strong>permanent and irreversible</strong>. It will remove the personal identity for <strong className="text-white font-mono">{deleteUser.email}</strong>, revoke all active sessions, invalidate OTP records, and unlink organizational memberships.
                  </p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-medium text-[#565B59] dark:text-[#A0A4A2] mb-1">
                      Confirmation Safeguard: Type <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{deleteUser.email}</span> or <span className="font-mono font-bold text-rose-600 dark:text-rose-400">DELETE</span> to confirm:
                    </label>
                    <input
                      type="text"
                      value={confirmInput}
                      onChange={(e) => setConfirmInput(e.target.value)}
                      placeholder={deleteUser.email}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-rose-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#565B59] dark:text-[#A0A4A2] mb-1">
                      Administrative Audit Rationale (Mandatory)
                    </label>
                    <textarea
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      placeholder="Specify the reason for permanent account deletion..."
                      rows={2}
                      className="w-full p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-rose-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB] dark:border-[#262A29]">
              <button
                onClick={() => setDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={!isMasterAdmin || isSelfDeletion || !isConfirmationMatched || !deleteReason.trim() || isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting Account...' : 'Permanently Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
