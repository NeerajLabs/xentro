'use client';

import {
  StartupTeamMember,
  StartupDashboardRole,
  StartupMemberStatus,
  TeamCategory,
  StartupMemberPublicFields,
  StartupPermissionSet,
  StartupTalentAsk,
  TalentApplicant,
  TalentApplicantStage,
  TalentAskStatus,
} from '@/types/startup';

// Local Storage Keys
export const TEAM_STORAGE_KEY = 'xentro_startup_team_v1';
export const TALENT_ASKS_STORAGE_KEY = 'xentro_startup_talent_asks_v1';
export const TALENT_APPLICANTS_STORAGE_KEY = 'xentro_startup_talent_applications_v1';
export const LEGACY_TEAM_STORAGE_KEY = 'xentro_startup_team_members';

// Default Public Display Fields
export const DEFAULT_PUBLIC_FIELDS: StartupMemberPublicFields = {
  photo: true,
  name: true,
  designation: true,
  bio: true,
  expertise: true,
  linkedin: true,
  experience: true,
  xentroProfile: true,
};

// Base empty permission template
const createEmptyPermissions = (): StartupPermissionSet => ({
  profile: {
    viewProfileManagement: false,
    editBasicInfo: false,
    editPitch: false,
    manageTeam: false,
    manageTalentAsk: false,
    managePublicVisibility: false,
    publishProfile: false,
  },
  opportunities: {
    viewOpportunities: false,
    saveOpportunities: false,
    applyOpportunities: false,
    manageApplications: false,
  },
  connections: {
    viewConnections: false,
    manageConnections: false,
    messageConnections: false,
    scheduleMeetings: false,
  },
  ask: {
    viewAsks: false,
    createAsk: false,
    editAsk: false,
    publishAsk: false,
    closeAsk: false,
    manageAskResponses: false,
  },
  finance: {
    viewFinancials: false,
    uploadFinancialData: false,
    editFinancialData: false,
    exportFinancialData: false,
    manageFinancialVisibility: false,
  },
  ddLocker: {
    viewDDLocker: false,
    uploadDocuments: false,
    deleteDocuments: false,
    manageFolders: false,
    approveAccess: false,
    revokeAccess: false,
    viewActivityLogs: false,
  },
  content: {
    viewContent: false,
    createPosts: false,
    editPosts: false,
    publishPosts: false,
    deletePosts: false,
    featurePosts: false,
  },
  team: {
    viewMembers: false,
    inviteMembers: false,
    editMembers: false,
    removeMembers: false,
    assignRoles: false,
    changePermissions: false,
  },
  billing: {
    viewBilling: false,
    manageSubscription: false,
    viewInvoices: false,
    managePaymentMethod: false,
    downloadInvoices: false,
  },
  entityAdministration: {
    manageStartupSettings: false,
    changeOfficialEmail: false,
    changeProfileVisibility: false,
    transferOwnership: false,
    archiveStartup: false,
  },
});

// Role presets
export const OWNER_PERMISSIONS: StartupPermissionSet = {
  profile: {
    viewProfileManagement: true,
    editBasicInfo: true,
    editPitch: true,
    manageTeam: true,
    manageTalentAsk: true,
    managePublicVisibility: true,
    publishProfile: true,
  },
  opportunities: {
    viewOpportunities: true,
    saveOpportunities: true,
    applyOpportunities: true,
    manageApplications: true,
  },
  connections: {
    viewConnections: true,
    manageConnections: true,
    messageConnections: true,
    scheduleMeetings: true,
  },
  ask: {
    viewAsks: true,
    createAsk: true,
    editAsk: true,
    publishAsk: true,
    closeAsk: true,
    manageAskResponses: true,
  },
  finance: {
    viewFinancials: true,
    uploadFinancialData: true,
    editFinancialData: true,
    exportFinancialData: true,
    manageFinancialVisibility: true,
  },
  ddLocker: {
    viewDDLocker: true,
    uploadDocuments: true,
    deleteDocuments: true,
    manageFolders: true,
    approveAccess: true,
    revokeAccess: true,
    viewActivityLogs: true,
  },
  content: {
    viewContent: true,
    createPosts: true,
    editPosts: true,
    publishPosts: true,
    deletePosts: true,
    featurePosts: true,
  },
  team: {
    viewMembers: true,
    inviteMembers: true,
    editMembers: true,
    removeMembers: true,
    assignRoles: true,
    changePermissions: true,
  },
  billing: {
    viewBilling: true,
    manageSubscription: true,
    viewInvoices: true,
    managePaymentMethod: true,
    downloadInvoices: true,
  },
  entityAdministration: {
    manageStartupSettings: true,
    changeOfficialEmail: true,
    changeProfileVisibility: true,
    transferOwnership: true,
    archiveStartup: true,
  },
};

