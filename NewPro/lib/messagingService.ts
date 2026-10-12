'use client';

import { Conversation, ChatMessage, User } from '@/types';
import { getUserProfile } from './userProfile';
import { entityContextService } from './entityContextService';

export const CONVERSATIONS_STORAGE_KEY = 'xentro_conversations_v1';
export const CUSTOM_CONVERSATIONS_KEY = 'xentro_custom_conversations_v2';
export const SHARED_MESSAGES_KEY = 'xentro_shared_messages_v3';
export const AUTO_REPLY_KEY = 'xentro_auto_reply_enabled';
export const ACTIVE_CONVERSATION_KEY = 'xentro_active_conversation_id';
export const CONVERSATIONS_UPDATED_EVENT = 'xentro-conversations-updated';
export const AUTO_REPLY_CHANGED_EVENT = 'xentro-autoreply-changed';

export interface SharedChatMessage {
  id: string;
  clientMessageId?: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  text: string;
  content?: string;
  timestamp: string;
  createdAt?: string;
  readBy: string[];
  failed?: boolean;
}

export interface ActiveMessagingPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  company: string;
  isEntity: boolean;
  entityId?: string;
  personalUserId: string;
}

export function formatMessageTime(rawTimestamp?: string): string {
  if (!rawTimestamp) return 'Just now';
  const trimmed = rawTimestamp.trim();
  if (/^\d{1,2}:\d{2}\s*(am|pm)?$/i.test(trimmed)) {
    return trimmed;
  }
  try {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
    }
  } catch {
    // fallback
  }
  return trimmed;
}

export function getMessageTimestampMs(m: SharedChatMessage): number {
  if (m.createdAt) {
    const t = new Date(m.createdAt).getTime();
    if (!isNaN(t) && t > 0) return t;
  }
  if (m.timestamp) {
    const t = new Date(m.timestamp).getTime();
    if (!isNaN(t) && t > 0) return t;

    // Parse clock format: "3:55 am", "11:42 pm"
    const match = m.timestamp.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3]?.toLowerCase();
      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d.getTime();
    }
  }
  // Try extracting timestamp from ID (e.g. msg_1712345678901_... or 1712345678901)
  const idMatch = (m.id || '').match(/(\d{10,13})/);
  if (idMatch) {
    const parsed = parseInt(idMatch[1], 10);
    const ts = parsed < 10000000000 ? parsed * 1000 : parsed;
    if (!isNaN(ts) && ts > 1600000000000) return ts;
  }
  // MongoDB ObjectId (first 4 bytes are seconds)
  if (m.id && /^[a-f\d]{24}$/i.test(m.id)) {
    const seconds = parseInt(m.id.substring(0, 8), 16);
    if (!isNaN(seconds) && seconds > 1600000000) return seconds * 1000;
  }
  return 0;
}

