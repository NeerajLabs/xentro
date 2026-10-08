import { NextRequest, NextResponse } from 'next/server';
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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let backendPosts: any[] = [];
  let backendFetchFailed = false;
  let backendErrorMsg = '';
  try {
    const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';

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
  if (!backendFetchFailed) {
    return NextResponse.json({
      success: true,
      posts: backendPosts,
    });
  }

  const requesterId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
  const localPosts = getServerFeed().map((p) => {
    const { likedBy, ...rest } = p as any;
    const likers: string[] = Array.isArray(likedBy) ? likedBy : [];
    return {
      ...rest,
      // Like state is per requesting user, never a global flag
      isLiked: requesterId ? likers.includes(requesterId) : false,
      metrics: { ...rest.metrics, likes: likers.length || rest.metrics?.likes || 0 },
    };
  });
  return NextResponse.json({
    success: false,
    error: backendErrorMsg,
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
      if (!post || !post.content) {
        return NextResponse.json({ success: false, error: 'Post content required' }, { status: 400 });
      }
      const updated = addServerPost(post);

      const authorId = post.author?.id || userId || 'anon';
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
            content: post.content,
            postType: post.postType,
            tags: post.tags || [],
            mediaUrls: post.media ? [post.media] : [],
          }),
        });
      } catch (err) {
        console.debug('Failed to sync post to backend:', err);
      }

      return NextResponse.json({ success: true, posts: updated });
    }

    if (action === 'like') {
      const postId = body?.postId as string;
      if (!postId) {
        return NextResponse.json({ success: false, error: 'postId required' }, { status: 400 });
      }
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Sign in to like posts' }, { status: 401 });
      }
      // Explicit desired state makes the operation idempotent (retries/double-clicks can't flip it)
      const desired = typeof body?.liked === 'boolean' ? (body.liked as boolean) : undefined;

      // 1. Persist in MongoDB (source of truth)
      let backendResult: any = null;
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        headers['x-user-id'] = userId;

        const res = await fetch(`${BACKEND}/feed/posts/${encodeURIComponent(postId)}/like/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ userId, ...(desired !== undefined ? { liked: desired } : {}) }),
        });
        if (res.ok) {
          const resData = await res.json();
          backendResult = resData?.data;
        }
      } catch (err) {
        console.debug('Failed to call backend like:', err);
      }

      // 2. Mirror into local store (or act as fallback when backend is unavailable)
      let likeCount: number;
      let isLiked: boolean;
      if (backendResult && typeof backendResult.likeCount === 'number') {
        isLiked = Boolean(backendResult.isLiked);
        likeCount = backendResult.likeCount;
        setServerPostLike(postId, userId, isLiked, { likeCount });
      } else {
        const current = getServerFeed().find((p) => p.id === postId) as any;
        const already = Array.isArray(current?.likedBy) && current.likedBy.includes(userId);
        const local = setServerPostLike(postId, userId, desired !== undefined ? desired : !already);
        if (!local.found) {
          return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
        }
        isLiked = local.isLiked;
        likeCount = local.likeCount;
      }

      broadcastFeedLike(postId, userId, isLiked, likeCount);
      return NextResponse.json({ success: true, postId, likeCount, isLiked });
    }

    if (action === 'comment') {
      const postId = body?.postId as string;
      const comment = body?.comment as PostComment;
      if (!postId || !comment || !comment.content || !comment.id) {
        return NextResponse.json({ success: false, error: 'postId and comment required' }, { status: 400 });
      }

      // 1. Persist in MongoDB (idempotent on comment id)
      let backendComments: PostComment[] | null = null;
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (userId) headers['x-user-id'] = userId;
        const res = await fetch(`${BACKEND}/feed/posts/${encodeURIComponent(postId)}/comments/`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ comment }),
        });
        if (res.ok) {
          const resData = await res.json();
          if (Array.isArray(resData?.data?.comments)) {
            backendComments = resData.data.comments.map(mapBackendComment);
          }
        }
      } catch (err) {
        console.debug('Failed to call backend comment:', err);
      }

      // 2. Mirror into local store (or fallback)
      let comments: PostComment[];
      if (backendComments) {
        setServerPostComments(postId, backendComments);
        comments = backendComments;
      } else {
        const updated = addServerPostComment(postId, comment);
        comments = updated.find((p) => p.id === postId)?.commentsList || [comment];
      }
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
      const updated = deleteServerPost(postId);
      return NextResponse.json({ success: true, posts: updated });
    }

    return NextResponse.json({ success: false, error: 'Unsupported feed action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