export const ADMIN_PERMISSIONS: StartupPermissionSet = {
  profile: {
    viewProfileManagement: true,
    editBasicInfo: true,
    editPitch: true,
    manageTeam: true,
    manageTalentAsk: true,
    managePublicVisibility: true,
    publishProfile: true,
  },
  opportunities: {
    viewOpportunities: true,
    saveOpportunities: true,
    applyOpportunities: true,
    manageApplications: true,
  },
  connections: {
    viewConnections: true,
    manageConnections: true,
    messageConnections: true,
    scheduleMeetings: true,
  },
  ask: {
    viewAsks: true,
    createAsk: true,
    editAsk: true,
    publishAsk: true,
    closeAsk: true,
    manageAskResponses: true,
  },
  finance: {
    viewFinancials: false,
    uploadFinancialData: false,
    editFinancialData: false,
    exportFinancialData: false,
    manageFinancialVisibility: false,
  },
  ddLocker: {
    viewDDLocker: false,
    uploadDocuments: false,
    deleteDocuments: false,
    manageFolders: false,
    approveAccess: false,
    revokeAccess: false,
    viewActivityLogs: false,
  },
  content: {
    viewContent: true,
    createPosts: true,
    editPosts: true,
    publishPosts: true,
    deletePosts: true,
    featurePosts: true,
  },
  team: {
    viewMembers: true,
    inviteMembers: true,
    editMembers: true,
    removeMembers: false,
    assignRoles: false,
    changePermissions: false,
  },
  billing: {
    viewBilling: false,
    manageSubscription: false,
    viewInvoices: false,
    managePaymentMethod: false,
    downloadInvoices: false,
  },
  entityAdministration: {
    manageStartupSettings: true,
    changeOfficialEmail: false,
    changeProfileVisibility: true,
    transferOwnership: false,
    archiveStartup: false,
  },
};

export const FINANCE_PERMISSIONS: StartupPermissionSet = {
  profile: {
    viewProfileManagement: true,
    editBasicInfo: false,
    editPitch: false,
    manageTeam: false,
    manageTalentAsk: false,
    managePublicVisibility: false,
    publishProfile: false,
  },
  opportunities: {
    viewOpportunities: true,
    saveOpportunities: true,
    applyOpportunities: false,
    manageApplications: false,
  },
  connections: {
    viewConnections: true,
    manageConnections: false,
    messageConnections: true,
    scheduleMeetings: true,
  },
  ask: {
    viewAsks: true,
    createAsk: false,
    editAsk: false,
    publishAsk: false,
    closeAsk: false,
    manageAskResponses: false,
  },
  finance: {
    viewFinancials: true,
    uploadFinancialData: true,
    editFinancialData: true,
    exportFinancialData: true,
    manageFinancialVisibility: true,
  },
  ddLocker: {
    viewDDLocker: true,
    uploadDocuments: true,
    deleteDocuments: false,
    manageFolders: true,
    approveAccess: true,
    revokeAccess: false,
    viewActivityLogs: true,
  },
  content: {
    viewContent: true,
    createPosts: false,
    editPosts: false,
    publishPosts: false,
    deletePosts: false,
    featurePosts: false,
  },
  team: {
    viewMembers: true,
    inviteMembers: false,
    editMembers: false,
    removeMembers: false,
    assignRoles: false,
    changePermissions: false,
  },
  billing: {
    viewBilling: true,
    manageSubscription: true,
    viewInvoices: true,
    managePaymentMethod: true,
    downloadInvoices: true,
  },
  entityAdministration: {
    manageStartupSettings: false,
    changeOfficialEmail: false,
    changeProfileVisibility: false,
    transferOwnership: false,
    archiveStartup: false,
  },
};

