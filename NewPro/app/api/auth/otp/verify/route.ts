import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const code = String(body.code || body.otp || '').trim();
    const purpose = String(body.purpose || '').trim().toUpperCase();
    const challengeId = String(body.challengeId || '').trim();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, message: 'Email and 6-digit verification code required' },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const otpCol = db.collection('otp_codes');

    // Build query conditions
    const query: any = { email };
    if (challengeId) {
      query.challengeId = challengeId;
    }
    if (purpose) {
      query.purpose = purpose;
    }

    const otpRecord = await otpCol.findOne(query, { sort: { createdAt: -1 } });

    if (!otpRecord) {
      return NextResponse.json(
        { success: false, message: 'No active verification challenge found. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check maximum attempts limit (5 attempts)
    if ((otpRecord.attempts || 0) >= 5) {
      return NextResponse.json(
        { success: false, message: 'Too many incorrect attempts. Please request a new verification code.' },
        { status: 429 }
      );
    }

    // Check expiration
    const now = new Date();
    if (otpRecord.expiresAt && new Date(otpRecord.expiresAt) < now) {
      return NextResponse.json(
        { success: false, message: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Check if challenge is already consumed
    if (otpRecord.consumed) {
      return NextResponse.json(
        { success: false, message: 'This verification code has already been consumed.' },
        { status: 400 }
      );
    }

    // Validate 6-digit code
    if (String(otpRecord.code).trim() !== code) {
      await otpCol.updateOne({ _id: otpRecord._id }, { $inc: { attempts: 1 } });
      const remaining = 5 - ((otpRecord.attempts || 0) + 1);
      return NextResponse.json(
        {
          success: false,
          message: `Invalid verification code. ${remaining > 0 ? `${remaining} attempts remaining.` : 'Code locked.'}`,
        },
        { status: 400 }
      );
    }

    // Mark OTP verified
    const nowIso = now.toISOString();
    await otpCol.updateOne(
      { _id: otpRecord._id },
      {
        $set: {
          verified: true,
          verifiedAt: nowIso,
          updatedAt: nowIso,
        },
      }
    );

    // If personal signup, update user account state
    const usersCol = db.collection('users');
    let userDoc: any = null;
    if (!otpRecord.purpose || otpRecord.purpose === 'PERSONAL_SIGNUP') {
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
    }

    userDoc = await usersCol.findOne({ email });

    // Generate authenticated JWT session token for client convenience
    let accessToken: string | null = null;
    if (userDoc) {
      try {
        const { signJwtToken } = await import('@/lib/serverAuth');
        accessToken = signJwtToken({
          sub: userDoc.id || userDoc._id.toString(),
          email: userDoc.email,
          name: userDoc.fullName || userDoc.name || '',
          account_type: userDoc.accountType || 'Explorer',
          active_roles: userDoc.activeRoles || ['Explorer'],
          is_staff: Boolean(userDoc.is_staff),
        });
      } catch (_) {}
    }

    const response = NextResponse.json({
      success: true,
      status: 'verified',
      challengeId: otpRecord.challengeId || challengeId,
      purpose: otpRecord.purpose || purpose,
      email,
      message: 'Email verified successfully.',
      data: {
        verified: true,
        challengeId: otpRecord.challengeId || challengeId,
        purpose: otpRecord.purpose || purpose,
        tokens: accessToken ? { accessToken } : undefined,
        user: userDoc ? {
          id: userDoc.id || userDoc._id.toString(),
          email: userDoc.email,
          fullName: userDoc.fullName || userDoc.name,
          accountType: userDoc.accountType || 'Explorer',
        } : undefined,
      },
    });

    if (accessToken) {
      response.cookies.set('xentro_session', accessToken, {
        path: '/',
        maxAge: 86400,
        sameSite: 'lax',
        httpOnly: true,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Verification error' },
      { status: 500 }
    );
  }
}
