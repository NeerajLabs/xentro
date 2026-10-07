import { AdminRole, AdminPermission, AdminSession } from '@/types/admin';

const ADMIN_SESSION_KEY = 'xentro_admin_session';

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  'accounts.read',
  'accounts.manage',
  'entities.read',
  'entities.manage',
  'workspaces.read',
  'workspaces.manage',
  'verification.read',
  'verification.review',
  'identity_verification.review', // Restricted Aadhaar & Govt ID review permission
  'memberships.read',
  'memberships.manage',
  'ownership.read',
  'ownership.manage',
  'roles.read',
  'roles.manage',
  'relationships.read',
  'relationships.manage',
  'opportunities.read',
  'opportunities.manage',
  'programs.read',
  'programs.manage',
  'mentorship.read',
  'mentorship.manage',
  'meetings.read',
  'content.read',
  'content.moderate',
  'documents.read',
  'documents.manage',
  'billing.read',
  'billing.manage',
  'payments.read',
  'payments.manage',
  'refunds.manage',
  'payouts.manage',
  'support.read',
  'support.manage',
  'safety.read',
  'safety.manage',
  'analytics.read',
  'configuration.manage',
  'feature_flags.manage',
  'audit_logs.read',
  'admin_team.manage',
];

export const ADMIN_ROLE_PERMISSIONS: Record<AdminRole, AdminPermission[]> = {
  'Super Admin': ALL_ADMIN_PERMISSIONS,

  'Operations Admin': [
    'accounts.read',
    'accounts.manage',
    'entities.read',
    'entities.manage',
    'workspaces.read',
    'verification.read',
    'verification.review', // Has generic verification review, NOT identity_verification.review
    'memberships.read',
    'memberships.manage',
    'ownership.read',
    'ownership.manage',
    'roles.read',
    'relationships.read',
    'relationships.manage',
    'opportunities.read',
    'opportunities.manage',
    'programs.read',
    'mentorship.read',
    'meetings.read',
    'content.read',
    'documents.read',
    'support.read',
    'support.manage',
    'safety.read',
    'analytics.read',
    'audit_logs.read',
  ],

  'Identity Verification Admin': [
    'accounts.read',
    'verification.read',
    'verification.review',
    'identity_verification.review', // Explicitly granted restricted identity document review
    'audit_logs.read',
  ],

  'Entity Verification Admin': [
    'entities.read',
    'entities.manage',
    'verification.read',
    'verification.review',
    'memberships.read',
    'audit_logs.read',
  ],

  'Startup Operations': [
    'entities.read',
    'entities.manage',
    'workspaces.read',
    'relationships.read',
    'opportunities.read',
    'content.read',
    'documents.read',
    'support.read',
    'analytics.read',
  ],

  'Mentor Operations': [
    'accounts.read',
    'mentorship.read',
    'mentorship.manage',
    'meetings.read',
    'content.read',
    'support.read',
    'analytics.read',
  ],

  'Investor Operations': [
    'entities.read',
    'relationships.read',
    'documents.read',
    'meetings.read',
    'analytics.read',
  ],

  'ESP Operations': [
    'entities.read',
    'entities.manage',
    'programs.read',
    'programs.manage',
    'relationships.read',
    'opportunities.read',
    'analytics.read',
  ],

  'ESP Manager': [
    'entities.read',
    'entities.manage',
    'programs.read',
    'programs.manage',
    'relationships.read',
  ],

  'Opportunity Manager': [
    'opportunities.read',
    'opportunities.manage',
    'programs.read',
    'programs.manage',
    'analytics.read',
  ],

  'Opportunities Manager': [
    'opportunities.read',
    'opportunities.manage',
    'programs.read',
    'programs.manage',
    'analytics.read',
  ],

  'Verification Admin': [
    'verification.read',
    'verification.review',
    'accounts.read',
    'audit_logs.read',
  ],

  'Mentorship Operations': [
    'mentorship.read',
    'mentorship.manage',
    'meetings.read',
    'relationships.read',
    'support.read',
  ],

  'Finance Admin': [
    'billing.read',
    'billing.manage',
    'payments.read',
    'payments.manage',
    'refunds.manage',
    'payouts.manage',
    'analytics.read',
    'audit_logs.read',
  ],

  'Billing Admin': [
    'billing.read',
    'billing.manage',
    'payments.read',
  ],

  'Support Admin': [
    'support.read',
    'support.manage',
    'accounts.read',
    'content.read',
  ],

  'Trust & Safety Admin': [
    'safety.read',
    'safety.manage',
    'content.read',
    'content.moderate',
    'accounts.read',
    'accounts.manage',
    'audit_logs.read',
  ],

  'Content Moderator': [
    'content.read',
    'content.moderate',
    'safety.read',
  ],

  'Analytics Viewer': [
    'analytics.read',
    'accounts.read',
    'entities.read',
  ],

  'Technical Admin': [
    'configuration.manage',
    'feature_flags.manage',
    'audit_logs.read',
    'admin_team.manage',
  ],

  'Compliance Admin': [
    'accounts.read',
    'entities.read',
    'verification.read',
    'verification.review',
    'documents.read',
    'audit_logs.read',
  ],

  'Support Agent': [
    'accounts.read',
    'support.read',
    'support.manage',
    'safety.read',
  ],

  'Read-Only Auditor': [
    'accounts.read',
    'entities.read',
    'workspaces.read',
    'verification.read',
    'memberships.read',
    'ownership.read',
    'relationships.read',
    'opportunities.read',
    'programs.read',
    'documents.read',
    'billing.read',
    'payments.read',
    'support.read',
    'safety.read',
    'analytics.read',
    'audit_logs.read',
  ],

  'Security Admin': [
    'accounts.read',
    'accounts.manage',
    'safety.read',
    'safety.manage',
    'audit_logs.read',
    'admin_team.manage',
    'feature_flags.manage',
  ],

  'System Administrator': [
    'configuration.manage',
    'feature_flags.manage',
    'audit_logs.read',
    'admin_team.manage',
  ],
};

