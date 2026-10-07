export type BusinessModelType =
  | 'B2B'
  | 'B2C'
  | 'B2B2C'
  | 'SaaS'
  | 'Marketplace'
  | 'D2C';

export type ProductStatus =
  | 'Idea'
  | 'Prototype'
  | 'MVP'
  | 'Beta'
  | 'Live'
  | 'Revenue Generating'
  | 'Scaling';

export interface StartupIdentity {
  name: string;
  logo: string;
  tagline: string;
  stage: string;
  industry: string;
  subSector: string;
  businessModelType: BusinessModelType;
  foundedYear: number;
  location: string;
  operatingGeography: string[];
  website: string;
  linkedin: string;
  isVerified: boolean;
}

export interface StartupOverview {
  whatItDoes: string;
  whoItServes: string;
  currentStage: string;
  coreValueProp: string;
}

export interface StartupUNSDG {
  goalNumber: number;
  title: string;
  description?: string;
  tags?: string[];
}

export interface ElevatorPitchVideo {
  title?: string;
  videoUrl?: string;
  thumbnailUrl: string;
  presenterName: string;
  presenterRole: string;
  duration: string; // <= 3 minutes
  lastUpdated: string;
}

export interface PitchDeckDoc {
  title: string;
  version: string;
  lastUpdated: string;
  slideCount?: number;
  visibility: 'Public' | 'Connections Only' | 'Request Access' | 'Private';
  allowDownload?: boolean;
  previewSlides?: string[];
  fileUrl?: string;
  fileName?: string;
  fileSize?: string;
  fileType?: string;
  description?: string;
  uploadedAt?: string;
  updatedAt?: string;
}

export interface StartupProblem {
  problemStatement: string;
  targetUsers: string;
  painPoints: string[];
  whyItMatters: string;
  existingAlternatives?: string;
}

export interface StartupSolution {
  overview: string;
  howItSolves: string;
  coreValueProp: string;
  keyDifferentiators: string[];
}

export interface StartupProduct {
  name: string;
  category: string;
  description: string;
  status: ProductStatus;
  keyFeatures: string[];
  screenshots?: string[];
  demoLink?: string;
  productWebsite?: string;
  demoVideoUrl?: string;
}

export interface StartupCompanyInfo {
  legalName: string;
  incorporationStatus: string;
  incorporationDate: string;
  registeredLocation: string;
  isDPIITRecognised: boolean;
  dpiitNumberMasked?: string;
  isMSMERegistered: boolean;
  msmeNumberMasked?: string;
  cinMasked?: string;
  gstMasked?: string;
  incubatorAffiliation?: string;
}

export interface StartupMarket {
  targetCustomer: string;
  primarySegment: string;
  secondarySegment?: string;
  businessModelCategory: string;
  targetGeography: string[];
  marketOpportunity: string;
  tam?: string;
  sam?: string;
  som?: string;
  competitiveLandscape?: string;
}

export interface StartupBusinessModel {
  businessModel: string;
  revenueModel: string;
  pricingModel: string;
  revenueStreams: string[];
  customerType: string;
  salesModel: string;
}

export type StartupMemberStatus =
  | 'active'
  | 'invited'
  | 'pending'
  | 'inactive'
  | 'former'
  | 'removed';

export type StartupDashboardRole =
  | 'owner'
  | 'admin'
  | 'finance'
  | 'operations'
  | 'team_member'
  | 'advisor'
  | 'viewer';

export type TeamCategory =
  | 'founder'
  | 'co_founder'
  | 'leadership'
  | 'core_team'
  | 'advisor'
  | 'mentor'
  | 'consultant'
  | 'intern'
  | 'contributor';

export interface StartupMemberPublicFields {
  photo: boolean;
  name: boolean;
  designation: boolean;
  bio: boolean;
  expertise: boolean;
  linkedin: boolean;
  experience?: boolean;
  xentroProfile: boolean;
}

