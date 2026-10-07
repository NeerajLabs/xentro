import {
  AdminPersonalAccount,
  AdminEntityAccount,
  AdminWorkspace,
  AdminStartupRecord,
  AdminMentorRecord,
  AdminInvestorRecord,
  AdminEspRecord,
  AdminVerificationCase,
  AdminEntityMembership,
  AdminOwnershipRecord,
  AdminInvitationRecord,
  AdminRelationshipRecord,
  AdminMentorshipRecord,
  AdminEndorsementRecord,
  AdminFinanceSummary,
  AdminSubscription,
  AdminEntitlementRecord,
  AdminPaymentTransaction,
  AdminPayoutRecord,
  AdminRefundRecord,
  AdminInvoiceRecord,
  AdminPlanPricing,
  AdminFeatureFlag,
  AdminSystemHealthService,
  AuditLogEntry,
  AdminRole,
} from '@/types/admin';
import { getAdminSession, hasAdminPermission } from './adminAuth';

const ADMIN_STORAGE_KEY = 'xentro_admin_domain_store_v2';

// -------------------------------------------------------------
// Initial Clean Data Repositories (Strict Real Data Mode)
// -------------------------------------------------------------
export const INITIAL_PERSONAL_ACCOUNTS: AdminPersonalAccount[] = [];

export const INITIAL_ENTITY_ACCOUNTS: AdminEntityAccount[] = [];

export const INITIAL_WORKSPACES: AdminWorkspace[] = [];

export const INITIAL_VERIFICATION_CASES: AdminVerificationCase[] = [];

export const INITIAL_MEMBERSHIPS: AdminEntityMembership[] = [];

export const INITIAL_OWNERSHIP_RECORDS: AdminOwnershipRecord[] = [];

export const INITIAL_RELATIONSHIPS: AdminRelationshipRecord[] = [];

export const INITIAL_MENTORSHIPS: AdminMentorshipRecord[] = [];

export const INITIAL_ENDORSEMENTS: AdminEndorsementRecord[] = [];

export const INITIAL_FINANCE_SUMMARY: AdminFinanceSummary = {
  mrrUSD: 0,
  arrUSD: 0,
  grossRevenueUSD: 0,
  netRevenueUSD: 0,
  startupSubRevenueUSD: 0,
  investorSubRevenueUSD: 0,
  espRevenueUSD: 0,
  mentorSessionGMVUSD: 0,
  mentorshipGMVUSD: 0,
  totalCommissionUSD: 0,
  pendingPayoutsUSD: 0,
  totalRefundsUSD: 0,
  failedPaymentsCount: 0,
};

export const INITIAL_SUBSCRIPTIONS: AdminSubscription[] = [];

export const INITIAL_ENTITLEMENTS: AdminEntitlementRecord[] = [];

export const INITIAL_PAYMENTS: AdminPaymentTransaction[] = [];

export const INITIAL_FEATURE_FLAGS: AdminFeatureFlag[] = [
  { id: 'ff-01', key: 'ai_pitch_deck_analyzer', name: 'AI Pitch Deck Telemetry & Thesis Score', description: 'Enables automated LLM thesis matching and pitch deck tear-downs.', isEnabled: true, targetAudience: 'Global', updatedAt: '2025-03-10', updatedBy: 'Platform Administrator' },
  { id: 'ff-02', key: 'structured_mentorship_v2', name: 'Structured Long-Term Mentorship Engagements', description: 'Unlocks escrow milestones, long-term advisor contracts, and commission splits.', isEnabled: true, targetAudience: 'Global', updatedAt: '2025-03-12', updatedBy: 'Platform Administrator' },
  { id: 'ff-03', key: 'investor_org_multi_seat', name: 'Investor Organization 9-Role Multi-Seat RBAC', description: 'Enables institutional partner/associate seats and deal lead assignment.', isEnabled: true, targetAudience: 'Global', updatedAt: '2025-03-24', updatedBy: 'Platform Administrator' },
  { id: 'ff-04', key: 'esp_research_commercialization', name: 'University Research Commercialization Hub', description: 'Early-access prototype for patents and faculty spin-outs.', isEnabled: false, targetAudience: 'Beta Cohort', updatedAt: '2025-03-18', updatedBy: 'Platform Administrator' },
  { id: 'ff-05', key: 'aadhaar_offline_kyc_vault', name: 'Aadhaar Offline XML Strict Privacy Gateway', description: 'Restricted identity storage ensuring zero raw Aadhaar numbers touch clients.', isEnabled: true, targetAudience: 'Global', updatedAt: '2025-03-01', updatedBy: 'Platform Administrator' },
];

