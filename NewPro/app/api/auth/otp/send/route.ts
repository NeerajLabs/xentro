import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { sendZohoEmail } from '@/lib/email/zohoDispatcher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';

let cachedClient: MongoClient | null = null;
async function getMongoClient(): Promise<MongoClient> {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }
  return cachedClient;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const entityName = String(body.entityName || body.name || '').trim();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required' },
        { status: 400 }
      );
    }

    // Generate 6-digit secure code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const otpCol = db.collection('otp_codes');

    await otpCol.updateOne(
      { email },
      {
        $set: {
          code,
          expiresAt,
          verified: false,
          updatedAt: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    // Send email via Zoho dispatcher
    try {
      await sendZohoEmail({
        to: email,
        subject: `XENTRO: Verification Code ${code} for ${entityName || 'Entity Account'}`,
        text: `Your Xentro official entity verification code is:\n\n${code}\n\nThis verification code will expire in 10 minutes.\n\nWarm regards,\nXENTRO Platform Security`,
      });
    } catch (mailErr) {
      console.warn('[OTP Send] Zoho email dispatch warning:', mailErr);
    }

    return NextResponse.json({
      success: true,
      message: `Verification code dispatched to ${email}`,
      data: {
        email,
        expiresIn: 600,
      },
    });
  } catch (err: any) {
    console.error('[OTP Send] Error generating OTP:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to dispatch verification code' },
      { status: 500 }
    );
  }
}
