'use client';

import {
  InvestorAccountType,
  InvestorVisibility,
  InvestorVerificationBadge,
  InvestorEntityRole,
  InvestorPermission,
  InvestorEntityMember,
  InvestorInvitation,
  InvestorDealStage,
  InvestorDeal,
  InvestorDealNote,
  InvestorDealTermSheet,
  InvestorDDStatus,
  InvestorDDDocument,
  InvestorMeeting,
  InvestorPlanTier,
  InvestorSubscription,
  InvestorBillingAccount,
  InvestorInvoice,
  FullInvestorProfile,
} from '@/types/investor';
import { investorProfilesMap } from '@/data/investorProfilesData';
import { getUserProfile } from '@/lib/userProfile';

// =========================================================================
// STORAGE KEYS & CONSTANTS
// =========================================================================

const STORAGE_KEYS = {
  ACCOUNT_TYPE: 'xentro_investor_account_type_v1',
  SETTINGS: 'xentro_investor_settings_v1',
  MEMBERS: 'xentro_investor_members_v1',
  INVITATIONS: 'xentro_investor_invitations_v1',
  DEALS: 'xentro_investor_deals_v1',
  DILIGENCE_DOCS: 'xentro_investor_diligence_docs_v1',
  MEETINGS: 'xentro_investor_meetings_v1',
  PORTFOLIO: 'xentro_investor_portfolio_v1',
  SUBSCRIPTION: 'xentro_investor_subscription_v1',
  BILLING_ACCOUNT: 'xentro_investor_billing_account_v1',
  INVOICES: 'xentro_investor_invoices_v1',
};

// =========================================================================
// 9-ROLE RBAC PERMISSION MATRIX
// =========================================================================

export const ROLE_PERMISSIONS: Record<InvestorEntityRole, InvestorPermission[]> = {
  'Owner/Managing Partner': [
    'manage_organization',
    'manage_team',
    'manage_billing',
    'view_deal_flow',
    'edit_deal_flow',
    'create_investment_decision',
    'view_portfolio',
    'edit_portfolio',
    'access_diligence_vault',
    'request_diligence',
    'schedule_meetings',
    'publish_content',
    'export_data',
  ],
  Admin: [
    'manage_organization',
    'manage_team',
    'manage_billing',
    'view_deal_flow',
    'edit_deal_flow',
    'create_investment_decision',
    'view_portfolio',
    'edit_portfolio',
    'access_diligence_vault',
    'request_diligence',
    'schedule_meetings',
    'publish_content',
    'export_data',
  ],
  Partner: [
    'view_deal_flow',
    'edit_deal_flow',
    'create_investment_decision',
    'view_portfolio',
    'edit_portfolio',
    'access_diligence_vault',
    'request_diligence',
    'schedule_meetings',
    'publish_content',
    'export_data',
  ],
  Principal: [
    'view_deal_flow',
    'edit_deal_flow',
    'view_portfolio',
    'edit_portfolio',
    'access_diligence_vault',
    'request_diligence',
    'schedule_meetings',
    'publish_content',
  ],
  Associate: [
    'view_deal_flow',
    'edit_deal_flow',
    'view_portfolio',
    'access_diligence_vault',
    'request_diligence',
    'schedule_meetings',
  ],
  Analyst: [
    'view_deal_flow',
    'view_portfolio',
    'request_diligence',
    'schedule_meetings',
  ],
  'Portfolio Manager': [
    'view_portfolio',
    'edit_portfolio',
    'view_deal_flow',
    'export_data',
  ],
  'Finance/Operations': [
    'manage_billing',
    'view_portfolio',
    'export_data',
  ],
  Viewer: [
    'view_deal_flow',
    'view_portfolio',
  ],
};

