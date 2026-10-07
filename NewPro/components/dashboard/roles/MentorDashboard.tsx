'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  MessageSquare,
  Compass,
  Briefcase,
  Home,
  Users,
  User,
  CreditCard,
  Bell,
  Settings,
  Eye,
  ArrowLeft,
  Sparkles,
  Clock,
  Star,
  Check,
  ExternalLink,
  ArrowRight,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { UserProfile } from '@/lib/userProfile';
import { useToast } from '@/components/ui/Toast';

// Sub-components
import { MentorMeetings } from '@/components/mentor/MentorMeetings';
import { MentorshipModule } from '@/components/mentor/MentorshipModule';
import { MentorDiscover } from '@/components/mentor/MentorDiscover';
import { MentorOpportunities } from '@/components/mentor/MentorOpportunities';
import { MentorProfileManage } from '@/components/mentor/MentorProfileManage';
import { MentorNotifications } from '@/components/mentor/MentorNotifications';
import { MentorSettings } from '@/components/mentor/MentorSettings';
import { MentorBillingManager } from '@/components/mentor/MentorBillingManager';
import { MentorProfileView } from '@/components/dashboard/MentorProfileView';
import { Feed } from '@/components/dashboard/Feed';
import { FullMessagesPage } from '@/components/dashboard/FullMessagesPage';
import { MentorOverviewContent } from '@/components/mentor/MentorOverviewContent';
import { connectionService } from '@/lib/connectionService';
import { notificationService } from '@/lib/notificationService';
import { messagingService } from '@/lib/messagingService';
import { getActiveMentorships } from '@/lib/mentorshipService';
import {
  initialMentorMeetings,
  defaultAvailability,
  initialDiscoverStartups,
  initialMentorOpportunities,
  initialMentorNotifications,
} from '@/data/mentorMockData';

export type MentorWorkspaceTab =
  | 'home'
  | 'meetings'
  | 'mentorship'
  | 'messages'
  | 'explore'
  | 'opportunities'
  | 'feed'
  | 'connections'
  | 'profile'
  | 'billing'
  | 'notifications'
  | 'settings';

interface MentorDashboardProps {
  profile: UserProfile;
  onNavigateTab?: (tabId: string) => void;
}

