'use client';

import { getUserProfile } from './userProfile';
import { notificationService } from './notificationService';
import { messagingService, resolveAvatarUrl } from './messagingService';

export const CONNECTIONS_STORAGE_KEY = 'xentro_connections_v2';
export const CONNECTIONS_PARTNERS_KEY = 'xentro_connections_partners_v2';
export const CONNECTIONS_METRICS_KEY = 'xentro_connections_metrics_v2';
export const CONNECTIONS_UPDATED_EVENT = 'xentro-connections-updated';

export interface ConnectionRecord {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  recipientRole: string;
  recipientAvatar?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
  pair_key?: string;
}

export interface ConnectedPartner {
  id: string;
  name: string;
  role: string;
  avatar: string;
  connectionId?: string;
  connectedAt?: string;
}

export interface ConnectionMetrics {
  activeConnections: number;
  pendingReceived: number;
  pendingSent: number;
  activeUsers: number;
}

// Cross-tab broadcast channel
let connectionChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    connectionChannel = new BroadcastChannel('xentro_connections_channel');
    connectionChannel.onmessage = (e) => {
      if (e.data?.type === 'CONNECTIONS_UPDATED') {
        window.dispatchEvent(new CustomEvent(CONNECTIONS_UPDATED_EVENT));
      }
    };
  } catch (err) {
    console.debug('[Connections] BroadcastChannel not supported:', err);
  }
}

export function normalizeUserId(rawId?: string): string {
  if (!rawId) return '';
  return rawId.trim();
}

function getCurrentUserId(): { id: string; name: string; role: string; avatar: string } {
  const profile = getUserProfile();
  const id = profile.id || '';
  const name = profile.name || 'Member';
  const role = profile.roleTitle || profile.role || 'Member';
  const avatar = resolveAvatarUrl(profile.avatar, name);
  return { id, name, role, avatar };
}

// Global initialization and listener hook
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === CONNECTIONS_STORAGE_KEY) {
      window.dispatchEvent(new CustomEvent(CONNECTIONS_UPDATED_EVENT));
    }
  });

  window.addEventListener('xentro-connection-event', (e: Event) => {
    const custom = e as CustomEvent;
    if (custom.detail) {
      connectionService.applyIncomingConnection(custom.detail);
    }
  });

  window.addEventListener('xentro-role-changed', () => {
    connectionService.syncFromServer();
  });

  // Fetch initial on page load
  setTimeout(() => {
    connectionService.syncFromServer();
  }, 100);
}

