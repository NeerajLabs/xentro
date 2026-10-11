import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { broadcast } from '@/lib/serverMessages';
import { getBackendBaseUrl } from '@/lib/backendUrl';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId')?.trim() || '';
    const entityId = searchParams.get('entityId')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';

    const db = await getDatabase();
    const connectionsCol = db.collection('connections');
    const entitiesCol = db.collection('entities');

    let targetIds: string[] = [];

    if (userId) {
      targetIds.push(userId);
      targetIds.push(userId.toLowerCase());

      // Fetch all entities owned or created by this user so startup connections are included
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
        console.warn('[Connections GET] Error fetching owned entities:', err);
      }
    }

    if (entityId) {
      targetIds.push(entityId);
      targetIds.push(entityId.toLowerCase());
    }

    // Deduplicate target IDs
    targetIds = Array.from(new Set(targetIds.filter(Boolean)));

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
      const sAvatar = (c.senderAvatar && !c.senderAvatar.includes('xentro-logo.png') && c.senderAvatar !== '/xentro-logo.png')
        ? c.senderAvatar
        : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(sName)}`;
      const rAvatar = (c.recipientAvatar && !c.recipientAvatar.includes('xentro-logo.png') && c.recipientAvatar !== '/xentro-logo.png')
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
        pair_key: c.pair_key || undefined,
      };
    });

    // Calculate metrics and connected partners
    const acceptedList = connections.filter((c) => c.status === 'accepted');
    const pendingReceived = connections.filter((c) => {
      const isRecipient = targetIds.includes(c.recipientId) || targetIds.includes(c.recipientId?.toLowerCase());
      return isRecipient && c.status === 'pending';
    });
    const pendingSent = connections.filter((c) => {
      const isSender = targetIds.includes(c.senderId) || targetIds.includes(c.senderId?.toLowerCase());
      return isSender && c.status === 'pending';
    });

    const connectedPartners = acceptedList.map((c) => {
      const isSenderMe = targetIds.includes(c.senderId) || targetIds.includes(c.senderId?.toLowerCase());
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
    const body = await req.json();
    const action = body?.action || 'request';
    const connection = body?.connection;
    const partnerId = body?.partnerId || connection?.recipientId;
    const userId = body?.userId || connection?.senderId;

    if (!connection && !partnerId && !body?.connectionId) {
      return NextResponse.json(
        { success: false, error: 'Invalid connection payload' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const connectionsCol = db.collection('connections');
    const notifsCol = db.collection('notifications');

    const nowIso = new Date().toISOString();

    if (action === 'request') {
      const senderId = connection?.senderId || userId;
      const recipientId = connection?.recipientId || partnerId;
      const connectionId =
        connection?.id ||
        `conn_${senderId}_${recipientId}`.replace(/[^a-zA-Z0-9_-]/g, '_');

      const doc = {
        id: connectionId,
        senderId,
        senderName: connection?.senderName || 'Member',
        senderRole: connection?.senderRole || 'Member',
        senderAvatar: connection?.senderAvatar || '/xentro-logo.png',
        recipientId,
        recipientName: connection?.recipientName || 'Member',
        recipientRole: connection?.recipientRole || 'Member',
        recipientAvatar: connection?.recipientAvatar || '/xentro-logo.png',
        status: 'pending',
        note: body?.note || '',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      // Upsert connection in MongoDB Atlas
      await connectionsCol.updateOne(
        {
          $or: [
            { id: connectionId },
            { senderId, recipientId },
            { senderId: recipientId, recipientId: senderId },
          ],
        },
        { $set: doc },
        { upsert: true }
      );

      // Create durable recipient notification in MongoDB Atlas
      try {
        await notifsCol.insertOne({
          id: `notif_conn_${connectionId}`,
          userId: recipientId,
          category: 'mentorship',
          title: `${doc.senderName} sent you a connection request`,
          description: `Looking to connect and collaborate on Xentro.`,
          time: 'Just now',
          avatar: doc.senderAvatar,
          actorName: doc.senderName,
          actorRole: doc.senderRole,
          actorId: doc.senderId,
          connectionId,
          actionRequired: true,
          actionType: 'connection_request',
          targetTab: 'notifications',
          createdAt: nowIso,
        });
      } catch (notifErr) {
        console.warn('[Connections POST] Notification insert warning:', notifErr);
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
      const filter: any = {};
      if (connectionId) {
        filter.$or = [{ id: connectionId }, { _id: connectionId }];
      } else {
        filter.$or = [
          { senderId: partnerId, recipientId: userId },
          { senderId: userId, recipientId: partnerId },
        ];
      }

      await connectionsCol.updateOne(filter, {
        $set: { status: 'accepted', updatedAt: nowIso },
      });

      const updated = await connectionsCol.findOne(filter);

      if (updated) {
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
      const filter: any = {};
      if (connectionId) {
        filter.$or = [{ id: connectionId }, { _id: connectionId }];
      } else {
        filter.$or = [
          { senderId: partnerId, recipientId: userId },
          { senderId: userId, recipientId: partnerId },
        ];
      }

      await connectionsCol.updateOne(filter, {
        $set: { status: 'declined', updatedAt: nowIso },
      });

      return NextResponse.json({
        success: true,
        message: 'Connection declined',
      });
    }

    if (action === 'cancel') {
      const connectionId = body?.connectionId || connection?.id;
      const filter: any = {};
      if (connectionId) {
        filter.$or = [{ id: connectionId }, { _id: connectionId }];
      } else {
        filter.$or = [
          { senderId: userId, recipientId: partnerId },
          { senderId: partnerId, recipientId: userId },
        ];
      }

      await connectionsCol.deleteOne(filter);

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
