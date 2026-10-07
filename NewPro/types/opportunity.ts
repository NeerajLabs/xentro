export type OpportunityCategory =
  | 'Funding'
  | 'Investment'
  | 'Grant'
  | 'Mentorship'
  | 'Incubation'
  | 'Acceleration'
  | 'Competition'
  | 'Challenge'
  | 'Hackathon'
  | 'Fellowship'
  | 'Internship'
  | 'Job'
  | 'Partnership'
  | 'Pilot Opportunity'
  | 'Corporate Innovation'
  | 'Research Collaboration'
  | 'Networking'
  | 'Event'
  | 'Workshop'
  | 'Training'
  | 'Learning Program'
  | 'Startup Program'
  | 'Founder Program'
  | 'Procurement'
  | 'Market Access'
  | 'Credits / Benefits'
  | 'Other';

export const OPPORTUNITY_CATEGORIES: OpportunityCategory[] = [
  'Funding',
  'Investment',
  'Grant',
  'Mentorship',
  'Incubation',
  'Acceleration',
  'Competition',
  'Challenge',
  'Hackathon',
  'Fellowship',
  'Internship',
  'Job',
  'Partnership',
  'Pilot Opportunity',
  'Corporate Innovation',
  'Research Collaboration',
  'Networking',
  'Event',
  'Workshop',
  'Training',
  'Learning Program',
  'Startup Program',
  'Founder Program',
  'Procurement',
  'Market Access',
  'Credits / Benefits',
  'Other',
];

export const CATEGORY_SUBCATEGORIES_MAP: Record<string, string[]> = {
  Investment: [
    'Angel Investment',
    'Pre-Seed Investment',
    'Seed Investment',
    'Series A',
    'Strategic Investment',
    'Venture Capital',
    'Debt',
    'Syndicate Allocation',
    'Other',
  ],
  Funding: [
    'Government Seed Fund',
    'Venture Debt',
    'Convertible Note',
    'Bridge Loan',
    'Crowdfunding',
    'Equity Crowdfunding',
    'Other',
  ],
  Grant: [
    'Government R&D Grant',
    'Non-Dilutive Grant',
    'CSR Innovation Grant',
    'Academic Research Grant',
    'Proof of Concept (PoC) Grant',
    'Commercialization Grant',
    'Other',
  ],
  Mentorship: [
    'Venture Mentorship',
    'Domain Mentorship',
    'Office Hours',
    '1:1 Mentorship',
    'Long-Term Mentorship',
    'Founder Coaching',
    'Technical Architecture Review',
    'Go-to-Market Advisory',
    'Fundraising Strategy',
    'Other',
  ],
  Incubation: [
    'Physical Incubation',
    'Virtual Incubation',
    'University Incubator',
    'Sector-Specific Lab',
    'Pre-Incubation Support',
    'Other',
  ],
  Acceleration: [
    'Seed Acceleration Cohort',
    'Scale-Up Accelerator',
    'Corporate Accelerator',
    'Cross-Border Market Access',
    'Demo Day Cohort',
    'Other',
  ],
  Competition: [
    'Startup Pitch Competition',
    'Business Plan Challenge',
    'Innovation Showcase',
    'State / National Cup',
    'Other',
  ],
  Challenge: [
    'Grand Innovation Challenge',
    'Smart City Hack',
    'Open Innovation Call',
    'Defense / Tech Challenge',
    'Other',
  ],
  Hackathon: [
    'AI & Agentic Hackathon',
    'Fintech Hackathon',
    'Web3 / Open Source',
    'Healthcare Innovation Sprint',
    'Other',
  ],
  Fellowship: [
    'Founder Fellowship',
    'DeepTech Research Fellowship',
    'Social Impact Fellowship',
    'AI Builder Fellowship',
    'Other',
  ],
  Internship: [
    'Software Engineering',
    'AI / ML Research',
    'Product Management',
    'Growth & Marketing',
    'Founder Associate',
    'Business Development',
    'Other',
  ],
  Job: [
    'Founding Engineer',
    'Full-Time Role',
    'Executive Leadership',
    'Contractor / Fractional',
    'Other',
  ],
  Partnership: [
    'Strategic Distribution',
    'Co-Development',
    'Technology Integration',
    'Channel Partnership',
    'Other',
  ],
  'Pilot Opportunity': [
    'Enterprise Paid Pilot',
    'PSU Deployment Trial',
    'Smart City Sandbox Trial',
    'Healthcare Clinical Pilot',
    'Other',
  ],
  'Corporate Innovation': [
    'MNC Proof-of-Concept',
    'Corporate Venture Scouting',
    'Vendor Onboarding Fast-Track',
    'Joint Venture Initiative',
    'Other',
  ],
  'Research Collaboration': [
    'Industry-Academia Lab',
    'Joint Patent Filing',
    'Grant-Backed R&D',
    'Technology Transfer',
    'Other',
  ],
  Event: [
    'Demo Day',
    'Investor Showcase',
    'Founder Summit',
    'Ecosystem Mixer',
    'Conference',
    'Other',
  ],
  Workshop: [
    'Hands-on Masterclass',
    'Fundraising Bootcamp',
    'Legal & Compliance Clinic',
    'Architecture Deep Dive',
    'Other',
  ],
  'Startup Program': [
    'Market Readiness Program',
    'IP & Patent Support Scheme',
    'Investor Access Program',
    'Global Launchpad',
    'Other',
  ],
  'Credits / Benefits': [
    'Cloud Computing Credits ($100k+)',
    'Dev Tools & API Credits',
    'Legal & Incorporation Credits',
    'Payment Gateway Zero MDR',
    'Other',
  ],
  Other: ['General Ecosystem Initiative', 'Community Program', 'Custom Call'],
};

