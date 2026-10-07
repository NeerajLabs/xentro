import {
  ESPMemberRole,
  ESPRole,
  ESPPermission,
  ESPEndorsement,
  ESPEndorsementStatus,
  ESPRelationshipType,
  ESPActivityLogItem,
  ESPMember,
  ESPLocation,
} from '@/types/esp';
import {
  initialESPPermissions,
  initialESPRoles,
  initialESPActivityLog,
} from '@/data/espWorkspaceData';

// Storage keys
const ESP_AUDIT_LOG_KEY = 'xentro_esp_audit_log_data';
const ESP_ACTIVE_ROLE_KEY = 'xentro_esp_active_role_simulation';

// =========================================================================
// 1. RBAC & PERMISSION ENGINE
// =========================================================================

export const ESP_SYSTEM_ROLES: ESPMemberRole[] = [
  'Primary Admin / Owner',
  'Institution Admin',
  'Program Manager',
  'Portfolio Manager',
  'Faculty / Coordinator',
  'Content Manager',
  'Finance / Billing',
  'Staff',
  'Student',
  'Viewer',
];

/**
 * Get all permissions assigned to a given role
 */
export function getPermissionsForRole(roleName: ESPMemberRole): string[] {
  const role = initialESPRoles.find((r) => r.name.toLowerCase() === roleName.toLowerCase());
  if (role) return role.permissions;

  // Fallback for custom or unmapped roles
  if (roleName.includes('Admin') || roleName.includes('Owner')) {
    return initialESPPermissions.map((p) => p.id);
  }
  return ['view_entity'];
}

/**
 * Check if a role possesses a specific granular permission
 */
export function hasPermission(roleName: ESPMemberRole, permissionId: string): boolean {
  const permissions = getPermissionsForRole(roleName);
  return permissions.includes(permissionId);
}

/**
 * Evaluate if a role has authorization to access an ESP Dashboard module
 */
export function checkModuleAuthorization(
  roleName: ESPMemberRole,
  moduleId: string
): { allowed: boolean; reason?: string; requiredPermission?: string } {
  // Primary Admin / Owner has unrestricted access across all modules
  if (roleName === 'Primary Admin / Owner' || roleName === 'Institution Admin') {
    return { allowed: true };
  }

  switch (moduleId) {
    case 'overview':
    case 'notifications':
      return { allowed: true };

    case 'profile':
      if (hasPermission(roleName, 'edit_profile') || hasPermission(roleName, 'edit_entity')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Editing institutional profile requires Profile Editor permissions.',
        requiredPermission: 'edit_profile',
      };

    case 'programs':
    case 'cohorts':
      if (
        hasPermission(roleName, 'manage_programs') ||
        hasPermission(roleName, 'manage_cohorts') ||
        hasPermission(roleName, 'manage_applications') ||
        hasPermission(roleName, 'create_program')
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Access to program cohorts and applications requires Program Manager authorization.',
        requiredPermission: 'manage_cohorts',
      };

    case 'portfolio':
      if (hasPermission(roleName, 'manage_portfolio') || hasPermission(roleName, 'add_startup')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Managing institutional portfolio requires Portfolio Manager permissions.',
        requiredPermission: 'manage_portfolio',
      };

    case 'endorsements':
      if (hasPermission(roleName, 'endorse_startup')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Granting official ESP Endorsements & Startup Pro entitlements requires Endorsement Authority.',
        requiredPermission: 'endorse_startup',
      };

    case 'opportunities':
      if (hasPermission(roleName, 'create_opportunity') || hasPermission(roleName, 'publish_opportunity')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Publishing grants and innovation challenges requires Opportunity Manager permissions.',
        requiredPermission: 'create_opportunity',
      };

    case 'events':
      if (hasPermission(roleName, 'create_content') || hasPermission(roleName, 'manage_cohorts')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Event scheduling and demo day broadcast requires Event Coordinator permissions.',
        requiredPermission: 'create_content',
      };

    case 'members':
      if (hasPermission(roleName, 'invite_members') || hasPermission(roleName, 'manage_roles')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Internal institutional member administration is restricted to Institution Administrators.',
        requiredPermission: 'invite_members',
      };

    case 'roles':
      if (hasPermission(roleName, 'manage_roles') || hasPermission(roleName, 'manage_permissions')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Configuring role permissions matrix requires Primary Admin authority.',
        requiredPermission: 'manage_roles',
      };

    case 'team':
      return { allowed: true };

    case 'content':
      if (hasPermission(roleName, 'create_content') || hasPermission(roleName, 'publish_content')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Publishing articles, announcements, and press releases requires Content Manager permissions.',
        requiredPermission: 'create_content',
      };

    case 'analytics':
      if (hasPermission(roleName, 'view_analytics')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Viewing institutional impact and capital telemetry requires Analytics permission.',
        requiredPermission: 'view_analytics',
      };

    case 'billing':
      if (
        hasPermission(roleName, 'manage_billing') ||
        hasPermission(roleName, 'view_invoices') ||
        hasPermission(roleName, 'view_financials')
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Billing, subscription, payment methods, and invoices are strictly restricted to Finance & Primary Admins.',
        requiredPermission: 'manage_billing',
      };

    case 'settings':
      if (hasPermission(roleName, 'manage_entity_settings')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Institutional settings, ownership transfer, and locations require Primary Admin authority.',
        requiredPermission: 'manage_entity_settings',
      };

    default:
      return { allowed: true };
  }
}

