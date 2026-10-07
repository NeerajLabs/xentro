export type ESPType =
  | 'Pre-Incubator'
  | 'Incubator'
  | 'Accelerator'
  | 'Innovation Hub'
  | 'Entrepreneurship Cell'
  | 'Startup Support Organization'
  | 'Government Startup Agency'
  | 'Corporate Innovation Program'
  | 'Research / Technology Commercialization Centre'
  | 'Ecosystem Organization';

export type ProgramType =
  | 'Pre-Incubation'
  | 'Incubation'
  | 'Accelerator'
  | 'Fellowship'
  | 'Bootcamp'
  | 'Grant'
  | 'Challenge'
  | 'Hackathon'
  | 'Investor Connect'
  | 'Demo Day'
  | 'Startup Competition'
  | 'Corporate Innovation Program';

export type ProgramStatus = 'Open' | 'Upcoming' | 'Closed' | 'Rolling';

export type ServiceCategory =
  | 'Mentorship'
  | 'Funding Support'
  | 'Business Support'
  | 'Growth Support'
  | 'Infrastructure';

export type ServiceCostModel = 'Free' | 'Subsidized' | 'Paid';

export type StartupStage =
  | 'Idea'
  | 'Pre-Incubation'
  | 'MVP'
  | 'Pre-Seed'
  | 'Seed'
  | 'Early Revenue'
  | 'Growth';

export type PortfolioStatus =
  | 'Active'
  | 'Graduated'
  | 'Alumni'
  | 'Acquired'
  | 'Exited';

export interface ESPLocation {
  id: string;
  name: string;
  type: 'Headquarters' | 'Campus' | 'Branch' | 'Incubation Centre' | 'Innovation Centre' | 'Other' | string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  isPrimaryCampus?: boolean;
  isHeadquarters?: boolean;
}

export type ESPVerificationStatus =
  | 'verified'
  | 'pending'
  | 'restricted'
  | {
      isVerifiedESP: boolean;
      isInstitutionVerified: boolean;
      isDomainVerified: boolean;
      isRepVerified: boolean;
      lastVerifiedDate?: string;
    };

export interface ESPOrganizationHierarchy {
  parentEntity?: string;
  parentInstitution?: string;
  relationshipType?: string;
  childUnits?: string[];
  associatedUnits?: string[];
}

export interface ESPIdentity {
  name: string;
  logo: string;
  bannerUrl?: string;
  type: ESPType;
  foundedYear: number;
  headquarters: string;
  branches?: string[];
  website: string;
  linkedin: string;
  contactEmail?: string;
  contactPhone?: string;
  isVerified: boolean;
  primarySectors: string[];
  stagesSupported: StartupStage[];
  tagline: string;
  shortDescription: string;
  coreMission: string;
  geographicFocus: string[];
  supportAreas: string[];
  // Enhanced Production Fields
  verificationStatus?: ESPVerificationStatus;
  organizationTypeDetails?: string;
  officialEmail?: string;
  parentInstitution?: string;
  parentEntity?: string;
  entityRelationshipType?: string;
  associatedUnits?: string[];
  locations?: ESPLocation[];
  hierarchy?: ESPOrganizationHierarchy;
}

export interface ESPProgram {
  id: string;
  name: string;
  type: ProgramType;
  category: 'active' | 'upcoming' | 'past';
  status: ProgramStatus;
  startupStage: string;
  sectors: string[];
  locationMode: 'Hybrid' | 'On-Campus' | 'Virtual';
  duration: string;
  applicationDeadline: string;
  cohortSize: string;
  fundingGrantAvailable: string;
  equityRequirement: string;
  shortDescription: string;
  fullDetails?: string;
  eligibility?: string[];
}

export interface ESPService {
  id: string;
  name: string;
  category: ServiceCategory;
  description: string;
  availability: string;
  costModel: ServiceCostModel;
  eligibility: string;
  deliveryMode: string;
}

