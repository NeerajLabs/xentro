'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  ArrowLeft,
  SlidersHorizontal,
  Rocket,
  GraduationCap,
  TrendingUp,
  Grid2X2,
  UserPlus,
  Compass,
} from 'lucide-react';
import { UserRole, UserProfile, getUserProfile, getActiveRole, setActiveRole, getUserRegisteredRoles } from '@/lib/userProfile';
import { isDevToolsEnabled } from '@/lib/devTools';
import { useToast } from '@/components/ui/Toast';
import { personaDashboardConfigs, PersonaDashboardConfig, resolveDashboardNavConfig } from './dashboardNavConfig';
import { DashboardSidebar } from './DashboardSidebar';
import {
  entityContextService,
  LinkedEntity,
  ENTITY_CONTEXT_CHANGED_EVENT,
} from '@/lib/entityContextService';
import { EntityAccountSwitcher } from '../EntityAccountSwitcher';

// Startup Components
import { StartupOverview } from '../startup/StartupOverview';
import { StartupMyListings } from '../startup/StartupMyListings';
import { StartupMyApplications } from '../startup/StartupMyApplications';
import { StartupConnections } from '../startup/StartupConnections';
import { StartupDDLocker } from '../startup/StartupDDLocker';
import { StartupFinanceDashboard } from '../startup/StartupFinanceDashboard';
import { StartupAskManager, UniversalAskManager } from '../startup/StartupAskManager';
import { StartupProfileManager } from '../startup/StartupProfileManager';
import { StartupBusinessOperations } from '../startup/StartupBusinessOperations';
import { StartupRelationshipsWorkspace } from '../startup/StartupRelationshipsWorkspace';
import { StartupAffiliationsWorkspace } from '../startup/StartupAffiliationsWorkspace';
import { StartupSettings } from '../startup/StartupSettings';
import { StartupTeamWorkspace } from '../startup/team/StartupTeamWorkspace';
import { StartupBillingManager } from '../startup/StartupBillingManager';
import { FinanceDocumentsView } from '../startup/finance/FinanceDocumentsView';
import { FinanceFundingView } from '../startup/finance/FinanceFundingView';
import { FinanceCashRunwayView } from '../startup/finance/FinanceCashRunwayView';

// Investor Components
import { InvestorOverview } from '../investor/InvestorOverview';
import { InvestorDealFlowCRM } from '../investor/InvestorDealFlowCRM';
import { InvestorDiscoverStartups } from '../investor/InvestorDiscoverStartups';
import { InvestorPortfolioManager } from '../investor/InvestorPortfolioManager';
import { InvestorDiligenceLocker } from '../investor/InvestorDiligenceLocker';
import { InvestorWatchlist } from '../investor/InvestorWatchlist';
import { InvestorPortfolioDiligence } from '../investor/InvestorPortfolioDiligence';
import { InvestorConnections } from '../investor/InvestorConnections';
import { InvestorMeetings } from '../investor/InvestorMeetings';
import { InvestorProfileSettings } from '../investor/InvestorProfileSettings';
import { InvestorOrgProfileSettings } from '../investor/InvestorOrgProfileSettings';
import { InvestorTeamAccess } from '../investor/InvestorTeamAccess';
import { InvestorBillingManager } from '../investor/InvestorBillingManager';
import { InvestorContextSwitcher } from '../investor/InvestorContextSwitcher';
import { CreateInvestorOrganizationModal } from '../investor/CreateInvestorOrganizationModal';
import { investorOrganizationService, INVESTOR_ORG_EVENTS } from '@/lib/investorOrganizationService';

// Mentor Components
import { MentorOverviewContent } from '@/components/mentor/MentorOverviewContent';
import { MentorshipWorkspace } from '@/components/mentor/MentorshipWorkspace';
import { MentorshipModule } from '@/components/mentor/MentorshipModule';
import { MentorMeetings } from '@/components/mentor/MentorMeetings';
import { MentorProfileManage } from '@/components/mentor/MentorProfileManage';
import {
  initialMentorMeetings,
  defaultAvailability,
} from '@/data/mentorMockData';
import { getActiveMentorships, initialActiveMentorshipsData } from '@/lib/mentorshipService';