export const OPERATIONS_PERMISSIONS: StartupPermissionSet = {
  profile: {
    viewProfileManagement: true,
    editBasicInfo: true,
    editPitch: true,
    manageTeam: false,
    manageTalentAsk: true,
    managePublicVisibility: false,
    publishProfile: false,
  },
  opportunities: {
    viewOpportunities: true,
    saveOpportunities: true,
    applyOpportunities: true,
    manageApplications: true,
  },
  connections: {
    viewConnections: true,
    manageConnections: true,
    messageConnections: true,
    scheduleMeetings: true,
  },
  ask: {
    viewAsks: true,
    createAsk: true,
    editAsk: true,
    publishAsk: true,
    closeAsk: true,
    manageAskResponses: true,
  },
  finance: {
    viewFinancials: false,
    uploadFinancialData: false,
    editFinancialData: false,
    exportFinancialData: false,
    manageFinancialVisibility: false,
  },
  ddLocker: {
    viewDDLocker: false,
    uploadDocuments: false,
    deleteDocuments: false,
    manageFolders: false,
    approveAccess: false,
    revokeAccess: false,
    viewActivityLogs: false,
  },
  content: {
    viewContent: true,
    createPosts: true,
    editPosts: true,
    publishPosts: true,
    deletePosts: false,
    featurePosts: false,
  },
  team: {
    viewMembers: true,
    inviteMembers: true,
    editMembers: false,
    removeMembers: false,
    assignRoles: false,
    changePermissions: false,
  },
  billing: {
    viewBilling: false,
    manageSubscription: false,
    viewInvoices: false,
    managePaymentMethod: false,
    downloadInvoices: false,
  },
  entityAdministration: {
    manageStartupSettings: false,
    changeOfficialEmail: false,
    changeProfileVisibility: false,
    transferOwnership: false,
    archiveStartup: false,
  },
};

export const TEAM_MEMBER_PERMISSIONS: StartupPermissionSet = {
  profile: {
    viewProfileManagement: true,
    editBasicInfo: false,
    editPitch: false,
    manageTeam: false,
    manageTalentAsk: false,
    managePublicVisibility: false,
    publishProfile: false,
  },
  opportunities: {
    viewOpportunities: true,
    saveOpportunities: true,
    applyOpportunities: false,
    manageApplications: false,
  },
  connections: {
    viewConnections: true,
    manageConnections: false,
    messageConnections: true,
    scheduleMeetings: false,
  },
  ask: {
    viewAsks: true,
    createAsk: false,
    editAsk: false,
    publishAsk: false,
    closeAsk: false,
    manageAskResponses: false,
  },
  finance: {
    viewFinancials: false,
    uploadFinancialData: false,
    editFinancialData: false,
    exportFinancialData: false,
    manageFinancialVisibility: false,
  },
  ddLocker: {
    viewDDLocker: false,
    uploadDocuments: false,
    deleteDocuments: false,
    manageFolders: false,
    approveAccess: false,
    revokeAccess: false,
    viewActivityLogs: false,
  },
  content: {
    viewContent: true,
    createPosts: true,
    editPosts: false,
    publishPosts: false,
    deletePosts: false,
    featurePosts: false,
  },
  team: {
    viewMembers: true,
    inviteMembers: false,
    editMembers: false,
    removeMembers: false,
    assignRoles: false,
    changePermissions: false,
  },
  billing: {
    viewBilling: false,
    manageSubscription: false,
    viewInvoices: false,
    managePaymentMethod: false,
    downloadInvoices: false,
  },
  entityAdministration: {
    manageStartupSettings: false,
    changeOfficialEmail: false,
    changeProfileVisibility: false,
    transferOwnership: false,
    archiveStartup: false,
  },
};

export const ADVISOR_PERMISSIONS: StartupPermissionSet = {
  profile: {
    viewProfileManagement: true,
    editBasicInfo: false,
    editPitch: false,
    manageTeam: false,
    manageTalentAsk: false,
    managePublicVisibility: false,
    publishProfile: false,
  },
  opportunities: {
    viewOpportunities: true,
    saveOpportunities: true,
    applyOpportunities: false,
    manageApplications: false,
  },
  connections: {
    viewConnections: true,
    manageConnections: false,
    messageConnections: true,
    scheduleMeetings: false,
  },
  ask: {
    viewAsks: true,
    createAsk: false,
    editAsk: false,
    publishAsk: false,
    closeAsk: false,
    manageAskResponses: false,
  },
  finance: {
    viewFinancials: false,
    uploadFinancialData: false,
    editFinancialData: false,
    exportFinancialData: false,
    manageFinancialVisibility: false,
  },
  ddLocker: {
    viewDDLocker: false,
    uploadDocuments: false,
    deleteDocuments: false,
    manageFolders: false,
    approveAccess: false,
    revokeAccess: false,
    viewActivityLogs: false,
  },
  content: {
    viewContent: true,
    createPosts: false,
    editPosts: false,
    publishPosts: false,
    deletePosts: false,
    featurePosts: false,
  },
  team: {
    viewMembers: true,
    inviteMembers: false,
    editMembers: false,
    removeMembers: false,
    assignRoles: false,
    changePermissions: false,
  },
  billing: {
    viewBilling: false,
    manageSubscription: false,
    viewInvoices: false,
    managePaymentMethod: false,
    downloadInvoices: false,
  },
  entityAdministration: {
    manageStartupSettings: false,
    changeOfficialEmail: false,
    changeProfileVisibility: false,
    transferOwnership: false,
    archiveStartup: false,
  },
};

