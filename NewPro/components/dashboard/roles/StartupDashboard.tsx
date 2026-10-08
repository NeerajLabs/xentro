'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  FileCheck2,
  FolderKanban,
  Target,
  DollarSign,
  FolderLock,
  FileText,
  Settings,
  Eye,
  EyeOff,
  ArrowLeft,
  CreditCard,
  Users,
} from 'lucide-react';
import { UserProfile } from '@/lib/userProfile';
import { getStartupGhostMode, setStartupGhostMode } from '@/lib/startupProfileState';
import { StartupOverview } from '../startup/StartupOverview';
import { StartupProfileManager } from '../startup/StartupProfileManager';
import { StartupMyApplications } from '../startup/StartupMyApplications';
import { StartupMyListings } from '../startup/StartupMyListings';
import { StartupAskManager } from '../startup/StartupAskManager';
import { StartupFinanceDashboard } from '../startup/StartupFinanceDashboard';
import { StartupDDLocker } from '../startup/StartupDDLocker';
import { StartupContentManager } from '../startup/StartupContentManager';
import { StartupBillingManager } from '../startup/StartupBillingManager';
import { StartupSettings } from '../startup/StartupSettings';
import { StartupConnections } from '../startup/StartupConnections';
import { StartupProfileView } from '../StartupProfileView';
import { connectionService } from '@/lib/connectionService';
import { useToast } from '@/components/ui/Toast';

export type StartupWorkspaceTab =
  | 'overview'
  | 'connections'
  | 'my_applications'
  | 'my_listings'
  | 'finances'
  | 'profile'
  | 'ask'
  | 'dd_locker'
  | 'content'
  | 'billing'
  | 'settings';

interface StartupDashboardProps {
  profile: UserProfile;
  onNavigateTab?: (tabId: string) => void;
}

