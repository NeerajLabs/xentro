import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getBackendBaseUrl } from '@/lib/backendUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId')?.trim();
    const currentUserId = searchParams.get('currentUserId')?.trim() || '';

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Target userId is required.' }, { status: 400 });
    }

    const db = await getDatabase();
    const followsCol = db.collection('follows');

    const [followersCount, followingCount, existingFollow] = await Promise.all([
      followsCol.countDocuments({ followingId: { $in: [userId, userId.toLowerCase(), userId.toUpperCase()] } }),
      followsCol.countDocuments({ followerId: { $in: [userId, userId.toLowerCase(), userId.toUpperCase()] } }),
      currentUserId
        ? followsCol.findOne({
            followerId: { $in: [currentUserId, currentUserId.toLowerCase(), currentUserId.toUpperCase()] },
            followingId: { $in: [userId, userId.toLowerCase(), userId.toUpperCase()] },
          })
        : null,
    ]);

    return NextResponse.json({
      success: true,
      targetUserId: userId,
      followersCount,
      followingCount,
      isFollowing: Boolean(existingFollow),
      followers: [],
      following: [],
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Follows GET] Error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message,
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      followers: [],
      following: [],
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUserId = (body.targetUserId || body.userId || '').trim();
    const currentUserId = (body.currentUserId || body.followerId || '').trim();

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'targetUserId is required' }, { status: 400 });
    }
    if (!currentUserId) {
      return NextResponse.json({ success: false, error: 'currentUserId is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const followsCol = db.collection('follows');
    const notifsCol = db.collection('notifications');
    const usersCol = db.collection('users');

    const nowIso = new Date().toISOString();

    const existing = await followsCol.findOne({
      followerId: { $in: [currentUserId, currentUserId.toLowerCase(), currentUserId.toUpperCase()] },
      followingId: { $in: [targetUserId, targetUserId.toLowerCase(), targetUserId.toUpperCase()] },
    });

    let isFollowing = false;
    let message = '';

    if (existing) {
      await followsCol.deleteMany({
        followerId: { $in: [currentUserId, currentUserId.toLowerCase(), currentUserId.toUpperCase()] },
        followingId: { $in: [targetUserId, targetUserId.toLowerCase(), targetUserId.toUpperCase()] },
      });
      isFollowing = false;
      message = 'Unfollowed successfully';
    } else {
      await followsCol.insertOne({
        id: `follow_${currentUserId}_${targetUserId}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
        followerId: currentUserId,
        followingId: targetUserId,
        createdAt: nowIso,
      });
      isFollowing = true;
      message = 'Followed successfully';

      // Send durable notification to target
      try {
        const followerDoc = await usersCol.findOne({
          $or: [
            { id: currentUserId },
            { id: currentUserId.toLowerCase() },
            { id: currentUserId.toUpperCase() },
          ],
        });
        const followerName = followerDoc?.fullName || followerDoc?.name || currentUserId;
        const followerAvatar = followerDoc?.avatar || '/xentro-logo.png';

        await notifsCol.insertOne({
          id: `notif_follow_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          userId: targetUserId,
          category: 'ecosystem',
          title: 'New Follower',
          description: `${followerName} started following your profile and updates.`,
          time: 'Just now',
          avatar: followerAvatar,
          actorName: followerName,
          actorId: currentUserId,
          actionRequired: false,
          targetTab: 'profile',
          createdAt: nowIso,
        });
      } catch (notifErr) {
        console.warn('[Follows POST] Notification warning:', notifErr);
      }
    }

    const [followersCount, followingCount] = await Promise.all([
      followsCol.countDocuments({ followingId: { $in: [targetUserId, targetUserId.toLowerCase(), targetUserId.toUpperCase()] } }),
      followsCol.countDocuments({ followerId: { $in: [currentUserId, currentUserId.toLowerCase(), currentUserId.toUpperCase()] } }),
    ]);

    return NextResponse.json({
      success: true,
      following: isFollowing,
      followersCount,
      followingCount,
      targetUserId,
      message,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Follows POST] Error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message,
    }, { status: 500 });
  }
}
