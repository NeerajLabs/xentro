/**
 * XENTRO V1 — CANONICAL 13-ROLE OPERATIONAL ARCHITECTURE
 * 
 * Strict 13 roles across 3 entity categories:
 * - Startup (4): Founder/Head, Admin, Finance, Viewer
 * - Investment Organization (5): Managing Partner/Head, Admin, Investment Team, Finance/Operations, Viewer
 *   (Investment Team capability templates: Analyst, Associate, Principal, Partner, Portfolio Manager)
 * - ESP / Institution (4): Head, Admin, Program Manager, Staff/Coordinator
 * 
 * Selection Committees: Resource-scoped appointments, NOT broad RBAC roles.
 */

export const STARTUP_ROLES = [
  'Founder/Head',
  'Admin',
  'Finance',
  'Viewer',
] as const;

export const INVESTOR_ORG_ROLES = [
  'Managing Partner/Head',
  'Admin',
  'Investment Team',
  'Finance/Operations',
  'Viewer',
] as const;

export const ESP_INSTITUTION_ROLES = [
  'Head',
  'Admin',
  'Program Manager',
  'Staff/Coordinator',
] as const;

export const INVESTMENT_TEAM_CAPABILITY_TEMPLATES = [
  'Analyst',
  'Associate',
  'Principal',
  'Partner',
  'Portfolio Manager',
] as const;

export type StartupRole = (typeof STARTUP_ROLES)[number];
export type InvestorOrgRole = (typeof INVESTOR_ORG_ROLES)[number];
export type EspInstitutionRole = (typeof ESP_INSTITUTION_ROLES)[number];
export type InvestmentTeamTemplate = (typeof INVESTMENT_TEAM_CAPABILITY_TEMPLATES)[number];

export const ALL_CANONICAL_ROLES = [
  ...STARTUP_ROLES,
  ...INVESTOR_ORG_ROLES,
  ...ESP_INSTITUTION_ROLES,
] as const;

export const PROHIBITED_INVITATION_ROLES = new Set([
  'FOUNDER/HEAD',
  'FOUNDER',
  'MANAGING PARTNER/HEAD',
  'MANAGING PARTNER',
  'HEAD',
  'OWNER',
  'PRIMARY OWNER',
]);

/**
 * Normalizes a role string to canonical representation
 */
export function normalizeCanonicalRole(role: string): string {
  const clean = (role || '').trim();
  const lower = clean.toLowerCase();

  // Startup
  if (lower.includes('founder') || lower === 'head' && lower.includes('startup')) return 'Founder/Head';
  if (lower === 'finance' || lower === 'financial') return 'Finance';
  if (lower === 'viewer') return 'Viewer';

  // Investor
  if (lower.includes('managing partner')) return 'Managing Partner/Head';
  if (lower === 'finance/operations' || lower.includes('operations')) return 'Finance/Operations';
  if (
    lower.includes('investment team') ||
    lower === 'analyst' ||
    lower === 'associate' ||
    lower === 'principal' ||
    lower === 'partner' ||
    lower === 'portfolio manager'
  ) {
    return 'Investment Team';
  }

  // ESP / Institution
  if (lower === 'program manager' || lower.includes('program')) return 'Program Manager';
  if (lower === 'staff/coordinator' || lower === 'staff' || lower === 'coordinator') return 'Staff/Coordinator';

  // Admin
  if (lower === 'admin' || lower.includes('admin')) return 'Admin';

  return clean || 'Viewer';
}

/**
 * Validates whether an Admin appointment or permission modification requires Head approval.
 * Appointing an Admin, modifying Admin roles, or updating Admin permissions strictly requires
 * the governing Head (isHead === true or active ENTITY_MASTER session).
 */
export function requiresHeadApprovalForRoleMutation(targetRole: string, newRole?: string): boolean {
  const normalizedTarget = (targetRole || '').trim().toLowerCase();
  const normalizedNew = (newRole || '').trim().toLowerCase();

  if (normalizedTarget.includes('admin') || normalizedNew.includes('admin')) {
    return true;
  }
  if (normalizedTarget.includes('head') || normalizedTarget.includes('founder') || normalizedTarget.includes('managing partner')) {
    return true;
  }
  return false;
}

/**
 * Default granular action permissions for the 13 canonical roles
 */
export const CANONICAL_ROLE_PERMISSIONS: Record<string, string[]> = {
  // Startup
  'Founder/Head': [
    'MANAGE_ORGANIZATION',
    'MANAGE_TEAM',
    'MANAGE_ADMINS',
    'MANAGE_BILLING',
    'MANAGE_FINANCE',
    'EDIT_PROFILE',
    'PUBLISH_PROFILE',
    'MANAGE_TALENT',
    'MANAGE_DILIGENCE',
    'APPROVE_DILIGENCE_REQUESTS',
    'VIEW_FINANCIALS',
    'VIEW_DILIGENCE',
    'VIEW_LOGS',
  ],
  Admin: [
    'MANAGE_ORGANIZATION',
    'MANAGE_TEAM',
    'EDIT_PROFILE',
    'PUBLISH_PROFILE',
    'MANAGE_TALENT',
    'MANAGE_DILIGENCE',
    'VIEW_DILIGENCE',
    // MANAGE_FINANCE and VIEW_FINANCIALS are strictly NOT granted by default to Admins!
  ],
  Finance: [
    'MANAGE_FINANCE',
    'VIEW_FINANCIALS',
    'MANAGE_BILLING',
    'VIEW_DILIGENCE',
  ],
  Viewer: [
    'VIEW_ONLY',
  ],

  // Investor Org
  'Managing Partner/Head': [
    'MANAGE_ORGANIZATION',
    'MANAGE_TEAM',
    'MANAGE_ADMINS',
    'MANAGE_BILLING',
    'VIEW_DEALFLOW',
    'EDIT_DEALFLOW',
    'CREATE_INVESTMENT_DECISION',
    'VIEW_PORTFOLIO',
    'EDIT_PORTFOLIO',
    'ACCESS_DILIGENCE',
    'REQUEST_DILIGENCE',
    'MANAGE_COMMITTEES',
    'VIEW_LOGS',
  ],
  'Investment Team': [
    'VIEW_DEALFLOW',
    'EDIT_DEALFLOW',
    'VIEW_PORTFOLIO',
    'ACCESS_DILIGENCE',
    'REQUEST_DILIGENCE',
  ],
  'Finance/Operations': [
    'MANAGE_BILLING',
    'VIEW_PORTFOLIO',
    'EXPORT_DATA',
  ],

  // ESP / Institution
  Head: [
    'MANAGE_ORGANIZATION',
    'MANAGE_TEAM',
    'MANAGE_ADMINS',
    'MANAGE_PROGRAMS',
    'APPROVE_SELECTIONS',
    'MANAGE_AFFILIATIONS',
    'MANAGE_BILLING',
    'VIEW_LOGS',
  ],
  'Program Manager': [
    'MANAGE_PROGRAMS',
    'MANAGE_COHORTS',
    'REVIEW_APPLICATIONS',
    'MANAGE_MENTORS',
  ],
  'Staff/Coordinator': [
    'VIEW_PROGRAMS',
    'MANAGE_APPLICANTS',
    'SCHEDULE_SESSIONS',
  ],
};
