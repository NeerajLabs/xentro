'use client';

import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Feed } from './Feed';
import { Recommendations } from './Recommendations';
import { OpportunityCard } from './OpportunityCard';
import { MessagesWidget } from './MessagesWidget';
import { MobileNavigation } from './MobileNavigation';
import { ToastProvider } from '@/components/ui/Toast';

import { FullMessagesPage } from './FullMessagesPage';
import { StartupProfileView } from './StartupProfileView';
import { MentorProfileView } from './MentorProfileView';
import { InvestorProfileView } from './InvestorProfileView';
import { InvestorOrgProfileView } from './InvestorOrgProfileView';
import { investorOrganizationService } from '@/lib/investorOrganizationService';
import { ESPProfileView } from './ESPProfileView';
import { ExplorerProfileView } from './ExplorerProfileView';
import { ProfileUnavailableView } from './ProfileUnavailableView';
import { NotificationsView } from './NotificationsView';
import { MentorDiscover } from '@/components/mentor/MentorDiscover';
import { MentorOpportunities } from '@/components/mentor/MentorOpportunities';
import { initialMentorOpportunities } from '@/data/mentorMockData';
import { MaintenanceNotice } from '@/components/common/MaintenanceNotice';
import { getUserProfile, UserProfile } from '@/lib/userProfile';
import { getStartupProfileById } from '@/data/startupProfilesData';
import { getInvestorProfileById } from '@/data/investorProfilesData';
import { DashboardWorkspace } from './workspace/DashboardWorkspace';
import { DynamicDashboardView } from './DynamicDashboardView';
import { RoleRequestModal } from './RoleRequestModal';
import { SupportPageView } from './SupportPageView';