export type ESPRelationshipType =
  | 'Pre-Incubated'
  | 'Incubated'
  | 'Accelerated'
  | 'Portfolio Startup'
  | 'Program Participant'
  | 'Alumni Startup'
  | 'Institution-Supported Startup';

export interface ESPPortfolioStartup {
  id: string;
  name: string;
  logo: string;
  industry: string;
  stage: string;
  cohortProgram: string;
  year: number;
  founders: string;
  currentStatus: PortfolioStatus;
  fundingStage: string;
  fundingRaised?: string;
  xentroStartupId?: string;
  // Enhanced Production Relationships & Endorsements
  relationshipType?: ESPRelationshipType;
  relationshipStatus?: 'Active' | 'Graduated' | 'Alumni' | 'Exited' | 'Suspended';
  isEndorsed?: boolean;
  endorsementStatus?: 'Active' | 'Pending' | 'Expiring Soon' | 'Expired' | 'Revoked' | 'None' | 'active' | 'pending' | 'expiring_soon' | 'expired' | 'revoked';
  endorsementDetails?: {
    id?: string;
    status?: 'Active' | 'Pending' | 'Expiring Soon' | 'Expired' | 'Revoked' | 'active';
    startDate?: string;
    endDate?: string;
    entitlement?: string;
    entitlementGranted?: boolean;
    endorsementDate?: string;
    expiryDate?: string;
    note?: string;
    daysRemaining?: number;
  };
  programName?: string;
  cohortName?: string;
}

export interface ESPImpactStats {
  startupsSupported: number;
  activeStartups: number;
  alumniStartups: number;
  fundingRaised: string;
  grantsSecured: string;
  patentsFiled: number;
  jobsCreated: string;
  womenLedCount: number;
  corporatePilots: number;
  governmentPartnerships: number;
  cohortsCompleted: number;
  mentorshipHours: string;
}

export interface ESPProgramOutcome {
  id: string;
  programName: string;
  cohortYear: string;
  startupsSelected: number;
  completed: number;
  fundedCount: number;
  cumulativeFunding: string;
  corporatePilots: number;
}

export interface ESPSDGImpact {
  goalNumber: number;
  title: string;
  description: string;
}

export interface ESPTeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
  expertise: string[];
  bio: string;
  linkedin?: string;
  xentroProfile?: string;
}

export interface ESPAssociatedMentor {
  id: string;
  name: string;
  avatar: string;
  title: string;
  organization: string;
  expertise: string[];
  xentroMentorId?: string;
}

export interface ESPAssociatedInvestor {
  id: string;
  name: string;
  logo: string;
  type: string;
  ticketSize: string;
  xentroInvestorId?: string;
}

export interface ESPEcosystemPartner {
  id: string;
  name: string;
  logo?: string;
  category:
    | 'Universities'
    | 'Corporates'
    | 'Government Agencies'
    | 'Venture Funds'
    | 'Accelerators'
    | 'Technology Partners'
    | 'Industry Bodies';
}

export interface ESPContentItem {
  id: string;
  type:
    | 'Post'
    | 'Announcement'
    | 'Event'
    | 'Program Update'
    | 'Article'
    | 'Founder Story'
    | 'Report'
    | 'Funding Announcement';
  title: string;
  date: string;
  content: string;
  mediaUrl?: string;
  eventDetails?: {
    date: string;
    location: string;
    mode: string;
    registrationStatus: 'Open' | 'Closed' | 'Waitlist';
    registrationLink?: string;
  };
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
}

export interface FullESPProfile {
  id: string;
  identity: ESPIdentity;
  programs: ESPProgram[];
  services: ESPService[];
  portfolio: ESPPortfolioStartup[];
  impact: {
    stats: ESPImpactStats;
    programOutcomes: ESPProgramOutcome[];
    sdgs: ESPSDGImpact[];
  };
  teamAndEcosystem: {
    team: ESPTeamMember[];
    associatedMentors: ESPAssociatedMentor[];
    associatedInvestors: ESPAssociatedInvestor[];
    partners: ESPEcosystemPartner[];
  };
  content: ESPContentItem[];
}

