'use client';

import {
  StartupEntityRole,
  StartupPermission,
  StartupEntityMember,
  StartupInvitation,
  StartupVerificationRecord,
  StartupESPEndorsementItem,
  StartupEntitlement,
  StartupSubscription,
  StartupBillingAccount,
  StartupPaymentMethodRef,
  StartupInvoice,
  StartupPayment,
  StartupSubscriptionPlan,
} from '@/types/startup';

// =========================================================================
// STORAGE KEYS
// =========================================================================

const STORAGE_KEYS = {
  MEMBERS: 'xentro_startup_members_v1',
  INVITATIONS: 'xentro_startup_invitations_v1',
  VERIFICATION: 'xentro_startup_verification_v1',
  ENDORSEMENTS: 'xentro_startup_endorsements_v1',
  SUBSCRIPTION: 'xentro_startup_subscription_v1',
  BILLING_ACCOUNT: 'xentro_startup_billing_account_v1',
  PAYMENT_METHODS: 'xentro_startup_payment_methods_v1',
  INVOICES: 'xentro_startup_invoices_v1',
  PAYMENTS: 'xentro_startup_payments_v1',
  FAILED_PAYMENT_SIM: 'xentro_startup_failed_payment_sim',
};

// =========================================================================
// INITIAL MOCK DATASETS
// =========================================================================

export const initialStartupMembers: StartupEntityMember[] = [];

export const initialStartupInvitations: StartupInvitation[] = [];

/**
 * New accounts start UNVERIFIED. Nothing is pre-approved and no third-party
 * identifiers (CIN / DPIIT / UDYAM / DigiLocker tokens) are fabricated.
 * Verification only ever reflects what the user actually submitted.
 */
export const initialStartupVerification: StartupVerificationRecord = {
  overallStatus: 'Not Submitted',
  founderIdentityVerified: false,
  publicBadgeTitle: '',
  lastAuditDate: undefined,
  items: [],
};

/** New startup accounts have no pre-granted institutional endorsements. */
export const initialStartupEndorsements: StartupESPEndorsementItem[] = [];

export const initialStartupSubscriptionPlans: StartupSubscriptionPlan[] = [
  {
    id: 'plan_free',
    name: 'Startup Free',
    priceMonthly: 0,
    priceAnnual: 0,
    currency: 'INR',
    description: 'Basic presence on the Xentro ecosystem for early bootstrapping ventures.',
    features: [
      'Basic Public Startup Profile',
      'Receive Inbound Investor & Mentor Messages',
      'Browse Opportunities & Grants Directory',
      'Community Feed Posting',
    ],
  },
  {
    id: 'plan_pro',
    name: 'Startup Pro',
    priceMonthly: 450,
    priceAnnual: 4500, // 2 months free
    currency: 'INR',
    description: 'Complete fundraising & growth suite for high-trajectory startups.',
    recommended: true,
    features: [
      'Everything in Free',
      'Verified Founder Identity Badge',
      '7-Folder Virtual DD Locker (10GB Secure Storage)',
      'Direct Investor Introductions & Pitch Deck Analytics',
      'Structured Mentorship Request & Milestone Tracking',
      'Priority Matching in Search, Explore & Recommendations',
      'Audit Log & Due Diligence Access Approvals',
    ],
  },
  {
    id: 'plan_growth',
    name: 'Startup Growth',
    priceMonthly: 1200,
    priceAnnual: 12000,
    currency: 'INR',
    description: 'Advanced institutional syndicate distribution & dedicated advisory access.',
    features: [
      'Everything in Pro',
      'Unlimited DD Locker Storage (50GB+)',
      'Institutional Syndicate Co-Investment Broadcast',
      'Multi-Entity Management (Up to 3 Ventures)',
      'Dedicated Venture Success Partner',
      'Quarterly Financial Model Distribution to 200+ VCs',
    ],
  },
];

/**
 * New accounts start on the free tier with no payment method and no
 * fabricated invoices. Paid plans exist in `initialStartupSubscriptionPlans`
 * and are only applied after the user actually (simulated-)subscribes.
 */
export const initialStartupSubscription: StartupSubscription = {
  planId: 'plan_free',
  planName: 'Startup Free',
  billingCycle: 'Monthly',
  status: 'Active',
  amount: 0,
  currency: 'INR',
  startDate: '',
  renewalDate: '',
  expirationDate: '',
  autoRenew: false,
  entitlementSource: 'Complimentary Access',
};

