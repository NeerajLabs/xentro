import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getDatabase } from '@/lib/mongodb';

export interface VerifiedAuthUser {
  id: string;
  email: string;
  fullName: string;
  accountType: string;
  isActive: boolean;
  activeRoles?: string[];
}

export interface EntityAuthorizationResult {
  entity: any;
  membership: any | null;
  isHead: boolean;
  role: string;
  permissions: string[];
}

const JWT_SECRET = process.env.JWT_SECRET || 'xentro-jwt-access-secret-2026-sha256-key';

/**
 * Validates HS256 JWT signature and payload expiry using native Node.js crypto.
 * Zero external npm dependencies.
 */
export function verifyJwtToken(token: string): { sub: string; email?: string; [key: string]: any } | null {
  if (!token || typeof token !== 'string') return null;

  let cleaned = token.trim();
  if (cleaned.startsWith('Bearer ')) {
    cleaned = cleaned.substring(7).trim();
  }
  if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  const parts = cleaned.split('.');
  if (parts.length !== 3) return null;

  const [headerB64, payloadB64, signatureB64] = parts;

  try {
    // 1. Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signatureB64);
    const expSigBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return null;
    }

    // 2. Parse payload
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    // 3. Verify expiry
    if (payload.exp && typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (nowSec > payload.exp) {
        return null; // Expired
      }
    }

    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Extracts session token from Authorization header or HttpOnly/Lax cookie.
 */
export function extractAuthToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7).trim();
  }

  const sessionCookie = req.cookies.get('xentro_session')?.value;
  if (sessionCookie) {
    return sessionCookie.trim();
  }

  return null;
}

/**
 * Server-side identity guard:
 * Cryptographically verifies token and resolves active user from MongoDB `users`.
 */
export async function requireAuthenticatedUser(
  req: NextRequest
): Promise<{ user: VerifiedAuthUser } | { error: NextResponse }> {
  const token = extractAuthToken(req);

  if (!token) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Authentication required. Missing session credentials.' },
        { status: 401 }
      ),
    };
  }

  const payload = verifyJwtToken(token);
  if (!payload || !payload.sub) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Invalid or expired session credentials. Please sign in again.' },
        { status: 401 }
      ),
    };
  }

  try {
    const db = await getDatabase();
    const usersCol = db.collection('users');

    const query: any[] = [{ id: payload.sub }, { _id: payload.sub }];
    if (payload.email) {
      query.push({ email: payload.email.toLowerCase() });
    }

    const userDoc = await usersCol.findOne({ $or: query });

    if (!userDoc) {
      return {
        error: NextResponse.json(
          { success: false, message: 'Authenticated user account not found.' },
          { status: 401 }
        ),
      };
    }

    if (userDoc.isActive === false || userDoc.status === 'SUSPENDED') {
      return {
        error: NextResponse.json(
          { success: false, message: 'Your account has been suspended. Please contact platform support.' },
          { status: 403 }
        ),
      };
    }

    const verifiedUser: VerifiedAuthUser = {
      id: userDoc.id || String(userDoc._id),
      email: userDoc.email || payload.email || '',
      fullName: userDoc.fullName || userDoc.name || 'Member',
      accountType: userDoc.accountType || userDoc.primaryRole || 'Explorer',
      isActive: userDoc.isActive !== false,
      activeRoles: userDoc.activeRoles || [],
    };

    return { user: verifiedUser };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Database error validating session.' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Entity authorization guard:
 * Validates that the authenticated user is either the authoritative Entity Head
 * or holds an ACTIVE, non-suspended membership in the target organization.
 */
export async function requireActiveEntityMembership(
  userId: string,
  entityId: string
): Promise<EntityAuthorizationResult | { error: NextResponse }> {
  if (!userId || !entityId) {
    return {
      error: NextResponse.json(
        { success: false, message: 'User identification and entity ID are required.' },
        { status: 400 }
      ),
    };
  }

  try {
    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const membershipsCol = db.collection('memberships');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return {
        error: NextResponse.json(
          { success: false, message: 'Target entity organization not found.' },
          { status: 404 }
        ),
      };
    }

    if (entity.is_deleted === true || entity.deleted === true || entity.status === 'DELETED') {
      return {
        error: NextResponse.json(
          { success: false, message: 'This organization account has been deleted or deactivated.' },
          { status: 403 }
        ),
      };
    }

    // 1. Check if user is authoritative governing Entity Head
    const isHead =
      entity.currentOwnerUserId === userId ||
      entity.primaryOwnerId === userId ||
      entity.createdByUserId === userId;

    // 2. Query authoritative membership in MongoDB
    const membership = await membershipsCol.findOne({
      entityId,
      $or: [{ userId }, { userEmail: entity.officialEmail }],
    });

    // Check membership lifecycle states
    if (membership) {
      const status = String(membership.status || '').toUpperCase();
      if (status === 'SUSPENDED' || status === 'REVOKED') {
        return {
          error: NextResponse.json(
            {
              success: false,
              message: `Your membership in organization "${entityId}" is ${status.toLowerCase()}. Access denied.`,
            },
            { status: 403 }
          ),
        };
      }
      if (status === 'PENDING' && !isHead) {
        return {
          error: NextResponse.json(
            {
              success: false,
              message: `Membership in organization "${entityId}" is pending acceptance. Operational access denied.`,
            },
            { status: 403 }
          ),
        };
      }
    }

    if (!membership && !isHead) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: `Access denied. You do not hold an authorized active membership in organization "${entityId}".`,
          },
          { status: 403 }
        ),
      };
    }

    const assignedRole =
      membership?.role ||
      (isHead ? (entity.entityType === 'INVESTOR_ORG' ? 'Managing Partner' : 'Founder') : 'Viewer');

    const permissions: string[] = isHead
      ? ['OWNER', 'ADMIN', 'MANAGE_TEAM', 'MANAGE_DOCS', 'MANAGE_FINANCE']
      : Array.isArray(membership?.permissions)
      ? membership.permissions
      : ['VIEW_ONLY'];

    return {
      entity,
      membership,
      isHead,
      role: assignedRole,
      permissions,
    };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Database error evaluating organizational authorization.' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Sanitized security audit logger for consequential or denied operations.
 * Redacts OTP codes, credentials, and confidential contents.
 */
export async function logSecurityAuditEvent(event: {
  entityId?: string;
  actorId?: string;
  action: string;
  outcome: 'ALLOWED' | 'DENIED' | 'FAILED';
  resourceId?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const db = await getDatabase();
    const auditCol = db.collection('audit_logs');

    // Deep sanitize metadata to remove passwords, OTPs, or auth headers
    const sanitizedMeta = { ...(event.metadata || {}) };
    delete sanitizedMeta.password;
    delete sanitizedMeta.otp;
    delete sanitizedMeta.token;
    delete sanitizedMeta.secret;
    delete sanitizedMeta.authorization;

    await auditCol.insertOne({
      id: `sec_aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      entityId: event.entityId || null,
      actorId: event.actorId || 'ANONYMOUS',
      action: event.action,
      outcome: event.outcome,
      resourceId: event.resourceId || null,
      metadata: sanitizedMeta,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SecurityAudit] Failed to record audit event:', err);
  }
}