// =========================================================================
// ESP WORKSPACE & DASHBOARD PRODUCTION TYPES
// =========================================================================

export type ESPMemberRole =
  | 'Super Admin'
  | 'Primary Admin / Owner'
  | 'Institution Admin'
  | 'Incubator Admin'
  | 'Program Manager'
  | 'Portfolio Manager'
  | 'Mentor Coordinator'
  | 'Investment Lead'
  | 'Faculty Coordinator'
  | 'Faculty / Coordinator'
  | 'Cohort Reviewer'
  | 'Workspace Manager'
  | 'Content Manager'
  | 'Finance / Billing'
  | 'Staff'
  | 'Student Entrepreneur'
  | 'Student'
  | 'View-Only Auditor'
  | 'Viewer'
  | string;

export type ESPAccountStatus = 'Active' | 'Pending' | 'Removed' | 'active' | 'pending' | 'removed';

export type ESPIdentityVerificationStatus =
  | 'Identity Verified'
  | 'Verification Pending'
  | 'Restricted';

export interface ESPMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: ESPMemberRole;
  roleId?: string;
  department?: string;
  designation?: string;
  accountStatus?: ESPAccountStatus;
  status?: 'active' | 'pending' | 'removed';
  identityVerificationStatus?: ESPIdentityVerificationStatus;
  joinedDate?: string;
  joinedAt?: string;
  isPublicTeam?: boolean;
  identityVerified?: boolean;
  verificationBadge?: string;
  studentPrivacyProtected?: boolean;
}

export interface ESPInvitation {
  id: string;
  name?: string;
  email: string;
  assignedRole?: ESPMemberRole;
  role?: string;
  department?: string;
  designation?: string;
  invitedBy?: string;
  date?: string;
  invitedAt?: string;
  expiry?: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired' | 'Revoked' | string;
}

export type ESPPermissionGroup =
  | 'ENTITY'
  | 'MEMBERS'
  | 'PROFILE'
  | 'PROGRAMS'
  | 'OPPORTUNITIES'
  | 'PORTFOLIO'
  | 'CONTENT'
  | 'FINANCE'
  | 'ANALYTICS';

export interface ESPPermission {
  id: string;
  name: string;
  group: ESPPermissionGroup;
  description: string;
}

export interface ESPRole {
  id: string;
  name: ESPMemberRole;
  description: string;
  permissions: string[];
  memberCount: number;
  assignedCount?: number;
  level?: number;
  isSystem?: boolean;
  isCustom?: boolean;
}

export type ESPEndorsementStatus =
  | 'Pending'
  | 'Active'
  | 'Expiring Soon'
  | 'Expired'
  | 'Revoked'
  | 'Declined'
  | 'Suspended'
  | 'Completed'
  | 'active'
  | 'pending'
  | 'expiring_soon'
  | 'expired'
  | 'revoked';

export interface ESPEndorsementHistory {
  action: string;
  timestamp: string;
  actor?: string;
  note?: string;
}

export interface ESPEndorsement {
  id: string;
  startupId: string;
  startupName: string;
  startupLogo: string;
  founderName?: string;
  founderEmail?: string;
  relationship?: ESPRelationshipType;
  relationshipType?: ESPRelationshipType;
  programId?: string;
  programName: string;
  cohortId?: string;
  cohortName?: string;
  status: ESPEndorsementStatus;
  startDate?: string;
  endDate?: string;
  issuedAt?: string;
  expiresAt?: string;
  entitlement?: string;
  endorsedBy?: string;
  startupProEntitlementGranted?: boolean;
  verificationChecklist?: {
    institutionalAffiliationVerified?: boolean;
    foundersIdentityVerified?: boolean;
    governanceAndComplianceCleared?: boolean;
    resolutionApproved?: boolean;
  };
  notes?: string;
  daysRemaining?: number;
  history?: ESPEndorsementHistory[];
}

export type ESPSubscriptionStatus =
  | 'Trial'
  | 'Active'
  | 'Payment Due'
  | 'Past Due'
  | 'Grace Period'
  | 'Suspended'
  | 'Cancelled'
  | 'Complimentary'
  | 'Partner / Sponsored';

