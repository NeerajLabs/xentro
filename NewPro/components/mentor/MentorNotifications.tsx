'use client';

import React, { useState } from 'react';
import {
  Bell,
  Check,
  UserCheck,
  Calendar,
  MessageSquare,
  Briefcase,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { MentorNotificationItem } from '@/types/mentor';
import { useToast } from '@/components/ui/Toast';

interface MentorNotificationsProps {
  notifications: MentorNotificationItem[];
  onNavigateTab: (tabId: string) => void;
}

export const MentorNotifications: React.FC<MentorNotificationsProps> = ({
  notifications: initialNotifications,
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const [items, setItems] = useState<MentorNotificationItem[]>(initialNotifications);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All mentor notifications marked as read', 'info');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'request':
        return <UserCheck className="w-4 h-4 text-[#101212] dark:text-[#D9FF3F]" />;
      case 'meeting':
        return <Calendar className="w-4 h-4 text-[#9EBE12] dark:text-[#D9FF3F]" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-emerald-500" />;
      case 'opportunity':
        return <Briefcase className="w-4 h-4 text-amber-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#D9FF3F]" />;
    }
  };

  return (
    <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-6 shadow-subtle space-y-5 animate-fade-slide">
      <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-[#262A29]">
        <div>
          <h3 className="text-base font-bold text-[#101212] dark:text-white">
            Mentor Notifications Center
          </h3>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Real-time alerts for founder requests, scheduled meetings, and network opportunities.
          </p>
        </div>

        <button
          onClick={markAllRead}
          className="text-xs font-semibold text-[#101212] dark:text-[#D9FF3F] hover:underline"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-3">
        {items.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              if (n.actionUrl) onNavigateTab(n.actionUrl);
            }}
            className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-start gap-3.5 ${
              n.read
                ? 'border-gray-100 dark:border-[#262A29] bg-white dark:bg-[#202422]'
                : 'border-[#D9FF3F]/40 bg-[#D9FF3F]/5 dark:bg-[#D9FF3F]/10 shadow-xs'
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] flex items-center justify-center flex-shrink-0">
              {getIcon(n.type)}
            </div>

            <div className="space-y-0.5 flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-bold text-[#101212] dark:text-white">
                  {n.title}
                </h4>
                <span className="text-[10px] text-[#565B59] dark:text-[#B6B8B7] font-mono">
                  {n.time}
                </span>
              </div>
              <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                {n.subtitle}
              </p>
            </div>

            {!n.read && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#D9FF3F] border border-[#101212] self-center flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
