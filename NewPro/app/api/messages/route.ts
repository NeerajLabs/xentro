import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { broadcast } from '@/lib/serverMessages';
import { requireServerAuth, verifyCallerEntityAccess } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function formatIdToName(id: string): string {
  if (!id) return 'User';
  let clean = id
    .replace(/^(usr_|ent_|conn_|msg_|user_|acc_)/i, '')
    .replace(/_[a-f0-9]{6,}$/i, '')
    .replace(/_[0-9]{10,}$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();
  if (!clean || clean.toLowerCase() === 'member' || clean.toLowerCase() === 'partner') {
    return 'User';
  }
  return clean
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

async function resolveParticipantProfile(pId: string, db: any, convId?: string) {
  if (!pId) return { id: 'usr_unknown', name: 'User', role: 'Explorer', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=User', company: '' };

  const pNorm = pId.toLowerCase();

  // 1. Try Users collection
  try {
    const uDoc = await db.collection('users').findOne({
      $or: [
        { id: pId },
        { id: pNorm },
        { userId: pId },
        { userId: pNorm },
        { altIds: pId },
        { altIds: pNorm },
        { email: pNorm },
      ],
    });
    if (uDoc) {
      const name = uDoc.fullName || uDoc.name || uDoc.displayName || formatIdToName(pId);
      const role = uDoc.role || uDoc.accountType || uDoc.userType || (Array.isArray(uDoc.activeRoles) ? uDoc.activeRoles[0] : null) || 'Explorer';
      const avatar = (uDoc.avatar && !uDoc.avatar.includes('xentro-logo.png') && uDoc.avatar !== '/xentro-logo.png')
        ? uDoc.avatar
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      const company = uDoc.organization || uDoc.company || uDoc.entityName || '';
      return { id: pId, name, role, avatar, company };
    }
  } catch (e) {
    // continue
  }

  // 2. Try Entities collection
  try {
    const eDoc = await db.collection('entities').findOne({
      $or: [
        { id: pId },
        { id: pNorm },
        { entityId: pId },
        { entityId: pNorm },
      ],
      status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
    });
    if (eDoc) {
      const name = eDoc.name || formatIdToName(pId);
      const role = eDoc.entityType || 'Startup';
      const avatar = (eDoc.logo && !eDoc.logo.includes('xentro-logo.png') && eDoc.logo !== '/xentro-logo.png')
        ? eDoc.logo
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      return { id: pId, name, role, avatar, company: eDoc.name || '' };
    }
  } catch (e) {
    // continue
  }

  // 3. Try Connections collection
  try {
    const connDoc = await db.collection('connections').findOne({
      $or: [
        { senderId: pId },
        { senderId: pNorm },
        { recipientId: pId },
        { recipientId: pNorm },
      ],
    });
    if (connDoc) {
      const isSender = (connDoc.senderId?.toLowerCase() === pNorm);
      const cName = isSender ? connDoc.senderName : connDoc.recipientName;
      const cRole = isSender ? connDoc.senderRole : connDoc.recipientRole;
      const cAvatar = isSender ? connDoc.senderAvatar : connDoc.recipientAvatar;
      if (cName && cName !== 'Member' && cName !== 'Partner' && cName !== 'Sender') {
        const name = cName;
        const role = (cRole && cRole !== 'Member') ? cRole : 'Explorer';
        const avatar = (cAvatar && !cAvatar.includes('xentro-logo.png') && cAvatar !== '/xentro-logo.png')
          ? cAvatar
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        return { id: pId, name, role, avatar, company: '' };
      }
    }
  } catch (e) {
    // continue
  }

  // 4. Try Messages collection for a past non-Member senderName
  try {
    const mSample = await db.collection('chat_messages').findOne({
      senderId: { $in: [pId, pNorm] },
      senderName: { $nin: ['Member', 'Partner', 'Sender', 'anonymous', '', null] },
    });
    if (mSample && mSample.senderName) {
      const name = mSample.senderName;
      const role = mSample.senderRole || 'Explorer';
      const avatar = (mSample.senderAvatar && !mSample.senderAvatar.includes('xentro-logo.png') && mSample.senderAvatar !== '/xentro-logo.png' && !mSample.senderAvatar.startsWith('blob:'))
        ? mSample.senderAvatar
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      return { id: pId, name, role, avatar, company: '' };
    }
  } catch (e) {
    // continue
  }

  // 5. Try System connection welcome message in this thread
  if (convId) {
    try {
      const sysMsg = await db.collection('chat_messages').findOne({
        conversationId: convId,
        text: { $regex: /Connection established! You and (.+?) are now connected/i },
      });
      if (sysMsg) {
        const match = sysMsg.text.match(/You and (.+?) are now connected/i);
        if (match && match[1] && match[1].trim() && match[1].trim() !== 'your connection') {
          const name = match[1].trim();
          return {
            id: pId,
            name,
            role: 'Explorer',
            avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
            company: '',
          };
        }
      }
    } catch (e) {
      // continue
    }
  }

  // 6. Clean fallback from ID (never 'Member')
  const fallbackName = formatIdToName(pId);
  return {
    id: pId,
    name: fallbackName,
    role: 'Explorer',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fallbackName)}`,
    company: '',
  };
}

export async function GET(req: NextRequest) {
  try {
    const caller = await requireServerAuth(req);
    if (!caller.authenticated || !caller.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId')?.trim();
    const requestedUserId = searchParams.get('userId')?.trim();
    const requestedEntityId = searchParams.get('entityId')?.trim();

    const db = await getDatabase();
    const chatMessagesCol = db.collection('chat_messages');
    const messagesCol = db.collection('messages');
    const convsCol = db.collection('conversations');
    const entitiesCol = db.collection('entities');

    const callerUserId = caller.user.id || caller.user.userId || '';
    const callerEmail = caller.user.email || '';
    const callerNormSet = new Set<string>([
      callerUserId.toLowerCase(),
      callerEmail.toLowerCase(),
    ].filter(Boolean));

    // Resolve entities owned or membered by caller
    let callerEntityIds: string[] = [];
    try {
      const ownedEntities = await entitiesCol
        .find({
          $or: [
            { primaryOwnerId: callerUserId },
            { createdByUserId: callerUserId },
            { 'members.userId': callerUserId },
          ],
          status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
        })
        .project({ id: 1, entityId: 1 })
        .toArray();

      ownedEntities.forEach((ent: any) => {
        if (ent.id) {
          callerEntityIds.push(ent.id);
          callerNormSet.add(ent.id.toLowerCase());
        }
        if (ent.entityId) {
          callerEntityIds.push(ent.entityId);
          callerNormSet.add(ent.entityId.toLowerCase());
        }
      });
    } catch (err) {
      console.warn('[Messages GET] Error fetching owned entities:', err);
    }

    // 1. Fetch messages for a specific conversation
    if (conversationId) {
      // Check if conversation exists and verify caller is a participant
      const conv = await convsCol.findOne({ id: conversationId });
      if (conv && Array.isArray(conv.participants)) {
        const isParticipant = conv.participants.some((p: string) => callerNormSet.has(p.toLowerCase()));
        if (!isParticipant) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You are not a participant in this conversation' },
            { status: 403 }
          );
        }
      }

      // Query both canonical 'messages' and 'chat_messages' to support zero message loss
      const [atlasChatMsgs, atlasMsgs] = await Promise.all([
        chatMessagesCol.find({ conversationId }).sort({ createdAt: 1 }).limit(200).toArray(),
        messagesCol.find({ conversationId }).sort({ createdAt: 1 }).limit(200).toArray(),
      ]);

      const seenMsgKeys = new Set<string>();
      const combinedMessages: any[] = [];

      for (const m of [...atlasMsgs, ...atlasChatMsgs]) {
        const msgKey = m.id || m.clientMessageId || String(m._id);
        if (seenMsgKeys.has(msgKey)) continue;
        seenMsgKeys.add(msgKey);

        const sName = (m.senderName && m.senderName !== 'Member' && m.senderName !== 'Partner')
          ? m.senderName
          : formatIdToName(m.senderId);
        const sAvatar = (m.senderAvatar && !m.senderAvatar.includes('xentro-logo.png') && m.senderAvatar !== '/xentro-logo.png' && !m.senderAvatar.startsWith('blob:'))
          ? m.senderAvatar
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sName)}`;
        let msgCreatedAt = m.createdAt;
        if (!msgCreatedAt) {
          if (m._id && typeof m._id.getTimestamp === 'function') {
            msgCreatedAt = m._id.getTimestamp().toISOString();
          } else if (m.timestamp && !isNaN(new Date(m.timestamp).getTime())) {
            msgCreatedAt = new Date(m.timestamp).toISOString();
          } else {
            msgCreatedAt = new Date().toISOString();
          }
        }

        combinedMessages.push({
          id: m.id || String(m._id),
          clientMessageId: m.clientMessageId || m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderName: sName,
          senderAvatar: sAvatar,
          senderRole: (m.senderRole && m.senderRole !== 'Member') ? m.senderRole : 'Explorer',
          text: m.text || m.content || '',
          content: m.text || m.content || '',
          timestamp: m.timestamp || msgCreatedAt,
          createdAt: msgCreatedAt,
          readBy: Array.isArray(m.readBy) ? m.readBy : [m.senderId],
          status: m.status || 'delivered',
        });
      }

      combinedMessages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      return NextResponse.json({
        success: true,
        messages: combinedMessages,
        source: 'mongodb-atlas',
      });
    }

    // 2. Fetch conversations for user / entity
    let targetIds: string[] = Array.from(callerNormSet);
    if (requestedUserId) {
      if (!callerNormSet.has(requestedUserId.toLowerCase())) {
        return NextResponse.json({ success: false, error: 'Forbidden: Cannot access other users conversations' }, { status: 403 });
      }
    }
    if (requestedEntityId) {
      if (!callerNormSet.has(requestedEntityId.toLowerCase())) {
        const hasAccess = await verifyCallerEntityAccess(callerUserId, requestedEntityId);
        if (!hasAccess) {
          return NextResponse.json({ success: false, error: 'Forbidden: Cannot access other entity conversations' }, { status: 403 });
        }
      }
      targetIds = [requestedEntityId, requestedEntityId.toLowerCase()];
    }

    const conversations = await convsCol
      .find({
        participants: { $in: targetIds },
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray();

    const resolvedConvs = await Promise.all(
      conversations.map(async (c: any) => {
        let participants: string[] = Array.isArray(c.participants) ? [...c.participants] : [];
        if (participants.length === 0 && c.id?.startsWith('conv_')) {
          const parts = c.id.replace('conv_', '').split('_');
          if (parts.length >= 2) {
            participants = parts;
          }
        }

        const otherParticipantId = participants.find(
          (p: string) => !targetIds.some((t: string) => t.toLowerCase() === p.toLowerCase())
        ) || participants[0] || '';

        const usersMap: Record<string, any> = { ...(c.users || {}) };

        for (const pId of participants) {
          const existing = usersMap[pId];
          if (!existing || !existing.name || existing.name === 'Member' || existing.name === 'Partner') {
            usersMap[pId] = await resolveParticipantProfile(pId, db, c.id);
          }
        }

        let partnerObj = usersMap[otherParticipantId] || c.partner || c.user;
        if (!partnerObj || !partnerObj.name || partnerObj.name === 'Member' || partnerObj.name === 'Partner') {
          partnerObj = await resolveParticipantProfile(otherParticipantId, db, c.id);
          usersMap[otherParticipantId] = partnerObj;
        }

        if (partnerObj) {
          if (!partnerObj.avatar || partnerObj.avatar.includes('xentro-logo.png') || partnerObj.avatar === '/xentro-logo.png') {
            partnerObj.avatar = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partnerObj.name || 'User')}`;
          }
        }

        return {
          id: c.id || String(c._id),
          participants,
          partner: partnerObj,
          user: partnerObj,
          users: usersMap,
          lastMessage: c.lastMessage || '',
          updatedAt: c.updatedAt || c.createdAt,
          createdAt: c.createdAt,
        };
      })
    );

    return NextResponse.json({
      success: true,
      conversations: resolvedConvs,
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
    const caller = await requireServerAuth(req);
    if (!caller.authenticated || !caller.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const callerUserId = caller.user.id || caller.user.userId || '';
    const callerEmail = caller.user.email || '';
    const callerNormSet = new Set<string>([
      callerUserId.toLowerCase(),
      callerEmail.toLowerCase(),
    ].filter(Boolean));

    const body = await req.json();
    const action = body?.action || 'send';

    const db = await getDatabase();
    const chatMessagesCol = db.collection('chat_messages');
    const messagesCol = db.collection('messages');
    const convsCol = db.collection('conversations');
    const entitiesCol = db.collection('entities');

    // Fetch caller's owned/member entities
    try {
      const ownedEntities = await entitiesCol
        .find({
          $or: [
            { primaryOwnerId: callerUserId },
            { createdByUserId: callerUserId },
            { 'members.userId': callerUserId },
          ],
          status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
        })
        .project({ id: 1, entityId: 1 })
        .toArray();

      ownedEntities.forEach((ent: any) => {
        if (ent.id) callerNormSet.add(ent.id.toLowerCase());
        if (ent.entityId) callerNormSet.add(ent.entityId.toLowerCase());
      });
    } catch (err) {
      console.warn('[Messages POST] Error fetching caller entities:', err);
    }

    const nowIso = new Date().toISOString();

    if (action === 'startConversation') {
      const partnerId = body?.partnerId;
      let userId = body?.userId;
      const partner = body?.partner || {};
      const currentUser = body?.currentUser || {};
      const initialMessage = body?.initialMessage;

      if (!partnerId) {
        return NextResponse.json(
          { success: false, error: 'partnerId is required' },
          { status: 400 }
        );
      }

      // Enforce caller identity - cannot spoof another user
      if (!userId || !callerNormSet.has(userId.toLowerCase())) {
        userId = callerUserId;
      }

      const sortedPair = [userId.toLowerCase(), partnerId.toLowerCase()].sort();
      const convId = body?.conversationId || `conv_${sortedPair[0]}_${sortedPair[1]}`;

      // Enforce bidirectional block list check
      const blocksCol = db.collection('user_blocks');
      const isBlocked = await blocksCol.findOne({
        $or: [
          { blockerId: userId, blockedId: partnerId },
          { blockerId: partnerId, blockedId: userId },
          { blockerId: callerUserId, blockedId: partnerId },
          { blockerId: partnerId, blockedId: callerUserId },
        ],
      });
      if (isBlocked) {
        return NextResponse.json(
          { success: false, error: 'Messaging unavailable due to user preferences.' },
          { status: 403 }
        );
      }

      // Resolve profiles so names are never generic 'Member'
      const resolvedCurrentUser = (currentUser?.name && currentUser?.name !== 'Member' && currentUser?.name !== 'Partner')
        ? {
            id: userId,
            name: currentUser.name,
            avatar: (currentUser.avatar && !currentUser.avatar.includes('xentro-logo.png')) ? currentUser.avatar : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(currentUser.name)}`,
            role: (currentUser.role && currentUser.role !== 'Member') ? currentUser.role : 'Explorer',
            company: currentUser.company || '',
          }
        : await resolveParticipantProfile(userId, db, convId);

      const resolvedPartner = (partner?.name && partner?.name !== 'Member' && partner?.name !== 'Partner')
        ? {
            id: partnerId,
            name: partner.name,
            avatar: (partner.avatar && !partner.avatar.includes('xentro-logo.png')) ? partner.avatar : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partner.name)}`,
            role: (partner.role && partner.role !== 'Member') ? partner.role : 'Explorer',
            company: partner.company || '',
          }
        : await resolveParticipantProfile(partnerId, db, convId);

      const convDoc = {
        id: convId,
        participants: [userId, partnerId],
        users: {
          [userId]: resolvedCurrentUser,
          [partnerId]: resolvedPartner,
        },
        user: resolvedPartner,
        partner: resolvedPartner,
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
          senderName: resolvedCurrentUser.name,
          senderAvatar: resolvedCurrentUser.avatar,
          senderRole: resolvedCurrentUser.role,
          text: initialMessage,
          content: initialMessage,
          timestamp: nowIso,
          createdAt: nowIso,
          readBy: [userId],
          status: 'delivered',
        };

        // Write to canonical messages first, then resilient sync to chat_messages
        await messagesCol.insertOne(msgDoc);
        try {
          await chatMessagesCol.insertOne(msgDoc);
        } catch (legErr) {
          console.warn('[Messages POST] Warning inserting into legacy chat_messages:', legErr);
        }

        // Scoped SSE delivery only to conversation participants
        broadcast({
          type: 'new_message',
          data: msgDoc,
          recipientUserIds: [userId, partnerId],
        });
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
      let senderId = rawMsg?.senderId || body?.senderId;
      const rawSenderName = rawMsg?.senderName || body?.senderName || '';
      const rawSenderAvatar = rawMsg?.senderAvatar || body?.senderAvatar || '';
      const rawSenderRole = rawMsg?.senderRole || body?.senderRole || '';
      const recipientId = rawMsg?.recipientId || body?.partnerId;

      if (!text || !conversationId) {
        return NextResponse.json(
          { success: false, error: 'text and conversationId are required' },
          { status: 400 }
        );
      }

      // Enforce caller identity - cannot spoof sender
      if (!senderId || !callerNormSet.has(senderId.toLowerCase())) {
        senderId = callerUserId;
      }

      // Verify conversation participation
      const conv = await convsCol.findOne({ id: conversationId });
      if (conv && Array.isArray(conv.participants)) {
        const isParticipant = conv.participants.some((p: string) => callerNormSet.has(p.toLowerCase()));
        if (!isParticipant) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You are not a participant in this conversation' },
            { status: 403 }
          );
        }

        // Enforce bidirectional block check between sender and other participants
        const otherParticipantId = conv.participants.find((p: string) => !callerNormSet.has(p.toLowerCase()));
        if (otherParticipantId) {
          const blocksCol = db.collection('user_blocks');
          const isBlocked = await blocksCol.findOne({
            $or: [
              { blockerId: senderId, blockedId: otherParticipantId },
              { blockerId: otherParticipantId, blockedId: senderId },
              { blockerId: callerUserId, blockedId: otherParticipantId },
              { blockerId: otherParticipantId, blockedId: callerUserId },
            ],
          });
          if (isBlocked) {
            return NextResponse.json(
              { success: false, error: 'Messaging unavailable due to user preferences.' },
              { status: 403 }
            );
          }
        }
      }

      const senderProfile = (rawSenderName && rawSenderName !== 'Member' && rawSenderName !== 'Partner')
        ? {
            id: senderId,
            name: rawSenderName,
            avatar: (rawSenderAvatar && !rawSenderAvatar.includes('xentro-logo.png')) ? rawSenderAvatar : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rawSenderName)}`,
            role: (rawSenderRole && rawSenderRole !== 'Member') ? rawSenderRole : 'Explorer',
          }
        : await resolveParticipantProfile(senderId, db, conversationId);

      const id = rawMsg?.id || rawMsg?.tempId || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const clientMessageId = rawMsg?.clientMessageId || id;

      const msgDoc = {
        id,
        clientMessageId,
        conversationId,
        senderId,
        senderName: senderProfile.name,
        senderAvatar: senderProfile.avatar,
        senderRole: senderProfile.role,
        text,
        content: text,
        timestamp: rawMsg?.timestamp || nowIso,
        createdAt: nowIso,
        readBy: [senderId],
        status: 'delivered',
      };

      // 1. Dual-collection persistence (canonical 'messages' and 'chat_messages')
      // 1. Dual-collection persistence: canonical 'messages' is authoritative
      try {
        await messagesCol.updateOne(
          { $or: [{ id }, { clientMessageId }] },
          { $set: msgDoc },
          { upsert: true }
        );
      } catch (canErr) {
        console.error('[Messages POST] Error writing to canonical messages:', canErr);
        throw canErr;
      }

      // Resilient synchronization to legacy chat_messages (does not abort delivery if canonical succeeded)
      try {
        await chatMessagesCol.updateOne(
          { $or: [{ id }, { clientMessageId }] },
          { $set: msgDoc },
          { upsert: true }
        );
      } catch (legErr) {
        console.warn('[Messages POST] Warning synchronizing to legacy chat_messages:', legErr);
      }

      // 2. Update conversation
      const participantsToAdd = [senderId, recipientId].filter(Boolean);
      await convsCol.updateOne(
        { id: conversationId },
        {
          $set: {
            lastMessage: text,
            updatedAt: nowIso,
            [`users.${senderId}`]: senderProfile,
          },
          $addToSet: {
            participants: { $each: participantsToAdd },
          },
        },
        { upsert: true }
      );

      // Determine participants for recipient-scoped SSE
      const sseRecipients = conv && Array.isArray(conv.participants)
        ? conv.participants
        : participantsToAdd;

      // 3. Broadcast real-time SSE event ONLY to authorized conversation participants
      broadcast({
        type: 'new_message',
        data: msgDoc,
        recipientUserIds: sseRecipients,
      });

      return NextResponse.json({
        success: true,
        message: msgDoc,
      });
    }

    if (action === 'markRead') {
      const conversationId = body?.conversationId as string;

      if (!conversationId) {
        return NextResponse.json(
          { success: false, error: 'conversationId required' },
          { status: 400 }
        );
      }

      // Enforce caller marks read for their own identity
      const readUserId = callerUserId;

      await Promise.all([
        chatMessagesCol.updateMany(
          { conversationId },
          { $addToSet: { readBy: readUserId } }
        ),
        messagesCol.updateMany(
          { conversationId },
          { $addToSet: { readBy: readUserId } }
        ),
      ]);

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