// ESP & Institution Components
import { ESPOverview } from '../esp/ESPOverview';
import { ESPProgramsManager } from '../esp/ESPProgramsManager';
import { ESPPortfolioManager } from '../esp/ESPPortfolioManager';
import { ESPEventsManager } from '../esp/ESPEventsManager';
import { ESPEndorsementsManager } from '../esp/ESPEndorsementsManager';
import { ESPTeamEcosystemManager } from '../esp/ESPTeamEcosystemManager';
import { ESPPublicProfileManager } from '../esp/ESPPublicProfileManager';
import { ESPBillingManager } from '../esp/ESPBillingManager';

// Shared Unified Workspaces
import { DashboardActivitiesWorkspace } from './DashboardActivitiesWorkspace';

interface DashboardWorkspaceProps {
  onBackToUniversal: () => void;
  lastUniversalTab?: string;
  onPreviewProfile?: () => void;
  onSignupNewRole?: () => void;
}

function resolveEffectiveRole(entity: LinkedEntity | null, currentProfile?: UserProfile): UserRole {
  if (entity) {
    const et = (entity.entityType || '').toLowerCase();
    if (et.includes('startup')) return 'startup';
    if (et.includes('investor')) return 'investor';
    if (et.includes('mentor')) return 'mentor';
    if (et.includes('esp') || et.includes('institution') || et.includes('incubator') || et.includes('accelerator')) return 'esp';
  }

  // Check locally persisted active role from user role selector
  const activeRole = getActiveRole();
  if (activeRole && (activeRole === 'startup' || activeRole === 'investor' || activeRole === 'mentor' || activeRole === 'esp')) {
    return activeRole;
  }

  // Check profile role
  if (currentProfile?.role && currentProfile.role !== 'explorer') {
    return currentProfile.role;
  }

  // Inside DashboardWorkspace, default to startup workspace rather than empty explorer
  return 'startup';
}

