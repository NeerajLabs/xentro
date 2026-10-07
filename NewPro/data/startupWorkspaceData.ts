export interface StartupWorkspaceData {
  identity: {
    founderName: string;
    startupName: string;
    tagline: string;
    logo: string;
    stage: string;
    verified: boolean;
    industry: string;
    subSector: string;
    businessModel: string;
    foundedYear: string;
    headquarters: string;
    operatingGeography: string;
    website: string;
    linkedin: string;
    overview: string;
    unsdgs: string[];
    impactAreas: string[];
  };
  metrics: {
    profileCompletionPct: number;
    profileViews: number;
    profileViewsDelta: string;
    connectionsCount: number;
    askResponsesCount: number;
    opportunitiesAppliedCount: number;
    ddRequestsCount: number;
  };
  completionChecklist: Array<{
    id: string;
    section: string;
    weight: number;
    completed: boolean;
    description: string;
  }>;
  currentAsk: {
    id: string;
    title: string;
    type: 'Investment' | 'Mentorship' | 'Corporate Pilot' | 'Strategic Partnership';
    targetAmount: string;
    committedAmount: string;
    remainingAmount: string;
    currency: string;
    percentComplete: number;
    minInvestment: string;
    instrument: string;
    valuationCap: string;
    openDate: string;
    closingDate: string;
    responsesCount: number;
    useOfFunds: Array<{ category: string; percentage: number }>;
  };
  progressTracker: {
    company: Array<{ name: string; completed: boolean; current?: boolean }>;
    product: Array<{ name: string; completed: boolean; current?: boolean }>;
    market: Array<{ name: string; completed: boolean; current?: boolean }>;
    funding: Array<{ name: string; completed: boolean; current?: boolean }>;
  };
  recentActivities: Array<{
    id: string;
    type: 'investor_view' | 'mentor_response' | 'opportunity_matched' | 'dd_request' | 'connection' | 'message';
    actorName: string;
    actorRole: string;
    actorAvatar: string;
    content: string;
    timestamp: string;
    actionable?: boolean;
    actionLabel?: string;
  }>;
  goals: Array<{
    id: string;
    title: string;
    category: string;
    status: 'In Progress' | 'Achieved' | 'Planned';
  }>;
  verificationStatus: Array<{
    item: string;
    status: 'Verified' | 'Pending' | 'Not Submitted';
    badgeColor: string;
  }>;
}

