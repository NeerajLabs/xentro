import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const currentUserId = searchParams.get('currentUserId') || '';

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Target userId is required.' }, { status: 400 });
    }

    const backendUrl = `${BACKEND_BASE}/users/${encodeURIComponent(userId)}/followers/${currentUserId ? `?userId=${encodeURIComponent(currentUserId)}` : ''}`;

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUserId ? { 'X-User-Id': currentUserId } : {}),
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data) {
        return NextResponse.json({
          success: true,
          ...data.data,
        });
      }
    }

    return NextResponse.json({
      success: true,
      targetUserId: userId,
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      followers: [],
      following: [],
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message,
      followersCount: 0,
      followingCount: 0,
      isFollowing: false,
      followers: [],
      following: [],
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUserId = body.targetUserId || body.userId;
    const currentUserId = body.currentUserId || body.followerId;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'targetUserId is required' }, { status: 400 });
    }

    const backendUrl = `${BACKEND_BASE}/users/${encodeURIComponent(targetUserId)}/follow/`;

    const res = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(currentUserId ? { 'X-User-Id': currentUserId } : {}),
      },
      body: JSON.stringify({
        userId: currentUserId,
        followerId: currentUserId,
      }),
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data) {
        return NextResponse.json({
          success: true,
          ...data.data,
        });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Backend follow toggle failed',
    }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err?.message,
    }, { status: 500 });
  }
}
