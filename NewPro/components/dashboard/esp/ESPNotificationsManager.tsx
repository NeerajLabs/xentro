'use client';

import React, { useState } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  Sparkles,
  CreditCard,
  ShieldCheck,
  FileText,
  AlertCircle,
  Clock,
  Trash2,
  Filter,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { mockESPNotifications } from '@/data/espWorkspaceData';
import { ESPWorkspaceNotification } from '@/types/esp';

interface ESPNotificationsManagerProps {
  onNavigateTab?: (tabId: string) => void;
}

export const ESPNotificationsManager: React.FC<ESPNotificationsManagerProps> = ({
  onNavigateTab,
}) => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<ESPWorkspaceNotification[]>(mockESPNotifications);
  const [activeCategory, setActiveCategory] = useState<ESPWorkspaceNotification['category']>('All');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifs = notifications.filter((n) => {
    if (activeCategory === 'All') return true;
    return n.category === activeCategory;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('All institutional alerts marked as read.', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-slide">
      {/* 0. Header with Action */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#101212] dark:text-white font-heading">
              Institutional Notifications Center
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D9FF3F] text-[#101212]">
                {unreadCount} Unread Alerts
              </span>
            )}
          </div>
          <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">
            Stay updated on new endorsement requests, cohort applications, billing invoices, and regulatory compliance.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-[#262A29] hover:border-[#D9FF3F] text-xs font-bold text-[#101212] dark:text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-subtle self-start sm:self-auto"
          >
            <CheckCheck className="w-3.5 h-3.5 text-[#D9FF3F]" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* 1. Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 rounded-xl bg-gray-100 dark:bg-[#202422] border border-gray-200 dark:border-[#262A29] w-fit">
        {(['All', 'Endorsements', 'Applications', 'Billing', 'Compliance', 'System'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeCategory === cat
                ? 'bg-white dark:bg-[#181B1A] text-[#101212] dark:text-[#D9FF3F] shadow-xs'
                : 'text-[#565B59] dark:text-[#B6B8B7]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2. Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-center space-y-2">
            <Bell className="w-8 h-8 text-gray-400 mx-auto" />
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7]">No notifications in this category.</p>
          </div>
        ) : (
          filteredNotifs.map((n) => {
            const isUnread = !n.read;
            return (
              <div
                key={n.id}
                onClick={() => handleMarkAsRead(n.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                  isUnread
                    ? 'bg-[#D9FF3F]/5 border-[#D9FF3F]/40 dark:bg-[#D9FF3F]/5'
                    : 'bg-white dark:bg-[#181B1A] border-[#E5E7EB] dark:border-[#262A29]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    n.category === 'Endorsements'
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : n.category === 'Applications'
                      ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400'
                      : n.category === 'Billing'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
                      : n.category === 'Compliance'
                      ? 'bg-[#D9FF3F]/20 text-[#101212] dark:text-[#D9FF3F]'
                      : 'bg-gray-100 dark:bg-[#262A29] text-gray-500'
                  }`}>
                    {n.category === 'Endorsements' && <Sparkles className="w-4 h-4" />}
                    {n.category === 'Applications' && <FileText className="w-4 h-4" />}
                    {n.category === 'Billing' && <CreditCard className="w-4 h-4" />}
                    {n.category === 'Compliance' && <ShieldCheck className="w-4 h-4" />}
                    {n.category === 'System' && <Bell className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#101212] dark:text-white">
                        {n.title}
                      </h4>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#D9FF3F]" />
                      )}
                    </div>
                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                      {n.description}
                    </p>
                    <span className="text-[10px] font-medium text-[#565B59] dark:text-[#B6B8B7] block pt-1">
                      {n.timestamp} • {n.category}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {isUnread && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkAsRead(n.id);
                      }}
                      title="Mark as read"
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-[#202422] text-[#565B59] transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
