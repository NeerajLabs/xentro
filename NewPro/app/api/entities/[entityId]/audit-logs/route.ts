import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireEntityMasterContext } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/entities/[entityId]/audit-logs
 * Head-only Log Records inspection.
 * STRICT ENFORCEMENT: Strictly requires verified ENTITY_MASTER session context bound to governing Head.
 * Personal sessions and Workspace sessions receive HTTP 403 Forbidden.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const entityId = params?.entityId?.trim();
    if (!entityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    // Enforce ENTITY_MASTER context strictly
    const masterRes = await requireEntityMasterContext(req, entityId);
    if ('error' in masterRes) {
      return masterRes.error;
    }

    const { entity, user } = masterRes;
    const db = await getDatabase();
    const auditCol = db.collection('audit_logs');

    const logs = await auditCol
      .find({
        $or: [{ entityId }, { targetEntityId: entityId }],
      })
      .sort({ timestamp: -1, createdAt: -1 })
      .limit(200)
      .toArray();

    // Sanitize any raw tokens, hashes, or passwords before returning
    const cleanLogs = logs.map((log) => {
      const copy: any = { ...log };
      delete copy._id;
      if (copy.details) {
        delete copy.details.token;
        delete copy.details.otp;
        delete copy.details.otp1;
        delete copy.details.otp2;
        delete copy.details.otpHash;
        delete copy.details.password;
        delete copy.details.secret;
      }
      return copy;
    });

    return NextResponse.json({
      success: true,
      data: cleanLogs,
      count: cleanLogs.length,
      entityId,
      headUserId: user.id,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error fetching audit logs' },
      { status: 500 }
    );
  }
}