export const VIEWER_PERMISSIONS: StartupPermissionSet = {
  profile: {
    viewProfileManagement: true,
    editBasicInfo: false,
    editPitch: false,
    manageTeam: false,
    manageTalentAsk: false,
    managePublicVisibility: false,
    publishProfile: false,
  },
  opportunities: {
    viewOpportunities: true,
    saveOpportunities: false,
    applyOpportunities: false,
    manageApplications: false,
  },
  connections: {
    viewConnections: true,
    manageConnections: false,
    messageConnections: false,
    scheduleMeetings: false,
  },
  ask: {
    viewAsks: true,
    createAsk: false,
    editAsk: false,
    publishAsk: false,
    closeAsk: false,
    manageAskResponses: false,
  },
  finance: {
    viewFinancials: false,
    uploadFinancialData: false,
    editFinancialData: false,
    exportFinancialData: false,
    manageFinancialVisibility: false,
  },
  ddLocker: {
    viewDDLocker: false,
    uploadDocuments: false,
    deleteDocuments: false,
    manageFolders: false,
    approveAccess: false,
    revokeAccess: false,
    viewActivityLogs: false,
  },
  content: {
    viewContent: true,
    createPosts: false,
    editPosts: false,
    publishPosts: false,
    deletePosts: false,
    featurePosts: false,
  },
  team: {
    viewMembers: true,
    inviteMembers: false,
    editMembers: false,
    removeMembers: false,
    assignRoles: false,
    changePermissions: false,
  },
  billing: {
    viewBilling: false,
    manageSubscription: false,
    viewInvoices: false,
    managePaymentMethod: false,
    downloadInvoices: false,
  },
  entityAdministration: {
    manageStartupSettings: false,
    changeOfficialEmail: false,
    changeProfileVisibility: false,
    transferOwnership: false,
    archiveStartup: false,
  },
};

export function getDefaultPermissionsForRole(role: StartupDashboardRole): StartupPermissionSet {
  switch (role) {
    case 'owner':
      return JSON.parse(JSON.stringify(OWNER_PERMISSIONS));
    case 'admin':
      return JSON.parse(JSON.stringify(ADMIN_PERMISSIONS));
    case 'finance':
      return JSON.parse(JSON.stringify(FINANCE_PERMISSIONS));
    case 'operations':
      return JSON.parse(JSON.stringify(OPERATIONS_PERMISSIONS));
    case 'team_member':
      return JSON.parse(JSON.stringify(TEAM_MEMBER_PERMISSIONS));
    case 'advisor':
      return JSON.parse(JSON.stringify(ADVISOR_PERMISSIONS));
    case 'viewer':
      return JSON.parse(JSON.stringify(VIEWER_PERMISSIONS));
    default:
      return JSON.parse(JSON.stringify(VIEWER_PERMISSIONS));
  }
}

export function isSensitiveDomain(domain: keyof StartupPermissionSet): boolean {
  return domain === 'finance' || domain === 'ddLocker' || domain === 'billing' || domain === 'entityAdministration';
}

export function hasSensitiveAccess(member: StartupTeamMember, domain: keyof StartupPermissionSet): boolean {
  if (!member.dashboardAccessEnabled || !member.permissions) return false;
  const permGroup = member.permissions[domain];
  if (!permGroup) return false;
  return Object.values(permGroup).some((val) => val === true);
}

export function canStartupMember(member: StartupTeamMember, permissionPath: string): boolean {
  if (!member.dashboardAccessEnabled || member.entityMembershipStatus !== 'active') return false;
  if (member.dashboardRole === 'owner') return true;
  if (!member.permissions) return false;

  const [group, key] = permissionPath.split('.') as [keyof StartupPermissionSet, string];
  const groupObj = member.permissions[group] as Record<string, boolean> | undefined;
  if (!groupObj) return false;
  return !!groupObj[key];
}

export function getEffectiveStartupPermissions(member: StartupTeamMember): StartupPermissionSet {
  if (!member.dashboardAccessEnabled || member.entityMembershipStatus !== 'active') {
    return createEmptyPermissions();
  }
  if (member.dashboardRole === 'owner') {
    return OWNER_PERMISSIONS;
  }
  return member.permissions || getDefaultPermissionsForRole(member.dashboardRole || 'viewer');
}

// Initial Default Team Seed
export const DEFAULT_V1_MEMBERS: StartupTeamMember[] = [];

// Initial Default Talent Asks
export const DEFAULT_TALENT_ASKS: StartupTalentAsk[] = [];

// Initial Default Applicants
export const DEFAULT_TALENT_APPLICANTS: TalentApplicant[] = [];