// =========================================================================
// 2. AUDIT LOGGING SYSTEM (METADATA ONLY — NEVER LOG SENSITIVE DATA)
// =========================================================================

export function getStoredAuditLogs(): ESPActivityLogItem[] {
  if (typeof window === 'undefined') return initialESPActivityLog;
  try {
    const raw = localStorage.getItem(ESP_AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : initialESPActivityLog;
  } catch {
    return initialESPActivityLog;
  }
}

export function logAuditEvent(
  action: string,
  category: 'Billing' | 'Endorsement' | 'Members' | 'Roles' | 'Settings' | 'Verification' | 'Ownership' | string,
  actorName: string,
  actorRole: string,
  details: string
): void {
  if (typeof window === 'undefined') return;

  const newLog: ESPActivityLogItem = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    action,
    category,
    actorName,
    actorRole,
    timestamp: 'Just now',
    details,
  };

  try {
    const current = getStoredAuditLogs();
    const updated = [newLog, ...current];
    localStorage.setItem(ESP_AUDIT_LOG_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-esp-audit-log-changed', { detail: { log: newLog } }));
  } catch (err) {
    console.error('Failed to append audit log:', err);
  }
}

// =========================================================================
// 3. ENTITLEMENT CALCULATION ENGINE (SEPARATE FROM BILLING)
// =========================================================================

export interface EntitlementResolution {
  eligibleForStartupPro: boolean;
  tier: string;
  durationMonths: number;
  perks: string[];
}

/**
 * Evaluates whether an endorsement confers Startup Pro entitlement
 */
export function evaluateEndorsementEntitlement(
  relationshipType: ESPRelationshipType,
  status: ESPEndorsementStatus
): EntitlementResolution {
  const isEligibleStatus = status === 'Active' || status === 'active';

  // Accredited relationships that receive complimentary Startup Pro
  const eligibleRelationships: ESPRelationshipType[] = [
    'Incubated',
    'Accelerated',
    'Portfolio Startup',
    'Pre-Incubated',
    'Institution-Supported Startup',
  ];

  const isEligible = isEligibleStatus && eligibleRelationships.includes(relationshipType);

  return {
    eligibleForStartupPro: isEligible,
    tier: isEligible ? 'Startup Pro (ESP Endorsed Grant)' : 'Standard Free',
    durationMonths: isEligible ? 12 : 0,
    perks: isEligible
      ? [
          'Verified Institutional Affiliation Badge',
          'Access to Institutional Due Diligence Locker',
          'Direct Syndicate Review & Investor Intro',
          'Cloud & Prototyping Credits ($150,000+ Tier)',
          'Non-dilutive 12-Month Access Pass',
        ]
      : ['Basic Public Profile View'],
  };
}

// =========================================================================
// 4. PRIVACY & SANITIZATION HELPERS
// =========================================================================

/**
 * Strips student identities and unverified private members from public team representations
 */
export function sanitizeMembersForPublicView(members: ESPMember[]): ESPMember[] {
  return members.filter((m) => {
    // Hard constraint: Student profiles NEVER appear publicly
    if (m.role === 'Student' || m.roleId === 'role_student' || m.studentPrivacyProtected) {
      return false;
    }
    // Must be marked public team
    return m.isPublicTeam !== false;
  });
}

/**
 * Returns a masked representation of a payment method
 */
export function formatMaskedCard(last4: string = '4242', brand: string = 'Visa'): string {
  return `${brand} ending in •••• ${last4}`;
}
