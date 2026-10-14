import { NextRequest, NextResponse } from 'next/server';
import { extractAuthToken, verifyJwtToken, revokeEntitySession, logSecurityAuditEvent } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    let sessionId: string | null = null;
    let userId: string | null = null;
    let entityId: string | null = null;

    const token = extractAuthToken(req);
    if (token) {
      const payload = verifyJwtToken(token);
      if (payload) {
        sessionId = payload.sessionId || null;
        userId = payload.sub || null;
        entityId = payload.entityId || null;
      }
    }

    if (!sessionId) {
      try {
        const body = await req.json();
        sessionId = body.sessionId ? String(body.sessionId).trim() : null;
      } catch (_) {}
    }

    if (sessionId) {
      await revokeEntitySession(sessionId, 'USER_EXPLICIT_LOGOUT');
      if (entityId) {
        await logSecurityAuditEvent({
          entityId,
          actorId: userId || 'UNKNOWN',
          action: 'ENTITY_MASTER_LOGOUT',
          outcome: 'ALLOWED',
          metadata: { sessionId },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Entity Master session successfully revoked.',
      data: {
        contextType: 'PERSONAL',
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Error processing Master logout.' },
      { status: 500 }
    );
  }
}