export const DashboardWorkspace: React.FC<DashboardWorkspaceProps> = ({
  onBackToUniversal,
  lastUniversalTab = 'Universal',
  onPreviewProfile,
  onSignupNewRole,
}) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<UserProfile>(getUserProfile());
  const [activeEntity, setActiveEntity] = useState<LinkedEntity | null>(() =>
    entityContextService.getActiveEntity()
  );
  const [activeModuleId, setActiveModuleId] = useState<string>('overview');
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);

  const activeModuleIdRef = React.useRef<string>(activeModuleId);
  useEffect(() => {
    activeModuleIdRef.current = activeModuleId;
  }, [activeModuleId]);

  // Sync role and entity changes without auto-reverting activeModuleId
  useEffect(() => {
    const handleRoleChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newProfile = customEvent.detail?.profile || getUserProfile();
      setProfile(newProfile);
      // NOTE: Background profile sync (name, photo, etc.) must NEVER reset activeModuleId!
    };

    const handleEntityChanged = (e: Event) => {
      const ce = e as CustomEvent;
      const newEntity = ce.detail?.entity || entityContextService.getActiveEntity();
      const prevRole = resolveEffectiveRole(activeEntity, profile);
      const nextRole = resolveEffectiveRole(newEntity, profile);
      setActiveEntity(newEntity);

      // Only if the persona role fundamentally changed (e.g. Startup -> Investor)
      if (prevRole !== nextRole) {
        const targetConfig = personaDashboardConfigs[nextRole] || personaDashboardConfigs.startup;
        const allItemIds = targetConfig?.sections?.flatMap((s) => s.items.map((i) => i.id)) || [];
        if (allItemIds.length > 0 && !allItemIds.includes(activeModuleIdRef.current)) {
          setActiveModuleId('overview');
          activeModuleIdRef.current = 'overview';
        }
      }
    };

    const handleOpenCreateOrg = () => {
      setIsCreateOrgOpen(true);
    };

    window.addEventListener('xentro-role-changed', handleRoleChanged);
    window.addEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleEntityChanged);
    window.addEventListener('xentro-open-create-investor-org', handleOpenCreateOrg);
    return () => {
      window.removeEventListener('xentro-role-changed', handleRoleChanged);
      window.removeEventListener(ENTITY_CONTEXT_CHANGED_EVENT, handleEntityChanged);
      window.removeEventListener('xentro-open-create-investor-org', handleOpenCreateOrg);
    };
  }, [activeEntity, profile]);

  const effectiveRole: UserRole = resolveEffectiveRole(activeEntity, profile);
  const isOrg = effectiveRole === 'investor' && investorOrganizationService.isOrganizationContext();
  const isInst = (activeEntity?.entityType || '').toLowerCase().includes('institution');

  const baseConfig = resolveDashboardNavConfig(
    isInst ? 'institution' : isOrg ? 'investor_org' : effectiveRole,
    {
      isOrganizationContext: isOrg,
      entityType: activeEntity?.entityType,
      entityName: activeEntity?.name,
    }
  );
  const currentConfig: PersonaDashboardConfig = activeEntity
    ? {
        ...baseConfig,
        workspaceName: activeEntity.name ? `${activeEntity.name} Workspace` : baseConfig.workspaceName,
        badge: activeEntity.entityType ? activeEntity.entityType.toUpperCase() : baseConfig.badge,
      }
    : baseConfig;

  const handleSwitchRole = (role: UserRole) => {
    const newProfile = setActiveRole(role);
    setProfile(newProfile);
    setActiveModuleId('overview');
    showToast(`Switched active profile to ${role.toUpperCase()} workspace`, 'info');
  };

  const handleNavigateModule = (target: string) => {
    if (!target) return;
    const normalized = target.trim().toLowerCase();
    const map: Record<string, string> = {
      overview: 'overview',
      profile: 'profile',
      business_operations: 'business_operations',
      my_listings: 'business_operations',
      my_applications: 'business_operations',
      opportunities: 'business_operations',
      finance: 'finance',
      finances: 'finance',
      cap_table: 'finance',
      runway: 'finance',
      dd_locker: 'dd_locker',
      pitch_deck: 'dd_locker',
      relationships: 'relationships',
      connections: 'relationships',
      mentorship: 'relationships',
      advisory_workspaces: 'advisory_workspaces',
      affiliations: 'affiliations',
      team: 'team_access',
      team_access: 'team_access',
      billing: 'billing_payments',
      billing_payments: 'billing_payments',
      settings: 'settings',
      // Investor specific
      watchlist: 'watchlist',
      saved_startups: 'watchlist',
      deal_flow: 'deal_flow',
      portfolio: 'portfolio',
      portfolio_diligence: 'portfolio_diligence',
      diligence_locker: 'diligence_locker',
      discover: 'watchlist',
      // Shared Activities & Network
      activities: 'activities',
      startup_asks: 'business_operations',
      investor_asks: 'activities',
      mentor_asks: 'activities',
      esp_asks: 'activities',
      asks: 'activities',
      ask: 'activities',
      availability: 'meetings',
      meetings: 'meetings',
      programs: 'programs_cohorts',
      cohorts: 'programs_cohorts',
      programs_cohorts: 'programs_cohorts',
      affiliated_startups: 'affiliated_startups',
      events: 'events',
      demo_days: 'events',
    };

    const targetModule = map[normalized] || normalized;
    activeModuleIdRef.current = targetModule;
    setActiveModuleId(targetModule);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const rolePills: Array<{ role: UserRole; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { role: 'startup', label: 'Startup', icon: Rocket },
    { role: 'investor', label: 'Investor', icon: TrendingUp },
    { role: 'mentor', label: 'Mentor', icon: GraduationCap },
    { role: 'esp', label: 'ESP / Incubator', icon: Grid2X2 },
  ];

  const [activeMentorship, setActiveMentorship] = useState(
    () => getActiveMentorships()[0] || initialActiveMentorshipsData[0]
  );

  useEffect(() => {
    const refreshMentorship = () => {
      const actives = getActiveMentorships();
      setActiveMentorship(actives[0] || initialActiveMentorshipsData[0]);
    };
    refreshMentorship();
    window.addEventListener('xentro-mentorship-changed', refreshMentorship);
    return () => {
      window.removeEventListener('xentro-mentorship-changed', refreshMentorship);
    };
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white font-sans">
      {/* 1. Desktop Dedicated Sidebar */}
      <div className="hidden lg:block h-full flex-shrink-0">
        <DashboardSidebar
          config={currentConfig}
          activeModuleId={activeModuleId}
          onSelectModule={(id) => handleNavigateModule(id)}
          onBackToUniversal={onBackToUniversal}
          backTargetLabel={lastUniversalTab}
        />
      </div>

      {/* 2. Mobile / Tablet Drawer */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="relative z-10 h-full flex">
            <DashboardSidebar
              config={currentConfig}
              activeModuleId={activeModuleId}
              onSelectModule={(id) => {
                handleNavigateModule(id);
                setIsMobileDrawerOpen(false);
              }}
              onBackToUniversal={onBackToUniversal}
              backTargetLabel={lastUniversalTab}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* 3. Main Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile / Tablet Top Header with Menu Trigger & Back button */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#181B1A] border-b border-[#E5E7EB] dark:border-[#262A29] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 rounded-xl bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white"
              aria-label="Open sidebar navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-sora truncate max-w-[140px]">
                {currentConfig.workspaceName}
              </span>
              <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${currentConfig.badgeColor}`}>
                {currentConfig.badge}
              </span>
            </div>
          </div>

          <button
            onClick={onBackToUniversal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-[#202422] text-[#101212] dark:text-white"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#D9FF3F]" />
            <span>Back</span>
          </button>
        </div>

        {/* Scrollable Workspace Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 scrollbar-thin">
          {/* Header Banner: Persona Details & Role Switcher */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white tracking-tight">
                    {activeEntity ? (profile.name || activeEntity.primaryOwnerName || 'Founder') : (profile.name || 'Your Account')}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#D9FF3F] text-[#101212] shadow-2xs">
                    {activeEntity ? (activeEntity.entityType?.toUpperCase() || 'STARTUP') : profile.role}
                  </span>
                </div>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  {activeEntity ? (
                    <>
                      <span className="font-semibold text-[#101212] dark:text-white">
                        {activeEntity.role || 'Founder & CEO'}
                      </span>
                      <span> &bull; {activeEntity.name}</span>
                      <span> &bull; {activeEntity.sector || 'Enterprise AI & Automation'}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-semibold text-[#101212] dark:text-white">{profile.roleTitle || 'Verified Member'}</span>
                      {profile.organization && <span> &bull; {profile.organization}</span>}
                      {profile.sector && <span className="text-[#565B59]"> &bull; {profile.sector}</span>}
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
                {/* Entity / Persona Switcher */}
                <EntityAccountSwitcher variant="profile-action" />

                {/* Dynamic Persona / Role Test Switcher Bar: visible ONLY if ?dev=1 or user has multiple registered roles */}
                {(isDevToolsEnabled() || getUserRegisteredRoles().length > 1) && (
                  <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[10px] font-bold text-[#565B59] dark:text-[#7A807D] px-1 uppercase tracking-wider">
                    <span>Persona Switcher</span>
                    {isDevToolsEnabled() && (
                      <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1 py-0.2 rounded font-mono font-medium">TEST MODE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
                    {rolePills
                      .filter((pill) => isDevToolsEnabled() || getUserRegisteredRoles().includes(pill.role))
                      .map((pill) => {
                      const Icon = pill.icon;
                      const isSelected = effectiveRole === pill.role;
                      return (
                        <button
                          key={pill.role}
                          onClick={() => handleSwitchRole(pill.role)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-95 ${
                            isSelected
                              ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs scale-102'
                              : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{pill.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Context Switcher for Investor Role */}
            {effectiveRole === 'investor' && (
              <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#262A29] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-[#565B59] dark:text-[#B6B8B7]">
                    Investment Context:
                  </span>
                  <InvestorContextSwitcher onCreateOrganization={() => setIsCreateOrgOpen(true)} />
                </div>
                <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
                  Switch between Personal Angel and Institutional VC accounts
                </span>
              </div>
            )}
          </div>

          {/* Module Content Rendering by Active Role */}
          <div key={`${effectiveRole}_${activeModuleId}`} className="animate-fade-slide">
            {/* ================= STARTUP PERSONA ================= */}
            {effectiveRole === 'startup' && (
              <>
                {activeModuleId === 'profile' && (
                  <StartupProfileManager
                    onPreviewPublicProfile={() =>
                      onPreviewProfile
                        ? onPreviewProfile()
                        : window.dispatchEvent(
                            new CustomEvent('xentro-navigate-tab', { detail: { tab: 'profile' } })
                          )
                    }
                    onNavigateTab={handleNavigateModule}
                  />
                )}
                {activeModuleId === 'overview' && (
                  <StartupOverview onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'business_operations' && (
                  <StartupBusinessOperations onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'finance' && (
                  <StartupFinanceDashboard initialTab="overview" onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'dd_locker' && <StartupDDLocker />}
                {activeModuleId === 'relationships' && (
                  <StartupRelationshipsWorkspace onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'affiliations' && (
                  <StartupAffiliationsWorkspace />
                )}
                {activeModuleId === 'team_access' && (
                  <StartupTeamWorkspace />
                )}
                {activeModuleId === 'billing_payments' && (
                  <StartupBillingManager />
                )}
                {activeModuleId === 'settings' && (
                  <StartupSettings />
                )}
                {/* Backward-compatible module mappings */}
                {activeModuleId === 'my_listings' && <StartupBusinessOperations initialSubTab="listings" onNavigateTab={handleNavigateModule} />}
                {activeModuleId === 'my_applications' && <StartupBusinessOperations initialSubTab="applications" onNavigateTab={handleNavigateModule} />}
                {activeModuleId === 'startup_asks' && <StartupBusinessOperations initialSubTab="asks" onNavigateTab={handleNavigateModule} />}
                {activeModuleId === 'connections' && <StartupRelationshipsWorkspace initialSubTab="connections" onNavigateTab={handleNavigateModule} />}
                {activeModuleId === 'mentorship' && <StartupRelationshipsWorkspace initialSubTab="mentorship" onNavigateTab={handleNavigateModule} />}
                {activeModuleId === 'meetings' && <StartupRelationshipsWorkspace initialSubTab="meetings" onNavigateTab={handleNavigateModule} />}
                {activeModuleId === 'cap_table' && <StartupFinanceDashboard initialTab="cap_table" onNavigateTab={handleNavigateModule} />}
                {activeModuleId === 'runway' && <StartupFinanceDashboard initialTab="cash_runway" onNavigateTab={handleNavigateModule} />}
              </>
            )}

            {/* ================= INVESTOR PERSONA ================= */}
            {effectiveRole === 'investor' && (
              <>
                {activeModuleId === 'overview' && (
                  <InvestorOverview profile={profile} onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'watchlist' && (
                  <InvestorWatchlist onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'deal_flow' && <InvestorDealFlowCRM />}
                {activeModuleId === 'portfolio' && <InvestorPortfolioManager />}
                {activeModuleId === 'diligence_locker' && <InvestorDiligenceLocker />}
                {activeModuleId === 'portfolio_diligence' && <InvestorPortfolioDiligence />}
                {activeModuleId === 'activities' && (
                  <DashboardActivitiesWorkspace
                    role={investorOrganizationService.isOrganizationContext() ? 'investor_org' : 'investor_individual'}
                    onNavigateTab={handleNavigateModule}
                  />
                )}
                {activeModuleId === 'team_access' && (
                  investorOrganizationService.isOrganizationContext() ? (
                    <InvestorTeamAccess />
                  ) : (
                    <div className="p-8 text-center bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
                      <p className="text-sm font-bold text-[#101212] dark:text-white">
                        Team & Governance is only available for Investment Organizations
                      </p>
                      <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                        Switch to an organization account or create a new fund to access multi-member team controls and RBAC.
                      </p>
                    </div>
                  )
                )}
                {activeModuleId === 'billing_payments' && <InvestorBillingManager />}
                {activeModuleId === 'profile' &&
                  (investorOrganizationService.isOrganizationContext() ? (
                    <InvestorOrgProfileSettings
                      organizationId={investorOrganizationService.getActiveOrganization()?.id}
                      onViewPreview={() =>
                        onPreviewProfile
                          ? onPreviewProfile()
                          : window.dispatchEvent(
                              new CustomEvent('xentro-navigate-tab', { detail: { tab: 'profile' } })
                            )
                      }
                    />
                  ) : (
                    <InvestorProfileSettings
                      investorId="inv_own"
                      onViewPreview={() =>
                        onPreviewProfile
                          ? onPreviewProfile()
                          : window.dispatchEvent(
                              new CustomEvent('xentro-navigate-tab', { detail: { tab: 'profile' } })
                            )
                      }
                    />
                  ))}
                {/* Fallback routes */}
                {activeModuleId === 'discover' && <InvestorWatchlist onNavigateTab={handleNavigateModule} />}
                {activeModuleId === 'connections' && <InvestorConnections showFilters={false} />}
                {activeModuleId === 'meetings' && <InvestorMeetings />}
                {(activeModuleId === 'investor_asks' || activeModuleId === 'asks') && (
                  <UniversalAskManager role="investor" />
                )}
              </>
            )}

            {/* ================= MENTOR PERSONA ================= */}
            {effectiveRole === 'mentor' && (
              <>
                {activeModuleId === 'overview' && (
                  <MentorOverviewContent onNavigateModule={handleNavigateModule} />
                )}
                {activeModuleId === 'advisory_workspaces' && (
                  <MentorshipWorkspace
                    mentorship={activeMentorship}
                    onBack={() => handleNavigateModule('overview')}
                  />
                )}
                {activeModuleId === 'mentorship' && (
                  <MentorshipModule
                    onNavigateMeetings={() => handleNavigateModule('meetings')}
                  />
                )}
                {activeModuleId === 'meetings' && (
                  <MentorMeetings
                    meetings={initialMentorMeetings}
                    availabilityConfig={defaultAvailability}
                    defaultTab="upcoming"
                  />
                )}
                {activeModuleId === 'activities' && (
                  <DashboardActivitiesWorkspace role="mentor" onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'connections' && (
                  <InvestorConnections
                    showFilters={false}
                    title="Professional Connections"
                    subtitle="Connected founders, mentees, and institutional partners across Xentro"
                  />
                )}
                {activeModuleId === 'profile' && (
                  <MentorProfileManage
                    onViewPublicProfile={() =>
                      onPreviewProfile
                        ? onPreviewProfile()
                        : window.dispatchEvent(
                            new CustomEvent('xentro-navigate-tab', { detail: { tab: 'profile' } })
                          )
                    }
                  />
                )}
                {/* Fallback routes */}
                {(activeModuleId === 'mentor_asks' || activeModuleId === 'asks') && (
                  <UniversalAskManager role="mentor" />
                )}
                {activeModuleId === 'my_listings' && <StartupMyListings />}
                {activeModuleId === 'my_applications' && (
                  <StartupMyApplications onNavigateTab={handleNavigateModule} />
                )}
              </>
            )}

            {/* ================= ESP / INSTITUTION PERSONA ================= */}
            {(effectiveRole === 'esp' || isInst) && (
              <>
                {activeModuleId === 'overview' && (
                  <ESPOverview profile={profile} onNavigateTab={handleNavigateModule} />
                )}
                {(activeModuleId === 'programs_cohorts' || activeModuleId === 'programs' || activeModuleId === 'cohorts') && (
                  <ESPProgramsManager
                    initialSubTab={activeModuleId === 'cohorts' ? 'cohorts' : 'programs'}
                    onNavigateTab={handleNavigateModule}
                  />
                )}
                {activeModuleId === 'affiliated_startups' && (
                  <ESPEndorsementsManager isInstitution={isInst} />
                )}
                {activeModuleId === 'portfolio' && <ESPPortfolioManager />}
                {(activeModuleId === 'events' || activeModuleId === 'demo_days') && (
                  <ESPEventsManager onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'activities' && (
                  <DashboardActivitiesWorkspace role={isInst ? 'institution' : 'esp'} onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'team_access' && <ESPTeamEcosystemManager />}
                {activeModuleId === 'billing_payments' && <ESPBillingManager />}
                {activeModuleId === 'profile' && (
                  <ESPPublicProfileManager
                    onPreviewProfile={() =>
                      onPreviewProfile
                        ? onPreviewProfile()
                        : window.dispatchEvent(
                            new CustomEvent('xentro-navigate-tab', { detail: { tab: 'profile' } })
                          )
                    }
                  />
                )}
                {/* Fallback routes */}
                {(activeModuleId === 'esp_asks' || activeModuleId === 'asks') && (
                  <UniversalAskManager role="esp" />
                )}
                {activeModuleId === 'my_listings' && <StartupMyListings />}
                {activeModuleId === 'my_applications' && (
                  <StartupMyApplications onNavigateTab={handleNavigateModule} />
                )}
                {activeModuleId === 'connections' && <ESPTeamEcosystemManager />}
                {activeModuleId === 'meetings' && <InvestorMeetings />}
              </>
            )}

            {/* ================= EXPLORER (GUEST) ================= */}
            {effectiveRole === 'explorer' && (
              <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#D9FF3F]/15 border border-[#D9FF3F]/40 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center mx-auto">
                  <Compass className="w-6 h-6" />
                </div>
                <h2 className="font-manrope font-bold text-lg text-[#101212] dark:text-white">
                  Guest Explorer mode
                </h2>
                <p className="text-sm text-[#565B59] dark:text-[#B6B8B7] max-w-md mx-auto leading-relaxed">
                  You are browsing the Xentro ecosystem with read-only guest access. Discover people,
                  opportunities and programs below - upgrade your role any time from the Signup app
                  to unlock a full workspace for your profile.
                </p>
                <button
                  onClick={onBackToUniversal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold shadow-2xs active:scale-95 transition-all"
                >
                  <span>Explore the ecosystem</span>
                  <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateInvestorOrganizationModal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
      />
    </div>
  );
};
