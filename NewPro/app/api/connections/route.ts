import { NextRequest, NextResponse } from 'next/server';
import {
  broadcast,
  addOrUpdateServerConnection,
  getServerConnections,
  ServerConnectionRecord,
} from '@/lib/serverMessages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    let backendUrl = `${BACKEND_BASE}/connections/`;
    const params = new URLSearchParams();
    if (userId) params.set('userId', userId);
    if (status) params.set('status', status);
    if (params.toString()) {
      backendUrl += `?${params.toString()}`;
    }

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'X-User-Id': userId } : {}),
      },
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.success && data?.data) {
        return NextResponse.json({
          success: true,
          connections: data.data.connections || [],
          connectedPartners: data.data.connectedPartners || [],
          metrics: data.data.metrics || {},
        });
      }
    }

    // Fallback to in-memory store if backend is unreachable
    return NextResponse.json({
      success: true,
      connections: getServerConnections(),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      connections: getServerConnections(),
      error: err?.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;
    const connection = body?.connection as ServerConnectionRecord;
    const partnerId = body?.partnerId || connection?.recipientId;
    const userId = body?.userId || connection?.senderId;

    if (!connection && !partnerId) {
      return NextResponse.json({ success: false, error: 'Invalid connection payload' }, { status: 400 });
    }

    let backendRes: Response | null = null;

    if (action === 'request') {
      backendRes = await fetch(`${BACKEND_BASE}/connections/request/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: connection?.senderId || userId,
          senderName: connection?.senderName,
          senderRole: connection?.senderRole,
          senderAvatar: connection?.senderAvatar,
          recipientId: connection?.recipientId || partnerId,
          recipientName: connection?.recipientName,
          recipientRole: connection?.recipientRole,
          recipientAvatar: connection?.recipientAvatar,
          note: body?.note || '',
        }),
      });
    } else if (action === 'accept') {
      backendRes = await fetch(`${BACKEND_BASE}/connections/accept/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-Id': userId } : {}),
        },
        body: JSON.stringify({
          connectionId: connection?.id || body?.connectionId,
          partnerId: partnerId,
          userId: userId,
        }),
      });
    } else if (action === 'decline') {
      backendRes = await fetch(`${BACKEND_BASE}/connections/decline/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-Id': userId } : {}),
        },
        body: JSON.stringify({
          connectionId: connection?.id || body?.connectionId,
          partnerId: partnerId,
          userId: userId,
        }),
      });
    }

    let resultConnection = connection;
    if (backendRes && backendRes.ok) {
      const data = await backendRes.json();
      if (data?.success && data?.data?.connection) {
        resultConnection = data.data.connection;
      }
    } else if (backendRes && !backendRes.ok) {
      const errData = await backendRes.json().catch(() => null);
      console.warn('[Connections API Backend Error]:', errData);
    }

    // Keep memory store and SSE stream synchronized
    if (resultConnection) {
      if (action === 'accept') resultConnection.status = 'accepted';
      if (action === 'decline') resultConnection.status = 'declined';
      if (action === 'request') resultConnection.status = 'pending';
      addOrUpdateServerConnection(resultConnection);
      broadcast({ type: 'connection_event', data: resultConnection });
    }

    return NextResponse.json({
      success: true,
      connection: resultConnection,
      connections: getServerConnections(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
