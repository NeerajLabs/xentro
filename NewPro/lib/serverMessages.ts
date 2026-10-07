import fs from 'fs';
import path from 'path';
import { Post, PostComment } from '@/types';

export interface SharedChatMessage {
  id: string;
  conversationId?: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  readBy: string[];
  status?: string;
  senderAvatar?: string;
  senderRole?: string;
}

export interface ServerConnectionRecord {
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
}

const INITIAL_MESSAGES: SharedChatMessage[] = [];

const INITIAL_POSTS: Post[] = [];

type SSEListener = (data: string) => void;

interface GlobalStore {
  messages: SharedChatMessage[];
  connections: ServerConnectionRecord[];
  feed: Post[];
  listeners: Set<SSEListener>;
}

declare global {
  // eslint-disable-next-line no-var
  var __xentro_realtime_store: GlobalStore | undefined;
}

function getStorePath(): string {
  return path.join(process.cwd(), 'data', 'messages_store.json');
}

function getConnectionsPath(): string {
  return path.join(process.cwd(), 'data', 'connections_store.json');
}

function getFeedPath(): string {
  return path.join(process.cwd(), 'data', 'feed_store.json');
}

function loadInitialStore(): SharedChatMessage[] {
  try {
    const filePath = getStorePath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Realtime Server] Could not read disk store, using memory default', err);
  }
  return INITIAL_MESSAGES;
}

function loadInitialConnections(): ServerConnectionRecord[] {
  try {
    const filePath = getConnectionsPath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Realtime Server] Could not read connections store, using memory default', err);
  }
  return [];
}

function loadInitialFeed(): Post[] {
  try {
    const filePath = getFeedPath();
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Realtime Server] Could not read feed store, using memory default', err);
  }
  return INITIAL_POSTS;
}

function persistStore(messages: SharedChatMessage[]): void {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getStorePath(), JSON.stringify(messages, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Realtime Server] Could not persist to disk', err);
  }
}

function persistConnections(connections: ServerConnectionRecord[]): void {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getConnectionsPath(), JSON.stringify(connections, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Realtime Server] Could not persist connections to disk', err);
  }
}