export interface ESPBillingOverview {
  currentPlan?: string;
  subscriptionStatus?: ESPSubscriptionStatus;
  billingCycle?: 'Monthly' | 'Annual' | string;
  nextBillingDate?: string;
  nextAmountDue?: string;
  outstandingBalance?: string;
  lastPaymentDate?: string;
  lastPaymentAmount?: string;
  paymentStatus?: string;
  activeEndorsementsCount?: number;
  maxEndorsementsLimit?: number;
  remainingEndorsements?: number;
  renewalDate?: string;
}

export interface ESPSubscriptionDetails {
  planName: string;
  tier?: string;
  startDate?: string;
  renewalDate?: string;
  nextBillingDate?: string;
  billingCycle?: string;
  status?: ESPSubscriptionStatus;
  basePrice?: string;
  price?: string;
  discount?: string;
  complimentaryPeriod?: string;
  partnershipPricing?: string;
  taxInfo?: string;
  finalPayableAmount?: string;
  features?: string[];
}

export type ESPInvoiceStatus =
  | 'Paid'
  | 'Pending'
  | 'Overdue'
  | 'Failed'
  | 'Cancelled'
  | 'Refunded'
  | 'Partially Paid';

export interface ESPInvoice {
  id: string;
  invoiceNumber: string;
  date?: string;
  issuedDate?: string;
  billingPeriod?: string;
  period?: string;
  plan?: string;
  subtotal?: string;
  tax?: string;
  total?: string;
  amount?: string;
  status: ESPInvoiceStatus;
  dueDate?: string;
  downloadUrl?: string;
}

export type ESPPaymentStatus =
  | 'Successful'
  | 'Pending'
  | 'Failed'
  | 'Refunded'
  | 'Partially Refunded';

export interface ESPPayment {
  id: string;
  paymentId?: string;
  date: string;
  invoiceNumber?: string;
  amount: string;
  paymentMethod?: string;
  method?: string;
  txRef?: string;
  referenceNumber?: string;
  status: ESPPaymentStatus;
  receiptNumber?: string;
}