export const DashboardLayout: React.FC = () => {
  const [activeNavTab, setActiveNavTab] = useState('feed');
  const [lastUniversalTab, setLastUniversalTab] = useState('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());

  const [selectedProfile, setSelectedProfile] = useState<{
    type: 'startup' | 'mentor' | 'investor' | 'esp' | 'explorer';
    id: string;
    data?: any;
  } | null>(null);

  const handleSelectNavTab = (tabId: string) => {
    setSelectedProfile(null);
    if (activeNavTab !== 'dashboard' && tabId === 'dashboard') {
      setLastUniversalTab(activeNavTab);
    }
    setActiveNavTab(tabId);

    // Rule 16: Update URL search params so browser refresh inside Dashboard preserves active dashboard,
    // while returning to Universal cleans the param so refresh on Universal stays on Universal.
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tabId === 'dashboard') {
        url.searchParams.set('tab', 'dashboard');
      } else {
        url.searchParams.delete('tab');
      }
      window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
    }
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam) {
        if (activeNavTab !== 'dashboard' && tabParam === 'dashboard') {
          setLastUniversalTab(activeNavTab);
        }
        setActiveNavTab(tabParam);
      }
    }

    const handleNavigateTab = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.tab) {
        handleSelectNavTab(customEvent.detail.tab);
      }
    };

    const handleOpenSignup = () => {
      setIsSignupOpen(true);
    };

    const handleRoleChanged = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.profile) {
        setUserProfile(customEvent.detail.profile);
      } else {
        setUserProfile(getUserProfile());
      }
    };

    // Resilient background sync from MongoDB Atlas on refresh
    const syncProfileFromDatabase = async () => {
      try {
        const current = getUserProfile();
        const userRaw = localStorage.getItem('xentro_current_user');
        const userObj = userRaw ? JSON.parse(userRaw) : null;
        const targetId = current?.id || userObj?.id || '';
        const targetEmail = current?.email || userObj?.email || '';
        if (targetId || targetEmail) {
          const res = await fetch(`/api/profile?userId=${encodeURIComponent(targetId)}&email=${encodeURIComponent(targetEmail)}`);
          if (res.ok) {
            const data = await res.json();
            const serverUser = data?.data?.user || data?.user;
            if (serverUser && serverUser.personalProfile) {
              const p = serverUser.personalProfile;
              const merged = {
                ...current,
                headline: p.headline || current.headline,
                bio: p.bio || current.bio,
                location: p.location || current.location,
                currentRole: p.currentRole || current.currentRole,
                currentOrganization: p.currentOrganization || current.currentOrganization,
                education: p.education || current.education,
                professionalExperience: p.professionalExperience || current.professionalExperience,
                skills: (p.skills && p.skills.length > 0) ? p.skills : current.skills,
                industries: (p.industries && p.industries.length > 0) ? p.industries : current.industries,
                startupInterests: (p.startupInterests && p.startupInterests.length > 0) ? p.startupInterests : current.startupInterests,
                linkedin: p.linkedin || current.linkedin,
                website: p.website || current.website,
                otherLinks: p.otherLinks || current.otherLinks,
                avatar: p.photoUrl || current.avatar,
              };
              localStorage.setItem('xentro_user_profile', JSON.stringify(merged));
              setUserProfile(merged);
            }
          }
        }
      } catch (_) {}
    };
    syncProfileFromDatabase();

    const handleOpenProfileEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{
        type: 'startup' | 'mentor' | 'investor' | 'esp' | 'explorer';
        id: string;
        data?: any;
      }>;
      if (customEvent.detail) {
        setSelectedProfile(customEvent.detail);
      }
    };

    window.addEventListener('xentro-navigate-tab', handleNavigateTab);
    window.addEventListener('xentro-open-signup', handleOpenSignup);
    window.addEventListener('xentro-role-changed', handleRoleChanged);
    window.addEventListener('xentro-open-profile', handleOpenProfileEvent);
    return () => {
      window.removeEventListener('xentro-navigate-tab', handleNavigateTab);
      window.removeEventListener('xentro-open-signup', handleOpenSignup);
      window.removeEventListener('xentro-role-changed', handleRoleChanged);
      window.removeEventListener('xentro-open-profile', handleOpenProfileEvent);
    };
  }, [activeNavTab]);

  const showHeader = activeNavTab === 'feed';

  if (activeNavTab === 'dashboard') {
    return (
      <ToastProvider>
        <DashboardWorkspace
          onBackToUniversal={() => {
            const backTarget = lastUniversalTab || 'feed';
            setActiveNavTab(backTarget);
            if (typeof window !== 'undefined') {
              const url = new URL(window.location.href);
              url.searchParams.delete('tab');
              window.history.replaceState({}, '', url.pathname + (url.search ? url.search : '') + url.hash);
            }
          }}
          lastUniversalTab={lastUniversalTab}
          onPreviewProfile={() => handleSelectNavTab('profile')}
          onSignupNewRole={() => setIsSignupOpen(true)}
        />
        <RoleRequestModal
          isOpen={isSignupOpen}
          onClose={() => setIsSignupOpen(false)}
          currentUserProfile={userProfile}
          onRequestSubmitted={() => setUserProfile(getUserProfile())}
        />
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#F7F8F6] dark:bg-[#0D0F0F] text-[#101212] dark:text-white flex transition-colors duration-200 font-sans">
        {/* 1. Left Hover-Expandable Sidebar (Desktop) */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeNavTab}
            onSelectTab={handleSelectNavTab}
            onOpenMessages={() => setIsMessagesOpen(true)}
            onSignupNewRole={() => setIsSignupOpen(true)}
          />
        </div>

        {/* 2. Main Application Body (offset for collapsed sidebar) */}
        <div className="flex-1 flex flex-col min-w-0 md:pl-[60px] pb-20 md:pb-8">
          {/* Global Web Maintenance Notification Banner */}
          <MaintenanceNotice />

          {/* Top Header - closed/hidden when coming to messages or profile */}
          {showHeader && (
            <Header
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectProfile={() => setActiveNavTab('profile')}
              onSelectNotifications={() => setActiveNavTab('notifications')}
              onSelectMessages={() => setActiveNavTab('messages')}
              onSelectSupport={() => handleSelectNavTab('support')}
            />
          )}

          {/* Main Content Container */}
          <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div key={selectedProfile ? `profile_${selectedProfile.id}` : activeNavTab} className="animate-fade-slide">
              {selectedProfile ? (
                selectedProfile.type === 'startup' ? (
                  <StartupProfileView
                    startupId={selectedProfile.id}
                    startupData={selectedProfile.data || getStartupProfileById(selectedProfile.id)}
                    isOwnProfile={false}
                    onBackToFeed={() => setSelectedProfile(null)}
                    onBackToDiscover={() => setSelectedProfile(null)}
                  />
                ) : selectedProfile.type === 'mentor' ? (
                  <MentorProfileView
                    mentorId={selectedProfile.id}
                    mentorData={selectedProfile.data}
                    isOwnProfile={false}
                    onBackToFeed={() => setSelectedProfile(null)}
                    onBackToDiscover={() => setSelectedProfile(null)}
                  />
                ) : selectedProfile.type === 'investor' ? (
                  <InvestorProfileView
                    investorId={selectedProfile.id}
                    investorData={selectedProfile.data || getInvestorProfileById(selectedProfile.id)}
                    isOwnProfile={false}
                    onBackToFeed={() => setSelectedProfile(null)}
                    onBackToDiscover={() => setSelectedProfile(null)}
                  />
                ) : selectedProfile.type === 'explorer' ? (
                  <ExplorerProfileView
                    explorerId={selectedProfile.id}
                    explorerData={selectedProfile.data}
                    isOwnProfile={false}
                    onBackToFeed={() => setSelectedProfile(null)}
                    onBackToDiscover={() => setSelectedProfile(null)}
                  />
                ) : selectedProfile.type === 'esp' ? (
                  <ESPProfileView
                    espId={selectedProfile.id}
                    isOwnProfile={false}
                    onBackToFeed={() => setSelectedProfile(null)}
                    onBackToDiscover={() => setSelectedProfile(null)}
                  />
                ) : (
                  <ProfileUnavailableView
                    onBackToFeed={() => setSelectedProfile(null)}
                  />
                )
              ) : activeNavTab === 'messages' ? (
                <FullMessagesPage onBackToFeed={() => setActiveNavTab('feed')} />
              ) : activeNavTab === 'notifications' ? (
                <NotificationsView onBackToFeed={() => setActiveNavTab('feed')} />
              ) : activeNavTab === 'profile' ? (
                userProfile.role === 'explorer' ? (
                  <ExplorerProfileView
                    explorerId={userProfile.id}
                    explorerData={userProfile}
                    isOwnProfile={true}
                    onBackToFeed={() => setActiveNavTab('feed')}
                  />
                ) : userProfile.role === 'investor' ? (
                  investorOrganizationService.isOrganizationContext() ? (
                    <InvestorOrgProfileView
                      organizationId={investorOrganizationService.getActiveOrganization()?.id}
                      onBackToFeed={() => setActiveNavTab('feed')}
                      onBackToDashboard={() => setActiveNavTab('dashboard')}
                      isOwnProfile={true}
                    />
                  ) : (
                    <InvestorProfileView
                      investorId="inv_own"
                      onBackToFeed={() => setActiveNavTab('feed')}
                      onBackToDiscover={() => setActiveNavTab('dashboard')}
                      isOwnProfile={true}
                    />
                  )
                ) : userProfile.role === 'mentor' ? (
                  <MentorProfileView
                    onBackToFeed={() => setActiveNavTab('feed')}
                    onBackToDashboard={() => setActiveNavTab('dashboard')}
                    isOwnProfile={true}
                  />
                ) : userProfile.role === 'esp' ? (
                  <ESPProfileView
                    onBackToFeed={() => setActiveNavTab('feed')}
                    onBackToDiscover={() => setActiveNavTab('dashboard')}
                    isOwnProfile={true}
                  />
                ) : (
                  <StartupProfileView
                    onBackToFeed={() => setActiveNavTab('feed')}
                    onManageInDashboard={() => setActiveNavTab('dashboard')}
                    isOwnProfile={true}
                  />
                )
              ) : activeNavTab === 'startup' || activeNavTab === 'mentor' || activeNavTab === 'investor' || activeNavTab === 'esp' ? (
                <div className="space-y-4 max-w-[1240px] mx-auto animate-fade-slide">
                  <MentorDiscover
                    defaultCategory={
                      activeNavTab === 'startup'
                        ? 'startups'
                        : activeNavTab === 'mentor'
                        ? 'mentors'
                        : activeNavTab === 'investor'
                        ? 'investors'
                        : 'esps'
                    }
                    onCategoryChange={(cat) => {
                      const map: Record<string, string> = {
                        startups: 'startup',
                        mentors: 'mentor',
                        investors: 'investor',
                        esps: 'esp',
                      };
                      if (map[cat]) {
                        setActiveNavTab(map[cat]);
                      }
                    }}
                  />
                </div>
              ) : activeNavTab === 'opportunity' ? (
                <div className="space-y-4 max-w-[1040px] mx-auto animate-fade-slide">
                  <MentorOpportunities opportunities={initialMentorOpportunities} />
                </div>
              ) : activeNavTab === 'support' ? (
                <div className="space-y-4 max-w-[1040px] mx-auto animate-fade-slide">
                  <SupportPageView onBackToFeed={() => setActiveNavTab('feed')} />
                </div>
              ) : activeNavTab === 'dashboard' ? (
                <div className="max-w-[1240px] mx-auto animate-fade-slide">
                  <DynamicDashboardView
                    onNavigateTab={(tab) => {
                      if (tab === 'feed' || tab === 'messages' || tab === 'notifications' || tab === 'profile') {
                        setActiveNavTab(tab);
                      }
                    }}
                  />
                </div>
              ) : (
                /* Universal Feed: Exact layout from second image */
                <div className="flex flex-col lg:flex-row justify-center items-start gap-6 max-w-[1040px] mx-auto">
                  {/* Center Feed Column */}
                  <div className="w-full max-w-[640px] flex-1 min-w-0">
                    <Feed searchQuery={searchQuery} />
                  </div>

                  {/* Right Recommendations Column - placed exactly to the right of feed */}
                  <div className="hidden lg:block w-[340px] flex-shrink-0 space-y-3.5 sticky top-[94px]">
                    <Recommendations />
                    <OpportunityCard />
                  </div>

                  {/* Fallback for smaller screens: Recommendations appear below feed */}
                  <div className="block lg:hidden w-full space-y-3.5 max-w-[640px] mx-auto mt-4">
                    <Recommendations />
                    <OpportunityCard />
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* 3. Floating Bottom-Right Messages Panel (hidden when on full messages page) */}
        {activeNavTab !== 'messages' && (
          <MessagesWidget
            isOpen={isMessagesOpen}
            onToggle={() => setIsMessagesOpen(!isMessagesOpen)}
          />
        )}

        {/* 4. Mobile Bottom Navigation */}
        <MobileNavigation
          activeTab={activeNavTab}
          onSelectTab={handleSelectNavTab}
          onToggleMessages={() => setIsMessagesOpen(!isMessagesOpen)}
        />

        {/* Global Role Request Modal */}
        <RoleRequestModal
          isOpen={isSignupOpen}
          onClose={() => setIsSignupOpen(false)}
          currentUserProfile={userProfile}
          onRequestSubmitted={() => setUserProfile(getUserProfile())}
        />
      </div>
    </ToastProvider>
  );
};
