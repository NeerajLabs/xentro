'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  EyeOff,
  Crown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Trash2,
  UserMinus,
  Check,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  StartupTeamMember,
  StartupDashboardRole,
  TeamCategory,
  StartupMemberPublicFields,
  StartupPermissionSet,
} from '@/types/startup';
import {
  DEFAULT_PUBLIC_FIELDS,
  getDefaultPermissionsForRole,
  isSensitiveDomain,
} from '@/lib/startupTeamService';
import { SensitiveConfirmModal } from './SensitiveConfirmModal';
import { TransferOwnershipModal } from './TransferOwnershipModal';

interface MemberControlDrawerProps {
  isOpen: boolean;
  member: StartupTeamMember | null;
  allMembers: StartupTeamMember[];
  onClose: () => void;
  onUpdateMember: (id: string, updates: Partial<StartupTeamMember>) => void;
  onRemoveMember: (id: string) => void;
  onMarkFormer: (id: string, showInPublicFormer: boolean) => void;
  onTransferOwnership: (currentOwnerId: string, newOwnerId: string) => void;
}

export const MemberControlDrawer: React.FC<MemberControlDrawerProps> = ({
  isOpen,
  member,
  allMembers,
  onClose,
  onUpdateMember,
  onRemoveMember,
  onMarkFormer,
  onTransferOwnership,
}) => {
  if (!isOpen || !member) return null;

  const isSoleOwner =
    member.dashboardRole === 'owner' &&
    allMembers.filter((m) => m.dashboardRole === 'owner' && m.entityMembershipStatus === 'active').length <= 1;

  // Local state initialized with member props
  const [name, setName] = useState(member.name);
  const [designation, setDesignation] = useState(member.designation || member.role);
  const [department, setDepartment] = useState(member.department || 'Operations');
  const [teamCategory, setTeamCategory] = useState<TeamCategory>(member.teamCategory || 'core_team');
  const [shortBio, setShortBio] = useState(member.shortBio || member.bio || '');
  const [expertise, setExpertise] = useState(member.expertise?.join(', ') || '');
  const [linkedin, setLinkedin] = useState(member.linkedin || '');

  // Public Profile
  const [publicProfileVisible, setPublicProfileVisible] = useState(member.publicProfileVisible !== undefined ? member.publicProfileVisible : true);
  const [publicFields, setPublicFields] = useState<StartupMemberPublicFields>({
    ...DEFAULT_PUBLIC_FIELDS,
    ...(member.publicDisplayFields || {}),
  });

  // Dashboard Access & Role
  const [dashboardAccessEnabled, setDashboardAccessEnabled] = useState(!!member.dashboardAccessEnabled);
  const [dashboardRole, setDashboardRole] = useState<StartupDashboardRole>(member.dashboardRole || 'team_member');
  const [permissions, setPermissions] = useState<StartupPermissionSet>(
    member.permissions || getDefaultPermissionsForRole(member.dashboardRole || 'team_member')
  );

  // Accordion state for permission groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    profile: false,
    opportunities: false,
    connections: false,
    ask: false,
    finance: false,
    ddLocker: false,
    content: false,
    team: false,
    billing: false,
    entityAdministration: false,
  });

  // Sensitive modal confirmation state
  const [sensitiveModalState, setSensitiveModalState] = useState<{
    isOpen: boolean;
    domainName: string;
    pendingAction?: () => void;
  }>({
    isOpen: false,
    domainName: '',
  });

  // Transfer ownership modal state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setDesignation(member.designation || member.role);
      setDepartment(member.department || 'Operations');
      setTeamCategory(member.teamCategory || 'core_team');
      setShortBio(member.shortBio || member.bio || '');
      setExpertise(member.expertise?.join(', ') || '');
      setLinkedin(member.linkedin || '');
      setPublicProfileVisible(member.publicProfileVisible !== undefined ? member.publicProfileVisible : true);
      setPublicFields({
        ...DEFAULT_PUBLIC_FIELDS,
        ...(member.publicDisplayFields || {}),
      });
      setDashboardAccessEnabled(!!member.dashboardAccessEnabled);
      setDashboardRole(member.dashboardRole || 'team_member');
      setPermissions(member.permissions || getDefaultPermissionsForRole(member.dashboardRole || 'team_member'));
    }
  }, [member]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const handleRolePresetChange = (newRole: StartupDashboardRole) => {
    if (isSoleOwner && newRole !== 'owner') {
      alert('Cannot downgrade the sole Owner. Transfer ownership first.');
      return;
    }

    if (newRole === 'finance') {
      // Trigger confirmation for sensitive finance role
      setSensitiveModalState({
        isOpen: true,
        domainName: 'Financial Data & DD Locker',
        pendingAction: () => {
          setDashboardRole(newRole);
          setPermissions(getDefaultPermissionsForRole(newRole));
        },
      });
      return;
    }

    setDashboardRole(newRole);
    setPermissions(getDefaultPermissionsForRole(newRole));
  };

  const handleResetToDefault = () => {
    setPermissions(getDefaultPermissionsForRole(dashboardRole));
  };

  const handlePermissionToggle = (group: keyof StartupPermissionSet, permKey: string) => {
    const currentVal = (permissions[group] as any)?.[permKey];
    const targetVal = !currentVal;

    // Check if activating a sensitive capability
    if (targetVal && isSensitiveDomain(group)) {
      setSensitiveModalState({
        isOpen: true,
        domainName: group.toUpperCase(),
        pendingAction: () => {
          setPermissions((prev) => ({
            ...prev,
            [group]: {
              ...prev[group],
              [permKey]: true,
            },
          }));
        },
      });
      return;
    }

    setPermissions((prev) => ({
      ...prev,
      [group]: {
        ...prev[group],
        [permKey]: targetVal,
      },
    }));
  };

  const handleSave = () => {
    onUpdateMember(member.id, {
      name,
      designation,
      role: designation,
      department,
      teamCategory,
      shortBio,
      bio: shortBio,
      expertise: expertise.split(',').map((s) => s.trim()).filter(Boolean),
      linkedin,
      publicProfileVisible,
      publicDisplayFields: publicFields,
      dashboardAccessEnabled,
      dashboardRole: dashboardAccessEnabled ? dashboardRole : member.dashboardRole,
      permissions: dashboardAccessEnabled ? permissions : member.permissions,
    });
    onClose();
  };

  const permissionGroupsList: Array<{
    id: keyof StartupPermissionSet;
    label: string;
    description: string;
    isSensitive?: boolean;
    permissions: Array<{ key: string; label: string }>;
  }> = [
    {
      id: 'profile',
      label: 'Profile Management',
      description: 'Public presence and narrative content',
      permissions: [
        { key: 'viewProfileManagement', label: 'View Profile Management' },
        { key: 'editBasicInfo', label: 'Edit Basic Info' },
        { key: 'editPitch', label: 'Edit Pitch Deck & Video' },
        { key: 'manageTeam', label: 'Manage Team Members' },
        { key: 'manageTalentAsk', label: 'Manage Talent Ask' },
        { key: 'managePublicVisibility', label: 'Manage Public Visibility' },
        { key: 'publishProfile', label: 'Publish Profile Changes' },
      ],
    },
    {
      id: 'opportunities',
      label: 'Opportunities',
      description: 'Grants, accelerators and challenges',
      permissions: [
        { key: 'viewOpportunities', label: 'View Opportunities' },
        { key: 'saveOpportunities', label: 'Save Opportunities' },
        { key: 'applyOpportunities', label: 'Apply to Opportunities' },
        { key: 'manageApplications', label: 'Manage Applications Pipeline' },
      ],
    },
    {
      id: 'connections',
      label: 'Connections & Messaging',
      description: 'Ecosystem network & scheduling',
      permissions: [
        { key: 'viewConnections', label: 'View Connections' },
        { key: 'manageConnections', label: 'Manage Connections' },
        { key: 'messageConnections', label: 'Direct Messaging' },
        { key: 'scheduleMeetings', label: 'Schedule Meetings' },
      ],
    },
    {
      id: 'ask',
      label: 'Universal Ask Engine',
      description: 'Venture requirements & responses',
      permissions: [
        { key: 'viewAsks', label: 'View Ecosystem Asks' },
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
      description: 'Financial metrics and burn rates',
      isSensitive: true,
      permissions: [
        { key: 'viewFinancials', label: 'View Financial Records' },
        { key: 'uploadFinancialData', label: 'Upload Financial Data' },
        { key: 'editFinancialData', label: 'Edit Revenue & Expenses' },
        { key: 'exportFinancialData', label: 'Export Financial Reports' },
        { key: 'manageFinancialVisibility', label: 'Manage Financial Visibility' },
      ],
    },
    {
      id: 'ddLocker',
      label: 'Due Diligence Locker',
      description: 'Investor documents & data room',
      isSensitive: true,
      permissions: [
        { key: 'viewDDLocker', label: 'View DD Locker' },
        { key: 'uploadDocuments', label: 'Upload DD Documents' },
        { key: 'deleteDocuments', label: 'Delete DD Documents' },
        { key: 'manageFolders', label: 'Manage Folder Tree' },
        { key: 'approveAccess', label: 'Approve DD Access' },
        { key: 'revokeAccess', label: 'Revoke DD Access' },
        { key: 'viewActivityLogs', label: 'View Audit Logs' },
      ],
    },
    {
      id: 'content',
      label: 'Content & Updates',
      description: 'Broadcasts and milestone posts',
      permissions: [
        { key: 'viewContent', label: 'View Content Workspace' },
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
      description: 'Member access and roles',
      permissions: [
        { key: 'viewMembers', label: 'View Team Members' },
        { key: 'inviteMembers', label: 'Invite Collaborators' },
        { key: 'editMembers', label: 'Edit Member Details' },
        { key: 'removeMembers', label: 'Remove Team Members' },
        { key: 'assignRoles', label: 'Assign Roles' },
        { key: 'changePermissions', label: 'Change Custom Permissions' },
      ],
    },
    {
      id: 'billing',
      label: 'Billing & Subscriptions',
      description: 'Invoices and plan tiers',
      isSensitive: true,
      permissions: [
        { key: 'viewBilling', label: 'View Billing Overview' },
        { key: 'manageSubscription', label: 'Change Plan Tier' },
        { key: 'viewInvoices', label: 'View Invoices' },
        { key: 'managePaymentMethod', label: 'Update Payment Methods' },
        { key: 'downloadInvoices', label: 'Download Tax Invoices' },
      ],
    },
    {
      id: 'entityAdministration',
      label: 'Entity Administration',
      description: 'Venture governance and ownership',
      isSensitive: true,
      permissions: [
        { key: 'manageStartupSettings', label: 'Manage Startup Settings' },
        { key: 'changeOfficialEmail', label: 'Change Official Email' },
        { key: 'changeProfileVisibility', label: 'Toggle Ghost Mode / Visibility' },
        { key: 'transferOwnership', label: 'Transfer Venture Ownership' },
        { key: 'archiveStartup', label: 'Archive Venture' },
      ],
    },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs animate-fade-in">
        <div className="relative w-full max-w-2xl bg-white dark:bg-[#181B1A] border-l border-gray-200 dark:border-[#262A29] h-full shadow-2xl flex flex-col overflow-hidden animate-slide-left">
          {/* Header */}
          <div className="p-6 border-b border-gray-100 dark:border-[#262A29] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-12 h-12 rounded-2xl object-cover border border-gray-200 dark:border-[#262A29]"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-[#101212] dark:text-white">{member.name}</h3>
                  {member.dashboardRole === 'owner' && (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      <Crown className="w-3 h-3" />
                      <span>Owner</span>
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      member.entityMembershipStatus === 'active'
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : member.entityMembershipStatus === 'former'
                        ? 'bg-gray-200 dark:bg-gray-800 text-gray-400'
                        : 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    }`}
                  >
                    {member.entityMembershipStatus ? member.entityMembershipStatus.toUpperCase() : 'ACTIVE'}
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {member.role} • {member.xentroProfile || member.email || 'No account linked'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
            {/* SECTION 1: PUBLIC PROFILE PRESENTATION */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${publicProfileVisible ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]' : 'bg-gray-200 dark:bg-[#262A29] text-gray-400'}`}>
                    {publicProfileVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">Public Profile Presentation</h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      Controls public display on your Startup page.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={publicProfileVisible}
                    onChange={(e) => setPublicProfileVisible(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#D9FF3F]"></div>
                </label>
              </div>

              {publicProfileVisible && (
                <div className="space-y-3 pt-3 border-t border-gray-200 dark:border-[#262A29]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                        Team Category on Public Profile
                      </label>
                      <select
                        value={teamCategory}
                        onChange={(e) => setTeamCategory(e.target.value as TeamCategory)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white"
                      >
                        <option value="founder">Founder</option>
                        <option value="co_founder">Co-Founder</option>
                        <option value="leadership">Leadership</option>
                        <option value="core_team">Core Team</option>
                        <option value="advisor">Advisor</option>
                        <option value="mentor">Mentor</option>
                        <option value="consultant">Consultant</option>
                        <option value="intern">Intern</option>
                        <option value="contributor">Contributor</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                        Public Designation Title
                      </label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs text-[#101212] dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1.5">
                      Visible Public Fields
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        [
                          ['photo', 'Photo'],
                          ['name', 'Name'],
                          ['designation', 'Designation'],
                          ['bio', 'Bio'],
                          ['expertise', 'Expertise'],
                          ['linkedin', 'LinkedIn'],
                          ['xentroProfile', 'Xentro Handle'],
                          ['experience', 'Experience'],
                        ] as const
                      ).map(([fKey, fLabel]) => (
                        <label key={fKey} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!publicFields[fKey]}
                            onChange={(e) =>
                              setPublicFields({
                                ...publicFields,
                                [fKey]: e.target.checked,
                              })
                            }
                            className="rounded text-[#D9FF3F] focus:ring-[#D9FF3F] accent-[#D9FF3F]"
                          />
                          <span className="text-[#565B59] dark:text-[#B6B8B7]">{fLabel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 2: WORKSPACE ACCESS & DASHBOARD ROLE */}
            <div className="p-5 rounded-2xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${dashboardAccessEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-200 dark:bg-[#262A29] text-gray-400'}`}>
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#101212] dark:text-white">Startup Dashboard Access</h4>
                    <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                      Enables this member to operate workspace modules.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isSoleOwner}
                    checked={dashboardAccessEnabled}
                    onChange={(e) => {
                      if (isSoleOwner && !e.target.checked) {
                        alert('Cannot revoke Dashboard access from the sole Owner.');
                        return;
                      }
                      setDashboardAccessEnabled(e.target.checked);
                    }}
                    className="sr-only peer disabled:opacity-50"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-hidden rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#D9FF3F]"></div>
                </label>
              </div>

              {dashboardAccessEnabled ? (
                <div className="space-y-4 pt-3 border-t border-gray-200 dark:border-[#262A29]">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] mb-1">
                      Organizational Role Preset
                    </label>
                    <select
                      value={dashboardRole}
                      disabled={isSoleOwner}
                      onChange={(e) => handleRolePresetChange(e.target.value as StartupDashboardRole)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white disabled:opacity-60"
                    >
                      <option value="owner">Owner / Founder (Full Protected Access)</option>
                      <option value="admin">Admin (General Workspace Management)</option>
                      <option value="finance">Finance (Financials & Due Diligence)</option>
                      <option value="operations">Operations (Opportunities, Asks & Content)</option>
                      <option value="team_member">Team Member (General Contributor)</option>
                      <option value="advisor">Advisor (Restricted Advisory)</option>
                      <option value="viewer">Viewer (Read-Only Observer)</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#565B59] dark:text-[#B6B8B7]">
                      Role acts as default preset. Fine-tune below without losing custom configurations.
                    </span>
                    <button
                      type="button"
                      onClick={handleResetToDefault}
                      className="text-[#101212] dark:text-[#D9FF3F] hover:underline font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset to Role Defaults</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  Dashboard access is revoked. This member cannot sign in or perform any actions inside the startup workspace.
                </p>
              )}
            </div>

            {/* SECTION 3: GRANULAR PERMISSIONS ACCORDION */}
            {dashboardAccessEnabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white uppercase tracking-wider">
                    Granular Access Permissions
                  </h4>
                  <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                    10 Security Domain Groups
                  </span>
                </div>

                <div className="space-y-2">
                  {permissionGroupsList.map((group) => {
                    const isExpanded = !!expandedGroups[group.id];
                    const activeCount = Object.values(permissions[group.id] || {}).filter(Boolean).length;
                    const totalCount = group.permissions.length;

                    return (
                      <div
                        key={group.id}
                        className="rounded-2xl border border-gray-200 dark:border-[#262A29] overflow-hidden bg-white dark:bg-[#181B1A]"
                      >
                        <div
                          onClick={() => toggleGroup(group.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#202422] transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-[#101212] dark:text-white">{group.label}</span>
                            {group.isSensitive && (
                              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                <AlertTriangle className="w-2.5 h-2.5" />
                                <span>Sensitive</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                              {activeCount} / {totalCount}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-3.5 bg-gray-50 dark:bg-[#202422] border-t border-gray-100 dark:border-[#262A29] space-y-2.5">
                            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{group.description}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              {group.permissions.map((p) => {
                                const isChecked = !!(permissions[group.id] as any)?.[p.key];
                                return (
                                  <label
                                    key={p.key}
                                    className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 dark:border-[#262A29] bg-white dark:bg-[#181B1A] hover:bg-gray-100 dark:hover:bg-[#262A29] cursor-pointer transition-colors"
                                  >
                                    <input
                                      type="checkbox"
                                      disabled={dashboardRole === 'owner'}
                                      checked={dashboardRole === 'owner' || isChecked}
                                      onChange={() => handlePermissionToggle(group.id, p.key)}
                                      className="rounded text-[#D9FF3F] focus:ring-[#D9FF3F] accent-[#D9FF3F] disabled:opacity-50"
                                    />
                                    <span className="text-[11px] font-medium text-[#101212] dark:text-gray-200">
                                      {p.label}
                                    </span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 4: ACTIONS & DANGER ZONE */}
            <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 space-y-3">
              <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                Member Governance Actions
              </h4>

              <div className="flex flex-wrap gap-2">
                {isSoleOwner && allMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setIsTransferModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>Transfer Ownership</span>
                  </button>
                )}

                {member.entityMembershipStatus !== 'former' && !isSoleOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Mark ${member.name} as former team member? Dashboard access will be immediately revoked.`)) {
                        onMarkFormer(member.id, false);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gray-200 dark:bg-[#202422] hover:bg-gray-300 dark:hover:bg-[#262A29] text-[#101212] dark:text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Mark as Former</span>
                  </button>
                )}

                {!isSoleOwner && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Are you sure you want to completely remove ${member.name} from the startup?`)) {
                        onRemoveMember(member.id);
                        onClose();
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove from Startup</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sensitive Confirmation Dialog */}
      <SensitiveConfirmModal
        isOpen={sensitiveModalState.isOpen}
        domainName={sensitiveModalState.domainName}
        memberName={member.name}
        onConfirm={() => {
          if (sensitiveModalState.pendingAction) {
            sensitiveModalState.pendingAction();
          }
          setSensitiveModalState({ isOpen: false, domainName: '' });
        }}
        onCancel={() => setSensitiveModalState({ isOpen: false, domainName: '' })}
      />

      {/* Transfer Ownership Dialog */}
      <TransferOwnershipModal
        isOpen={isTransferModalOpen}
        currentOwner={member}
        candidates={allMembers.filter((m) => m.id !== member.id && m.entityMembershipStatus === 'active')}
        onConfirm={(newOwnerId) => {
          onTransferOwnership(member.id, newOwnerId);
          setIsTransferModalOpen(false);
          onClose();
        }}
        onCancel={() => setIsTransferModalOpen(false)}
      />
    </>
  );
};
