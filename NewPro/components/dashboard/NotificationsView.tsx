'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Filter,
  Sparkles,
  Users,
  TrendingUp,
  ShieldAlert,
  Building2,
  Check,
  X,
  ExternalLink,
  Clock,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export interface NotificationItem {
  id: string;
  category: 'all' | 'mentorship' | 'investor' | 'system' | 'esp';
  title: string;
  description: string;
  time: string;
  unread: boolean;
  avatar?: string;
  actorName?: string;
  actorRole?: string;
  actionRequired?: boolean;
  actionType?: 'connection_request' | 'dd_access' | 'event_invite' | 'security_alert' | 'general';
}

import {
  notificationService,
  NOTIFICATIONS_UPDATED_EVENT,
  NotificationItem as ServiceNotificationItem,
} from '@/lib/notificationService';
import { messagingService, CONVERSATIONS_UPDATED_EVENT } from '@/lib/messagingService';
import { connectionService, CONNECTIONS_UPDATED_EVENT } from '@/lib/connectionService';

interface NotificationsViewProps {
  onBackToFeed: () => void;
  onSelectMessages?: () => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onBackToFeed, onSelectMessages }) => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<ServiceNotificationItem[]>(() =>
    notificationService.getNotifications()
  );
  const [activeFilter, setActiveFilter] = useState<'all' | 'message' | 'mentorship' | 'investor' | 'system'>('all');

  useEffect(() => {
    notificationService.syncFromServer().then(() => {
      setNotifications(notificationService.getNotifications());
    });

    const refresh = () => setNotifications(notificationService.getNotifications());
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    window.addEventListener(CONVERSATIONS_UPDATED_EVENT, refresh);
    window.addEventListener(CONNECTIONS_UPDATED_EVENT, refresh);
    window.addEventListener('xentro-connection-event', refresh);
    window.addEventListener('xentro-role-changed', refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener(CONVERSATIONS_UPDATED_EVENT, refresh);
      window.removeEventListener(CONNECTIONS_UPDATED_EVENT, refresh);
      window.removeEventListener('xentro-connection-event', refresh);
      window.removeEventListener('xentro-role-changed', refresh);
    };
  }, []);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'message') return item.category === 'message';
    if (activeFilter === 'mentorship') return item.category === 'mentorship';
    if (activeFilter === 'investor') return item.category === 'investor';
    if (activeFilter === 'system') return item.category === 'system' || item.category === 'esp';
    return true;
  });

  const markAllAsRead = () => {
    notificationService.markAllAsRead();
    setNotifications(notificationService.getNotifications());
    showToast('All notifications marked as read', 'success');
  };

  const handleClearAll = async () => {
    setNotifications([]);
    showToast('All notifications cleared successfully', 'success');
    await notificationService.clearAllNotifications();
  };

  const handleDismiss = (id: string) => {
    notificationService.markAsRead(id);
    setNotifications(notificationService.getNotifications());
    showToast('Notification marked as read', 'info');
  };

  const handleAction = async (id: string, action: 'accept' | 'decline' | 'grant' | 'view') => {
    const target = notifications.find((n) => n.id === id);
    notificationService.resolveAction(id, action === 'accept' ? 'Connection accepted.' : 'Connection request declined.');
    notificationService.markAsRead(id);
    setNotifications(notificationService.getNotifications());

    const connectionId = target?.connectionId || (id.startsWith('notif_conn_') ? id.replace('notif_conn_', '') : undefined);
    
    // Resolve authentic partner ID from notification or connection record
    let partnerId = target?.actorId;
    if (!partnerId && connectionId) {
      const rawConns = connectionService.getRawConnections();
      const matchingConn = rawConns.find((c) => c.id === connectionId);
      if (matchingConn) {
        partnerId = matchingConn.senderId;
      }
    }
    if (!partnerId) {
      partnerId = target?.actorName || 'partner';
    }

    if (action === 'accept') {
      await connectionService.acceptConnection(partnerId, connectionId);
      await notificationService.syncFromServer();
      setNotifications(notificationService.getNotifications());
      showToast(`Connection accepted! You and ${target?.actorName || 'partner'} are now connected.`, 'success');
    } else if (action === 'decline') {
      await connectionService.declineConnection(partnerId, connectionId);
      await notificationService.syncFromServer();
      setNotifications(notificationService.getNotifications());
      showToast('Connection request declined.', 'info');
    } else if (action === 'grant') {
      showToast('DD Data Room access granted for 14 days.', 'success');
    } else if (action === 'view') {
      if (onSelectMessages) {
        onSelectMessages();
      } else {
        showToast('Opening details...', 'info');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-slide">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#181B1A] rounded-2xl border border-[#E5E7EB] dark:border-[#262A29] p-5 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToFeed}
            className="p-2 rounded-xl bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95 cursor-pointer"
            title="Back to Feed"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-[#101212] dark:text-white font-heading">
                Notifications & Activity
              </h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#D9FF3F] text-[#101212] shadow-2xs">
                  {unreadCount} new
                </span>
              )}
            </div>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] mt-0.5">
              Stay updated on connection requests, investor due diligence, and ecosystem activity.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-3.5 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-[#262A29] text-xs font-bold text-[#101212] dark:text-white transition-all active:scale-95 cursor-pointer"
            >
              Mark all as read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
              <span>Clear Notifications</span>
            </button>
          )}
        </div>
      </div>

      {/* Red line bar saying Clear Notifications */}
      {notifications.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
          <div className="flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500 shrink-0" />
            <span className="font-semibold">Clear all active notifications and messages</span>
          </div>
          <button
            onClick={handleClearAll}
            className="px-3 py-1 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition-colors shadow-xs active:scale-95 cursor-pointer"
          >
            Clear Notifications
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pb-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'All Activity', count: notifications.length },
          {
            id: 'mentorship',
            label: 'Mentorship & Network',
            count: notifications.filter((n) => n.category === 'mentorship').length,
          },
          {
            id: 'investor',
            label: 'Investors & Deals',
            count: notifications.filter((n) => n.category === 'investor').length,
          },
          {
            id: 'system',
            label: 'Programs & System',
            count: notifications.filter((n) => n.category === 'system' || n.category === 'esp').length,
          },
        ].map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-[#101212] dark:bg-[#D9FF3F] text-white dark:text-[#101212] shadow-xs'
                  : 'bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] text-[#565B59] dark:text-[#B6B8B7] hover:text-[#101212] dark:hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/20 dark:bg-black/20 text-white dark:text-[#101212]'
                    : 'bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl bg-white dark:bg-[#181B1A] border transition-all duration-200 relative group ${
                notif.unread
                  ? 'border-[#D9FF3F]/60 dark:border-[#D9FF3F]/30 bg-white dark:bg-[#181B1A] shadow-xs'
                  : 'border-[#E5E7EB] dark:border-[#262A29] opacity-90'
              }`}
            >
              {/* Unread Accent Bar */}
              {notif.unread && (
                <span className="absolute left-0 top-3 bottom-3 w-1 bg-[#D9FF3F] rounded-r-full" />
              )}

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Avatar or Category Icon */}
                  {notif.avatar ? (
                    <div className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-[#202422]">
                      <img src={notif.avatar} alt={notif.actorName} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-[#D9FF3F]/15 text-[#101212] dark:text-[#D9FF3F] flex items-center justify-center flex-shrink-0 border border-[#D9FF3F]/30">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                  )}

                  {/* Texts */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
                        {notif.title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7]">
                        {notif.category}
                      </span>
                      {notif.unread && (
                        <span className="w-2 h-2 rounded-full bg-[#9EBE12] flex-shrink-0 animate-pulse" />
                      )}
                    </div>

                    <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] leading-relaxed">
                      {notif.description}
                    </p>

                    <div className="flex items-center gap-2 text-[11px] text-[#565B59] dark:text-[#8E9390] pt-1">
                      <Clock className="w-3 h-3" />
                      <span>{notif.time}</span>
                      {notif.actorRole && (
                        <>
                          <span>·</span>
                          <span className="truncate">{notif.actorRole}</span>
                        </>
                      )}
                    </div>

                    {/* Action Buttons if Action Required */}
                    {notif.actionRequired && (
                      <div className="flex items-center gap-2.5 pt-3">
                        {notif.actionType === 'connection_request' && (
                          <>
                            <button
                              onClick={() => handleAction(notif.id, 'accept')}
                              className="px-3 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Accept Connection</span>
                            </button>
                            <button
                              onClick={() => handleAction(notif.id, 'decline')}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] hover:bg-gray-200 dark:hover:bg-gray-700 text-[#565B59] dark:text-[#B6B8B7] text-xs font-bold flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Decline</span>
                            </button>
                          </>
                        )}

                        {notif.actionType === 'dd_access' && (
                          <>
                            <button
                              onClick={() => handleAction(notif.id, 'grant')}
                              className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Grant Data Room Access</span>
                            </button>
                            <button
                              onClick={() => handleAction(notif.id, 'decline')}
                              className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-[#202422] text-[#565B59] dark:text-[#B6B8B7] text-xs font-bold active:scale-95 transition-all cursor-pointer"
                            >
                              Ignore
                            </button>
                          </>
                        )}

                        {notif.actionType === 'event_invite' && (
                          <button
                            onClick={() => handleAction(notif.id, 'view')}
                            className="px-3.5 py-1.5 rounded-xl bg-[#D9FF3F] hover:bg-[#C7F020] text-[#101212] text-xs font-bold flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all cursor-pointer"
                          >
                            <span>Review Invitation</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Dismiss Item Button */}
                <button
                  onClick={() => handleDismiss(notif.id)}
                  className="p-1.5 rounded-lg text-[#565B59] dark:text-[#8E9390] hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
                  title="Dismiss notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-[#181B1A] border border-[#E5E7EB] dark:border-[#262A29] space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#202422] flex items-center justify-center mx-auto text-[#565B59] dark:text-[#B6B8B7]">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-[#101212] dark:text-white font-heading">
              No notifications in this category
            </h3>
            <p className="text-xs text-[#565B59] dark:text-[#B6B8B7] max-w-sm mx-auto">
              You're all caught up! New requests and updates will appear here automatically.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
