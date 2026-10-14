import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getDatabase } from '@/lib/mongodb';
import {
  extractAuthToken,
  verifyJwtToken,
  resolveAuthoritativeHead,
  logSecurityAuditEvent,
} from '@/lib/serverAuth';
import { sendZohoEmail } from '@/lib/email/zohoDispatcher';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***@***.***';
  const parts = email.split('@');
  const [name, domain] = parts;
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

export function hashOtp(otp: string, challengeId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${otp.trim()}:${challengeId}`)
    .digest('hex');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const officialEmail = String(body.officialEmail || body.email || '').trim().toLowerCase();

    if (!officialEmail || !officialEmail.includes('@')) {
      return NextResponse.json(
        { success: false, message: 'Official Entity Email is required.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const usersCol = db.collection('users');
    const challengesCol = db.collection('entity_master_challenges');

    // 1. Authoritative lookup: Official Email -> Entity
    const entity = await entitiesCol.findOne({
      officialEmail: { $regex: `^${officialEmail}$`, $options: 'i' },
    });

    // Account Enumeration Defense:
    // If entity does not exist, return a generic challenge response so attackers cannot probe for registered emails.
    if (!entity) {
      const dummyChallengeId = `emc_enum_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
      return NextResponse.json({
        success: true,
        status: 'dual_otp_required',
        challengeId: dummyChallengeId,
        maskedEntityEmail: maskEmail(officialEmail),
        maskedHeadEmail: '***@***.***',
        expiresIn: 600,
        message: 'If this entity is registered and active, dual verification codes have been dispatched.',
      });
    }

    // 2. Check entity status
    if (entity.is_deleted === true || entity.deleted === true || entity.status === 'DELETED') {
      return NextResponse.json(
        { success: false, message: 'This organization account has been deleted or deactivated.' },
        { status: 403 }
      );
    }

    // 3. Resolve authoritative current Head
    const headRes = resolveAuthoritativeHead(entity);
    if (headRes.conflictError) {
      await logSecurityAuditEvent({
        entityId: entity.id,
        action: 'ENTITY_MASTER_LOGIN_CHALLENGE',
        outcome: 'DENIED',
        metadata: { reason: headRes.conflictError, officialEmail },
      });
      return NextResponse.json(
        { success: false, message: headRes.conflictError },
        { status: 409 }
      );
    }

    const headUserId = headRes.headUserId!;

    // 4. Validate Head identity binding if personal session is active
    const callerToken = extractAuthToken(req);
    if (callerToken) {
      const callerPayload = verifyJwtToken(callerToken);
      if (callerPayload && callerPayload.sub) {
        if (callerPayload.sub !== headUserId) {
          await logSecurityAuditEvent({
            entityId: entity.id,
            actorId: callerPayload.sub,
            action: 'ENTITY_MASTER_LOGIN_CHALLENGE',
            outcome: 'DENIED',
            metadata: {
              reason: 'Active personal session user does not match the registered Entity Head.',
              expectedHeadId: headUserId,
              callerId: callerPayload.sub,
            },
          });
          return NextResponse.json(
            {
              success: false,
              message:
                'Access denied. Active personal account does not match the governing Entity Head for this organization.',
              code: 'HEAD_IDENTITY_MISMATCH',
            },
            { status: 403 }
          );
        }
      }
    }

    // 5. Query Head's verified personal email from users collection
    const headUser = await usersCol.findOne({
      $or: [{ id: headUserId }, { _id: headUserId }],
    } as any);

    if (!headUser || !headUser.email) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Entity Head personal account record or verified email not found. Master login cannot proceed.',
        },
        { status: 403 }
      );
    }

    const headPersonalEmail = String(headUser.email).trim().toLowerCase();

    // 6. Generate independent Dual-OTP verifiers
    // OTP 1: Entity Official Email
    // OTP 2: Head Verified Personal Email
    const otp1 = Math.floor(100000 + Math.random() * 900000).toString();
    const otp2 = Math.floor(100000 + Math.random() * 900000).toString();

    const now = new Date();
    const challengeId = `emc_${now.getTime()}_${crypto.randomBytes(8).toString('hex')}`;
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const otp1Hash = hashOtp(otp1, challengeId);
    const otp2Hash = hashOtp(otp2, challengeId);

    // 7. Store challenge with HASHED OTPs in MongoDB
    // CRITICAL SECURITY RULE: Plaintext OTP verifiers are NEVER stored in MongoDB!
    await challengesCol.insertOne({
      challengeId,
      entityId: entity.id,
      officialEmail,
      headUserId,
      headPersonalEmail,
      purpose: 'ENTITY_MASTER_LOGIN',
      otp1Hash,
      otp2Hash,
      attempts: 0,
      resends: 0,
      status: 'PENDING',
      consumed: false,
      createdAt: now.toISOString(),
      expiresAt,
    });

    // 8. Dispatch OTP 1 to Official Email and OTP 2 to Head's Personal Email via Zoho SMTP
    const entitySubject = `XENTRO: Entity Official Login Code [${otp1}]`;
    const entityText = `Hello,\n\nA Master Login request was initiated for ${entity.name || 'your entity'}.\n\nEntity Official Verification Code (OTP 1): ${otp1}\n\nThis code expires in 10 minutes.\nIf you did not initiate this request, please contact platform security immediately.\n\nWarm regards,\nXENTRO Security`;

    const headSubject = `XENTRO: Entity Head Verification Code [${otp2}]`;
    const headText = `Hello ${headUser.fullName || 'Entity Head'},\n\nA Master Login request was initiated for ${entity.name || 'your entity'}.\n\nGoverning Head Personal Verification Code (OTP 2): ${otp2}\n\nThis code expires in 10 minutes.\n\nWarm regards,\nXENTRO Security`;

    try {
      await Promise.allSettled([
        sendZohoEmail({ to: officialEmail, subject: entitySubject, text: entityText }),
        sendZohoEmail({ to: headPersonalEmail, subject: headSubject, text: headText }),
      ]);
    } catch (mailErr) {
      console.warn('[EntityChallenge] Email dispatch background warning:', mailErr);
    }

    await logSecurityAuditEvent({
      entityId: entity.id,
      actorId: headUserId,
      action: 'ENTITY_MASTER_CHALLENGE_ISSUED',
      outcome: 'ALLOWED',
      metadata: {
        challengeId,
        officialEmailMasked: maskEmail(officialEmail),
        headPersonalEmailMasked: maskEmail(headPersonalEmail),
      },
    });

    return NextResponse.json({
      success: true,
      status: 'dual_otp_required',
      challengeId,
      entityId: entity.id,
      entityName: entity.name,
      maskedEntityEmail: maskEmail(officialEmail),
      maskedHeadEmail: maskEmail(headPersonalEmail),
      expiresIn: 600,
      message: `Dual verification codes sent to Entity mailbox (${maskEmail(officialEmail)}) and Head personal mailbox (${maskEmail(headPersonalEmail)}).`,
    });
  } catch (err: any) {
    console.error('[EntityChallenge] Error generating dual OTP challenge:', err);
    return NextResponse.json(
      { success: false, message: 'Server error processing Master Login challenge.' },
      { status: 500 }
    );
  }
}
