import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const res = await fetch(`${BACKEND_BASE}/notifications/?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        success: true,
        notifications: data?.data?.notifications || [],
        unreadCount: data?.data?.unreadCount || 0,
      });
    }

    return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message, notifications: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || 'markRead';
    const userId = body?.userId;
    const notificationId = body?.notificationId;

    if (action === 'markRead' && notificationId) {
      const res = await fetch(`${BACKEND_BASE}/notifications/${encodeURIComponent(notificationId)}/read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-Id': userId } : {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === 'markAllRead' && userId) {
      const res = await fetch(`${BACKEND_BASE}/notifications/mark-all-read/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    if (action === 'clear' && userId) {
      const res = await fetch(`${BACKEND_BASE}/notifications/clear/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': userId,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json({ success: res.ok, data });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
