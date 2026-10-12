import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { broadcast } from '@/lib/serverMessages';

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
        messages: messages.map((m: any) => {
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
          return {
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
          };
        }),
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

          // Ensure all participants have resolved profiles
          for (const pId of participants) {
            const existing = usersMap[pId];
            if (!existing || !existing.name || existing.name === 'Member' || existing.name === 'Partner') {
              usersMap[pId] = await resolveParticipantProfile(pId, db, c.id);
            }
          }

          // If partner is not resolved yet
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

      // 1. Insert message into MongoDB Atlas chat_messages
      await messagesCol.updateOne(
        { $or: [{ id }, { clientMessageId }] },
        { $set: msgDoc },
        { upsert: true }
      );

      // 2. Update conversation last message and timestamp and users profile in MongoDB Atlas
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
