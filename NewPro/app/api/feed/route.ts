import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import {
  getServerFeed,
  addServerPost,
  setServerPostLike,
  addServerPostComment,
  setServerPostComments,
  broadcastFeedLike,
  broadcastFeedComment,
  deleteServerPost,
} from '@/lib/serverMessages';
import { Post, PostComment } from '@/types';
import { getBackendBaseUrl } from '@/lib/backendUrl';

const BACKEND = getBackendBaseUrl();

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }
  return cachedClient;
}

function mapBackendComment(c: any): PostComment {
  const a = c?.author || {};
  const name = a.name || 'Xentro User';
  return {
    id: c.id,
    author: {
      id: a.id || '',
      name,
      username: a.username || name.toLowerCase().replace(/[^a-z0-9]/g, ''),
      role: a.role || '',
      company: a.company || undefined,
      avatar: a.avatar || '/xentro-logo.png',
      verified: Boolean(a.verified),
    },
    content: c.content || '',
    timestamp: c.createdAt
      ? new Date(c.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
      : c.timestamp || 'Recently',
    likes: c.likes || 0,
    isLiked: false,
  } as PostComment;
}

function extractPostMedia(p: any, authorName: string): Post['media'] {
  if (p.media && p.media.url) {
    return p.media;
  }
  if (Array.isArray(p.mediaUrls) && p.mediaUrls.length > 0) {
    const first = p.mediaUrls[0];
    if (typeof first === 'string' && first.trim()) {
      return {
        type: 'image',
        url: first.trim(),
        alt: `${authorName} post media`,
        caption: p.postType || undefined,
      };
    }
    if (typeof first === 'object' && first?.url) {
      return first;
    }
  }
  if (p.mediaUrl && typeof p.mediaUrl === 'string') {
    return {
      type: 'image',
      url: p.mediaUrl,
      alt: `${authorName} post media`,
      caption: p.postType || undefined,
    };
  }
  return undefined;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let backendPosts: any[] = [];
  let backendFetchFailed = false;
  let backendErrorMsg = '';

  const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';

  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['x-user-id'] = userId;

    const res = await fetch(`${BACKEND}/feed/posts/`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.data?.posts && Array.isArray(data.data.posts)) {
        backendPosts = data.data.posts.map((p: any) => {
          const author = p.author || {};
          const authorName = author.name || p.authorName || 'Ecosystem Member';
          const authorRole = author.role || p.authorRole || 'Member';
          const authorCompany = author.company || p.authorCompany || '';
          const authorAvatar = author.avatar || p.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;
          const roleType = p.authorRoleType || 'startup';
          const media = extractPostMedia(p, authorName);

          return {
            id: p.id,
            author: {
              id: author.id || p.authorId || `usr_${p.id}`,
              name: authorName,
              username: author.username || `@${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              role: authorRole,
              company: authorCompany,
              avatar: authorAvatar,
              verified: true,
            },
            authorRoleType: roleType,
            content: p.content,
            postType: p.postType || 'General Post',
            tags: p.tags || [],
            media,
            timestamp: p.createdAt
              ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recently',
            metrics: {
              likes: p.likesCount || 0,
              comments: Array.isArray(p.commentsList) ? p.commentsList.length : p.commentsCount || 0,
              shares: 0,
            },
            isLiked: Boolean(p.isLiked),
            isSaved: false,
            isFollowing: false,
            commentsList: Array.isArray(p.commentsList) ? p.commentsList.map(mapBackendComment) : [],
          };
        });
      }
    } else {
      backendFetchFailed = true;
      backendErrorMsg = `Backend HTTP ${res.status}`;
    }
  } catch (err: any) {
    backendFetchFailed = true;
    backendErrorMsg = err?.message || 'Backend unreachable';
  }

  // If backend returned real posts, use them directly as the source of truth
  if (!backendFetchFailed && backendPosts.length > 0) {
    return NextResponse.json({
      success: true,
      posts: backendPosts,
    });
  }

  // Resilient Direct MongoDB Atlas Fallback: Query feed_posts collection
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const feedCol = db.collection('feed_posts');
    const likesCol = db.collection('post_likes');

    const dbPosts = await feedCol
      .find({
        is_deleted: { $ne: true },
        deleted: { $ne: true },
        status: { $nin: ['DELETED', 'ARCHIVED'] },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    if (dbPosts && dbPosts.length > 0) {
      const mappedDbPosts = await Promise.all(
        dbPosts.map(async (p: any) => {
          const author = p.author || {};
          const authorName = author.name || p.authorName || 'Ecosystem Member';
          const authorRole = author.role || p.authorRole || 'Member';
          const authorCompany = author.company || p.authorCompany || '';
          const authorAvatar =
            author.avatar || p.authorAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(authorName)}`;
          const roleType = p.authorRoleType || 'startup';
          const media = extractPostMedia(p, authorName);

          const postLikesCount = await likesCol.countDocuments({ postId: p.id });
          let isLiked = false;
          if (userId) {
            const userLike = await likesCol.findOne({ postId: p.id, userId });
            isLiked = Boolean(userLike);
          }

          return {
            id: p.id,
            author: {
              id: author.id || p.authorId || `usr_${p.id}`,
              name: authorName,
              username: author.username || `@${authorName.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              role: authorRole,
              company: authorCompany,
              avatar: authorAvatar,
              verified: true,
            },
            authorRoleType: roleType,
            content: p.content,
            postType: p.postType || 'General Post',
            tags: p.tags || [],
            media,
            timestamp: p.createdAt
              ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : 'Recently',
            metrics: {
              likes: postLikesCount || p.likesCount || 0,
              comments: Array.isArray(p.commentsList) ? p.commentsList.length : p.commentsCount || 0,
              shares: 0,
            },
            isLiked,
            isSaved: false,
            isFollowing: false,
            commentsList: Array.isArray(p.commentsList) ? p.commentsList.map(mapBackendComment) : [],
          };
        })
      );

      return NextResponse.json({
        success: true,
        posts: mappedDbPosts,
        source: 'mongodb-atlas',
      });
    }
  } catch (mongoErr: any) {
    console.warn('[Feed GET] MongoDB fallback error:', mongoErr?.message);
  }

  // If both backend and DB return empty or fail, return server feed store
  const requesterId = userId;
  const localPosts = getServerFeed().map((p) => {
    const { likedBy, ...rest } = p as any;
    const likers: string[] = Array.isArray(likedBy) ? likedBy : [];
    return {
      ...rest,
      isLiked: requesterId ? likers.includes(requesterId) : false,
      metrics: { ...rest.metrics, likes: likers.length || rest.metrics?.likes || 0 },
    };
  });

  return NextResponse.json({
    success: true,
    error: backendErrorMsg || undefined,
    posts: localPosts,
    isFallback: true,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;
    const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const userId = req.headers.get('x-user-id') || body?.userId || '';

    if (action === 'create') {
      const post = body?.post as Post;
      if (!post || (!post.content && !post.media)) {
        return NextResponse.json({ success: false, error: 'Post content or media required' }, { status: 400 });
      }

      const updated = addServerPost(post);
      const authorId = post.author?.id || userId || 'anon';
      const nowIso = new Date().toISOString();

      // 1. Direct MongoDB Atlas Persistence for resilient storage
      try {
        const client = await getMongoClient();
        const db = client.db('xentro_db');
        const feedCol = db.collection('feed_posts');

        const mediaUrls = post.media?.url ? [post.media.url] : [];
        await feedCol.updateOne(
          { id: post.id },
          {
            $set: {
              id: post.id,
              authorId,
              authorName: post.author?.name || 'Ecosystem Member',
              authorRole: post.author?.role || 'Member',
              authorRoleType: post.authorRoleType || 'startup',
              authorCompany: post.author?.company || '',
              authorAvatar: post.author?.avatar || '/xentro-logo.png',
              content: post.content || '',
              postType: post.postType || 'General Post',
              tags: post.tags || [],
              media: post.media || undefined,
              mediaUrls,
              likesCount: 0,
              commentsCount: 0,
              createdAt: nowIso,
              updatedAt: nowIso,
            },
          },
          { upsert: true }
        );
      } catch (dbErr: any) {
        console.warn('[Feed POST] Direct MongoDB Atlas insert warning:', dbErr?.message);
      }

      // 2. Also forward to Django Backend
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      headers['x-user-id'] = authorId;

      try {
        await fetch(`${BACKEND}/feed/posts/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            id: post.id,
            author: post.author,
            authorId: authorId,
            authorRoleType: post.authorRoleType || 'startup',
            content: post.content || '',
            postType: post.postType,
            tags: post.tags || [],
            media: post.media,
            mediaUrls: post.media?.url ? [post.media.url] : [],
          }),
        });
      } catch (err) {
        console.debug('Failed to sync post to backend:', err);
      }

      return NextResponse.json({ success: true, posts: updated, post });
    }

    if (action === 'like') {
      const postId = body?.postId as string;
      if (!postId) {
        return NextResponse.json({ success: false, error: 'postId required' }, { status: 400 });
      }
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Sign in to like posts' }, { status: 401 });
      }
      const desired = typeof body?.liked === 'boolean' ? (body.liked as boolean) : undefined;

      // 1. Persist directly in MongoDB Atlas post_likes collection
      let directLikeCount: number | null = null;
      let directIsLiked: boolean | null = null;
      try {
        const client = await getMongoClient();
        const db = client.db('xentro_db');
        const likesCol = db.collection('post_likes');

        const existing = await likesCol.findOne({ postId, userId });
        const shouldLike = desired !== undefined ? desired : !existing;

        if (shouldLike) {
          await likesCol.updateOne(
            { postId, userId },
            { $set: { postId, userId, createdAt: new Date().toISOString() } },
            { upsert: true }
          );
        } else {
          await likesCol.deleteOne({ postId, userId });
        }

        directLikeCount = await likesCol.countDocuments({ postId });
        directIsLiked = shouldLike;
      } catch (dbErr: any) {
        console.warn('[Feed Like] Direct MongoDB Atlas update warning:', dbErr?.message);
      }

      // 2. Also forward to backend
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['x-user-id'] = userId;

        await fetch(`${BACKEND}/feed/posts/${encodeURIComponent(postId)}/like/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId, ...(desired !== undefined ? { liked: desired } : {}) }),
        });
      } catch (err) {
        console.debug('Failed to call backend like:', err);
      }

      const likeCount = directLikeCount ?? 0;
      const isLiked = directIsLiked ?? Boolean(desired);

      setServerPostLike(postId, userId, isLiked, { likeCount });
      broadcastFeedLike(postId, userId, isLiked, likeCount);
      return NextResponse.json({ success: true, postId, likeCount, isLiked });
    }

    if (action === 'comment') {
      const postId = body?.postId as string;
      const comment = body?.comment as PostComment;
      if (!postId || !comment || !comment.content || !comment.id) {
        return NextResponse.json({ success: false, error: 'postId and comment required' }, { status: 400 });
      }

      // 1. Direct MongoDB Atlas persistence
      try {
        const client = await getMongoClient();
        const db = client.db('xentro_db');
        const commentsCol = db.collection('post_comments');

        await commentsCol.updateOne(
          { id: comment.id },
          {
            $set: {
              id: comment.id,
              postId,
              author: comment.author,
              content: comment.content,
              timestamp: comment.timestamp || 'Recently',
              likes: comment.likes || 0,
              createdAt: new Date().toISOString(),
            },
          },
          { upsert: true }
        );
      } catch (dbErr: any) {
        console.warn('[Feed Comment] Direct MongoDB Atlas update warning:', dbErr?.message);
      }

      // 2. Also forward to backend
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) headers['x-user-id'] = userId;
        await fetch(`${BACKEND}/feed/posts/${encodeURIComponent(postId)}/comments/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ comment }),
        });
      } catch (err) {
        console.debug('Failed to call backend comment:', err);
      }

      const updated = addServerPostComment(postId, comment);
      const comments = updated.find((p) => p.id === postId)?.commentsList || [comment];
      const saved = comments.find((c) => c.id === comment.id) || comment;

      broadcastFeedComment(postId, saved, comments.length);
      return NextResponse.json({
        success: true,
        postId,
        comment: saved,
        comments,
        commentsCount: comments.length,
      });
    }

    if (action === 'delete') {
      const postId = body?.postId as string;
      if (!postId) {
        return NextResponse.json({ success: false, error: 'postId required' }, { status: 400 });
      }
      try {
        const client = await getMongoClient();
        const db = client.db('xentro_db');
        await db.collection('feed_posts').updateOne(
          { id: postId },
          { $set: { is_deleted: true, deleted: true, status: 'DELETED' } }
        );
      } catch (_) {}

      const updated = deleteServerPost(postId);
      return NextResponse.json({ success: true, posts: updated });
    }

    return NextResponse.json({ success: false, error: 'Unsupported feed action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
