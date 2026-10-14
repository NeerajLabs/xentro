import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { broadcast } from '@/lib/serverMessages';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { requireServerAuth, verifyCallerEntityAccess } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND_BASE = getBackendBaseUrl();

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

function computePairKey(a: string, b: string): string {
  const s = (a || '').trim().toLowerCase();
  const r = (b || '').trim().toLowerCase();
  return [s, r].sort().join('_');
}

export async function GET(req: NextRequest) {
  try {
    const caller = await requireServerAuth(req);
    if (!caller.authenticated || !caller.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId')?.trim() || '';
    const entityId = searchParams.get('entityId')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    const callerUserId = caller.user.id || caller.user.userId || '';
    const userId = requestedUserId || callerUserId;

    if (requestedUserId && requestedUserId.toLowerCase() !== callerUserId.toLowerCase() && !caller.user.is_staff) {
      return NextResponse.json({ success: false, error: 'Forbidden: Cannot access other users connections' }, { status: 403 });
    }

    if (entityId) {
      const hasAccess = await verifyCallerEntityAccess(callerUserId, entityId);
      if (!hasAccess && !caller.user.is_staff) {
        return NextResponse.json({ success: false, error: 'Forbidden: Cannot access entity connections' }, { status: 403 });
      }
    }

    const db = await getDatabase();
    const connectionsCol = db.collection('connections');
    const entitiesCol = db.collection('entities');

    let targetIds: string[] = [];

    if (userId) {
      targetIds.push(userId, userId.toLowerCase(), userId.toUpperCase());
      const userVariants = [userId, userId.toLowerCase(), userId.toUpperCase()];

      // Fetch all entities owned or created by this user so startup connections are included
      try {
        const ownedEntities = await entitiesCol
          .find({
            $or: [
              { primaryOwnerId: { $in: userVariants } },
              { createdByUserId: { $in: userVariants } },
              { 'members.userId': { $in: userVariants } },
            ],
            status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
          })
          .project({ id: 1, entityId: 1 })
          .toArray();

        ownedEntities.forEach((ent: any) => {
          if (ent.id) targetIds.push(ent.id, ent.id.toLowerCase(), ent.id.toUpperCase());
          if (ent.entityId) targetIds.push(ent.entityId, ent.entityId.toLowerCase(), ent.entityId.toUpperCase());
        });
      } catch (err) {
        console.warn('[Connections GET] Error fetching owned entities:', err);
      }
    }

    if (entityId) {
      targetIds.push(entityId, entityId.toLowerCase(), entityId.toUpperCase());
    }

    // Deduplicate target IDs
    targetIds = Array.from(new Set(targetIds.filter(Boolean)));
    const targetIdsLower = targetIds.map((t) => t.toLowerCase());

    const query: any = {};
    if (targetIds.length > 0) {
      query.$or = [
        { senderId: { $in: targetIds } },
        { recipientId: { $in: targetIds } },
      ];
    }
    if (status) {
      query.status = status;
    }

    const rawConnections = await connectionsCol
      .find(query)
      .sort({ updatedAt: -1, createdAt: -1 })
      .toArray();

    const connections = rawConnections.map((c: any) => {
      const sName = (c.senderName && c.senderName !== 'Member' && c.senderName !== 'Partner')
        ? c.senderName
        : formatIdToName(c.senderId);
      const rName = (c.recipientName && c.recipientName !== 'Member' && c.recipientName !== 'Partner')
        ? c.recipientName
        : formatIdToName(c.recipientId);
      const sAvatar = (c.senderAvatar && !c.senderAvatar.includes('xentro-logo.png') && c.senderAvatar !== '/xentro-logo.png' && !c.senderAvatar.startsWith('blob:'))
        ? c.senderAvatar
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sName)}`;
      const rAvatar = (c.recipientAvatar && !c.recipientAvatar.includes('xentro-logo.png') && c.recipientAvatar !== '/xentro-logo.png' && !c.recipientAvatar.startsWith('blob:'))
        ? c.recipientAvatar
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(rName)}`;

      return {
        id: c.id || String(c._id),
        senderId: c.senderId,
        senderName: sName,
        senderRole: (c.senderRole && c.senderRole !== 'Member') ? c.senderRole : 'Explorer',
        senderAvatar: sAvatar,
        recipientId: c.recipientId,
        recipientName: rName,
        recipientRole: (c.recipientRole && c.recipientRole !== 'Member') ? c.recipientRole : 'Explorer',
        recipientAvatar: rAvatar,
        status: c.status || 'pending',
        note: c.note || '',
        createdAt: c.createdAt || new Date().toISOString(),
        updatedAt: c.updatedAt || new Date().toISOString(),
        pair_key: c.pair_key || computePairKey(c.senderId, c.recipientId),
      };
    });

    // Calculate metrics and connected partners
    const acceptedList = connections.filter((c) => c.status === 'accepted');
    const pendingReceived = connections.filter((c) => {
      const isRecipient = targetIdsLower.includes((c.recipientId || '').toLowerCase());
      return isRecipient && c.status === 'pending';
    });
    const pendingSent = connections.filter((c) => {
      const isSender = targetIdsLower.includes((c.senderId || '').toLowerCase());
      return isSender && c.status === 'pending';
    });

    const connectedPartners = acceptedList.map((c) => {
      const isSenderMe = targetIdsLower.includes((c.senderId || '').toLowerCase());
      return {
        id: isSenderMe ? c.recipientId : c.senderId,
        name: isSenderMe ? c.recipientName : c.senderName,
        role: isSenderMe ? c.recipientRole : c.senderRole,
        avatar: isSenderMe ? c.recipientAvatar : c.senderAvatar,
        connectionId: c.id,
        connectedAt: c.updatedAt,
      };
    });

    return NextResponse.json({
      success: true,
      connections,
      connectedPartners,
      metrics: {
        activeConnections: acceptedList.length,
        pendingReceived: pendingReceived.length,
        pendingSent: pendingSent.length,
        activeUsers: connections.length,
      },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Connections GET] Error:', err);
    return NextResponse.json(
      { success: false, connections: [], error: err?.message },
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

    const db = await getDatabase();
    const connectionsCol = db.collection('connections');
    const notifsCol = db.collection('notifications');
    const entitiesCol = db.collection('entities');
    const blocksCol = db.collection('user_blocks');

    // Fetch caller's owned or member entities
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
      console.warn('[Connections POST] Error fetching caller entities:', err);
    }

    const body = await req.json();
    const action = body?.action || 'request';
    const connection = body?.connection;
    const partnerId = (body?.partnerId || connection?.recipientId || '').trim();
    const userId = (body?.userId || connection?.senderId || '').trim();

    if (!connection && !partnerId && !body?.connectionId) {
      return NextResponse.json(
        { success: false, error: 'Invalid connection payload' },
        { status: 400 }
      );
    }

    const nowIso = new Date().toISOString();

    if (action === 'request') {
      let senderId = (connection?.senderId || userId).trim();
      const recipientId = (connection?.recipientId || partnerId).trim();

      if (!recipientId) {
        return NextResponse.json({ success: false, error: 'Recipient is required' }, { status: 400 });
      }

      // Enforce caller identity - cannot spoof sender
      if (!senderId || !callerNormSet.has(senderId.toLowerCase())) {
        senderId = callerUserId;
      }

      // Prevent self-connection
      if (senderId.toLowerCase() === recipientId.toLowerCase()) {
        return NextResponse.json({ success: false, error: 'Cannot connect with yourself' }, { status: 400 });
      }

      // Check if blocked
      const isBlocked = await blocksCol.findOne({
        $or: [
          { blockerId: recipientId, blockedId: senderId },
          { blockerId: senderId, blockedId: recipientId },
        ],
      });
      if (isBlocked) {
        return NextResponse.json(
          { success: false, error: 'Action blocked by user preferences' },
          { status: 403 }
        );
      }

      const pair_key = computePairKey(senderId, recipientId);
      const connectionId =
        connection?.id ||
        `conn_${pair_key}`;

      const senderName = (connection?.senderName && connection?.senderName !== 'Member')
        ? connection.senderName
        : formatIdToName(senderId);
      const recipientName = (connection?.recipientName && connection?.recipientName !== 'Member')
        ? connection.recipientName
        : formatIdToName(recipientId);

      const doc = {
        id: connectionId,
        pair_key,
        senderId,
        senderName,
        senderRole: connection?.senderRole || 'Member',
        senderAvatar: connection?.senderAvatar || '/xentro-logo.png',
        recipientId,
        recipientName,
        recipientRole: connection?.recipientRole || 'Member',
        recipientAvatar: connection?.recipientAvatar || '/xentro-logo.png',
        status: 'pending',
        note: body?.note || '',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Find existing connection safely to avoid pair_key duplicate key errors
      const pairKeyUpper = [senderId.toUpperCase(), recipientId.toUpperCase()].sort().join('_');
      const existingConn = await connectionsCol.findOne({
        $or: [
          { pair_key },
          { pair_key: pairKeyUpper },
          { id: connectionId },
          { senderId, recipientId },
          { senderId: recipientId, recipientId: senderId },
        ],
      });

      if (existingConn) {
        await connectionsCol.updateOne(
          { _id: existingConn._id },
          {
            $set: {
              ...doc,
              id: existingConn.id || connectionId,
              pair_key: existingConn.pair_key || pair_key,
              createdAt: existingConn.createdAt || nowIso,
              updatedAt: nowIso,
            },
          }
        );
      } else {
        await connectionsCol.insertOne(doc);
      }

      // Create or update durable recipient notification in MongoDB Atlas
      try {
        const notifCategory = (doc.senderRole?.toLowerCase().includes('investor'))
          ? 'investor'
          : (doc.senderRole?.toLowerCase().includes('esp') ? 'esp' : 'mentorship');
        const notifId = `notif_conn_${connectionId}`;

        await notifsCol.updateOne(
          { id: notifId },
          {
            $set: {
              id: notifId,
              userId: recipientId,
              recipientId,
              category: notifCategory,
              title: `${doc.senderName} sent you a connection request`,
              description: body?.note ? `"${body.note}"` : `Looking to connect and collaborate on Xentro.`,
              time: 'Just now',
              avatar: doc.senderAvatar,
              actorName: doc.senderName,
              actorRole: doc.senderRole,
              actorId: doc.senderId,
              connectionId,
              actionRequired: true,
              actionType: 'connection_request',
              targetTab: 'notifications',
              unread: true,
              read: false,
              createdAt: nowIso,
              updatedAt: nowIso,
            },
          },
          { upsert: true }
        );
      } catch (notifErr) {
        console.warn('[Connections POST] Notification update warning:', notifErr);
      }

      broadcast({ type: 'connection_event', data: doc });

      return NextResponse.json({
        success: true,
        connection: doc,
        message: 'Connection request created successfully in MongoDB Atlas',
      });
    }

    if (action === 'accept') {
      const connectionId = body?.connectionId || connection?.id;
      const pair_key = (userId && partnerId) ? computePairKey(userId, partnerId) : '';

      const filterConditions: any[] = [];
      if (connectionId) {
        filterConditions.push({ id: connectionId });
      }
      if (pair_key) {
        filterConditions.push({ pair_key });
      }
      if (userId && partnerId) {
        filterConditions.push(
          { senderId: partnerId, recipientId: userId },
          { senderId: userId, recipientId: partnerId }
        );
      }

      const filter = filterConditions.length > 0 ? { $or: filterConditions } : { id: connectionId };
      const existingConn = await connectionsCol.findOne(filter);
      if (!existingConn) {
        return NextResponse.json({ success: false, error: 'Connection request not found' }, { status: 404 });
      }

      // Enforce caller authorization: only recipient can accept
      const isRecipient = callerNormSet.has(existingConn.recipientId.toLowerCase());
      if (!isRecipient && !caller.user.is_staff) {
        return NextResponse.json({ success: false, error: 'Forbidden: Only the recipient can accept this connection' }, { status: 403 });
      }

      await connectionsCol.updateOne(filter, {
        $set: { status: 'accepted', updatedAt: nowIso },
      });

      const updated = await connectionsCol.findOne(filter);

      if (updated) {
        // 1. Resolve pending request notification for the recipient
        try {
          await notifsCol.updateMany(
            {
              $or: [
                { connectionId: updated.id },
                { id: `notif_conn_${updated.id}` },
              ],
            },
            {
              $set: {
                actionRequired: false,
                unread: false,
                read: true,
                description: `Connected with ${updated.senderName}.`,
                updatedAt: nowIso,
              },
            }
          );

          // 2. Create durable notification for the SENDER that request was accepted
          const acceptNotifId = `notif_accepted_${updated.id}`;
          const acceptCategory = (updated.recipientRole?.toLowerCase().includes('investor'))
            ? 'investor'
            : (updated.recipientRole?.toLowerCase().includes('esp') ? 'esp' : 'mentorship');

          await notifsCol.updateOne(
            { id: acceptNotifId },
            {
              $set: {
                id: acceptNotifId,
                userId: updated.senderId,
                recipientId: updated.senderId,
                category: acceptCategory,
                title: `${updated.recipientName} accepted your connection request!`,
                description: `You are now connected on Xentro! Start collaborating.`,
                time: 'Just now',
                avatar: updated.recipientAvatar,
                actorName: updated.recipientName,
                actorRole: updated.recipientRole,
                actorId: updated.recipientId,
                connectionId: updated.id,
                actionType: 'connection',
                actionRequired: false,
                targetTab: 'messages',
                unread: true,
                read: false,
                createdAt: nowIso,
                updatedAt: nowIso,
              },
            },
            { upsert: true }
          );
        } catch (notifErr) {
          console.warn('[Connections POST] Notification accept update warning:', notifErr);
        }

        broadcast({ type: 'connection_event', data: updated });
      }

      return NextResponse.json({
        success: true,
        connection: updated,
        message: 'Connection accepted successfully',
      });
    }

    if (action === 'decline') {
      const connectionId = body?.connectionId || connection?.id;
      const pair_key = (userId && partnerId) ? computePairKey(userId, partnerId) : '';

      const filterConditions: any[] = [];
      if (connectionId) filterConditions.push({ id: connectionId });
      if (pair_key) filterConditions.push({ pair_key });
      if (userId && partnerId) {
        filterConditions.push(
          { senderId: partnerId, recipientId: userId },
          { senderId: userId, recipientId: partnerId }
        );
      }

      const filter = filterConditions.length > 0 ? { $or: filterConditions } : { id: connectionId };
      const existingConn = await connectionsCol.findOne(filter);
      if (!existingConn) {
        return NextResponse.json({ success: false, error: 'Connection request not found' }, { status: 404 });
      }

      // Enforce caller authorization: only recipient can decline
      const isRecipient = callerNormSet.has(existingConn.recipientId.toLowerCase());
      if (!isRecipient && !caller.user.is_staff) {
        return NextResponse.json({ success: false, error: 'Forbidden: Only the recipient can decline this connection' }, { status: 403 });
      }

      await connectionsCol.updateOne(filter, {
        $set: { status: 'declined', updatedAt: nowIso },
      });

      // Mark notification as resolved
      try {
        await notifsCol.updateMany(
          {
            $or: [
              { connectionId: connectionId },
              { id: `notif_conn_${connectionId}` },
            ],
          },
          {
            $set: {
              actionRequired: false,
              description: 'Connection request declined.',
              updatedAt: nowIso,
            },
          }
        );
      } catch (err) {
        console.warn('[Connections POST] Notification decline warning:', err);
      }

      const updated = await connectionsCol.findOne(filter);
      if (updated) {
        broadcast({ type: 'connection_event', data: updated });
      }

      return NextResponse.json({
        success: true,
        message: 'Connection declined',
      });
    }

    if (action === 'cancel') {
      const connectionId = body?.connectionId || connection?.id;
      const pair_key = (userId && partnerId) ? computePairKey(userId, partnerId) : '';

      const filterConditions: any[] = [];
      if (connectionId) filterConditions.push({ id: connectionId });
      if (pair_key) filterConditions.push({ pair_key });
      if (userId && partnerId) {
        filterConditions.push(
          { senderId: userId, recipientId: partnerId },
          { senderId: partnerId, recipientId: userId }
        );
      }

      const filter = filterConditions.length > 0 ? { $or: filterConditions } : { id: connectionId };
      const existing = await connectionsCol.findOne(filter);
      if (!existing) {
        return NextResponse.json({ success: false, error: 'Connection not found' }, { status: 404 });
      }

      // Enforce caller authorization: must be sender or recipient
      const isParticipant =
        callerNormSet.has(existing.senderId.toLowerCase()) ||
        callerNormSet.has(existing.recipientId.toLowerCase());
      if (!isParticipant && !caller.user.is_staff) {
        return NextResponse.json({ success: false, error: 'Forbidden: You cannot cancel or remove this connection' }, { status: 403 });
      }

      await connectionsCol.deleteOne(filter);

      // Clean up notification
      try {
        await notifsCol.deleteMany({
          $or: [
            { connectionId: connectionId || existing?.id },
            { id: `notif_conn_${connectionId || existing?.id}` },
          ],
        });
      } catch (err) {
        console.warn('[Connections POST] Notification cancel delete warning:', err);
      }

      broadcast({
        type: 'connection_event',
        data: {
          id: connectionId || existing?.id,
          senderId: userId || existing?.senderId,
          recipientId: partnerId || existing?.recipientId,
          status: 'cancelled',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Connection request cancelled',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Unsupported action' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[Connections POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
