/**
 * XENTRO — STARTUP ENTITY RBAC SYSTEM
 * 
 * Implements:
 * - 7 System-Defined Startup Roles (OWNER, ADMIN, FINANCE_LEAD, OPERATIONS_MANAGER, TEAM_MEMBER, ADVISOR, VIEWER)
 * - 10 Security Domains + Affiliate Management Group
 * - 55 Core Capabilities + 5 Affiliate Capabilities
 * - Capability States: Granted ('G'), Scoped ('S'), Restricted ('R')
 * - Centralized Policy Evaluation & Resource Scope Evaluation
 * - MongoDB Authority & Audit Logging
 */

export type StartupRoleIdentifier =
  | 'OWNER'
  | 'ADMIN'
  | 'FINANCE_LEAD'
  | 'OPERATIONS_MANAGER'
  | 'TEAM_MEMBER'
  | 'ADVISOR'
  | 'VIEWER';

export type PermissionState = 'G' | 'S' | 'R';

export interface StartupRoleDefinition {
  id: StartupRoleIdentifier;
  uiId: string; // 'owner' | 'admin' | 'finance' | etc.
  displayName: string;
  description: string;
  sensitivity: 'PROTECTED' | 'MANAGEMENT' | 'CONFIDENTIAL' | 'OPERATIONAL' | 'STANDARD' | 'RESTRICTED' | 'READ_ONLY';
  isSensitive: boolean;
  systemDefined: true;
  presetVersion: string;
}

export const STARTUP_ROLES_CATALOG: Record<StartupRoleIdentifier, StartupRoleDefinition> = {
  OWNER: {
    id: 'OWNER',
    uiId: 'owner',
    displayName: 'Owner / Founder',
    description: 'Sole governing owner with protected capabilities over billing, deletion and entity administration.',
    sensitivity: 'PROTECTED',
    isSensitive: true,
    systemDefined: true,
    presetVersion: '1.0.0',
  },
  ADMIN: {
    id: 'ADMIN',
    uiId: 'admin',
    displayName: 'Admin',
    description: 'General operational management, profile, invitations, asks and opportunities.',
    sensitivity: 'MANAGEMENT',
    isSensitive: false,
    systemDefined: true,
    presetVersion: '1.0.0',
  },
  FINANCE_LEAD: {
    id: 'FINANCE_LEAD',
    uiId: 'finance',
    displayName: 'Finance Lead',
    description: 'Financial management, cap table, due diligence and billing.',
    sensitivity: 'CONFIDENTIAL',
    isSensitive: true,
    systemDefined: true,
    presetVersion: '1.0.0',
  },
  OPERATIONS_MANAGER: {
    id: 'OPERATIONS_MANAGER',
    uiId: 'operations',
    displayName: 'Operations Manager',
    description: 'Operational workflows, asks, connections, meetings and milestones.',
    sensitivity: 'OPERATIONAL',
    isSensitive: false,
    systemDefined: true,
    presetVersion: '1.0.0',
  },
  TEAM_MEMBER: {
    id: 'TEAM_MEMBER',
    uiId: 'team_member',
    displayName: 'Team Member',
    description: 'Contributor with access to assigned tasks, asks and opportunities.',
    sensitivity: 'STANDARD',
    isSensitive: false,
    systemDefined: true,
    presetVersion: '1.0.0',
  },
  ADVISOR: {
    id: 'ADVISOR',
    uiId: 'advisor',
    displayName: 'Advisor',
    description: 'Advisory participation and explicitly shared information.',
    sensitivity: 'RESTRICTED',
    isSensitive: false,
    systemDefined: true,
    presetVersion: '1.0.0',
  },
  VIEWER: {
    id: 'VIEWER',
    uiId: 'viewer',
    displayName: 'Viewer',
    description: 'Strictly read-only observation of permitted non-confidential information.',
    sensitivity: 'READ_ONLY',
    isSensitive: false,
    systemDefined: true,
    presetVersion: '1.0.0',
  },
};

export interface CapabilityDefinition {
  id: string;
  domain: string;
  label: string;
  description: string;
  isSensitive?: boolean;
}

export interface SecurityDomainDefinition {
  id: string;
  name: string;
  isSensitive?: boolean;
  capabilities: CapabilityDefinition[];
}

