'use client';

import React from 'react';
import {
  UserCheck,
  Calendar,
  Video,
  MessageSquare,
  Compass,
  Briefcase,
} from 'lucide-react';

interface QuickActionsProps {
  onNavigateTab: (tabId: string, subTab?: string) => void;
  onOpenNewMeeting?: () => void;
  onOpenMessages?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onNavigateTab,
  onOpenNewMeeting,
  onOpenMessages,
}) => {
  const actions = [
    {
      id: 'requests',
      label: 'View Requests',
      subtext: 'Pending founder reviews',
      icon: UserCheck,
      color: 'text-[#101212] dark:text-[#D9FF3F]',
      bg: 'bg-[#D9FF3F]/20',
      onClick: () => onNavigateTab('mentorship', 'requests'),
    },
    {
      id: 'availability',
      label: 'Schedule Availability',
      subtext: 'Configure open time slots',
      icon: Calendar,
      color: 'text-[#101212] dark:text-[#D9FF3F]',
      bg: 'bg-[#D9FF3F]/15',
      onClick: () => onNavigateTab('meetings', 'availability'),
    },
    {
      id: 'meeting',
      label: 'Start a Meeting',
      subtext: 'Launch instant session',
      icon: Video,
      color: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100 dark:bg-emerald-950/40',
      onClick: () => {
        if (onOpenNewMeeting) onOpenNewMeeting();
        else onNavigateTab('meetings', 'calendar');
      },
    },
    {
      id: 'message',
      label: 'Message a Founder',
      subtext: 'Chat with active mentees',
      icon: MessageSquare,
      color: 'text-[#101212] dark:text-[#D9FF3F]',
      bg: 'bg-[#D9FF3F]/10',
      onClick: () => {
        if (onOpenMessages) onOpenMessages();
        else onNavigateTab('messages');
      },
    },
    {
      id: 'discover',
      label: 'Explore Startups',
      subtext: 'Filter by stage & tech needs',
      icon: Compass,
      color: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-100 dark:bg-amber-950/40',
      onClick: () => onNavigateTab('discover', 'startups'),
    },
    {
      id: 'opportunities',
      label: 'Explore Opportunities',
      subtext: 'Advisory, speaking & jury',
      icon: Briefcase,
      color: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-100 dark:bg-rose-950/40',
      onClick: () => onNavigateTab('opportunities'),
    },
  ];

  return (
    <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle space-y-3.5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#101212] dark:text-white">
          Quick Actions
        </h3>
        <span className="text-[11px] text-[#565B59] dark:text-[#B6B8B7]">
          Operational Shortcuts
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              onClick={act.onClick}
              className="p-3 rounded-xl border border-[#E5E7EB] dark:border-[#262A29] bg-[#F7F8F6] dark:bg-[#202422] hover:border-[#D9FF3F]/50 hover:bg-white dark:hover:bg-[#262A29] transition-all text-left flex flex-col justify-between space-y-2 group active:scale-95 shadow-2xs"
            >
              <div
                className={`w-8 h-8 rounded-xl ${act.bg} ${act.color} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <span className="block text-xs font-bold text-[#101212] dark:text-white group-hover:text-[#101212] dark:group-hover:text-[#D9FF3F] transition-colors leading-tight">
                  {act.label}
                </span>
                <span className="block text-[10px] text-[#565B59] dark:text-[#B6B8B7] leading-tight line-clamp-1">
                  {act.subtext}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
