export type AdminRole =
  | 'Super Admin'
  | 'Master Admin'
  | 'Operations Admin'
  | 'Identity Verification Admin'
  | 'Entity Verification Admin'
  | 'Startup Operations'
  | 'Mentor Operations'
  | 'Investor Operations'
  | 'ESP Operations'
  | 'Opportunity Manager'
  | 'Mentorship Operations'
  | 'Finance Admin'
  | 'Billing Admin'
  | 'Support Admin'
  | 'Support Agent'
  | 'Trust & Safety Admin'
  | 'Content Moderator'
  | 'Analytics Viewer'
  | 'Technical Admin'
  | 'Security Admin'
  | 'Compliance Admin'
  | 'Read-Only Auditor'
  | 'System Administrator'
  | 'Verification Admin' // Legacy alias for Identity/Entity verification
  | 'Opportunities Manager' // Legacy alias
  | 'ESP Manager'; // Backwards compatibility

export type AdminPermission =
  | 'accounts.read'
  | 'accounts.manage'
  | 'entities.read'
  | 'entities.manage'
  | 'workspaces.read'
  | 'workspaces.manage'
  | 'verification.read'
  | 'verification.review'
  | 'identity_verification.review' // Strictly controlled permission for reviewing sensitive identity docs
  | 'memberships.read'
  | 'memberships.manage'
  | 'ownership.read'
  | 'ownership.manage'
  | 'roles.read'
  | 'roles.manage'
  | 'relationships.read'
  | 'relationships.manage'
  | 'opportunities.read'
  | 'opportunities.manage'
  | 'programs.read'
  | 'programs.manage'
  | 'mentorship.read'
  | 'mentorship.manage'
  | 'meetings.read'
  | 'content.read'
  | 'content.moderate'
  | 'documents.read'
  | 'documents.manage'
  | 'billing.read'
  | 'billing.manage'
  | 'payments.read'
  | 'payments.manage'
  | 'refunds.manage'
  | 'payouts.manage'
  | 'support.read'
  | 'support.manage'
  | 'safety.read'
  | 'safety.manage'
  | 'analytics.read'
  | 'configuration.manage'
  | 'feature_flags.manage'
  | 'audit_logs.read'
  | 'admin_team.manage';

export interface AdminSession {
  employeeId: string;
  name: string;
  role: AdminRole;
  department: string;
  permissions: AdminPermission[];
  token: string;
  expiresAt: string;
}

// -------------------------------------------------------------
// Personal Accounts (Human beings in the Xentro ecosystem)
// -------------------------------------------------------------
export type ParticipationMode =
  | 'Explorer'
  | 'Mentor'
  | 'Individual Investor'
  | 'Founder @ Startup'
  | 'Partner @ VC'
  | 'Member @ ESP';

export type IdentityVerificationStatus =
  | 'Not Submitted'
  | 'Pending'
  | 'Under Review'
  | 'Verified'
  | 'Failed'
  | 'Resubmission Required'
  | 'Restricted';

export interface AdminPersonalAccount {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  identityStatus: IdentityVerificationStatus;
  participationModes: ParticipationMode[];
  entityMemberships: {
    entityId: string;
    entityName: string;
    entityType: 'Startup' | 'ESP' | 'Investor Organization';
    role: string;
  }[];
  accountStatus: 'Active' | 'Restricted' | 'Suspended' | 'Deactivated' | 'Archived';
  createdDate: string;
  lastActive: string;
  connectionsCount: number;
  bio?: string;
}

// -------------------------------------------------------------
// Entity Accounts (Organizations: Startups, ESPs, Investor Orgs)
// -------------------------------------------------------------
export type EntityType = 'Startup' | 'ESP' | 'Investor Organization';

