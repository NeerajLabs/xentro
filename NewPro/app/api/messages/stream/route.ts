import { NextRequest, NextResponse } from 'next/server';
import { registerSSEListener } from '@/lib/serverMessages';
import { requireServerAuth } from '@/lib/serverAuth';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  // 1. Mandatory server-side authentication
  const authResult = await requireServerAuth(req);
  if ('error' in authResult) {
    return authResult.error;
  }
  const user = authResult.user;

  // 2. Resolve all authorized IDs (personal user ID + owned/member entity IDs)
  const authorizedIds: string[] = [user.id];
  try {
    const db = await getDatabase();
    const entities = await db
      .collection('entities')
      .find({
        $or: [
          { primaryOwnerId: user.id },
          { createdByUserId: user.id },
          { 'members.userId': user.id },
        ],
        status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
      })
      .project({ id: 1, entityId: 1 })
      .toArray();

    entities.forEach((ent: any) => {
      if (ent.id) authorizedIds.push(ent.id);
      if (ent.entityId) authorizedIds.push(ent.entityId);
    });
  } catch (err) {
    console.warn('[SSE] Could not resolve entity IDs for user:', user.id, err);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 3. Send authenticated connection confirmation (no global message history dump!)
      const initialPayload = `data: ${JSON.stringify({
        type: 'connected',
        data: { userId: user.id, status: 'active' },
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // 4. Register strictly scoped listener for this user's authorized IDs
      const unregister = registerSSEListener((chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          unregister();
        }
      }, authorizedIds);

      // 5. Keep-alive heartbeat every 20 seconds to prevent connection drops across proxies/tunnels
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch {
          clearInterval(heartbeatInterval);
          unregister();
        }
      }, 20000);

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        unregister();
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