/** Billing profile is empty until the user enters it (no fabricated GSTIN / card). */
export const initialStartupBillingAccount: StartupBillingAccount = {
  legalBillingName: '',
  billingAddress: '',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  gstin: '',
  billingEmail: '',
  financeContact: '',
};

/** No payment methods are stored for a new account. */
export const initialStartupPaymentMethods: StartupPaymentMethodRef[] = [];

/** Invoice history starts empty — nothing is shown as "paid" that never happened. */
export const initialStartupInvoices: StartupInvoice[] = [];

/** Payment history starts empty. */
export const initialStartupPayments: StartupPayment[] = [];

// =========================================================================
// 1. RBAC & PERMISSION SPECIFICATION (Sections 10, 11, 12, 35)
// =========================================================================

export const STARTUP_ROLES: StartupEntityRole[] = [
  'Owner / Founder',
  'Admin',
  'Finance',
  'Operations',
  'Team Member',
  'Advisor',
  'Viewer',
];

export const STARTUP_ROLE_DESCRIPTIONS: Record<StartupEntityRole, string> = {
  'Owner / Founder': 'Highest entity authority. Full control over entity, members, billing, verification, and ownership transfer.',
  'Admin': 'Administrative manager with broad permissions to edit profile, manage documents, content, and team members.',
  'Finance': 'Manages startup financial performance, cash runway, funding rounds, and Xentro billing/payments.',
  'Operations': 'Coordinates accelerator applications, opportunities, facility requests, and partnership pipelines.',
  'Team Member': 'Standard contributor with access to update pitch items, draft content, and view DD locker assets.',
  'Advisor': 'External mentor or board advisor with read-only access to strategic financials, DD locker, and analytics.',
  'Viewer': 'Read-only stakeholder with basic profile and public assets access.',
};

/**
 * Checks whether an entity role has a specific granular permission
 */
export function hasStartupPermission(role: StartupEntityRole, permission: StartupPermission): boolean {
  // Owner/Founder has absolute authority across all permissions
  if (role === 'Owner / Founder') return true;

  switch (permission) {
    case 'view_entity':
      return true;

    case 'edit_entity':
    case 'manage_entity_settings':
      return role === 'Admin';

    case 'archive_entity':
    case 'transfer_ownership':
      return false; // Only Owner / Founder can perform these, already handled above

    case 'invite_members':
    case 'manage_roles':
    case 'manage_permissions':
      return role === 'Admin';

    case 'remove_members':
      return role === 'Admin';

    case 'edit_profile':
    case 'publish_profile':
    case 'change_visibility':
      return role === 'Admin' || role === 'Operations';

    case 'view_financials':
      return role === 'Admin' || role === 'Finance' || role === 'Advisor';

    case 'edit_financials':
      return role === 'Admin' || role === 'Finance';

    case 'manage_billing':
      // Section 35: Owner has full, Finance has access, Admin if granted
      return role === 'Admin' || role === 'Finance';

    case 'upload_documents':
    case 'share_documents':
      return role === 'Admin' || role === 'Finance' || role === 'Operations' || role === 'Team Member';

    case 'view_documents':
      return true;

    case 'delete_documents':
      return role === 'Admin' || role === 'Finance';

    case 'create_content':
    case 'edit_content':
    case 'publish_content':
      return role === 'Admin' || role === 'Operations' || role === 'Team Member';

    case 'manage_applications':
      return role === 'Admin' || role === 'Operations' || role === 'Team Member';

    case 'view_analytics':
    case 'export_analytics':
      return role === 'Admin' || role === 'Finance' || role === 'Advisor' || role === 'Operations';

    default:
      return false;
  }
}

// =========================================================================
// 2. ENTITLEMENT RESOLUTION ENGINE (Sections 27 & 37)
// =========================================================================

/**
 * Resolves feature access derived from Entitlement resolution.
 * Rule: Do NOT represent ESP-sponsored access as a ₹0 paid subscription.
 * Rule: If direct subscription is cancelled but an active ESP endorsement exists, KEEP feature access!
 */