function persistFeed(feed: Post[]): void {
  try {
    const dir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(getFeedPath(), JSON.stringify(feed, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Realtime Server] Could not persist feed to disk', err);
  }
}

function getStore(): GlobalStore {
  if (!globalThis.__xentro_realtime_store) {
    globalThis.__xentro_realtime_store = {
      messages: loadInitialStore(),
      connections: loadInitialConnections(),
      feed: loadInitialFeed(),
      listeners: new Set<SSEListener>(),
    };
  }
  if (!globalThis.__xentro_realtime_store.connections) {
    globalThis.__xentro_realtime_store.connections = loadInitialConnections();
  }
  if (!globalThis.__xentro_realtime_store.feed) {
    globalThis.__xentro_realtime_store.feed = loadInitialFeed();
  }
  return globalThis.__xentro_realtime_store;
}

export function getServerMessages(): SharedChatMessage[] {
  return getStore().messages;
}

export function getServerConnections(): ServerConnectionRecord[] {
  return getStore().connections;
}

export function getServerFeed(): Post[] {
  return getStore().feed;
}

export function broadcast(payload: { type: string; data?: any }): void {
  const store = getStore();
  const serialized = `data: ${JSON.stringify(payload)}\n\n`;
  store.listeners.forEach((listener) => {
    try {
      listener(serialized);
    } catch {
      store.listeners.delete(listener);
    }
  });
}

export function addServerMessage(msg: SharedChatMessage): SharedChatMessage[] {
  const store = getStore();
  const existingIdx = store.messages.findIndex((m) => m.id === msg.id);
  if (existingIdx >= 0) {
    store.messages[existingIdx] = msg;
  } else {
    store.messages.push(msg);
  }
  persistStore(store.messages);
  broadcast({ type: 'new_message', data: msg });
  return store.messages;
}

export function markServerMessagesRead(userId: string, conversationId?: string): SharedChatMessage[] {
  const store = getStore();
  let changed = false;
  const userNorm = userId.toLowerCase().trim();
  store.messages = store.messages.map((m) => {
    if (conversationId && (m.conversationId || '').toLowerCase().trim() !== conversationId.toLowerCase().trim()) {
      return m;
    }
    if (!m.readBy) m.readBy = [];
    if (!m.readBy.some((r) => r.toLowerCase().trim() === userNorm)) {
      changed = true;
      return { ...m, readBy: [...m.readBy, userId] };
    }
    return m;
  });

  if (changed) {
    persistStore(store.messages);
    broadcast({ type: 'sync_all', data: store.messages });
  }
  return store.messages;
}

export function clearServerMessages(): SharedChatMessage[] {
  const store = getStore();
  store.messages = [];
  persistStore([]);
  broadcast({ type: 'sync_all', data: [] });
  return [];
}

export function addOrUpdateServerConnection(conn: ServerConnectionRecord): ServerConnectionRecord[] {
  const store = getStore();
  const existingIdx = store.connections.findIndex((c) => c.id === conn.id);
  if (existingIdx >= 0) {
    store.connections[existingIdx] = conn;
  } else {
    store.connections.unshift(conn);
  }
  persistConnections(store.connections);
  broadcast({ type: 'connection_event', data: conn });
  return store.connections;
}

export function addServerPost(post: Post): Post[] {
  const store = getStore();
  const exists = store.feed.some((p) => p.id === post.id);
  if (!exists) {
    store.feed.unshift(post);
    persistFeed(store.feed);
    broadcast({ type: 'feed_event', data: { action: 'create', post, posts: store.feed } });
  }
  return store.feed;
}

/**
 * Idempotently sets a single user's like on a post in the local fallback store.
 * Likes are tracked per user (`likedBy`) so one user's action never flips another's state.
 * When `authoritative` is provided (from MongoDB), the stored count mirrors it.
 */
export function setServerPostLike(
  postId: string,
  userId: string,
  liked: boolean,
  authoritative?: { likeCount?: number }
): { likeCount: number; isLiked: boolean; found: boolean } {
  const store = getStore();
  let result = { likeCount: 0, isLiked: liked, found: false };
  store.feed = store.feed.map((p) => {
    if (p.id !== postId) return p;
    const likedBy = new Set<string>(((p as any).likedBy as string[]) || []);
    if (userId) {
      if (liked) likedBy.add(userId);
      else likedBy.delete(userId);
    }
    const likeCount =
      typeof authoritative?.likeCount === 'number' ? authoritative.likeCount : likedBy.size;
    result = { likeCount, isLiked: liked, found: true };
    return {
      ...p,
      likedBy: Array.from(likedBy),
      metrics: { ...p.metrics, likes: likeCount },
    } as Post;
  });
  if (result.found) persistFeed(store.feed);
  return result;
}

/** Back-compat wrapper (legacy global toggle callers). */
export function toggleServerPostLike(postId: string, userId = ''): Post[] {
  const post = getStore().feed.find((p) => p.id === postId);
  const likedBy: string[] = ((post as any)?.likedBy as string[]) || [];
  setServerPostLike(postId, userId, !likedBy.includes(userId));
  return getStore().feed;
}

/** Broadcast a targeted like patch (count + who changed) to every connected client. */
export function broadcastFeedLike(postId: string, userId: string, isLiked: boolean, likeCount: number): void {
  broadcast({ type: 'feed_event', data: { action: 'like', postId, userId, isLiked, likeCount } });
}

/** Broadcast a targeted comment patch to every connected client. */
export function broadcastFeedComment(postId: string, comment: PostComment, commentsCount: number): void {
  broadcast({ type: 'feed_event', data: { action: 'comment', postId, comment, commentsCount } });
}

/**
 * Adds a comment to the local fallback store. Deduped by comment id so retries
 * or duplicate submissions never create a second copy.
 */
export function addServerPostComment(postId: string, comment: PostComment): Post[] {
  const store = getStore();
  store.feed = store.feed.map((p) => {
    if (p.id === postId) {
      const list = p.commentsList || [];
      if (list.some((c) => c.id === comment.id)) return p;
      const nextList = [...list, comment];
      return {
        ...p,
        metrics: {
          ...p.metrics,
          comments: nextList.length,
        },
        commentsList: nextList,
      };
    }
    return p;
  });
  persistFeed(store.feed);
  return store.feed;
}

/** Mirrors the authoritative MongoDB comment list into the local fallback store. */
export function setServerPostComments(postId: string, comments: PostComment[]): void {
  const store = getStore();
  let changed = false;
  store.feed = store.feed.map((p) => {
    if (p.id !== postId) return p;
    changed = true;
    return { ...p, commentsList: comments, metrics: { ...p.metrics, comments: comments.length } };
  });
  if (changed) persistFeed(store.feed);
}

export function deleteServerPost(postId: string): Post[] {
  const store = getStore();
  store.feed = store.feed.filter((p) => p.id !== postId);
  persistFeed(store.feed);
  broadcast({ type: 'feed_event', data: { action: 'delete', postId, posts: store.feed } });
  return store.feed;
}

export function registerSSEListener(listener: SSEListener): () => void {
  const store = getStore();
  store.listeners.add(listener);
  return () => {
    store.listeners.delete(listener);
  };
}