export interface AdminEntityAccount {
  id: string;
  name: string;
  type: EntityType;
  verificationStatus: 'Verified' | 'Pending' | 'Under Review' | 'Needs Information' | 'Unverified' | 'Restricted';
  primaryOwner: {
    id: string;
    name: string;
    email: string;
  };
  memberCount: number;
  officialEmail: string;
  profileStatus: 'Public' | 'Limited' | 'Private' | 'Ghost Mode';
  subscriptionTier: string;
  entitlementSource: string;
  createdDate: string;
  status: 'Active' | 'Restricted' | 'Suspended' | 'Archived';
  domain?: string;
  location?: string;
}

// -------------------------------------------------------------
// Workspaces (Context isolation for users)
// -------------------------------------------------------------
export type WorkspaceType =
  | 'Personal'
  | 'Individual Investor'
  | 'Startup Entity'
  | 'Investor Organization'
  | 'ESP';

export interface AdminWorkspace {
  id: string;
  type: WorkspaceType;
  entityName: string;
  userId: string;
  userName: string;
  role: string;
  permissionsCount: number;
  status: 'Active' | 'Suspended' | 'Archived';
  createdDate: string;
}

// -------------------------------------------------------------
// Ecosystem Domain Records
// -------------------------------------------------------------
export interface AdminStartupRecord {
  id: string;
  name: string;
  legalName: string;
  stage: string;
  sector: string;
  location: string;
  verificationStatus: 'Verified' | 'Under Review' | 'Pending' | 'Needs Information';
  visibility: 'Public' | 'Limited' | 'Private' | 'Ghost Mode';
  endorsements: {
    espName: string;
    type: string;
    program: string;
  }[];
  entitlementTier: string;
  subscriptionPlan: string;
  founderName: string;
  founderEmail: string;
  mrr?: string;
  arr?: string;
  askAmount?: string;
  valuation?: string;
  ddLockerFilesCount: number;
  status: 'Active' | 'Restricted' | 'Suspended' | 'Archived';
  createdDate: string;
}

export interface AdminMentorRecord {
  id: string;
  name: string;
  headline: string;
  expertise: string[];
  hourlyRateUSD: number;
  verificationStatus: 'Verified' | 'Pending' | 'Under Review';
  activeMentorshipsCount: number;
  completedSessionsCount: number;
  grossEarningsUSD: number;
  netEarningsUSD: number;
  commissionPaidUSD: number;
  pendingPayoutUSD: number;
  rating: number;
  email: string;
  status: 'Active' | 'Restricted' | 'Suspended';
}

export interface AdminInvestorRecord {
  id: string;
  name: string;
  investorType: 'Individual Angel' | 'Investor Organization';
  firmName?: string;
  roleInFirm?: string;
  aum?: string;
  checkSizeRange: string;
  sectors: string[];
  activePortfolioCount: number;
  totalInvestedUSD: string;
  dealFlowPipelineCount: number;
  verificationStatus: 'Verified' | 'Pending' | 'Under Review';
  subscriptionTier: string;
  email: string;
  status: 'Active' | 'Restricted' | 'Suspended';
}

export interface AdminEspRecord {
  id: string;
  name: string;
  institutionType:
    | 'Incubator'
    | 'Accelerator'
    | 'University Innovation Center'
    | 'State Innovation Mission'
    | 'Corporate Studio';
  location: string;
  officialEmail: string;
  domain: string;
  authorizedRep: {
    name: string;
    designation: string;
    email: string;
  };
  verificationStatus: 'Requested' | 'Under Review' | 'Verified' | 'Restricted' | 'Suspended';
  activeCohortsCount: number;
  supportedStartupsCount: number;
  activeEndorsementsCount: number;
  status: 'Active' | 'Under Review' | 'Restricted' | 'Suspended';
}

// -------------------------------------------------------------
// Access & Trust: Verification Centre
// -------------------------------------------------------------
export type VerificationQueueType =
  | 'Personal Identity'
  | 'Startup'
  | 'Mentor'
  | 'Individual Investor'
  | 'Investor Organization'
  | 'ESP'
  | 'Domain Verification'
  | 'Authorized Representative';

