export type InvestorType =
  | 'Venture Capital'
  | 'Angel Network'
  | 'Corporate VC'
  | 'Growth Fund'
  | 'Family Office'
  | 'Angel Investor';

export type PortfolioCompanyStatus = 'Active' | 'Acquired' | 'IPO' | 'Scaled';

export interface PortfolioCompany {
  id: string;
  name: string;
  logo: string;
  sector: string;
  stageInvested: 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Growth';
  investmentYear: string;
  currentStatus: PortfolioCompanyStatus;
  xentroStartupId?: string; // e.g. 'st_1' for Kinetix AI
  description?: string;
}

export interface InvestorExperienceStats {
  totalInvestments?: number;
  activePortfolio?: number;
  followOnInvestments?: number;
  exits?: number;
  yearsOfExperience?: string;
  industriesInvested?: number;
}

export interface InvestorTestimonial {
  id: string;
  founderName: string;
  founderAvatar: string;
  founderRole: string;
  startupName: string;
  startupLogo?: string;
  relationship: string;
  testimonial: string;
  verified: boolean;
  xentroFounderId?: string;
  xentroStartupId?: string;
}

export interface InvestmentFocusConfig {
  sectors: string[];
  stages: ('Idea' | 'Pre-Seed' | 'Seed' | 'Series A' | 'Series B' | 'Series B+' | 'Growth')[];
  geography: {
    countries: string[];
    regions: string[];
    cities?: string[];
  };
  businessModels: ('B2B' | 'B2C' | 'B2B2C' | 'Marketplace' | 'SaaS' | 'D2C' | 'Hardware' | 'DeepTech')[];
  ticketSize: {
    min: string;
    max: string;
    formatted: string;
  };
  leadInvestorPreference?: string;
  coInvestorPreference?: string;
  investmentInstruments?: string[];
}

export interface ValueBeyondCapitalConfig {
  supportAreas: string[];
  whatIBringToFounders: string;
  advisoryCapabilities?: string[];
}

export interface InvestmentCriteriaConfig {
  evaluationCriteria: string[];
  preferredTraction: ('Idea' | 'MVP' | 'Early Revenue' | 'PMF' | 'Growth')[];
  diligenceHighlights: string[];
}

export interface InvestmentProcessStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedTime?: string;
}

export interface InvestmentProcessConfig {
  stages: InvestmentProcessStep[];
  preferredConnectionMethod: string;
  informationRequiredInitially: string[];
  typicalDecisionTimeline: string;
  pitchDeckRequirements: string;
  warmIntroPreferred: boolean;
  unsolicitedPitchesAccepted: boolean;
}

export interface ConnectionPreferencesConfig {
  openToConnectionRequests: boolean;
  openToStartupPitches: boolean;
  introductionPreferred: boolean;
  currentlyInvesting: boolean;
  notAcceptingNewPitches: boolean;
  guidelines?: string;
}

export interface InvestorContentItem {
  id: string;
  type: 'insight' | 'article' | 'advice' | 'market_memo' | 'opportunity';
  title: string;
  excerpt: string;
  content?: string;
  publishedAt: string;
  readTime?: string;
  tags: string[];
  metrics: {
    likes: number;
    comments: number;
    shares: number;
  };
}

export interface InvestorActivityItem {
  id: string;
  actionType: 'investment' | 'event' | 'insight' | 'session' | 'portfolio_add' | 'opportunity';
  title: string;
  description: string;
  timestamp: string;
  badge?: string;
}

export interface FullInvestorProfile {
  id: string;
  name: string; // Fund / Investor Name
  logo: string;
  banner: string;
  investorType: InvestorType;
  currentRole: string; // e.g. Managing Partner, Lead Partner
  organization: string; // Firm name
  location: {
    city: string;
    state?: string;
    country: string;
  };
  website?: string;
  linkedIn?: string;
  verified: boolean;
  primaryInvestmentFocus: string;

  // Introduction
  bio: string;
  background: string;
  yearsOfInvestingExperience: string;

  // Investor Overview
  overview: {
    whoTheyInvestIn: string;
    sectorsFocus: string;
    investmentPhilosophy: string;
    aimToContribute: string;
  };

  // 4 Investment Profile Subsections
  investmentFocus: InvestmentFocusConfig;
  valueBeyondCapital: ValueBeyondCapitalConfig;
  investmentCriteria: InvestmentCriteriaConfig;
  investmentProcess: InvestmentProcessConfig;

  // Portfolio & Experience
  portfolio: PortfolioCompany[];
  experienceStats: InvestorExperienceStats;
  testimonials: InvestorTestimonial[];

  // Connect Preferences
  connectionPreferences: ConnectionPreferencesConfig;

  // Content & Activities
  content: InvestorContentItem[];
  activities: InvestorActivityItem[];

  // Dual Architecture & Settings
  accountType?: InvestorAccountType;
  visibility?: InvestorVisibility;
  verificationBadges?: InvestorVerificationBadge[];
  entityId?: string;
  membersCount?: number;
  aum?: string;
  activeDealsCount?: number;
}

