import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireServerAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const caller = await requireServerAuth(req);
    if (!caller.authenticated || !caller.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const callerUserId = caller.user.id || caller.user.userId || '';
    const body = await req.json();
    const action = body?.action || 'block';
    const targetUserId = (body?.targetUserId || body?.userId || '').trim();
    const reason = body?.reason || 'User block requested';

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'targetUserId is required' }, { status: 400 });
    }

    if (callerUserId.toLowerCase() === targetUserId.toLowerCase()) {
      return NextResponse.json({ success: false, error: 'Cannot block yourself' }, { status: 400 });
    }

    const db = await getDatabase();
    const blocksCol = db.collection('user_blocks');
    const connectionsCol = db.collection('connections');
    const nowIso = new Date().toISOString();

    if (action === 'block') {
      await blocksCol.updateOne(
        { blockerId: callerUserId, blockedId: targetUserId },
        {
          $set: {
            id: `blk_${callerUserId}_${targetUserId}`,
            blockerId: callerUserId,
            blockedId: targetUserId,
            reason,
            createdAt: nowIso,
            updatedAt: nowIso,
          },
        },
        { upsert: true }
      );

      // Sever any existing connection in connections collection
      await connectionsCol.updateMany(
        {
          $or: [
            { senderId: callerUserId, recipientId: targetUserId },
            { senderId: targetUserId, recipientId: callerUserId },
          ],
        },
        {
          $set: { status: 'blocked', blockedBy: callerUserId, updatedAt: nowIso },
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Account has been blocked. They will not be able to connect or message you.',
      });
    }

    if (action === 'unblock') {
      await blocksCol.deleteOne({ blockerId: callerUserId, blockedId: targetUserId });

      // Unblock connection if was blocked by this user
      await connectionsCol.updateMany(
        {
          blockedBy: callerUserId,
          $or: [
            { senderId: callerUserId, recipientId: targetUserId },
            { senderId: targetUserId, recipientId: callerUserId },
          ],
        },
        {
          $set: { status: 'declined', updatedAt: nowIso },
          $unset: { blockedBy: '' },
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Account has been unblocked.',
      });
    }

    return NextResponse.json({ success: false, error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    console.error('[Blocks POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const caller = await requireServerAuth(req);
    if (!caller.authenticated || !caller.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const callerUserId = caller.user.id || caller.user.userId || '';
    const db = await getDatabase();
    const blocksCol = db.collection('user_blocks');

    const blocks = await blocksCol.find({ blockerId: callerUserId }).toArray();

    return NextResponse.json({
      success: true,
      blocks: blocks.map((b: any) => ({
        id: b.id,
        blockedId: b.blockedId,
        reason: b.reason,
        createdAt: b.createdAt,
      })),
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Blocks GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
