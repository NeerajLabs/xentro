import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { broadcast } from '@/lib/serverMessages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId')?.trim();
    const userId = searchParams.get('userId')?.trim();
    const entityId = searchParams.get('entityId')?.trim();

    const db = await getDatabase();
    const messagesCol = db.collection('chat_messages');
    const convsCol = db.collection('conversations');
    const entitiesCol = db.collection('entities');

    // 1. Fetch messages for a specific conversation
    if (conversationId) {
      const messages = await messagesCol
        .find({ conversationId })
        .sort({ createdAt: 1 })
        .limit(200)
        .toArray();

      return NextResponse.json({
        success: true,
        messages: messages.map((m: any) => ({
          id: m.id || String(m._id),
          clientMessageId: m.clientMessageId || m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: m.senderName || 'Member',
          senderAvatar: m.senderAvatar || '/xentro-logo.png',
          senderRole: m.senderRole || 'Member',
          text: m.text || m.content || '',
          content: m.text || m.content || '',
          timestamp: m.timestamp || m.createdAt,
          createdAt: m.createdAt,
          readBy: Array.isArray(m.readBy) ? m.readBy : [m.senderId],
          status: m.status || 'delivered',
        })),
        source: 'mongodb-atlas',
      });
    }

    // 2. Fetch conversations for a user (or entity)
    if (userId || entityId) {
      let targetIds: string[] = [];
      if (userId) {
        targetIds.push(userId);
        targetIds.push(userId.toLowerCase());

        // Fetch owned entities so startup messages are included for the owner
        try {
          const ownedEntities = await entitiesCol
            .find({
              $or: [
                { primaryOwnerId: userId },
                { createdByUserId: userId },
                { 'members.userId': userId },
              ],
              status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
            })
            .project({ id: 1, entityId: 1 })
            .toArray();

          ownedEntities.forEach((ent: any) => {
            if (ent.id) targetIds.push(ent.id);
            if (ent.entityId) targetIds.push(ent.entityId);
          });
        } catch (err) {
          console.warn('[Messages GET] Error fetching owned entities:', err);
        }
      }

      if (entityId) {
        targetIds.push(entityId);
        targetIds.push(entityId.toLowerCase());
      }

      targetIds = Array.from(new Set(targetIds.filter(Boolean)));

      const conversations = await convsCol
        .find({
          participants: { $in: targetIds },
        })
        .sort({ updatedAt: -1 })
        .limit(100)
        .toArray();

      return NextResponse.json({
        success: true,
        conversations: conversations.map((c: any) => ({
          id: c.id || String(c._id),
          participants: c.participants || [],
          users: c.users || {},
          user: c.user || undefined,
          lastMessage: c.lastMessage || '',
          updatedAt: c.updatedAt || c.createdAt,
          createdAt: c.createdAt,
        })),
        source: 'mongodb-atlas',
      });
    }

    // Default: Return recent messages
    const recent = await messagesCol.find().sort({ createdAt: -1 }).limit(50).toArray();
    return NextResponse.json({
      success: true,
      messages: recent,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Messages GET] Error:', err);
    return NextResponse.json(
      { success: false, messages: [], error: err?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || 'send';

    const db = await getDatabase();
    const messagesCol = db.collection('chat_messages');
    const convsCol = db.collection('conversations');

    const nowIso = new Date().toISOString();

    if (action === 'startConversation') {
      const partnerId = body?.partnerId;
      const userId = body?.userId;
      const partner = body?.partner || {};
      const currentUser = body?.currentUser || {};
      const initialMessage = body?.initialMessage;

      if (!partnerId || !userId) {
        return NextResponse.json(
          { success: false, error: 'partnerId and userId are required' },
          { status: 400 }
        );
      }

      const sortedPair = [userId.toLowerCase(), partnerId.toLowerCase()].sort();
      const convId = body?.conversationId || `conv_${sortedPair[0]}_${sortedPair[1]}`;

      const convDoc = {
        id: convId,
        participants: [userId, partnerId],
        users: {
          [userId]: {
            id: userId,
            name: currentUser?.name || 'Member',
            avatar: currentUser?.avatar || '/xentro-logo.png',
            role: currentUser?.role || 'Member',
            company: currentUser?.company || '',
          },
          [partnerId]: {
            id: partnerId,
            name: partner?.name || 'Member',
            avatar: partner?.avatar || '/xentro-logo.png',
            role: partner?.role || 'Member',
            company: partner?.company || '',
          },
        },
        user: {
          id: partnerId,
          name: partner?.name || 'Member',
          avatar: partner?.avatar || '/xentro-logo.png',
          role: partner?.role || 'Member',
          company: partner?.company || '',
        },
        lastMessage: initialMessage || 'Conversation initiated.',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await convsCol.updateOne(
        { id: convId },
        {
          $set: convDoc,
          $setOnInsert: { createdAt: nowIso },
        },
        { upsert: true }
      );

      if (initialMessage) {
        const msgDoc = {
          id: `msg_${Date.now()}`,
          clientMessageId: `msg_${Date.now()}`,
          conversationId: convId,
          senderId: userId,
          senderName: currentUser?.name || 'Member',
          senderAvatar: currentUser?.avatar || '/xentro-logo.png',
          senderRole: currentUser?.role || 'Member',
          text: initialMessage,
          content: initialMessage,
          timestamp: nowIso,
          createdAt: nowIso,
          readBy: [userId],
          status: 'delivered',
        };
        await messagesCol.insertOne(msgDoc);
        broadcast({ type: 'new_message', data: msgDoc });
      }

      return NextResponse.json({
        success: true,
        conversation: convDoc,
      });
    }

    if (action === 'send') {
      const rawMsg = (body?.message || body) as any;
      const conversationId = rawMsg?.conversationId || body?.conversationId;
      const text = rawMsg?.text || rawMsg?.content || '';
      const senderId = rawMsg?.senderId || body?.senderId || 'anonymous';
      const senderName = rawMsg?.senderName || body?.senderName || 'Member';
      const senderAvatar = rawMsg?.senderAvatar || body?.senderAvatar || '/xentro-logo.png';
      const senderRole = rawMsg?.senderRole || body?.senderRole || 'Member';
      const id = rawMsg?.id || rawMsg?.tempId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const clientMessageId = rawMsg?.clientMessageId || id;

      if (!text || !conversationId) {
        return NextResponse.json(
          { success: false, error: 'text and conversationId are required' },
          { status: 400 }
        );
      }

      const msgDoc = {
        id,
        clientMessageId,
        conversationId,
        senderId,
        senderName,
        senderAvatar,
        senderRole,
        text,
        content: text,
        timestamp: rawMsg?.timestamp || nowIso,
        createdAt: nowIso,
        readBy: [senderId],
        status: 'delivered',
      };

      // 1. Insert message into MongoDB Atlas chat_messages
      await messagesCol.updateOne(
        { $or: [{ id }, { clientMessageId }] },
        { $set: msgDoc },
        { upsert: true }
      );

      // 2. Update conversation last message and timestamp in MongoDB Atlas
      await convsCol.updateOne(
        { id: conversationId },
        {
          $set: {
            lastMessage: text,
            updatedAt: nowIso,
          },
          $addToSet: {
            participants: senderId,
          },
        },
        { upsert: true }
      );

      // 3. Broadcast real-time SSE event to all connected browsers
      broadcast({ type: 'new_message', data: msgDoc });

      return NextResponse.json({
        success: true,
        message: msgDoc,
      });
    }

    if (action === 'markRead') {
      const userId = body?.userId as string;
      const conversationId = body?.conversationId as string;

      if (!userId || !conversationId) {
        return NextResponse.json(
          { success: false, error: 'userId and conversationId required' },
          { status: 400 }
        );
      }

      await messagesCol.updateMany(
        { conversationId },
        { $addToSet: { readBy: userId } }
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported action' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[Messages POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
