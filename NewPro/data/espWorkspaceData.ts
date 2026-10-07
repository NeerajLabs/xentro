import {
  ESPMember,
  ESPInvitation,
  ESPRole,
  ESPPermission,
  ESPEndorsement,
  ESPBillingOverview,
  ESPSubscriptionDetails,
  ESPInvoice,
  ESPPayment,
  ESPPaymentMethod,
  ESPBillingDetails,
  ESPOwnershipSettings,
  ESPVerificationSettings,
  ESPEntitlementAllocation,
  ESPActivityLogItem,
  ESPLocation,
  ESPOpportunity,
  ESPEvent,
  ESPApplication,
  ESPParticipant,
  ESPWorkspaceNotification,
} from '@/types/esp';

export const initialESPMembers: ESPMember[] = [];

export const initialESPInvitations: ESPInvitation[] = [];

export const initialESPPermissions: ESPPermission[] = [
  // ENTITY
  { id: 'view_entity', name: 'View Entity Information', group: 'ENTITY', description: 'View institutional details, public profile, and registration.' },
  { id: 'edit_entity', name: 'Edit Entity Profile', group: 'ENTITY', description: 'Edit organizational details, overview, and branding.' },
  { id: 'manage_entity_settings', name: 'Manage Entity Settings', group: 'ENTITY', description: 'Control locations, ownership, hierarchy, and audit logs.' },
  { id: 'archive_entity', name: 'Archive / Deactivate Entity', group: 'ENTITY', description: 'Permits deactivating or transferring institutional presence.' },

  // MEMBERS
  { id: 'invite_members', name: 'Invite Members', group: 'MEMBERS', description: 'Issue individual invitations, links, and CSV bulk invites.' },
  { id: 'remove_members', name: 'Remove Members', group: 'MEMBERS', description: 'Suspend or remove member access from the dashboard.' },
  { id: 'manage_roles', name: 'Manage Member Roles', group: 'MEMBERS', description: 'Change roles and assign access tiers to internal members.' },
  { id: 'manage_permissions', name: 'Manage Custom Permissions', group: 'MEMBERS', description: 'Configure granular permission checkboxes for non-system roles.' },

  // PROFILE
  { id: 'edit_profile', name: 'Edit Public Profile', group: 'PROFILE', description: 'Update About, Services, Team, and media highlights.' },
  { id: 'publish_profile', name: 'Publish Profile Changes', group: 'PROFILE', description: 'Make profile modifications live on Xentro Discovery.' },
  { id: 'change_visibility', name: 'Toggle Profile Visibility', group: 'PROFILE', description: 'Change discoverability and public profile active state.' },

  // PROGRAMS
  { id: 'create_program', name: 'Create Incubation Program', group: 'PROGRAMS', description: 'Author new accelerators, bootcamps, and fellowship rounds.' },
  { id: 'edit_program', name: 'Edit Programs & Criteria', group: 'PROGRAMS', description: 'Modify grant amounts, timelines, and application deadlines.' },
  { id: 'delete_program', name: 'Delete / Archive Program', group: 'PROGRAMS', description: 'Close and archive existing cohort and incubation programs.' },
  { id: 'manage_applications', name: 'Manage Application Queue', group: 'PROGRAMS', description: 'Review, shortlist, and schedule interviews for applicants.' },
  { id: 'manage_cohorts', name: 'Manage Cohorts & Milestones', group: 'PROGRAMS', description: 'Track cohort progress, weekly demo days, and graduation.' },

  // OPPORTUNITIES
  { id: 'create_opportunity', name: 'Create Grants & Opportunities', group: 'OPPORTUNITIES', description: 'Publish open grants, hackathons, and challenge competitions.' },
  { id: 'edit_opportunity', name: 'Edit Opportunities', group: 'OPPORTUNITIES', description: 'Modify grant deadlines, prize pools, and requirements.' },
  { id: 'publish_opportunity', name: 'Publish to Public Feed', group: 'OPPORTUNITIES', description: 'Broadcast opportunities to founders across the Xentro feed.' },

  // PORTFOLIO
  { id: 'add_startup', name: 'Add Portfolio Startup', group: 'PORTFOLIO', description: 'Onboard startups into the institutional portfolio.' },
  { id: 'remove_startup', name: 'Remove / Graduate Startup', group: 'PORTFOLIO', description: 'Update graduation, alumni, or exit status.' },
  { id: 'manage_portfolio', name: 'Manage Portfolio Data', group: 'PORTFOLIO', description: 'Update cap table info, valuation, and traction metrics.' },
  { id: 'endorse_startup', name: 'Endorse Startup (Grant Pro)', group: 'PORTFOLIO', description: 'Grant official ESP endorsement and activate Startup Pro.' },
  { id: 'revoke_endorsement', name: 'Revoke Endorsement', group: 'PORTFOLIO', description: 'Revoke official institutional endorsement from a startup.' },

  // CONTENT
  { id: 'create_content', name: 'Create Post / Announcement', group: 'CONTENT', description: 'Author institutional news, event announcements, and articles.' },
  { id: 'edit_content', name: 'Edit Published Content', group: 'CONTENT', description: 'Modify live announcements and event schedules.' },
  { id: 'publish_content', name: 'Publish Content', group: 'CONTENT', description: 'Make content visible on the Public Profile and Discovery feed.' },

  // FINANCE
  { id: 'view_financials', name: 'View Financial Analytics', group: 'FINANCE', description: 'Inspect aggregate funding facilitated and grant deployments.' },
  { id: 'manage_billing', name: 'Manage Subscriptions & Billing', group: 'FINANCE', description: 'Upgrade plans, renew subscriptions, and manage cycle.' },
  { id: 'view_invoices', name: 'View Invoices', group: 'FINANCE', description: 'Inspect institutional tax invoices and receipts.' },
  { id: 'download_invoices', name: 'Download PDF Invoices', group: 'FINANCE', description: 'Download official GST compliant invoices.' },
  { id: 'view_payments', name: 'View Payment History', group: 'FINANCE', description: 'Review transaction references and payment statuses.' },
  { id: 'update_billing_details', name: 'Update Billing & GSTIN', group: 'FINANCE', description: 'Update organization legal address, GSTIN, and tax IDs.' },

  // ANALYTICS
  { id: 'view_analytics', name: 'View Performance Analytics', group: 'ANALYTICS', description: 'View dashboard telemetry, cohort retention, and outcomes.' },
  { id: 'export_analytics', name: 'Export Analytics Reports', group: 'ANALYTICS', description: 'Download CSV / PDF reports for government and board review.' },
];