export type TargetUserType =
  | 'startup'
  | 'mentor'
  | 'investor'
  | 'institution'
  | 'esp'
  | 'founder'
  | 'student'
  | 'researcher'
  | 'professional'
  | 'all';

export const TARGET_USER_OPTIONS: { id: TargetUserType; label: string; description: string }[] = [
  { id: 'startup', label: 'Startups', description: 'Early to growth stage ventures seeking capital, customers or pilot trials.' },
  { id: 'mentor', label: 'Mentors', description: 'Advisors, operators and industry leaders offering expertise.' },
  { id: 'investor', label: 'Investors', description: 'Angels, syndicates, family offices and institutional venture capital.' },
  { id: 'institution', label: 'Institutions', description: 'Government departments, universities, labs, research bodies.' },
  { id: 'esp', label: 'ESPs', description: 'Incubators, accelerators, innovation hubs and co-working labs.' },
  { id: 'founder', label: 'Founders', description: 'Individual company builders and entrepreneurs.' },
  { id: 'student', label: 'Students', description: 'Undergraduate, graduate and aspiring young builders.' },
  { id: 'researcher', label: 'Researchers', description: 'Academic scholars, PhD candidates and scientific researchers.' },
  { id: 'professional', label: 'Professionals', description: 'Domain experts, engineers, designers, executives.' },
  { id: 'all', label: 'All Xentro Users', description: 'Universal ecosystem access across all platform profiles.' },
];

export type OpportunitySourceType =
  | 'my_account'
  | 'external_org'
  | 'government'
  | 'corporate_mnc'
  | 'partner_org'
  | 'other';

export const OPPORTUNITY_SOURCE_OPTIONS: { id: OpportunitySourceType; label: string; description: string }[] = [
  { id: 'my_account', label: 'My Account / Entity', description: 'Organized and issued directly by your verified Xentro profile.' },
  { id: 'external_org', label: 'External Organization', description: 'Issued by an external partner, foundation or institution.' },
  { id: 'government', label: 'Government Opportunity', description: 'Central/State ministry, statutory agency, PSU or national scheme.' },
  { id: 'corporate_mnc', label: 'Corporate / MNC Opportunity', description: 'Enterprise challenge, pilot call or corporate venture program.' },
  { id: 'partner_org', label: 'Partner Organization', description: 'Accredited university, lab or partner innovation network.' },
  { id: 'other', label: 'Other', description: 'Third-party global ecosystem call.' },
];

export type ExternalOrgType =
  | 'Central Government'
  | 'State Government'
  | 'Government Agency'
  | 'PSU'
  | 'MNC'
  | 'Corporate'
  | 'University'
  | 'College'
  | 'School'
  | 'Incubator'
  | 'Accelerator'
  | 'Foundation'
  | 'NGO'
  | 'International Organization'
  | 'Ecosystem Organization'
  | 'Other';