export interface AdminVerificationCase {
  id: string;
  subjectName: string;
  subjectType: VerificationQueueType;
  entityId: string;
  submissionDate: string;
  status:
    | 'Not Submitted'
    | 'Pending'
    | 'Under Review'
    | 'Verified'
    | 'Failed'
    | 'Resubmission Required'
    | 'Reverification Required'
    | 'Restricted';
  reviewer?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  documents: {
    name: string;
    type: string;
    size: string;
    date: string;
    isRestrictedIdentityDoc: boolean; // Flag for Aadhaar/Govt ID docs requiring special review permission
  }[];
  notes?: string[];
}

// -------------------------------------------------------------
// Memberships, Ownership & Invitations
// -------------------------------------------------------------
export interface AdminEntityMembership {
  id: string;
  personName: string;
  personEmail: string;
  entityId: string;
  entityName: string;
  entityType: EntityType;
  role: string;
  permissionSet: string[];
  status: 'Invited' | 'Pending' | 'Active' | 'Suspended' | 'Removed' | 'Expired' | 'Revoked';
  joinedDate: string;
  invitedBy: string;
}

export interface AdminOwnershipRecord {
  entityId: string;
  entityName: string;
  entityType: EntityType;
  currentOwnerName: string;
  currentOwnerEmail: string;
  assignedDate: string;
  disputeStatus: 'None' | 'Disputed' | 'Pending Transfer' | 'Resolved';
}

export interface AdminInvitationRecord {
  id: string;
  inviterName: string;
  inviteeEmail: string;
  entityName: string;
  entityType: EntityType;
  role: string;
  createdDate: string;
  expiresDate: string;
  status: 'Pending' | 'Accepted' | 'Declined' | 'Expired' | 'Revoked';
}

// -------------------------------------------------------------
// Relationships & Graph
// -------------------------------------------------------------
export type EcosystemRelationshipType =
  | 'Follows'
  | 'Connected To'
  | 'Member Of'
  | 'Founder Of'
  | 'Mentors'
  | 'Invested In'
  | 'Portfolio Of'
  | 'Endorsed By'
  | 'Participates In'
  | 'Incubated By'
  | 'Accelerated By';

export interface AdminRelationshipRecord {
  id: string;
  sourceId: string;
  sourceName: string;
  sourceType: string;
  targetId: string;
  targetName: string;
  targetType: string;
  relationshipType: EcosystemRelationshipType;
  status: 'Active' | 'Pending' | 'Terminated';
  createdDate: string;
}

export interface AdminMentorshipRecord {
  id: string;
  mentorName: string;
  startupName: string;
  founderName: string;
  packageName: string;
  durationMonths: number;
  priceUSD: number;
  commissionPercent: number;
  xentroCommissionUSD: number;
  netMentorAmountUSD: number;
  startDate: string;
  endDate: string;
  status:
    | 'Requests'
    | 'Awaiting Decision'
    | 'Awaiting Payment'
    | 'Mentorship Activated'
    | 'Ending Soon'
    | 'Completed'
    | 'Cancelled'
    | 'Disputed';
  paymentStatus: 'Unpaid' | 'Escrow Paid' | 'Settled' | 'Refunded';
  nextMeetingDate?: string;
  disputeNotes?: string;
}

export interface AdminEndorsementRecord {
  id: string;
  startupName: string;
  espName: string;
  relationshipType:
    | 'Pre-Incubated'
    | 'Incubated'
    | 'Accelerated'
    | 'Portfolio Startup'
    | 'Program Participant'
    | 'Alumni Startup'
    | 'Institution-Supported Startup';
  programCohort: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Active' | 'Expiring Soon' | 'Expired' | 'Revoked' | 'Rejected';
  entitlementEligibility: boolean;
  entitlementGranted: boolean;
  reviewedBy?: string;
}