export const INITIAL_SYSTEM_HEALTH: AdminSystemHealthService[] = [
  { service: 'Authentication & Session Broker', status: 'Operational', latencyMs: 24, uptimePercent: 99.98, lastChecked: '1 min ago' },
  { service: 'PostgreSQL Relational Primary', status: 'Operational', latencyMs: 12, uptimePercent: 99.99, lastChecked: 'Just now' },
  { service: 'KYC & Identity Tokenizer Vault', status: 'Operational', latencyMs: 45, uptimePercent: 100.0, lastChecked: '2 mins ago' },
  { service: 'Stripe & Razorpay Payment Webhooks', status: 'Operational', latencyMs: 110, uptimePercent: 99.95, lastChecked: '3 mins ago' },
  { service: 'Virtual Diligence Document Watermarker', status: 'Operational', latencyMs: 85, uptimePercent: 99.91, lastChecked: '1 min ago' },
  { service: 'AI Scraping & Opportunity Ingestor', status: 'Operational', latencyMs: 320, uptimePercent: 99.40, lastChecked: '4 mins ago' },
];

// -------------------------------------------------------------
// Central Admin Domain Store & Mutators
// -------------------------------------------------------------
interface AdminStoreState {
  personalAccounts: AdminPersonalAccount[];
  entityAccounts: AdminEntityAccount[];
  workspaces: AdminWorkspace[];
  verificationCases: AdminVerificationCase[];
  memberships: AdminEntityMembership[];
  ownershipRecords: AdminOwnershipRecord[];
  relationships: AdminRelationshipRecord[];
  mentorships: AdminMentorshipRecord[];
  endorsements: AdminEndorsementRecord[];
  financeSummary: AdminFinanceSummary;
  subscriptions: AdminSubscription[];
  entitlements: AdminEntitlementRecord[];
  payments: AdminPaymentTransaction[];
  featureFlags: AdminFeatureFlag[];
  systemHealth: AdminSystemHealthService[];
}

function loadStore(): AdminStoreState {
  if (typeof window === 'undefined') {
    return {
      personalAccounts: INITIAL_PERSONAL_ACCOUNTS,
      entityAccounts: INITIAL_ENTITY_ACCOUNTS,
      workspaces: INITIAL_WORKSPACES,
      verificationCases: INITIAL_VERIFICATION_CASES,
      memberships: INITIAL_MEMBERSHIPS,
      ownershipRecords: INITIAL_OWNERSHIP_RECORDS,
      relationships: INITIAL_RELATIONSHIPS,
      mentorships: INITIAL_MENTORSHIPS,
      endorsements: INITIAL_ENDORSEMENTS,
      financeSummary: INITIAL_FINANCE_SUMMARY,
      subscriptions: INITIAL_SUBSCRIPTIONS,
      entitlements: INITIAL_ENTITLEMENTS,
      payments: INITIAL_PAYMENTS,
      featureFlags: INITIAL_FEATURE_FLAGS,
      systemHealth: INITIAL_SYSTEM_HEALTH,
    };
  }
  try {
    // Purge old mock storage key if present
    localStorage.removeItem('xentro_admin_domain_store_v1');

    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) {
      const initial: AdminStoreState = {
        personalAccounts: INITIAL_PERSONAL_ACCOUNTS,
        entityAccounts: INITIAL_ENTITY_ACCOUNTS,
        workspaces: INITIAL_WORKSPACES,
        verificationCases: INITIAL_VERIFICATION_CASES,
        memberships: INITIAL_MEMBERSHIPS,
        ownershipRecords: INITIAL_OWNERSHIP_RECORDS,
        relationships: INITIAL_RELATIONSHIPS,
        mentorships: INITIAL_MENTORSHIPS,
        endorsements: INITIAL_ENDORSEMENTS,
        financeSummary: INITIAL_FINANCE_SUMMARY,
        subscriptions: INITIAL_SUBSCRIPTIONS,
        entitlements: INITIAL_ENTITLEMENTS,
        payments: INITIAL_PAYMENTS,
        featureFlags: INITIAL_FEATURE_FLAGS,
        systemHealth: INITIAL_SYSTEM_HEALTH,
      };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {
      personalAccounts: INITIAL_PERSONAL_ACCOUNTS,
      entityAccounts: INITIAL_ENTITY_ACCOUNTS,
      workspaces: INITIAL_WORKSPACES,
      verificationCases: INITIAL_VERIFICATION_CASES,
      memberships: INITIAL_MEMBERSHIPS,
      ownershipRecords: INITIAL_OWNERSHIP_RECORDS,
      relationships: INITIAL_RELATIONSHIPS,
      mentorships: INITIAL_MENTORSHIPS,
      endorsements: INITIAL_ENDORSEMENTS,
      financeSummary: INITIAL_FINANCE_SUMMARY,
      subscriptions: INITIAL_SUBSCRIPTIONS,
      entitlements: INITIAL_ENTITLEMENTS,
      payments: INITIAL_PAYMENTS,
      featureFlags: INITIAL_FEATURE_FLAGS,
      systemHealth: INITIAL_SYSTEM_HEALTH,
    };
  }
}

