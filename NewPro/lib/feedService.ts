import { Post, PostComment, User } from '@/types';

const FEED_STORAGE_KEY = 'xentro_universal_feed_posts';
export const FEED_UPDATED_EVENT = 'xentro-feed-updated';

export interface CreatePostInput {
  content: string;
  author: User;
  authorRoleType?: 'startup' | 'investor' | 'mentor' | 'esp' | 'student' | 'explorer';
  category?: 'all' | 'following' | 'opportunities' | 'mentors' | 'investors' | 'startup' | 'esp' | string;
  postType?: string;
  tags?: string[];
  media?: {
    type: 'image' | 'video' | 'banner';
    url: string;
    alt: string;
    caption?: string;
    aspectRatio?: string;
  };
}

// Cross-tab broadcast channel for instant intra-browser tab synchronization
let feedChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    feedChannel = new BroadcastChannel('xentro_feed_channel');
    feedChannel.onmessage = (event) => {
      if (event.data?.type === 'FEED_UPDATED') {
        window.dispatchEvent(new CustomEvent(FEED_UPDATED_EVENT));
      }
    };
  } catch (e) {
    console.debug('[Feed] BroadcastChannel unavailable', e);
  }
}

// Fetch initial feed from server
export function fetchInitialServerFeed() {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem('xentro_current_user');
    let userId = '';
    if (raw) {
      const parsed = JSON.parse(raw);
      userId = parsed?.id || '';
    }
    const query = userId ? `?userId=${encodeURIComponent(userId)}` : '';
    fetch(`/api/feed${query}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.posts)) {
          if (data.posts.length === 0) {
            feedService.savePosts([]);
          } else {
            feedService.applyRemotePosts(data.posts);
          }
        }
      })
      .catch(() => {});
  } catch (_) {}
}

function getCurrentUserId(): string {
  if (typeof window === 'undefined') return '';
  try {
    const raw = localStorage.getItem('xentro_current_user');
    if (raw) return JSON.parse(raw)?.id || '';
  } catch (_) {}
  return '';
}

// ---- In-flight tracking (prevents stale/duplicate updates) ----
// Latest like request sequence per post; responses from older requests are ignored.
const likeSeq = new Map<string, number>();
// Per-post promise chain so like requests reach the server in click order.
const likeChain = new Map<string, Promise<unknown>>();
// Comment ids that are optimistic and not yet confirmed by the server.
const pendingCommentIds = new Set<string>();

function mergeComments(serverList: PostComment[] = [], localList: PostComment[] = []): PostComment[] {
  const seen = new Set<string>();
  const merged: PostComment[] = [];
  serverList.forEach((c) => {
    if (c?.id && !seen.has(c.id)) {
      seen.add(c.id);
      merged.push(c);
    }
  });
  // Keep optimistic comments that the server has not acknowledged yet
  localList.forEach((c) => {
    if (c?.id && !seen.has(c.id) && pendingCommentIds.has(c.id)) {
      seen.add(c.id);
      merged.push(c);
    }
  });
  return merged;
}

// Setup storage and SSE event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === FEED_STORAGE_KEY) {
      window.dispatchEvent(new CustomEvent(FEED_UPDATED_EVENT));
    }
  });

  window.addEventListener('xentro-feed-event', (e: Event) => {
    const detail = (e as CustomEvent).detail || {};
    if (detail.action === 'like' && detail.postId) {
      feedService.applyRemoteLike(detail.postId, detail.likeCount, detail.userId, detail.isLiked);
    } else if (detail.action === 'comment' && detail.postId && detail.comment) {
      feedService.applyRemoteComment(detail.postId, detail.comment);
    } else if (detail.action === 'create' && detail.post) {
      feedService.applyIncomingPost(detail.post);
    } else if (detail.action === 'delete' && detail.postId) {
      const current = feedService.getPosts();
      if (current.some((p) => p.id === detail.postId)) {
        feedService.savePosts(current.filter((p) => p.id !== detail.postId));
      }
    } else if (Array.isArray(detail.posts)) {
      feedService.applyRemotePosts(detail.posts);
    }
  });

  fetchInitialServerFeed();

  // Re-sync with the database when the tab regains focus and periodically while visible,
  // so every user converges on the persisted like/comment state.
  const resync = () => {
    if (document.visibilityState === 'visible') fetchInitialServerFeed();
  };
  window.addEventListener('focus', resync);
  document.addEventListener('visibilitychange', resync);
  setInterval(resync, 15000);
}

export const feedService = {
  getPosts(): Post[] {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = localStorage.getItem(FEED_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  },

  savePosts(posts: Post[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(posts));
      window.dispatchEvent(new CustomEvent(FEED_UPDATED_EVENT));
      if (feedChannel) {
        feedChannel.postMessage({ type: 'FEED_UPDATED' });
      }
    } catch (e) {
      console.error('Error saving feed posts:', e);
    }
  },

  applyIncomingPost(post: Post): void {
    const current = this.getPosts();
    const exists = current.some((p) => p.id === post.id);
    if (!exists) {
      this.savePosts([post, ...current]);
    }
  },

  applyRemotePosts(posts: Post[]): void {
    if (!Array.isArray(posts)) return;
    const current = this.getPosts();
    const currentMap = new Map<string, Post>(current.map((p) => [p.id, p]));
    const map = new Map<string, Post>();

    posts.forEach((p) => {
      const local = currentMap.get(p.id);
      let merged: Post = p;
      if (local) {
        // Don't let a refresh overwrite a like that is still in flight for this user
        if (likeChain.has(p.id)) {
          merged = {
            ...merged,
            isLiked: local.isLiked,
            metrics: { ...merged.metrics, likes: local.metrics.likes },
          };
        }
        const comments = mergeComments(p.commentsList || [], local.commentsList || []);
        merged = {
          ...merged,
          commentsList: comments,
          metrics: { ...merged.metrics, comments: Math.max(comments.length, merged.metrics?.comments || 0) },
        };
      }
      map.set(p.id, merged);
    });

    // Preserve only recently created optimistic in-flight posts (within 15 seconds)
    const now = Date.now();
    current.forEach((p) => {
      if (!map.has(p.id) && p.id.startsWith('post_')) {
        const timestampPart = parseInt(p.id.split('_')[1] || '0', 10);
        if (timestampPart && now - timestampPart < 15000) {
          map.set(p.id, p);
        }
      }
    });

    this.savePosts(Array.from(map.values()));
  },

  /** Live patch from another user/tab: update the count; only touch isLiked if it was me. */
  applyRemoteLike(postId: string, likeCount: number, userId?: string, isLiked?: boolean): void {
    if (typeof likeCount !== 'number') return;
    if (likeChain.has(postId)) return; // our own request is in flight; its response wins
    const me = getCurrentUserId();
    const current = this.getPosts();
    let changed = false;
    const updated = current.map((p) => {
      if (p.id !== postId) return p;
      const nextLiked = userId && me && userId === me && typeof isLiked === 'boolean' ? isLiked : p.isLiked;
      if (p.metrics.likes === likeCount && p.isLiked === nextLiked) return p;
      changed = true;
      return { ...p, isLiked: nextLiked, metrics: { ...p.metrics, likes: likeCount } };
    });
    if (changed) this.savePosts(updated);
  },

  /** Live patch from another user/tab: append comment if not already present. */
  applyRemoteComment(postId: string, comment: PostComment): void {
    if (!comment?.id) return;
    pendingCommentIds.delete(comment.id);
    const current = this.getPosts();
    let changed = false;
    const updated = current.map((p) => {
      if (p.id !== postId) return p;
      const list = p.commentsList || [];
      if (list.some((c) => c.id === comment.id)) return p;
      changed = true;
      const nextList = [...list, comment];
      return { ...p, commentsList: nextList, metrics: { ...p.metrics, comments: nextList.length } };
    });
    if (changed) this.savePosts(updated);
  },

  createPost(input: CreatePostInput): Post {
    const currentPosts = this.getPosts();

    const newPost: Post = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      author: input.author,
      authorRoleType: input.authorRoleType || 'startup',
      timestamp: 'Just now',
      category: input.category || 'all',
      postType: input.postType || 'General Post',
      content: input.content.trim(),
      tags: input.tags && input.tags.length > 0 ? input.tags : undefined,
      media: input.media?.url ? input.media : undefined,
      metrics: {
        likes: 0,
        comments: 0,
        shares: 0,
      },
      isLiked: false,
      isSaved: false,
      isFollowing: false,
      commentsList: [],
    };

    const updated = [newPost, ...currentPosts];
    this.savePosts(updated);

    // Broadcast to Server API -> pushes SSE to all other laptops
    if (typeof window !== 'undefined') {
      fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', post: newPost, userId: getCurrentUserId() }),
      }).catch((err) => console.debug('[Feed API] Create post error:', err));
    }

    return newPost;
  },

  toggleLike(postId: string): Post[] {
    const current = this.getPosts();
    const target = current.find((p) => p.id === postId);
    if (!target) return current;
    const nextLiked = !target.isLiked;

    // 1. Optimistic update — UI responds immediately
    const updated = current.map((post) =>
      post.id === postId
        ? {
            ...post,
            isLiked: nextLiked,
            metrics: {
              ...post.metrics,
              likes: Math.max(0, post.metrics.likes + (nextLiked ? 1 : -1)),
            },
          }
        : post
    );
    this.savePosts(updated);

    if (typeof window === 'undefined') return updated;

    // 2. Persist with an explicit desired state, serialized per post
    const seq = (likeSeq.get(postId) || 0) + 1;
    likeSeq.set(postId, seq);
    const userId = getCurrentUserId();
    const previous = likeChain.get(postId) || Promise.resolve();

    const request = previous
      .catch(() => {})
      .then(() =>
        fetch('/api/feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(userId ? { 'x-user-id': userId } : {}) },
          body: JSON.stringify({ action: 'like', postId, userId, liked: nextLiked }),
        })
      )
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        // Ignore responses superseded by a newer click on the same post
        if (likeSeq.get(postId) !== seq) return;
        if (data && typeof data.likeCount === 'number') {
          const posts = this.getPosts().map((p) =>
            p.id === postId
              ? {
                  ...p,
                  isLiked: typeof data.isLiked === 'boolean' ? data.isLiked : p.isLiked,
                  metrics: { ...p.metrics, likes: data.likeCount },
                }
              : p
          );
          this.savePosts(posts);
        }
      })
      .catch(() => {
        // Roll back the optimistic change if the latest request failed
        if (likeSeq.get(postId) !== seq) return;
        const posts = this.getPosts().map((p) =>
          p.id === postId
            ? {
                ...p,
                isLiked: target.isLiked,
                metrics: { ...p.metrics, likes: target.metrics.likes },
              }
            : p
        );
        this.savePosts(posts);
      })
      .finally(() => {
        if (likeChain.get(postId) === request) likeChain.delete(postId);
      });

    likeChain.set(postId, request);
    return updated;
  },

  addComment(postId: string, comment: PostComment): Post[] {
    const current = this.getPosts();
    const updated = current.map((post) => {
      if (post.id === postId) {
        const list = post.commentsList || [];
        if (list.some((c) => c.id === comment.id)) return post; // duplicate submit
        const nextList = [...list, comment];
        return {
          ...post,
          metrics: {
            ...post.metrics,
            comments: nextList.length,
          },
          commentsList: nextList,
        };
      }
      return post;
    });
    pendingCommentIds.add(comment.id);
    this.savePosts(updated);

    if (typeof window !== 'undefined') {
      const userId = getCurrentUserId();
      fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(userId ? { 'x-user-id': userId } : {}) },
        body: JSON.stringify({ action: 'comment', postId, comment, userId }),
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.success && Array.isArray(data.comments)) {
            pendingCommentIds.delete(comment.id);
            const posts = this.getPosts().map((p) => {
              if (p.id !== postId) return p;
              const merged = mergeComments(data.comments, p.commentsList || []);
              return { ...p, commentsList: merged, metrics: { ...p.metrics, comments: merged.length } };
            });
            this.savePosts(posts);
          }
        })
        .catch(() => {});
    }

    return updated;
  },

  deletePost(postId: string): Post[] {
    const current = this.getPosts();
    const updated = current.filter((post) => post.id !== postId);
    this.savePosts(updated);

    if (typeof window !== 'undefined') {
      fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', postId }),
      }).catch(() => {});
    }

    return updated;
  },
};
