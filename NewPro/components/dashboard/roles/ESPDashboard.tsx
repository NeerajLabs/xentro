'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  Target,
  Layers,
  Award,
  Users,
  ShieldCheck,
  Sparkles,
  CreditCard,
  TrendingUp,
  Settings,
  Eye,
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  Bell,
  HeartHandshake,
} from 'lucide-react';
import { UserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';
import { useESPAuthorization } from '@/hooks/useESPAuthorization';
import { ESPUnauthorizedState } from '../esp/ESPUnauthorizedState';
import { ESPOverview } from '../esp/ESPOverview';
import { ESPPublicProfileManager } from '../esp/ESPPublicProfileManager';
import { ESPMembersManager } from '../esp/ESPMembersManager';
import { ESPRolesAccessManager } from '../esp/ESPRolesAccessManager';
import { ESPEndorsementsManager } from '../esp/ESPEndorsementsManager';
import { ESPBillingManager } from '../esp/ESPBillingManager';
import { ESPProgramsManager } from '../esp/ESPProgramsManager';
import { ESPPortfolioManager } from '../esp/ESPPortfolioManager';
import { ESPSettingsManager } from '../esp/ESPSettingsManager';
import { ESPAnalyticsManager } from '../esp/ESPAnalyticsManager';
import { ESPOpportunitiesManager } from '../esp/ESPOpportunitiesManager';
import { ESPEventsManager } from '../esp/ESPEventsManager';
import { ESPTeamEcosystemManager } from '../esp/ESPTeamEcosystemManager';
import { ESPContentManager } from '../esp/ESPContentManager';
import { ESPNotificationsManager } from '../esp/ESPNotificationsManager';
import { ESPProfileView } from '../ESPProfileView';

export type ESPWorkspaceTab =
  | 'overview'
  | 'profile'
  | 'programs'
  | 'cohorts'
  | 'portfolio'
  | 'endorsements'
  | 'opportunities'
  | 'events'
  | 'members'
  | 'roles'
  | 'team'
  | 'content'
  | 'analytics'
  | 'billing'
  | 'notifications'
  | 'settings';

interface ESPDashboardProps {
  profile: UserProfile;
  onNavigateTab?: (tabId: string) => void;
  onOpenStartupProfile?: (startupId: string) => void;
  onOpenMentorProfile?: (mentorId: string) => void;
  onOpenInvestorProfile?: (investorId: string) => void;
}

export const ESPDashboard: React.FC<ESPDashboardProps> = ({
  profile,
  onNavigateTab,
  onOpenStartupProfile,
  onOpenMentorProfile,
  onOpenInvestorProfile,
}) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<ESPWorkspaceTab>('overview');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { currentRole, switchRole, availableRoles, canAccessModule } = useESPAuthorization();

  // Exact 15 Canonical Navigation Modules as prescribed in Section 49
  const navItems: Array<{
    id: ESPWorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: '01 Overview', icon: LayoutDashboard },
    { id: 'profile', label: '02 Profile', icon: Building2 },
    { id: 'programs', label: '03 Programs', icon: Target, badge: '4 Active' },
    { id: 'portfolio', label: '04 Portfolio', icon: Award, badge: 5 },
    {
      id: 'endorsements',
      label: '05 Endorsements',
      icon: Sparkles,
      badge: '18 Active',
      badgeColor: 'bg-emerald-500 text-white',
    },
    { id: 'opportunities', label: '06 Opportunities', icon: Briefcase, badge: 4 },
    { id: 'events', label: '07 Events / Activities', icon: Calendar, badge: 4 },
    { id: 'members', label: '08 Members', icon: Users, badge: 6 },
    { id: 'roles', label: '09 Roles & Access', icon: ShieldCheck, badge: 10 },
    { id: 'team', label: '10 Team & Ecosystem', icon: HeartHandshake },
    { id: 'content', label: '11 Content', icon: FileText },
    { id: 'analytics', label: '12 Analytics / Impact', icon: TrendingUp },
    { id: 'billing', label: '13 Billing & Payments', icon: CreditCard },
    {
      id: 'notifications',
      label: '14 Notifications',
      icon: Bell,
      badge: 3,
      badgeColor: 'bg-amber-500 text-white',
    },
    { id: 'settings', label: '15 Settings', icon: Settings },
  ];

  // Evaluate RBAC authorization for active module
  const auth = canAccessModule(activeSubTab);
  const currentItem = navItems.find((n) => n.id === activeSubTab);

  // If viewing public profile preview
  if (isPreviewMode) {
    return (
      <div className="space-y-4 animate-fade-slide">
        {/* Floating Top Banner indicating Preview Mode */}
        <div className="sticky top-20 z-40 p-4 rounded-2xl bg-[#101212] text-white border border-[#262A29] shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D9FF3F] text-[#101212]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  Viewing your Public Institution Profile (View Layer)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#D9FF3F]">
                  Live Preview
                </span>
              </div>
              <p className="text-xs text-[#B6B8B7]">
                This is exactly how founders, mentors, investors, and ecosystem partners view your institution. All editing is performed in your Dashboard (Management Layer).
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPreviewMode(false)}
            className="px-4 py-2 rounded-xl bg-white text-[#101212] hover:bg-[#D9FF3F] hover:text-[#101212] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Render the ESP Public Profile View */}
        <ESPProfileView
          isOwnProfile={true}
          onOpenDashboard={() => setIsPreviewMode(false)}
          onOpenStartupProfile={onOpenStartupProfile}
          onOpenMentorProfile={onOpenMentorProfile}
          onOpenInvestorProfile={onOpenInvestorProfile}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. ESP Operational Workspace Subnav Navigation */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-1.5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar scroll-smooth py-0.5 flex-1">
          {navItems.map((item) => {
            const isActive = activeSubTab === item.id || (item.id === 'programs' && activeSubTab === 'cohorts');
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#101212] text-white dark:bg-[#D9FF3F] dark:text-[#101212] shadow-xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                      item.badgeColor ||
                      (isActive
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-[#101212]'
                        : 'bg-gray-100 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Tools: Role Simulation Switcher & Preview Launcher */}
        <div className="flex items-center gap-2 pl-2 border-t md:border-t-0 md:border-l border-gray-100 dark:border-[#262A29] shrink-0 justify-between md:justify-end pt-1 md:pt-0">
          {/* RBAC Role Switcher */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-[#565B59] dark:text-[#B6B8B7] hidden lg:inline">
              Role:
            </span>
            <select
              value={currentRole}
              onChange={(e) => {
                const next = e.target.value as any;
                switchRole(next);
                showToast(`Viewing dashboard as ${next}`, 'info');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] text-xs font-semibold text-[#101212] dark:text-white focus:outline-hidden focus:border-[#D9FF3F] cursor-pointer"
              title="Test role-based access control and module permissions"
            >
              {availableRoles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Preview Public Profile Launcher Button */}
          <button
            onClick={() => setIsPreviewMode(true)}
            className="px-3 py-1.5 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-gray-50 dark:bg-[#202422] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle hover:text-[#D9FF3F]"
            title="Preview how founders & investors view your institution"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Preview Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Active Tab Sub-Module Router or Unauthorized State */}
      <div className="animate-fade-slide">
        {!auth.allowed ? (
          <ESPUnauthorizedState
            moduleName={currentItem?.label || activeSubTab}
            currentRole={currentRole}
            requiredPermission={auth.requiredPermission}
            reason={auth.reason}
            onNavigateOverview={() => setActiveSubTab('overview')}
            onSwitchRole={switchRole}
          />
        ) : (
          <>
            {activeSubTab === 'overview' && (
              <ESPOverview
                profile={profile}
                onNavigateTab={(tab) => setActiveSubTab(tab as ESPWorkspaceTab)}
                onPreviewProfile={() => setIsPreviewMode(true)}
              />
            )}
            {activeSubTab === 'profile' && (
              <ESPPublicProfileManager onPreviewProfile={() => setIsPreviewMode(true)} />
            )}
            {activeSubTab === 'programs' && <ESPProgramsManager initialSubTab="programs" />}
            {activeSubTab === 'cohorts' && <ESPProgramsManager initialSubTab="cohorts" />}
            {activeSubTab === 'portfolio' && (
              <ESPPortfolioManager
                onOpenStartupProfile={onOpenStartupProfile}
                onNavigateTab={(tab) => setActiveSubTab(tab as ESPWorkspaceTab)}
              />
            )}
            {activeSubTab === 'endorsements' && <ESPEndorsementsManager />}
            {activeSubTab === 'opportunities' && (
              <ESPOpportunitiesManager onNavigateTab={(tab) => setActiveSubTab(tab as ESPWorkspaceTab)} />
            )}
            {activeSubTab === 'events' && (
              <ESPEventsManager onNavigateTab={(tab) => setActiveSubTab(tab as ESPWorkspaceTab)} />
            )}
            {activeSubTab === 'members' && <ESPMembersManager />}
            {activeSubTab === 'roles' && <ESPRolesAccessManager />}
            {activeSubTab === 'team' && (
              <ESPTeamEcosystemManager
                onNavigateTab={(tab) => setActiveSubTab(tab as ESPWorkspaceTab)}
                onPreviewProfile={() => setIsPreviewMode(true)}
              />
            )}
            {activeSubTab === 'content' && (
              <ESPContentManager onNavigateTab={(tab) => setActiveSubTab(tab as ESPWorkspaceTab)} />
            )}
            {activeSubTab === 'analytics' && <ESPAnalyticsManager />}
            {activeSubTab === 'billing' && <ESPBillingManager />}
            {activeSubTab === 'notifications' && (
              <ESPNotificationsManager onNavigateTab={(tab) => setActiveSubTab(tab as ESPWorkspaceTab)} />
            )}
            {activeSubTab === 'settings' && <ESPSettingsManager />}
          </>
        )}
      </div>
    </div>
  );
};
