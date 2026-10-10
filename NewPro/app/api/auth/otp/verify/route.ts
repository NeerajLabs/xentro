import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

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
    const email = (body.email || '').trim().toLowerCase();
    const code = (body.code || body.otp || '').trim();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and 6-digit verification code required' },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const otpCol = db.collection('otp_codes');

    const otpRecord = await otpCol.findOne({
      email,
      code,
    });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid verification code.' },
        { status: 400 }
      );
    }

    const now = new Date();
    if (otpRecord.expiresAt && new Date(otpRecord.expiresAt) < now) {
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Mark OTP verified
    await otpCol.updateOne({ _id: otpRecord._id }, { $set: { verified: true } });

    // Mark User emailVerified
    const usersCol = db.collection('users');
    const nowIso = now.toISOString();
    await usersCol.updateOne(
      { email },
      {
        $set: {
          emailVerified: true,
          accountStatus: 'PROFILE_SETUP_PENDING',
          updatedAt: nowIso,
        },
      }
    );

    const user = await usersCol.findOne({ email });

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        verified: true,
        user: user || undefined,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Verification error' },
      { status: 500 }
    );
  }
}
