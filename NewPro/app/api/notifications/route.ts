import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function resolveTargetIds(db: any, userId?: string, entityId?: string): Promise<string[]> {
  const ids: string[] = [];
  if (userId) {
    ids.push(userId, userId.toLowerCase(), userId.toUpperCase());
    try {
      const owned = await db.collection('entities').find({
        $or: [
          { primaryOwnerId: userId },
          { createdByUserId: userId },
          { 'members.userId': userId },
        ],
        status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
      }).project({ id: 1, entityId: 1 }).toArray();

      owned.forEach((ent: any) => {
        if (ent.id) ids.push(ent.id, ent.id.toLowerCase(), ent.id.toUpperCase());
        if (ent.entityId) ids.push(ent.entityId, ent.entityId.toLowerCase(), ent.entityId.toUpperCase());
      });
    } catch (err) {
      console.warn('[Notifications] Error resolving owned entities:', err);
    }
  }

  if (entityId) {
    ids.push(entityId, entityId.toLowerCase(), entityId.toUpperCase());
  }

  return Array.from(new Set(ids.filter(Boolean)));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId')?.trim();
    const entityId = searchParams.get('entityId')?.trim();

    if (!userId && !entityId) {
      return NextResponse.json({ success: true, notifications: [], unreadCount: 0 });
    }

    const db = await getDatabase();
    const notifsCol = db.collection('notifications');

    const targetIds = await resolveTargetIds(db, userId, entityId);

    const rawNotifs = await notifsCol
      .find({
        $or: [
          { userId: { $in: targetIds } },
          { recipientId: { $in: targetIds } },
        ],
      })
      .sort({ createdAt: -1 })
      .limit(100)
      .toArray();

    const notifications = rawNotifs.map((n: any) => ({
      id: n.id || String(n._id),
      userId: n.userId || n.recipientId,
      category: n.category || 'general',
      title: n.title || 'New Notification',
      description: n.description || n.message || '',
      time: n.time || 'Recently',
      unread: n.unread !== undefined ? Boolean(n.unread) : !Boolean(n.read),
      avatar: n.avatar || '/xentro-logo.png',
      actorName: n.actorName || n.senderName || '',
      actorRole: n.actorRole || n.senderRole || '',
      actorId: n.actorId || n.senderId || '',
      connectionId: n.connectionId || '',
      actionRequired: Boolean(n.actionRequired),
      actionType: n.actionType || '',
      targetTab: n.targetTab || 'notifications',
      createdAt: n.createdAt || new Date().toISOString(),
    }));

    const unreadCount = notifications.filter((n) => n.unread).length;

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Notifications GET] Error:', err);
    return NextResponse.json({ success: false, error: err?.message, notifications: [], unreadCount: 0 }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'markRead';
    const userId = body?.userId?.trim();
    const entityId = body?.entityId?.trim();
    const notificationId = body?.notificationId;

    const db = await getDatabase();
    const notifsCol = db.collection('notifications');

    if (action === 'markRead' && notificationId) {
      await notifsCol.updateMany(
        { $or: [{ id: notificationId }, { _id: notificationId }] },
        { $set: { unread: false, read: true, updatedAt: new Date().toISOString() } }
      );
      return NextResponse.json({ success: true, message: 'Notification marked as read' });
    }

    const targetIds = await resolveTargetIds(db, userId, entityId);

    if (action === 'markAllRead' && targetIds.length > 0) {
      await notifsCol.updateMany(
        {
          $or: [
            { userId: { $in: targetIds } },
            { recipientId: { $in: targetIds } },
          ],
        },
        { $set: { unread: false, read: true, updatedAt: new Date().toISOString() } }
      );
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (action === 'clear' && targetIds.length > 0) {
      await notifsCol.deleteMany({
        $or: [
          { userId: { $in: targetIds } },
          { recipientId: { $in: targetIds } },
        ],
      });
      return NextResponse.json({ success: true, message: 'Notifications cleared' });
    }

    return NextResponse.json({ success: false, error: 'Invalid parameters for notification action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Notifications POST] Error:', err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