function saveStore(store: AdminStoreState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent('xentro-admin-updated'));
  } catch (err) {
    console.error('Failed to save admin store state', err);
  }
}

export function logAdminAudit(
  action: string,
  module: string,
  details: string,
  entityId?: string,
  previousValue?: string,
  newValue?: string
): void {
  if (typeof window === 'undefined') return;
  try {
    const session = getAdminSession();
    const newEntry: AuditLogEntry = {
      id: `aud-${Date.now().toString().slice(-5)}`,
      adminName: session?.name || 'Administrator',
      employeeId: session?.employeeId || 'admin',
      action,
      module,
      entityId,
      details,
      previousValue,
      newValue,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      ipAddress: '127.0.0.1',
    };
    const AUDIT_LOGS_KEY = 'xentro_admin_audit_logs';
    const existingRaw = localStorage.getItem(AUDIT_LOGS_KEY);
    const existing: AuditLogEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
    existing.unshift(newEntry);
    localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(existing.slice(0, 200)));
    window.dispatchEvent(new CustomEvent('xentro-audit-logged', { detail: newEntry }));
  } catch (err) {
    console.error('Failed to append audit log', err);
  }
}

// -------------------------------------------------------------
// Service Methods
// -------------------------------------------------------------
export const adminDomainService = {
  getPersonalAccounts(): AdminPersonalAccount[] {
    return loadStore().personalAccounts;
  },

  getEntityAccounts(): AdminEntityAccount[] {
    return loadStore().entityAccounts;
  },

  getWorkspaces(): AdminWorkspace[] {
    return loadStore().workspaces;
  },

  getVerificationCases(): AdminVerificationCase[] {
    return loadStore().verificationCases;
  },

  getMemberships(): AdminEntityMembership[] {
    return loadStore().memberships;
  },

  getOwnershipRecords(): AdminOwnershipRecord[] {
    return loadStore().ownershipRecords;
  },

  getRelationships(): AdminRelationshipRecord[] {
    return loadStore().relationships;
  },

  getMentorships(): AdminMentorshipRecord[] {
    return loadStore().mentorships;
  },

  getEndorsements(): AdminEndorsementRecord[] {
    return loadStore().endorsements;
  },

  getFinanceSummary(): AdminFinanceSummary {
    return loadStore().financeSummary;
  },

  getSubscriptions(): AdminSubscription[] {
    return loadStore().subscriptions;
  },

  getEntitlements(): AdminEntitlementRecord[] {
    return loadStore().entitlements;
  },

  getPayments(): AdminPaymentTransaction[] {
    return loadStore().payments;
  },

  getFeatureFlags(): AdminFeatureFlag[] {
    return loadStore().featureFlags;
  },

  getSystemHealth(): AdminSystemHealthService[] {
    return loadStore().systemHealth;
  },

  // Actions
  suspendPersonalAccount(userId: string, reason: string): boolean {
    const store = loadStore();
    const acc = store.personalAccounts.find((a) => a.id === userId);
    if (!acc) return false;
    const prev = acc.accountStatus;
    acc.accountStatus = 'Suspended';
    saveStore(store);
    logAdminAudit('PERSONAL_ACCOUNT_SUSPENDED', 'Personal Accounts', `Suspended ${acc.name}. Reason: ${reason}`, userId, prev, 'Suspended');
    return true;
  },

  restorePersonalAccount(userId: string): boolean {
    const store = loadStore();
    const acc = store.personalAccounts.find((a) => a.id === userId);
    if (!acc) return false;
    const prev = acc.accountStatus;
    acc.accountStatus = 'Active';
    saveStore(store);
    logAdminAudit('PERSONAL_ACCOUNT_RESTORED', 'Personal Accounts', `Restored ${acc.name} to active status`, userId, prev, 'Active');
    return true;
  },

  updateVerificationStatus(caseId: string, status: AdminVerificationCase['status'], note?: string): { success: boolean; error?: string } {
    const store = loadStore();
    const vc = store.verificationCases.find((c) => c.id === caseId);
    if (!vc) return { success: false, error: 'Verification case not found' };

    const session = getAdminSession();
    // Enforce restricted identity review gate
    if (vc.subjectType === 'Personal Identity') {
      if (!hasAdminPermission(session, 'identity_verification.review')) {
        return {
          success: false,
          error: 'Access Denied: identity_verification.review permission is required to review Personal Identity documents.',
        };
      }
    }

    const prev = vc.status;
    vc.status = status;
    vc.reviewer = session?.name || 'Authorized Admin';
    if (note && note.trim()) {
      vc.notes = [...(vc.notes || []), `[${new Date().toISOString().slice(0, 10)}] ${note}`];
    }
    saveStore(store);
    logAdminAudit('VERIFICATION_STATUS_UPDATED', 'Verification Centre', `Updated ${vc.subjectName} (${vc.subjectType}) status to ${status}`, caseId, prev, status);
    return { success: true };
  },

  transferOwnership(entityId: string, newOwnerName: string, newOwnerEmail: string, reason: string): boolean {
    const store = loadStore();
    const own = store.ownershipRecords.find((o) => o.entityId === entityId);
    if (!own) return false;
    const prev = `${own.currentOwnerName} (${own.currentOwnerEmail})`;
    own.currentOwnerName = newOwnerName;
    own.currentOwnerEmail = newOwnerEmail;
    own.assignedDate = new Date().toISOString().slice(0, 10);
    own.disputeStatus = 'Resolved';
    saveStore(store);
    logAdminAudit('OWNERSHIP_TRANSFERRED', 'Access & Trust', `Transferred ownership of ${own.entityName} to ${newOwnerName} (${newOwnerEmail}). Reason: ${reason}`, entityId, prev, `${newOwnerName} (${newOwnerEmail})`);
    return true;
  },

  revokeMembership(membershipId: string, reason: string): boolean {
    const store = loadStore();
    const mb = store.memberships.find((m) => m.id === membershipId);
    if (!mb) return false;
    const prev = mb.status;
    mb.status = 'Revoked';
    saveStore(store);
    logAdminAudit('MEMBERSHIP_REVOKED', 'Entity Memberships', `Revoked ${mb.personName} membership from ${mb.entityName}. Reason: ${reason}`, membershipId, prev, 'Revoked');
    return true;
  },

  approveEndorsement(endorsementId: string): boolean {
    const store = loadStore();
    const end = store.endorsements.find((e) => e.id === endorsementId);
    if (!end) return false;
    const prev = end.status;
    end.status = 'Active';
    end.entitlementGranted = true;
    const session = getAdminSession();
    end.reviewedBy = session?.name || 'Operations Admin';
    saveStore(store);
    logAdminAudit('ENDORSEMENT_APPROVED', 'ESP Endorsements', `Approved ${end.espName} endorsement for ${end.startupName} (${end.programCohort})`, endorsementId, prev, 'Active');
    return true;
  },

  toggleFeatureFlag(flagId: string): boolean {
    const store = loadStore();
    const ff = store.featureFlags.find((f) => f.id === flagId);
    if (!ff) return false;
    const prev = ff.isEnabled;
    ff.isEnabled = !ff.isEnabled;
    const session = getAdminSession();
    ff.updatedBy = session?.name || 'Platform Administrator';
    ff.updatedAt = new Date().toISOString().slice(0, 10);
    saveStore(store);
    logAdminAudit('FEATURE_FLAG_TOGGLED', 'System Governance', `Toggled flag ${ff.name} (${ff.key}) to ${ff.isEnabled ? 'ENABLED' : 'DISABLED'}`, flagId, String(prev), String(ff.isEnabled));
    return true;
  },
};
