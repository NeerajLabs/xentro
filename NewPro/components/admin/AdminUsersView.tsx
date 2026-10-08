'use client';

import React, { useState } from 'react';
import { MOCK_ADMIN_USERS } from '@/data/adminData';
import { AdminUserRecord } from '@/types/admin';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Zap,
  Lock,
  Unlock,
  Eye,
  X,
  UserCheck,
  Download,
} from 'lucide-react';

export const AdminUsersView: React.FC = () => {
  const [users, setUsers] = useState<AdminUserRecord[]>(MOCK_ADMIN_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'All' | 'Startup' | 'Mentor' | 'Investor' | 'ESP'>('All');
  const [verifFilter, setVerifFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const loadUsers = async () => {
      try {
        const backendUrl = getBackendBaseUrl();
        const resp = await fetch(`${backendUrl}/admin/users/`);
        if (resp.ok) {
          const data = await resp.json();
          if (data?.success && data?.data?.users) {
            const mapped: AdminUserRecord[] = data.data.users.map((u: any) => ({
              id: u.id,
              name: u.name,
              userType: (u.user_type || u.role || 'Startup') as any,
              organization: u.organization || 'Independent',
              email: u.email,
              location: u.location || 'India',
              verificationStatus: u.identityStatus === 'VERIFIED' ? 'Verified' : 'Under Review',
              subscriptionPlan: 'Free Tier',
              profileCompletion: 80,
              accountStatus: u.isActive ? 'Active' : 'Pending',
              joinDate: u.createdDate ? u.createdDate.split('T')[0] : new Date().toISOString().split('T')[0],
              lastActive: u.lastActive || 'Just now',
              avatar: u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`,
              bio: u.bio || '',
              phone: u.phone || '',
              connectionsCount: u.connectionsCount || 0,
            }));
            setUsers(mapped);
          }
        }
      } catch {
        // Fallback to empty
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'All' && u.userType !== roleFilter) return false;
    if (verifFilter !== 'All' && u.verificationStatus !== verifFilter) return false;
    if (statusFilter !== 'All' && u.accountStatus !== statusFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchOrg = u.organization?.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchLoc = u.location.toLowerCase().includes(q);
      return matchName || matchOrg || matchEmail || matchLoc;
    }
    return true;
  });

  const handleOpenDrawer = (user: AdminUserRecord) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const handleToggleVerification = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.verificationStatus === 'Verified' ? 'Unverified' : 'Verified';
          return { ...u, verificationStatus: nextStatus };
        }
        return u;
      })
    );
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, verificationStatus: prev.verificationStatus === 'Verified' ? 'Unverified' : 'Verified' } : null
      );
    }
    showToast('Verification status updated');
  };

  const handleToggleSuspension = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const nextStatus = u.accountStatus === 'Suspended' ? 'Active' : 'Suspended';
          return { ...u, accountStatus: nextStatus };
        }
        return u;
      })
    );
    if (selectedUser && selectedUser.id === userId) {
      setSelectedUser((prev) =>
        prev ? { ...prev, accountStatus: prev.accountStatus === 'Suspended' ? 'Active' : 'Suspended' } : null
      );
    }
    showToast('Account status modified');
  };

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 2500);
  };

  const getRoleBadge = (type: string) => {
    switch (type) {
      case 'Startup':
        return 'bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] border-[#D9FF3F]/30';
      case 'Mentor':
        return 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30';
      case 'Investor':
        return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30';
      case 'ESP':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getVerifBadge = (status: string) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case 'Under Review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <Clock className="w-3 h-3" />
            Under Review
          </span>
        );
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'Needs Information':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-500/15 text-orange-600 dark:text-orange-400">
            <AlertCircle className="w-3 h-3" />
            Needs Info
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-[#262A29] text-gray-500">
            Unverified
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-xl bg-[#101212] dark:bg-[#202422] text-[#D9FF3F] text-xs font-bold border border-[#D9FF3F]/30 shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {/* Header Controls & Filters */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-4">
        {/* Role Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs">
            {(['All', 'Startup', 'Mentor', 'Investor', 'ESP'] as const).map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  roleFilter === role
                    ? 'bg-white dark:bg-[#262A29] text-[#101212] dark:text-[#D9FF3F] font-bold shadow-xs'
                    : 'text-[#6E7370] dark:text-[#8E9390] hover:text-[#101212] dark:hover:text-white'
                }`}
              >
                {role === 'All' ? 'All Roles (14.8k)' : `${role}s`}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => alert('Exporting ecosystem members table as CSV...')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Secondary Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Search bar */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8E9390]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, organization, email, location..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] focus:border-[#D9FF3F] text-xs text-[#101212] dark:text-white placeholder-[#8E9390] outline-hidden transition-all"
            />
          </div>

          {/* Verification filter */}
          <div>
            <select
              value={verifFilter}
              onChange={(e) => setVerifFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
            >
              <option value="All">All Verification Statuses</option>
              <option value="Verified">Verified Only</option>
              <option value="Under Review">Under Review</option>
              <option value="Pending">Pending</option>
              <option value="Needs Information">Needs Information</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Account Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:border-[#D9FF3F] outline-hidden"
            >
              <option value="All">All Account States</option>
              <option value="Active">Active Only</option>
              <option value="Restricted">Restricted</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Master Users Table */}
      <div className="rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E5E7EB] dark:border-[#262A29] bg-gray-50/50 dark:bg-[#151716] text-[11px] font-mono uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                <th className="py-3 px-4">Entity & Member</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4">Subscription</th>
                <th className="py-3 px-4">Profile Done</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#262A29] text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#6E7370] dark:text-[#8E9390]">
                    No ecosystem participants match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => handleOpenDrawer(u)}
                    className="hover:bg-gray-50/80 dark:hover:bg-[#202422]/60 cursor-pointer transition-colors"
                  >
                    {/* Member Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-[#262A29] flex-shrink-0">
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={u.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#101212] dark:text-white truncate flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.verificationStatus === 'Verified' && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                            )}
                          </div>
                          <div className="text-[11px] text-[#6E7370] dark:text-[#8E9390] truncate">
                            {u.organization || u.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border ${getRoleBadge(
                          u.userType
                        )}`}
                      >
                        {u.userType}
                      </span>
                    </td>

                    {/* Verification */}
                    <td className="py-3 px-4">{getVerifBadge(u.verificationStatus)}</td>

                    {/* Subscription */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-[#101212] dark:text-gray-200">
                        {u.subscriptionPlan}
                      </span>
                    </td>

                    {/* Profile Completion */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-gray-100 dark:bg-[#262A29] overflow-hidden">
                          <div
                            className="h-full bg-[#D9FF3F] rounded-full"
                            style={{ width: `${u.profileCompletion}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-gray-500">
                          {u.profileCompletion}%
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          u.accountStatus === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : u.accountStatus === 'Restricted'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.accountStatus === 'Active'
                              ? 'bg-emerald-500'
                              : u.accountStatus === 'Restricted'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        {u.accountStatus}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="py-3 px-4 font-mono text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                      {u.lastActive}
                    </td>

                    {/* Direct Actions */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDrawer(u);
                        }}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262A29] transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between text-xs text-[#6E7370] dark:text-[#8E9390]">
          <span>
            Showing <strong className="text-[#101212] dark:text-white">{filteredUsers.length}</strong> of{' '}
            {users.length} indexed records
          </span>
          <span className="font-mono text-[11px]">Database Cluster: Primary Global-Asia-1</span>
        </div>
      </div>

      {/* Detail Slide-over Drawer */}
      {drawerOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative z-10 w-full max-w-xl bg-white dark:bg-[#181B1A] border-l border-[#E5E7EB] dark:border-[#262A29] shadow-2xl flex flex-col h-full overflow-y-auto animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-6 border-b border-[#E5E7EB] dark:border-[#262A29] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                  User Dossier &bull; {selectedUser.id}
                </span>
                <h3 className="font-sora text-lg font-bold text-[#101212] dark:text-white">
                  {selectedUser.name}
                </h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Profile Card */}
              <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29]">
                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-[#262A29]">
                  <img
                    src={selectedUser.avatar}
                    alt={selectedUser.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#101212] dark:text-white">
                      {selectedUser.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${getRoleBadge(
                        selectedUser.userType
                      )}`}
                    >
                      {selectedUser.userType}
                    </span>
                  </div>
                  <p className="text-xs text-[#565B59] dark:text-[#A0A4A2] mt-0.5">
                    {selectedUser.organization}
                  </p>
                  <p className="text-xs text-[#101212] dark:text-gray-300 mt-2 leading-relaxed">
                    {selectedUser.bio}
                  </p>
                </div>
              </div>

              {/* Metadata Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                  <span className="text-[#6E7370] dark:text-[#8E9390] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Address</span>
                  </span>
                  <p className="font-semibold text-[#101212] dark:text-white truncate">
                    {selectedUser.email}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                  <span className="text-[#6E7370] dark:text-[#8E9390] flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <span>Contact Number</span>
                  </span>
                  <p className="font-semibold text-[#101212] dark:text-white truncate">
                    {selectedUser.phone || 'Not provided'}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                  <span className="text-[#6E7370] dark:text-[#8E9390] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Location</span>
                  </span>
                  <p className="font-semibold text-[#101212] dark:text-white truncate">
                    {selectedUser.location}
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-1">
                  <span className="text-[#6E7370] dark:text-[#8E9390] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Registered On</span>
                  </span>
                  <p className="font-semibold text-[#101212] dark:text-white font-mono">
                    {selectedUser.joinDate}
                  </p>
                </div>
              </div>

              {/* Status & Compliance Checks */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                  Compliance & Account Controls
                </h4>

                <div className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-[#101212] dark:text-white block">
                        Verification Status
                      </span>
                      <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                        Controls public verified blue/lime badge on ecosystem listings
                      </span>
                    </div>
                    {getVerifBadge(selectedUser.verificationStatus)}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200 dark:border-[#262A29]">
                    <div>
                      <span className="font-semibold text-[#101212] dark:text-white block">
                        Account Standing
                      </span>
                      <span className="text-[11px] text-[#6E7370] dark:text-[#8E9390]">
                        Active, restricted from messaging, or suspended
                      </span>
                    </div>
                    <span className="font-bold text-[#101212] dark:text-white">
                      {selectedUser.accountStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Administrative Action Bar */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#6E7370] dark:text-[#8E9390]">
                  Immediate Admin Actions
                </h4>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleToggleVerification(selectedUser.id)}
                    className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold transition-all shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>
                      {selectedUser.verificationStatus === 'Verified'
                        ? 'Revoke Badge'
                        : 'Grant Verified'}
                    </span>
                  </button>

                  <button
                    onClick={() => handleToggleSuspension(selectedUser.id)}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                      selectedUser.accountStatus === 'Suspended'
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {selectedUser.accountStatus === 'Suspended' ? (
                      <>
                        <Unlock className="w-4 h-4" />
                        <span>Unsuspend User</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Suspend Account</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