export const EXTERNAL_ORG_TYPES: ExternalOrgType[] = [
  'Central Government',
  'State Government',
  'Government Agency',
  'PSU',
  'MNC',
  'Corporate',
  'University',
  'College',
  'School',
  'Incubator',
  'Accelerator',
  'Foundation',
  'NGO',
  'International Organization',
  'Ecosystem Organization',
  'Other',
];

export type ApplicantType =
  | 'Individual'
  | 'Founder'
  | 'Startup'
  | 'Mentor'
  | 'Investor'
  | 'Student'
  | 'Researcher'
  | 'Professional'
  | 'Institution'
  | 'ESP'
  | 'Registered Company'
  | 'Team'
  | 'Other';

export const APPLICANT_TYPES: ApplicantType[] = [
  'Individual',
  'Founder',
  'Startup',
  'Mentor',
  'Investor',
  'Student',
  'Researcher',
  'Professional',
  'Institution',
  'ESP',
  'Registered Company',
  'Team',
  'Other',
];

export const STARTUP_STAGES = [
  'Idea',
  'Prototype',
  'MVP',
  'Pre-Revenue',
  'Early Revenue',
  'Pre-Seed',
  'Seed',
  'Series A',
  'Growth',
  'Any Stage',
];

export const SECTOR_OPTIONS = [
  'DeepTech',
  'Enterprise AI',
  'FinTech',
  'HealthTech',
  'EdTech',
  'CleanTech / Climate',
  'AgriTech',
  'SpaceTech & Defense',
  'Hardware & Robotics',
  'Biotech & Pharma',
  'SaaS & Cloud',
  'Web3 & Crypto',
  'B2B E-commerce',
  'Consumer Tech',
  'Logistics & Supply Chain',
  'Gaming & Entertainment',
  'Semiconductors & Silicon',
  'Other',
];

export const REGISTRATION_REQUIREMENTS = [
  'Incorporation Required',
  'DPIIT Recognition Required',
  'MSME / Udyam Required',
  'GST Required',
  'Student Status Required',
  'Institution Affiliation Required',
  'Other',
];

export const BENEFIT_CATEGORIES = {
  Financial: [
    'Grant',
    'Investment',
    'Prize Money',
    'Stipend',
    'Sponsorship',
    'Revenue Opportunity',
    'Credits',
  ],
  Support: [
    'Mentorship',
    'Incubation',
    'Acceleration',
    'Training',
    'Workshops',
    'Expert Sessions',
  ],
  Access: [
    'Investor Access',
    'Corporate Access',
    'Government Access',
    'Market Access',
    'Customer Access',
    'Networking',
  ],
  Business: [
    'Pilot Opportunity',
    'Procurement Opportunity',
    'Partnership',
    'Distribution Support',
    'Business Development Support',
  ],
  Infrastructure: [
    'Office Space',
    'Co-working Space',
    'Lab Access',
    'Technology Infrastructure',
    'Cloud Credits',
    'Software Credits',
  ],
};

export const APPLICATION_REQUIREMENTS_OPTIONS = [
  'Xentro Profile',
  'Startup Profile',
  'Founder Profile',
  'Resume / CV',
  'Pitch Deck',
  'Video Pitch',
  'Business Plan',
  'Financial Statements',
  'Incorporation Certificate',
  'DPIIT Certificate',
  'MSME Certificate',
  'GST Certificate',
  'Portfolio',
  'Product Demo',
  'Website',
  'LinkedIn',
  'Proposal',
  'Research Paper',
  'Identity Document',
  'Other',
];

export interface GeographicEligibility {
  scope: 'Global' | 'Country' | 'State' | 'City' | 'Specific Region';
  country?: string;
  state?: string;
  city?: string;
  regionDetails?: string;
}

export interface CustomEligibilityCriterion {
  id: string;
  title: string;
  description: string;
}

export interface FinancialDetails {
  type?: string;
  amountType?: 'Fixed Amount' | 'Range' | 'Not Disclosed';
  amount?: number | string;
  minimumAmount?: number | string;
  maximumAmount?: number | string;
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP' | 'Other';
  equityType?: 'No Equity' | 'Equity Required' | 'Not Applicable';
  minimumEquity?: number;
  maximumEquity?: number;
  additionalTerms?: string;
}

