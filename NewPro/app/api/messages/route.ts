import { NextRequest, NextResponse } from 'next/server';
import {
  getServerMessages,
  addServerMessage,
  markServerMessagesRead,
  broadcast,
  SharedChatMessage,
} from '@/lib/serverMessages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_BASE = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api/v1';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');
    const userId = searchParams.get('userId');

    if (conversationId) {
      try {
        const res = await fetch(`${BACKEND_BASE}/messages/conversations/${conversationId}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'X-User-Id': userId } : {}),
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          return NextResponse.json({
            success: true,
            messages: data?.data?.messages || [],
          });
        }
      } catch (err) {
        console.debug('[Messages Route] Backend fetch conversation error, using local store:', err);
      }

      // Filter server messages by requested conversationId
      const convNorm = conversationId.toLowerCase().trim();
      const localFiltered = getServerMessages().filter(
        (m) => (m.conversationId || '').toLowerCase().trim() === convNorm
      );
      return NextResponse.json({
        success: true,
        messages: localFiltered,
      });
    } else if (userId) {
      try {
        const res = await fetch(`${BACKEND_BASE}/messages/conversations/?userId=${userId}`, {
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
            conversations: data?.data?.conversations || [],
          });
        }
      } catch (err) {
        console.debug('[Messages Route] Backend fetch conversations error:', err);
      }
      return NextResponse.json({
        success: true,
        conversations: [],
      });
    }

    return NextResponse.json({
      success: true,
      messages: getServerMessages(),
    });
  } catch (err: any) {
    return NextResponse.json({
      success: true,
      messages: getServerMessages(),
      error: err?.message,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || 'send';

    if (action === 'startConversation') {
      const partnerId = body?.partnerId;
      const userId = body?.userId;
      const initialMessage = body?.initialMessage;

      const res = await fetch(`${BACKEND_BASE}/messages/conversations/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(userId ? { 'X-User-Id': userId } : {}),
        },
        body: JSON.stringify({ partnerId, userId, initialMessage }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return NextResponse.json(
          { success: false, error: data?.message || 'Could not start conversation' },
          { status: res.status }
        );
      }
      return NextResponse.json({ success: true, conversation: data?.data?.conversation });
    }

    if (action === 'send') {
      const rawMsg = (body?.message || body) as any;
      const conversationId = rawMsg?.conversationId || body?.conversationId;
      const text = rawMsg?.text || rawMsg?.content || '';
      const senderId = rawMsg?.senderId || body?.senderId || 'anonymous';
      const senderName = rawMsg?.senderName || body?.senderName || 'Member';
      const id = rawMsg?.id || rawMsg?.tempId || `msg_${Date.now()}`;

      if (!text) {
        return NextResponse.json({ success: false, error: 'Invalid message payload: missing text' }, { status: 400 });
      }

      const message: SharedChatMessage = {
        id,
        conversationId: conversationId || 'conv_general',
        senderId,
        senderName,
        text,
        timestamp: rawMsg?.timestamp || new Date().toISOString(),
        readBy: rawMsg?.readBy || [senderId],
        status: 'delivered',
        senderAvatar: rawMsg?.senderAvatar || '/xentro-logo.png',
        senderRole: rawMsg?.senderRole || 'Member',
      };

      // Verify and persist via Django MongoDB backend
      let serverSavedMessage: any = null;
      if (conversationId) {
        try {
          const res = await fetch(`${BACKEND_BASE}/messages/conversations/${conversationId}/send/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(senderId ? { 'X-User-Id': senderId } : {}),
            },
            body: JSON.stringify({
              id: message.id,
              clientMessageId: message.id,
              content: message.text,
              text: message.text,
              type: 'TEXT',
              senderName: message.senderName,
              userId: senderId,
              senderId: senderId,
              conversationId: conversationId,
            }),
          });

          if (res.ok) {
            const resData = await res.json().catch(() => ({}));
            if (resData?.data?.message) {
              serverSavedMessage = resData.data.message;
            }
          }
        } catch (err) {
          console.debug('[Messages Route] Backend send error, using fallback:', err);
        }
      }

      const updated = addServerMessage(serverSavedMessage || message);
      return NextResponse.json({
        success: true,
        message: serverSavedMessage || message,
        messages: updated,
      });
    }

    if (action === 'markRead') {
      const userId = body?.userId as string;
      const conversationId = body?.conversationId as string | undefined;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
      }

      // Forward to Django MongoDB backend
      try {
        const markUrl = conversationId
          ? `${BACKEND_BASE}/messages/conversations/${conversationId}/read/`
          : `${BACKEND_BASE}/messages/read/`;
        fetch(markUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': userId,
          },
          body: JSON.stringify({ userId, conversationId }),
        }).catch(() => {});
      } catch (err) {
        console.debug('[Messages Route] Backend markRead error:', err);
      }

      const updated = markServerMessagesRead(userId, conversationId);
      return NextResponse.json({ success: true, messages: updated });
    }

    if (action === 'clear') {
      const { clearServerMessages } = await import('@/lib/serverMessages');
      const updated = clearServerMessages();
      return NextResponse.json({ success: true, messages: updated });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Server error' }, { status: 500 });
  }
}