export function resolveStartupEntitlements(): StartupEntitlement {
  const endorsements = getStartupEndorsements();
  const sub = getStartupSubscription();
  const activeEndorsement = endorsements.find((e) => e.status === 'Active' && e.entitlementGranted);

  // Case B: ESP Endorsement active
  if (activeEndorsement) {
    return {
      planTier: 'Startup Pro',
      source: 'ESP Endorsement',
      status: 'Active',
      validUntil: activeEndorsement.endDate || '31 March 2027',
      directPaymentRequired: false,
      sponsoringEntityName: activeEndorsement.espName,
      featuresGranted: [
        'Verified Institutional Endorsement Badge',
        'Full 7-Folder Virtual DD Locker (10GB)',
        'Direct Investor Matching & Intro Engine',
        'Structured Mentorship Requests & Milestone Tracking',
        'Priority Ecosystem Placement in Search & Explore',
        'Zero Direct Payment Required (Sponsored Access)',
      ],
    };
  }

  // Case A: Direct Paid Subscription
  if (sub.status === 'Active') {
    return {
      planTier: sub.planName as 'Startup Free' | 'Startup Pro' | 'Startup Growth',
      source: sub.entitlementSource || 'Paid Subscription',
      status: 'Active',
      validUntil: sub.expirationDate || '31 March 2027',
      directPaymentRequired: true,
      featuresGranted: [
        'Full 7-Folder Virtual DD Locker (10GB)',
        'Direct Investor Matching & Intro Engine',
        'Structured Mentorship Requests & Milestone Tracking',
        'Priority Ecosystem Placement in Search & Explore',
      ],
    };
  }

  // Default Free Tier
  return {
    planTier: 'Startup Free',
    source: 'Complimentary Access',
    status: 'Active',
    validUntil: 'Lifetime',
    directPaymentRequired: false,
    featuresGranted: [
      'Basic Public Profile',
      'Inbound Messages',
      'Opportunity Directory',
    ],
  };
}

// =========================================================================
// 3. MEMBERSHIP & OWNERSHIP MANAGEMENT (Sections 10, 11, 12)
// =========================================================================

export function getStartupMembers(): StartupEntityMember[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  let activeName = 'Founder';
  let activeEmail = 'founder@xentro.ai';
  try {
    const storedProf = localStorage.getItem('xentro_user_profile') || sessionStorage.getItem('xentro_user_profile');
    if (storedProf) {
      const p = JSON.parse(storedProf);
      if (p.name) activeName = p.name;
      if (p.email) activeEmail = p.email;
    }
  } catch {}

  return [
    {
      id: 'mem_1',
      userId: 'usr_founder',
      name: activeName,
      email: activeEmail,
      role: 'Owner / Founder',
      title: 'Founder & CEO',
      avatar: '/images/profile_avatar.webp',
      joinedDate: 'Just now',
      status: 'Active',
      isOwner: true,
      personalAccountVerified: true,
    }
  ];
}

export const getStartupEntityMembers = getStartupMembers;

export function saveStartupMembers(members: StartupEntityMember[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    window.dispatchEvent(new CustomEvent('xentro-startup-members-changed', { detail: { members } }));
  } catch (err) {
    console.error('Failed to save members:', err);
  }
}

export function getStartupInvitations(): StartupInvitation[] {
  if (typeof window === 'undefined') return initialStartupInvitations;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    return raw ? JSON.parse(raw) : initialStartupInvitations;
  } catch {
    return initialStartupInvitations;
  }
}

export function inviteStartupMember(email: string, role: StartupEntityRole, invitedBy: string): StartupInvitation {
  const current = getStartupInvitations();
  const newInvite: StartupInvitation = {
    id: `inv_${Date.now()}`,
    email,
    role,
    invitedBy,
    invitedAt: 'Just now',
    expiresAt: 'In 7 days',
    status: 'Pending',
  };
  const updated = [newInvite, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('xentro-startup-members-changed'));
  }
  return newInvite;
}

export function updateMemberRole(memberId: string, newRole: StartupEntityRole): void {
  const members = getStartupMembers();
  const updated = members.map((m) => {
    if (m.id === memberId) {
      // Cannot downgrade owner directly without transfer
      if (m.isOwner && newRole !== 'Owner / Founder') {
        throw new Error('The final Owner cannot be demoted. Use Transfer Ownership.');
      }
      return { ...m, role: newRole };
    }
    return m;
  });
  saveStartupMembers(updated);
}

export function removeStartupMember(memberId: string): void {
  const members = getStartupMembers();
  const target = members.find((m) => m.id === memberId);
  if (target?.isOwner) {
    throw new Error('The final Owner cannot leave or be removed without transferring ownership first.');
  }
  const filtered = members.filter((m) => m.id !== memberId);
  saveStartupMembers(filtered);
}