export interface OpportunityVenue {
  venueName?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface ApplicationStep {
  stepNumber: number;
  title: string;
  description: string;
}

export interface ImportantDate {
  id: string;
  name: string;
  date: string;
  time?: string;
}

export interface OpportunityLink {
  id: string;
  label: string;
  url: string;
}

export interface OpportunityAttachment {
  id: string;
  name: string;
  size?: string;
  type?: string;
  url: string;
}

export interface OpportunityContact {
  type: 'xentro' | 'email' | 'phone';
  email?: string;
  phone?: string;
  contactName?: string;
}

export interface ExternalOrganization {
  name: string;
  logo?: string;
  organizationType: string;
  ownershipType?: 'government' | 'private';
  country?: string;
  state?: string;
  city?: string;
  website?: string;
  officialOpportunityUrl?: string;
}

export interface OpportunityVerification {
  officialSourceUrl?: string;
  officialApplicationUrl?: string;
  sourcePublicationDate?: string;
  lastVerifiedDate?: string;
  verifiedBy?: string;
  status?: 'Official' | 'Verified' | 'Needs Review' | 'Expired';
}

export type OpportunityStatus = 'draft' | 'upcoming' | 'open' | 'closed' | 'rolling' | 'archived';

export type ApplicantStatus =
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview'
  | 'Selected'
  | 'Waitlisted'
  | 'Rejected'
  | 'Withdrawn';

export interface OpportunityApplicant {
  id: string;
  opportunityId: string;
  applicantId: string;
  applicantName: string;
  applicantAvatar?: string;
  applicantType: string;
  organizationName?: string;
  email: string;
  phone?: string;
  location?: string;
  applicationDate: string;
  status: ApplicantStatus;
  notes?: string;
  proposalPitch?: string;
  submittedDocuments?: string[];
  reviewedBy?: string;
}

export interface Opportunity {
  id: string;

  publisherAccountId: string;
  publisherEntityId?: string;
  publisherType: 'Personal Account' | 'Entity Account' | 'Xentro Admin';
  publisherName?: string;
  publisherRoleTitle?: string;
  publisherAvatar?: string;
  publisherOrgName?: string;
  publisherVerified?: boolean;

  targetUserTypes: string[];
  visibilityScope: 'Selected User Types Only' | 'All Xentro Users' | 'Connections Only' | 'Invite Only';

  sourceType: OpportunitySourceType;
  externalOrganization?: ExternalOrganization;

  title: string;
  category: OpportunityCategory | string;
  subcategory?: string;

  shortDescription: string;
  fullDescription: string;
  objective?: string;

  applicantTypes: string[];
  industries: string[];
  startupStages?: string[];

  geographicEligibility?: GeographicEligibility;
  registrationRequirements?: string[];
  customEligibility?: CustomEligibilityCriterion[];

  benefits: string[];
  financialDetails?: FinancialDetails;

  participationMode: 'Online' | 'Offline' | 'Hybrid';
  venue?: OpportunityVenue;
  opportunityScope?: 'Local' | 'State' | 'National' | 'International' | 'Global';

  applicationMethod:
    | 'Apply Through Xentro'
    | 'External Application'
    | 'Contact Publisher'
    | 'Registration Only'
    | 'Invite Only'
    | 'No Application Required';
  applicationUrl?: string;

  applicationSteps?: ApplicationStep[];
  applicationRequirements?: string[];

  applicationsOpen?: string;
  applicationDeadline?: string;
  rollingApplications?: boolean;

  opportunityStartDate?: string;
  opportunityEndDate?: string;

  importantDates?: ImportantDate[];

  frequency?:
    | 'One-Time'
    | 'Weekly'
    | 'Monthly'
    | 'Quarterly'
    | 'Half-Yearly'
    | 'Annual'
    | 'Rolling'
    | 'Recurring'
    | 'Other';
  recurrenceDetails?: string;

  capacityType?: 'Limited' | 'Unlimited' | 'Invite Only';
  availableSlots?: number;
  slotLabel?: string;

  contact?: OpportunityContact;

  links?: OpportunityLink[];

  coverImage?: string;
  logo?: string;
  attachments?: OpportunityAttachment[];

  acceptApplicationsThroughXentro?: boolean;

  verification?: OpportunityVerification;

  status: OpportunityStatus;

  createdAt: string;
  updatedAt: string;

  applicantsCount?: number;
}