export interface StartupPermissionSet {
  profile: {
    viewProfileManagement: boolean;
    editBasicInfo: boolean;
    editPitch: boolean;
    manageTeam: boolean;
    manageTalentAsk: boolean;
    managePublicVisibility: boolean;
    publishProfile: boolean;
  };
  opportunities: {
    viewOpportunities: boolean;
    saveOpportunities: boolean;
    applyOpportunities: boolean;
    manageApplications: boolean;
  };
  connections: {
    viewConnections: boolean;
    manageConnections: boolean;
    messageConnections: boolean;
    scheduleMeetings: boolean;
  };
  ask: {
    viewAsks: boolean;
    createAsk: boolean;
    editAsk: boolean;
    publishAsk: boolean;
    closeAsk: boolean;
    manageAskResponses: boolean;
  };
  finance: {
    viewFinancials: boolean;
    uploadFinancialData: boolean;
    editFinancialData: boolean;
    exportFinancialData: boolean;
    manageFinancialVisibility: boolean;
  };
  ddLocker: {
    viewDDLocker: boolean;
    uploadDocuments: boolean;
    deleteDocuments: boolean;
    manageFolders: boolean;
    approveAccess: boolean;
    revokeAccess: boolean;
    viewActivityLogs: boolean;
  };
  content: {
    viewContent: boolean;
    createPosts: boolean;
    editPosts: boolean;
    publishPosts: boolean;
    deletePosts: boolean;
    featurePosts: boolean;
  };
  team: {
    viewMembers: boolean;
    inviteMembers: boolean;
    editMembers: boolean;
    removeMembers: boolean;
    assignRoles: boolean;
    changePermissions: boolean;
  };
  billing: {
    viewBilling: boolean;
    manageSubscription: boolean;
    viewInvoices: boolean;
    managePaymentMethod: boolean;
    downloadInvoices: boolean;
  };
  entityAdministration: {
    manageStartupSettings: boolean;
    changeOfficialEmail: boolean;
    changeProfileVisibility: boolean;
    transferOwnership: boolean;
    archiveStartup: boolean;
  };
}

export interface StartupTeamMember {
  id: string;
  name: string;
  email?: string;
  role: string; // Designation
  designation?: string;
  department?: string;
  roleCategory: 'founder' | 'leadership' | 'core' | 'advisor';
  teamCategory?: TeamCategory;
  avatar: string;
  bio: string;
  shortBio?: string;
  expertise?: string[];
  experience?: string;
  linkedin?: string;
  xentroProfile?: string;
  xentroUserId?: string;
  xentroProfileLinked?: boolean;
  isFullTime?: boolean;
  isVerified?: boolean;
  relationshipToStartup?: string;
  entityMembershipStatus?: StartupMemberStatus;
  publicProfileVisible?: boolean;
  publicDisplayFields?: StartupMemberPublicFields;
  dashboardAccessEnabled?: boolean;
  dashboardRole?: StartupDashboardRole;
  permissions?: StartupPermissionSet;
  startDate?: string;
  currentMember?: boolean;
}

export type TalentRoleType =
  | 'Co-Founder'
  | 'Full-Time'
  | 'Part-Time'
  | 'Internship'
  | 'Consultant'
  | 'Advisor'
  | 'Volunteer / Contributor';

export type TalentWorkMode = 'Remote' | 'Hybrid' | 'On-site';

export type TalentCompensationType =
  | 'Paid'
  | 'Unpaid Internship'
  | 'Equity'
  | 'Paid + Equity'
  | 'Negotiable';

export type TalentAskVisibility = 'Public' | 'Xentro Users' | 'Connections Only' | 'Private / Draft';

export type TalentAskStatus = 'Draft' | 'Open' | 'Paused' | 'Filled' | 'Closed';

export interface StartupTalentAsk {
  id: string;
  startupId?: string;
  positionTitle: string;
  department: string;
  roleType: TalentRoleType;
  seniority: string;
  openingsCount: number;

  location: string;
  workMode: TalentWorkMode;
  employmentType: string;
  startDate?: string;
  duration?: string;

  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills?: string[];
  minExperience?: string;
  education?: string;
  industryExperience?: string;

  compensationType: TalentCompensationType;
  salaryRange?: string;
  equityRange?: string;
  esop?: string;
  otherBenefits?: string[];