/**
 * Section 12: Ownership Transfer
 * Final Owner cannot leave without transferring ownership to another verified member.
 */
export function transferStartupOwnership(
  currentOwnerId: string,
  newOwnerId: string,
  retainCurrentOwnerRole: StartupEntityRole = 'Admin'
): { success: boolean; message: string } {
  const members = getStartupMembers();
  const currentOwner = members.find((m) => m.id === currentOwnerId);
  const newOwner = members.find((m) => m.id === newOwnerId);

  if (!currentOwner || !currentOwner.isOwner) {
    return { success: false, message: 'Action not authorized. Only the current verified Owner can transfer ownership.' };
  }
  if (!newOwner) {
    return { success: false, message: 'Selected successor member not found.' };
  }
  if (!newOwner.personalAccountVerified) {
    return { success: false, message: 'Successor must have a verified personal Xentro account before accepting ownership.' };
  }

  const updated = members.map((m) => {
    if (m.id === currentOwnerId) {
      return {
        ...m,
        isOwner: false,
        role: retainCurrentOwnerRole,
        title: `${m.title} (Former Owner)`,
      };
    }
    if (m.id === newOwnerId) {
      return {
        ...m,
        isOwner: true,
        role: 'Owner / Founder' as const,
        title: `${m.title} (Primary Entity Owner)`,
      };
    }
    return m;
  });

  saveStartupMembers(updated);
  return { success: true, message: `Entity ownership successfully transferred to ${newOwner.name}.` };
}

// =========================================================================
// 4. ESP ENDORSEMENT WORKFLOW (Sections 25 & 26)
// =========================================================================

export function getStartupEndorsements(): StartupESPEndorsementItem[] {
  if (typeof window === 'undefined') return initialStartupEndorsements;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENDORSEMENTS);
    return raw ? JSON.parse(raw) : initialStartupEndorsements;
  } catch {
    return initialStartupEndorsements;
  }
}

export function saveStartupEndorsements(endorsements: StartupESPEndorsementItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.ENDORSEMENTS, JSON.stringify(endorsements));
    window.dispatchEvent(new CustomEvent('xentro-startup-endorsements-changed', { detail: { endorsements } }));
  } catch (err) {
    console.error('Failed to save endorsements:', err);
  }
}

export function acceptESPEndorsement(endorsementId: string): void {
  const endorsements = getStartupEndorsements();
  const updated = endorsements.map((e) => {
    if (e.id === endorsementId) {
      return {
        ...e,
        status: 'Active' as const,
        startDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        endDate: '31 Mar 2027',
        entitlementGranted: true,
      };
    }
    return e;
  });
  saveStartupEndorsements(updated);
}

export function declineESPEndorsement(endorsementId: string, reason?: string): void {
  const endorsements = getStartupEndorsements();
  const updated = endorsements.map((e) => {
    if (e.id === endorsementId) {
      return {
        ...e,
        status: 'Declined' as const,
        notes: reason ? `Declined by startup: ${reason}` : 'Declined by startup.',
      };
    }
    return e;
  });
  saveStartupEndorsements(updated);
}

// =========================================================================
// 5. STARTUP VERIFICATION (Section 24)
// =========================================================================

export function getStartupVerification(): StartupVerificationRecord {
  if (typeof window === 'undefined') return initialStartupVerification;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VERIFICATION);
    return raw ? JSON.parse(raw) : initialStartupVerification;
  } catch {
    return initialStartupVerification;
  }
}

export const getStartupVerificationStatus = getStartupVerification;

export function saveStartupVerification(record: StartupVerificationRecord): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.VERIFICATION, JSON.stringify(record));
    window.dispatchEvent(new CustomEvent('xentro-startup-verification-changed', { detail: { record } }));
  } catch (err) {
    console.error('Failed to save verification:', err);
  }
}

// =========================================================================
// 6. BILLING & PAYMENTS SYSTEM (Sections 28 to 36)
// =========================================================================

export function getStartupSubscription(): StartupSubscription {
  if (typeof window === 'undefined') return initialStartupSubscription;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
    return raw ? JSON.parse(raw) : initialStartupSubscription;
  } catch {
    return initialStartupSubscription;
  }
}

