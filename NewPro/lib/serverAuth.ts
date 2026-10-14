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

export interface EntitySessionRecord {
  sessionId: string;
  userId: string;
  entityId: string;
  contextType: 'ENTITY_MASTER' | 'ENTITY_WORKSPACE';
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  headUserId?: string;
  membershipId?: string;
  role?: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
  revocationReason?: string | null;
  authorizationVersion: number;
}

export interface EntityMasterAuthResult {
  user: VerifiedAuthUser;
  entity: any;
  session: EntitySessionRecord;
  isHead: boolean;
}

export interface EntityWorkspaceAuthResult {
  user: VerifiedAuthUser;
  entity: any;
  membership: any;
  session: EntitySessionRecord;
  role: string;
  permissions: string[];
}

const JWT_SECRET = process.env.JWT_SECRET || 'xentro-jwt-access-secret-2026-sha256-key';

/**
 * Generates an HS256 cryptographically signed JWT token.
 */
export function signJwtToken(payload: Record<string, any>, expiresInSec: number = 3600): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const nowSec = Math.floor(Date.now() / 1000);
  const fullPayload = {
    ...payload,
    iat: nowSec,
    exp: nowSec + expiresInSec,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${headerB64}.${payloadB64}`)
    .digest('base64url');

  return `${headerB64}.${payloadB64}.${signature}`;
}

/**
 * Hashes an OTP with a challenge ID using SHA-256 for secure verification.
 */
export function hashOtp(otp: string, challengeId: string): string {
  return crypto
    .createHash('sha256')
    .update(`${otp.trim()}:${challengeId}`)
    .digest('hex');
}


/**
 * Resolves the authoritative governing Head User ID for an entity.
 * Fails closed if legacy owner fields disagree.
 */
export function resolveAuthoritativeHead(entity: any): { headUserId: string | null; conflictError?: string } {
  if (!entity) return { headUserId: null, conflictError: 'Entity not found.' };

  const currentOwner = (entity.currentOwnerUserId || '').trim();
  const primaryOwner = (entity.primaryOwnerId || '').trim();

  if (currentOwner && primaryOwner && currentOwner !== primaryOwner) {
    return {
      headUserId: null,
      conflictError: `Data inconsistency detected: currentOwnerUserId (${currentOwner}) and primaryOwnerId (${primaryOwner}) disagree. Master access denied pending administrative review.`,
    };
  }

  const headUserId = currentOwner || primaryOwner || null;
  if (!headUserId) {
    return {
      headUserId: null,
      conflictError: 'No authoritative Head identifier assigned to this organization.',
    };
  }

  return { headUserId };
}

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
    // 1. Verify Header and Algorithm
    const headerJson = Buffer.from(headerB64, 'base64url').toString('utf8');
    const header = JSON.parse(headerJson);
    if (header.alg !== 'HS256') {
      return null; // Reject algorithm confusion (e.g. 'none', RS256)
    }

    // 2. Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${headerB64}.${payloadB64}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signatureB64);
    const expSigBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
      return null;
    }

    // 3. Parse payload
    const payloadJson = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson);

    // 4. Strictly reject refresh tokens
    if (payload.type === 'refresh') {
      return null;
    }

    // 5. Verify expiry
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
      const status = String(membership.status || '').toUpperCase().trim();
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
      if (['PENDING', 'INVITED', 'PENDING_ACCEPTANCE', 'PENDING_APPROVAL'].includes(status) && !isHead) {
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
      // If legacy status 'APPROVED', verify it was actually accepted or is initial governing membership
      if (status === 'APPROVED' && !isHead) {
        const isAccepted = membership.isAccepted === true || membership.accepted === true || Boolean(membership.acceptedAt);
        if (!isAccepted) {
          return {
            error: NextResponse.json(
              {
                success: false,
                message: `Invitation approved by administrator but pending acceptance by member. Operational access denied.`,
              },
              { status: 403 }
            ),
          };
        }
      }
      if (status !== 'ACTIVE' && status !== 'APPROVED' && !isHead) {
        return {
          error: NextResponse.json(
            {
              success: false,
              message: `Membership in organization "${entityId}" is not canonically active. Access denied.`,
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
export async function logSecurityAuditEvent(
  eventOrAction:
    | string
    | {
        entityId?: string;
        actorId?: string;
        action: string;
        outcome?: 'ALLOWED' | 'DENIED' | 'FAILED' | string;
        resourceId?: string;
        metadata?: Record<string, any>;
      },
  outcomeOrLevel?: string,
  extraMeta?: Record<string, any>
) {
  try {
    const db = await getDatabase();
    const auditCol = db.collection('audit_logs');

    let action = '';
    let outcome = 'INFO';
    let entityId: string | null = null;
    let actorId = 'ANONYMOUS';
    let resourceId: string | null = null;
    let metadata: Record<string, any> = {};

    if (typeof eventOrAction === 'string') {
      action = eventOrAction;
      outcome = outcomeOrLevel || 'INFO';
      metadata = extraMeta || {};
      entityId = metadata.entityId || null;
      actorId = metadata.userId || metadata.actorId || 'ANONYMOUS';
      resourceId = metadata.resourceId || null;
    } else {
      action = eventOrAction.action;
      outcome = eventOrAction.outcome || 'ALLOWED';
      entityId = eventOrAction.entityId || null;
      actorId = eventOrAction.actorId || 'ANONYMOUS';
      resourceId = eventOrAction.resourceId || null;
      metadata = eventOrAction.metadata || {};
    }

    // Deep sanitize metadata to remove passwords, OTPs, or auth headers
    const sanitizedMeta = { ...metadata };
    delete sanitizedMeta.password;
    delete sanitizedMeta.otp;
    delete sanitizedMeta.token;
    delete sanitizedMeta.secret;
    delete sanitizedMeta.authorization;

    await auditCol.insertOne({
      id: `sec_aud_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      entityId,
      actorId,
      action,
      outcome,
      resourceId,
      metadata: sanitizedMeta,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('[SecurityAudit] Failed to record audit event:', err);
  }
}

