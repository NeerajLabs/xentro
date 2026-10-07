'use client';

import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  FolderLock,
  MessageSquare,
  Briefcase,
  Users,
  Target,
  Sparkles,
  TrendingUp,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { initialStartupNotifications, StartupNotification } from '@/data/startupWorkspaceData';
import { useToast } from '@/components/ui/Toast';

interface StartupNotificationsProps {
  onNavigateTab: (tabId: string) => void;
}

export const StartupNotifications: React.FC<StartupNotificationsProps> = ({ onNavigateTab }) => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<StartupNotification[]>(initialStartupNotifications);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'DD Locker',
    'Ask Responses',
    'Opportunities',
    'Mentorship',
    'Connections',
    'Platform Updates',
  ];

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All notifications marked as read', 'success');
  };

  const handleOpenItem = (n: StartupNotification) => {
    handleMarkAsRead(n.id);
    onNavigateTab(n.targetTab);
    showToast(`Opening ${n.title}`, 'info');
  };

  const filteredNotifications = notifications.filter((n) =>
    selectedCategory === 'All' ? true : n.category === selectedCategory
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DD Locker':
        return <FolderLock className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'Ask Responses':
        return <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Opportunities':
        return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'Mentorship':
        return <Users className="w-4 h-4 text-[#D9FF3F]" />;
      default:
        return <Sparkles className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl sm:text-2xl font-bold font-sora text-[#101212] dark:text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#D9FF3F]" />
              <span>Notification Intelligence Center</span>
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9FF3F] text-[#101212] shadow-2xs">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Real-time alerts for investor due diligence access, grant deadlines, mentor updates, and ask proposals.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter categories */}
      <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#F7F8F6] dark:bg-[#202422] border border-[#E5E7EB] dark:border-[#262A29] overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-2xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 animate-fade-slide">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-xs text-[#565B59] dark:text-[#B6B8B7]">
            No notifications in this category.
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 sm:p-5 rounded-3xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !notif.read
                  ? 'bg-[#F7F8F6] dark:bg-[#202422] border-[#D9FF3F]/40 shadow-xs'
                  : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29]'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-white dark:bg-[#181B1A] border border-gray-200 dark:border-[#262A29] shadow-2xs flex-shrink-0">
                  {getCategoryIcon(notif.category)}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-200 dark:bg-[#262A29] text-[#101212] dark:text-white">
                      {notif.category}
                    </span>
                    <span className="text-[11px] font-mono text-[#565B59] dark:text-[#B6B8B7]">
                      {notif.timestamp}
                    </span>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-[#D9FF3F]" />
                    )}
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-[#101212] dark:text-white">
                    {notif.title}
                  </h4>
                  <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
                    {notif.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {!notif.read && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer"
                    title="Mark as read"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleOpenItem(notif)}
                  className="px-3.5 py-1.5 rounded-xl bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <span>Open</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