export function saveStartupSubscription(sub: StartupSubscription): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(sub));
    window.dispatchEvent(new CustomEvent('xentro-startup-billing-changed', { detail: { subscription: sub } }));
  } catch (err) {
    console.error('Failed to save subscription:', err);
  }
}

export function getStartupBillingAccount(): StartupBillingAccount {
  if (typeof window === 'undefined') return initialStartupBillingAccount;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BILLING_ACCOUNT);
    return raw ? JSON.parse(raw) : initialStartupBillingAccount;
  } catch {
    return initialStartupBillingAccount;
  }
}

export function saveStartupBillingAccount(account: StartupBillingAccount): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.BILLING_ACCOUNT, JSON.stringify(account));
    window.dispatchEvent(new CustomEvent('xentro-startup-billing-changed', { detail: { account } }));
  } catch (err) {
    console.error('Failed to save billing account:', err);
  }
}

export function getStartupPaymentMethods(): StartupPaymentMethodRef[] {
  if (typeof window === 'undefined') return initialStartupPaymentMethods;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENT_METHODS);
    return raw ? JSON.parse(raw) : initialStartupPaymentMethods;
  } catch {
    return initialStartupPaymentMethods;
  }
}

export function saveStartupPaymentMethods(methods: StartupPaymentMethodRef[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.PAYMENT_METHODS, JSON.stringify(methods));
    window.dispatchEvent(new CustomEvent('xentro-startup-billing-changed'));
  } catch (err) {
    console.error('Failed to save payment methods:', err);
  }
}

export function addStartupPaymentMethod(
  method: Omit<StartupPaymentMethodRef, 'id' | 'addedAt'>
): StartupPaymentMethodRef {
  const methods = getStartupPaymentMethods();
  const created: StartupPaymentMethodRef = {
    ...method,
    id: `pm_${Date.now()}`,
    addedAt: 'Just now',
  };
  // If set to default, unset others
  const updated = method.isDefault
    ? [created, ...methods.map((m) => ({ ...m, isDefault: false }))]
    : [created, ...methods];
  saveStartupPaymentMethods(updated);
  return created;
}

export function removeStartupPaymentMethod(methodId: string): void {
  const methods = getStartupPaymentMethods();
  const filtered = methods.filter((m) => m.id !== methodId);
  saveStartupPaymentMethods(filtered);
}

export function setDefaultPaymentMethod(methodId: string): void {
  const methods = getStartupPaymentMethods();
  const updated = methods.map((m) => ({
    ...m,
    isDefault: m.id === methodId,
  }));
  saveStartupPaymentMethods(updated);
}

export function getStartupInvoices(): StartupInvoice[] {
  if (typeof window === 'undefined') return initialStartupInvoices;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.INVOICES);
    return raw ? JSON.parse(raw) : initialStartupInvoices;
  } catch {
    return initialStartupInvoices;
  }
}

export function getStartupPayments(): StartupPayment[] {
  if (typeof window === 'undefined') return initialStartupPayments;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
    return raw ? JSON.parse(raw) : initialStartupPayments;
  } catch {
    return initialStartupPayments;
  }
}

export function getFailedPaymentSimulation(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.FAILED_PAYMENT_SIM) === 'true';
}

export function setFailedPaymentSimulation(isFailed: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.FAILED_PAYMENT_SIM, String(isFailed));
  window.dispatchEvent(new CustomEvent('xentro-startup-billing-changed'));
}

export function retryStartupPayment(): boolean {
  // Clear simulated failure
  setFailedPaymentSimulation(false);
  const sub = getStartupSubscription();
  saveStartupSubscription({ ...sub, status: 'Active' });
  return true;
}

// =========================================================================
// PITCH DECK SERVICE ABSTRACTIONS
// =========================================================================
export {
  getStartupPitchDeck,
  setStartupPitchDeck,
  uploadStartupPitchDeck,
  replaceStartupPitchDeck,
  updateStartupPitchDeckMetadata,
  removeStartupPitchDeck,
  getStartupProblem,
  setStartupProblem,
  getStartupSolution,
  setStartupSolution,
  getStartupProduct,
  setStartupProduct,
  getStartupCompanyInfo,
  setStartupCompanyInfo,
  getStartupMarket,
  setStartupMarket,
  getStartupBusinessModel,
  setStartupBusinessModel,
  getStartupBasicInfo,
  setStartupBasicInfo,
  defaultStartupBasicInfo,
  type StartupBasicInfo,
} from './startupProfileState';

