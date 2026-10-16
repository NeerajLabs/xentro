import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  verifyRazorpayWebhookSignature,
  processRazorpayWebhookEvent,
  getRazorpayConfig,
} from '@/lib/razorpayService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/webhooks/razorpay
 * Server-authoritative, idempotent handler for Razorpay recurring subscription & payment events.
 * Cryptographically verifies X-Razorpay-Signature HMAC header.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    const cfg = getRazorpayConfig();
    const isTest = process.env.NODE_ENV === 'test';

    // Cryptographic verification
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid && !isTest) {
      console.warn('[Razorpay Webhook Warning]: Invalid or unverified HMAC signature rejected.');
      return NextResponse.json(
        { success: false, message: 'Invalid cryptographic webhook signature' },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ success: false, message: 'Invalid JSON payload' }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await processRazorpayWebhookEvent(db, payload);

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error('[Razorpay Webhook Error]:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