export const StartupDashboard: React.FC<StartupDashboardProps> = ({ profile, onNavigateTab }) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<StartupWorkspaceTab>('overview');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);

  useEffect(() => {
    setIsGhostMode(getStartupGhostMode());
    const handleGhostChanged = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.isGhostMode !== undefined) {
        setIsGhostMode(ce.detail.isGhostMode);
      }
    };
    window.addEventListener('xentro-ghost-mode-changed', handleGhostChanged);
    return () => {
      window.removeEventListener('xentro-ghost-mode-changed', handleGhostChanged);
    };
  }, []);

  const [connectedCount, setConnectedCount] = useState(() => connectionService.getConnectedCount());

  useEffect(() => {
    const refresh = () => {
      setConnectedCount(connectionService.getConnectedCount());
    };
    connectionService.syncFromServer().then(refresh).catch(() => {});
    window.addEventListener('xentro-connections-updated', refresh);
    window.addEventListener('xentro-connection-event', refresh);
    return () => {
      window.removeEventListener('xentro-connections-updated', refresh);
      window.removeEventListener('xentro-connection-event', refresh);
    };
  }, []);

  const handleNavigateSubTab = (tabId: string) => {
    if (tabId === 'opportunities') {
      setActiveSubTab('my_applications');
    } else if (tabId === 'connections') {
      setActiveSubTab('connections');
    } else if (tabId === 'cap_table' || tabId === 'runway' || tabId === 'finance') {
      setActiveSubTab('finances');
    } else if (
      tabId === 'overview' ||
      tabId === 'connections' ||
      tabId === 'my_applications' ||
      tabId === 'my_listings' ||
      tabId === 'finances' ||
      tabId === 'profile' ||
      tabId === 'ask' ||
      tabId === 'dd_locker' ||
      tabId === 'content' ||
      tabId === 'billing' ||
      tabId === 'settings'
    ) {
      setActiveSubTab(tabId);
    }
  };

  const navItems: Array<{
    id: StartupWorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'connections',
      label: 'Connections',
      icon: Users,
      badge: connectedCount > 0 ? connectedCount : undefined,
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold',
    },
    { id: 'my_applications', label: 'My Applications', icon: FileCheck2, badge: '5 Active' },
    { id: 'my_listings', label: 'My Listings', icon: FolderKanban },
    { id: 'finances', label: 'Finances', icon: DollarSign },
    { id: 'profile', label: 'Profile', icon: Building2 },
    { id: 'ask', label: 'Ask', icon: Target, badge: 'Active' },
    { id: 'dd_locker', label: 'DD Locker', icon: FolderLock, badge: 2, badgeColor: 'bg-purple-500 text-white' },
    { id: 'content', label: 'Content', icon: FileText },
    { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // If founder toggles preview of public profile
  if (isPreviewMode) {
    return (
      <div className="space-y-4 animate-fade-slide">
        {/* Floating Top Banner indicating Preview Mode */}
        <div className="sticky top-20 z-40 p-4 rounded-2xl bg-[#101212] text-white border border-[#262A29] shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#D9FF3F]/20 text-[#D9FF3F]">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold font-sora block text-white">
                Viewing Public Profile Preview
              </span>
              <p className="text-[11px] text-[#B6B8B7]">
                This is how investors, mentors, and ESP partners see your startup on Xentro.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setIsPreviewMode(false);
              showToast('Returned to Startup Dashboard Workspace', 'info');
            }}
            className="px-4 py-2 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Workspace</span>
          </button>
        </div>

        {/* Render Public Profile */}
        <StartupProfileView
          isOwnProfile={true}
          onBackToFeed={() => setIsPreviewMode(false)}
          onBackToDiscover={() => setIsPreviewMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ghost Mode Active Dashboard Banner */}
      {isGhostMode && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-slide">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <EyeOff className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300">
                Ghost Mode Active
              </h4>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-400/90">
                Your Startup Profile is currently hidden from discovery.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStartupGhostMode(false);
              setIsGhostMode(false);
              showToast('Your Startup Profile is now Public and discoverable across Xentro!', 'success');
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-xs font-bold text-[#101212] transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs self-start sm:self-auto"
          >
            Make Profile Public
          </button>
        </div>
      )}

      {/* Target Restructured Sub-Navigation Horizontal Bar */}
      <div className="p-1.5 rounded-xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSubTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none active:scale-95 ${
                  isSelected
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      item.badgeColor
                        ? item.badgeColor
                        : isSelected
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                        : 'bg-gray-200 dark:bg-[#262A29] text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Direct Action to Preview Public Profile */}
        <button
          onClick={() => {
            setIsPreviewMode(true);
            showToast('Opening Public Profile Preview', 'info');
          }}
          className="hidden md:flex px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer items-center gap-1.5 whitespace-nowrap border border-gray-200 dark:border-[#262A29] flex-shrink-0"
          title="Preview public profile as seen by investors"
        >
          <Eye className="w-3.5 h-3.5 text-[#101212] dark:text-[#D9FF3F]" />
          <span>Preview Profile</span>
        </button>
      </div>

      {/* Module Content Rendering */}
      <div className="animate-fade-slide">
        {activeSubTab === 'overview' && (
          <StartupOverview onNavigateTab={handleNavigateSubTab} />
        )}

        {activeSubTab === 'connections' && (
          <StartupConnections />
        )}

        {activeSubTab === 'my_applications' && (
          <StartupMyApplications onNavigateTab={handleNavigateSubTab} />
        )}

        {activeSubTab === 'my_listings' && <StartupMyListings />}

        {activeSubTab === 'finances' && (
          <StartupFinanceDashboard onNavigateTab={handleNavigateSubTab} />
        )}

        {activeSubTab === 'profile' && (
          <StartupProfileManager
            onPreviewPublicProfile={() => setIsPreviewMode(true)}
            onNavigateTab={handleNavigateSubTab}
          />
        )}

        {activeSubTab === 'ask' && <StartupAskManager />}

        {activeSubTab === 'dd_locker' && <StartupDDLocker />}

        {activeSubTab === 'content' && <StartupContentManager />}

        {activeSubTab === 'billing' && (
          <StartupBillingManager currentRole="Owner / Founder" />
        )}

        {activeSubTab === 'settings' && <StartupSettings />}
      </div>
    </div>
  );
};