export const initialESPRoles: ESPRole[] = [
  {
    id: 'role_owner',
    name: 'Primary Admin / Owner',
    description: 'Ultimate authority over institutional entity, ownership, billing, legal and verification settings.',
    permissions: initialESPPermissions.map((p) => p.id),
    memberCount: 1,
    isSystem: true,
  },
  {
    id: 'role_inst_admin',
    name: 'Institution Admin',
    description: 'Administrative authority over programs, members, portfolio, and operations.',
    permissions: [
      'view_entity', 'edit_entity', 'manage_entity_settings',
      'invite_members', 'remove_members', 'manage_roles',
      'edit_profile', 'publish_profile', 'change_visibility',
      'create_program', 'edit_program', 'manage_applications', 'manage_cohorts',
      'create_opportunity', 'edit_opportunity', 'publish_opportunity',
      'add_startup', 'manage_portfolio', 'endorse_startup', 'revoke_endorsement',
      'create_content', 'edit_content', 'publish_content',
      'view_financials', 'view_invoices', 'download_invoices',
      'view_analytics', 'export_analytics',
    ],
    memberCount: 1,
    isSystem: true,
  },
  {
    id: 'role_pm',
    name: 'Program Manager',
    description: 'Direct authority over cohort execution, candidate evaluations, and mentoring milestones.',
    permissions: [
      'view_entity', 'edit_profile',
      'create_program', 'edit_program', 'manage_applications', 'manage_cohorts',
      'create_opportunity', 'edit_opportunity', 'publish_opportunity',
      'add_startup', 'manage_portfolio', 'endorse_startup',
      'create_content', 'edit_content', 'publish_content',
      'view_analytics',
    ],
    memberCount: 2,
    isSystem: true,
  },
  {
    id: 'role_port_mgr',
    name: 'Portfolio Manager',
    description: 'Specialized in venture due diligence, startup relations, endorsement allocation, and investor connect.',
    permissions: [
      'view_entity',
      'add_startup', 'remove_startup', 'manage_portfolio', 'endorse_startup', 'revoke_endorsement',
      'create_opportunity', 'manage_applications',
      'view_financials', 'view_analytics', 'export_analytics',
    ],
    memberCount: 1,
    isSystem: true,
  },
  {
    id: 'role_faculty',
    name: 'Faculty / Coordinator',
    description: 'Academic liaison facilitating lab resources, collegiate patent commercialization, and student ventures.',
    permissions: [
      'view_entity',
      'manage_applications', 'manage_cohorts',
      'add_startup', 'manage_portfolio', 'endorse_startup',
      'create_content',
      'view_analytics',
    ],
    memberCount: 2,
    isSystem: true,
  },
  {
    id: 'role_content',
    name: 'Content Manager',
    description: 'Editorial control over public stories, announcements, press releases, and demo day broadcasts.',
    permissions: [
      'view_entity', 'edit_profile', 'publish_profile',
      'create_content', 'edit_content', 'publish_content',
      'publish_opportunity',
    ],
    memberCount: 1,
    isSystem: true,
  },
  {
    id: 'role_finance',
    name: 'Finance / Billing',
    description: 'Dedicated financial officer managing institutional subscription, invoices, payments, and tax details.',
    permissions: [
      'view_entity',
      'view_financials', 'manage_billing', 'view_invoices', 'download_invoices',
      'view_payments', 'update_billing_details',
      'view_analytics', 'export_analytics',
    ],
    memberCount: 1,
    isSystem: true,
  },
  {
    id: 'role_staff',
    name: 'Staff',
    description: 'Operations and laboratory assistants maintaining facilities and day-to-day cohort coordination.',
    permissions: [
      'view_entity',
      'manage_cohorts',
      'create_content',
    ],
    memberCount: 3,
    isSystem: true,
  },
  {
    id: 'role_student',
    name: 'Student',
    description: 'Collegiate innovator or student entrepreneur member. Profiles are strictly private from public view.',
    permissions: [
      'view_entity',
    ],
    memberCount: 8,
    isSystem: true,
  },
  {
    id: 'role_viewer',
    name: 'Viewer',
    description: 'Read-only observer role for external advisory board members, university chancellors, or auditors.',
    permissions: [
      'view_entity', 'view_analytics',
    ],
    memberCount: 1,
    isSystem: true,
  },
];

