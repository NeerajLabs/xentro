import { NextRequest } from 'next/server';
import { getServerMessages, registerSSEListener } from '@/lib/serverMessages';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Send initial full message history immediately upon connecting
      const initialPayload = `data: ${JSON.stringify({
        type: 'init',
        data: getServerMessages(),
      })}\n\n`;
      controller.enqueue(encoder.encode(initialPayload));

      // 2. Register listener for new broadcast messages
      const unregister = registerSSEListener((chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          unregister();
        }
      });

      // 3. Keep-alive heartbeat every 20 seconds to prevent connection drops across proxies/tunnels
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
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    },
  });
}