// -------------------------------------------------------------
// Billing, Finance & Entitlements
// -------------------------------------------------------------
export interface AdminFinanceSummary {
  mrrUSD: number;
  arrUSD: number;
  grossRevenueUSD: number;
  netRevenueUSD: number;
  startupSubRevenueUSD: number;
  investorSubRevenueUSD: number;
  espRevenueUSD: number;
  mentorSessionGMVUSD: number;
  mentorshipGMVUSD: number;
  totalCommissionUSD: number;
  pendingPayoutsUSD: number;
  totalRefundsUSD: number;
  failedPaymentsCount: number;
}

export interface AdminSubscription {
  id: string;
  customerName: string;
  workspaceType: string;
  customerType: 'Startup' | 'Individual Investor' | 'Investor Organization' | 'ESP';
  planName: string;
  billingCycle: 'Monthly' | 'Quarterly' | 'Annual';
  priceUSD: number;
  startDate: string;
  nextBillingDate: string;
  renewalState: 'Auto-Renew' | 'Manual' | 'Cancelling';
  paymentStatus: 'Paid' | 'Retrying' | 'Failed';
  status: 'Trial' | 'Active' | 'Past Due' | 'Payment Failed' | 'Paused' | 'Cancelled' | 'Expired' | 'Complimentary';
}

export type EntitlementAccessSource =
  | 'Paid Subscription'
  | 'ESP Endorsement'
  | 'Xentro Partnership'
  | 'Complimentary Access'
  | 'Promotional Access'
  | 'Administrative Grant';

export interface AdminEntitlementRecord {
  id: string;
  subjectName: string;
  workspaceId: string;
  source: EntitlementAccessSource;
  tier: string;
  featuresGranted: string[];
  status: 'Active' | 'Expired' | 'Revoked' | 'Pending Activation';
  startDate: string;
  expiryDate: string;
  grantedBy: string;
  auditNotes?: string;
}

export interface AdminPaymentTransaction {
  id: string;
  providerRef: string;
  customerName: string;
  workspace: string;
  amountUSD: number;
  currency: string;
  paymentMethodMasked: string; // e.g. "Mastercard •••• 9082" - zero raw credentials
  category: 'Subscription' | 'Mentorship' | 'Mentor Session' | 'Platform Fee';
  status: 'Succeeded' | 'Pending' | 'Failed' | 'Refunded';
  commissionUSD: number;
  timestamp: string;
}

export interface AdminPayoutRecord {
  id: string;
  recipientName: string;
  recipientRole: 'Mentor' | 'Partner';
  amountUSD: number;
  source: 'Mentor Session GMV' | 'Mentorship Escrow Settlement';
  providerRef: string;
  requestedDate: string;
  processedDate?: string;
  status: 'Pending' | 'Processing' | 'Paid' | 'Failed' | 'Reversed';
  maskedBankDetails: string;
}

export interface AdminRefundRecord {
  id: string;
  transactionId: string;
  customerName: string;
  originalAmountUSD: number;
  refundAmountUSD: number;
  reason: string;
  authorizedAdmin: string;
  timestamp: string;
  status: 'Approved' | 'Processed' | 'Failed' | 'Cancelled';
  providerRef: string;
}

export interface AdminInvoiceRecord {
  id: string;
  invoiceNumber: string;
  customerName: string;
  workspace: string;
  billingPeriod: string;
  baseAmountUSD: number;
  taxesUSD: number;
  totalUSD: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Overdue';
  invoiceDate: string;
}

export interface AdminPlanPricing {
  id: string;
  planName: string;
  workspaceType: string;
  billingCycle: string;
  priceUSD: number;
  features: string[];
  trialDays: number;
  status: 'Active' | 'Legacy' | 'Draft';
}

// -------------------------------------------------------------
// System: Feature Flags & Health
// -------------------------------------------------------------
export interface AdminFeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  isEnabled: boolean;
  targetAudience: 'Global' | 'Beta Cohort' | 'Staff Only' | 'Startups Only';
  updatedAt: string;
  updatedBy: string;
}

