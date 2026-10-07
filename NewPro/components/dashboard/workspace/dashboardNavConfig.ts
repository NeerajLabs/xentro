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
  Clock,
  CheckCircle2,
  Award,
  Sparkles,
  User,
} from 'lucide-react';
import { UserRole } from '@/lib/userProfile';

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: string;
}

export interface DashboardNavSection {
  label: string;
  items: DashboardNavItem[];
}

export interface PersonaDashboardConfig {
  role: UserRole;
  workspaceName: string;
  badge: string;
  badgeColor: string;
  sections: DashboardNavSection[];
}

export const personaDashboardConfigs: Record<UserRole, PersonaDashboardConfig> = {
  explorer: {
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
  },
  startup: {
    role: 'startup',
    workspaceName: 'Startup Workspace',
    badge: 'STARTUP',
    badgeColor: 'bg-[#D9FF3F] text-[#101212]',
    sections: [
      {
        label: 'OVERVIEW',
        items: [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        ],
      },
      {
        label: 'STARTUP WORKSPACE',
        items: [
          { id: 'my_listings', label: 'My Listings', icon: FolderKanban },
          { id: 'my_applications', label: 'My Applications', icon: FileCheck2, badge: '5 Active' },
          { id: 'connections', label: 'Connections', icon: Users },
          { id: 'meetings', label: 'Meetings', icon: Calendar, badge: 3 },
          { id: 'mentorship', label: 'Mentorship', icon: GraduationCap, badge: 2, badgeColor: 'bg-[#D9FF3F] text-[#101212]' },
          { id: 'dd_locker', label: 'DD Locker', icon: FolderLock, badge: 2, badgeColor: 'bg-purple-500 text-white' },
          { id: 'finance', label: 'Finance', icon: DollarSign },
          { id: 'startup_asks', label: 'Startup Asks', icon: Target, badge: 'Active' },
        ],
      },
      {
        label: 'ACCOUNT / BUSINESS',
        items: [
          { id: 'profile', label: 'Startup Profile', icon: Building2 },
        ],
      },
    ],
  },

  investor: {
    role: 'investor',
    workspaceName: 'Investment Workspace',
    badge: 'INVESTOR',
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
          { id: 'deal_flow', label: 'Deal Flow', icon: Layers, badge: 6, badgeColor: 'bg-[#D9FF3F] text-[#101212]' },
          { id: 'discover', label: 'Startup Discovery', icon: Compass, badge: 'New' },
          { id: 'portfolio', label: 'Portfolio', icon: Briefcase, badge: '18 Cos' },
          { id: 'diligence_locker', label: 'Diligence Locker', icon: FolderLock, badge: 4, badgeColor: 'bg-purple-500 text-white' },
          { id: 'investor_asks', label: 'Investor Asks', icon: Target, badge: 'Active' },
          { id: 'my_listings', label: 'My Listings', icon: FolderKanban },
          { id: 'my_applications', label: 'My Applications', icon: FileCheck2 },
          { id: 'connections', label: 'Connections', icon: Users },
          { id: 'meetings', label: 'Meetings', icon: Calendar, badge: 2, badgeColor: 'bg-blue-500 text-white' },
          { id: 'team_access', label: 'Team & RBAC', icon: Users },
          { id: 'billing_payments', label: 'Billing & Plans', icon: DollarSign },
        ],
      },
      {
        label: 'ACCOUNT',
        items: [
          { id: 'profile', label: 'Investor Profile', icon: TrendingUp },
        ],
      },
    ],
  },

  mentor: {
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
        label: 'MENTOR WORKSPACE',
        items: [
          { id: 'advisory_workspaces', label: 'Advisory Workspaces', icon: Briefcase, badge: 'Active' },
          { id: 'mentorship', label: 'Mentorship', icon: GraduationCap, badge: 2, badgeColor: 'bg-[#D9FF3F] text-[#101212]' },
          { id: 'mentor_asks', label: 'Mentor Asks', icon: Target, badge: 'Active' },
          { id: 'meetings', label: 'Meetings', icon: Calendar, badge: 3 },
          { id: 'my_listings', label: 'My Listings', icon: FolderKanban },
          { id: 'my_applications', label: 'My Applications', icon: FileCheck2 },
          { id: 'connections', label: 'Connections', icon: Users, badge: 34 },
        ],
      },
      {
        label: 'ACCOUNT',
        items: [
          { id: 'profile', label: 'Mentor Profile', icon: User },
        ],
      },
    ],
  },

  esp: {
    role: 'esp',
    workspaceName: 'Program Workspace',
    badge: 'ESP / HUB',
    badgeColor: 'bg-purple-400 text-[#101212]',
    sections: [
      {
        label: 'OVERVIEW',
        items: [
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
        ],
      },
      {
        label: 'PROGRAM WORKSPACE',
        items: [
          { id: 'programs', label: 'Programs', icon: Target, badge: '4 Active' },
          { id: 'cohorts', label: 'Cohorts', icon: Layers },
          { id: 'portfolio', label: 'Portfolio Directory', icon: Award, badge: 5 },
          { id: 'demo_days', label: 'Demo Days', icon: Sparkles },
          { id: 'events', label: 'Events', icon: Calendar, badge: 4 },
          { id: 'esp_asks', label: 'ESP Asks', icon: Target, badge: 'Active' },
          { id: 'my_listings', label: 'My Listings', icon: FolderKanban },
          { id: 'my_applications', label: 'My Applications', icon: FileCheck2 },
          { id: 'connections', label: 'Connections', icon: Users },
          { id: 'meetings', label: 'Meetings', icon: Calendar },
        ],
      },
      {
        label: 'ACCOUNT',
        items: [
          { id: 'profile', label: 'ESP / Institution Profile', icon: Building2 },
        ],
      },
    ],
  },
};
