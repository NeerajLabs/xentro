'use client';

import { Conversation, ChatMessage, User } from '@/types';
import { getUserProfile } from './userProfile';

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

export function resolveAvatarUrl(avatar?: string | null, name?: string | null): string {
  if (avatar && avatar !== '/xentro-logo.png' && !avatar.includes('xentro-logo.png') && avatar.trim().length > 0) {
    return avatar;
  }
  const cleanName = (name || 'Member').trim();
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

  // Background polling every 4 seconds to guarantee real-time delivery even across different sessions
  setInterval(() => {
    const profile = getUserProfile();
    if (profile?.id) {
      messagingService.syncFromServer(profile.id).catch(() => {});
      const activeId = messagingService.getActiveConversationId();
      if (activeId) {
        messagingService.fetchConversationMessages(activeId, profile.id).catch(() => {});
      }
    }
  }, 4000);
}

function normalizeId(id?: string | null): string {
  if (!id) return '';
  return id.trim();
}

export const messagingService = {
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
    const formattedIncoming: SharedChatMessage = {
      ...incoming,
      timestamp: formatMessageTime(incoming.timestamp || incoming.createdAt),
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
      const formatted: SharedChatMessage = {
        ...incoming,
        timestamp: formatMessageTime(incoming.timestamp || incoming.createdAt),
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
      const profile = getUserProfile();
      const currentUserId = userId || profile.id || '';
      if (!currentUserId) return this.getConversations();

      const res = await fetch(`/api/messages?userId=${encodeURIComponent(currentUserId)}`, {
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
        const partner = rc.partner || rc.user || {};
        const partnerName = partner.name || 'Member';
        const partnerAvatar = resolveAvatarUrl(partner.avatar, partnerName);
        const partnerUser: User = {
          id: partner.id || 'usr_partner',
          name: partnerName,
          username: `@${partnerName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
          role: partner.role || 'Member',
          company: partner.company || partnerName || 'Xentro Network',
          avatar: partnerAvatar,
          verified: true,
          status: 'Active now',
        };

        const participants = rc.participants || [currentUserId, partner.id];
        const currentAvatar = resolveAvatarUrl(profile.avatar, profile.name);

        const meta: StoredConversationMeta = {
          id: convId,
          user: partnerUser,
          participants,
          users: {
            [currentUserId]: {
              id: currentUserId,
              name: profile.name || 'Member',
              username: `@${(profile.name || 'member').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              role: profile.roleTitle || profile.role || 'Member',
              company: profile.organization || 'Xentro Member',
              avatar: currentAvatar,
              verified: true,
              status: 'Active now',
            },
            [partner.id]: partnerUser,
          },
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

            msgMap.set(srvId, {
              id: srvId,
              clientMessageId: clientMsgId || srvId,
              conversationId: convId,
              senderId: m.senderId,
              senderName: m.senderName || partnerUser.name,
              text,
              content: text,
              timestamp: timeFormatted,
              createdAt: m.createdAt || '',
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

        msgMap.set(srvId, {
          id: srvId,
          clientMessageId: clientMsgId || srvId,
          conversationId,
          senderId: m.senderId,
          senderName: m.senderName || 'Member',
          text,
          content: text,
          timestamp: timeFormatted,
          createdAt: m.createdAt || '',
          readBy: mergedReadBy,
          failed: false,
        });
      });

      const updated = Array.from(msgMap.values());
      this.saveRawMessages(updated);
      window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATED_EVENT));
      return serverMsgs;
    } catch (err) {
      console.debug('[Messaging] fetchConversationMessages error:', err);
      return [];
    }
  },

  /** Returns conversations customized for the currently logged-in account */
  getConversations(): Conversation[] {
    const rawList = this.getRawMessages();
    const profile = getUserProfile();
    const currentUserId = profile.id || '';
    const currentNorm = normalizeId(currentUserId).toLowerCase();

    const customList = this.getCustomConversations();
    const result: Conversation[] = [];

    for (const c of customList) {
      if (c.id === 'conv_neeraj_xentro') continue;

      const participants = (c.participants || []).map((p) => normalizeId(p).toLowerCase());

      // If current user is logged in, ensure this user is one of the participants
      if (currentNorm && participants.length > 0 && !participants.includes(currentNorm)) {
        continue;
      }

      // Resolve partner persona relative to current viewer
      let partnerUser = c.user;
      if (c.users && currentNorm) {
        const partnerKey = Object.keys(c.users).find((k) => normalizeId(k).toLowerCase() !== currentNorm);
        if (partnerKey && c.users[partnerKey]) {
          partnerUser = c.users[partnerKey];
        }
      }

      // Safeguard: Never show current user as the partner in their own conversation list
      if (
        (partnerUser.id && partnerUser.id.toLowerCase() === currentNorm) ||
        (partnerUser.name && profile.name && partnerUser.name.toLowerCase().trim() === profile.name.toLowerCase().trim())
      ) {
        let realPartner: User | null = null;
        if (c.users) {
          for (const key of Object.keys(c.users)) {
            const u = c.users[key];
            if (u && u.id.toLowerCase() !== currentNorm && u.name.toLowerCase().trim() !== (profile.name || '').toLowerCase().trim()) {
              realPartner = u;
              break;
            }
          }
        }
        if (realPartner) {
          partnerUser = realPartner;
        } else {
          continue;
        }
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

      // Sort chronologically
      dedupedThread.sort((a, b) => {
        const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tA - tB;
      });

      const convMsgs = dedupedThread.map((m) => {
        const text = m.text || m.content || '';
        const isSystem = text.startsWith('🤝 Connection established') || (m as any).type === 'system' || (m as any).isSystem;
        return {
          id: m.id,
          senderId: m.senderId,
          text,
          timestamp: formatMessageTime(m.timestamp || m.createdAt),
          isMe: isSystem ? false : (normalizeId(m.senderId).toLowerCase() === currentNorm || m.senderId === currentUserId),
          isSystem: Boolean(isSystem),
          failed: Boolean(m.failed),
        };
      });

      const lastMsg = convMsgs[convMsgs.length - 1];
      const unread = rawList.filter(
        (m) =>
          (m.conversationId || '').toLowerCase() === c.id.toLowerCase() &&
          normalizeId(m.senderId).toLowerCase() !== currentNorm &&
          (!m.readBy || !m.readBy.some((r) => normalizeId(r).toLowerCase() === currentNorm))
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

  startOrOpenConversation(partner: {
    id: string;
    name: string;
    role?: string;
    avatar?: string;
    company?: string;
    initialMessage?: string;
  }): string {
    const profile = getUserProfile();
    const currentUserId = profile.id || `user_${Date.now()}`;
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

    const partnerAvatar = resolveAvatarUrl(partner.avatar, partner.name);
    const currentAvatar = resolveAvatarUrl(profile.avatar, profile.name);

    const partnerUser: User = {
      id: partner.id,
      name: partner.name,
      username: `@${partner.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      role: partner.role || 'Member',
      company: partner.company || partner.name,
      avatar: partnerAvatar,
      verified: true,
      status: 'Active now',
    };

    const currentUserObj: User = {
      id: currentUserId,
      name: profile.name || 'Member',
      username: `@${(profile.name || 'member').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      role: profile.roleTitle || profile.role || 'Member',
      company: profile.organization || 'Xentro Member',
      avatar: currentAvatar,
      verified: true,
      status: 'Active now',
    };

    const customList = this.getCustomConversations();
    const existing = customList.find((c) => c.id.toLowerCase() === convId.toLowerCase());

    if (!existing) {
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
          senderName: partner.name,
          text: partner.initialMessage,
          timestamp: timeStr,
          readBy: [currentUserId],
        };

        const currentRaw = this.getRawMessages();
        this.saveRawMessages([...currentRaw, welcomeMsg]);
      }
    }

    this.setActiveConversationId(convId);

    // Persist conversation to MongoDB backend
    if (typeof window !== 'undefined') {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'startConversation',
          partnerId: partner.id,
          userId: currentUserId,
          initialMessage: partner.initialMessage,
        }),
      })
        .then(() => {
          this.syncFromServer(currentUserId).catch(() => {});
        })
        .catch((err) => console.debug('[Messaging API] startConversation error:', err));
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('xentro-navigate-tab', {
          detail: { tab: 'messages', conversationId: convId },
        })
      );
      window.dispatchEvent(new CustomEvent(CONVERSATIONS_UPDATED_EVENT));
    }

    return convId;
  },

  sendMessage(conversationId: string, text: string, retryMsgId?: string): Conversation[] {
    const clean = text.trim();
    if (!clean || !conversationId) return this.getConversations();

    const profile = getUserProfile();
    const currentUserId = profile.id || `usr_${Date.now()}`;

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

    const newMsg: SharedChatMessage = {
      id: clientMsgId,
      clientMessageId: clientMsgId,
      conversationId,
      senderId: currentUserId,
      senderName: profile.name || 'Member',
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

    // 2. Broadcast to Server API -> writes to MongoDB Atlas collection 'messages'
    if (typeof window !== 'undefined') {
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send', message: newMsg }),
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