export function formatIdToName(id: string): string {
  if (!id) return 'User';
  let clean = id
    .replace(/^(usr_|ent_|conn_|msg_|user_|acc_)/i, '')
    .replace(/_[a-f0-9]{6,}$/i, '')
    .replace(/_[0-9]{10,}$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (!clean || clean.toLowerCase() === 'member' || clean.toLowerCase() === 'partner') {
    return 'User';
  }
  return clean
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function resolvePartnerFromLocalStorage(partnerId: string, convId?: string): { name?: string; role?: string; avatar?: string; company?: string } | null {
  if (typeof window === 'undefined') return null;
  const pNorm = (partnerId || '').toLowerCase().trim();

  try {
    const partnersRaw = localStorage.getItem('xentro_connections_partners_v2');
    if (partnersRaw) {
      const partners: any[] = JSON.parse(partnersRaw);
      const match = partners.find((p) => (p.id || '').toLowerCase() === pNorm || (convId && p.connectionId && convId.includes(p.connectionId)));
      if (match && match.name && match.name !== 'Member' && match.name !== 'Partner') {
        return { name: match.name, role: match.role || 'Explorer', avatar: match.avatar, company: match.company };
      }
    }

    const connsRaw = localStorage.getItem('xentro_connections_v2');
    if (connsRaw) {
      const conns: any[] = JSON.parse(connsRaw);
      const match = conns.find((c) =>
        (c.senderId || '').toLowerCase() === pNorm ||
        (c.recipientId || '').toLowerCase() === pNorm ||
        (convId && (c.id === convId || convId.includes(c.id) || c.id.includes(convId)))
      );
      if (match) {
        const isSender = (match.senderId || '').toLowerCase() === pNorm;
        const cName = isSender ? match.senderName : match.recipientName;
        const cRole = isSender ? match.senderRole : match.recipientRole;
        const cAvatar = isSender ? match.senderAvatar : match.recipientAvatar;
        if (cName && cName !== 'Member' && cName !== 'Partner' && cName !== 'Sender') {
          return { name: cName, role: cRole || 'Explorer', avatar: cAvatar };
        }
      }
    }

    const entRaw = localStorage.getItem('xentro_all_entities_v1');
    if (entRaw) {
      const ents: any[] = JSON.parse(entRaw);
      const match = ents.find((e) => (e.id || '').toLowerCase() === pNorm || (e.entityId || '').toLowerCase() === pNorm);
      if (match && match.name) {
        return { name: match.name, role: match.entityType || 'Startup', avatar: match.logo, company: match.name };
      }
    }
  } catch (e) {
    // ignore
  }

  return null;
}

export function resolveAvatarUrl(avatar?: string | null, name?: string | null): string {
  if (
    avatar &&
    avatar !== '/xentro-logo.png' &&
    !avatar.includes('xentro-logo.png') &&
    !avatar.startsWith('blob:') &&
    avatar.trim().length > 0
  ) {
    return avatar;
  }
  const cleanName = (name || 'User').trim();
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`;
}

export interface StoredConversationMeta {
  id: string;
  user: User;
  participants?: string[];
  users?: Record<string, User>;
  createdAt: string;
  updatedAt?: string;
  lastMessage?: string;
}

const INITIAL_MESSAGES: SharedChatMessage[] = [];
const inFlightSends = new Set<string>();

// Cross-tab broadcast channel for instant intra-browser sync
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('xentro_realtime_chat');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'CONVERSATIONS_UPDATED') {
        window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATED_EVENT));
      }
    };
  } catch (e) {
    console.debug('[Realtime] BroadcastChannel unavailable', e);
  }
}

// Global active SSE connection handle
let eventSource: EventSource | null = null;

function connectRealtimeStream() {
  if (typeof window === 'undefined') return;
  if (eventSource && (eventSource.readyState === EventSource.OPEN || eventSource.readyState === EventSource.CONNECTING)) {
    return;
  }

  try {
    eventSource = new EventSource('/api/messages/stream');

    eventSource.onmessage = (event) => {
      try {
        if (!event.data || event.data.startsWith(':')) return;
        const payload = JSON.parse(event.data);
        if (payload.type === 'init' && Array.isArray(payload.data)) {
          messagingService.applyRemoteMessages(payload.data);
        } else if (payload.type === 'sync_all' && Array.isArray(payload.data)) {
          messagingService.applyRemoteMessages(payload.data);
        } else if (payload.type === 'new_message' && payload.data) {
          messagingService.applyIncomingMessage(payload.data);
        } else if (payload.type === 'feed_event' && payload.data) {
          // Live feed like/comment patches share this stream; handled by feedService
          window.dispatchEvent(new CustomEvent('xentro-feed-event', { detail: payload.data }));
        }
      } catch (err) {
        console.debug('[SSE] Failed to parse event', err);
      }
    };

    eventSource.onerror = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
  } catch (err) {
    console.debug('[SSE] Connection error', err);
  }
}

/**
 * Returns the active identity based on whether the user is in personal mode
 * or inside an Entity Workspace (Startup, Investor Org, ESP).
 */
export function getActiveMessagingPersona(): ActiveMessagingPersona {
  const profile = getUserProfile();
  const personalId = profile.id || '';
  const personalName = profile.name || 'Member';
  const personalRole = profile.roleTitle || profile.role || 'Member';
  const personalAvatar = resolveAvatarUrl(profile.avatar, personalName);
  const personalCompany = profile.organization || 'Xentro Member';

  if (typeof window !== 'undefined') {
    try {
      const activeEntity = entityContextService.getActiveEntity();
      if (activeEntity && activeEntity.id) {
        return {
          id: activeEntity.id,
          name: activeEntity.name || 'Startup',
          role: activeEntity.entityType || 'Startup',
          avatar: resolveAvatarUrl(activeEntity.logo, activeEntity.name),
          company: activeEntity.name || 'Startup',
          isEntity: true,
          entityId: activeEntity.id,
          personalUserId: personalId,
        };
      }
    } catch (err) {
      console.debug('[Messaging] Error resolving active entity:', err);
    }
  }

  return {
    id: personalId,
    name: personalName,
    role: personalRole,
    avatar: personalAvatar,
    company: personalCompany,
    isEntity: false,
    entityId: undefined,
    personalUserId: personalId,
  };
}

if (typeof window !== 'undefined') {
  connectRealtimeStream();

  window.addEventListener('storage', (e) => {
    if (e.key === SHARED_MESSAGES_KEY || e.key === CUSTOM_CONVERSATIONS_KEY) {
      window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATED_EVENT));
    }
    if (e.key === AUTO_REPLY_KEY) {
      window.dispatchEvent(new CustomEvent(AUTO_REPLY_CHANGED_EVENT));
    }
  });

  window.addEventListener('xentro-role-changed', () => {
    messagingService.syncFromServer().catch(() => {});
  });

  window.addEventListener('xentro-entity-switched', () => {
    messagingService.syncFromServer().catch(() => {});
    window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATED_EVENT));
  });

  let isFetchingActive = false;
  let isSyncingAll = false;

  // 1. High-frequency active conversation poll: every 1200ms for instantaneous chat delivery
  setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const persona = getActiveMessagingPersona();
    if (!persona.personalUserId && !persona.id) return;
    const activeId = messagingService.getActiveConversationId();
    if (activeId && !isFetchingActive) {
      isFetchingActive = true;
      messagingService.fetchConversationMessages(activeId)
        .catch(() => {})
        .finally(() => {
          isFetchingActive = false;
        });
    }
  }, 1200);

  // 2. Background conversations sync: every 6000ms for thread list & unread indicators
  setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return;
    const persona = getActiveMessagingPersona();
    if (!persona.personalUserId && !persona.id) return;
    if (!isSyncingAll) {
      isSyncingAll = true;
      messagingService.syncFromServer()
        .catch(() => {})
        .finally(() => {
          isSyncingAll = false;
        });
    }
  }, 6000);

  // 3. Catch up immediately when tab is focused or becomes visible
  const triggerInstantCatchUp = () => {
    const activeId = messagingService.getActiveConversationId();
    if (activeId) {
      messagingService.fetchConversationMessages(activeId).catch(() => {});
    }
    messagingService.syncFromServer().catch(() => {});
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) triggerInstantCatchUp();
    });
  }
  window.addEventListener('focus', triggerInstantCatchUp);
  window.addEventListener('xentro-active-conversation-changed', (e: any) => {
    const convId = e?.detail?.conversationId;
    if (convId) {
      messagingService.fetchConversationMessages(convId).catch(() => {});
    }
  });
}

function normalizeId(id?: string | null): string {
  if (!id) return '';
  return id.trim();
}

export const messagingService = {
  getActiveMessagingPersona(): ActiveMessagingPersona {
    return getActiveMessagingPersona();
  },

  isAutoReplyEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const val = localStorage.getItem(AUTO_REPLY_KEY);
      return val === 'true';
    } catch {
      return false;
    }
  },

  setAutoReplyEnabled(enabled: boolean): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(AUTO_REPLY_KEY, String(enabled));
      window.dispatchEvent(new CustomEvent(AUTO_REPLY_CHANGED_EVENT));
    } catch (e) {
      console.error('Failed to set auto reply:', e);
    }
  },

  toggleAutoReply(): boolean {
    const next = !this.isAutoReplyEnabled();
    this.setAutoReplyEnabled(next);
    return next;
  },

  getActiveConversationId(): string {
    if (typeof window === 'undefined') return '';
    const stored = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
    if (!stored || stored === 'conv_neeraj_xentro') {
      return '';
    }
    return stored;
  },

  setActiveConversationId(convId: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(ACTIVE_CONVERSATION_KEY, convId);
    window.dispatchEvent(
      new CustomEvent('xentro-active-conversation-changed', {
        detail: { conversationId: convId },
      })
    );
  },

  getCustomConversations(): StoredConversationMeta[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(CUSTOM_CONVERSATIONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load custom conversations:', e);
    }
    return [];
  },

  saveCustomConversations(list: StoredConversationMeta[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CUSTOM_CONVERSATIONS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save custom conversations:', e);
    }
  },

  getRawMessages(): SharedChatMessage[] {
    if (typeof window === 'undefined') return INITIAL_MESSAGES;
    try {
      const raw = localStorage.getItem(SHARED_MESSAGES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter((m) => m.conversationId !== 'conv_neeraj_xentro') as SharedChatMessage[];
        }
      }
    } catch (e) {
      console.error('Failed to load raw messages:', e);
    }
    return INITIAL_MESSAGES;
  },

  saveRawMessages(messages: SharedChatMessage[]): void {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(messages);
      // Skip write + event if data hasn't changed — prevents unnecessary re-renders / flickering
      const current = localStorage.getItem(SHARED_MESSAGES_KEY);
      if (current === serialized) return;
      localStorage.setItem(SHARED_MESSAGES_KEY, serialized);
      window.dispatchEvent(
        new CustomEvent(CONVERSATIONS_UPDATED_EVENT, { detail: { messages } })
      );
      if (broadcastChannel) {
        broadcastChannel.postMessage({ type: 'CONVERSATIONS_UPDATED' });
      }
    } catch (e) {
      console.error('Failed to save raw messages:', e);
    }
  },

  applyIncomingMessage(incoming: SharedChatMessage): void {
    if (incoming.conversationId === 'conv_neeraj_xentro') return;
    const current = this.getRawMessages();
    const resolvedCreatedAt =
      incoming.createdAt ||
      (incoming.timestamp && !isNaN(new Date(incoming.timestamp).getTime())
        ? incoming.timestamp
        : new Date().toISOString());
    const formattedIncoming: SharedChatMessage = {
      ...incoming,
      createdAt: resolvedCreatedAt,
      timestamp: formatMessageTime(incoming.timestamp || resolvedCreatedAt),
      failed: false,
    };

    // Reconcile: match by exact id, clientMessageId, or (senderId + conversationId + content + time proximity)
    const existingIndex = current.findIndex(
      (m) =>
        m.id === incoming.id ||
        (incoming.clientMessageId && (m.id === incoming.clientMessageId || m.clientMessageId === incoming.clientMessageId)) ||
        (m.conversationId === incoming.conversationId &&
         m.senderId === incoming.senderId &&
         m.text.trim() === incoming.text.trim())
    );

    if (existingIndex >= 0) {
      const merged = [...current];
      merged[existingIndex] = {
        ...merged[existingIndex],
        ...formattedIncoming,
        id: incoming.id,
      };
      this.saveRawMessages(merged);
    } else {
      this.saveRawMessages([...current, formattedIncoming]);
    }
  },

  applyRemoteMessages(remoteList: SharedChatMessage[]): void {
    if (!Array.isArray(remoteList)) return;
    const current = this.getRawMessages();
    const map = new Map<string, SharedChatMessage>();

    current.forEach((m) => {
      if (m.conversationId !== 'conv_neeraj_xentro') map.set(m.id, m);
    });

    remoteList.forEach((incoming) => {
      if (incoming.conversationId === 'conv_neeraj_xentro') return;
      const resolvedCreatedAt =
        incoming.createdAt ||
        (incoming.timestamp && !isNaN(new Date(incoming.timestamp).getTime())
          ? incoming.timestamp
          : new Date().toISOString());
      const formatted: SharedChatMessage = {
        ...incoming,
        createdAt: resolvedCreatedAt,
        timestamp: formatMessageTime(incoming.timestamp || resolvedCreatedAt),
        failed: false,
      };

      let foundKey: string | null = null;
      for (const [k, existing] of Array.from(map.entries())) {
        if (
          k === incoming.id ||
          (incoming.clientMessageId && (existing.id === incoming.clientMessageId || existing.clientMessageId === incoming.clientMessageId)) ||
          (existing.conversationId === incoming.conversationId &&
           existing.senderId === incoming.senderId &&
           existing.text.trim() === incoming.text.trim())
        ) {
          foundKey = k;
          break;
        }
      }

      if (foundKey && foundKey !== incoming.id) {
        map.delete(foundKey);
      }
      map.set(incoming.id, formatted);
    });

    const merged = Array.from(map.values());
    this.saveRawMessages(merged);
  },

  /**
   * Authoritative sync from MongoDB Atlas.
   * Loads all conversations for the user and merges them into state.
   */
  async syncFromServer(userId?: string): Promise<Conversation[]> {
    if (typeof window === 'undefined') return [];
    try {
      const persona = getActiveMessagingPersona();
      const personalId = normalizeId(persona.personalUserId);
      const entityId = persona.isEntity ? normalizeId(persona.entityId) : '';
      const currentNorm = normalizeId(persona.id).toLowerCase();
      const personalNorm = personalId.toLowerCase();

      const params = new URLSearchParams();
      if (userId) {
        params.append('userId', userId);
      } else {
        if (personalId) params.append('userId', personalId);
        if (entityId) params.append('entityId', entityId);
      }

      if (!params.toString()) return this.getConversations();

      const res = await fetch(`/api/messages?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) return this.getConversations();

      const data = await res.json();
      const remoteConvs = data?.conversations;
      if (!Array.isArray(remoteConvs)) return this.getConversations();

      const customList = this.getCustomConversations();
      const customMap = new Map<string, StoredConversationMeta>();
      customList.forEach((c) => customMap.set(c.id.toLowerCase(), c));

      const allMsgs = this.getRawMessages();
      const msgMap = new Map<string, SharedChatMessage>();
      allMsgs.forEach((m) => msgMap.set(m.id, m));

      remoteConvs.forEach((rc: any) => {
        const convId = rc.id;
        const participants = rc.participants || [persona.id, rc.partner?.id || rc.user?.id];
        const otherId = (participants || []).find((p: string) => {
          const pNorm = normalizeId(p).toLowerCase();
          return pNorm !== currentNorm && pNorm !== personalNorm;
        }) || rc.partner?.id || rc.user?.id || '';

        const existingMeta = customMap.get(convId.toLowerCase());
        const rawPartner = rc.partner || rc.user || {};
        let partnerName = (rawPartner.name && rawPartner.name !== 'Member' && rawPartner.name !== 'Partner') ? rawPartner.name : '';

        // Check local storage connections and partners
        if (!partnerName && otherId) {
          const loc = resolvePartnerFromLocalStorage(otherId, convId);
          if (loc?.name) {
            partnerName = loc.name;
            if (!rawPartner.role || rawPartner.role === 'Member') rawPartner.role = loc.role;
            if (!rawPartner.avatar) rawPartner.avatar = loc.avatar;
          }
        }

        // Check existing local meta
        if (!partnerName && existingMeta?.user?.name && existingMeta.user.name !== 'Member' && existingMeta.user.name !== 'Partner') {
          partnerName = existingMeta.user.name;
          if (!rawPartner.role || rawPartner.role === 'Member') rawPartner.role = existingMeta.user.role;
          if (!rawPartner.avatar) rawPartner.avatar = existingMeta.user.avatar;
        }

        // Check system welcome message in thread messages
        if (!partnerName && Array.isArray(rc.messages)) {
          for (const m of rc.messages) {
            const t = m.text || m.content || '';
            const match = t.match(/You and (.+?) are now connected/i);
            if (match && match[1] && match[1].trim() && match[1].trim() !== 'your connection') {
              partnerName = match[1].trim();
              break;
            }
          }
        }

        // Clean fallback from otherId
        if (!partnerName) {
          partnerName = formatIdToName(otherId);
        }

        const partnerAvatar = resolveAvatarUrl(rawPartner.avatar, partnerName);
        const partnerTag = rawPartner.accountTag || rawPartner.username || `@${partnerName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
        const personaTag = (persona as any).accountTag || (persona as any).username || `@${(persona.name).toLowerCase().replace(/[^a-z0-9]/g, '')}`;

        const partnerUser: User = {
          id: otherId || rawPartner.id || 'usr_partner',
          name: partnerName,
          username: partnerTag,
          role: (rawPartner.role && rawPartner.role !== 'Member') ? rawPartner.role : 'Explorer',
          company: rawPartner.company || partnerName || 'Xentro Network',
          avatar: partnerAvatar,
          verified: true,
          status: 'Active now',
        };

        const currentAvatar = resolveAvatarUrl(persona.avatar, persona.name);

        const mergedUsers: Record<string, User> = {
          ...(rc.users || {}),
          [persona.id]: {
            id: persona.id,
            name: persona.name,
            username: personaTag,
            role: persona.role,
            company: persona.company,
            avatar: currentAvatar,
            verified: true,
            status: 'Active now',
          },
          [partnerUser.id]: partnerUser,
        };

        const meta: StoredConversationMeta = {
          id: convId,
          user: partnerUser,
          participants,
          users: mergedUsers,
          createdAt: rc.createdAt || new Date().toISOString(),
          updatedAt: rc.updatedAt || new Date().toISOString(),
          lastMessage: rc.lastMessage,
        };

        customMap.set(convId.toLowerCase(), meta);

        // Ingest thread messages from server with deduplication
        if (Array.isArray(rc.messages)) {
          rc.messages.forEach((m: any) => {
            const srvId = m.id;
            const clientMsgId = m.clientMessageId;
            const text = m.text || m.content || '';
            const timeFormatted = formatMessageTime(m.timestamp || m.createdAt);

            let foundKey: string | null = null;
            for (const [k, existing] of Array.from(msgMap.entries())) {
              if (
                k === srvId ||
                (clientMsgId && (k === clientMsgId || existing.clientMessageId === clientMsgId)) ||
                (existing.conversationId === convId &&
                 existing.senderId === m.senderId &&
                 existing.text.trim() === text.trim())
              ) {
                foundKey = k;
                break;
              }
            }

            if (foundKey && foundKey !== srvId) {
              msgMap.delete(foundKey);
            }

            const existingMsg = msgMap.get(srvId) || (foundKey ? msgMap.get(foundKey) : undefined);
            const mergedReadBy = Array.from(new Set([
              ...(existingMsg?.readBy || []),
              ...(Array.isArray(m.readBy) ? m.readBy : [m.senderId]),
            ]));
            const resolvedCreatedAt =
              m.createdAt ||
              existingMsg?.createdAt ||
              (m.timestamp && !isNaN(new Date(m.timestamp).getTime())
                ? m.timestamp
                : new Date().toISOString());

            msgMap.set(srvId, {
              id: srvId,
              clientMessageId: clientMsgId || srvId,
              conversationId: convId,
              senderId: m.senderId,
              senderName: m.senderName || partnerUser.name,
              text,
              content: text,
              timestamp: timeFormatted,
              createdAt: resolvedCreatedAt,
              readBy: mergedReadBy,
              failed: false,
            });
          });
        }
      });

      this.saveCustomConversations(Array.from(customMap.values()));
      this.saveRawMessages(Array.from(msgMap.values()));

      window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATED_EVENT));
      return this.getConversations();
    } catch (err) {
      console.debug('[Messaging] syncFromServer error:', err);
      return this.getConversations();
    }
  },

  /**
   * Fetches full message history for a specific conversation directly from MongoDB Atlas.
   */
  async fetchConversationMessages(conversationId: string, userId?: string): Promise<SharedChatMessage[]> {
    if (typeof window === 'undefined' || !conversationId) return [];
    try {
      const profile = getUserProfile();
      const currentUserId = userId || profile.id || '';
      const url = `/api/messages?conversationId=${encodeURIComponent(conversationId)}&userId=${encodeURIComponent(currentUserId)}`;

      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return [];

      const data = await res.json();
      const serverMsgs = data?.messages;
      if (!Array.isArray(serverMsgs)) return [];

      const currentRaw = this.getRawMessages();
      const msgMap = new Map<string, SharedChatMessage>();
      currentRaw.forEach((m) => msgMap.set(m.id, m));

      serverMsgs.forEach((m: any) => {
        const srvId = m.id;
        const clientMsgId = m.clientMessageId;
        const text = m.text || m.content || '';
        const timeFormatted = formatMessageTime(m.timestamp || m.createdAt);

        let foundKey: string | null = null;
        for (const [k, existing] of Array.from(msgMap.entries())) {
          if (
            k === srvId ||
            (clientMsgId && (k === clientMsgId || existing.clientMessageId === clientMsgId)) ||
            (existing.conversationId === conversationId &&
             existing.senderId === m.senderId &&
             existing.text.trim() === text.trim())
          ) {
            foundKey = k;
            break;
          }
        }

        if (foundKey && foundKey !== srvId) {
          msgMap.delete(foundKey);
        }

        const existingMsg = msgMap.get(srvId) || (foundKey ? msgMap.get(foundKey) : undefined);
        const mergedReadBy = Array.from(new Set([
          ...(existingMsg?.readBy || []),
          ...(Array.isArray(m.readBy) ? m.readBy : [m.senderId]),
        ]));
        const resolvedCreatedAt =
          m.createdAt ||
          existingMsg?.createdAt ||
          (m.timestamp && !isNaN(new Date(m.timestamp).getTime())
            ? m.timestamp
            : new Date().toISOString());

        msgMap.set(srvId, {
          id: srvId,
          clientMessageId: clientMsgId || srvId,
          conversationId,
          senderId: m.senderId,
          senderName: m.senderName || 'Member',
          text,
          content: text,
          timestamp: timeFormatted,
          createdAt: resolvedCreatedAt,
          readBy: mergedReadBy,
          failed: false,
        });
      });

      const updated = Array.from(msgMap.values());
      this.saveRawMessages(updated);
      return serverMsgs;
    } catch (err) {
      console.debug('[Messaging] fetchConversationMessages error:', err);
      return [];
    }
  },

  /** Returns conversations customized for the active persona (startup or personal) */
  getConversations(): Conversation[] {
    const rawList = this.getRawMessages();
    const persona = getActiveMessagingPersona();
    const currentUserId = persona.id;
    const currentNorm = normalizeId(currentUserId).toLowerCase();
    const personalNorm = normalizeId(persona.personalUserId).toLowerCase();

    const customList = this.getCustomConversations();
    const result: Conversation[] = [];

    for (const c of customList) {
      if (c.id === 'conv_neeraj_xentro') continue;

      const participants = (c.participants || []).map((p) => normalizeId(p).toLowerCase());

      // Persona isolation:
      // In entity mode (Startup), only show conversations involving this entity!
      // In personal mode, only show conversations involving this personal user!
      if (persona.isEntity) {
        if (!participants.includes(currentNorm)) {
          continue;
        }
      } else {
        if (personalNorm && participants.length > 0 && !participants.includes(personalNorm)) {
          continue;
        }
      }

      // Resolve partner persona relative to current viewer
      let partnerUser = c.user;
      if (c.users && currentNorm) {
        const partnerKey = Object.keys(c.users).find((k) => {
          const kNorm = normalizeId(k).toLowerCase();
          return kNorm !== currentNorm && kNorm !== personalNorm;
        });
        if (partnerKey && c.users[partnerKey]) {
          partnerUser = c.users[partnerKey];
        }
      }

      // Find other participant ID
      const otherParticipantId = (c.participants || []).find((p) => {
        const pNorm = normalizeId(p).toLowerCase();
        return pNorm !== currentNorm && pNorm !== personalNorm;
      }) || (partnerUser?.id && normalizeId(partnerUser.id).toLowerCase() !== currentNorm ? partnerUser.id : '');

      // Ensure partnerUser is never undefined, never generic 'Member' or 'Partner', and never the viewer itself
      const isPartnerInvalid =
        !partnerUser ||
        !partnerUser.name ||
        partnerUser.name === 'Member' ||
        partnerUser.name === 'Partner' ||
        (partnerUser.id && (partnerUser.id.toLowerCase() === currentNorm || partnerUser.id.toLowerCase() === personalNorm)) ||
        (partnerUser.name && partnerUser.name.toLowerCase().trim() === persona.name.toLowerCase().trim());

      if (isPartnerInvalid) {
        let resolvedName = '';
        let resolvedRole = 'Explorer';
        let resolvedAvatar = '';
        let resolvedCompany = '';

        // 1. Try finding a non-self, non-Member user in c.users
        if (c.users) {
          for (const key of Object.keys(c.users)) {
            const u = c.users[key];
            const uNorm = u?.id?.toLowerCase();
            if (
              u &&
              uNorm !== currentNorm &&
              uNorm !== personalNorm &&
              u.name &&
              u.name !== 'Member' &&
              u.name !== 'Partner' &&
              u.name.toLowerCase().trim() !== persona.name.toLowerCase().trim()
            ) {
              resolvedName = u.name;
              resolvedRole = u.role || resolvedRole;
              resolvedAvatar = u.avatar || resolvedAvatar;
              resolvedCompany = u.company || resolvedCompany;
              break;
            }
          }
        }

        // 2. Try Local Storage Connections / Partners
        if (!resolvedName && otherParticipantId) {
          const loc = resolvePartnerFromLocalStorage(otherParticipantId, c.id);
          if (loc?.name) {
            resolvedName = loc.name;
            resolvedRole = loc.role || resolvedRole;
            resolvedAvatar = loc.avatar || resolvedAvatar;
            resolvedCompany = loc.company || resolvedCompany;
          }
        }

        // 3. Try System connection welcome message in rawList
        if (!resolvedName) {
          const sysMsg = rawList.find(
            (m) =>
              (m.conversationId || '').toLowerCase() === c.id.toLowerCase() &&
              (m.text || '').includes('You and ') &&
              (m.text || '').includes('are now connected')
          );
          if (sysMsg) {
            const match = (sysMsg.text || '').match(/You and (.+?) are now connected/i);
            if (match && match[1] && match[1].trim() && match[1].trim() !== 'your connection') {
              resolvedName = match[1].trim();
            }
          }
        }

        // 4. Try Messages in thread for any message sent by the other user
        if (!resolvedName) {
          const partnerMsg = rawList.find(
            (m) =>
              (m.conversationId || '').toLowerCase() === c.id.toLowerCase() &&
              normalizeId(m.senderId).toLowerCase() !== currentNorm &&
              normalizeId(m.senderId).toLowerCase() !== personalNorm &&
              m.senderName &&
              m.senderName !== 'Member' &&
              m.senderName !== 'Partner' &&
              m.senderName.toLowerCase().trim() !== persona.name.toLowerCase().trim()
          );
          if (partnerMsg?.senderName) {
            resolvedName = partnerMsg.senderName;
          }
        }

        // 5. Clean fallback from otherParticipantId
        if (!resolvedName) {
          resolvedName = formatIdToName(otherParticipantId);
        }

        partnerUser = {
          id: otherParticipantId || partnerUser?.id || 'usr_partner',
          name: resolvedName,
          username: `@${resolvedName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          role: (resolvedRole && resolvedRole !== 'Member') ? resolvedRole : 'Explorer',
          company: resolvedCompany || resolvedName,
          avatar: resolveAvatarUrl(resolvedAvatar, resolvedName),
          verified: true,
          status: 'Active now',
        };
      }

      // Messages in this thread (case-insensitive conversationId matching)
      const threadRaw = rawList.filter(
        (m) => (m.conversationId || '').toLowerCase() === c.id.toLowerCase()
      );

      // Deduplicate messages in this thread by stable ID or clientMessageId
      const seenMsgKeys = new Set<string>();
      const dedupedThread: typeof threadRaw = [];
      for (const m of threadRaw) {
        const idKey = m.id;
        const clientKey = m.clientMessageId;
        const fallbackKey = `${m.senderId}:${(m.text || '').trim()}:${(m.createdAt || m.timestamp || '').slice(0, 16)}`;
        if (
          (idKey && seenMsgKeys.has(idKey)) ||
          (clientKey && seenMsgKeys.has(clientKey)) ||
          seenMsgKeys.has(fallbackKey)
        ) {
          continue;
        }
        if (idKey) seenMsgKeys.add(idKey);
        if (clientKey) seenMsgKeys.add(clientKey);
        seenMsgKeys.add(fallbackKey);
        dedupedThread.push(m);
      }

      // Sort chronologically with rock-solid fallback
      dedupedThread.sort((a, b) => {
        const tA = getMessageTimestampMs(a);
        const tB = getMessageTimestampMs(b);
        if (tA !== tB) return tA - tB;
        return (a.id || '').localeCompare(b.id || '');
      });

      const convMsgs = dedupedThread.map((m) => {
        const text = m.text || m.content || '';
        const isSystem = text.startsWith('🤝 Connection established') || (m as any).type === 'system' || (m as any).isSystem;
        const sNorm = normalizeId(m.senderId).toLowerCase();
        const isMeSender = sNorm === currentNorm || (persona.isEntity && sNorm === personalNorm);
        return {
          id: m.id,
          senderId: m.senderId,
          text,
          timestamp: formatMessageTime(m.timestamp || m.createdAt),
          isMe: isSystem ? false : isMeSender,
          isSystem: Boolean(isSystem),
          failed: Boolean(m.failed),
        };
      });

      const lastMsg = convMsgs[convMsgs.length - 1];
      const unread = rawList.filter(
        (m) =>
          (m.conversationId || '').toLowerCase() === c.id.toLowerCase() &&
          normalizeId(m.senderId).toLowerCase() !== currentNorm &&
          normalizeId(m.senderId).toLowerCase() !== personalNorm &&
          (!m.readBy || !m.readBy.some((r) => normalizeId(r).toLowerCase() === currentNorm || normalizeId(r).toLowerCase() === personalNorm))
      ).length;

      const safePartnerUser: User = {
        ...partnerUser,
        avatar: resolveAvatarUrl(partnerUser.avatar, partnerUser.name),
      };

      result.push({
        id: c.id,
        user: safePartnerUser,
        lastMessage: lastMsg?.text || c.lastMessage || 'Conversation initiated.',
        timestamp: lastMsg?.timestamp || 'Just now',
        unreadCount: unread,
        isOnline: true,
        messages: convMsgs as ChatMessage[],
      });
    }

    // Deduplicate conversations so the user never sees two threads for the same person
    // Prioritize conversation threads that have actual messages over empty ones
    result.sort((a, b) => {
      const aHasMsgs = (a.messages?.length || 0) > 0;
      const bHasMsgs = (b.messages?.length || 0) > 0;
      if (aHasMsgs !== bHasMsgs) return aHasMsgs ? -1 : 1;
      return 0;
    });

    const dedupedResult: Conversation[] = [];
    const seenPartners = new Set<string>();
    for (const conv of result) {
      const partnerKey = (conv.user?.name || conv.user?.id || '').toLowerCase().trim();
      if (!partnerKey || seenPartners.has(partnerKey)) {
        continue;
      }
      seenPartners.add(partnerKey);
      dedupedResult.push(conv);
    }

    return dedupedResult;
  },

  getUnreadCount(): number {
    const convs = this.getConversations();
    return convs.reduce((acc, c) => acc + c.unreadCount, 0);
  },

  startOrOpenConversation(
    partner: {
      id: string;
      name: string;
      role?: string;
      avatar?: string;
      company?: string;
      initialMessage?: string;
    },
    options?: { navigate?: boolean }
  ): string {
    const shouldNavigate = options?.navigate !== false;
    const persona = getActiveMessagingPersona();
    const currentUserId = persona.id;
    const partnerId = partner.id || `partner_${Date.now()}`;

    const currentNorm = normalizeId(currentUserId);
    const partnerNorm = normalizeId(partnerId);

    if (partnerNorm && currentNorm && partnerNorm.toLowerCase() === currentNorm.toLowerCase()) {
      console.warn('[Messaging] Cannot start a conversation with oneself.');
      return '';
    }

    // Standardized pair key: sorted by ID in lowercase
    const sortedPair = [currentNorm.toLowerCase(), partnerNorm.toLowerCase()].sort();
    const convId = `conv_${sortedPair[0]}_${sortedPair[1]}`;

    let partnerName = (partner.name && partner.name !== 'Member' && partner.name !== 'Partner') ? partner.name : '';
    let partnerRole = (partner.role && partner.role !== 'Member') ? partner.role : 'Explorer';
    let partnerAvatarRaw = partner.avatar;

    if (!partnerName) {
      const loc = resolvePartnerFromLocalStorage(partner.id, convId);
      if (loc?.name) {
        partnerName = loc.name;
        if (loc.role) partnerRole = loc.role;
        if (loc.avatar) partnerAvatarRaw = loc.avatar;
      }
    }

    if (!partnerName) {
      partnerName = formatIdToName(partner.id);
    }

    const partnerAvatar = resolveAvatarUrl(partnerAvatarRaw, partnerName);
    const currentAvatar = resolveAvatarUrl(persona.avatar, persona.name);

    const partnerTag = (partner as any).accountTag || (partner as any).username || `@${partnerName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    const personaTag = (persona as any).accountTag || (persona as any).username || `@${(persona.name).toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    const partnerUser: User = {
      id: partner.id,
      name: partnerName,
      username: partnerTag,
      role: partnerRole,
      company: partner.company || partnerName,
      avatar: partnerAvatar,
      verified: true,
      status: 'Active now',
    };

    const currentUserObj: User = {
      id: currentUserId,
      name: persona.name,
      username: personaTag,
      role: persona.role,
      company: persona.company,
      avatar: currentAvatar,
      verified: true,
      status: 'Active now',
    };

    const customList = this.getCustomConversations();
    const existingIndex = customList.findIndex((c) => c.id.toLowerCase() === convId.toLowerCase());

    if (existingIndex < 0) {
      const newMeta: StoredConversationMeta = {
        id: convId,
        user: partnerUser,
        participants: [currentUserId, partner.id],
        users: {
          [currentUserId]: currentUserObj,
          [partner.id]: partnerUser,
        },
        createdAt: new Date().toISOString(),
      };
      this.saveCustomConversations([newMeta, ...customList]);

      if (partner.initialMessage) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const welcomeMsg: SharedChatMessage = {
          id: `msg_kickoff_${Date.now()}`,
          conversationId: convId,
          senderId: partner.id,
          senderName: partnerName,
          text: partner.initialMessage,
          timestamp: timeStr,
          readBy: [currentUserId],
        };

        const currentRaw = this.getRawMessages();
        this.saveRawMessages([...currentRaw, welcomeMsg]);
      }
    } else {
      const existing = customList[existingIndex];
      existing.user = partnerUser;
      if (!existing.users) existing.users = {};
      existing.users[partner.id] = partnerUser;
      existing.users[currentUserId] = currentUserObj;
      if (!existing.participants || existing.participants.length === 0) {
        existing.participants = [currentUserId, partner.id];
      }
      customList[existingIndex] = existing;
      this.saveCustomConversations(customList);
    }

    if (shouldNavigate) {
      this.setActiveConversationId(convId);
    }

    // Persist conversation to MongoDB backend
    if (typeof window !== 'undefined') {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'startConversation',
          partnerId: partner.id,
          userId: currentUserId,
          partner: {
            id: partner.id,
            name: partner.name,
            role: partner.role || 'Member',
            avatar: partnerAvatar,
            company: partner.company || partner.name,
          },
          currentUser: currentUserObj,
          initialMessage: partner.initialMessage,
        }),
      })
        .then(() => {
          this.syncFromServer(currentUserId).catch(() => {});
        })
        .catch((err) => console.debug('[Messaging API] startConversation error:', err));
    }

    if (typeof window !== 'undefined') {
      if (shouldNavigate) {
        window.dispatchEvent(
          new CustomEvent('xentro-navigate-tab', {
            detail: { tab: 'messages', conversationId: convId },
          })
        );
      }
      window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATED_EVENT));
    }

    return convId;
  },

  sendMessage(conversationId: string, text: string, retryMsgId?: string): Conversation[] {
    const clean = text.trim();
    if (!clean || !conversationId) return this.getConversations();

    const persona = getActiveMessagingPersona();
    const currentUserId = persona.id;

    const inFlightKey = `${conversationId}:${clean}`;
    if (inFlightSends.has(inFlightKey) && !retryMsgId) {
      console.warn('[Messaging] Duplicate send prevented for:', inFlightKey);
      return this.getConversations();
    }
    inFlightSends.add(inFlightKey);
    setTimeout(() => inFlightSends.delete(inFlightKey), 1500);

    const clientMsgId = retryMsgId || `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });

    // Look up conversation recipient for cross-user routing in MongoDB
    const custom = this.getCustomConversations().find(c => c.id.toLowerCase() === conversationId.toLowerCase());
    let recipientId = '';
    if (custom) {
      recipientId = custom.participants?.find(p => normalizeId(p).toLowerCase() !== normalizeId(currentUserId).toLowerCase()) || custom.user?.id || '';
    }

    const newMsg: SharedChatMessage = {
      id: clientMsgId,
      clientMessageId: clientMsgId,
      conversationId,
      senderId: currentUserId,
      senderName: persona.name,
      text: clean,
      content: clean,
      timestamp: timeStr,
      createdAt: now.toISOString(),
      readBy: [currentUserId],
      failed: false,
    };

    // 1. Optimistic local update (or replace existing in place on retry)
    const currentRaw = this.getRawMessages();
    const updated = [
      ...currentRaw.filter((m) => m.id !== clientMsgId && m.clientMessageId !== clientMsgId),
      newMsg,
    ];
    this.saveRawMessages(updated);

    // 2. Broadcast to Server API -> writes to MongoDB Atlas collections 'chat_messages' and 'conversations'
    if (typeof window !== 'undefined') {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          message: {
            ...newMsg,
            senderAvatar: persona.avatar,
            senderRole: persona.role,
            recipientId: recipientId || undefined,
          },
          partnerId: recipientId || undefined,
        }),
      })
        .then(async (res) => {
          inFlightSends.delete(inFlightKey);
          if (!res.ok) {
            this.markMessageFailed(clientMsgId);
            return;
          }
          const resData = await res.json().catch(() => ({}));
          const serverMsg = resData?.message;
          if (serverMsg) {
            this.reconcileMessage(clientMsgId, serverMsg);
          }
          this.fetchConversationMessages(conversationId, currentUserId).catch(() => {});
        })
        .catch((err) => {
          inFlightSends.delete(inFlightKey);
          console.debug('[Realtime API] Message send error:', err);
          this.markMessageFailed(clientMsgId);
        });
    }

    return this.getConversations();
  },

  retryMessage(conversationId: string, messageId: string): Conversation[] {
    const raw = this.getRawMessages();
    const target = raw.find((m) => m.id === messageId || m.clientMessageId === messageId);
    if (!target) return this.getConversations();
    return this.sendMessage(conversationId, target.text, target.id);
  },

  reconcileMessage(clientMsgId: string, serverMsg: any): void {
    const raw = this.getRawMessages();
    let replaced = false;
    const updated = raw.map((m) => {
      if (m.id === clientMsgId || m.clientMessageId === clientMsgId || (serverMsg.id && m.id === serverMsg.id)) {
        replaced = true;
        return {
          ...m,
          id: serverMsg.id || clientMsgId,
          clientMessageId: clientMsgId,
          timestamp: formatMessageTime(serverMsg.createdAt || serverMsg.timestamp || m.timestamp),
          createdAt: serverMsg.createdAt || m.createdAt,
          failed: false,
        };
      }
      return m;
    });
    if (replaced) {
      this.saveRawMessages(updated);
    }
  },

  markMessageFailed(clientMsgId: string): void {
    const raw = this.getRawMessages();
    const updated = raw.map((m) => {
      if (m.id === clientMsgId || m.clientMessageId === clientMsgId) {
        return { ...m, failed: true };
      }
      return m;
    });
    this.saveRawMessages(updated);
  },

  markRead(conversationId: string): Conversation[] {
    const profile = getUserProfile();
    const currentUserId = profile.id || '';
    const currentNorm = normalizeId(currentUserId).toLowerCase();

    const raw = this.getRawMessages();
    let modified = false;

    const updated = raw.map((m) => {
      if ((m.conversationId || '').toLowerCase() === conversationId.toLowerCase()) {
        const readBy = m.readBy || [];
        if (!readBy.some((r) => normalizeId(r).toLowerCase() === currentNorm)) {
          modified = true;
          return { ...m, readBy: [...readBy, currentUserId] };
        }
      }
      return m;
    });

    if (modified) {
      this.saveRawMessages(updated);
      if (typeof window !== 'undefined' && currentUserId) {
        // Pass conversationId so backend only marks this thread — not all messages
        fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'markRead', userId: currentUserId, conversationId }),
        }).catch(() => {});
      }
    }

    return this.getConversations();
  },

  clearAllMessages(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SHARED_MESSAGES_KEY);
      localStorage.removeItem(CUSTOM_CONVERSATIONS_KEY);
      localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear' }),
      }).catch(() => {});
      window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATED_EVENT));
    }
  },
};