// =========================================================================
// DUAL INVESTOR ARCHITECTURE & RBAC
// =========================================================================

export type InvestorAccountType = 'individual' | 'organization';

export type InvestorVisibility = 'public' | 'limited' | 'private' | 'ghost';

export type InvestorVerificationBadge =
  | 'verified'
  | 'identity_verified'
  | 'credentials_verified'
  | 'organization_verified';

export type InvestorEntityRole =
  | 'Owner/Managing Partner'
  | 'Admin'
  | 'Partner'
  | 'Principal'
  | 'Associate'
  | 'Analyst'
  | 'Portfolio Manager'
  | 'Finance/Operations'
  | 'Viewer';

export type InvestorPermission =
  | 'manage_organization'
  | 'manage_team'
  | 'manage_billing'
  | 'view_deal_flow'
  | 'edit_deal_flow'
  | 'create_investment_decision'
  | 'view_portfolio'
  | 'edit_portfolio'
  | 'access_diligence_vault'
  | 'request_diligence'
  | 'schedule_meetings'
  | 'publish_content'
  | 'export_data';

export interface InvestorEntityMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: InvestorEntityRole;
  title: string;
  joinedAt: string;
  status: 'active' | 'invited' | 'suspended';
  permissions: InvestorPermission[];
  isOwner?: boolean;
  personalAccountVerified?: boolean;
}

export interface InvestorInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: InvestorEntityRole;
  title: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
}

// =========================================================================
// DEAL FLOW PIPELINE & CRM
// =========================================================================

export type InvestorDealStage =
  | 'new'
  | 'reviewed'
  | 'connected'
  | 'meeting_scheduled'
  | 'evaluation'
  | 'due_diligence'
  | 'term_discussion'
  | 'invested'
  | 'passed';

export interface InvestorDealNote {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
  stage?: InvestorDealStage;
}

export interface InvestorDealTermSheet {
  status: 'draft' | 'offered' | 'accepted' | 'declined';
  amount?: string;
  equity?: string;
  valuation?: string;
  date?: string;
  notes?: string;
}

export interface InvestorDeal {
  id: string;
  startupId: string;
  startupName: string;
  startupLogo: string;
  founderName: string;
  founderEmail?: string;
  sector: string;
  stage: string;
  pitchSummary: string;
  fundingAsk: string;
  valuation?: string;
  tractionMRR?: string;
  dealStage: InvestorDealStage;
  assignedMemberId?: string;
  assignedMemberName?: string;
  pitchDate: string;
  lastActivityDate: string;
  matchScore: number;
  tags: string[];
  notes: InvestorDealNote[];
  termSheet?: InvestorDealTermSheet;
  diligenceVaultUnlocked?: boolean;
}

// =========================================================================
// DUE DILIGENCE & DATA ROOM
// =========================================================================

export type InvestorDDStatus =
  | 'not_requested'
  | 'requested'
  | 'granted'
  | 'restricted'
  | 'expired'
  | 'revoked';

export interface InvestorDDDocument {
  id: string;
  startupId: string;
  startupName: string;
  title: string;
  category: 'Pitch Deck' | 'Financials' | 'Cap Table' | 'Legal' | 'Technical' | 'Product' | 'Compliance';
  fileType: string;
  fileSize: string;
  accessStatus: InvestorDDStatus;
  requestedAt?: string;
  grantedAt?: string;
  expiresAt?: string;
  watermarked: boolean;
  downloadUrl?: string;
}

// =========================================================================
// MEETINGS & CALENDAR
// =========================================================================

export interface InvestorMeeting {
  id: string;
  title: string;
  startupId?: string;
  startupName?: string;
  founderName: string;
  dealId?: string;
  date: string;
  time: string;
  duration: string;
  status: 'scheduled' | 'completed' | 'canceled' | 'rescheduled';
  meetingLink?: string;
  attendees: string[];
  notes?: string;
  outcomeStageUpdate?: InvestorDealStage;
}

// =========================================================================
// BILLING, PAYMENTS & SUBSCRIPTIONS
// =========================================================================

export type InvestorPlanTier = 'starter' | 'pro' | 'syndicate' | 'institutional';

export interface InvestorSubscription {
  tier: InvestorPlanTier;
  status: 'active' | 'past_due' | 'grace_period' | 'canceled';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  seatsIncluded: number;
  seatsUsed: number;
  dealFlowLimit: number; // -1 for unlimited
  dueDiligenceExportsLimit: number;
  monthlyPrice: number;
  currency: 'INR' | 'USD';
}

export interface InvestorBillingAccount {
  organizationName: string;
  billingEmail: string;
  gstin?: string;
  pan?: string;
  taxExempt: boolean;
  billingAddress: {
    line1: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  defaultPaymentMethod: {
    type: 'card' | 'upi' | 'netbanking';
    last4?: string;
    brand?: string;
    expiry?: string;
    vpa?: string;
  };
}

export interface InvestorInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  amount: number;
  currency: 'INR' | 'USD';
  status: 'paid' | 'pending' | 'failed';
  downloadUrl: string;
  description: string;
  gstAmount?: number;
}

export * from './investorOrganization';

