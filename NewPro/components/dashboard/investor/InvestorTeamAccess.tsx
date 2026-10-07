'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  UserPlus,
  Mail,
  CheckCircle2,
  Trash2,
  Info,
  Clock,
  Building2,
  Lock,
  X,
  Plus,
  Sliders,
  Eye,
  EyeOff,
  LayoutDashboard,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
  ROLE_PERMISSION_PRESETS,
} from '@/lib/investorOrganizationService';
import { getUserProfile } from '@/lib/userProfile';
import {
  InvestorOrgMembership,
  InvestorOrgInvitation,
  InvestorOrganization,
  ResourceAccessMode,
} from '@/types/investorOrganization';
import { InvestorEntityRole } from '@/types/investor';
import { CreateInvestorOrganizationModal } from './CreateInvestorOrganizationModal';

const ROLES: InvestorEntityRole[] = [
  'Owner/Managing Partner',
  'Admin',
  'Partner',
  'Principal',
  'Associate',
  'Analyst',
  'Portfolio Manager',
  'Finance/Operations',
  'Viewer',
];

export const InvestorTeamAccess: React.FC = () => {
  const { showToast } = useToast();
  const [activeContext, setActiveContext] = useState(() =>
    investorOrganizationService.getActiveContext()
  );
  const [activeOrg, setActiveOrg] = useState<InvestorOrganization | null>(() =>
    investorOrganizationService.getActiveOrganization()
  );
  const [members, setMembers] = useState<InvestorOrgMembership[]>([]);
  const [invitations, setInvitations] = useState<InvestorOrgInvitation[]>([]);

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [isMatrixOpen, setIsMatrixOpen] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<InvestorEntityRole>('Associate');
  const [inviteTitle, setInviteTitle] = useState('');
  const [inviteDealMode, setInviteDealMode] = useState<ResourceAccessMode>('all');
  const [invitePortfolioMode, setInvitePortfolioMode] = useState<ResourceAccessMode>('all');

  // Transfer Ownership State
  const [selectedNewOwner, setSelectedNewOwner] = useState<string>('');

  const refreshData = () => {
    const ctx = investorOrganizationService.getActiveContext();
    setActiveContext(ctx);
    const org = investorOrganizationService.getActiveOrganization();
    setActiveOrg(org);

    if (org) {
      setMembers(investorOrganizationService.getOrganizationMembers(org.id));
      setInvitations(investorOrganizationService.getOrganizationInvitations(org.id));
    } else {
      setMembers([]);
      setInvitations([]);
    }
  };

  useEffect(() => {
    refreshData();

    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, refreshData);
    window.addEventListener(INVESTOR_ORG_EVENTS.MEMBERS_CHANGED, refreshData);
    window.addEventListener(INVESTOR_ORG_EVENTS.INVITATIONS_CHANGED, refreshData);
    window.addEventListener(INVESTOR_ORG_EVENTS.ORG_UPDATED, refreshData);

    return () => {
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, refreshData);
      window.removeEventListener(INVESTOR_ORG_EVENTS.MEMBERS_CHANGED, refreshData);
      window.removeEventListener(INVESTOR_ORG_EVENTS.INVITATIONS_CHANGED, refreshData);
      window.removeEventListener(INVESTOR_ORG_EVENTS.ORG_UPDATED, refreshData);
    };
  }, []);

  // Handlers
  const handleRoleChange = (memberId: string, newRole: InvestorEntityRole) => {
    if (!activeOrg) return;
    const res = investorOrganizationService.updateMemberRole(activeOrg.id, memberId, newRole);
    if (!res.success) {
      showToast(res.message || 'Cannot change role', 'error');
    } else {
      showToast(`Updated member role to ${newRole}`, 'success');
      refreshData();
    }
  };

  const handleTogglePublicTeam = (memberId: string, current: boolean, canAccess: boolean) => {
    if (!activeOrg) return;
    investorOrganizationService.updateMemberVisibility(activeOrg.id, memberId, !current, canAccess);
    showToast(
      !current
        ? 'Member is now visible on Public Organization Profile'
        : 'Member hidden from Public Profile (internal only)',
      'info'
    );
    refreshData();
  };

  const handleToggleWorkspace = (memberId: string, isPublic: boolean, currentAccess: boolean) => {
    if (!activeOrg) return;
    investorOrganizationService.updateMemberVisibility(activeOrg.id, memberId, isPublic, !currentAccess);
    showToast(
      !currentAccess
        ? 'Member granted dashboard workspace access'
        : 'Member workspace access revoked',
      'info'
    );
    refreshData();
  };

  const handleToggleDealMode = (member: InvestorOrgMembership) => {
    if (!activeOrg) return;
    const nextMode: ResourceAccessMode = member.dealAccessMode === 'all' ? 'assigned' : 'all';
    investorOrganizationService.updateMemberAccessModes(
      activeOrg.id,
      member.id,
      nextMode,
      member.portfolioAccessMode
    );
    showToast(
      nextMode === 'all' ? 'Granted access to All Deals' : 'Restricted to Assigned Deals Only',
      'info'
    );
    refreshData();
  };

  const handleRemoveMember = (member: InvestorOrgMembership) => {
    if (!activeOrg) return;
    if (confirm(`Remove ${member.userName} from ${activeOrg.name}?`)) {
      const res = investorOrganizationService.removeOrganizationMember(activeOrg.id, member.id);
      if (!res.success) {
        showToast(res.message || 'Cannot remove member', 'error');
      } else {
        showToast(`Removed ${member.userName} from organization`, 'info');
        refreshData();
      }
    }
  };

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !inviteEmail.trim()) return;

    investorOrganizationService.inviteOrganizationMember({
      organizationId: activeOrg.id,
      organizationName: activeOrg.name,
      email: inviteEmail.trim(),
      name: inviteName.trim() || undefined,
      role: inviteRole,
      title: inviteTitle.trim() || inviteRole,
      dealAccessMode: inviteDealMode,
      portfolioAccessMode: invitePortfolioMode,
      invitedBy: getUserProfile().name || 'Managing Partner',
    });

    showToast(`Invitation sent to ${inviteEmail}`, 'success');
    setIsInviteOpen(false);
    setInviteEmail('');
    setInviteName('');
    setInviteTitle('');
    refreshData();
  };

  const handleRevokeInvite = (invitationId: string) => {
    investorOrganizationService.revokeInvitation(invitationId);
    showToast('Invitation revoked', 'info');
    refreshData();
  };

  const handleTransferOwnership = () => {
    if (!activeOrg || !selectedNewOwner) return;
    const res = investorOrganizationService.transferOrganizationOwnership(
      activeOrg.id,
      selectedNewOwner
    );
    if (!res.success) {
      showToast(res.message || 'Failed to transfer ownership', 'error');
    } else {
      showToast('Ownership successfully transferred!', 'success');
      setIsTransferOpen(false);
      refreshData();
    }
  };

  // IF ACTIVE CONTEXT IS INDIVIDUAL INVESTOR
  if (activeContext.type === 'individual') {
    return (
      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4 text-center max-w-xl mx-auto py-10">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold font-sora text-[#101212] dark:text-white">
              Personal Account Mode (Individual Investor)
            </h2>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed max-w-md mx-auto">
              You are currently viewing your personal angel investor workspace. Multi-seat team
              collaboration, role-based access control (RBAC), and deal assignment belong to{' '}
              <span className="font-semibold text-[#101212] dark:text-white">
                Investor Organization Accounts
              </span>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                investorOrganizationService.setActiveContext({
                  type: 'organization',
                  organizationId: 'org_apex_vc',
                });
                showToast('Switched to Apex Ventures Organization', 'success');
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Building2 className="w-4 h-4" />
              <span>Switch to Apex Ventures</span>
            </button>

            <button
              onClick={() => setIsCreateOrgOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-[#101212] dark:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Organization</span>
            </button>
          </div>
        </div>

        <CreateInvestorOrganizationModal
          isOpen={isCreateOrgOpen}
          onClose={() => setIsCreateOrgOpen(false)}
        />
      </div>
    );
  }

  // ACTIVE CONTEXT IS AN INVESTOR ORGANIZATION
  return (
    <div className="space-y-6">
      {/* 1. Header with Org Title & Actions */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold font-sora text-[#101212] dark:text-white">
              Team & Role-Based Access Control
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F] text-[#101212]">
              {activeOrg?.name || 'Apex Ventures'}
            </span>
            <span className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
              ({members.length} Members)
            </span>
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
            Manage firm hierarchy, deal access scoping, public profile visibility, and dashboard permissions.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsMatrixOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Permissions Matrix</span>
          </button>

          <button
            onClick={() => setIsTransferOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-amber-600 dark:text-amber-400 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Transfer firm ownership"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Transfer Ownership</span>
          </button>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:opacity-90 active:scale-98"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Member</span>
          </button>
        </div>
      </div>

      {/* 2. Architectural Rule Callout Banner */}
      <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>
            <strong>Architecture Rule:</strong> Membership &ne; Public Profile Visibility &ne; Dashboard Access. Each member&apos;s visibility and resource scopes can be toggled independently below.
          </span>
        </div>
      </div>

      {/* 3. Members Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#262A29] text-[10px] uppercase font-bold text-[#565B59] dark:text-[#8E9290]">
                <th className="pb-3">Member & Title</th>
                <th className="pb-3">Preset Role</th>
                <th className="pb-3">Deal Scope</th>
                <th className="pb-3 text-center">Public on Profile</th>
                <th className="pb-3 text-center">Dashboard Access</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#202422]">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50/50 dark:hover:bg-[#141615] transition-colors">
                  {/* Member & Title */}
                  <td className="py-3.5 pr-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          member.userAvatar ||
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
                        }
                        alt={member.userName}
                        className="w-9 h-9 rounded-xl object-cover border border-gray-200 dark:border-gray-700"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[#101212] dark:text-white truncate">
                            {member.userName}
                          </span>
                          {member.isOwner && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#D9FF3F] text-[#101212]">
                              Owner
                            </span>
                          )}
                          {member.status === 'invited' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                              Invited
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] block truncate">
                          {member.title} &bull; {member.userEmail}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Preset Role Dropdown */}
                  <td className="py-3.5 pr-3">
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as InvestorEntityRole)}
                      className="px-2.5 py-1.5 rounded-lg bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Deal Scope Toggle */}
                  <td className="py-3.5 pr-3">
                    <button
                      type="button"
                      onClick={() => handleToggleDealMode(member)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        member.dealAccessMode === 'all'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      }`}
                      title="Click to toggle between All Deals and Assigned Deals Only"
                    >
                      {member.dealAccessMode === 'all' ? 'All Deals' : 'Assigned Only'}
                    </button>
                  </td>

                  {/* Public Team Visibility Toggle (Rule #20) */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleTogglePublicTeam(
                          member.id,
                          member.isPublicTeam,
                          member.canAccessWorkspace
                        )
                      }
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        member.isPublicTeam
                          ? 'bg-[#D9FF3F]/20 text-[#71870A] dark:text-[#D9FF3F]'
                          : 'bg-gray-100 dark:bg-[#202422] text-gray-400'
                      }`}
                      title={
                        member.isPublicTeam
                          ? 'Visible on Public Profile (Click to hide)'
                          : 'Internal Only (Click to show publicly)'
                      }
                    >
                      {member.isPublicTeam ? (
                        <Eye className="w-4 h-4 mx-auto" />
                      ) : (
                        <EyeOff className="w-4 h-4 mx-auto" />
                      )}
                    </button>
                  </td>

                  {/* Workspace Operating Access (Rule #20) */}
                  <td className="py-3.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleWorkspace(
                          member.id,
                          member.isPublicTeam,
                          member.canAccessWorkspace
                        )
                      }
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        member.canAccessWorkspace
                          ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          : 'bg-gray-100 dark:bg-[#202422] text-gray-400'
                      }`}
                      title={
                        member.canAccessWorkspace
                          ? 'Has Dashboard Workspace Access'
                          : 'No Workspace Access'
                      }
                    >
                      <LayoutDashboard className="w-4 h-4 mx-auto" />
                    </button>
                  </td>

                  {/* Actions / Final Owner Protection (Rule #34) */}
                  <td className="py-3.5 pl-3 text-right">
                    {member.isOwner ? (
                      <span
                        className="text-[10px] text-gray-400 italic cursor-help"
                        title="Final Owner cannot be removed until ownership is transferred to another member."
                      >
                        Protected Owner
                      </span>
                    ) : (
                      <button
                        onClick={() => handleRemoveMember(member)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                        title="Remove member from organization"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Pending Invitations Table */}
      {invitations.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#565B59] dark:text-[#8E9290]">
            Pending Invitations ({invitations.filter((i) => i.status === 'pending').length})
          </h3>

          <div className="space-y-2">
            {invitations
              .filter((i) => i.status === 'pending')
              .map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <div>
                      <span className="font-bold text-[#101212] dark:text-white">
                        {inv.email}
                      </span>
                      <span className="text-[10px] text-gray-400 block">
                        Invited as {inv.role} &bull; Invited by {inv.invitedBy}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-500 font-semibold">Pending</span>
                    <button
                      onClick={() => handleRevokeInvite(inv.id)}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-gray-200 dark:bg-gray-700 hover:bg-red-100 dark:hover:bg-red-950/40 text-gray-600 dark:text-gray-300 hover:text-red-600 transition-all cursor-pointer"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* INVITE MEMBER MODAL */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#262A29] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white">
                  Invite Organization Member
                </h3>
              </div>
              <button
                onClick={() => setIsInviteOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendInvite} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@apexventures.vc"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Priya Sharma"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Preset Role
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as InvestorEntityRole)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Title in Organization
                  </label>
                  <input
                    type="text"
                    value={inviteTitle}
                    onChange={(e) => setInviteTitle(e.target.value)}
                    placeholder="e.g. Principal - DeepTech"
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Deal Flow Access
                  </label>
                  <select
                    value={inviteDealMode}
                    onChange={(e) => setInviteDealMode(e.target.value as ResourceAccessMode)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    <option value="all">All Deals</option>
                    <option value="assigned">Assigned Deals Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                    Portfolio Access
                  </label>
                  <select
                    value={invitePortfolioMode}
                    onChange={(e) => setInvitePortfolioMode(e.target.value as ResourceAccessMode)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
                  >
                    <option value="all">All Portfolio</option>
                    <option value="assigned">Assigned Portcos Only</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                The invited user will access this organization through their existing Personal Account
                once they accept the invitation.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-[#101212] dark:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#c7ee2f] text-[#101212] text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSFER OWNERSHIP MODAL */}
      {isTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#262A29] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white">
                  Transfer Firm Ownership
                </h3>
              </div>
              <button
                onClick={() => setIsTransferOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
              Designate a new Owner/Managing Partner for{' '}
              <span className="font-semibold text-[#101212] dark:text-white">{activeOrg?.name}</span>.
              This is required before the current final Owner can step down or leave.
            </p>

            <div>
              <label className="text-xs font-semibold text-[#101212] dark:text-white block mb-1">
                Select New Owner
              </label>
              <select
                value={selectedNewOwner}
                onChange={(e) => setSelectedNewOwner(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F]"
              >
                <option value="">-- Choose active member --</option>
                {members
                  .filter((m) => !m.isOwner && m.status === 'active')
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.userName} ({m.title})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsTransferOpen(false)}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-semibold text-[#101212] dark:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedNewOwner}
                onClick={handleTransferOwnership}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Confirm Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMISSIONS MATRIX MODAL */}
      {isMatrixOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col p-5 shadow-2xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-[#262A29] pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#71870A] dark:text-[#D9FF3F]" />
                <h3 className="text-sm font-bold font-sora text-[#101212] dark:text-white">
                  9-Role RBAC Permissions Matrix
                </h3>
              </div>
              <button
                onClick={() => setIsMatrixOpen(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar">
              <table className="w-full text-left text-[11px] min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-[#262A29] text-[10px] uppercase font-bold text-gray-400">
                    <th className="pb-2">Role</th>
                    <th className="pb-2 text-center">Manage Org</th>
                    <th className="pb-2 text-center">Deal Flow</th>
                    <th className="pb-2 text-center">IC Decision</th>
                    <th className="pb-2 text-center">Portfolio</th>
                    <th className="pb-2 text-center">DD Vault</th>
                    <th className="pb-2 text-center">Billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-[#202422]">
                  {ROLES.map((role) => {
                    const p = ROLE_PERMISSION_PRESETS[role];
                    return (
                      <tr key={role} className="hover:bg-gray-50/50 dark:hover:bg-[#141615]">
                        <td className="py-2.5 font-bold text-[#101212] dark:text-white">{role}</td>
                        <td className="py-2.5 text-center">
                          {p.manageOrganization ? '✅' : '—'}
                        </td>
                        <td className="py-2.5 text-center">{p.viewDealFlow ? '✅' : '—'}</td>
                        <td className="py-2.5 text-center">
                          {p.createInvestmentDecision ? '✅' : '—'}
                        </td>
                        <td className="py-2.5 text-center">{p.viewPortfolio ? '✅' : '—'}</td>
                        <td className="py-2.5 text-center">
                          {p.accessDiligenceVault ? '✅' : '—'}
                        </td>
                        <td className="py-2.5 text-center">{p.manageBilling ? '✅' : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-200 dark:border-[#262A29]">
              <button
                type="button"
                onClick={() => setIsMatrixOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] text-xs font-bold text-[#101212] dark:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <CreateInvestorOrganizationModal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
        onCreated={() => refreshData()}
      />
    </div>
  );
};