export interface ESPPaymentMethod {
  id: string;
  type: 'Card' | 'UPI' | 'Net Banking' | 'Bank Transfer' | 'card' | 'upi' | 'net_banking' | string;
  maskedDetails?: string;
  isDefault: boolean;
  status?: 'Active' | 'Expiring' | 'Expired';
  addedDate?: string;
  expiryDate?: string;
  brand?: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface ESPBillingDetails {
  legalOrgName?: string;
  legalEntityName?: string;
  contactName?: string;
  email?: string;
  financeEmail?: string;
  phone?: string;
  address: string;
  gstin: string;
  panTaxId?: string;
  panNumber?: string;
  state: string;
  country: string;
  pinCode?: string;
  postalCode?: string;
  city?: string;
}

export interface ESPOwnershipSettings {
  primaryOwner?: {
    name: string;
    email: string;
    avatar: string;
    designation: string;
    since: string;
  };
  authorizedRepresentative?: {
    name: string;
    email: string;
    designation: string;
    phone: string;
  };
  ownershipStatus?: 'Verified & Active' | 'Transfer Pending';
  currentOwnerName?: string;
  currentOwnerEmail?: string;
  currentOwnerRole?: string;
  ownershipAssignedDate?: string;
  transferPending?: boolean;
  transferTargetEmail?: string;
}

export interface ESPVerificationSettings {
  institutionVerified?: boolean;
  domainVerified?: boolean;
  repVerified?: boolean;
  officialDomain?: string;
  officialEmail?: string;
  lastVerifiedDate?: string;
  status?: 'Verified' | 'Pending Review' | 'Action Required';
  registrationNumber?: string;
  dpiitRecognitionNumber?: string;
  authorizedSignatory?: string;
}

export interface ESPEntitlementAllocation {
  activeEndorsements?: number;
  eligibleLimit?: number;
  remainingLimit?: number;
  features?: Array<{ name: string; enabled: boolean; description: string }>;
  complimentaryBenefits?: string[];
  endorsementsUsed?: number;
  endorsementsLimit?: number;
  memberSeatsUsed?: number;
  memberSeatsLimit?: number;
  studentSeatsUsed?: number;
  studentSeatsLimit?: number;
}

export interface ESPActivityLogItem {
  id: string;
  action: string;
  category?: 'Billing' | 'Endorsement' | 'Members' | 'Roles' | 'Settings' | 'Verification' | 'ownership' | string;
  actorName: string;
  actorRole: string;
  timestamp: string;
  details?: string;
}

export interface ESPOpportunity {
  id: string;
  title: string;
  category: 'Grant' | 'Corporate Challenge' | 'Incubation Call' | 'Accelerator Call' | 'Fellowship';
  grantAmount?: string;
  deadline: string;
  targetStages: string[];
  targetSectors: string[];
  status: 'Active' | 'Draft' | 'Closed';
  description: string;
  applicantsCount: number;
  equityRequirement?: string;
}

export interface ESPEvent {
  id: string;
  title: string;
  type: 'Workshop' | 'Demo Day' | 'Masterclass' | 'Pitch Night' | 'Networking' | 'Hackathon';
  date: string;
  time: string;
  location: string;
  format: 'Hybrid' | 'In-Person' | 'Virtual';
  rsvpsCount: number;
  maxCapacity: number;
  status: 'Upcoming' | 'Live' | 'Completed';
  description: string;
  speakers?: string[];
}

export interface ESPApplication {
  id: string;
  startupName: string;
  founderName: string;
  founderEmail: string;
  programId: string;
  programName: string;
  stage: string;
  sector: string;
  appliedDate: string;
  status: 'Under Review' | 'Shortlisted' | 'Interviewed' | 'Accepted' | 'Rejected';
  score?: number;
  pitchDeckUrl?: string;
}

export interface ESPParticipant {
  id: string;
  startupName: string;
  founderName: string;
  founderEmail: string;
  programName: string;
  cohort: string;
  stage: string;
  assignedMentor?: string;
  milestoneProgress: number;
  status: 'Active' | 'Graduated' | 'On Hold';
}

export interface ESPWorkspaceNotification {
  id: string;
  title: string;
  description: string;
  category: 'All' | 'Endorsements' | 'Applications' | 'Billing' | 'Compliance' | 'System';
  timestamp: string;
  read: boolean;
  severity?: 'info' | 'warning' | 'success' | 'error';
}
// =========================================================================
// SECTION 6: CONCEPTUAL DOMAIN OBJECT ALIASES & INTERFACES
// =========================================================================

export type ESP_ENTITY = {
  id: string;
  name: string;
  type: ESPType;
  registrationNumber?: string;
  dpiitRecognition?: string;
  isVerified: boolean;
  officialDomain: string;
  officialEmail: string;
  headquartersId?: string;
  foundedYear: number;
};

export type ESP_PROFILE = FullESPProfile;
export type ENTITY_MEMBERSHIP = ESPMember;
export type ROLE = ESPRole;
export type PERMISSION = ESPPermission;
export type INVITATION = ESPInvitation;
export type ESP_STARTUP_RELATIONSHIP = ESPPortfolioStartup;
export type ESP_ENDORSEMENT = ESPEndorsement;
export type ENTITLEMENT = ESPEntitlementAllocation;
export type SUBSCRIPTION = ESPSubscriptionDetails;
export type BILLING_ACCOUNT = ESPBillingOverview & { details?: ESPBillingDetails };
export type INVOICE = ESPInvoice;
export type PAYMENT = ESPPayment;
export type PAYMENT_METHOD_REFERENCE = ESPPaymentMethod;
export type LOCATION = ESPLocation;
export type ENTITY_RELATIONSHIP = ESPOrganizationHierarchy;
export type VERIFICATION = ESPVerificationSettings;
export type AUDIT_LOG = ESPActivityLogItem;

export * from './espPublicTeam';