export const initialESPEndorsements: ESPEndorsement[] = [];

/** Institutional billing starts unset — no fabricated plan, amounts, or paid invoices. */
export const initialESPBillingOverview: ESPBillingOverview = {
  currentPlan: '',
  subscriptionStatus: 'Trial',
  billingCycle: 'Monthly',
  nextBillingDate: '',
  nextAmountDue: '',
  outstandingBalance: '',
  lastPaymentDate: '',
  lastPaymentAmount: '',
  paymentStatus: '',
};

export const initialESPSubscriptionDetails: ESPSubscriptionDetails = {
  planName: '',
  tier: '',
  startDate: '',
  renewalDate: '',
  billingCycle: 'Monthly (Auto-Renew)',
  status: 'Active',
  basePrice: '',
  discount: '',
  complimentaryPeriod: 'None',
  partnershipPricing: '',
  taxInfo: '',
  finalPayableAmount: '',
};

export const initialESPInvoices: ESPInvoice[] = [];

export const initialESPPayments: ESPPayment[] = [];

export const initialESPPaymentMethods: ESPPaymentMethod[] = [];

export const initialESPBillingDetails: ESPBillingDetails = {
  legalOrgName: '',
  contactName: '',
  email: '',
  phone: '',
  address: '',
  gstin: '',
  panTaxId: '',
  state: '',
  country: 'India',
  pinCode: '',
};

export const initialESPOwnership: ESPOwnershipSettings = {
  primaryOwner: {
    name: '',
    email: '',
    avatar: '',
    designation: '',
    since: '',
  },
  authorizedRepresentative: {
    name: '',
    email: '',
    designation: '',
    phone: '',
  },
  ownershipStatus: undefined,
};

export const initialESPVerification: ESPVerificationSettings = {
  institutionVerified: false,
  domainVerified: false,
  repVerified: false,
  officialDomain: '',
  officialEmail: '',
  lastVerifiedDate: '',
  status: 'Pending Review',
};

export const initialESPEntitlementAllocation: ESPEntitlementAllocation = {
  activeEndorsements: 0,
  eligibleLimit: 0,
  remainingLimit: 0,
  features: [
    { name: 'Startup Pro Allocation Grants', enabled: true, description: 'Ability to endorse cohort startups with free 1-year Startup Pro memberships.' },
    { name: 'Institutional Data Room Verification', enabled: true, description: 'Attest and audit due-diligence lockers with institutional stamp.' },
    { name: 'Direct Angel & VC Syndicate Pipeline', enabled: true, description: 'Directly dispatch curated startups to institutional investor networks.' },
    { name: 'Government Grant Matching Telemetry', enabled: true, description: 'Automated DPIIT / State grant compliance export tools.' },
  ],
  complimentaryBenefits: [],
};

export const initialESPLocations: ESPLocation[] = [];

export const initialESPActivityLog: ESPActivityLogItem[] = [];

