'use client';

import { getUserProfile } from './userProfile';
import { notificationService } from './notificationService';
import { messagingService, resolveAvatarUrl, formatIdToName } from './messagingService';
import { entityContextService } from './entityContextService';

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

export interface ActiveConnectionPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  isEntity: boolean;
  entityId?: string;
  personalUserId: string;
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

/**
 * Returns the active identity based on whether the user is in personal mode
 * or inside an Entity Workspace (Startup, Investor Org, ESP).
 */
export function getActiveConnectionPersona(): ActiveConnectionPersona {
  const profile = getUserProfile();
  const personalId = profile.id || '';
  const personalName = profile.name || 'Member';
  const personalRole = profile.roleTitle || profile.role || 'Member';
  const personalAvatar = resolveAvatarUrl(profile.avatar, personalName);

  if (typeof window !== 'undefined') {
    try {
      const activeEntity = entityContextService.getActiveEntity();
      if (activeEntity && activeEntity.id) {
        return {
          id: activeEntity.id,
          name: activeEntity.name || 'Startup',
          role: activeEntity.entityType || 'Startup',
          avatar: resolveAvatarUrl(activeEntity.logo, activeEntity.name),
          isEntity: true,
          entityId: activeEntity.id,
          personalUserId: personalId,
        };
      }
    } catch (err) {
      console.debug('[Connections] Error resolving active entity:', err);
    }
  }

  return {
    id: personalId,
    name: personalName,
    role: personalRole,
    avatar: personalAvatar,
    isEntity: false,
    entityId: undefined,
    personalUserId: personalId,
  };
}

export function getUserIdentityIds(): string[] {
  const ids = new Set<string>();
  const persona = getActiveConnectionPersona();
  if (persona.id) ids.add(persona.id.trim().toLowerCase());
  if (persona.personalUserId) ids.add(persona.personalUserId.trim().toLowerCase());
  if (typeof window !== 'undefined') {
    try {
      const linked = entityContextService.getLinkedEntities();
      linked.forEach((e) => {
        if (e.id) ids.add(e.id.trim().toLowerCase());
      });
    } catch {}
  }
  return Array.from(ids).filter(Boolean);
}

function getCurrentUserId(): { id: string; name: string; role: string; avatar: string } {
  const persona = getActiveConnectionPersona();
  return {
    id: persona.id,
    name: persona.name,
    role: persona.role,
    avatar: persona.avatar,
  };
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

  window.addEventListener('xentro-entity-switched', () => {
    connectionService.syncFromServer();
    window.dispatchEvent(new CustomEvent(CONNECTIONS_UPDATED_EVENT));
  });

  // Background polling sync every 5 seconds for authoritative state across tabs & users
  setInterval(() => {
    const persona = getActiveConnectionPersona();
    if (persona.personalUserId || persona.id) {
      connectionService.syncFromServer().catch(() => {});
    }
  }, 5000);

  // Fetch initial on page load
  setTimeout(() => {
    connectionService.syncFromServer();
  }, 100);
}