/**
 * Phase 2 — Entity Master Access Guard.
 * Strictly verifies that caller possesses an ACTIVE ENTITY_MASTER session,
 * bound to the target organization's authoritative governing Head.
 */
export async function requireEntityMasterContext(
  req: NextRequest,
  targetEntityId?: string
): Promise<EntityMasterAuthResult | { error: NextResponse }> {
  const token = extractAuthToken(req);
  if (!token) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Authentication required. Missing Entity Master session credentials.' },
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

  // 1. Enforce ENTITY_MASTER context claim
  if (payload.context !== 'ENTITY_MASTER') {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Access denied. Verified Entity Master session is required for this operation.',
          code: 'ENTITY_MASTER_REQUIRED',
        },
        { status: 403 }
      ),
    };
  }

  const sessionId = payload.sessionId;
  if (!sessionId) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Invalid session structure. Missing sessionId.' },
        { status: 401 }
      ),
    };
  }

  const tokenEntityId = payload.entityId;
  if (targetEntityId && tokenEntityId !== targetEntityId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: `Cross-organization access violation. Token for entity "${tokenEntityId}" cannot access "${targetEntityId}".`,
        },
        { status: 403 }
      ),
    };
  }

  try {
    const db = await getDatabase();
    const sessionsCol = db.collection('entity_sessions');
    const entitiesCol = db.collection('entities');
    const usersCol = db.collection('users');

    // 2. Query server-side session grant in entity_sessions
    const sessionDoc = (await sessionsCol.findOne({
      sessionId,
      status: 'ACTIVE',
    })) as EntitySessionRecord | null;

    if (!sessionDoc) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: 'Entity Master session has been revoked or has expired. Please authenticate via Dual OTP.',
            code: 'SESSION_REVOKED',
          },
          { status: 401 }
        ),
      };
    }

    if (new Date(sessionDoc.expiresAt) < new Date()) {
      await sessionsCol.updateOne(
        { sessionId },
        { $set: { status: 'EXPIRED', updatedAt: new Date().toISOString() } }
      );
      return {
        error: NextResponse.json(
          {
            success: false,
            message: 'Entity Master session lease has expired. Please authenticate again.',
            code: 'SESSION_EXPIRED',
          },
          { status: 401 }
        ),
      };
    }

    // 3. Query authoritative target entity
    const effectiveEntityId = targetEntityId || tokenEntityId;
    const entity = await entitiesCol.findOne({ id: effectiveEntityId });
    if (!entity) {
      return {
        error: NextResponse.json(
          { success: false, message: 'Target organization account not found.' },
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

    // 4. Verify authoritative governing Head assignment
    const headRes = resolveAuthoritativeHead(entity);
    if (headRes.conflictError) {
      return {
        error: NextResponse.json(
          { success: false, message: headRes.conflictError },
          { status: 409 }
        ),
      };
    }

    if (payload.sub !== headRes.headUserId) {
      // Stale Head authority! Atomically revoke session
      await sessionsCol.updateOne(
        { sessionId },
        {
          $set: {
            status: 'REVOKED',
            revokedAt: new Date().toISOString(),
            revocationReason: 'STALE_HEAD_AUTHORITY',
          },
        }
      );
      return {
        error: NextResponse.json(
          {
            success: false,
            message: 'Entity Head governing authority has been revoked or reassigned. Master session terminated.',
            code: 'HEAD_AUTHORITY_REVOKED',
          },
          { status: 403 }
        ),
      };
    }

    // 5. Query user account state
    const userDoc = await usersCol.findOne({
      $or: [{ id: payload.sub }, { _id: payload.sub }],
    } as any);
    if (!userDoc || userDoc.isActive === false || userDoc.status === 'SUSPENDED') {
      return {
        error: NextResponse.json(
          { success: false, message: 'Entity Head user account is deactivated or suspended.' },
          { status: 403 }
        ),
      };
    }

    const verifiedUser: VerifiedAuthUser = {
      id: userDoc.id || String(userDoc._id),
      email: userDoc.email || payload.email || '',
      fullName: userDoc.fullName || userDoc.name || 'Entity Head',
      accountType: userDoc.accountType || 'Startup Founder',
      isActive: true,
      activeRoles: userDoc.activeRoles || [],
    };

    return {
      user: verifiedUser,
      entity,
      session: sessionDoc,
      isHead: true,
    };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Database error validating Entity Master session.' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Phase 2 — Entity Workspace Access Guard.
 * Strictly verifies that caller possesses an ACTIVE ENTITY_WORKSPACE session,
 * bound to an active accepted membership in the target organization.
 */
export async function requireEntityWorkspaceContext(
  req: NextRequest,
  targetEntityId?: string
): Promise<EntityWorkspaceAuthResult | { error: NextResponse }> {
  const token = extractAuthToken(req);
  if (!token) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Authentication required. Missing Workspace session credentials.' },
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

  // 1. Enforce ENTITY_WORKSPACE context claim
  if (payload.context !== 'ENTITY_WORKSPACE') {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: 'Access denied. Valid Entity Workspace session is required for internal dashboard access.',
          code: 'ENTITY_WORKSPACE_REQUIRED',
        },
        { status: 403 }
      ),
    };
  }

  const sessionId = payload.sessionId;
  if (!sessionId) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Invalid session structure. Missing sessionId.' },
        { status: 401 }
      ),
    };
  }

  const tokenEntityId = payload.entityId;
  if (targetEntityId && tokenEntityId !== targetEntityId) {
    return {
      error: NextResponse.json(
        {
          success: false,
          message: `Cross-organization access violation. Workspace token for "${tokenEntityId}" cannot access "${targetEntityId}".`,
        },
        { status: 403 }
      ),
    };
  }

  try {
    const db = await getDatabase();
    const sessionsCol = db.collection('entity_sessions');
    const entitiesCol = db.collection('entities');
    const membershipsCol = db.collection('memberships');
    const usersCol = db.collection('users');

    // 2. Query session grant in entity_sessions
    const sessionDoc = (await sessionsCol.findOne({
      sessionId,
      status: 'ACTIVE',
    })) as EntitySessionRecord | null;

    if (!sessionDoc) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: 'Entity Workspace session has expired or was revoked. Please re-enter from your Personal Account.',
            code: 'SESSION_REVOKED',
          },
          { status: 401 }
        ),
      };
    }

    if (new Date(sessionDoc.expiresAt) < new Date()) {
      await sessionsCol.updateOne(
        { sessionId },
        { $set: { status: 'EXPIRED', updatedAt: new Date().toISOString() } }
      );
      return {
        error: NextResponse.json(
          {
            success: false,
            message: 'Entity Workspace session lease has expired. Please re-enter.',
            code: 'SESSION_EXPIRED',
          },
          { status: 401 }
        ),
      };
    }

    // 3. Query target entity
    const effectiveEntityId = targetEntityId || tokenEntityId;
    const entity = await entitiesCol.findOne({ id: effectiveEntityId });
    if (!entity) {
      return {
        error: NextResponse.json(
          { success: false, message: 'Target organization account not found.' },
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

    // 4. Validate canonical active membership
    const membership = await membershipsCol.findOne({
      entityId: effectiveEntityId,
      $or: [{ userId: payload.sub }, { userEmail: payload.email }],
    });

    if (!membership) {
      await sessionsCol.updateOne(
        { sessionId },
        {
          $set: {
            status: 'REVOKED',
            revokedAt: new Date().toISOString(),
            revocationReason: 'NO_MEMBERSHIP_RECORD',
          },
        }
      );
      return {
        error: NextResponse.json(
          {
            success: false,
            message: `Access denied. No membership record found in organization "${effectiveEntityId}".`,
          },
          { status: 403 }
        ),
      };
    }

    const memStatus = String(membership.status || '').toUpperCase().trim();
    if (['SUSPENDED', 'REVOKED'].includes(memStatus)) {
      await sessionsCol.updateOne(
        { sessionId },
        {
          $set: {
            status: 'REVOKED',
            revokedAt: new Date().toISOString(),
            revocationReason: `MEMBERSHIP_${memStatus}`,
          },
        }
      );
      return {
        error: NextResponse.json(
          {
            success: false,
            message: `Your membership in organization "${effectiveEntityId}" is ${memStatus.toLowerCase()}. Workspace session terminated.`,
            code: 'MEMBERSHIP_SUSPENDED',
          },
          { status: 403 }
        ),
      };
    }

    if (['PENDING', 'INVITED', 'PENDING_ACCEPTANCE', 'PENDING_APPROVAL'].includes(memStatus)) {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: `Membership in organization "${effectiveEntityId}" is pending acceptance. Workspace access denied.`,
          },
          { status: 403 }
        ),
      };
    }

    if (memStatus !== 'ACTIVE' && memStatus !== 'APPROVED') {
      return {
        error: NextResponse.json(
          {
            success: false,
            message: `Membership in organization "${effectiveEntityId}" is not canonically active. Access denied.`,
          },
          { status: 403 }
        ),
      };
    }

    // 5. Query user account
    const userDoc = await usersCol.findOne({
      $or: [{ id: payload.sub }, { _id: payload.sub }],
    } as any);
    if (!userDoc || userDoc.isActive === false || userDoc.status === 'SUSPENDED') {
      return {
        error: NextResponse.json(
          { success: false, message: 'Member user account is deactivated or suspended.' },
          { status: 403 }
        ),
      };
    }

    const verifiedUser: VerifiedAuthUser = {
      id: userDoc.id || String(userDoc._id),
      email: userDoc.email || payload.email || '',
      fullName: userDoc.fullName || userDoc.name || 'Team Member',
      accountType: userDoc.accountType || 'Explorer',
      isActive: true,
      activeRoles: userDoc.activeRoles || [],
    };

    return {
      user: verifiedUser,
      entity,
      membership,
      session: sessionDoc,
      role: membership.role || 'Member',
      permissions: Array.isArray(membership.permissions) ? membership.permissions : ['VIEW_ONLY'],
    };
  } catch (err: any) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Database error validating Entity Workspace session.' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Phase 2 — Issue an ENTITY_MASTER session grant.
 * Binds human Head User ID, Entity ID, and creates an active session in `entity_sessions`.
 */