export function hasInvestorPermission(role: InvestorEntityRole, permission: InvestorPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

// =========================================================================
// INITIAL MOCK DATASETS
// =========================================================================

export const initialInvestorMembers: InvestorEntityMember[] = [];

export const initialInvestorInvitations: InvestorInvitation[] = [];

export const initialInvestorDeals: InvestorDeal[] = [];

export const initialDiligenceDocs: InvestorDDDocument[] = [];
export const initialInvestorMeetings: InvestorMeeting[] = [];

export const initialInvestorSubscription: InvestorSubscription = {
  tier: 'starter',
  status: 'active',
  currentPeriodEnd: '2026-12-31T23:59:59Z',
  cancelAtPeriodEnd: false,
  seatsIncluded: 1,
  seatsUsed: 1,
  dealFlowLimit: 10,
  dueDiligenceExportsLimit: 5,
  monthlyPrice: 0,
  currency: 'INR',
};

export const initialInvestorBillingAccount: InvestorBillingAccount = {
  organizationName: '',
  billingEmail: '',
  gstin: '',
  pan: '',
  taxExempt: false,
  billingAddress: {
    line1: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  },
  defaultPaymentMethod: {
    type: 'card',
    last4: '',
    brand: '',
    expiry: '',
  },
};

export const initialInvestorInvoices: InvestorInvoice[] = [];

// =========================================================================
// INVESTOR DOMAIN SERVICE IMPLEMENTATION
// =========================================================================

class InvestorDomainService {
  // --- Account Type (Dual Architecture) ---
  getAccountType(): InvestorAccountType {
    if (typeof window === 'undefined') return 'individual';
    const stored = localStorage.getItem(STORAGE_KEYS.ACCOUNT_TYPE);
    return (stored as InvestorAccountType) || 'individual';
  }

  setAccountType(type: InvestorAccountType): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_TYPE, type);
    window.dispatchEvent(new CustomEvent('xentro-investor-account-changed', { detail: { type } }));
  }

  // --- Settings & Visibility ---
  getSettings() {
    if (typeof window === 'undefined') {
      return {
        visibility: 'public' as InvestorVisibility,
        openToPitches: true,
        openToConnections: true,
        warmIntroPreferred: false,
        chequeMin: '$100k',
        chequeMax: '$1.5M',
        preferredSectors: ['Enterprise AI', 'SaaS', 'FinTech', 'DeepTech'],
        preferredStages: ['Pre-Seed', 'Seed', 'Series A'],
      };
    }
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        // fallback
      }
    }
    return {
      visibility: 'public' as InvestorVisibility,
      openToPitches: true,
      openToConnections: true,
      warmIntroPreferred: false,
      chequeMin: '$100k',
      chequeMax: '$1.5M',
      preferredSectors: ['Enterprise AI', 'SaaS', 'FinTech', 'DeepTech'],
      preferredStages: ['Pre-Seed', 'Seed', 'Series A'],
    };
  }

  updateSettings(settings: any) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('xentro-investor-settings-changed', { detail: { settings } }));
  }

  // --- Team & Members (Organization) ---
  getMembers(): InvestorEntityMember[] {
    if (typeof window === 'undefined') return initialInvestorMembers;
    const stored = localStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!stored) {
      return initialInvestorMembers;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((m: any) => m.id?.startsWith('inv_mem_') || m.email?.includes('apexventures.vc'))) {
        localStorage.removeItem(STORAGE_KEYS.MEMBERS);
        return [];
      }
      return parsed;
    } catch {
      return initialInvestorMembers;
    }
  }

  updateMemberRole(memberId: string, newRole: InvestorEntityRole): InvestorEntityMember[] {
    const members = this.getMembers();
    const updated = members.map((m) => {
      if (m.id === memberId) {
        return {
          ...m,
          role: newRole,
          permissions: ROLE_PERMISSIONS[newRole] || [],
        };
      }
      return m;
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-team-changed', { detail: { members: updated } }));
    }
    return updated;
  }

  removeMember(memberId: string): InvestorEntityMember[] {
    const members = this.getMembers();
    const updated = members.filter((m) => m.id !== memberId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-team-changed', { detail: { members: updated } }));
    }
    return updated;
  }

  // --- Invitations ---
  getInvitations(): InvestorInvitation[] {
    if (typeof window === 'undefined') return initialInvestorInvitations;
    const stored = localStorage.getItem(STORAGE_KEYS.INVITATIONS);
    if (!stored) {
      return initialInvestorInvitations;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((inv: any) => inv.id === 'inv_inv_1' || inv.email?.includes('rohit@'))) {
        localStorage.removeItem(STORAGE_KEYS.INVITATIONS);
        return [];
      }
      return parsed;
    } catch {
      return initialInvestorInvitations;
    }
  }

  sendInvitation(email: string, role: InvestorEntityRole, title: string): InvestorInvitation {
    const invitations = this.getInvitations();
    const currentProfileStr = typeof window !== 'undefined' ? localStorage.getItem('xentro_user_profile') : null;
    let senderName = 'Managing Partner';
    let activeOrgId = 'org_fund';
    if (currentProfileStr) {
      try {
        const parsed = JSON.parse(currentProfileStr);
        if (parsed.name) senderName = parsed.name;
      } catch (_) {}
    }
    const activeCtxStr = typeof window !== 'undefined' ? localStorage.getItem('xentro_active_investor_context_v1') : null;
    if (activeCtxStr) {
      try {
        const parsed = JSON.parse(activeCtxStr);
        if (parsed.organizationId) activeOrgId = parsed.organizationId;
      } catch (_) {}
    }
    const newInv: InvestorInvitation = {
      id: `inv_inv_${Date.now()}`,
      organizationId: activeOrgId,
      email,
      role,
      title,
      invitedBy: senderName,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'pending',
    };
    const updated = [newInv, ...invitations];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-invitations-changed', { detail: { invitations: updated } }));
    }
    return newInv;
  }

  revokeInvitation(id: string): void {
    const invitations = this.getInvitations();
    const updated = invitations.filter((inv) => inv.id !== id);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.INVITATIONS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-invitations-changed', { detail: { invitations: updated } }));
    }
  }

  // --- Deal Flow CRM ---
  getDeals(): InvestorDeal[] {
    if (typeof window === 'undefined') return initialInvestorDeals;
    const stored = localStorage.getItem(STORAGE_KEYS.DEALS);
    if (!stored) {
      return initialInvestorDeals;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((d: any) => d.id === 'deal_1' || d.startupId === 'st_1' || d.startupName === 'Kinetix AI')) {
        localStorage.removeItem(STORAGE_KEYS.DEALS);
        return [];
      }
      return parsed;
    } catch {
      return initialInvestorDeals;
    }
  }

  addDeal(deal: Partial<InvestorDeal> & { startupId: string; startupName: string }): InvestorDeal[] {
    const deals = this.getDeals();
    const existing = deals.find((d) => d.startupId === deal.startupId);
    if (existing) {
      return deals;
    }

    const newDeal: InvestorDeal = {
      id: deal.id || `deal_${Date.now()}`,
      startupId: deal.startupId,
      startupName: deal.startupName,
      startupLogo:
        deal.startupLogo ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
      founderName: deal.founderName || 'Founding Team',
      founderEmail:
        deal.founderEmail || `founder@${deal.startupName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      sector: deal.sector || 'Enterprise AI',
      stage: deal.stage || 'Seed',
      pitchSummary:
        deal.pitchSummary ||
        'High-conviction venture discovered and bookmarked from Xentro Universal Ecosystem.',
      fundingAsk: deal.fundingAsk || '$1.2M',
      valuation: deal.valuation || '$8M Pre-money',
      tractionMRR: deal.tractionMRR || '$28k MRR',
      dealStage: deal.dealStage || 'reviewed',
      assignedMemberId: deal.assignedMemberId || 'current_user',
      assignedMemberName: deal.assignedMemberName || (typeof window !== 'undefined' ? getUserProfile().name || 'Managing Partner' : 'Managing Partner'),
      pitchDate: deal.pitchDate || new Date().toISOString().split('T')[0],
      lastActivityDate: new Date().toISOString().split('T')[0],
      matchScore: deal.matchScore || 92,
      tags: deal.tags || ['Ecosystem Sourced', 'High Match'],
      diligenceVaultUnlocked: true,
      notes: deal.notes || [
        {
          id: `note_${Date.now()}`,
          authorId: 'current_user',
          authorName: typeof window !== 'undefined' ? getUserProfile().name || 'Investor' : 'Investor',
          text: 'Added from Universal Discovery & Bookmarks. Automatically initialized in Deal Flow pipeline.',
          createdAt: new Date().toISOString().split('T')[0],
          stage: deal.dealStage || 'reviewed',
        },
      ],
    };

    const updated = [newDeal, ...deals];

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent('xentro-investor-deals-changed', { detail: { deals: updated } })
      );
    }

    // Auto-initialize a diligence packet in Diligence Locker if none exists
    const docs = this.getDiligenceDocuments();
    const hasDocs = docs.some((d) => d.startupId === deal.startupId);
    if (!hasDocs) {
      const starterDocs: InvestorDDDocument[] = [
        {
          id: `doc_${Date.now()}_1`,
          startupId: deal.startupId,
          startupName: deal.startupName,
          title: `${deal.startupName} - Investor Pitch Deck & Technical Overview`,
          category: 'Pitch Deck',
          fileType: 'PDF',
          fileSize: '4.8 MB',
          accessStatus: 'granted',
          grantedAt: new Date().toISOString().split('T')[0],
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          watermarked: true,
          downloadUrl: '#',
        },
        {
          id: `doc_${Date.now()}_2`,
          startupId: deal.startupId,
          startupName: deal.startupName,
          title: `${deal.startupName} - Financial Model & Cap Table Waterfall`,
          category: 'Financials',
          fileType: 'XLSX',
          fileSize: '2.2 MB',
          accessStatus: 'granted',
          grantedAt: new Date().toISOString().split('T')[0],
          expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          watermarked: true,
          downloadUrl: '#',
        },
      ];
      const updatedDocs = [...starterDocs, ...docs];
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.DILIGENCE_DOCS, JSON.stringify(updatedDocs));
        window.dispatchEvent(
          new CustomEvent('xentro-investor-diligence-changed', { detail: { docs: updatedDocs } })
        );
      }
    }

    return updated;
  }

  updateDealStage(dealId: string, newStage: InvestorDealStage, noteText?: string): InvestorDeal[] {
    const deals = this.getDeals();
    const updated = deals.map((d) => {
      if (d.id === dealId) {
        const notes = [...(d.notes || [])];
        if (noteText) {
          notes.push({
            id: `note_${Date.now()}`,
            authorId: 'current_user',
            authorName: typeof window !== 'undefined' ? getUserProfile().name || 'Investor' : 'Investor',
            text: noteText,
            createdAt: new Date().toISOString().split('T')[0],
            stage: newStage,
          });
        }
        return {
          ...d,
          dealStage: newStage,
          lastActivityDate: new Date().toISOString().split('T')[0],
          notes,
        };
      }
      return d;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-deals-changed', { detail: { deals: updated } }));
    }
    return updated;
  }

  assignDeal(dealId: string, memberId: string, memberName: string): InvestorDeal[] {
    const deals = this.getDeals();
    const updated = deals.map((d) => {
      if (d.id === dealId) {
        return {
          ...d,
          assignedMemberId: memberId,
          assignedMemberName: memberName,
          lastActivityDate: new Date().toISOString().split('T')[0],
        };
      }
      return d;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-deals-changed', { detail: { deals: updated } }));
    }
    return updated;
  }

  addDealNote(dealId: string, text: string): InvestorDeal[] {
    const deals = this.getDeals();
    const updated = deals.map((d) => {
      if (d.id === dealId) {
        const note: InvestorDealNote = {
          id: `note_${Date.now()}`,
          authorId: 'current_user',
          authorName: typeof window !== 'undefined' ? getUserProfile().name || 'Investor' : 'Investor',
          text,
          createdAt: new Date().toISOString().split('T')[0],
          stage: d.dealStage,
        };
        return {
          ...d,
          notes: [...(d.notes || []), note],
          lastActivityDate: new Date().toISOString().split('T')[0],
        };
      }
      return d;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-deals-changed', { detail: { deals: updated } }));
    }
    return updated;
  }

  updateTermSheet(dealId: string, termSheet: InvestorDealTermSheet): InvestorDeal[] {
    const deals = this.getDeals();
    const updated = deals.map((d) => {
      if (d.id === dealId) {
        return {
          ...d,
          termSheet,
          lastActivityDate: new Date().toISOString().split('T')[0],
        };
      }
      return d;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DEALS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-deals-changed', { detail: { deals: updated } }));
    }
    return updated;
  }

  // --- Diligence Documents ---
  getDiligenceDocuments(): InvestorDDDocument[] {
    if (typeof window === 'undefined') return initialDiligenceDocs;
    const stored = localStorage.getItem(STORAGE_KEYS.DILIGENCE_DOCS);
    if (!stored) {
      return initialDiligenceDocs;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((doc: any) => doc.id === 'doc_1' || doc.startupName === 'Kinetix AI')) {
        localStorage.removeItem(STORAGE_KEYS.DILIGENCE_DOCS);
        return [];
      }
      return parsed;
    } catch {
      return initialDiligenceDocs;
    }
  }

  requestDiligence(startupId: string, startupName: string, category: any): InvestorDDDocument {
    const docs = this.getDiligenceDocuments();
    const newDoc: InvestorDDDocument = {
      id: `doc_${Date.now()}`,
      startupId,
      startupName,
      title: `${startupName} - ${category} Data Room Packet`,
      category,
      fileType: 'PDF',
      fileSize: '3.5 MB',
      accessStatus: 'requested',
      requestedAt: new Date().toISOString().split('T')[0],
      watermarked: true,
    };
    const updated = [newDoc, ...docs];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DILIGENCE_DOCS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-diligence-changed', { detail: { docs: updated } }));
    }
    return newDoc;
  }

  // --- Meetings ---
  getMeetings(): InvestorMeeting[] {
    if (typeof window === 'undefined') return initialInvestorMeetings;
    const stored = localStorage.getItem(STORAGE_KEYS.MEETINGS);
    if (!stored) {
      return initialInvestorMeetings;
    }
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.some((m: any) => m.id === 'meet_1' || m.founderName === 'Vikram Malhotra' || m.startupName === 'Kinetix AI')) {
        localStorage.removeItem(STORAGE_KEYS.MEETINGS);
        return [];
      }
      return parsed;
    } catch {
      return initialInvestorMeetings;
    }
  }

  logMeetingOutcome(meetingId: string, outcomeStage: InvestorDealStage, notes: string): void {
    const meetings = this.getMeetings();
    let affectedDealId: string | undefined;

    const updatedMeetings = meetings.map((m) => {
      if (m.id === meetingId) {
        affectedDealId = m.dealId;
        return {
          ...m,
          status: 'completed' as const,
          notes,
          outcomeStageUpdate: outcomeStage,
        };
      }
      return m;
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(updatedMeetings));
      window.dispatchEvent(new CustomEvent('xentro-investor-meetings-changed', { detail: { meetings: updatedMeetings } }));
    }

    // Automatically transition the associated deal stage in the CRM
    if (affectedDealId) {
      this.updateDealStage(affectedDealId, outcomeStage, `Meeting Completed: ${notes}`);
    }
  }

  scheduleMeeting(meeting: Omit<InvestorMeeting, 'id'>): InvestorMeeting {
    const meetings = this.getMeetings();
    const newMeeting: InvestorMeeting = {
      ...meeting,
      id: `meet_${Date.now()}`,
    };
    const updated = [newMeeting, ...meetings];
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.MEETINGS, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-meetings-changed', { detail: { meetings: updated } }));
    }
    return newMeeting;
  }

  // --- Billing & Subscriptions ---
  getSubscription(): InvestorSubscription {
    if (typeof window === 'undefined') return initialInvestorSubscription;
    const stored = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(initialInvestorSubscription));
      return initialInvestorSubscription;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return initialInvestorSubscription;
    }
  }

  getBillingAccount(): InvestorBillingAccount {
    if (typeof window === 'undefined') return initialInvestorBillingAccount;
    const stored = localStorage.getItem(STORAGE_KEYS.BILLING_ACCOUNT);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.BILLING_ACCOUNT, JSON.stringify(initialInvestorBillingAccount));
      return initialInvestorBillingAccount;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return initialInvestorBillingAccount;
    }
  }

  getInvoices(): InvestorInvoice[] {
    if (typeof window === 'undefined') return initialInvestorInvoices;
    const stored = localStorage.getItem(STORAGE_KEYS.INVOICES);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(initialInvestorInvoices));
      return initialInvestorInvoices;
    }
    try {
      return JSON.parse(stored);
    } catch {
      return initialInvestorInvoices;
    }
  }

  updateSubscriptionTier(tier: InvestorPlanTier): InvestorSubscription {
    const current = this.getSubscription();
    const priceMap: Record<InvestorPlanTier, number> = {
      starter: 0,
      pro: 14999,
      syndicate: 29999,
      institutional: 59999,
    };
    const seatsMap: Record<InvestorPlanTier, number> = {
      starter: 1,
      pro: 10,
      syndicate: 25,
      institutional: 100,
    };

    const updated: InvestorSubscription = {
      ...current,
      tier,
      monthlyPrice: priceMap[tier],
      seatsIncluded: seatsMap[tier],
      status: 'active',
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('xentro-investor-billing-changed', { detail: { subscription: updated } }));
    }
    return updated;
  }
}

export const investorDomainService = new InvestorDomainService();