export const MentorDashboard: React.FC<MentorDashboardProps> = ({ profile, onNavigateTab }) => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<MentorWorkspaceTab>('home');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Canonical Navigation specification with live real-time badge counts
  const [connectedPartners, setConnectedPartners] = useState(() => connectionService.getConnectedPartners());
  const [connectedCount, setConnectedCount] = useState(() => connectionService.getConnectedCount());

  useEffect(() => {
    const refresh = () => {
      setConnectedPartners(connectionService.getConnectedPartners());
      setConnectedCount(connectionService.getConnectedCount());
    };
    window.addEventListener('xentro-connections-updated', refresh);
    window.addEventListener('xentro-connection-event', refresh);
    return () => {
      window.removeEventListener('xentro-connections-updated', refresh);
      window.removeEventListener('xentro-connection-event', refresh);
    };
  }, []);

  const unreadNotifsCount = notificationService.getUnreadCount();
  const unreadMessagesCount = messagingService.getUnreadCount();
  const activeMentorshipsCount = getActiveMentorships().length;

  const navItems: Array<{
    id: MentorWorkspaceTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }> = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'meetings', label: 'Meetings', icon: Calendar },
    {
      id: 'mentorship',
      label: 'Mentorship',
      icon: GraduationCap,
      badge: activeMentorshipsCount > 0 ? activeMentorshipsCount : undefined,
      badgeColor: 'bg-[#D9FF3F] text-[#101212]',
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-blue-500 text-white',
    },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
    { id: 'feed', label: 'Feed', icon: Home },
    {
      id: 'connections',
      label: 'Connections',
      icon: Users,
      badge: connectedCount > 0 ? connectedCount : undefined,
    },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'billing', label: 'Billing & Payments', icon: CreditCard },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifsCount > 0 ? unreadNotifsCount : undefined,
      badgeColor: 'bg-red-500 text-white',
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // If viewing Public Profile Preview
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
                  Viewing Public Mentor Profile (View Layer)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#D9FF3F]/20 text-[#D9FF3F]">
                  Live Preview
                </span>
              </div>
              <p className="text-xs text-[#B6B8B7]">
                This is exactly how founders, investors, and ecosystem partners view your mentor profile. All management is performed in your Dashboard.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsPreviewMode(false)}
            className="px-4 py-2 rounded-xl bg-white text-[#101212] hover:bg-[#D9FF3F] text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Public Profile View Component */}
        <MentorProfileView
          isOwnProfile={true}
          onOpenDashboard={() => setIsPreviewMode(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 1. Header Toolbar with Preview Trigger & Subnav Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <h2 className="text-sm font-bold font-sora text-[#101212] dark:text-white uppercase tracking-wider">
              Mentor Operational Workspace
            </h2>
          </div>

          <button
            onClick={() => setIsPreviewMode(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto shadow-2xs"
            title="Preview how founders view your profile"
          >
            <Eye className="w-3.5 h-3.5 text-[#9EBE12] dark:text-[#D9FF3F]" />
            <span>Preview Public Profile</span>
          </button>
        </div>

        {/* 12-Module Subnav Bar */}
        <div className="pt-2 border-t border-gray-100 dark:border-[#262A29] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                    : 'text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#202422]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                        : item.badgeColor || 'bg-gray-200 dark:bg-[#262A29] text-[#565B59] dark:text-[#B6B8B7]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DYNAMIC MODULE RENDERING                               */}
      {/* ========================================================= */}
      <div>
        {/* MODULE 1: HOME (Dynamic Mentor Operational Overview) */}
        {activeSubTab === 'home' && (
          <MentorOverviewContent onNavigateModule={(tab) => setActiveSubTab(tab as any)} />
        )}

        {/* MODULE 2: MEETINGS (One-Time Sessions & Availability) */}
        {activeSubTab === 'meetings' && (
          <MentorMeetings
            meetings={initialMentorMeetings}
            availabilityConfig={defaultAvailability}
          />
        )}

        {/* MODULE 3: MENTORSHIP (Structured Engagements — Immediately after Meetings!) */}
        {activeSubTab === 'mentorship' && (
          <MentorshipModule
            onNavigateMeetings={() => setActiveSubTab('meetings')}
            onNavigateMessages={(name) => setActiveSubTab('messages')}
          />
        )}

        {/* MODULE 4: MESSAGES */}
        {activeSubTab === 'messages' && (
          <FullMessagesPage onBackToFeed={() => setActiveSubTab('home')} />
        )}

        {/* MODULE 5: EXPLORE */}
        {activeSubTab === 'explore' && (
          <MentorDiscover startups={initialDiscoverStartups} />
        )}

        {/* MODULE 6: OPPORTUNITIES */}
        {activeSubTab === 'opportunities' && (
          <MentorOpportunities opportunities={initialMentorOpportunities} />
        )}

        {/* MODULE 7: FEED */}
        {activeSubTab === 'feed' && (
          <div className="max-w-[640px] mx-auto">
            <Feed />
          </div>
        )}

        {/* MODULE 8: CONNECTIONS */}
        {activeSubTab === 'connections' && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262A29]">
              <div>
                <h3 className="text-base font-bold text-[#101212] dark:text-white">
                  Professional Mentor Connections
                </h3>
                <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                  Connected network founders, co-mentors, and institutional ecosystem partners from MongoDB
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                {connectedCount} Active Connection{connectedCount === 1 ? '' : 's'}
              </span>
            </div>

            {connectedPartners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {connectedPartners.map((c) => (
                  <div key={c.id} className="p-4 rounded-xl bg-gray-50 dark:bg-[#202422] border border-gray-100 dark:border-[#262A29] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={c.avatar || '/xentro-logo.png'} alt={c.name} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <h4 className="text-xs font-bold text-[#101212] dark:text-white">{c.name}</h4>
                        <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">{c.role}</p>
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">Connected</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        messagingService.startOrOpenConversation({
                          id: c.id,
                          name: c.name,
                          role: c.role,
                          avatar: c.avatar,
                        });
                        showToast(`Opening conversation with ${c.name}`);
                      }}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-[#565B59] transition-colors"
                      title="Open conversation"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-gray-200 dark:border-[#262A29] rounded-xl">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No active connections yet</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Browse ecosystem founders and partners in Discover to send connection requests or accept pending requests in Notifications.
                </p>
              </div>
            )}
          </div>
        )}

        {/* MODULE 9: PROFILE */}
        {activeSubTab === 'profile' && (
          <MentorProfileManage onViewPublicProfile={() => setIsPreviewMode(true)} />
        )}

        {/* MODULE 10: BILLING & PAYMENTS */}
        {activeSubTab === 'billing' && (
          <MentorBillingManager />
        )}

        {/* MODULE 11: NOTIFICATIONS */}
        {activeSubTab === 'notifications' && (
          <MentorNotifications
            notifications={initialMentorNotifications}
            onNavigateTab={(tab) => setActiveSubTab(tab as any)}
          />
        )}

        {/* MODULE 12: SETTINGS */}
        {activeSubTab === 'settings' && <MentorSettings />}
      </div>
    </div>
  );
};
