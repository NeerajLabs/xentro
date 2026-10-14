import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireServerAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const caller = await requireServerAuth(req);
    if (!caller.authenticated || !caller.user) {
      return NextResponse.json({ success: false, error: 'Authentication required to report content' }, { status: 401 });
    }

    const callerUserId = caller.user.id || caller.user.userId || '';
    const body = await req.json();
    const targetType = body?.targetType || 'post';
    const targetId = (body?.targetId || body?.postId || body?.userId || '').trim();
    const reason = body?.reason || 'Inappropriate or harmful content';
    const details = body?.details || '';

    if (!targetId) {
      return NextResponse.json({ success: false, error: 'targetId is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const reportsCol = db.collection('moderation_reports');

    // 1. Check duplicate report from this user
    const existing = await reportsCol.findOne({
      reporterId: callerUserId,
      targetId,
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyReported: true,
        message: 'You have already reported this item. Our moderation team is reviewing it.',
      });
    }

    const nowIso = new Date().toISOString();
    const reportDoc = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      reporterId: callerUserId,
      reporterEmail: caller.user.email || '',
      targetType,
      targetId,
      reason,
      details,
      status: 'PENDING_REVIEW',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 2. Persist to MongoDB Atlas moderation_reports
    await reportsCol.insertOne(reportDoc);

    // 3. If target is a post, flag post for review in feed_posts
    if (targetType === 'post') {
      try {
        await db.collection('feed_posts').updateOne(
          { id: targetId },
          {
            $set: { reported: true, lastReportedAt: nowIso },
            $inc: { reportCount: 1 },
          }
        );
      } catch (postErr) {
        console.warn('[Reports API] Warning updating post flag:', postErr);
      }
    }

    return NextResponse.json({
      success: true,
      reportId: reportDoc.id,
      message: 'Report submitted and logged for moderation review. Thank you for keeping Xentro safe.',
    });
  } catch (err: any) {
    console.error('[Reports POST] Error:', err);
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
    const reportsCol = db.collection('moderation_reports');

    const query: any = caller.user.is_staff ? {} : { reporterId: callerUserId };
    const reports = await reportsCol.find(query).sort({ createdAt: -1 }).limit(100).toArray();

    return NextResponse.json({
      success: true,
      reports,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Reports GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