export async function issueEntityMasterGrant(
  headUserId: string,
  entityId: string,
  headEmail: string,
  durationHours: number = 12
): Promise<{ token: string; sessionId: string; expiresAt: string }> {
  const db = await getDatabase();
  const sessionsCol = db.collection('entity_sessions');

  const now = new Date();
  const expiresAtDate = new Date(now.getTime() + durationHours * 3600 * 1000);
  const nowIso = now.toISOString();
  const expiresAtIso = expiresAtDate.toISOString();

  const sessionId = `esess_m_${now.getTime()}_${crypto.randomBytes(8).toString('hex')}`;

  const sessionDoc: EntitySessionRecord = {
    sessionId,
    userId: headUserId,
    entityId,
    contextType: 'ENTITY_MASTER',
    status: 'ACTIVE',
    headUserId,
    createdAt: nowIso,
    expiresAt: expiresAtIso,
    authorizationVersion: 1,
  };

  await sessionsCol.insertOne(sessionDoc);

  const tokenPayload = {
    sub: headUserId,
    email: headEmail,
    context: 'ENTITY_MASTER',
    entityId,
    sessionId,
    isHead: true,
  };

  const token = signJwtToken(tokenPayload, durationHours * 3600);

  return { token, sessionId, expiresAt: expiresAtIso };
}

