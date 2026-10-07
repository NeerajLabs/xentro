'use client';

import { getUserProfile } from './userProfile';

export const NOTIFICATIONS_STORAGE_KEY = 'xentro_real_notifications_v3';
export const NOTIFICATIONS_UPDATED_EVENT = 'xentro-notifications-updated';

export interface NotificationItem {
  id: string;
  userId: string; // Recipient user id
  category: 'message' | 'mentorship' | 'startup' | 'system' | 'investor' | 'esp';
  title: string;
  description: string;
  time: string;
  unread: boolean;
  avatar?: string;
  actorName?: string;
  actorRole?: string;
  actorId?: string;
  connectionId?: string;
  actionRequired?: boolean;
  actionType?: 'connection_request' | 'dd_access' | 'event_invite' | 'security_alert' | 'general' | 'message' | 'connection' | 'advisory';
  targetTab?: string;
  createdAt: string;
}

export function normalizeUserId(rawId?: string): string {
  if (!rawId) return '';
  return rawId.trim();
}

if (typeof window !== 'undefined') {
  window.addEventListener('xentro-role-changed', () => {
    notificationService.syncFromServer().catch(() => {});
  });

  // Background sync every 5 seconds
  setInterval(() => {
    const profile = getUserProfile();
    if (profile?.id) {
      notificationService.syncFromServer(profile.id).catch(() => {});
    }
  }, 5000);

  setTimeout(() => {
    notificationService.syncFromServer().catch(() => {});
  }, 300);
}

export const notificationService = {
  getRawNotifications(): NotificationItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed as NotificationItem[];
        }
      }
    } catch (e) {
      console.error('Failed to load raw notifications:', e);
    }
    return [];
  },

  saveRawNotifications(list: NotificationItem[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(
        new CustomEvent(NOTIFICATIONS_UPDATED_EVENT, { detail: { notifications: list } })
      );
    } catch (e) {
      console.error('Failed to save raw notifications:', e);
    }
  },

  sendNotification(item: Omit<NotificationItem, 'id' | 'createdAt' | 'unread'> & { id?: string }): void {
    const raw = this.getRawNotifications();
    const newNotif: NotificationItem = {
      ...item,
      id: item.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      unread: true,
      createdAt: new Date().toISOString(),
    };
    const filtered = raw.filter((n) => n.id !== newNotif.id);
    this.saveRawNotifications([newNotif, ...filtered]);
  },

  /** Authoritative sync from MongoDB Atlas backend */
  async syncFromServer(userId?: string): Promise<NotificationItem[]> {
    if (typeof window === 'undefined') return [];
    try {
      const profile = getUserProfile();
      const currentUserId = userId || profile.id || '';
      if (!currentUserId) return this.getNotifications();

      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUserId)}`, {
        cache: 'no-store',
      });
      if (!res.ok) return this.getNotifications();

      const data = await res.json();
      const serverNotifs = data?.notifications;
      if (!Array.isArray(serverNotifs)) return this.getNotifications();

      const currentRaw = this.getRawNotifications();
      const map = new Map<string, NotificationItem>();
      // Keep other users' notifications if any
      currentRaw.filter((n) => n.userId !== currentUserId).forEach((n) => map.set(n.id, n));

      // Put authentic MongoDB notifications
      serverNotifs.forEach((sn: any) => {
        map.set(sn.id, {
          id: sn.id,
          userId: currentUserId,
          category: sn.category || 'system',
          title: sn.title || 'New Notification',
          description: sn.description || '',
          time: sn.time || 'Recently',
          unread: Boolean(sn.unread),
          avatar: sn.avatar || '/xentro-logo.png',
          actorName: sn.actorName,
          actorRole: sn.actorRole,
          actorId: sn.actorId,
          connectionId: sn.connectionId,
          actionRequired: Boolean(sn.actionRequired),
          actionType: sn.actionType || 'general',
          targetTab: sn.targetTab || 'notifications',
          createdAt: sn.createdAt || new Date().toISOString(),
        });
      });

      const merged = Array.from(map.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      this.saveRawNotifications(merged);
      return this.getNotifications();
    } catch (err) {
      console.debug('[Notifications] syncFromServer error:', err);
      return this.getNotifications();
    }
  },

  /** Get notifications for the currently logged-in persona */
  getNotifications(): NotificationItem[] {
    const profile = getUserProfile();
    const currentUserId = profile.id || '';
    if (!currentUserId) return [];

    const stored = this.getRawNotifications();
    return stored.filter((n) => normalizeUserId(n.userId).toLowerCase() === currentUserId.toLowerCase());
  },

  getUnreadCount(): number {
    return this.getNotifications().filter((n) => n.unread).length;
  },

  /** Mark single notification as read in MongoDB and locally */
  markAsRead(id: string): NotificationItem[] {
    const all = this.getRawNotifications();
    const target = all.find((n) => n.id === id);
    if (target) {
      target.unread = false;
      this.saveRawNotifications(all);
    }
    if (typeof window !== 'undefined') {
      const profile = getUserProfile();
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markRead', notificationId: id, userId: profile.id }),
      }).catch(() => {});
    }
    return this.getNotifications();
  },

  /** Resolve action on notification (e.g. Accept/Decline clicked) */
  resolveAction(id: string, newDescription?: string): NotificationItem[] {
    const all = this.getRawNotifications();
    const target = all.find((n) => n.id === id);
    if (target) {
      target.actionRequired = false;
      target.unread = false;
      if (newDescription) {
        target.description = newDescription;
      }
      this.saveRawNotifications(all);
    }
    return this.getNotifications();
  },

  /** Mark all notifications for active user as read */
  markAllAsRead(): NotificationItem[] {
    const profile = getUserProfile();
    const currentUserId = profile.id || '';

    const all = this.getRawNotifications().map((n) =>
      normalizeUserId(n.userId).toLowerCase() === currentUserId.toLowerCase()
        ? { ...n, unread: false }
        : n
    );
    this.saveRawNotifications(all);

    if (typeof window !== 'undefined' && currentUserId) {
      fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllRead', userId: currentUserId }),
      }).catch(() => {});
    }

    return this.getNotifications();
  },

  /** Clear all notifications for active user in MongoDB and locally */
  async clearAllNotifications(): Promise<void> {
    const profile = getUserProfile();
    const currentUserId = profile.id || '';

    const remaining = this.getRawNotifications().filter(
      (n) => normalizeUserId(n.userId).toLowerCase() !== currentUserId.toLowerCase()
    );
    this.saveRawNotifications(remaining);

    if (typeof window !== 'undefined' && currentUserId) {
      try {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'clear', userId: currentUserId }),
        });
      } catch (e) {
        console.error('Failed to clear notifications on backend:', e);
      }
    }
  },
};
