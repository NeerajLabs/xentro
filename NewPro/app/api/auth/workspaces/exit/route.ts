import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser, revokeEntitySession, logSecurityAuditEvent } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser(req);
    if ('error' in authResult) {
      return authResult.error;
    }
    const user = authResult.user;

    let sessionId: string | null = null;
    try {
      const body = await req.json();
      sessionId = body.sessionId ? String(body.sessionId).trim() : null;
    } catch (_) {}

    if (sessionId) {
      await revokeEntitySession(sessionId, 'USER_EXIT_TO_PERSONAL');
    }

    await logSecurityAuditEvent({
      actorId: user.id,
      action: 'EXIT_WORKSPACE_TO_PERSONAL',
      outcome: 'ALLOWED',
      metadata: { sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Workspace session revoked. Returned to Personal Account.',
      data: {
        contextType: 'PERSONAL',
        user: {
          id: user.id,
          name: user.fullName,
          email: user.email,
          accountType: user.accountType,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Error exiting workspace.' },
      { status: 500 }
    );
  }
}