export const SECURITY_DOMAINS: SecurityDomainDefinition[] = [
  {
    id: 'profile',
    name: 'Profile Management',
    capabilities: [
      { id: 'viewProfileManagement', domain: 'profile', label: 'View Profile Workspace', description: 'Access startup profile dashboard and workspace' },
      { id: 'editBasicInfo', domain: 'profile', label: 'Edit Basic Info', description: 'Modify startup overview, tags, location and mission' },
      { id: 'editPitch', domain: 'profile', label: 'Edit Pitch Deck & Video', description: 'Upload and update pitch deck assets and demo video' },
      { id: 'manageTeam', domain: 'profile', label: 'Manage Team Members', description: 'Coordinate team section display and member invites' },
      { id: 'manageTalentAsk', domain: 'profile', label: 'Manage Talent Ask', description: 'Create and edit startup hiring and talent requirements' },
      { id: 'managePublicVisibility', domain: 'profile', label: 'Manage Public Visibility', description: 'Toggle public vs limited discovery state' },
      { id: 'publishProfile', domain: 'profile', label: 'Publish Profile', description: 'Publish updated profile state to the ecosystem directory' },
    ],
  },
  {
    id: 'opportunities',
    name: 'Opportunities',
    capabilities: [
      { id: 'viewOpportunities', domain: 'opportunities', label: 'View Opportunities', description: 'Browse ecosystem grants, competitions and programs' },
      { id: 'saveOpportunities', domain: 'opportunities', label: 'Save Opportunities', description: 'Bookmark and track opportunities for later review' },
      { id: 'applyOpportunities', domain: 'opportunities', label: 'Apply to Opportunities', description: 'Submit official application on behalf of the startup' },
      { id: 'manageApplications', domain: 'opportunities', label: 'Manage Applications', description: 'Review status, withdraw or modify submitted applications' },
    ],
  },
  {
    id: 'connections',
    name: 'Connections & Messaging',
    capabilities: [
      { id: 'viewConnections', domain: 'connections', label: 'View Connections', description: 'View active ecosystem network and accepted relationships' },
      { id: 'manageConnections', domain: 'connections', label: 'Manage Connections', description: 'Accept, decline or disconnect organizational relationships' },
      { id: 'messageConnections', domain: 'connections', label: 'Message Connections', description: 'Send direct messages on behalf of the startup entity' },
      { id: 'scheduleMeetings', domain: 'connections', label: 'Schedule Meetings', description: 'Propose and schedule mentor/investor calendar meetings' },
    ],
  },
  {
    id: 'ask',
    name: 'Universal Ask Engine',
    capabilities: [
      { id: 'viewAsks', domain: 'ask', label: 'View Asks', description: 'Browse active startup asks and incoming responses' },
      { id: 'createAsk', domain: 'ask', label: 'Create Ask', description: 'Draft new ecosystem asks (capital, talent, advice, etc.)' },
      { id: 'editAsk', domain: 'ask', label: 'Edit Ask', description: 'Modify draft or active ask parameters' },
      { id: 'publishAsk', domain: 'ask', label: 'Publish Ask', description: 'Publish ask to public ecosystem directory' },
      { id: 'closeAsk', domain: 'ask', label: 'Close Ask', description: 'Close and archive satisfied asks' },
      { id: 'manageAskResponses', domain: 'ask', label: 'Manage Responses', description: 'Accept, decline and review proposals from ecosystem members' },
    ],
  },
  {
    id: 'finance',
    name: 'Finance & Cap Table',
    isSensitive: true,
    capabilities: [
      { id: 'viewFinancials', domain: 'finance', label: 'View Financial Records', description: 'Inspect ARR, revenue, runway, cap table and valuation', isSensitive: true },
      { id: 'uploadFinancialData', domain: 'finance', label: 'Upload Financial Data', description: 'Upload monthly MIS, audit balance sheets and burn models', isSensitive: true },
      { id: 'editFinancialData', domain: 'finance', label: 'Edit Financials', description: 'Update current round targets, valuation caps and financials', isSensitive: true },
      { id: 'exportFinancialData', domain: 'finance', label: 'Export Reports', description: 'Export confidential investor reports and financial sheets', isSensitive: true },
      { id: 'manageFinancialVisibility', domain: 'finance', label: 'Manage Financial Visibility', description: 'Control disclosure tier for financial metrics', isSensitive: true },
    ],
  },
  {
    id: 'ddLocker',
    name: 'Due Diligence Locker',
    isSensitive: true,
    capabilities: [
      { id: 'viewDDLocker', domain: 'ddLocker', label: 'View DD Locker', description: 'Browse 7-folder secure virtual due diligence locker', isSensitive: true },
      { id: 'uploadDocuments', domain: 'ddLocker', label: 'Upload Documents', description: 'Upload legal agreements, SHA, IP and compliance files', isSensitive: true },
      { id: 'deleteDocuments', domain: 'ddLocker', label: 'Delete Documents', description: 'Delete sensitive uploaded documents from locker', isSensitive: true },
      { id: 'manageFolders', domain: 'ddLocker', label: 'Manage Folders', description: 'Create and organize virtual due diligence folder structure', isSensitive: true },
      { id: 'approveAccess', domain: 'ddLocker', label: 'Approve DD Access', description: 'Approve time-bounded NDA access for prospective investors', isSensitive: true },
      { id: 'revokeAccess', domain: 'ddLocker', label: 'Revoke Access', description: 'Immediately revoke investor access to diligence documents', isSensitive: true },
      { id: 'viewActivityLogs', domain: 'ddLocker', label: 'View Audit Logs', description: 'Inspect watermarked viewer access and download audit history', isSensitive: true },
    ],
  },
  {
    id: 'content',
    name: 'Content & Updates',
    capabilities: [
      { id: 'viewContent', domain: 'content', label: 'View Content', description: 'View published feed updates and draft company posts' },
      { id: 'createPosts', domain: 'content', label: 'Create Posts', description: 'Draft company milestone updates, hiring posts and launches' },
      { id: 'editPosts', domain: 'content', label: 'Edit Posts', description: 'Edit existing company update drafts' },
      { id: 'publishPosts', domain: 'content', label: 'Publish Posts', description: 'Publish updates to company feed and ecosystem stream' },
      { id: 'deletePosts', domain: 'content', label: 'Delete Posts', description: 'Remove published updates from company profile' },
      { id: 'featurePosts', domain: 'content', label: 'Feature Posts', description: 'Pin update to top of venture profile' },
    ],
  },
  {
    id: 'team',
    name: 'Team & Permissions',
    capabilities: [
      { id: 'viewMembers', domain: 'team', label: 'View Members', description: 'Inspect active team roster, designations and roles' },
      { id: 'inviteMembers', domain: 'team', label: 'Invite Members', description: 'Send membership invitations to personal accounts' },
      { id: 'editMembers', domain: 'team', label: 'Edit Members', description: 'Modify member title, department and public visibility' },
      { id: 'removeMembers', domain: 'team', label: 'Remove Members', description: 'Revoke team membership and entity workspace access' },
      { id: 'assignRoles', domain: 'team', label: 'Assign Roles', description: 'Change system-defined role preset for team members' },
      { id: 'changePermissions', domain: 'team', label: 'Change Permissions', description: 'Override granular capability permissions for members' },
    ],
  },
  {
    id: 'billing',
    name: 'Billing & Subscriptions',
    isSensitive: true,
    capabilities: [
      { id: 'viewBilling', domain: 'billing', label: 'View Billing', description: 'Inspect current subscription tier, plan status and GSTIN', isSensitive: true },
      { id: 'manageSubscription', domain: 'billing', label: 'Manage Subscription', description: 'Upgrade, downgrade or cancel paid SaaS subscription', isSensitive: true },
      { id: 'viewInvoices', domain: 'billing', label: 'View Invoices', description: 'Browse GST-compliant tax invoices and payment history', isSensitive: true },
      { id: 'managePaymentMethod', domain: 'billing', label: 'Payment Methods', description: 'Add or update payment cards and auto-debit authorizations', isSensitive: true },
      { id: 'downloadInvoices', domain: 'billing', label: 'Download Invoices', description: 'Download PDF tax invoices and receipts', isSensitive: true },
    ],
  },
  {
    id: 'entityAdministration',
    name: 'Entity Administration',
    isSensitive: true,
    capabilities: [
      { id: 'manageStartupSettings', domain: 'entityAdministration', label: 'Manage Settings', description: 'General entity configuration and operational switches', isSensitive: true },
      { id: 'changeOfficialEmail', domain: 'entityAdministration', label: 'Change Official Email', description: 'Initiate official company domain email update', isSensitive: true },
      { id: 'changeProfileVisibility', domain: 'entityAdministration', label: 'Change Visibility', description: 'Set Public, Limited, Private or Ghost Mode', isSensitive: true },
      { id: 'transferOwnership', domain: 'entityAdministration', label: 'Transfer Ownership', description: 'Transfer primary venture ownership to another verified member', isSensitive: true },
      { id: 'archiveStartup', domain: 'entityAdministration', label: 'Archive Venture', description: 'Archive entity workspace and withdraw active public listings', isSensitive: true },
    ],
  },
  {
    id: 'affiliate',
    name: 'Affiliate Management',
    capabilities: [
      { id: 'viewAffiliations', domain: 'affiliate', label: 'View Affiliations', description: 'Inspect linked ESP/Incubator program affiliations and cohorts' },
      { id: 'previewAffiliation', domain: 'affiliate', label: 'Preview Affiliate Invitation', description: 'Inspect incoming single-use affiliation invitation details' },
      { id: 'acceptAffiliation', domain: 'affiliate', label: 'Accept Affiliate Invitation', description: 'Legally bind startup to institutional cohort & unlock Pro' },
      { id: 'viewAffiliationHistory', domain: 'affiliate', label: 'View Affiliation History', description: 'Audit timeline of past, active and ended endorsements' },
      { id: 'viewProEntitlement', domain: 'affiliate', label: 'View Pro Entitlement', description: 'Inspect sponsored Startup Pro entitlement validity and perks' },
    ],
  },
];