export function getPermissionsForRole(role: AdminRole): AdminPermission[] {
  return ADMIN_ROLE_PERMISSIONS[role] || [];
}

export function hasAdminPermission(
  session: AdminSession | null,
  permission: AdminPermission
): boolean {
  if (!session) return false;
  // If Super Admin, they have all permissions
  if (session.role === 'Super Admin') return true;
  return session.permissions ? session.permissions.includes(permission) : false;
}

export async function verifyAdminCredentials(
  employeeId: string,
  password: string
): Promise<AdminSession | null> {
  // Simulate network round-trip delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const trimmedId = employeeId.trim();
  const trimmedPass = password.trim();

  // Primary Super Admin Credential
  // Employee ID: 9922953 | Password: Kar04052003
  // Identity: Karunya Kranthi Kumar | Role: Super Admin (Executive Operations)
  if (
    trimmedId === '9922953' &&
    (trimmedPass === 'Kar04052003' || trimmedPass.toLowerCase() === 'kar04052003')
  ) {
    const role: AdminRole = 'Super Admin';
    const session: AdminSession = {
      employeeId: '9922953',
      name: 'Karunya Kranthi Kumar',
      role,
      department: 'Executive Operations',
      permissions: getPermissionsForRole(role),
      token: 'xa_sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    return session;
  }

  // Secondary administrative credentials
  const secondaryIds = ['8121417', 'admin', '9911223', '9922953'];
  const secondaryPasswords = ['Sra231206', 'sra231206', 'Kar04052003', 'kar04052003'];

  const matchedId = secondaryIds.find((id) => id.toLowerCase() === trimmedId.toLowerCase());
  const isPasswordValid = secondaryPasswords.some(
    (p) => p === trimmedPass || p.toLowerCase() === trimmedPass.toLowerCase()
  );

  if (matchedId && isPasswordValid) {
    const isSravan = matchedId.toLowerCase() === '8121417' || matchedId.toLowerCase() === 'admin';
    const adminName = isSravan ? 'Sravan Kumar' : 'Karunya Kranthi Kumar';
    const dept = isSravan ? 'Platform Architecture & Security' : 'Executive Operations';
    const role: AdminRole = 'Super Admin';

    const session: AdminSession = {
      employeeId: matchedId,
      name: adminName,
      role,
      department: dept,
      permissions: getPermissionsForRole(role),
      token: 'xa_sec_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    return session;
  }

  return null;
}

export function switchAdminRole(newRole: AdminRole): AdminSession | null {
  const current = getAdminSession();
  if (!current) return null;
  const updated: AdminSession = {
    ...current,
    role: newRole,
    permissions: getPermissionsForRole(newRole),
  };
  setAdminSession(updated);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xentro-admin-session-changed', { detail: updated }));
  }
  return updated;
}

export function getAdminSession(): AdminSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(ADMIN_SESSION_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored) as AdminSession;
    if (new Date(parsed.expiresAt) < new Date()) {
      clearAdminSession();
      return null;
    }
    // Ensure permissions array exists
    if (!parsed.permissions || parsed.permissions.length === 0) {
      parsed.permissions = getPermissionsForRole(parsed.role);
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setAdminSession(session: AdminSession): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
    document.cookie = `xentro_admin_auth=${session.token}; path=/; max-age=86400; SameSite=Lax`;
  } catch (err) {
    console.error('Failed to persist admin session', err);
  }
}

export function clearAdminSession(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    document.cookie = 'xentro_admin_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch (err) {
    console.error('Failed to clear admin session', err);
  }
}

export function isAuthenticatedAdmin(): boolean {
  return getAdminSession() !== null;
}

export function createDefaultAdminSession(): AdminSession {
  const role: AdminRole = 'Super Admin';
  const session: AdminSession = {
    employeeId: '9922953',
    name: 'Karunya Kranthi Kumar',
    role,
    department: 'Executive Operations',
    permissions: getPermissionsForRole(role),
    token: 'xa_sec_default_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  setAdminSession(session);
  return session;
}


