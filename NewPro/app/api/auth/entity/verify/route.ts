import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getDatabase } from '@/lib/mongodb';
import {
  extractAuthToken,
  verifyJwtToken,
  resolveAuthoritativeHead,
  issueEntityMasterGrant,
  logSecurityAuditEvent,
  hashOtp,
} from '@/lib/serverAuth';


export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const challengeId = String(body.challengeId || '').trim();
    const otp1 = String(body.otp1 || body.entityOtp || '').trim();
    const otp2 = String(body.otp2 || body.headOtp || '').trim();

    if (!challengeId || !otp1 || !otp2) {
      return NextResponse.json(
        {
          success: false,
          message: 'Challenge ID, Entity Verification Code (OTP 1), and Head Verification Code (OTP 2) are required.',
        },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const challengesCol = db.collection('entity_master_challenges');
    const entitiesCol = db.collection('entities');
    const usersCol = db.collection('users');

    // 1. Authoritative challenge lookup
    const challenge = await challengesCol.findOne({ challengeId });
    if (!challenge) {
      return NextResponse.json(
        { success: false, message: 'Invalid or unrecognized Master Login challenge. Please request new codes.' },
        { status: 400 }
      );
    }

    // 2. Consumption check
    if (challenge.consumed === true || challenge.status === 'CONSUMED') {
      await logSecurityAuditEvent({
        entityId: challenge.entityId,
        actorId: challenge.headUserId,
        action: 'ENTITY_MASTER_VERIFY_REPLAY_ATTEMPT',
        outcome: 'DENIED',
        metadata: { challengeId, reason: 'Attempt to reuse previously consumed challenge' },
      });
      return NextResponse.json(
        {
          success: false,
          message: 'This Master Login challenge has already been consumed. Replay rejected.',
          code: 'CHALLENGE_ALREADY_CONSUMED',
        },
        { status: 409 }
      );
    }

    // 3. Expiration check
    const now = new Date();
    if (challenge.expiresAt && new Date(challenge.expiresAt) < now) {
      await challengesCol.updateOne(
        { _id: challenge._id },
        { $set: { status: 'EXPIRED', updatedAt: now.toISOString() } }
      );
      return NextResponse.json(
        { success: false, message: 'Master Login challenge has expired. Please initiate login again.' },
        { status: 400 }
      );
    }

    // 4. Maximum attempts check (max 5)
    if ((challenge.attempts || 0) >= 5) {
      await challengesCol.updateOne(
        { _id: challenge._id },
        { $set: { status: 'LOCKED', updatedAt: now.toISOString() } }
      );
      return NextResponse.json(
        {
          success: false,
          message: 'Too many incorrect verification attempts. Master Login challenge locked.',
          code: 'MAX_ATTEMPTS_EXCEEDED',
        },
        { status: 429 }
      );
    }

    // 5. Head identity binding validation if active personal session present
    const callerToken = extractAuthToken(req);
    if (callerToken) {
      const callerPayload = verifyJwtToken(callerToken);
      if (callerPayload && callerPayload.sub && callerPayload.sub !== challenge.headUserId) {
        await logSecurityAuditEvent({
          entityId: challenge.entityId,
          actorId: callerPayload.sub,
          action: 'ENTITY_MASTER_VERIFY_MISMATCH',
          outcome: 'DENIED',
          metadata: {
            reason: 'Active personal session user does not match challenge headUserId.',
            callerId: callerPayload.sub,
            expectedHeadId: challenge.headUserId,
          },
        });
        return NextResponse.json(
          {
            success: false,
            message: 'Active personal account does not match the registered Entity Head.',
            code: 'HEAD_IDENTITY_MISMATCH',
          },
          { status: 403 }
        );
      }
    }

    // 6. Verify Hashed OTPs independently
    const expectedOtp1Hash = hashOtp(otp1, challengeId);
    const expectedOtp2Hash = hashOtp(otp2, challengeId);

    const validOtp1 = expectedOtp1Hash === challenge.otp1Hash;
    const validOtp2 = expectedOtp2Hash === challenge.otp2Hash;

    if (!validOtp1 || !validOtp2) {
      const newAttempts = (challenge.attempts || 0) + 1;
      await challengesCol.updateOne(
        { _id: challenge._id },
        { $inc: { attempts: 1 }, $set: { updatedAt: now.toISOString() } }
      );

      const remaining = Math.max(0, 5 - newAttempts);
      let errorDetail = 'Invalid verification codes.';
      if (!validOtp1 && !validOtp2) {
        errorDetail = 'Both Entity Official code and Head Personal code are incorrect.';
      } else if (!validOtp1) {
        errorDetail = 'Entity Official Verification Code (OTP 1) is incorrect.';
      } else {
        errorDetail = 'Governing Head Personal Verification Code (OTP 2) is incorrect.';
      }

      await logSecurityAuditEvent({
        entityId: challenge.entityId,
        actorId: challenge.headUserId,
        action: 'ENTITY_MASTER_OTP_FAILURE',
        outcome: 'FAILED',
        metadata: {
          challengeId,
          attempts: newAttempts,
          validOtp1,
          validOtp2,
        },
      });

      return NextResponse.json(
        {
          success: false,
          message: `${errorDetail} ${remaining > 0 ? `${remaining} attempts remaining.` : 'Challenge locked.'}`,
          attemptsRemaining: remaining,
        },
        { status: 400 }
      );
    }

    // 7. Atomic Consumption using findOneAndUpdate to prevent race conditions / concurrent replay
    const consumptionResult = await challengesCol.findOneAndUpdate(
      {
        _id: challenge._id,
        status: 'PENDING',
        consumed: false,
      },
      {
        $set: {
          status: 'CONSUMED',
          consumed: true,
          consumedAt: now.toISOString(),
          updatedAt: now.toISOString(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!consumptionResult) {
      return NextResponse.json(
        { success: false, message: 'Challenge was concurrently consumed or invalidated.' },
        { status: 409 }
      );
    }

    // 8. Authoritative Head Authority Re-verification
    // Ensure the Head has not changed or been revoked in MongoDB since the challenge was initiated
    const entity = await entitiesCol.findOne({ id: challenge.entityId });
    if (!entity) {
      return NextResponse.json(
        { success: false, message: 'Target entity no longer exists.' },
        { status: 404 }
      );
    }

    const headRes = resolveAuthoritativeHead(entity);
    if (headRes.conflictError || headRes.headUserId !== challenge.headUserId) {
      await logSecurityAuditEvent({
        entityId: challenge.entityId,
        actorId: challenge.headUserId,
        action: 'ENTITY_MASTER_HEAD_CHANGED_DURING_LOGIN',
        outcome: 'DENIED',
        metadata: {
          challengeHeadUserId: challenge.headUserId,
          currentHeadUserId: headRes.headUserId,
        },
      });
      return NextResponse.json(
        {
          success: false,
          message: 'Governing Head authority has changed or is in conflict. Master access denied.',
          code: 'HEAD_AUTHORITY_CHANGED',
        },
        { status: 403 }
      );
    }

    const headUser = await usersCol.findOne({
      $or: [{ id: challenge.headUserId }, { _id: challenge.headUserId }],
    });

    // 9. Issue ENTITY_MASTER session grant
    const grant = await issueEntityMasterGrant(
      challenge.headUserId,
      challenge.entityId,
      challenge.headPersonalEmail,
      12 // 12-hour session lease
    );

    await logSecurityAuditEvent({
      entityId: challenge.entityId,
      actorId: challenge.headUserId,
      action: 'ENTITY_MASTER_LOGIN_SUCCESS',
      outcome: 'ALLOWED',
      metadata: {
        sessionId: grant.sessionId,
        expiresAt: grant.expiresAt,
      },
    });

    const entType = (entity.entityType || 'STARTUP').toUpperCase();
    let canonicalType: 'Startup' | 'Investor Organization' | 'ESP' | 'Institution' = 'Startup';
    if (entType.includes('INVESTOR') || entType.includes('VC')) {
      canonicalType = 'Investor Organization';
    } else if (entType.includes('ESP') || entType.includes('INCUBATOR')) {
      canonicalType = 'ESP';
    } else if (entType.includes('INSTITUT')) {
      canonicalType = 'Institution';
    }

    const dashboardDestination =
      canonicalType === 'Startup'
        ? '/?tab=dashboard'
        : `/${canonicalType.toLowerCase().replace(/\s+/g, '-')}/dashboard`;

    return NextResponse.json({
      success: true,
      message: 'Dual-OTP verified. Entity Master session established.',
      data: {
        contextType: 'ENTITY_MASTER',
        token: grant.token,
        sessionId: grant.sessionId,
        expiresAt: grant.expiresAt,
        entity: {
          id: entity.id,
          name: entity.name,
          officialEmail: entity.officialEmail,
          entityType: canonicalType,
          role: canonicalType === 'Startup' ? 'Founder / Head' : 'Managing Partner / Head',
          dashboardUrl: dashboardDestination,
          profileUrl: '/?tab=profile',
          feedUrl: '/?tab=feed',
          isHead: true,
        },
        user: {
          id: challenge.headUserId,
          fullName: headUser?.fullName || 'Entity Head',
          email: challenge.headPersonalEmail,
        },
      },
    });
  } catch (err: any) {
    console.error('[EntityVerify] Error in Master Login verification:', err);
    return NextResponse.json(
      { success: false, message: 'Server error verifying Master Login codes.' },
      { status: 500 }
    );
  }
}