// =========================================================================
// AUTHORITATIVE ROLE CAPABILITY MATRIX (G = Granted, S = Scoped, R = Restricted)
// =========================================================================

export type RoleCapabilityPreset = Record<string, Record<string, PermissionState>>;

export const STARTUP_RBAC_MATRIX: Record<StartupRoleIdentifier, RoleCapabilityPreset> = {
  OWNER: {
    profile: {
      viewProfileManagement: 'G',
      editBasicInfo: 'G',
      editPitch: 'G',
      manageTeam: 'G',
      manageTalentAsk: 'G',
      managePublicVisibility: 'G',
      publishProfile: 'G',
    },
    opportunities: {
      viewOpportunities: 'G',
      saveOpportunities: 'G',
      applyOpportunities: 'G',
      manageApplications: 'G',
    },
    connections: {
      viewConnections: 'G',
      manageConnections: 'G',
      messageConnections: 'G',
      scheduleMeetings: 'G',
    },
    ask: {
      viewAsks: 'G',
      createAsk: 'G',
      editAsk: 'G',
      publishAsk: 'G',
      closeAsk: 'G',
      manageAskResponses: 'G',
    },
    finance: {
      viewFinancials: 'G',
      uploadFinancialData: 'G',
      editFinancialData: 'G',
      exportFinancialData: 'G',
      manageFinancialVisibility: 'G',
    },
    ddLocker: {
      viewDDLocker: 'G',
      uploadDocuments: 'G',
      deleteDocuments: 'G',
      manageFolders: 'G',
      approveAccess: 'G',
      revokeAccess: 'G',
      viewActivityLogs: 'G',
    },
    content: {
      viewContent: 'G',
      createPosts: 'G',
      editPosts: 'G',
      publishPosts: 'G',
      deletePosts: 'G',
      featurePosts: 'G',
    },
    team: {
      viewMembers: 'G',
      inviteMembers: 'G',
      editMembers: 'G',
      removeMembers: 'G',
      assignRoles: 'G',
      changePermissions: 'G',
    },
    billing: {
      viewBilling: 'G',
      manageSubscription: 'G',
      viewInvoices: 'G',
      managePaymentMethod: 'G',
      downloadInvoices: 'G',
    },
    entityAdministration: {
      manageStartupSettings: 'G',
      changeOfficialEmail: 'G',
      changeProfileVisibility: 'G',
      transferOwnership: 'G',
      archiveStartup: 'G',
    },
    affiliate: {
      viewAffiliations: 'G',
      previewAffiliation: 'G',
      acceptAffiliation: 'G',
      viewAffiliationHistory: 'G',
      viewProEntitlement: 'G',
    },
  },

  ADMIN: {
    // Authoritative Admin Preset matching Section 4 & supplied screenshots exactly
    profile: {
      viewProfileManagement: 'G',
      editBasicInfo: 'G',
      editPitch: 'G',
      manageTeam: 'G',
      manageTalentAsk: 'G',
      managePublicVisibility: 'G',
      publishProfile: 'G',
    },
    opportunities: {
      viewOpportunities: 'G',
      saveOpportunities: 'G',
      applyOpportunities: 'G',
      manageApplications: 'G',
    },
    connections: {
      viewConnections: 'G',
      manageConnections: 'G',
      messageConnections: 'G',
      scheduleMeetings: 'G',
    },
    ask: {
      viewAsks: 'G',
      createAsk: 'G',
      editAsk: 'G',
      publishAsk: 'G',
      closeAsk: 'G',
      manageAskResponses: 'G',
    },
    finance: {
      viewFinancials: 'R',
      uploadFinancialData: 'R',
      editFinancialData: 'R',
      exportFinancialData: 'R',
      manageFinancialVisibility: 'R',
    },
    ddLocker: {
      viewDDLocker: 'R',
      uploadDocuments: 'R',
      deleteDocuments: 'R',
      manageFolders: 'R',
      approveAccess: 'R',
      revokeAccess: 'R',
      viewActivityLogs: 'R',
    },
    content: {
      viewContent: 'G',
      createPosts: 'G',
      editPosts: 'G',
      publishPosts: 'G',
      deletePosts: 'G',
      featurePosts: 'G',
    },
    team: {
      viewMembers: 'G',
      inviteMembers: 'G',
      editMembers: 'G',
      removeMembers: 'R',
      assignRoles: 'R',
      changePermissions: 'R',
    },
    billing: {
      viewBilling: 'R',
      manageSubscription: 'R',
      viewInvoices: 'R',
      managePaymentMethod: 'R',
      downloadInvoices: 'R',
    },
    entityAdministration: {
      manageStartupSettings: 'G',
      changeOfficialEmail: 'R',
      changeProfileVisibility: 'G',
      transferOwnership: 'R',
      archiveStartup: 'R',
    },
    affiliate: {
      viewAffiliations: 'G',
      previewAffiliation: 'G',
      acceptAffiliation: 'R',
      viewAffiliationHistory: 'G',
      viewProEntitlement: 'G',
    },
  },

  FINANCE_LEAD: {
    profile: {
      viewProfileManagement: 'G',
      editBasicInfo: 'R',
      editPitch: 'R',
      manageTeam: 'R',
      manageTalentAsk: 'R',
      managePublicVisibility: 'R',
      publishProfile: 'R',
    },
    opportunities: {
      viewOpportunities: 'G',
      saveOpportunities: 'R',
      applyOpportunities: 'R',
      manageApplications: 'R',
    },
    connections: {
      viewConnections: 'S',
      manageConnections: 'R',
      messageConnections: 'S',
      scheduleMeetings: 'S',
    },
    ask: {
      viewAsks: 'S',
      createAsk: 'R',
      editAsk: 'R',
      publishAsk: 'R',
      closeAsk: 'R',
      manageAskResponses: 'R',
    },
    finance: {
      viewFinancials: 'G',
      uploadFinancialData: 'G',
      editFinancialData: 'G',
      exportFinancialData: 'G',
      manageFinancialVisibility: 'S',
    },
    ddLocker: {
      viewDDLocker: 'G',
      uploadDocuments: 'G',
      deleteDocuments: 'S',
      manageFolders: 'G',
      approveAccess: 'S',
      revokeAccess: 'S',
      viewActivityLogs: 'S',
    },
    content: {
      viewContent: 'G',
      createPosts: 'R',
      editPosts: 'R',
      publishPosts: 'R',
      deletePosts: 'R',
      featurePosts: 'R',
    },
    team: {
      viewMembers: 'S',
      inviteMembers: 'R',
      editMembers: 'R',
      removeMembers: 'R',
      assignRoles: 'R',
      changePermissions: 'R',
    },
    billing: {
      viewBilling: 'G',
      manageSubscription: 'S',
      viewInvoices: 'G',
      managePaymentMethod: 'S',
      downloadInvoices: 'G',
    },
    entityAdministration: {
      manageStartupSettings: 'R',
      changeOfficialEmail: 'R',
      changeProfileVisibility: 'R',
      transferOwnership: 'R',
      archiveStartup: 'R',
    },
    affiliate: {
      viewAffiliations: 'S',
      previewAffiliation: 'R',
      acceptAffiliation: 'R',
      viewAffiliationHistory: 'S',
      viewProEntitlement: 'G',
    },
  },

  OPERATIONS_MANAGER: {
    profile: {
      viewProfileManagement: 'G',
      editBasicInfo: 'G',
      editPitch: 'G',
      manageTeam: 'S',
      manageTalentAsk: 'G',
      managePublicVisibility: 'S',
      publishProfile: 'G',
    },
    opportunities: {
      viewOpportunities: 'G',
      saveOpportunities: 'G',
      applyOpportunities: 'G',
      manageApplications: 'G',
    },
    connections: {
      viewConnections: 'G',
      manageConnections: 'G',
      messageConnections: 'G',
      scheduleMeetings: 'G',
    },
    ask: {
      viewAsks: 'G',
      createAsk: 'G',
      editAsk: 'G',
      publishAsk: 'G',
      closeAsk: 'G',
      manageAskResponses: 'G',
    },
    finance: {
      viewFinancials: 'R',
      uploadFinancialData: 'R',
      editFinancialData: 'R',
      exportFinancialData: 'R',
      manageFinancialVisibility: 'R',
    },
    ddLocker: {
      viewDDLocker: 'R',
      uploadDocuments: 'R',
      deleteDocuments: 'R',
      manageFolders: 'R',
      approveAccess: 'R',
      revokeAccess: 'R',
      viewActivityLogs: 'R',
    },
    content: {
      viewContent: 'G',
      createPosts: 'G',
      editPosts: 'G',
      publishPosts: 'G',
      deletePosts: 'S',
      featurePosts: 'S',
    },
    team: {
      viewMembers: 'G',
      inviteMembers: 'S',
      editMembers: 'S',
      removeMembers: 'R',
      assignRoles: 'R',
      changePermissions: 'R',
    },
    billing: {
      viewBilling: 'R',
      manageSubscription: 'R',
      viewInvoices: 'R',
      managePaymentMethod: 'R',
      downloadInvoices: 'R',
    },
    entityAdministration: {
      manageStartupSettings: 'S',
      changeOfficialEmail: 'R',
      changeProfileVisibility: 'S',
      transferOwnership: 'R',
      archiveStartup: 'R',
    },
    affiliate: {
      viewAffiliations: 'G',
      previewAffiliation: 'S',
      acceptAffiliation: 'R',
      viewAffiliationHistory: 'G',
      viewProEntitlement: 'S',
    },
  },

  TEAM_MEMBER: {
    profile: {
      viewProfileManagement: 'G',
      editBasicInfo: 'R',
      editPitch: 'S',
      manageTeam: 'R',
      manageTalentAsk: 'S',
      managePublicVisibility: 'R',
      publishProfile: 'R',
    },
    opportunities: {
      viewOpportunities: 'G',
      saveOpportunities: 'S',
      applyOpportunities: 'S',
      manageApplications: 'S',
    },
    connections: {
      viewConnections: 'S',
      manageConnections: 'S',
      messageConnections: 'S',
      scheduleMeetings: 'S',
    },
    ask: {
      viewAsks: 'G',
      createAsk: 'S',
      editAsk: 'S',
      publishAsk: 'R',
      closeAsk: 'R',
      manageAskResponses: 'S',
    },
    finance: {
      viewFinancials: 'R',
      uploadFinancialData: 'R',
      editFinancialData: 'R',
      exportFinancialData: 'R',
      manageFinancialVisibility: 'R',
    },
    ddLocker: {
      viewDDLocker: 'R',
      uploadDocuments: 'R',
      deleteDocuments: 'R',
      manageFolders: 'R',
      approveAccess: 'R',
      revokeAccess: 'R',
      viewActivityLogs: 'R',
    },
    content: {
      viewContent: 'G',
      createPosts: 'S',
      editPosts: 'S',
      publishPosts: 'R',
      deletePosts: 'R',
      featurePosts: 'R',
    },
    team: {
      viewMembers: 'S',
      inviteMembers: 'R',
      editMembers: 'R',
      removeMembers: 'R',
      assignRoles: 'R',
      changePermissions: 'R',
    },
    billing: {
      viewBilling: 'R',
      manageSubscription: 'R',
      viewInvoices: 'R',
      managePaymentMethod: 'R',
      downloadInvoices: 'R',
    },
    entityAdministration: {
      manageStartupSettings: 'R',
      changeOfficialEmail: 'R',
      changeProfileVisibility: 'R',
      transferOwnership: 'R',
      archiveStartup: 'R',
    },
    affiliate: {
      viewAffiliations: 'S',
      previewAffiliation: 'R',
      acceptAffiliation: 'R',
      viewAffiliationHistory: 'S',
      viewProEntitlement: 'R',
    },
  },

  ADVISOR: {
    profile: {
      viewProfileManagement: 'S',
      editBasicInfo: 'R',
      editPitch: 'R',
      manageTeam: 'R',
      manageTalentAsk: 'R',
      managePublicVisibility: 'R',
      publishProfile: 'R',
    },
    opportunities: {
      viewOpportunities: 'S',
      saveOpportunities: 'R',
      applyOpportunities: 'R',
      manageApplications: 'R',
    },
    connections: {
      viewConnections: 'S',
      manageConnections: 'R',
      messageConnections: 'S',
      scheduleMeetings: 'S',
    },
    ask: {
      viewAsks: 'S',
      createAsk: 'R',
      editAsk: 'R',
      publishAsk: 'R',
      closeAsk: 'R',
      manageAskResponses: 'R',
    },
    finance: {
      viewFinancials: 'R',
      uploadFinancialData: 'R',
      editFinancialData: 'R',
      exportFinancialData: 'R',
      manageFinancialVisibility: 'R',
    },
    ddLocker: {
      viewDDLocker: 'S',
      uploadDocuments: 'R',
      deleteDocuments: 'R',
      manageFolders: 'R',
      approveAccess: 'R',
      revokeAccess: 'R',
      viewActivityLogs: 'R',
    },
    content: {
      viewContent: 'S',
      createPosts: 'R',
      editPosts: 'R',
      publishPosts: 'R',
      deletePosts: 'R',
      featurePosts: 'R',
    },
    team: {
      viewMembers: 'S',
      inviteMembers: 'R',
      editMembers: 'R',
      removeMembers: 'R',
      assignRoles: 'R',
      changePermissions: 'R',
    },
    billing: {
      viewBilling: 'R',
      manageSubscription: 'R',
      viewInvoices: 'R',
      managePaymentMethod: 'R',
      downloadInvoices: 'R',
    },
    entityAdministration: {
      manageStartupSettings: 'R',
      changeOfficialEmail: 'R',
      changeProfileVisibility: 'R',
      transferOwnership: 'R',
      archiveStartup: 'R',
    },
    affiliate: {
      viewAffiliations: 'S',
      previewAffiliation: 'R',
      acceptAffiliation: 'R',
      viewAffiliationHistory: 'S',
      viewProEntitlement: 'R',
    },
  },

  VIEWER: {
    profile: {
      viewProfileManagement: 'S',
      editBasicInfo: 'R',
      editPitch: 'R',
      manageTeam: 'R',
      manageTalentAsk: 'R',
      managePublicVisibility: 'R',
      publishProfile: 'R',
    },
    opportunities: {
      viewOpportunities: 'S',
      saveOpportunities: 'R',
      applyOpportunities: 'R',
      manageApplications: 'R',
    },
    connections: {
      viewConnections: 'S',
      manageConnections: 'R',
      messageConnections: 'R',
      scheduleMeetings: 'R',
    },
    ask: {
      viewAsks: 'S',
      createAsk: 'R',
      editAsk: 'R',
      publishAsk: 'R',
      closeAsk: 'R',
      manageAskResponses: 'R',
    },
    finance: {
      viewFinancials: 'R',
      uploadFinancialData: 'R',
      editFinancialData: 'R',
      exportFinancialData: 'R',
      manageFinancialVisibility: 'R',
    },
    ddLocker: {
      viewDDLocker: 'R',
      uploadDocuments: 'R',
      deleteDocuments: 'R',
      manageFolders: 'R',
      approveAccess: 'R',
      revokeAccess: 'R',
      viewActivityLogs: 'R',
    },
    content: {
      viewContent: 'S',
      createPosts: 'R',
      editPosts: 'R',
      publishPosts: 'R',
      deletePosts: 'R',
      featurePosts: 'R',
    },
    team: {
      viewMembers: 'S',
      inviteMembers: 'R',
      editMembers: 'R',
      removeMembers: 'R',
      assignRoles: 'R',
      changePermissions: 'R',
    },
    billing: {
      viewBilling: 'R',
      manageSubscription: 'R',
      viewInvoices: 'R',
      managePaymentMethod: 'R',
      downloadInvoices: 'R',
    },
    entityAdministration: {
      manageStartupSettings: 'R',
      changeOfficialEmail: 'R',
      changeProfileVisibility: 'R',
      transferOwnership: 'R',
      archiveStartup: 'R',
    },
    affiliate: {
      viewAffiliations: 'S',
      previewAffiliation: 'R',
      acceptAffiliation: 'R',
      viewAffiliationHistory: 'S',
      viewProEntitlement: 'R',
    },
  },
};

