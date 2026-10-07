import {
  AdminUserRecord,
  VerificationRequest,
  AdminOpportunity,
  FeedModerationItem,
  SafetyReportItem,
  SupportTicketItem,
  AuditLogEntry,
  PlatformConfig,
  AdminRole,
} from '@/types/admin';

export interface AdminKPI {
  id: string;
  label: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  subtext: string;
  category: 'ecosystem' | 'operations' | 'safety' | 'financial';
}

export const ADMIN_KPIS: AdminKPI[] = [
  {
    id: 'total-members',
    label: 'Total Ecosystem Members',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Registered platform users',
    category: 'ecosystem',
  },
  {
    id: 'active-startups',
    label: 'Active Startups',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Registered ventures',
    category: 'ecosystem',
  },
  {
    id: 'verified-mentors',
    label: 'Verified Mentors',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Advisory network',
    category: 'ecosystem',
  },
  {
    id: 'accredited-investors',
    label: 'Accredited Investors',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Institutional & Angels',
    category: 'ecosystem',
  },
  {
    id: 'active-esps',
    label: 'Institutions & ESPs',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Incubators & Accelerators',
    category: 'ecosystem',
  },
  {
    id: 'pending-verifications',
    label: 'Pending Verifications',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Awaiting compliance review',
    category: 'operations',
  },
  {
    id: 'active-opportunities',
    label: 'Active Opportunities',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Grants, cohorts & calls',
    category: 'operations',
  },
  {
    id: 'connections-formed',
    label: 'Ecosystem Connections',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Active network dialogues',
    category: 'ecosystem',
  },
  {
    id: 'platform-mrr',
    label: 'Platform MRR',
    value: '$0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Platform subscriptions',
    category: 'financial',
  },
  {
    id: 'mentorship-sessions',
    label: 'Mentor Sessions',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Completed advisory sessions',
    category: 'ecosystem',
  },
  {
    id: 'safety-flags',
    label: 'Open Safety Cases',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Under investigation',
    category: 'safety',
  },
  {
    id: 'support-tickets',
    label: 'Active Support Tickets',
    value: '0',
    change: '0%',
    trend: 'neutral',
    subtext: 'Platform inquiries',
    category: 'operations',
  },
];

export const ECOSYSTEM_GROWTH_DATA: { month: string; startups: number; mentors: number; investors: number; esps: number }[] = [];

export const RECENT_AUDIT_ACTIVITY: { id: string; admin: string; action: string; target: string; time: string; type: string }[] = [];

export const MOCK_ADMIN_USERS: AdminUserRecord[] = [];

export const MOCK_VERIFICATION_REQUESTS: VerificationRequest[] = [];

export const MOCK_ADMIN_OPPORTUNITIES: AdminOpportunity[] = [];

export const MOCK_FEED_ITEMS: FeedModerationItem[] = [];

export const MOCK_SAFETY_REPORTS: SafetyReportItem[] = [];

export const MOCK_SUPPORT_TICKETS: SupportTicketItem[] = [];

export const MOCK_AUDIT_LOGS: AuditLogEntry[] = [];

export const INITIAL_PLATFORM_CONFIG: PlatformConfig = {
  maintenanceMode: false,
  newRegistrationsAllowed: true,
  aiScrapingQueueActive: true,
  autoVerificationPrecheck: true,
  maxPitchVideoDurationMinutes: 5,
  maxFileUploadSizeMB: 25,
  mentorCommissionRatePercent: 8,
  startupProMonthlyPriceUSD: 49,
};

export interface AdminTeamMember {
  id: string;
  employeeId: string;
  name: string;
  role: AdminRole;
  department: string;
  email: string;
  status: 'Active' | 'On Leave' | 'Deactivated';
  avatar: string;
  lastLogin: string;
}

export const ADMIN_TEAM_MEMBERS: AdminTeamMember[] = [
  {
    id: 'adm-01',
    employeeId: 'admin',
    name: 'Platform Administrator',
    role: 'Super Admin',
    department: 'Platform Architecture & Security',
    email: 'admin@xentro.io',
    status: 'Active',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    lastLogin: 'Active Now',
  },
];
