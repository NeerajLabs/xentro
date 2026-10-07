'use client';

import React from 'react';
import {
  UserCheck,
  Users,
  Calendar,
  MessageSquare,
  Sparkles,
  Bookmark,
} from 'lucide-react';

interface MentorStatsProps {
  pendingCount: number;
  activeCount: number;
  upcomingMeetingsCount: number;
  unreadMessagesCount: number;
  newConnectionsCount: number;
  savedOpportunitiesCount: number;
  onNavigateTab: (tabId: string) => void;
}

export const MentorStats: React.FC<MentorStatsProps> = ({
  pendingCount,
  activeCount,
  upcomingMeetingsCount,
  unreadMessagesCount,
  newConnectionsCount,
  savedOpportunitiesCount,
  onNavigateTab,
}) => {
  const stats = [
    {
      id: 'pending',
      label: 'Pending Requests',
      value: pendingCount,
      subtext: 'Requires your response',
      actionText: 'View requests →',
      tabId: 'mentorship',
      icon: UserCheck,
      highlight: true,
    },
    {
      id: 'active',
      label: 'Active Mentorships',
      value: activeCount,
      subtext: 'High-growth startups',
      actionText: 'Manage active →',
      tabId: 'mentorship',
      icon: Users,
      highlight: false,
    },
    {
      id: 'meetings',
      label: 'Upcoming Meetings',
      value: upcomingMeetingsCount,
      subtext: 'Scheduled this week',
      actionText: 'View calendar →',
      tabId: 'meetings',
      icon: Calendar,
      highlight: upcomingMeetingsCount > 0,
    },
    {
      id: 'messages',
      label: 'Unread Messages',
      value: unreadMessagesCount,
      subtext: 'Active founder threads',
      actionText: 'Open messages →',
      tabId: 'messages',
      icon: MessageSquare,
      highlight: false,
    },
    {
      id: 'connections',
      label: 'New Connections',
      value: newConnectionsCount,
      subtext: 'In the last 14 days',
      actionText: 'Explore network →',
      tabId: 'discover',
      icon: Sparkles,
      highlight: false,
    },
    {
      id: 'opportunities',
      label: 'Saved Opportunities',
      value: savedOpportunitiesCount,
      subtext: 'Advisory & speaking',
      actionText: 'View saved →',
      tabId: 'opportunities',
      icon: Bookmark,
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((item) => {
        const Icon = item.icon;
        return (
          <div
            key={item.id}
            onClick={() => onNavigateTab(item.tabId)}
            className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer text-left flex flex-col justify-between group hover:scale-[1.02] active:scale-[0.98] ${
              item.highlight
                ? 'bg-white dark:bg-[#181B1A] border-[#D9FF3F]/60 shadow-sm ring-1 ring-[#D9FF3F]/20'
                : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29] shadow-subtle hover:border-[#D9FF3F]/40'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#565B59] dark:text-[#B6B8B7] leading-tight">
                  {item.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    item.highlight
                      ? 'bg-[#D9FF3F] text-[#101212]'
                      : 'bg-[#F7F8F6] dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <p
                className={`text-2xl font-black tracking-tight ${
                  item.highlight
                    ? 'text-[#101212] dark:text-[#D9FF3F]'
                    : 'text-[#101212] dark:text-white'
                }`}
              >
                {item.value}
              </p>
            </div>

            <div className="pt-2 mt-2 border-t border-gray-100 dark:border-[#262A29] flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#101212] dark:text-[#D9FF3F] group-hover:underline flex items-center gap-1">
                {item.actionText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