export interface AdminSystemHealthService {
  service: string;
  status: 'Operational' | 'Degraded' | 'Outage' | 'Simulated';
  latencyMs: number;
  uptimePercent: number;
  lastChecked: string;
}

// -------------------------------------------------------------
// Backwards Compatibility: Legacy directory models
// -------------------------------------------------------------
export interface AdminUserRecord {
  id: string;
  name: string;
  userType: 'Startup' | 'Mentor' | 'Investor' | 'ESP';
  organization?: string;
  email: string;
  location: string;
  verificationStatus:
    | 'Verified'
    | 'Pending'
    | 'Under Review'
    | 'Needs Information'
    | 'Rejected'
    | 'Unverified';
  subscriptionPlan: string;
  profileCompletion: number;
  accountStatus: 'Active' | 'Restricted' | 'Suspended' | 'Archived';
  joinDate: string;
  lastActive: string;
  avatar?: string;
  bio?: string;
  phone?: string;
  connectionsCount?: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  name: string;
  userType: 'Startup' | 'Mentor' | 'Investor' | 'ESP';
  organization?: string;
  submissionDate: string;
  status:
    | 'Pending'
    | 'Under Review'
    | 'Verified'
    | 'Needs Information'
    | 'Rejected'
    | 'Flagged';
  reviewer?: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  submittedDocuments: {
    name: string;
    type: string;
    size: string;
    date: string;
  }[];
  notes?: string[];
}

export interface AdminOpportunity {
  id: string;
  name: string;
  category: string;
  organization: string;
  sector: string;
  stage: string;
  fundingAmount: string;
  type:
    | 'Grant'
    | 'Incubation'
    | 'Accelerator'
    | 'Challenge'
    | 'Competition'
    | 'Fellowship';
  mode: 'Hybrid' | 'On-Campus' | 'Virtual';
  deadline: string;
  status: 'Open' | 'Upcoming' | 'Rolling' | 'Closed' | 'Draft' | 'Flagged';
  source: 'Manual' | 'AI Discovered';
  website?: string;
}

export interface FeedModerationItem {
  id: string;
  author: string;
  authorRole: string;
  authorAvatar?: string;
  contentPreview: string;
  fullContent?: string;
  date: string;
  reportCount: number;
  status: 'Active' | 'Flagged' | 'Restricted' | 'Removed';
  reason?: string;
}

export interface SafetyReportItem {
  id: string;
  reporterName: string;
  reportedEntity: string;
  category:
    | 'Fake Profile'
    | 'Spam'
    | 'Fraud'
    | 'Harassment'
    | 'Misrepresentation'
    | 'Scam Opportunity'
    | 'Investor Impersonation'
    | 'Other';
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  description: string;
  evidence?: string;
  status: 'Reported' | 'Investigating' | 'Action Taken' | 'Closed';
  assignedAdmin?: string;
  internalNotes?: string[];
  resolution?: string;
  date: string;
}

export interface SupportTicketItem {
  id: string;
  user: string;
  userEmail: string;
  category:
    | 'Account'
    | 'Verification'
    | 'Subscription'
    | 'Payment'
    | 'Mentor Session'
    | 'Technical Issue'
    | 'Other';
  priority: 'High' | 'Medium' | 'Low';
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Waiting for User' | 'Resolved' | 'Closed';
  assignedAdmin?: string;
  date: string;
}

export interface AuditLogEntry {
  id: string;
  adminName: string;
  employeeId: string;
  action: string;
  module: string;
  entityId?: string;
  details: string;
  previousValue?: string;
  newValue?: string;
  timestamp: string;
  ipAddress?: string;
}

export interface PlatformConfig {
  maintenanceMode: boolean;
  newRegistrationsAllowed: boolean;
  aiScrapingQueueActive: boolean;
  autoVerificationPrecheck: boolean;
  maxPitchVideoDurationMinutes: number;
  maxFileUploadSizeMB: number;
  mentorCommissionRatePercent: number;
  startupProMonthlyPriceUSD: number;
}

