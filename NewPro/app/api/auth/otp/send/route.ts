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

function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const entityName = String(body.entityName || body.name || '').trim();
    const rawPurpose = String(body.purpose || '').trim().toUpperCase();

    // Map or infer valid purpose
    let purpose = rawPurpose;
    if (!purpose) {
      if (body.entityType === 'INVESTOR_ORG' || entityName.toLowerCase().includes('capital') || entityName.toLowerCase().includes('fund')) {
        purpose = 'INVESTOR_ORG_EMAIL_VERIFICATION';
      } else if (entityName) {
        purpose = 'STARTUP_EMAIL_VERIFICATION';
      } else {
        purpose = 'PERSONAL_SIGNUP';
      }
    }

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Valid email address is required' },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const otpCol = db.collection('otp_codes');

    const now = Date.now();
    const nowIso = new Date(now).toISOString();

    // Check resend cooldown (60 seconds)
    const existingChallenge = await otpCol.findOne({
      email,
      purpose,
      verified: false,
      consumed: false,
    });

    // If challenge is active, unexpired, and in resend cooldown (60 seconds):
    // Return HTTP 200 with active challengeId so the UI immediately advances to the OTP screen!
    if (existingChallenge && !existingChallenge.verified && !existingChallenge.consumed) {
      const isUnexpired = existingChallenge.expiresAt && new Date(existingChallenge.expiresAt).getTime() > now;
      const isCooldown = existingChallenge.resendAvailableAt && new Date(existingChallenge.resendAvailableAt).getTime() > now;

      if (isUnexpired && isCooldown) {
        const waitSeconds = Math.ceil((new Date(existingChallenge.resendAvailableAt).getTime() - now) / 1000);
        return NextResponse.json(
          {
            success: true,
            status: 'otp_required',
            challengeId: existingChallenge.challengeId,
            purpose,
            email,
            maskedEmail: maskEmail(email),
            resendAvailableAt: existingChallenge.resendAvailableAt,
            cooldownSeconds: waitSeconds,
            message: `Verification code already sent to ${maskEmail(email)}. Please enter it below.`,
            data: {
              email,
              maskedEmail: maskEmail(email),
              challengeId: existingChallenge.challengeId,
              purpose,
              expiresIn: Math.ceil((new Date(existingChallenge.expiresAt).getTime() - now) / 1000),
            },
          },
          { status: 200 }
        );
      }
    }

    // Generate 6-digit secure code and unique challenge reference
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const challengeId = `chal_${now}_${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();
    const resendAvailableAt = new Date(now + 60 * 1000).toISOString();

    // Upsert challenge into MongoDB collection
    await otpCol.updateOne(
      { email, purpose },
      {
        $set: {
          challengeId,
          email,
          purpose,
          code,
          attempts: 0,
          maxAttempts: 5,
          verified: false,
          consumed: false,
          createdAt: nowIso,
          updatedAt: nowIso,
          expiresAt,
          resendAvailableAt,
        },
      },
      { upsert: true }
    );

    const masked = maskEmail(email);

    // Purpose-aware subject and body
    let subject = `XENTRO: Verification Code ${code}`;
    let purposeLabel = 'Verification';
    if (purpose === 'MENTOR_CONVERSION') {
      subject = `XENTRO: Mentor Upgrade Code ${code}`;
      purposeLabel = 'Mentor Account Upgrade';
    } else if (purpose === 'INDIVIDUAL_INVESTOR_CONVERSION') {
      subject = `XENTRO: Individual Investor Upgrade Code ${code}`;
      purposeLabel = 'Individual Investor Account Upgrade';
    } else if (purpose === 'STARTUP_EMAIL_VERIFICATION') {
      subject = `XENTRO: Official Entity Code ${code} for ${entityName || 'Startup'}`;
      purposeLabel = `Official Startup Verification for ${entityName || 'Startup'}`;
    } else if (purpose === 'INVESTOR_ORG_EMAIL_VERIFICATION') {
      subject = `XENTRO: Organization Verification Code ${code} for ${entityName || 'Investor Org'}`;
      purposeLabel = `Investor Organization Verification for ${entityName || 'Investor Org'}`;
    }

    const emailText = `Your Xentro 6-digit ${purposeLabel} code is:\n\n${code}\n\nThis verification code will expire in 10 minutes.\nIf you did not request this verification, please ignore this email.\n\nWarm regards,\nXENTRO Platform Security`;

    // Dispatch email reliably without blocking the API response
    // We race with a 1500ms timeout so responsive users/mobile devices are never stuck on "Sending Code..."
    try {
      await Promise.race([
        sendZohoEmail({
          to: email,
          subject,
          text: emailText,
        }),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch (mailErr) {
      console.warn('[OTP Send] Zoho email dispatch background warning:', mailErr);
    }

    return NextResponse.json({
      success: true,
      status: 'otp_required',
      challengeId,
      purpose,
      email,
      maskedEmail: masked,
      expiresAt,
      resendAvailableAt,
      message: `Verification code dispatched to ${masked}`,
      data: {
        email,
        maskedEmail: masked,
        challengeId,
        purpose,
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
