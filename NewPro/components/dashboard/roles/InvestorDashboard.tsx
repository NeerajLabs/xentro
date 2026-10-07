'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Compass,
  Layers,
  Briefcase,
  Users,
  Calendar,
  FileText,
  FolderLock,
  TrendingUp,
  ShieldCheck,
  CreditCard,
  Settings,
  Eye,
  ArrowLeft,
  Sparkles,
  Building2,
  User,
} from 'lucide-react';
import { UserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';
import { investorDomainService } from '@/lib/investorDomainService';
import {
  investorOrganizationService,
  INVESTOR_ORG_EVENTS,
} from '@/lib/investorOrganizationService';
import { ActiveInvestorContext } from '@/types/investorOrganization';
import { InvestorOverview } from '../investor/InvestorOverview';
import { InvestorDiscoverStartups } from '../investor/InvestorDiscoverStartups';
import { InvestorDealFlowCRM } from '../investor/InvestorDealFlowCRM';
import { InvestorPortfolioManager } from '../investor/InvestorPortfolioManager';
import { InvestorConnections } from '../investor/InvestorConnections';
import { InvestorMeetings } from '../investor/InvestorMeetings';
import { InvestorContentActivities } from '../investor/InvestorContentActivities';
import { InvestorDiligenceLocker } from '../investor/InvestorDiligenceLocker';
import { InvestorAnalytics } from '../investor/InvestorAnalytics';
import { InvestorTeamAccess } from '../investor/InvestorTeamAccess';
import { InvestorBillingManager } from '../investor/InvestorBillingManager';
import { InvestorProfileSettings } from '../investor/InvestorProfileSettings';
import { InvestorOrgProfileSettings } from '../investor/InvestorOrgProfileSettings';
import { InvestorProfileView } from '../InvestorProfileView';
import { InvestorOrgProfileView } from '../InvestorOrgProfileView';
import { InvestorContextSwitcher } from '../investor/InvestorContextSwitcher';
import { CreateInvestorOrganizationModal } from '../investor/CreateInvestorOrganizationModal';

export type InvestorWorkspaceTab =
  | 'overview'
  | 'discover'
  | 'deal_flow'
  | 'portfolio'
  | 'connections'
  | 'meetings'
  | 'content_activities'
  | 'documents_diligence'
  | 'analytics'
  | 'team_access'
  | 'billing_payments'
  | 'profile_settings';

interface InvestorDashboardProps {
  profile: UserProfile;
  onNavigateTab?: (tabId: string) => void;
}

export const InvestorDashboard: React.FC<InvestorDashboardProps> = ({ profile, onNavigateTab }) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<InvestorWorkspaceTab>('overview');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);

  // Active Context State (Individual vs Organization)
  const [activeContext, setActiveContext] = useState<ActiveInvestorContext>(() =>
    investorOrganizationService.getActiveContext()
  );

  // Real-time badge counts
  const [dealsCount, setDealsCount] = useState<number>(0);
  const [meetingsCount, setMeetingsCount] = useState<number>(0);
  const [docsCount, setDocsCount] = useState<number>(0);

  const refreshCounts = () => {
    const deals = investorOrganizationService.getScopedDeals();
    setDealsCount(deals.length);
    setMeetingsCount(
      investorDomainService.getMeetings().filter((m) => m.status === 'scheduled').length
    );
    setDocsCount(
      investorDomainService.getDiligenceDocuments().filter((d) => d.accessStatus === 'granted').length
    );
  };

  useEffect(() => {
    refreshCounts();

    const handleContextChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.context) {
        setActiveContext(ce.detail.context);
      } else {
        setActiveContext(investorOrganizationService.getActiveContext());
      }
      refreshCounts();
    };

    const handleDealsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.deals) setDealsCount(ce.detail.deals.length);
    };

    const handleMeetingsChange = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.meetings) {
        setMeetingsCount(ce.detail.meetings.filter((m: any) => m.status === 'scheduled').length);
      }
    };

    const handleOpenCreateOrg = () => {
      setIsCreateOrgOpen(true);
    };

    window.addEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleContextChange);
    window.addEventListener('xentro-investor-deals-changed', handleDealsChange);
    window.addEventListener('xentro-investor-meetings-changed', handleMeetingsChange);
    window.addEventListener('xentro-open-create-investor-org', handleOpenCreateOrg);

    return () => {
      window.removeEventListener(INVESTOR_ORG_EVENTS.CONTEXT_CHANGED, handleContextChange);
      window.removeEventListener('xentro-investor-deals-changed', handleDealsChange);
      window.removeEventListener('xentro-investor-meetings-changed', handleMeetingsChange);
      window.removeEventListener('xentro-open-create-investor-org', handleOpenCreateOrg);
    };
  }, []);

  const isOrg = activeContext.type === 'organization';
  const activeOrg = isOrg ? investorOrganizationService.getActiveOrganization() : null;

  const navItems: Array<{
    id: InvestorWorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: '01 Overview', icon: LayoutDashboard },
    { id: 'discover', label: '02 Discover', icon: Compass, badge: 'New' },
    {
      id: 'deal_flow',
      label: '03 Deal Flow',
      icon: Layers,
      badge: dealsCount || (isOrg ? 6 : 2),
      badgeColor: 'bg-[#D9FF3F] text-[#101212]',
    },
    {
      id: 'portfolio',
      label: '04 Portfolio',
      icon: Briefcase,
      badge: isOrg ? '18 Cos' : '10 Cos',
    },
    { id: 'connections', label: '05 Connections', icon: Users },
    {
      id: 'meetings',
      label: '06 Meetings',
      icon: Calendar,
      badge: meetingsCount || 2,
      badgeColor: 'bg-blue-500 text-white',
    },
    { id: 'content_activities', label: '07 Content', icon: FileText },
    {
      id: 'documents_diligence',
      label: '08 Diligence',
      icon: FolderLock,
      badge: docsCount || 4,
      badgeColor: 'bg-purple-500 text-white',
    },
    { id: 'analytics', label: '09 Analytics', icon: TrendingUp },
    {
      id: 'team_access',
      label: '10 Team & RBAC',
      icon: ShieldCheck,
      badge: isOrg ? '7 Active' : 'Individual',
    },
    { id: 'billing_payments', label: '11 Billing', icon: CreditCard },
    {
      id: 'profile_settings',
      label: isOrg ? '12 Organization Profile' : '12 Investor Profile',
      icon: Settings,
    },
  ];

  // If investor toggles preview of public profile (Rule #31: Never route both to the same public profile)
  if (isPreviewMode) {
    return (
      <div className="space-y-4">
        {/* Top Floating Preview Bar */}
        <div className="p-3 sm:p-4 rounded-2xl bg-[#101212] text-white flex items-center justify-between shadow-xl border border-[#262A29]">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D9FF3F] animate-pulse" />
            <span className="text-xs font-bold font-sora">
              {isOrg
                ? `Organization Public Profile Preview: ${activeOrg?.name || 'Organization'}`
                : `Individual Investor Public Profile Preview: ${profile.name || 'Investor'}`}
            </span>
            <span className="hidden sm:inline text-xs text-gray-400">
              {isOrg
                ? '(This is how founders and co-investors view your fund publicly)'
                : '(This is how founders and syndicates view your personal angel profile)'}
            </span>
          </div>

          <button
            onClick={() => setIsPreviewMode(false)}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-[#D9FF3F] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </div>

        {/* Render Public Profile based on active context */}
        {isOrg ? (
          <InvestorOrgProfileView
            organizationId={activeContext.organizationId}
            onBackToDashboard={() => setIsPreviewMode(false)}
            onEditProfile={() => {
              setIsPreviewMode(false);
              setActiveSubTab('profile_settings');
            }}
            isOwnProfile={true}
          />
        ) : (
          <InvestorProfileView
            onBackToDiscover={() => setIsPreviewMode(false)}
            onBackToFeed={() => setIsPreviewMode(false)}
            onEditProfile={() => {
              setIsPreviewMode(false);
              setActiveSubTab('profile_settings');
            }}
            isOwnProfile={true}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Context Switcher & Sub-Navigation Header Bar */}
      <div className="p-2.5 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col xl:flex-row xl:items-center justify-between gap-3">
        {/* Left: Context Switcher (Persona vs Entity) */}
        <div className="flex items-center gap-2 px-1 flex-shrink-0">
          <InvestorContextSwitcher onCreateOrganization={() => setIsCreateOrgOpen(true)} />
        </div>

        {/* Center: 12 Module Navigation Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 px-1 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${isActive ? 'text-[#D9FF3F] dark:text-[#101212]' : ''}`}
                />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      item.badgeColor
                        ? item.badgeColor
                        : isActive
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-black'
                        : 'bg-gray-200 dark:bg-gray-700 text-[#565B59] dark:text-gray-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Action: Public Profile Preview (Context Scoped) */}
        <div className="flex items-center gap-2 px-2 self-end xl:self-auto flex-shrink-0">
          <button
            onClick={() => setIsPreviewMode(true)}
            className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            title={isOrg ? 'View Organization Public Profile' : 'View Individual Public Profile'}
          >
            <Eye className="w-3.5 h-3.5 text-[#71870A] dark:text-[#D9FF3F]" />
            <span className="hidden sm:inline">
              {isOrg ? 'View Organization Profile' : 'View Public Profile'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Render Active Sub-Module */}
      <div key={`${activeContext.type}_${activeContext.organizationId}_${activeSubTab}`} className="animate-fade-slide">
        {activeSubTab === 'overview' && (
          <InvestorOverview
            profile={profile}
            onNavigateTab={onNavigateTab}
            onSelectSubTab={(tab) => setActiveSubTab(tab as InvestorWorkspaceTab)}
          />
        )}
        {activeSubTab === 'discover' && <InvestorDiscoverStartups />}
        {activeSubTab === 'deal_flow' && <InvestorDealFlowCRM />}
        {activeSubTab === 'portfolio' && <InvestorPortfolioManager />}
        {activeSubTab === 'connections' && <InvestorConnections showFilters={false} />}
        {activeSubTab === 'meetings' && <InvestorMeetings />}
        {activeSubTab === 'content_activities' && <InvestorContentActivities />}
        {activeSubTab === 'documents_diligence' && <InvestorDiligenceLocker />}
        {activeSubTab === 'analytics' && <InvestorAnalytics />}
        {activeSubTab === 'team_access' && <InvestorTeamAccess />}
        {activeSubTab === 'billing_payments' && <InvestorBillingManager />}
        {activeSubTab === 'profile_settings' &&
          (isOrg ? (
            <InvestorOrgProfileSettings
              organizationId={activeContext.organizationId}
              onViewPreview={() => setIsPreviewMode(true)}
            />
          ) : (
            <InvestorProfileSettings onViewPreview={() => setIsPreviewMode(true)} />
          ))}
      </div>

      {/* Create Organization Modal */}
      <CreateInvestorOrganizationModal
        isOpen={isCreateOrgOpen}
        onClose={() => setIsCreateOrgOpen(false)}
        onCreated={() => {
          refreshCounts();
          showToast('Switched to new organization account', 'success');
        }}
      />
    </div>
  );
};