export const connectionService = {
  /** Get all connections (filtered by optional user ID) */
  getConnections(userId?: string): ConnectionRecord[] {
    const list = this.getRawConnections();
    if (!userId) return list;
    const uid = normalizeUserId(userId).toLowerCase();
    return list.filter(
      (c) =>
        normalizeUserId(c.senderId).toLowerCase() === uid ||
        normalizeUserId(c.recipientId).toLowerCase() === uid
    );
  },

  /** Alias for requestConnection */
  async sendRequest(partner: string | { id: string; name: string; role: string; avatar?: string }): Promise<ConnectionRecord> {
    if (typeof partner === 'string') {
      return this.requestConnection({ id: partner, name: 'Member', role: 'Member' });
    }
    return this.requestConnection(partner);
  },

  /** Get all stored connections from local store */
  getRawConnections(): ConnectionRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CONNECTIONS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed as ConnectionRecord[];
      }
    } catch (e) {
      console.error('Failed to load connections:', e);
    }
    return [];
  },

  /** Save connection list locally and notify UI and other tabs */
  saveRawConnections(list: ConnectionRecord[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(
        new CustomEvent(CONNECTIONS_UPDATED_EVENT, { detail: { connections: list } })
      );
      if (connectionChannel) {
        connectionChannel.postMessage({ type: 'CONNECTIONS_UPDATED' });
      }
    } catch (e) {
      console.error('Failed to save connections:', e);
    }
  },

  /** Synchronizes authoritative connection state from MongoDB Atlas */
  async syncFromServer(): Promise<{
    connections: ConnectionRecord[];
    connectedPartners: ConnectedPartner[];
    metrics: ConnectionMetrics;
  }> {
    if (typeof window === 'undefined') {
      return { connections: [], connectedPartners: [], metrics: { activeConnections: 0, pendingReceived: 0, pendingSent: 0, activeUsers: 0 } };
    }

    try {
      const currentUser = getCurrentUserId();
      const userId = normalizeUserId(currentUser.id);
      const url = userId ? `/api/connections?userId=${encodeURIComponent(userId)}` : '/api/connections';

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('API fetch error');
      const data = await res.json();

      if (data?.success && Array.isArray(data.connections)) {
        this.applyRemoteConnections(data.connections);
      }
      if (data?.connectedPartners && Array.isArray(data.connectedPartners)) {
        localStorage.setItem(CONNECTIONS_PARTNERS_KEY, JSON.stringify(data.connectedPartners));
      }
      if (data?.metrics) {
        localStorage.setItem(CONNECTIONS_METRICS_KEY, JSON.stringify(data.metrics));
      }

      return {
        connections: data?.connections || this.getRawConnections(),
        connectedPartners: data?.connectedPartners || this.getConnectedPartners(),
        metrics: data?.metrics || this.getMetrics(),
      };
    } catch (err) {
      console.debug('[Connections] Sync from server error:', err);
      return {
        connections: this.getRawConnections(),
        connectedPartners: this.getConnectedPartners(),
        metrics: this.getMetrics(),
      };
    }
  },

  /** Get cached metrics from latest MongoDB sync */
  getMetrics(): ConnectionMetrics {
    if (typeof window === 'undefined') {
      return { activeConnections: 0, pendingReceived: 0, pendingSent: 0, activeUsers: 0 };
    }
    try {
      const raw = localStorage.getItem(CONNECTIONS_METRICS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {
      activeConnections: this.getConnectedCount(),
      pendingReceived: this.getPendingReceivedCount(),
      pendingSent: 0,
      activeUsers: 10,
    };
  },

  /** Apply incoming connection from real-time stream */
  applyIncomingConnection(conn: ConnectionRecord): void {
    const list = this.getRawConnections();
    const idx = list.findIndex((c) => c.id === conn.id || (c.senderId === conn.senderId && c.recipientId === conn.recipientId));
    let updated: ConnectionRecord[];
    if (idx >= 0) {
      updated = [...list];
      updated[idx] = conn;
    } else {
      updated = [conn, ...list];
    }
    this.saveRawConnections(updated);

    const currentUser = getCurrentUserId();
    const normalizedRecipient = normalizeUserId(conn.recipientId);
    const normalizedSender = normalizeUserId(conn.senderId);
    const normalizedCurrent = normalizeUserId(currentUser.id);

    // If we are the recipient of a pending request, notify the UI
    if (normalizedRecipient === normalizedCurrent && conn.status === 'pending') {
      notificationService.sendNotification({
        id: `notif_conn_${conn.id}`,
        userId: currentUser.id,
        category: 'mentorship',
        title: `${conn.senderName} sent you a connection request`,
        description: `Looking to connect and collaborate on Xentro.`,
        time: 'Just now',
        avatar: conn.senderAvatar,
        actorName: conn.senderName,
        actorRole: conn.senderRole,
        actorId: conn.senderId,
        connectionId: conn.id,
        actionRequired: true,
        actionType: 'connection_request',
        targetTab: 'notifications',
      });
    } else if (normalizedSender === normalizedCurrent && conn.status === 'accepted') {
      notificationService.sendNotification({
        id: `notif_accepted_${conn.id}`,
        userId: currentUser.id,
        category: 'mentorship',
        title: `${conn.recipientName} accepted your connection request!`,
        description: `You are now connected on Xentro! Start collaborating.`,
        time: 'Just now',
        avatar: conn.recipientAvatar,
        actorName: conn.recipientName,
        actorRole: conn.recipientRole,
        actorId: conn.recipientId,
        connectionId: conn.id,
        actionType: 'connection',
        targetTab: 'messages',
      });
    }
  },

  /** Apply full list sync */
  applyRemoteConnections(remote: ConnectionRecord[]): void {
    if (!Array.isArray(remote)) return;
    const current = this.getRawConnections();
    const map = new Map<string, ConnectionRecord>();
    current.forEach((c) => map.set(c.id, c));
    remote.forEach((c) => map.set(c.id, c));
    const merged = Array.from(map.values());
    this.saveRawConnections(merged);
  },

  /** Get current relationship status with a given partner directly from MongoDB source */
  getConnectionStatus(partnerId: string): 'none' | 'pending' | 'received' | 'connected' {
    const currentUser = getCurrentUserId();
    const all = this.getRawConnections();
    const normalizedCurrent = normalizeUserId(currentUser.id).toLowerCase();
    const normalizedPartner = normalizeUserId(partnerId).toLowerCase();

    if (!normalizedPartner || !normalizedCurrent) return 'none';
    if (normalizedPartner === normalizedCurrent) return 'none';

    // Match either direction with normalized IDs
    const conn = all.find((c) => {
      const s = normalizeUserId(c.senderId).toLowerCase();
      const r = normalizeUserId(c.recipientId).toLowerCase();
      return (
        (s === normalizedCurrent && r === normalizedPartner) ||
        (r === normalizedCurrent && s === normalizedPartner)
      );
    });

    if (!conn || conn.status === 'declined') {
      return 'none';
    }

    if (conn.status === 'accepted') {
      return 'connected';
    }

    if (conn.status === 'pending') {
      if (normalizeUserId(conn.senderId).toLowerCase() === normalizedCurrent) {
        return 'pending'; // Current user requested it
      } else {
        return 'received'; // Current user received it
      }
    }

    return 'none';
  },

  /** Send a connection request to a target profile */
  async requestConnection(partner: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }): Promise<ConnectionRecord> {
    const currentUser = getCurrentUserId();
    const senderId = normalizeUserId(currentUser.id);
    const recipientId = normalizeUserId(partner.id);
    const connId = `conn_${[senderId.toLowerCase(), recipientId.toLowerCase()].sort().join('_')}`;

    const newConn: ConnectionRecord = {
      id: connId,
      senderId,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      senderAvatar: resolveAvatarUrl(currentUser.avatar, currentUser.name),
      recipientId,
      recipientName: partner.name,
      recipientRole: partner.role,
      recipientAvatar: resolveAvatarUrl(partner.avatar, partner.name),
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Optimistic local update
    const current = this.getRawConnections();
    const filtered = current.filter((c) => c.id !== connId);
    this.saveRawConnections([newConn, ...filtered]);

    // 2. Persist to MongoDB Atlas via Server API
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'request',
          connection: newConn,
          userId: senderId,
          partnerId: recipientId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.connection) {
          this.applyIncomingConnection(data.connection);
        }
      }
    } catch (err) {
      console.warn('[Connections API] send error:', err);
    }

    // 3. Sync authoritative database state
    this.syncFromServer().catch(() => {});

    return newConn;
  },

  /** Accept a connection request in MongoDB Atlas */
  async acceptConnection(partnerId: string, connectionId?: string): Promise<void> {
    const currentUser = getCurrentUserId();
    const all = this.getRawConnections();
    const currentNorm = normalizeUserId(currentUser.id);
    const partnerNorm = normalizeUserId(partnerId);

    let conn = all.find(
      (c) =>
        (connectionId && c.id === connectionId) ||
        (normalizeUserId(c.senderId) === currentNorm && normalizeUserId(c.recipientId) === partnerNorm) ||
        (normalizeUserId(c.recipientId) === currentNorm && normalizeUserId(c.senderId) === partnerNorm)
    );

    if (!conn) {
      // Synthesize shell if not found locally
      conn = {
        id: connectionId || `conn_${[currentNorm, partnerNorm].sort().join('_')}`,
        senderId: partnerNorm,
        senderName: 'Partner',
        senderRole: 'Member',
        recipientId: currentNorm,
        recipientName: currentUser.name,
        recipientRole: currentUser.role,
        status: 'accepted',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      conn.status = 'accepted';
      conn.updatedAt = new Date().toISOString();
    }

    // Save locally
    const filtered = all.filter((c) => c.id !== conn!.id);
    this.saveRawConnections([conn, ...filtered]);

    // 1. Post to Server API -> writes to MongoDB Atlas collection 'connections'
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'accept',
          connection: conn,
          connectionId: conn.id,
          userId: currentNorm,
          partnerId: partnerNorm,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.connection) {
          this.applyIncomingConnection(data.connection);
        }
      }
    } catch (err) {
      console.warn('[Connections] Failed to persist accept:', err);
    }

    // 2. Automated conversation kick-off message
    const isSender = normalizeUserId(conn.senderId) === currentNorm;
    const resolvedPartnerId = isSender ? conn.recipientId : conn.senderId;
    const rawPartnerName = isSender ? conn.recipientName : conn.senderName;
    const resolvedPartnerName = (rawPartnerName && rawPartnerName !== 'Partner' && rawPartnerName !== 'Sender') ? rawPartnerName : 'your connection';
    const resolvedPartnerRole = (isSender ? conn.recipientRole : conn.senderRole) || 'Startup';
    const resolvedPartnerAvatar = resolveAvatarUrl(isSender ? conn.recipientAvatar : conn.senderAvatar, resolvedPartnerName);

    messagingService.startOrOpenConversation({
      id: resolvedPartnerId,
      name: resolvedPartnerName,
      role: resolvedPartnerRole,
      avatar: resolvedPartnerAvatar,
      initialMessage: `🤝 Connection established! You and ${resolvedPartnerName} are now connected on Xentro. Start sharing insights, opportunities, and collaboration details.`,
    });

    // 3. Invalidate & refetch fresh MongoDB data
    await this.syncFromServer();
  },

  /** Decline a connection request in MongoDB Atlas */
  async declineConnection(partnerId: string, connectionId?: string): Promise<void> {
    const currentUser = getCurrentUserId();
    const all = this.getRawConnections();
    const currentNorm = normalizeUserId(currentUser.id);
    const partnerNorm = normalizeUserId(partnerId);

    const conn = all.find(
      (c) =>
        (connectionId && c.id === connectionId) ||
        (normalizeUserId(c.senderId) === currentNorm && normalizeUserId(c.recipientId) === partnerNorm) ||
        (normalizeUserId(c.recipientId) === currentNorm && normalizeUserId(c.senderId) === partnerNorm)
    );

    if (conn) {
      conn.status = 'declined';
      conn.updatedAt = new Date().toISOString();
      this.saveRawConnections([...all]);
    }

    try {
      await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline',
          connection: conn,
          connectionId: conn?.id || connectionId,
          userId: currentNorm,
          partnerId: partnerNorm,
        }),
      });
    } catch (err) {
      console.warn('[Connections] Failed to persist decline:', err);
    }

    await this.syncFromServer();
  },

  /** Cancel an outgoing connection request */
  cancelConnection(partnerId: string): void {
    this.declineConnection(partnerId);
  },

  /** Number of pending connection requests received by current user from MongoDB */
  getPendingReceivedCount(): number {
    const currentUser = getCurrentUserId();
    const currentNorm = normalizeUserId(currentUser.id);
    const all = this.getRawConnections();
    return all.filter((c) => normalizeUserId(c.recipientId) === currentNorm && c.status === 'pending').length;
  },

  /** Number of established connections for current user (or specified target user) from MongoDB */
  getConnectedCount(userId?: string): number {
    const targetNorm = userId ? normalizeUserId(userId).toLowerCase() : normalizeUserId(getCurrentUserId().id).toLowerCase();
    if (!targetNorm) return 0;
    const all = this.getRawConnections();
    return all.filter(
      (c) =>
        (normalizeUserId(c.senderId).toLowerCase() === targetNorm ||
         normalizeUserId(c.recipientId).toLowerCase() === targetNorm) &&
        c.status === 'accepted'
    ).length;
  },

  /** Get all user profiles that current user (or specified target user) has an accepted connection with */
  getConnectedPartners(userId?: string): ConnectedPartner[] {
    const targetNorm = userId ? normalizeUserId(userId).toLowerCase() : normalizeUserId(getCurrentUserId().id).toLowerCase();
    if (!targetNorm) return [];

    // Try reading cached server partners first if checking current user
    if (!userId && typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(CONNECTIONS_PARTNERS_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed.map((p) => ({
              ...p,
              avatar: resolveAvatarUrl(p.avatar, p.name),
            }));
          }
        }
      } catch {}
    }

    const all = this.getRawConnections();
    const connected = all.filter(
      (c) =>
        (normalizeUserId(c.senderId).toLowerCase() === targetNorm ||
         normalizeUserId(c.recipientId).toLowerCase() === targetNorm) &&
        c.status === 'accepted'
    );

    return connected.map((c) => {
      const isSender = normalizeUserId(c.senderId).toLowerCase() === targetNorm;
      const partnerName = (isSender ? c.recipientName : c.senderName) || 'Connected Member';
      const partnerAvatar = isSender ? c.recipientAvatar : c.senderAvatar;
      return {
        id: isSender ? c.recipientId : c.senderId,
        name: partnerName,
        role: (isSender ? c.recipientRole : c.senderRole) || 'Member',
        avatar: resolveAvatarUrl(partnerAvatar, partnerName),
        connectionId: c.id,
        connectedAt: c.updatedAt || c.createdAt,
      };
    });
  },
};
