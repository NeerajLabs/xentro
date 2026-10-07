import {
  PortfolioCompany,
  InvestorExperienceStats,
  InvestorTestimonial,
  InvestmentFocusConfig,
  ValueBeyondCapitalConfig,
  InvestmentCriteriaConfig,
  InvestmentProcessConfig,
  ConnectionPreferencesConfig,
  InvestorContentItem,
  InvestorActivityItem,
  InvestorDeal,
  InvestorDDDocument,
  InvestorMeeting,
  InvestorSubscription,
  InvestorBillingAccount,
  InvestorInvoice,
  InvestorEntityRole,
  InvestorPermission,
} from './investor';

// =========================================================================
// 1. INVESTOR ORGANIZATION TYPES TAXONOMY
// =========================================================================

export type InvestorOrganizationType =
  | 'VC Firm'
  | 'Venture Capital Fund'
  | 'Micro VC'
  | 'Angel Network'
  | 'Syndicate'
  | 'Family Office'
  | 'Corporate VC'
  | 'Investment Firm'
  | 'Institutional Investor'
  | 'Seed Fund'
  | 'Venture Studio'
  | 'Other';

export const INVESTOR_ORG_TYPES: InvestorOrganizationType[] = [
  'VC Firm',
  'Venture Capital Fund',
  'Micro VC',
  'Angel Network',
  'Syndicate',
  'Family Office',
  'Corporate VC',
  'Investment Firm',
  'Institutional Investor',
  'Seed Fund',
  'Venture Studio',
  'Other',
];

// =========================================================================
// 2. ACTIVE CONTEXT MODEL
// =========================================================================

export type InvestorContextType = 'individual' | 'organization';

export interface ActiveInvestorContext {
  type: InvestorContextType;
  organizationId?: string; // defined when type === 'organization'
}

// =========================================================================
// 3. ORGANIZATION PERMISSIONS & ACCESS CONTROLS
// =========================================================================

export interface InvestorOrgPermissions {
  manageOrganization: boolean;
  manageTeam: boolean;
  manageBilling: boolean;
  viewDealFlow: boolean;
  editDealFlow: boolean;
  createInvestmentDecision: boolean;
  viewPortfolio: boolean;
  editPortfolio: boolean;
  accessDiligenceVault: boolean;
  requestDiligence: boolean;
  scheduleMeetings: boolean;
  publishContent: boolean;
  exportData: boolean;
}

export type ResourceAccessMode = 'all' | 'assigned';

// =========================================================================
// 4. ORGANIZATION MEMBERSHIP
// =========================================================================

export interface InvestorOrgMembership {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  role: InvestorEntityRole;
  title: string;
  isOwner: boolean;
  isPublicTeam: boolean; // Public visibility on organization public profile
  canAccessWorkspace: boolean; // Workspace dashboard operating access
  status: 'active' | 'invited' | 'declined' | 'suspended';
  dealAccessMode: ResourceAccessMode;
  assignedDealIds?: string[];
  portfolioAccessMode: ResourceAccessMode;
  assignedPortfolioIds?: string[];
  permissions: InvestorOrgPermissions;
  joinedAt: string;
  invitedBy?: string;
  personalAccountVerified?: boolean;
}

// =========================================================================
// 5. INVITATIONS
// =========================================================================

export interface InvestorOrgInvitation {
  id: string;
  organizationId: string;
  organizationName: string;
  email: string;
  name?: string;
  role: InvestorEntityRole;
  title: string;
  dealAccessMode: ResourceAccessMode;
  portfolioAccessMode: ResourceAccessMode;
  permissions: InvestorOrgPermissions;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'revoked';
}

// =========================================================================
// 6. INVESTOR ORGANIZATION ENTITY MODEL
// =========================================================================

export interface InvestorOrganization {
  id: string;
  name: string;
  organizationType: InvestorOrganizationType;
  logo: string;
  banner: string;
  shortDescription: string;
  website: string;
  linkedIn: string;
  headquarters: {
    city: string;
    state?: string;
    country: string;
  };
  foundedYear: string;
  officialEmail: string;
  
  // Sensitive / Legal / Capital data
  legalName?: string;
  registrationNumber?: string;
  operatingRegions?: string[];
  fundSize?: string; // e.g. "₹500 Cr ($60M Fund III)"
  aum?: string; // "₹1,200 Cr AUM"
  verified: boolean;
  ownerId: string; // userId of primary owner

  // Institutional About Section
  about: {
    overview: string;
    thesis: string;
    mission: string;
    assetsInfo?: string;
    fundGeneration?: string;
    geographicPresence?: string;
  };

  // 4 Grouped Institutional Investment Profile Sections
  investmentFocus: InvestmentFocusConfig;
  valueBeyondCapital: ValueBeyondCapitalConfig;
  investmentCriteria: InvestmentCriteriaConfig;
  investmentProcess: InvestmentProcessConfig;

  // Institutional Portfolio & Experience
  portfolio: PortfolioCompany[];
  experienceStats: InvestorExperienceStats;
  testimonials: InvestorTestimonial[];

  // Connect Preferences
  connectionPreferences: ConnectionPreferencesConfig;

  // Content & Activities
  content: InvestorContentItem[];
  activities: InvestorActivityItem[];

  // Scoped Workspace Data
  deals: InvestorDeal[];
  diligenceDocs: InvestorDDDocument[];
  meetings: InvestorMeeting[];

  // Billing
  subscription: InvestorSubscription;
  billingAccount: InvestorBillingAccount;
  invoices: InvestorInvoice[];

  createdAt: string;
  updatedAt: string;
}

// =========================================================================
// 7. INDIVIDUAL INVESTOR PROFILE (EXPLICIT DISTINCTION)
// =========================================================================

export interface IndividualInvestorProfile {
  userId: string;
  name: string;
  roleTitle: string; // e.g. "Angel Investor & Former Founder"
  avatar: string;
  banner: string;
  location: {
    city: string;
    state?: string;
    country: string;
  };
  website?: string;
  linkedIn?: string;
  verified: boolean;
  bio: string;
  background: string;
  yearsOfInvestingExperience: string;
  overview: {
    whoTheyInvestIn: string;
    sectorsFocus: string;
    investmentPhilosophy: string;
    aimToContribute: string;
  };
  investmentFocus: InvestmentFocusConfig;
  valueBeyondCapital: ValueBeyondCapitalConfig;
  investmentCriteria: InvestmentCriteriaConfig;
  investmentProcess: InvestmentProcessConfig;
  portfolio: PortfolioCompany[];
  experienceStats: InvestorExperienceStats;
  testimonials: InvestorTestimonial[];
  connectionPreferences: ConnectionPreferencesConfig;
  content: InvestorContentItem[];
  activities: InvestorActivityItem[];
  personalDeals: InvestorDeal[];
}