// Normalize helper to guarantee valid properties
function normalizeMember(m: any): StartupTeamMember {
  const roleCat = m.roleCategory || 'core';
  let teamCat: TeamCategory = m.teamCategory;
  if (!teamCat) {
    if (roleCat === 'founder') teamCat = 'founder';
    else if (roleCat === 'leadership') teamCat = 'leadership';
    else if (roleCat === 'advisor') teamCat = 'advisor';
    else teamCat = 'core_team';
  }

  const membershipStatus: StartupMemberStatus = m.entityMembershipStatus || 'active';
  const isOwner = m.dashboardRole === 'owner' || m.role?.toLowerCase().includes('founder') || roleCat === 'founder';
  const defaultRole: StartupDashboardRole = isOwner ? 'owner' : (m.dashboardRole || 'team_member');
  const dashboardAccess = m.dashboardAccessEnabled !== undefined ? m.dashboardAccessEnabled : isOwner;

  return {
    id: m.id || `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: m.name || 'Team Member',
    email: m.email || '',
    role: m.role || m.designation || 'Specialist',
    designation: m.designation || m.role || 'Specialist',
    department: m.department || 'General',
    roleCategory: roleCat,
    teamCategory: teamCat,
    avatar: m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    bio: m.bio || m.shortBio || '',
    shortBio: m.shortBio || m.bio || '',
    expertise: Array.isArray(m.expertise) ? m.expertise : [],
    experience: m.experience || '',
    linkedin: m.linkedin || '',
    xentroProfile: m.xentroProfile || '',
    xentroUserId: m.xentroUserId || '',
    xentroProfileLinked: m.xentroProfileLinked !== undefined ? m.xentroProfileLinked : !!m.xentroUserId,
    isFullTime: m.isFullTime !== undefined ? m.isFullTime : true,
    isVerified: m.isVerified !== undefined ? m.isVerified : false,
    entityMembershipStatus: membershipStatus,
    publicProfileVisible: m.publicProfileVisible !== undefined ? m.publicProfileVisible : true,
    publicDisplayFields: m.publicDisplayFields ? { ...DEFAULT_PUBLIC_FIELDS, ...m.publicDisplayFields } : DEFAULT_PUBLIC_FIELDS,
    dashboardAccessEnabled: dashboardAccess,
    dashboardRole: defaultRole,
    permissions: m.permissions ? m.permissions : getDefaultPermissionsForRole(defaultRole),
    startDate: m.startDate || '2024-01-01',
    currentMember: m.currentMember !== undefined ? m.currentMember : membershipStatus !== 'former' && membershipStatus !== 'removed',
  };
}

/* =========================================================================
   TEAM MEMBERS SERVICE
   ========================================================================= */

export function getStartupMembers(): StartupTeamMember[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TEAM_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter(
          (m: any) =>
            m.id !== 'tm_1' &&
            m.id !== 'tm_2' &&
            m.id !== 'tm_3' &&
            m.id !== 'tm_4' &&
            m.name !== 'Vikram Malhotra' &&
            m.name !== 'Karunya Kranthi Kumar'
        );
        if (filtered.length !== parsed.length) {
          saveStartupMembers(filtered);
        }
        if (filtered.length > 0) {
          return filtered.map(normalizeMember);
        }
      }
    }

    const legacyRaw = localStorage.getItem(LEGACY_TEAM_STORAGE_KEY);
    if (legacyRaw) {
      const legacyParsed = JSON.parse(legacyRaw);
      if (Array.isArray(legacyParsed)) {
        const filtered = legacyParsed.filter(
          (m: any) =>
            m.id !== 'tm_1' &&
            m.id !== 'tm_2' &&
            m.id !== 'tm_3' &&
            m.id !== 'tm_4' &&
            m.name !== 'Vikram Malhotra' &&
            m.name !== 'Karunya Kranthi Kumar'
        );
        if (filtered.length > 0) {
          const migrated = filtered.map(normalizeMember);
          saveStartupMembers(migrated);
          return migrated;
        }
      }
    }

    return [];
  } catch (err) {
    console.error('Failed to get startup members:', err);
    return [];
  }
}

export function saveStartupMembers(members: StartupTeamMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TEAM_STORAGE_KEY, JSON.stringify(members));
    // Also sync to legacy store for backward compatibility
    localStorage.setItem(LEGACY_TEAM_STORAGE_KEY, JSON.stringify(members));

    window.dispatchEvent(
      new CustomEvent('xentro-startup-team-changed', {
        detail: { members },
      })
    );
  } catch (err) {
    console.error('Failed to save startup members:', err);
  }
}

export function addStartupMember(memberData: Partial<StartupTeamMember>): StartupTeamMember {
  const current = getStartupMembers();
  const newMember = normalizeMember({
    ...memberData,
    id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
  });

  const updated = [newMember, ...current];
  saveStartupMembers(updated);
  return newMember;
}

export function updateStartupMember(id: string, updates: Partial<StartupTeamMember>): StartupTeamMember | null {
  const current = getStartupMembers();
  const index = current.findIndex((m) => m.id === id);
  if (index === -1) return null;

  const target = current[index];

  // Owner protection: cannot demote last owner or revoke dashboard access directly
  if (target.dashboardRole === 'owner') {
    const owners = current.filter((m) => m.dashboardRole === 'owner' && m.entityMembershipStatus === 'active');
    if (owners.length <= 1) {
      if (updates.dashboardRole && updates.dashboardRole !== 'owner') {
        throw new Error('Cannot downgrade the sole Owner. Transfer ownership first.');
      }
      if (updates.dashboardAccessEnabled === false) {
        throw new Error('Cannot revoke Dashboard access from the sole Owner.');
      }
      if (updates.entityMembershipStatus && updates.entityMembershipStatus !== 'active') {
        throw new Error('Cannot change status of the sole Owner. Transfer ownership first.');
      }
    }
  }

  const updatedMember = normalizeMember({
    ...target,
    ...updates,
    designation: updates.designation || updates.role || target.designation,
    role: updates.role || updates.designation || target.role,
  });

  // If dashboardAccessEnabled is toggled to false, keep former or existing role preset intact without granting active access
  current[index] = updatedMember;
  saveStartupMembers(current);
  return updatedMember;
}

export function removeStartupMember(id: string): boolean {
  const current = getStartupMembers();
  const target = current.find((m) => m.id === id);
  if (!target) return false;

  // Protect sole owner
  if (target.dashboardRole === 'owner') {
    const owners = current.filter((m) => m.dashboardRole === 'owner' && m.entityMembershipStatus === 'active');
    if (owners.length <= 1) {
      throw new Error('Cannot remove the sole Owner of the startup.');
    }
  }

  const updated = current.filter((m) => m.id !== id);
  saveStartupMembers(updated);
  return true;
}

export function markStartupMemberFormer(id: string, showInPublicFormer: boolean = false): boolean {
  const current = getStartupMembers();
  const target = current.find((m) => m.id === id);
  if (!target) return false;

  // Protect sole owner
  if (target.dashboardRole === 'owner') {
    const owners = current.filter((m) => m.dashboardRole === 'owner' && m.entityMembershipStatus === 'active');
    if (owners.length <= 1) {
      throw new Error('Cannot mark the sole Owner as former.');
    }
  }

  // Revoke dashboard access immediately
  updateStartupMember(id, {
    entityMembershipStatus: 'former',
    currentMember: false,
    dashboardAccessEnabled: false,
    publicProfileVisible: showInPublicFormer,
  });
  return true;
}

export function setMemberPublicVisibility(
  id: string,
  visible: boolean,
  fields?: Partial<StartupMemberPublicFields>
): boolean {
  const current = getStartupMembers();
  const target = current.find((m) => m.id === id);
  if (!target) return false;

  const currentFields = target.publicDisplayFields || DEFAULT_PUBLIC_FIELDS;
  const newFields = fields ? { ...currentFields, ...fields } : currentFields;

  updateStartupMember(id, {
    publicProfileVisible: visible,
    publicDisplayFields: newFields,
  });
  return true;
}

export function setMemberDashboardAccess(
  id: string,
  enabled: boolean,
  role?: StartupDashboardRole
): boolean {
  const current = getStartupMembers();
  const target = current.find((m) => m.id === id);
  if (!target) return false;

  const assignedRole = role || target.dashboardRole || 'team_member';
  const permissions = target.permissions || getDefaultPermissionsForRole(assignedRole);

  updateStartupMember(id, {
    dashboardAccessEnabled: enabled,
    dashboardRole: assignedRole,
    permissions,
  });
  return true;
}

export function assignStartupRole(
  id: string,
  role: StartupDashboardRole,
  resetPermissionsToDefault: boolean = false
): boolean {
  const current = getStartupMembers();
  const target = current.find((m) => m.id === id);
  if (!target) return false;

  const newPermissions = resetPermissionsToDefault
    ? getDefaultPermissionsForRole(role)
    : target.permissions || getDefaultPermissionsForRole(role);

  updateStartupMember(id, {
    dashboardRole: role,
    permissions: newPermissions,
  });
  return true;
}

export function updateStartupPermissions(id: string, permissions: StartupPermissionSet): boolean {
  return !!updateStartupMember(id, { permissions });
}

export function transferStartupOwnership(currentOwnerId: string, newOwnerId: string): boolean {
  const current = getStartupMembers();
  const currentOwner = current.find((m) => m.id === currentOwnerId);
  const newOwner = current.find((m) => m.id === newOwnerId);

  if (!currentOwner || !newOwner) return false;

  // New owner becomes Owner with full permissions
  updateStartupMember(newOwnerId, {
    dashboardRole: 'owner',
    dashboardAccessEnabled: true,
    entityMembershipStatus: 'active',
    permissions: OWNER_PERMISSIONS,
  });

  // Current owner steps down to Admin or retains full permissions as co-founder
  updateStartupMember(currentOwnerId, {
    dashboardRole: 'admin',
    permissions: ADMIN_PERMISSIONS,
  });

  return true;
}

/**
 * Filter members for Public Profile consumption
 */
export function getPublicTeamMembers(): StartupTeamMember[] {
  const members = getStartupMembers();
  return members.filter(
    (m) => m.publicProfileVisible && m.entityMembershipStatus !== 'removed'
  );
}

export function categorizePublicTeamMembers(members: StartupTeamMember[]) {
  const publicOnly = members.filter((m) => m.publicProfileVisible && m.entityMembershipStatus !== 'removed');
  return {
    founders: publicOnly.filter(
      (m) => m.teamCategory === 'founder' || m.teamCategory === 'co_founder' || m.roleCategory === 'founder'
    ),
    leadership: publicOnly.filter(
      (m) =>
        (m.teamCategory === 'leadership' || m.roleCategory === 'leadership') &&
        m.teamCategory !== 'founder' &&
        m.teamCategory !== 'co_founder'
    ),
    core: publicOnly.filter(
      (m) =>
        m.teamCategory === 'core_team' ||
        m.teamCategory === 'consultant' ||
        m.teamCategory === 'intern' ||
        m.teamCategory === 'contributor' ||
        m.roleCategory === 'core'
    ),
    advisors: publicOnly.filter(
      (m) =>
        m.teamCategory === 'advisor' ||
        m.teamCategory === 'mentor' ||
        m.roleCategory === 'advisor'
    ),
    former: publicOnly.filter((m) => m.entityMembershipStatus === 'former'),
  };
}

/* =========================================================================
   TALENT ASKS SERVICE
   ========================================================================= */

export function getTalentAsks(): StartupTalentAsk[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TALENT_ASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((a: any) => !a.id?.startsWith('ask_tal_'));
        if (filtered.length !== parsed.length) {
          saveTalentAsks(filtered);
        }
        return filtered;
      }
    }
    return [];
  } catch (err) {
    console.error('Failed to get talent asks:', err);
    return [];
  }
}

export function saveTalentAsks(asks: StartupTalentAsk[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TALENT_ASKS_STORAGE_KEY, JSON.stringify(asks));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-talent-changed', {
        detail: { asks },
      })
    );
  } catch (err) {
    console.error('Failed to save talent asks:', err);
  }
}

export function createTalentAsk(
  askData: Omit<StartupTalentAsk, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'applicationsCount' | 'shortlistedCount'>
): StartupTalentAsk {
  const current = getTalentAsks();
  const now = new Date().toISOString().split('T')[0];
  const newAsk: StartupTalentAsk = {
    ...askData,
    id: `ask_tal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now,
    updatedAt: now,
    viewsCount: 0,
    applicationsCount: 0,
    shortlistedCount: 0,
  };

  const updated = [newAsk, ...current];
  saveTalentAsks(updated);
  return newAsk;
}

