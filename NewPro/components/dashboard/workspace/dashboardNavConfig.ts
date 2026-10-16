import { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  FolderKanban,
  FileCheck2,
  Users,
  Calendar,
  GraduationCap,
  FolderLock,
  DollarSign,
  Target,
  Building2,
  Layers,
  Compass,
  Briefcase,
  TrendingUp,
  Bookmark,
  CheckCircle2,
  Award,
  Sparkles,
  User,
  Settings,
  Receipt,
} from 'lucide-react';
import { UserRole } from '@/lib/userProfile';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: string;
  capability?: string;
}

export interface DashboardNavSection {
  label: string;
  items: DashboardNavItem[];
}

export interface PersonaDashboardConfig {
  role: string;
  workspaceName: string;
  badge: string;
  badgeColor: string;
  sections: DashboardNavSection[];
}

// =========================================================================
// 1. STARTUP DASHBOARD HIERARCHY (Section 4.1 Approved)
// =========================================================================
export const startupDashboardConfig: PersonaDashboardConfig = {
  role: 'startup',
  workspaceName: 'Startup Workspace',
  badge: 'STARTUP',
  badgeColor: 'bg-[#D9FF3F] text-[#101212]',
  sections: [
    {
      label: 'MAIN',
      items: [
        { id: 'profile', label: 'Startup Profile', icon: Building2 },
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'business_operations', label: 'Business Operations', icon: FolderKanban },
        { id: 'finance', label: 'Finance', icon: DollarSign },
        { id: 'dd_locker', label: 'DD Locker', icon: FolderLock, badge: 'Vault' },
        { id: 'relationships', label: 'Relationships', icon: Users },
        { id: 'affiliations', label: 'Affiliations', icon: Award, badge: 'Active' },
      ],
    },
    {
      label: 'ADMINISTRATION',
      items: [
        { id: 'team_access', label: 'Team & Roles', icon: Users, badge: 'RBAC' },
        { id: 'billing_payments', label: 'Billing & Plans', icon: DollarSign },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ],
};

// =========================================================================
// 2. MENTOR DASHBOARD HIERARCHY (Section 4.2 Approved)
// =========================================================================
export const mentorDashboardConfig: PersonaDashboardConfig = {
  role: 'mentor',
  workspaceName: 'Mentor Workspace',
  badge: 'MENTOR',
  badgeColor: 'bg-blue-400 text-[#101212]',
  sections: [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      label: 'MENTORSHIP',
      items: [
        { id: 'mentorship', label: 'Mentorship', icon: GraduationCap, badge: 'Advisory' },
        { id: 'meetings', label: 'Meetings & Availability', icon: Calendar },
        { id: 'earnings', label: 'Earnings & Withdrawals', icon: Receipt },
      ],
    },
    {
      label: 'ACTIVITIES',
      items: [
        { id: 'activities', label: 'Activities', icon: Briefcase },
        { id: 'connections', label: 'Connections', icon: Users },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'Mentor Profile & Settings', icon: User },
      ],
    },
  ],
};

// =========================================================================
// 3. INDIVIDUAL INVESTOR DASHBOARD HIERARCHY (Section 4.3 Approved)
// =========================================================================
export const individualInvestorDashboardConfig: PersonaDashboardConfig = {
  role: 'investor_individual',
  workspaceName: 'Personal Angel Workspace',
  badge: 'ANGEL INVESTOR',
  badgeColor: 'bg-emerald-400 text-[#101212]',
  sections: [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      label: 'INVESTMENT WORKSPACE',
      items: [
        { id: 'watchlist', label: 'Saved Startups / Watchlist', icon: Bookmark, badge: 'Max 10' },
        { id: 'deal_flow', label: 'Deal Flow', icon: Layers, badge: 'Pipeline' },
        { id: 'portfolio', label: 'Portfolio', icon: Briefcase },
        { id: 'diligence_locker', label: 'Diligence Locker', icon: FolderLock },
      ],
    },
    {
      label: 'ACTIVITIES & NETWORK',
      items: [
        { id: 'activities', label: 'Activities & Network', icon: Target },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'Investor Profile & Billing', icon: TrendingUp },
      ],
    },
  ],
};

// =========================================================================
// 4. INVESTMENT ORGANIZATION DASHBOARD HIERARCHY (Section 4.4 Approved)
// =========================================================================
export const investmentOrgDashboardConfig: PersonaDashboardConfig = {
  role: 'investor_org',
  workspaceName: 'Investment Organization Workspace',
  badge: 'VC / FIRM',
  badgeColor: 'bg-emerald-500 text-white',
  sections: [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      label: 'INVESTMENT WORKSPACE',
      items: [
        { id: 'watchlist', label: 'Saved Startups / Watchlist', icon: Bookmark, badge: 'Max 30' },
        { id: 'deal_flow', label: 'Deal Flow', icon: Layers, badge: 'Shared' },
        { id: 'portfolio_diligence', label: 'Portfolio & Diligence', icon: Briefcase },
      ],
    },
    {
      label: 'ACTIVITIES & NETWORK',
      items: [
        { id: 'activities', label: 'Activities & Network', icon: Target },
      ],
    },
    {
      label: 'GOVERNANCE & TEAM',
      items: [
        { id: 'team_access', label: 'Team & Governance', icon: Users, badge: '5 Roles' },
        { id: 'profile', label: 'Organization Profile & Billing', icon: Building2 },
      ],
    },
  ],
};