export const connectionService = {
  /** Get active persona based on current workspace */
  getActiveConnectionPersona(): ActiveConnectionPersona {
    return getActiveConnectionPersona();
  },

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
      return this.requestConnection({ id: partner, name: formatIdToName(partner), role: 'Explorer' });
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
        if (Array.isArray(parsed)) {
          return parsed.map((c: ConnectionRecord) => ({
            ...c,
            senderAvatar: resolveAvatarUrl(c.senderAvatar, c.senderName),
            recipientAvatar: resolveAvatarUrl(c.recipientAvatar, c.recipientName),
          })) as ConnectionRecord[];
        }
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
      const sanitized = list.map((c) => ({
        ...c,
        senderAvatar: resolveAvatarUrl(c.senderAvatar, c.senderName),
        recipientAvatar: resolveAvatarUrl(c.recipientAvatar, c.recipientName),
      }));
      localStorage.setItem(CONNECTIONS_STORAGE_KEY, JSON.stringify(sanitized));
      window.dispatchEvent(
        new CustomEvent(CONNECTIONS_UPDATED_EVENT, { detail: { connections: sanitized } })
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
      const persona = getActiveConnectionPersona();
      const personalId = normalizeUserId(persona.personalUserId);
      const entityId = persona.isEntity ? normalizeUserId(persona.entityId) : '';

      const params = new URLSearchParams();
      if (personalId) params.append('userId', personalId);
      if (entityId) params.append('entityId', entityId);

      const url = params.toString() ? `/api/connections?${params.toString()}` : '/api/connections';

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('API fetch error');
      const data = await res.json();

      if (data?.success && Array.isArray(data.connections)) {
        this.applyRemoteConnections(data.connections);
      }
      if (data?.metrics) {
        localStorage.setItem(CONNECTIONS_METRICS_KEY, JSON.stringify(data.metrics));
      }

      return {
        connections: data?.connections || this.getRawConnections(),
        connectedPartners: this.getConnectedPartners(),
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

    const persona = getActiveConnectionPersona();
    const myIds = getUserIdentityIds();
    const normalizedRecipient = normalizeUserId(conn.recipientId).toLowerCase();
    const normalizedSender = normalizeUserId(conn.senderId).toLowerCase();

    const isRecipientMe = myIds.includes(normalizedRecipient);
    const isSenderMe = myIds.includes(normalizedSender);

    // If we are the recipient of a pending request, notify the UI
    if (isRecipientMe && conn.status === 'pending') {
      const notifCategory = (conn.senderRole?.toLowerCase().includes('investor'))
        ? 'investor'
        : (conn.senderRole?.toLowerCase().includes('esp') ? 'esp' : 'mentorship');

      notificationService.sendNotification({
        id: `notif_conn_${conn.id}`,
        userId: persona.id,
        category: notifCategory,
        title: `${conn.senderName} sent you a connection request`,
        description: `Looking to connect and collaborate on Xentro.`,
        time: 'Just now',
        avatar: resolveAvatarUrl(conn.senderAvatar, conn.senderName),
        actorName: conn.senderName,
        actorRole: conn.senderRole,
        actorId: conn.senderId,
        connectionId: conn.id,
        actionRequired: true,
        actionType: 'connection_request',
        targetTab: 'notifications',
      });
    } else if (isSenderMe && conn.status === 'accepted') {
      const notifCategory = (conn.recipientRole?.toLowerCase().includes('investor'))
        ? 'investor'
        : (conn.recipientRole?.toLowerCase().includes('esp') ? 'esp' : 'mentorship');

      notificationService.sendNotification({
        id: `notif_accepted_${conn.id}`,
        userId: persona.id,
        category: notifCategory,
        title: `${conn.recipientName} accepted your connection request!`,
        description: `You are now connected on Xentro! Start collaborating.`,
        time: 'Just now',
        avatar: resolveAvatarUrl(conn.recipientAvatar, conn.recipientName),
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
    const myIds = getUserIdentityIds();
    const normalizedPartner = normalizeUserId(partnerId).toLowerCase();

    if (!normalizedPartner || myIds.length === 0) return 'none';
    if (myIds.includes(normalizedPartner)) return 'none';

    const all = this.getRawConnections();
    const conn = all.find((c) => {
      const s = normalizeUserId(c.senderId).toLowerCase();
      const r = normalizeUserId(c.recipientId).toLowerCase();
      return (
        (myIds.includes(s) && r === normalizedPartner) ||
        (myIds.includes(r) && s === normalizedPartner)
      );
    });

    if (!conn || conn.status === 'declined') {
      return 'none';
    }

    if (conn.status === 'accepted') {
      return 'connected';
    }

    if (conn.status === 'pending') {
      const s = normalizeUserId(conn.senderId).toLowerCase();
      if (myIds.includes(s)) {
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
    const persona = getActiveConnectionPersona();
    const senderId = normalizeUserId(persona.id);
    const recipientId = normalizeUserId(partner.id);
    const connId = `conn_${[senderId.toLowerCase(), recipientId.toLowerCase()].sort().join('_')}`;

    const recipientName = (partner.name && partner.name !== 'Member' && partner.name !== 'Partner')
      ? partner.name
      : formatIdToName(recipientId);
    const recipientRole = (partner.role && partner.role !== 'Member') ? partner.role : 'Explorer';

    const newConn: ConnectionRecord = {
      id: connId,
      senderId,
      senderName: persona.name,
      senderRole: persona.role,
      senderAvatar: resolveAvatarUrl(persona.avatar, persona.name),
      recipientId,
      recipientName,
      recipientRole,
      recipientAvatar: resolveAvatarUrl(partner.avatar, recipientName),
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
    const persona = getActiveConnectionPersona();
    const all = this.getRawConnections();
    const currentNorm = normalizeUserId(persona.id);
    const personalNorm = normalizeUserId(persona.personalUserId);
    const partnerNorm = normalizeUserId(partnerId);

    let conn = all.find(
      (c) =>
        (connectionId && c.id === connectionId) ||
        (normalizeUserId(c.senderId) === currentNorm && normalizeUserId(c.recipientId) === partnerNorm) ||
        (normalizeUserId(c.recipientId) === currentNorm && normalizeUserId(c.senderId) === partnerNorm) ||
        (normalizeUserId(c.senderId) === personalNorm && normalizeUserId(c.recipientId) === partnerNorm) ||
        (normalizeUserId(c.recipientId) === personalNorm && normalizeUserId(c.senderId) === partnerNorm)
    );

    if (!conn) {
      // Synthesize shell if not found locally
      const partnerCleanName = formatIdToName(partnerNorm);
      conn = {
        id: connectionId || `conn_${[currentNorm, partnerNorm].sort().join('_')}`,
        senderId: partnerNorm,
        senderName: partnerCleanName,
        senderRole: 'Explorer',
        recipientId: currentNorm,
        recipientName: persona.name,
        recipientRole: persona.role,
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
    const isSender = normalizeUserId(conn.senderId) === currentNorm || normalizeUserId(conn.senderId) === personalNorm;
    const resolvedPartnerId = isSender ? conn.recipientId : conn.senderId;
    const rawPartnerName = isSender ? conn.recipientName : conn.senderName;
    const resolvedPartnerName = (rawPartnerName && rawPartnerName !== 'Partner' && rawPartnerName !== 'Sender' && rawPartnerName !== 'Member')
      ? rawPartnerName
      : formatIdToName(resolvedPartnerId);
    const resolvedPartnerRole = (isSender ? conn.recipientRole : conn.senderRole) || 'Explorer';
    const resolvedPartnerAvatar = resolveAvatarUrl(isSender ? conn.recipientAvatar : conn.senderAvatar, resolvedPartnerName);

    messagingService.startOrOpenConversation(
      {
        id: resolvedPartnerId,
        name: resolvedPartnerName,
        role: resolvedPartnerRole,
        avatar: resolvedPartnerAvatar,
        initialMessage: `🤝 Connection established! You and ${resolvedPartnerName} are now connected on Xentro. Start sharing insights, opportunities, and collaboration details.`,
      },
      { navigate: false }
    );

    // 3. Invalidate & refetch fresh MongoDB data
    await this.syncFromServer();
  },

  /** Decline a connection request in MongoDB Atlas */
  async declineConnection(partnerId: string, connectionId?: string): Promise<void> {
    const persona = getActiveConnectionPersona();
    const all = this.getRawConnections();
    const currentNorm = normalizeUserId(persona.id);
    const personalNorm = normalizeUserId(persona.personalUserId);
    const partnerNorm = normalizeUserId(partnerId);

    const conn = all.find(
      (c) =>
        (connectionId && c.id === connectionId) ||
        (normalizeUserId(c.senderId) === currentNorm && normalizeUserId(c.recipientId) === partnerNorm) ||
        (normalizeUserId(c.recipientId) === currentNorm && normalizeUserId(c.senderId) === partnerNorm) ||
        (normalizeUserId(c.senderId) === personalNorm && normalizeUserId(c.recipientId) === partnerNorm) ||
        (normalizeUserId(c.recipientId) === personalNorm && normalizeUserId(c.senderId) === partnerNorm)
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
  async cancelConnection(partnerId: string, connectionId?: string): Promise<void> {
    const persona = getActiveConnectionPersona();
    const all = this.getRawConnections();
    const currentNorm = normalizeUserId(persona.id);
    const personalNorm = normalizeUserId(persona.personalUserId);
    const partnerNorm = normalizeUserId(partnerId);

    const remaining = all.filter((c) => {
      if (connectionId && c.id === connectionId) return false;
      const s = normalizeUserId(c.senderId).toLowerCase();
      const r = normalizeUserId(c.recipientId).toLowerCase();
      const p = partnerNorm.toLowerCase();
      const cur = currentNorm.toLowerCase();
      const per = personalNorm.toLowerCase();
      if ((s === cur && r === p) || (s === per && r === p)) return false;
      return true;
    });
    this.saveRawConnections(remaining);

    try {
      await fetch('/api/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'cancel',
          connectionId,
          userId: currentNorm,
          partnerId: partnerNorm,
        }),
      });
    } catch (err) {
      console.warn('[Connections] Failed to persist cancel:', err);
    }

    await this.syncFromServer();
  },

  /** Number of pending connection requests received by current user from MongoDB */
  getPendingReceivedCount(): number {
    const myIds = getUserIdentityIds();
    const all = this.getRawConnections();
    return all.filter((c) => {
      const r = normalizeUserId(c.recipientId).toLowerCase();
      return myIds.includes(r) && c.status === 'pending';
    }).length;
  },

  /** Number of established connections for active persona (or specified target user) from MongoDB */
  getConnectedCount(userId?: string): number {
    const all = this.getRawConnections();
    if (userId) {
      const targetNorm = normalizeUserId(userId).toLowerCase();
      return all.filter((c) => {
        if (c.status !== 'accepted') return false;
        const s = normalizeUserId(c.senderId).toLowerCase();
        const r = normalizeUserId(c.recipientId).toLowerCase();
        return s === targetNorm || r === targetNorm;
      }).length;
    }

    const myIds = getUserIdentityIds();
    return all.filter((c) => {
      if (c.status !== 'accepted') return false;
      const s = normalizeUserId(c.senderId).toLowerCase();
      const r = normalizeUserId(c.recipientId).toLowerCase();
      return myIds.includes(s) || myIds.includes(r);
    }).length;
  },

  /** Get all user profiles that active persona (or specified target user) has an accepted connection with */
  getConnectedPartners(userId?: string): ConnectedPartner[] {
    const all = this.getRawConnections();
    const myIds = userId ? [normalizeUserId(userId).toLowerCase()] : getUserIdentityIds();
    if (myIds.length === 0) return [];

    const connected = all.filter(
      (c) =>
        c.status === 'accepted' &&
        (myIds.includes(normalizeUserId(c.senderId).toLowerCase()) ||
         myIds.includes(normalizeUserId(c.recipientId).toLowerCase()))
    );

    return connected.map((c) => {
      const isSender = myIds.includes(normalizeUserId(c.senderId).toLowerCase());
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