export function updateTalentAsk(id: string, updates: Partial<StartupTalentAsk>): StartupTalentAsk | null {
  const current = getTalentAsks();
  const index = current.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const now = new Date().toISOString().split('T')[0];
  const updatedAsk: StartupTalentAsk = {
    ...current[index],
    ...updates,
    updatedAt: now,
  };

  current[index] = updatedAsk;
  saveTalentAsks(current);
  return updatedAsk;
}

export function changeTalentAskStatus(id: string, status: TalentAskStatus): boolean {
  return !!updateTalentAsk(id, { status });
}

export function deleteTalentAsk(id: string): boolean {
  const current = getTalentAsks();
  const updated = current.filter((a) => a.id !== id);
  saveTalentAsks(updated);
  return true;
}

export function getPublicTalentAsks(): StartupTalentAsk[] {
  const asks = getTalentAsks();
  return asks.filter(
    (a) => a.status === 'Open' && (a.visibility === 'Public' || a.visibility === 'Xentro Users')
  );
}

/* =========================================================================
   TALENT APPLICANTS SERVICE
   ========================================================================= */

export function getTalentApplicants(talentAskId?: string): TalentApplicant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TALENT_APPLICANTS_STORAGE_KEY);
    let all: TalentApplicant[] = [];
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        all = parsed.filter((a: any) => !a.id?.startsWith('app_'));
        if (all.length !== parsed.length) {
          saveTalentApplicants(all);
        }
      }
    }
    return talentAskId ? all.filter((a) => a.talentAskId === talentAskId) : all;
  } catch (err) {
    console.error('Failed to get applicants:', err);
    return [];
  }
}