// =========================================================================
// ROLE IDENTIFIER NORMALIZERS
// =========================================================================

export function normalizeStartupRole(rawRole: string | undefined | null): StartupRoleIdentifier {
  if (!rawRole) return 'VIEWER';
  const norm = rawRole.trim().toUpperCase().replace(/[\s\/-]+/g, '_');

  if (norm.includes('OWNER') || norm.includes('FOUNDER')) return 'OWNER';
  if (norm === 'ADMIN') return 'ADMIN';
  if (norm.includes('FINANCE')) return 'FINANCE_LEAD';
  if (norm.includes('OPERATIONS') || norm === 'OPS') return 'OPERATIONS_MANAGER';
  if (norm.includes('TEAM') || norm.includes('MEMBER')) return 'TEAM_MEMBER';
  if (norm.includes('ADVISOR') || norm.includes('MENTOR')) return 'ADVISOR';
  if (norm.includes('VIEWER') || norm.includes('READ_ONLY')) return 'VIEWER';

  return 'VIEWER';
}

export function roleToUiId(role: StartupRoleIdentifier): string {
  return STARTUP_ROLES_CATALOG[role]?.uiId || 'viewer';
}

export function uiIdToRole(uiId: string): StartupRoleIdentifier {
  switch (uiId.toLowerCase()) {
    case 'owner':
      return 'OWNER';
    case 'admin':
      return 'ADMIN';
    case 'finance':
      return 'FINANCE_LEAD';
    case 'operations':
      return 'OPERATIONS_MANAGER';
    case 'team_member':
    case 'team':
      return 'TEAM_MEMBER';
    case 'advisor':
      return 'ADVISOR';
    case 'viewer':
      return 'VIEWER';
    default:
      return 'VIEWER';
  }
}