  visibility: TalentAskVisibility;
  status: TalentAskStatus;
  viewsCount: number;
  applicationsCount: number;
  shortlistedCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TalentApplicantStage =
  | 'Interested'
  | 'Applied'
  | 'Reviewing'
  | 'Shortlisted'
  | 'Interview'
  | 'Selected'
  | 'Joined Team'
  | 'Rejected'
  | 'Withdrawn';

export interface TalentApplicant {
  id: string;
  talentAskId: string;
  candidateName: string;
  email: string;
  xentroUserId?: string;
  xentroHandle?: string;
  avatar?: string;
  roleAppliedFor: string;
  stage: TalentApplicantStage;
  appliedDate: string;
  skills: string[];
  experience: string;
  bio?: string;
  notes?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  resumeUrl?: string;
}

export interface StartupOpenRole {
  id: string;
  title: string;
  type:
    | 'Co-founder'
    | 'CTO'
    | 'Developer'
    | 'Product Designer'
    | 'Sales'
    | 'Marketing'
    | 'Advisor'
    | 'Intern';
  department: string;
  location: string;
  description: string;
  requirements: string[];
}

export interface StartupFinancialPerformancePeriod {
  period: string;
  revenue: string;
  expenses: string;
  burn: string;
  cashAvailable: string;
  runway: string;
  growth?: string;
}

export interface StartupFinancials {
  revenueStatus: 'pre-revenue' | 'revenue-generating';
  monthlyRevenue?: string;
  annualRevenue?: string;
  mrr?: string;
  arr?: string;
  growthRate?: string;
  burnRate?: string;
  runway?: string;
  totalRaised?: string;
  currentValuation?: string;
  revenueModelSummary: {
    revenueStreams: string[];
    pricingModel: string;
    averageTicketSize?: string;
    customerType: string;
  };
  monthlyPerformance?: StartupFinancialPerformancePeriod[];
  quarterlyPerformance?: StartupFinancialPerformancePeriod[];
}

export interface StartupAskItem {
  id: string;
  type:
    | 'Investment'
    | 'Mentorship'
    | 'Grants'
    | 'Incubation'
    | 'Accelerator'
    | 'Corporate Pilot'
    | 'Strategic Partnership'
    | 'Research Partnership'
    | 'Institution Partnership'
    | 'Co-founder'
    | 'Talent'
    | 'Market Access'
    | 'Technology Support';
  title: string;
  description: string;
  requirement: string;
  deadline?: string;
  status: 'Active' | 'Under Review' | 'Fulfilled';
}

export interface StartupUseOfFunds {
  category: string;
  percentage: number;
  amount?: string;
}

export interface StartupPreviousFunding {
  round: string;
  date: string;
  amountRaised: string;
  investorType: string;
  investorName?: string;
}

export interface StartupInvestmentAsk {
  isFundraising: boolean;
  roundType?: string;
  totalAmountRaising?: string;
  amountCommitted?: string;
  amountRemaining?: string;
  percentageCommitted?: number;
  minimumInvestment?: string;
  instrument?: string;
  valuationCap?: string;
  roundOpenDate?: string;
  expectedClosingDate?: string;
  useOfFunds?: StartupUseOfFunds[];
  previousFunding?: StartupPreviousFunding[];
}

export interface StartupContentItem {
  id: string;
  isFeatured?: boolean;
  type:
    | 'Product Launch'
    | 'Major Partnership'
    | 'Funding Announcement'
    | 'Milestone'
    | 'Company Update'
    | 'Founder Post';
  title: string;
  date: string;
  content: string;
  mediaUrl?: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

export interface DDDocumentItem {
  id: string;
  name: string;
  type: string;
  size: string;
  lastUpdated: string;
  restrictedLevel: 'Confidential' | 'Approved Only' | 'Full DD';
}

export interface DDCategory {
  id: string;
  name: string;
  description: string;
  documentCount: number;
  documents: DDDocumentItem[];
}

export interface StartupDDLocker {
  totalDocumentCount: number;
  lastUpdated: string;
  categories: DDCategory[];
}

export interface FullStartupProfile {
  id: string;
  identity: StartupIdentity;
  overview: StartupOverview;
  unsdg?: StartupUNSDG[];
  pitchVideo?: ElevatorPitchVideo;
  pitchDeck?: PitchDeckDoc | null;
  problem: StartupProblem;
  solution: StartupSolution;
  product: StartupProduct;
  companyInfo: StartupCompanyInfo;
  market: StartupMarket;
  businessModel: StartupBusinessModel;
  team: {
    founders: StartupTeamMember[];
    leadership: StartupTeamMember[];
    core: StartupTeamMember[];
    advisors: StartupTeamMember[];
    openRoles: StartupOpenRole[];
  };
  financials: StartupFinancials;
  currentAsks: StartupAskItem[];
  investmentAsk?: StartupInvestmentAsk;
  nonFinancialAsks: StartupAskItem[];
  content: {
    featured: StartupContentItem[];
    latestActivity: StartupContentItem[];
  };
  ddLocker: StartupDDLocker;
}

// =========================================================================
// STARTUP ENTITY & MEMBERSHIP ARCHITECTURE (Sections 1, 10, 11, 12)
// =========================================================================

export type StartupEntityRole =
  | 'Owner / Founder'
  | 'Admin'
  | 'Finance'
  | 'Operations'
  | 'Team Member'
  | 'Advisor'
  | 'Viewer';

export type StartupPermissionCategory =
  | 'entity'
  | 'members'
  | 'profile'
  | 'finance'
  | 'documents'
  | 'content'
  | 'opportunities'
  | 'analytics';

export type StartupPermission =
  // Entity
  | 'view_entity'
  | 'edit_entity'
  | 'manage_entity_settings'
  | 'archive_entity'
  // Members
  | 'invite_members'
  | 'remove_members'
  | 'manage_roles'
  | 'manage_permissions'
  | 'transfer_ownership'
  // Profile
  | 'edit_profile'
  | 'publish_profile'
  | 'change_visibility'
  // Finance & Billing
  | 'view_financials'
  | 'edit_financials'
  | 'manage_billing'
  // Documents
  | 'upload_documents'
  | 'view_documents'
  | 'share_documents'
  | 'delete_documents'
  // Content
  | 'create_content'
  | 'edit_content'
  | 'publish_content'
  // Opportunities
  | 'manage_applications'
  // Analytics
  | 'view_analytics'
  | 'export_analytics';

export interface StartupEntityMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: StartupEntityRole;
  title: string;
  avatar: string;
  joinedDate: string;
  status: 'Active' | 'Invited' | 'Suspended';
  isOwner?: boolean;
  personalAccountVerified: boolean;
  customPermissions?: StartupPermission[];
}

export interface StartupInvitation {
  id: string;
  email: string;
  role: StartupEntityRole;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired';
}

// =========================================================================
// STARTUP VISIBILITY (Section 13)
// =========================================================================

export type StartupOverallVisibility = 'Public' | 'Limited' | 'Private' | 'Ghost Mode';

// =========================================================================
// STARTUP VERIFICATION (Section 24)
// =========================================================================

export type StartupVerificationStatus =
  | 'Not Submitted'
  | 'Pending'
  | 'Under Review'
  | 'Verified'
  | 'Verification Failed'
  | 'Resubmission Required';

export interface StartupVerificationItem {
  id: string;
  title: string;
  type: 'Official Email' | 'Founder Identity' | 'Incorporation' | 'DPIIT' | 'MSME' | 'Other Records';
  status: StartupVerificationStatus;
  identifierMasked?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface StartupVerificationRecord {
  overallStatus: StartupVerificationStatus;
  founderIdentityVerified: boolean;
  publicBadgeTitle: string; // 'Founder Identity Verified'
  lastAuditDate?: string;
  items: StartupVerificationItem[];
}

// =========================================================================
// ESP ENDORSEMENT & ENTITLEMENTS (Sections 25, 26, 27, 37)
// =========================================================================

export type ESPEndorsementRelationshipType =
  | 'Pre-Incubated'
  | 'Incubated'
  | 'Accelerated'
  | 'Portfolio Startup'
  | 'Program Participant'
  | 'Alumni Startup'
  | 'Institution-Supported Startup';

export type ESPEndorsementItemStatus =
  | 'Pending'
  | 'Active'
  | 'Expired'
  | 'Revoked'
  | 'Declined'
  | 'Suspended'
  | 'Completed';

export interface StartupESPEndorsementItem {
  id: string;
  espId: string;
  espName: string;
  espLogo: string;
  relationshipType: ESPEndorsementRelationshipType;
  program: string;
  startDate: string;
  endDate: string;
  status: ESPEndorsementItemStatus;
  entitlementGranted: boolean;
  entitlementTier?: string;
  verificationBadgeUrl?: string;
  notes?: string;
}

export type StartupEntitlementSource =
  | 'Paid Subscription'
  | 'ESP Endorsement'
  | 'Xentro Partnership'
  | 'Complimentary Access'
  | 'Promotional Access'
  | 'Administrative Grant';

export interface StartupEntitlement {
  planTier: 'Startup Free' | 'Startup Pro' | 'Startup Growth';
  source: StartupEntitlementSource;
  status: 'Active' | 'Past Due' | 'Expired' | 'Revoked';
  validUntil: string;
  directPaymentRequired: boolean;
  sponsoringEntityName?: string;
  featuresGranted: string[];
}

// =========================================================================
// BILLING & PAYMENTS ARCHITECTURE (Sections 28 to 36)
// =========================================================================

export interface StartupSubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  priceAnnual: number;
  currency: string;
  description: string;
  features: string[];
  recommended?: boolean;
}

export interface StartupSubscription {
  planId: string;
  planName: string;
  billingCycle: 'Monthly' | 'Annual';
  status: 'Active' | 'Past Due' | 'Cancelled' | 'Trial';
  amount: number;
  currency: string;
  startDate: string;
  renewalDate: string;
  expirationDate: string;
  autoRenew: boolean;
  entitlementSource: StartupEntitlementSource;
}

export interface StartupPaymentMethodRef {
  id: string;
  type: 'Card' | 'UPI' | 'Net Banking';
  brand?: string;
  maskedDetails: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
  addedAt: string;
}

export interface StartupInvoice {
  id: string;
  invoiceNumber: string;
  date: string;
  billingPeriod: string;
  planName: string;
  subtotal: number;
  taxGst: number;
  total: number;
  currency: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  downloadUrl?: string;
  legalEntityName: string;
  gstin?: string;
}

export interface StartupPayment {
  id: string;
  transactionId: string;
  date: string;
  description: string;
  plan: string;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded' | 'Partially Refunded' | 'Cancelled';
}

export interface StartupBillingAccount {
  legalBillingName: string;
  billingAddress: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  gstin: string;
  billingEmail: string;
  financeContact: string;
}