// =========================================================================
// LOCALSTORAGE PERSISTENCE HELPERS
// =========================================================================

const ESP_MEMBERS_KEY = 'xentro_esp_members_data';
const ESP_ENDORSEMENTS_KEY = 'xentro_esp_endorsements_data';
const ESP_LOCATIONS_KEY = 'xentro_esp_locations_data';

export function getStoredESPMembers(): ESPMember[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ESP_MEMBERS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.some((m: ESPMember) => m.id?.startsWith('esp_mem_') || m.email?.includes('thub') || m.email?.includes('gitam'))) {
      localStorage.removeItem(ESP_MEMBERS_KEY);
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredESPMembers(members: ESPMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ESP_MEMBERS_KEY, JSON.stringify(members));
    window.dispatchEvent(new CustomEvent('xentro-esp-members-changed', { detail: { members } }));
  } catch (err) {
    console.error('Failed to save ESP members:', err);
  }
}

export function getStoredESPEndorsements(): ESPEndorsement[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ESP_ENDORSEMENTS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.some((e: ESPEndorsement) => e.id?.startsWith('end_') || e.startupName === 'Kinetix AI' || e.startupName === 'AeroVolt Dynamics')) {
      localStorage.removeItem(ESP_ENDORSEMENTS_KEY);
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredESPEndorsements(endorsements: ESPEndorsement[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ESP_ENDORSEMENTS_KEY, JSON.stringify(endorsements));
    window.dispatchEvent(new CustomEvent('xentro-esp-endorsements-changed', { detail: { endorsements } }));
  } catch (err) {
    console.error('Failed to save ESP endorsements:', err);
  }
}

export function getStoredESPLocations(): ESPLocation[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(ESP_LOCATIONS_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.some((l: ESPLocation) => l.id?.startsWith('loc_') || l.name?.includes('T-Hub'))) {
      localStorage.removeItem(ESP_LOCATIONS_KEY);
      return [];
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveStoredESPLocations(locations: ESPLocation[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ESP_LOCATIONS_KEY, JSON.stringify(locations));
    window.dispatchEvent(new CustomEvent('xentro-esp-locations-changed', { detail: { locations } }));
  } catch (err) {
    console.error('Failed to save ESP locations:', err);
  }
}

// Aliases for unified imports
export const mockESPMembers = initialESPMembers;
export const mockESPInvitations = initialESPInvitations;
export const mockESPRoles = initialESPRoles;
export const mockESPPermissions = initialESPPermissions;
export const mockESPEndorsements = initialESPEndorsements;
export const mockESPBillingOverview = initialESPBillingOverview;
export const mockESPSubscriptionDetails = initialESPSubscriptionDetails;
export const mockESPInvoices = initialESPInvoices;
export const mockESPPayments = initialESPPayments;
export const mockESPPaymentMethods = initialESPPaymentMethods;
export const mockESPBillingDetails = initialESPBillingDetails;
export const mockESPOwnershipSettings = initialESPOwnership;
export const mockESPVerificationSettings = initialESPVerification;
export const mockESPEntitlementAllocation = initialESPEntitlementAllocation;
export const mockESPActivityLog = initialESPActivityLog;
export const mockESPLocations = initialESPLocations;

export const mockESPPermissionGroups = [
  { group: 'ENTITY', permissions: initialESPPermissions.filter((p) => p.group === 'ENTITY') },
  { group: 'MEMBERS', permissions: initialESPPermissions.filter((p) => p.group === 'MEMBERS') },
  { group: 'PROFILE', permissions: initialESPPermissions.filter((p) => p.group === 'PROFILE') },
  { group: 'PROGRAMS', permissions: initialESPPermissions.filter((p) => p.group === 'PROGRAMS') },
  { group: 'OPPORTUNITIES', permissions: initialESPPermissions.filter((p) => p.group === 'OPPORTUNITIES') },
  { group: 'PORTFOLIO', permissions: initialESPPermissions.filter((p) => p.group === 'PORTFOLIO') },
  { group: 'CONTENT', permissions: initialESPPermissions.filter((p) => p.group === 'CONTENT') },
  { group: 'FINANCE', permissions: initialESPPermissions.filter((p) => p.group === 'FINANCE') },
  { group: 'ANALYTICS', permissions: initialESPPermissions.filter((p) => p.group === 'ANALYTICS') },
];

export const mockESPOpportunities: ESPOpportunity[] = [];

export const mockESPEvents: ESPEvent[] = [];

export const mockESPApplications: ESPApplication[] = [];

export const mockESPParticipants: ESPParticipant[] = [];

export const mockESPNotifications: ESPWorkspaceNotification[] = [];