/**
 * Phase 2 — Issue an ENTITY_WORKSPACE session grant.
 * Binds Team Member User ID, Entity ID, and membership reference in `entity_sessions`.
 */
export async function issueEntityWorkspaceGrant(
  userId: string,
  entityId: string,
  membership: any,
  userEmail: string,
  durationHours: number = 8
): Promise<{ token: string; sessionId: string; expiresAt: string }> {
  const db = await getDatabase();
  const sessionsCol = db.collection('entity_sessions');

  const now = new Date();
  const expiresAtDate = new Date(now.getTime() + durationHours * 3600 * 1000);
  const nowIso = now.toISOString();
  const expiresAtIso = expiresAtDate.toISOString();

  const sessionId = `esess_ws_${now.getTime()}_${crypto.randomBytes(8).toString('hex')}`;
  const membershipId = membership?.id || String(membership?._id || '');

  const sessionDoc: EntitySessionRecord = {
    sessionId,
    userId,
    entityId,
    contextType: 'ENTITY_WORKSPACE',
    status: 'ACTIVE',
    membershipId,
    role: membership?.role || 'Member',
    createdAt: nowIso,
    expiresAt: expiresAtIso,
    authorizationVersion: 1,
  };

  await sessionsCol.insertOne(sessionDoc);

  const tokenPayload = {
    sub: userId,
    email: userEmail,
    context: 'ENTITY_WORKSPACE',
    entityId,
    sessionId,
    membershipId,
    role: membership?.role || 'Member',
  };

  const token = signJwtToken(tokenPayload, durationHours * 3600);

  return { token, sessionId, expiresAt: expiresAtIso };
}

/**
 * Phase 2 — Explicitly revoke an Entity Master or Workspace session.
 */
export async function revokeEntitySession(
  sessionId: string,
  reason: string = 'USER_LOGOUT'
): Promise<boolean> {
  if (!sessionId) return false;
  try {
    const db = await getDatabase();
    const sessionsCol = db.collection('entity_sessions');
    const result = await sessionsCol.updateOne(
      { sessionId, status: 'ACTIVE' },
      {
        $set: {
          status: 'REVOKED',
          revokedAt: new Date().toISOString(),
          revocationReason: reason,
        },
      }
    );
    return result.modifiedCount > 0;
  } catch (err) {
    console.warn('[revokeEntitySession] Failed to revoke session:', err);
    return false;
  }
}
