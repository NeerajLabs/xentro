import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { sendZohoEmail } from '@/lib/email/zohoDispatcher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
        if (body.isResend || body.force) {
          const crypto = await import('node:crypto');
          const { hashOtp } = await import('@/lib/serverAuth');
          const resendCode = crypto.randomInt(100000, 1000000).toString();
          const resendHash = hashOtp(resendCode, existingChallenge.challengeId);
          await otpCol.updateOne(
            { _id: existingChallenge._id },
            {
              $set: { codeHash: resendHash, updatedAt: nowIso },
              $unset: { code: '' },
            }
          );
          sendZohoEmail({
            to: email,
            subject: `XENTRO: Verification Code ${resendCode}`,
            text: `Your Xentro verification code is:\n\n${resendCode}\n\nThis verification code will expire in 10 minutes.\n\nWarm regards,\nXENTRO Platform Security`,
          }).catch((err) => console.warn('[OTP Resend] Background dispatch warning:', err));
          console.log(`[OTP Resend] Re-dispatched challenge ${existingChallenge.challengeId} to ${maskEmail(email)}`);
        }

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

    // Generate 6-digit cryptographically secure code and unique challenge reference
    const crypto = await import('node:crypto');
    const { hashOtp } = await import('@/lib/serverAuth');
    const code = crypto.randomInt(100000, 1000000).toString();
    const challengeId = `chal_${now}_${crypto.randomBytes(4).toString('hex')}`;
    const codeHash = hashOtp(code, challengeId);
    const expiresAt = new Date(now + 10 * 60 * 1000).toISOString();
    const resendAvailableAt = new Date(now + 60 * 1000).toISOString();

    // Upsert challenge into MongoDB collection: ZERO plaintext code storage
    await otpCol.updateOne(
      { email, purpose },
      {
        $set: {
          challengeId,
          email,
          purpose,
          codeHash,
          attempts: 0,
          maxAttempts: 5,
          verified: false,
          consumed: false,
          createdAt: nowIso,
          updatedAt: nowIso,
          expiresAt,
          resendAvailableAt,
        },
        $unset: {
          code: '', // Expunge any legacy plaintext code field
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

    // Security compliance: Redact plaintext code from logs
    console.log(`[OTP Dispatch] To: ${masked} | Purpose: ${purpose} | ChallengeId: ${challengeId}`);

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