export const initialStartupWorkspaceData: StartupWorkspaceData = {
  identity: {
    founderName: 'Founder',
    startupName: 'My Startup Venture',
    tagline: 'Building high-impact technology and enterprise solutions on Xentro',
    logo: '/xentro-logo.png',
    stage: 'Early Stage · Verified',
    verified: true,
    industry: 'Enterprise Software & Technology',
    subSector: 'Technology & Innovation',
    businessModel: 'B2B SaaS / Innovation Platform',
    foundedYear: '2026',
    headquarters: 'India',
    operatingGeography: 'India',
    website: 'https://xentro.io',
    linkedin: '',
    overview: 'Next-generation venture connected via Xentro ecosystem.',
    unsdgs: ['Industry, Innovation and Infrastructure (Goal 9)'],
    impactAreas: ['Enterprise Productivity', 'Technology Innovation'],
  },
  metrics: {
    profileCompletionPct: 80,
    profileViews: 0,
    profileViewsDelta: '+0% this week',
    connectionsCount: 0,
    askResponsesCount: 0,
    opportunitiesAppliedCount: 0,
    ddRequestsCount: 0,
  },
  completionChecklist: [
    { id: 'sec_basic', section: 'Basic Info', weight: 15, completed: true, description: 'Organization name, mission, overview, and website' },
    { id: 'sec_elevator', section: 'Elevator Pitch Video', weight: 15, completed: false, description: '3-minute founder video pitch' },
    { id: 'sec_deck', section: 'Pitch Deck', weight: 20, completed: false, description: '12-slide institutional investor deck' },
    { id: 'sec_team', section: 'Team & Advisors', weight: 15, completed: true, description: 'Founding team bios and key talent requirements' },
    { id: 'sec_finance', section: 'Finances', weight: 15, completed: false, description: 'FY25-26 cash flow, runway, and projections' },
    { id: 'sec_ask', section: 'Ecosystem Ask', weight: 10, completed: false, description: 'Pre-seed round investment parameters' },
    { id: 'sec_dd', section: 'DD Locker', weight: 10, completed: false, description: 'Upload certificate of incorporation and statutory filing' },
  ],
  currentAsk: {
    id: '',
    title: 'No Active Ask',
    type: 'Investment',
    targetAmount: '₹0',
    committedAmount: '₹0',
    remainingAmount: '₹0',
    currency: 'INR',
    percentComplete: 0,
    minInvestment: '₹0',
    instrument: '',
    valuationCap: '',
    openDate: '',
    closingDate: '',
    responsesCount: 0,
    useOfFunds: [],
  },
  progressTracker: {
    company: [
      { name: 'Idea Validated', completed: true },
      { name: 'Incorporated', completed: false },
      { name: 'DPIIT Recognised', completed: false },
      { name: 'MSME Registered', completed: false },
    ],
    product: [
      { name: 'Prototype', completed: true },
      { name: 'MVP', completed: false },
      { name: 'Private Beta', completed: false },
      { name: 'General Live', completed: false },
    ],
    market: [
      { name: 'First User', completed: false },
      { name: 'First Customer', completed: false },
      { name: 'Predictable Revenue', completed: false },
      { name: 'Scale Growth', completed: false },
    ],
    funding: [
      { name: 'Pitch Ready', completed: false },
      { name: 'Fundraising Started', completed: false },
      { name: 'First Commitment', completed: false },
      { name: 'Round Closed', completed: false },
    ],
  },
  recentActivities: [],
  goals: [],
  verificationStatus: [
    { item: 'Official Domain Email', status: 'Verified', badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
    { item: 'Founder Identity (Govt ID)', status: 'Verified', badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
    { item: 'Company Incorporation (MCA)', status: 'Verified', badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
    { item: 'DPIIT Startup Recognition', status: 'Verified', badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
    { item: 'MSME Udyam Registration', status: 'Pending', badgeColor: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
    { item: 'Official Corporate Website', status: 'Verified', badgeColor: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' },
  ],
};

// ==========================================
// 2. Opportunities Module Data
// ==========================================
export interface StartupOpportunity {
  id: string;
  title: string;
  organization: string;
  logo: string;
  category: 'Grant' | 'Govt Scheme' | 'Accelerator' | 'Incubator' | 'Competition' | 'Corporate Challenge' | 'Fellowship';
  stage: string;
  fundingAmount: string;
  deadline: string;
  location: string;
  type: 'Government' | 'Private';
  mode: 'Online' | 'Offline' | 'Hybrid';
  status: 'Open' | 'Upcoming' | 'Rolling' | 'Closing Soon';
  eligibility: string;
  saved: boolean;
  applied: boolean;
}

export const initialStartupOpportunities: StartupOpportunity[] = [
  {
    id: 'opp_1',
    title: 'Startup India Seed Fund Scheme (SISFS)',
    organization: 'DPIIT & T-Hub Hyderabad',
    logo: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=80&auto=format&fit=crop&q=80',
    category: 'Govt Scheme',
    stage: 'Early Stage / Pre-Seed',
    fundingAmount: 'Up to ₹50,00,000 (Grant & CCD)',
    deadline: 'Oct 30, 2026',
    location: 'Pan India (Hybrid)',
    type: 'Government',
    mode: 'Hybrid',
    status: 'Open',
    eligibility: 'DPIIT recognized startups with proof of concept and incorporation < 2 years.',
    saved: true,
    applied: true,
  },
  {
    id: 'opp_2',
    title: 'AI Enterprise Innovation Challenge 2026',
    organization: 'NASSCOM DeepTech Hub',
    logo: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=80&auto=format&fit=crop&q=80',
    category: 'Corporate Challenge',
    stage: 'MVP / Early Traction',
    fundingAmount: '₹25,00,000 Pilot Contract + Credits',
    deadline: 'Nov 15, 2026',
    location: 'Bengaluru, India',
    type: 'Private',
    mode: 'Online',
    status: 'Open',
    eligibility: 'B2B AI agent & orchestration startups with prototype or beta customers.',
    saved: true,
    applied: false,
  },
  {
    id: 'opp_3',
    title: 'T-Hub Lab32 Cohort 14 Accelerator',
    organization: 'T-Hub Foundation',
    logo: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=80&auto=format&fit=crop&q=80',
    category: 'Accelerator',
    stage: 'Early Revenue / Beta',
    fundingAmount: '$150,000 Perks + Investor Demo Day',
    deadline: 'Oct 10, 2026',
    location: 'Hyderabad, India',
    type: 'Private',
    mode: 'Hybrid',
    status: 'Closing Soon',
    eligibility: 'Seed-stage tech startups with operational prototypes and founder commitment.',
    saved: false,
    applied: true,
  },
  {
    id: 'opp_4',
    title: 'BIRAC BIG DeepTech Fellowship Grant',
    organization: 'Biotechnology Industry Research Assistance Council',
    logo: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=80&auto=format&fit=crop&q=80',
    category: 'Grant',
    stage: 'Proof of Concept',
    fundingAmount: '₹50,00,000 Equity-free Grant',
    deadline: 'Dec 05, 2026',
    location: 'New Delhi, India',
    type: 'Government',
    mode: 'Online',
    status: 'Upcoming',
    eligibility: 'Startups and innovators working on computational biological and AI systems.',
    saved: false,
    applied: false,
  },
  {
    id: 'opp_5',
    title: 'Peak XV Surge Cohort 11',
    organization: 'Peak XV Partners',
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&auto=format&fit=crop&q=80',
    category: 'Accelerator',
    stage: 'Pre-Seed / Seed',
    fundingAmount: '$1,000,000 to $3,000,000 Seed Capital',
    deadline: 'Rolling Applications',
    location: 'Singapore & India',
    type: 'Private',
    mode: 'Hybrid',
    status: 'Rolling',
    eligibility: 'Ambitious early-stage founders building world-class technology products.',
    saved: true,
    applied: false,
  },
];

export interface OpportunityApplication {
  id: string;
  opportunityId: string;
  opportunityName: string;
  organization: string;
  appliedDate: string;
  deadline: string;
  status: 'Saved' | 'Preparing' | 'Applied' | 'Under Review' | 'Shortlisted' | 'Selected' | 'Rejected';
  nextAction: string;
}

export const initialApplicationTracker: OpportunityApplication[] = [];

// ==========================================
// 3. Connections Module Data
// ==========================================
export interface EcosystemConnection {
  id: string;
  name: string;
  role: string;
  organization: string;
  avatar: string;
  category: 'Investor' | 'Mentor' | 'Startup' | 'ESP';
  status: 'Connected' | 'Pending';
  lastInteraction?: string;
  connectedSince?: string;
  isVerified?: boolean;
  lastActive?: string;
  engagementCount?: number;
  relationshipStrength?: string;
  email?: string;
  connectionDate?: string;
  // Investor specific pipeline
  investorStage?: 'Connected' | 'Pitch Shared' | 'Interested' | 'DD Requested' | 'DD Granted' | 'Follow-up Required';
  // Mentor specific pipeline
  mentorStage?: 'Mentorship Requested' | 'Accepted' | 'Session Scheduled' | 'Active Mentor' | 'Completed';
  // Private founder note (strictly non-public)
  founderNotes?: {
    notes: string;
    nextFollowUpDate: string;
    relationshipStatus: string;
  };
}

export const initialConnectionsData: EcosystemConnection[] = [];

// ==========================================
// 4. Asks Module Data
// ==========================================
export interface EcosystemAsk {
  id: string;
  type: string;
  title: string;
  description: string;
  requirement: string;
  targetUserType: string;
  dateCreated: string;
  deadline: string;
  visibility: 'Public' | 'Connections Only' | 'Verified Investors Only';
  status: 'Active' | 'Draft' | 'Paused' | 'Closed';
  responsesCount: number;
}

export const initialAsksList: EcosystemAsk[] = [];

export interface AskResponseItem {
  id: string;
  askId: string;
  responderName: string;
  responderRole: string;
  responderOrg: string;
  responderAvatar: string;
  userType: string;
  message: string;
  date: string;
  status: 'Pending' | 'Accepted' | 'Declined';
}

export const initialAskResponses: AskResponseItem[] = [];

// ==========================================
// 5. Finances Module Data
// ==========================================
export interface FinancialMetrics {
  revenueCurrentMonth: string;
  expensesCurrentMonth: string;
  burnRateMonthly: string;
  cashAvailable: string;
  runwayMonths: number;
  mrr: string;
  arr: string;
  growthPct: string;
  totalFundingRaised: string;
  visibility: {
    revenue: 'Public' | 'Connections' | 'Private';
    burn: 'Public' | 'Connections' | 'Private';
    cash: 'Public' | 'Connections' | 'Private';
    runway: 'Public' | 'Connections' | 'Private';
    funding: 'Public' | 'Connections' | 'Private';
  };
}

export const initialFinancesData: FinancialMetrics = {
  revenueCurrentMonth: '₹0',
  expensesCurrentMonth: '₹0',
  burnRateMonthly: '₹0',
  cashAvailable: '₹0',
  runwayMonths: 0,
  mrr: '₹0',
  arr: '₹0',
  growthPct: '0%',
  totalFundingRaised: '₹0',
  visibility: {
    revenue: 'Private',
    burn: 'Private',
    cash: 'Private',
    runway: 'Private',
    funding: 'Private',
  },
};

export interface FundingRoundHistory {
  id: string;
  round: string;
  date: string;
  amount: string;
  leadInvestor: string;
  instrument: string;
  valuation: string;
}

export const initialFundingHistory: FundingRoundHistory[] = [];

// ==========================================
// 6. DD Locker Module Data
// ==========================================
export type DDFolderType =
  | 'Corporate'
  | 'Ownership'
  | 'Financial'
  | 'Fundraising'
  | 'Legal'
  | 'Intellectual Property'
  | 'Product / Technology';

export interface DDDocument {
  id: string;
  name: string;
  folder: DDFolderType;
  fileSize: string;
  updatedDate: string;
  fileType: 'PDF' | 'XLSX' | 'DOCX';
  isConfidential: boolean;
  fileUrl?: string;
}

export const initialDDDocuments: DDDocument[] = [];

export interface DDAccessRequest {
  id: string;
  userName: string;
  userRole: string;
  organization: string;
  userType: 'Investor' | 'ESP' | 'Mentor';
  avatar: string;
  requestedDate: string;
  requestedFolders: DDFolderType[];
  status: 'Pending' | 'Approved' | 'Rejected';
}

export const initialDDAccessRequests: DDAccessRequest[] = [];

export interface DDActiveAccess {
  id: string;
  userName: string;
  organization: string;
  grantedFolders: DDFolderType[];
  dateGranted: string;
  expiryDate: string;
  status: 'Active' | 'Expired' | 'Revoked';
}

export const initialDDActiveAccess: DDActiveAccess[] = [];

export interface DDActivityLogItem {
  id: string;
  userName: string;
  organization: string;
  action: string;
  documentName: string;
  timestamp: string;
}

export const initialDDAuditLog: DDActivityLogItem[] = [];

// ==========================================
// 7. Content Management Data
// ==========================================
export interface StartupPost {
  id: string;
  title: string;
  type: 'Company Update' | 'Product Update' | 'Milestone' | 'Hiring' | 'Funding' | 'Partnership' | 'Event' | 'Article';
  content: string;
  date: string;
  status: 'Published' | 'Draft' | 'Featured';
  isFeatured: boolean;
  viewsCount: number;
  likesCount: number;
}

export const initialStartupPosts: StartupPost[] = [];

// ==========================================
// 8. Notifications Data
// ==========================================
export interface StartupNotification {
  id: string;
  category: 'Connections' | 'Messages' | 'Opportunities' | 'Investor Activity' | 'Mentorship' | 'Ask Responses' | 'DD Locker' | 'Platform Updates';
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  targetTab: string;
}

export const initialStartupNotifications: StartupNotification[] = [];