export function saveTalentApplicants(applicants: TalentApplicant[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TALENT_APPLICANTS_STORAGE_KEY, JSON.stringify(applicants));
    window.dispatchEvent(
      new CustomEvent('xentro-startup-applicants-changed', {
        detail: { applicants },
      })
    );
  } catch (err) {
    console.error('Failed to save applicants:', err);
  }
}

export function addTalentApplicant(
  applicantData: Omit<TalentApplicant, 'id' | 'appliedDate'>
): TalentApplicant {
  const current = getTalentApplicants();
  const now = new Date().toISOString().split('T')[0];
  const newApp: TalentApplicant = {
    ...applicantData,
    id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    appliedDate: now,
  };

  const updated = [newApp, ...current];
  saveTalentApplicants(updated);

  // Increment application count on talent ask
  const asks = getTalentAsks();
  const askIndex = asks.findIndex((a) => a.id === applicantData.talentAskId);
  if (askIndex !== -1) {
    asks[askIndex].applicationsCount = (asks[askIndex].applicationsCount || 0) + 1;
    saveTalentAsks(asks);
  }

  return newApp;
}

export function moveTalentApplicantStage(id: string, stage: TalentApplicantStage): boolean {
  const current = getTalentApplicants();
  const index = current.findIndex((a) => a.id === id);
  if (index === -1) return false;

  const prevStage = current[index].stage;
  current[index].stage = stage;
  saveTalentApplicants(current);

  // If newly shortlisted, increment count
  if (stage === 'Shortlisted' && prevStage !== 'Shortlisted') {
    const asks = getTalentAsks();
    const askIndex = asks.findIndex((a) => a.id === current[index].talentAskId);
    if (askIndex !== -1) {
      asks[askIndex].shortlistedCount = (asks[askIndex].shortlistedCount || 0) + 1;
      saveTalentAsks(asks);
    }
  }

  return true;
}

