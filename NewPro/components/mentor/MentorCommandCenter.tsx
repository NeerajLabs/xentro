'use client';

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Calendar,
  UserCheck,
  Eye,
} from 'lucide-react';
import {
  MentorshipRequest,
  ActiveMentorship,
  MentorMeeting,
  DiscoverStartup,
  MentorOpportunityItem,
} from '@/types/mentor';
import { MentorStats } from './MentorStats';
import { UpcomingSection } from './UpcomingSection';
import { QuickActions } from './QuickActions';
import { mentorUser } from '@/data/mentorMockData';

interface MentorCommandCenterProps {
  requests: MentorshipRequest[];
  activeMentorships: ActiveMentorship[];
  meetings: MentorMeeting[];
  startups: DiscoverStartup[];
  opportunities: MentorOpportunityItem[];
  onNavigateTab: (tabId: string, subTab?: string) => void;
  onViewPublicProfile: () => void;
  onOpenMessages?: () => void;
}

export const MentorCommandCenter: React.FC<MentorCommandCenterProps> = ({
  requests,
  activeMentorships,
  meetings,
  startups,
  opportunities,
  onNavigateTab,
  onViewPublicProfile,
  onOpenMessages,
}) => {
  const pendingRequests = requests.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6 animate-fade-slide pb-12">
      {/* 1. Command Center Hero Greeting */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 sm:p-7 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mentor Command Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#101212] dark:text-white tracking-tight font-display">
            Good morning, Dr. Arvind
          </h1>
          <p className="text-xs sm:text-sm text-[#565B59] dark:text-[#B6B8B7]">
            Here's what needs your attention today. You have{' '}
            <span className="font-bold text-[#101212] dark:text-white">
              {meetings.length} scheduled sessions
            </span>{' '}
            and{' '}
            <span className="font-bold text-[#101212] dark:text-[#D9FF3F]">
              {pendingRequests.length} pending founder requests
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            onClick={onViewPublicProfile}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-[#F7F8F6] hover:bg-gray-100 dark:bg-[#202422] dark:hover:bg-gray-800 text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
            title="View public profile as seen by founders"
          >
            <Eye className="w-3.5 h-3.5 text-[#565B59] dark:text-[#B6B8B7]" />
            <span>View Public Profile</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Stats Grid */}
      <MentorStats
        pendingCount={pendingRequests.length}
        activeCount={activeMentorships.length}
        upcomingMeetingsCount={meetings.length}
        unreadMessagesCount={3}
        newConnectionsCount={12}
        savedOpportunitiesCount={6}
        onNavigateTab={onNavigateTab}
      />

      {/* 3. Upcoming Meetings & Urgent Attention Section */}
      <UpcomingSection
        meetings={meetings}
        pendingRequests={pendingRequests}
        onNavigateTab={onNavigateTab}
      />

      {/* 4. Quick Operational Actions */}
      <QuickActions
        onNavigateTab={onNavigateTab}
        onOpenMessages={onOpenMessages}
      />

      {/* 5. Recommended Startups Quick Bar (Discover Teaser) */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#101212] dark:text-white font-display">
              Recommended Startups Seeking Mentorship
            </h3>
            <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
              Matched based on your Generative AI and GTM advisory background
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('discover')}
            className="text-xs font-bold text-[#101212] dark:text-[#D9FF3F] hover:underline flex items-center gap-1"
          >
            <span>Explore all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {startups.slice(0, 3).map((st) => (
            <div
              key={st.id}
              onClick={() => onNavigateTab('discover')}
              className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#202422] space-y-1.5 cursor-pointer hover:border-[#D9FF3F]/60 transition-all group"
            >
              <div className="flex items-center gap-2.5">
                <img src={st.logo} alt={st.name} className="w-8 h-8 rounded-lg object-cover" />
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#101212] dark:text-white truncate group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F] transition-colors">
                    {st.name}
                  </h4>
                  <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] truncate block">{st.industry}</span>
                </div>
              </div>
              <p className="text-[11px] text-[#565B59] dark:text-[#B6B8B7] line-clamp-1">
                Looking for: <span className="font-semibold text-[#101212] dark:text-gray-200">{st.needsHelpWith[0]}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
