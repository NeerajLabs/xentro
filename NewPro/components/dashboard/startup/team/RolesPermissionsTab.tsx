'use client';

import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Crown,
  Users,
  Check,
  X,
  AlertTriangle,
  Info,
  ChevronRight,
} from 'lucide-react';
import {
  StartupDashboardRole,
  StartupPermissionSet,
  StartupTeamMember,
} from '@/types/startup';
import {
  getDefaultPermissionsForRole,
  isSensitiveDomain,
} from '@/lib/startupTeamService';

interface RolesPermissionsTabProps {
  members: StartupTeamMember[];
}

export const RolesPermissionsTab: React.FC<RolesPermissionsTabProps> = ({ members }) => {
  const [selectedRole, setSelectedRole] = useState<StartupDashboardRole>('admin');

  const systemRoles: Array<{
    id: StartupDashboardRole;
    title: string;
    description: string;
    badge: string;
    isSensitive: boolean;
  }> = [
    {
      id: 'owner',
      title: 'Owner / Founder',
      description: 'Sole governing owner with full protected capabilities over billing, deletion, and entity administration.',
      badge: 'Protected',
      isSensitive: true,
    },
    {
      id: 'admin',
      title: 'Admin',
      description: 'General operational management. Can manage profile, team invitations, universal asks, and opportunities.',
      badge: 'Management',
      isSensitive: false,
    },
    {
      id: 'finance',
      title: 'Finance Lead',
      description: 'Dedicated financial officer with full access to financial telemetry, burn models, DD locker, and billing.',
      badge: 'Confidential',
      isSensitive: true,
    },
    {
      id: 'operations',
      title: 'Operations Manager',
      description: 'Manages day-to-day workflow, asks, ecosystem connections, meetings, and milestone content.',
      badge: 'Operational',
      isSensitive: false,
    },
    {
      id: 'team_member',
      title: 'Team Member',
      description: 'Standard team contributor with view access to active asks and basic opportunities.',
      badge: 'Standard',
      isSensitive: false,
    },
    {
      id: 'advisor',
      title: 'Advisor',
      description: 'Restricted advisory access. Read-only permissions for shared documents and roadmap discussions.',
      badge: 'Restricted',
      isSensitive: false,
    },
    {
      id: 'viewer',
      title: 'Viewer',
      description: 'Strictly read-only observer across public profile management without edit rights.',
      badge: 'Read Only',
      isSensitive: false,
    },
  ];

  const activeRolePreset: StartupPermissionSet = getDefaultPermissionsForRole(selectedRole);

  const permissionGroupsList: Array<{
    id: keyof StartupPermissionSet;
    label: string;
    isSensitive?: boolean;
    permissions: Array<{ key: string; label: string }>;
  }> = [
    {
      id: 'profile',
      label: 'Profile Management',
      permissions: [
        { key: 'viewProfileManagement', label: 'View Profile Workspace' },
        { key: 'editBasicInfo', label: 'Edit Basic Info' },
        { key: 'editPitch', label: 'Edit Pitch Deck & Video' },
        { key: 'manageTeam', label: 'Manage Team Members' },
        { key: 'manageTalentAsk', label: 'Manage Talent Ask' },
        { key: 'managePublicVisibility', label: 'Manage Public Visibility' },
        { key: 'publishProfile', label: 'Publish Profile' },
      ],
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      permissions: [
        { key: 'viewOpportunities', label: 'View Opportunities' },
        { key: 'saveOpportunities', label: 'Save Opportunities' },
        { key: 'applyOpportunities', label: 'Apply to Opportunities' },
        { key: 'manageApplications', label: 'Manage Applications' },
      ],
    },
    {
      id: 'connections',
      label: 'Connections & Messaging',
      permissions: [
        { key: 'viewConnections', label: 'View Connections' },
        { key: 'manageConnections', label: 'Manage Connections' },
        { key: 'messageConnections', label: 'Message Connections' },
        { key: 'scheduleMeetings', label: 'Schedule Meetings' },
      ],
    },
    {
      id: 'ask',
      label: 'Universal Ask Engine',
      permissions: [
        { key: 'viewAsks', label: 'View Asks' },
        { key: 'createAsk', label: 'Create Ask' },
        { key: 'editAsk', label: 'Edit Ask' },
        { key: 'publishAsk', label: 'Publish Ask' },
        { key: 'closeAsk', label: 'Close Ask' },
        { key: 'manageAskResponses', label: 'Manage Responses' },
      ],
    },
    {
      id: 'finance',
      label: 'Finance & Cap Table',
      isSensitive: true,
      permissions: [
        { key: 'viewFinancials', label: 'View Financial Records' },
        { key: 'uploadFinancialData', label: 'Upload Financial Data' },
        { key: 'editFinancialData', label: 'Edit Financials' },
        { key: 'exportFinancialData', label: 'Export Reports' },
        { key: 'manageFinancialVisibility', label: 'Manage Financial Visibility' },
      ],
    },
    {
      id: 'ddLocker',
      label: 'Due Diligence Locker',
      isSensitive: true,
      permissions: [
        { key: 'viewDDLocker', label: 'View DD Locker' },
        { key: 'uploadDocuments', label: 'Upload Documents' },
        { key: 'deleteDocuments', label: 'Delete Documents' },
        { key: 'manageFolders', label: 'Manage Folders' },
        { key: 'approveAccess', label: 'Approve DD Access' },
        { key: 'revokeAccess', label: 'Revoke Access' },
        { key: 'viewActivityLogs', label: 'View Audit Logs' },
      ],
    },
    {
      id: 'content',
      label: 'Content & Updates',
      permissions: [
        { key: 'viewContent', label: 'View Content' },
        { key: 'createPosts', label: 'Create Posts' },
        { key: 'editPosts', label: 'Edit Posts' },
        { key: 'publishPosts', label: 'Publish Posts' },
        { key: 'deletePosts', label: 'Delete Posts' },
        { key: 'featurePosts', label: 'Feature Posts' },
      ],
    },
    {
      id: 'team',
      label: 'Team & Permissions',
      permissions: [
        { key: 'viewMembers', label: 'View Members' },
        { key: 'inviteMembers', label: 'Invite Members' },
        { key: 'editMembers', label: 'Edit Members' },
        { key: 'removeMembers', label: 'Remove Members' },
        { key: 'assignRoles', label: 'Assign Roles' },
        { key: 'changePermissions', label: 'Change Permissions' },
      ],
    },
    {
      id: 'billing',
      label: 'Billing & Subscriptions',
      isSensitive: true,
      permissions: [
        { key: 'viewBilling', label: 'View Billing' },
        { key: 'manageSubscription', label: 'Manage Subscription' },
        { key: 'viewInvoices', label: 'View Invoices' },
        { key: 'managePaymentMethod', label: 'Payment Methods' },
        { key: 'downloadInvoices', label: 'Download Invoices' },
      ],
    },
    {
      id: 'entityAdministration',
      label: 'Entity Administration',
      isSensitive: true,
      permissions: [
        { key: 'manageStartupSettings', label: 'Manage Settings' },
        { key: 'changeOfficialEmail', label: 'Change Official Email' },
        { key: 'changeProfileVisibility', label: 'Change Visibility' },
        { key: 'transferOwnership', label: 'Transfer Ownership' },
        { key: 'archiveStartup', label: 'Archive Venture' },
      ],
    },
  ];

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* Informational Guidance Banner */}
      <div className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex items-start gap-3">
        <div className="p-2.5 rounded-2xl bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-[#101212] dark:text-white">
            Role-Based Access Presets & Granular Permissions
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
            In Xentro, <span className="font-semibold text-[#101212] dark:text-white">Role = preset</span>, while{' '}
            <span className="font-semibold text-[#101212] dark:text-white">Permissions = actual granular capabilities</span>.
            Assigning a role equips standard defaults, but individual members can have customized access overrides. Sensitive domains require explicit confirmation.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 7 System Roles List */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3 h-fit">
          <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider mb-2">
            System Defined Roles
          </h4>

          <div className="space-y-2">
            {systemRoles.map((r) => {
              const isSelected = selectedRole === r.id;
              const countInRole = members.filter(
                (m) => m.dashboardRole === r.id && m.dashboardAccessEnabled
              ).length;

              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'border-[#D9FF3F] bg-[#D9FF3F]/10'
                      : 'border-gray-200 dark:border-[#262A29] hover:bg-gray-50 dark:hover:bg-[#202422]'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#101212] dark:text-white">
                        {r.title}
                      </span>
                      {r.isSensitive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                          Sensitive
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-2">
                      {r.description}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/5 text-[#565B59] dark:text-[#B6B8B7] shrink-0">
                    {countInRole} {countInRole === 1 ? 'member' : 'members'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Permission Breakdown for Selected Role */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-[#101212] dark:text-white">
                  Preset Capabilities: {systemRoles.find((r) => r.id === selectedRole)?.title}
                </h4>
                {systemRoles.find((r) => r.id === selectedRole)?.isSensitive && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Includes Sensitive Access</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
                Inspect granted capabilities across the 10 security domain groups.
              </p>
            </div>
          </div>

          {/* 10 Domain Groups Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {permissionGroupsList.map((group) => {
              const groupPerms = activeRolePreset[group.id] || {};

              return (
                <div
                  key={group.id}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#101212] dark:text-white">
                        {group.label}
                      </span>
                      {group.isSensitive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                          Sensitive
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {group.permissions.map((p) => {
                      const isGranted = (groupPerms as any)[p.key] === true;

                      return (
                        <div
                          key={p.key}
                          className="flex items-center justify-between text-[11px] py-1 border-b border-gray-200/50 dark:border-[#262A29] last:border-0"
                        >
                          <span className={isGranted ? 'text-[#101212] dark:text-white font-medium' : 'text-gray-400'}>
                            {p.label}
                          </span>
                          {isGranted ? (
                            <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                              <Check className="w-3 h-3" />
                              <span>Granted</span>
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px]">Restricted</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