export function convertApplicantToMember(
  applicantId: string,
  options: {
    teamCategory: TeamCategory;
    designation: string;
    department?: string;
    dashboardAccessEnabled: boolean;
    dashboardRole?: StartupDashboardRole;
    publicProfileVisible: boolean;
  }
): StartupTeamMember | null {
  const applicants = getTalentApplicants();
  const applicant = applicants.find((a) => a.id === applicantId);
  if (!applicant) return null;

  // Mark applicant as Joined Team
  moveTalentApplicantStage(applicantId, 'Joined Team');

  // Role Category mapping
  let roleCat: 'founder' | 'leadership' | 'core' | 'advisor' = 'core';
  if (options.teamCategory === 'founder' || options.teamCategory === 'co_founder') {
    roleCat = 'founder';
  } else if (options.teamCategory === 'leadership') {
    roleCat = 'leadership';
  } else if (options.teamCategory === 'advisor' || options.teamCategory === 'mentor') {
    roleCat = 'advisor';
  }

  const role = options.dashboardRole || (options.dashboardAccessEnabled ? 'team_member' : 'viewer');
  const permissions = options.dashboardAccessEnabled ? getDefaultPermissionsForRole(role) : createEmptyPermissions();

  const member = addStartupMember({
    name: applicant.candidateName,
    email: applicant.email,
    role: options.designation,
    designation: options.designation,
    department: options.department || 'Operations',
    roleCategory: roleCat,
    teamCategory: options.teamCategory,
    avatar: applicant.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    bio: applicant.bio || applicant.experience || '',
    shortBio: applicant.bio || applicant.experience || '',
    expertise: applicant.skills,
    linkedin: applicant.linkedinUrl,
    xentroProfile: applicant.xentroHandle,
    xentroUserId: applicant.xentroUserId,
    xentroProfileLinked: !!applicant.xentroUserId,
    entityMembershipStatus: 'active',
    publicProfileVisible: options.publicProfileVisible,
    publicDisplayFields: DEFAULT_PUBLIC_FIELDS,
    dashboardAccessEnabled: options.dashboardAccessEnabled,
    dashboardRole: role,
    permissions,
    startDate: new Date().toISOString().split('T')[0],
    currentMember: true,
  });

  return member;
}