// =========================================================================
// 5. ESP DASHBOARD HIERARCHY (Section 4.5 Approved)
// =========================================================================
export const espDashboardConfig: PersonaDashboardConfig = {
  role: 'esp',
  workspaceName: 'Ecosystem Service Provider Workspace',
  badge: 'ESP / INCUBATOR',
  badgeColor: 'bg-purple-400 text-[#101212]',
  sections: [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      label: 'PROGRAMS & AFFILIATIONS',
      items: [
        { id: 'programs_cohorts', label: 'Programs & Cohorts', icon: Target, badge: 'Programs' },
        { id: 'affiliated_startups', label: 'Affiliated Startups', icon: Award, badge: '250+ ₹399' },
        { id: 'events', label: 'Events & Demo Days', icon: Sparkles },
      ],
    },
    {
      label: 'ACTIVITIES & NETWORK',
      items: [
        { id: 'activities', label: 'Activities & Network', icon: FolderKanban },
      ],
    },
    {
      label: 'ADMINISTRATION',
      items: [
        { id: 'team_access', label: 'Team & Roles', icon: Users, badge: 'RBAC' },
        { id: 'profile', label: 'ESP Profile & Billing', icon: Building2 },
      ],
    },
  ],
};

// =========================================================================
// 6. INSTITUTION DASHBOARD HIERARCHY (Section 4.6 Approved)
// =========================================================================
export const institutionDashboardConfig: PersonaDashboardConfig = {
  role: 'institution',
  workspaceName: 'Academic & Institutional Workspace',
  badge: 'INSTITUTION',
  badgeColor: 'bg-amber-400 text-[#101212]',
  sections: [
    {
      label: 'OVERVIEW',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
      ],
    },
    {
      label: 'PROGRAMS & AFFILIATIONS',
      items: [
        { id: 'programs_cohorts', label: 'Institutional Programs', icon: Target },
        { id: 'affiliated_startups', label: 'Associated Startups', icon: Award, badge: 'Badge Only' },
        { id: 'events', label: 'Institutional Events', icon: Sparkles },
      ],
    },
    {
      label: 'ACTIVITIES & NETWORK',
      items: [
        { id: 'activities', label: 'Activities & Network', icon: FolderKanban },
      ],
    },
    {
      label: 'ADMINISTRATION',
      items: [
        { id: 'team_access', label: 'Team & Roles', icon: Users, badge: 'RBAC' },
        { id: 'profile', label: 'Institution Profile & Billing', icon: Building2 },
      ],
    },
  ],
};

// =========================================================================
// EXPLORER (GUEST READ-ONLY)
// =========================================================================
export const explorerDashboardConfig: PersonaDashboardConfig = {
  role: 'explorer',
  workspaceName: 'Explorer View',
  badge: 'EXPLORER',
  badgeColor: 'bg-gray-200 text-[#101212] dark:bg-[#202422] dark:text-white',
  sections: [
    {
      label: 'EXPLORE',
      items: [
        { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        { id: 'discover', label: 'Discover', icon: Compass },
        { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
        { id: 'connections', label: 'Connections', icon: Users },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { id: 'profile', label: 'My Guest Profile', icon: User },
      ],
    },
  ],
};

// Standard Record for backward compatibility
export const personaDashboardConfigs: Record<string, PersonaDashboardConfig> = {
  startup: startupDashboardConfig,
  mentor: mentorDashboardConfig,
  investor: individualInvestorDashboardConfig,
  investor_individual: individualInvestorDashboardConfig,
  investor_org: investmentOrgDashboardConfig,
  esp: espDashboardConfig,
  institution: institutionDashboardConfig,
  explorer: explorerDashboardConfig,
};

/**
 * Resolves the authoritative navigation configuration based on role, organization context, and entity type.
 */
export function resolveDashboardNavConfig(
  role: string,
  options?: {
    isOrganizationContext?: boolean;
    entityType?: string;
    entityName?: string;
  }
): PersonaDashboardConfig {
  const normRole = (role || 'startup').toLowerCase();
  const entityType = (options?.entityType || '').toLowerCase();

  // Institution check
  if (normRole === 'institution' || entityType.includes('institution') || entityType.includes('university') || entityType.includes('academic')) {
    return institutionDashboardConfig;
  }

  // ESP check
  if (normRole === 'esp' || entityType.includes('esp') || entityType.includes('incubator') || entityType.includes('accelerator')) {
    return espDashboardConfig;
  }

  // Investor context check
  if (normRole === 'investor' || normRole.includes('investor')) {
    if (options?.isOrganizationContext || entityType.includes('investor_org') || entityType.includes('fund') || entityType.includes('vc')) {
      return investmentOrgDashboardConfig;
    }
    return individualInvestorDashboardConfig;
  }

  // Mentor check
  if (normRole === 'mentor') {
    return mentorDashboardConfig;
  }

  // Explorer
  if (normRole === 'explorer') {
    return explorerDashboardConfig;
  }

  // Default to Startup
  return startupDashboardConfig;
}