// =========================================================================
// CENTRALIZED POLICY EVALUATION ENGINE
// =========================================================================

export interface ScopeEvaluationContext {
  userId?: string;
  assignedUserIds?: string[];
  isExplicitlyShared?: boolean;
  resourceOwnerId?: string;
  resourceCategory?: string;
}

export interface AuthorizationResult {
  allowed: boolean;
  state: PermissionState;
  reason?: string;
}

/**
 * Centralized policy evaluation for Startup capabilities.
 * Resolves capability state (G, S, R) and evaluates scope constraints.
 */
export function evaluateStartupCapability(
  role: StartupRoleIdentifier | string,
  domain: string,
  capabilityId: string,
  scopeContext?: ScopeEvaluationContext
): AuthorizationResult {
  const normRole = typeof role === 'string' && (role in STARTUP_ROLES_CATALOG)
    ? (role as StartupRoleIdentifier)
    : normalizeStartupRole(role);

  const rolePreset = STARTUP_RBAC_MATRIX[normRole];
  if (!rolePreset) {
    return { allowed: false, state: 'R', reason: `Unknown role preset: ${role}` };
  }

  const domainPerms = rolePreset[domain];
  if (!domainPerms) {
    return { allowed: false, state: 'R', reason: `Unknown security domain: ${domain}` };
  }

  const permState: PermissionState = domainPerms[capabilityId] || 'R';

  // 1. Granted ('G') -> Unrestricted organizational access
  if (permState === 'G') {
    return { allowed: true, state: 'G' };
  }

  // 2. Restricted ('R') -> Denied unconditionally
  if (permState === 'R') {
    return {
      allowed: false,
      state: 'R',
      reason: `Action '${capabilityId}' in '${domain}' is restricted for role '${STARTUP_ROLES_CATALOG[normRole].displayName}'`,
    };
  }

  // 3. Scoped ('S') -> Must pass explicit resource scope check
  if (permState === 'S') {
    if (!scopeContext) {
      return {
        allowed: false,
        state: 'S',
        reason: `Action '${capabilityId}' requires explicit resource scope verification`,
      };
    }

    // Check explicit sharing
    if (scopeContext.isExplicitlyShared === true) {
      return { allowed: true, state: 'S' };
    }

    // Check resource ownership / assignment
    if (
      scopeContext.userId &&
      (scopeContext.resourceOwnerId === scopeContext.userId ||
        scopeContext.assignedUserIds?.includes(scopeContext.userId))
    ) {
      return { allowed: true, state: 'S' };
    }

    return {
      allowed: false,
      state: 'S',
      reason: `Resource is outside the assigned scope for this ${STARTUP_ROLES_CATALOG[normRole].displayName}`,
    };
  }

  // Fallback safe default
  return { allowed: false, state: 'R', reason: 'Default deny policy enforced' };
}
