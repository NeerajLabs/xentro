import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  requireAuthenticatedUser,
  issueEntityWorkspaceGrant,
  revokeEntitySession,
  logSecurityAuditEvent,
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser(req);
    if ('error' in authResult) {
      return authResult.error;
    }
    const user = authResult.user;

    const db = await getDatabase();
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    const personalRoleRaw = (user.accountType || 'Explorer').trim();
    const normalizedPersonalRole =
      personalRoleRaw.toLowerCase().includes('mentor')
        ? 'Mentor'
        : personalRoleRaw.toLowerCase().includes('investor')
        ? 'Individual Investor'
        : 'Explorer';

    const personalDestination =
      normalizedPersonalRole === 'Explorer'
        ? 'feed'
        : 'dashboard';

    const personalAccount = {
      userId: user.id,
      name: user.fullName || 'Personal Account',
      email: user.email,
      role: normalizedPersonalRole,
      accountType: normalizedPersonalRole,
      destination: personalDestination,
      isPersonal: true,
    };

    // Query authoritative memberships from MongoDB
    // Reject PENDING, SUSPENDED, REVOKED memberships
    const userMemberships = await membershipsCol
      .find({
        $or: [{ userId: user.id }, { userEmail: user.email.toLowerCase() }],
        status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
      })
      .toArray();

    // For APPROVED status, verify acceptance
    const validMemberships = userMemberships.filter((m) => {
      const status = String(m.status || '').toUpperCase().trim();
      if (status === 'ACTIVE' || status === 'ACTIVE') return true;
      if (status === 'APPROVED') {
        return m.isAccepted === true || m.accepted === true || Boolean(m.acceptedAt);
      }
      return false;
    });

    const entityIds = validMemberships.map((m) => m.entityId);
    const entitiesDocs = await entitiesCol
      .find({
        id: { $in: entityIds },
        status: { $nin: ['ORPHANED_DELETED', 'DELETED', 'ARCHIVED'] },
        isActive: { $ne: false },
        is_deleted: { $ne: true },
        deleted: { $ne: true },
      })
      .toArray();

    const entityMap = new Map<string, any>();
    entitiesDocs.forEach((e) => entityMap.set(e.id, e));

    const eligibleEntities: any[] = [];
    const addedEntityIds = new Set<string>();

    for (const mem of validMemberships) {
      const ent = entityMap.get(mem.entityId);
      if (!ent) continue; // Skip deleted/suspended organizations

      const entType = (ent.entityType || mem.entityType || 'STARTUP').toUpperCase();

      // Rule: Mentor accounts must not access Investor Organizations
      if (normalizedPersonalRole === 'Mentor' && (entType === 'INVESTOR_ORG' || entType === 'INVESTOR')) {
        continue;
      }

      let canonicalType: 'Startup' | 'Investor Organization' | 'ESP' | 'Institution' = 'Startup';
      if (entType.includes('INVESTOR') || entType.includes('VC')) {
        canonicalType = 'Investor Organization';
      } else if (entType.includes('ESP') || entType.includes('INCUBATOR')) {
        canonicalType = 'ESP';
      } else if (entType.includes('INSTITUT')) {
        canonicalType = 'Institution';
      }

      addedEntityIds.add(ent.id);
      eligibleEntities.push({
        entityId: ent.id,
        name: ent.name || mem.entityName,
        entityType: canonicalType,
        rawEntityType: entType,
        role: mem.role || 'Member',
        membershipStatus: mem.status || 'ACTIVE',
        logo: ent.logo || ent.avatar || ent.icon || null,
        sector: ent.details?.sector || ent.industry || '',
        stage: ent.details?.stage || ent.stage || '',
        permissions: Array.isArray(mem.permissions) ? mem.permissions : ['VIEW_ONLY'],
        dashboardUrl: canonicalType === 'Startup' ? '/?tab=dashboard' : `/${canonicalType.toLowerCase().replace(/\s+/g, '-')}/dashboard`,
        profileUrl: '/?tab=profile',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        personalAccount,
        eligibleEntities,
        eligibleCount: eligibleEntities.length,
        userId: user.id,
      },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Database error retrieving eligible workspaces.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuthenticatedUser(req);
    if ('error' in authResult) {
      return authResult.error;
    }
    const user = authResult.user;

    const body = await req.json();
    const targetContext = String(body.targetContext || (body.targetEntityId ? 'ENTITY_WORKSPACE' : 'PERSONAL')).toUpperCase();
    const targetEntityId = body.targetEntityId ? String(body.targetEntityId).trim() : null;

    // =========================================================================
    // CASE A: Switch back to Personal Account
    // =========================================================================
    if (targetContext === 'PERSONAL' || !targetEntityId) {
      const activeSessionId = body.sessionId || null;
      if (activeSessionId) {
        await revokeEntitySession(activeSessionId, 'USER_EXIT_TO_PERSONAL');
      }

      await logSecurityAuditEvent({
        actorId: user.id,
        action: 'EXIT_TO_PERSONAL_ACCOUNT',
        outcome: 'ALLOWED',
        metadata: { userId: user.id, revokedSessionId: activeSessionId },
      });

      return NextResponse.json({
        success: true,
        message: `Returned to Personal Account (${user.fullName || user.email})`,
        data: {
          contextType: 'PERSONAL',
          user: {
            id: user.id,
            name: user.fullName,
            email: user.email,
            accountType: user.accountType,
          },
        },
      });
    }

    // =========================================================================
    // CASE B: Switch to Authorized Entity Workspace (ENTITY_WORKSPACE)
    // =========================================================================
    const db = await getDatabase();
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    const entity = await entitiesCol.findOne({ id: targetEntityId });
    if (!entity) {
      return NextResponse.json(
        { success: false, message: 'Organization not found.' },
        { status: 404 }
      );
    }

    if (
      entity.is_deleted === true ||
      entity.deleted === true ||
      entity.status === 'ORPHANED_DELETED' ||
      entity.status === 'DELETED' ||
      entity.isActive === false
    ) {
      return NextResponse.json(
        { success: false, message: 'This organization account is deactivated or deleted.' },
        { status: 403 }
      );
    }

    // Query canonical membership in MongoDB
    const membership = await membershipsCol.findOne({
      entityId: targetEntityId,
      $or: [{ userId: user.id }, { userEmail: user.email.toLowerCase() }],
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: `Access denied. You do not hold an active membership in organization "${targetEntityId}".`,
        },
        { status: 403 }
      );
    }

    const memStatus = String(membership.status || '').toUpperCase().trim();
    if (['SUSPENDED', 'REVOKED'].includes(memStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Your membership in organization "${targetEntityId}" is ${memStatus.toLowerCase()}. Workspace access denied.`,
          code: 'MEMBERSHIP_SUSPENDED',
        },
        { status: 403 }
      );
    }

    if (['PENDING', 'INVITED', 'PENDING_ACCEPTANCE', 'PENDING_APPROVAL'].includes(memStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Your invitation to organization "${targetEntityId}" has not been accepted yet. Workspace access denied.`,
          code: 'MEMBERSHIP_PENDING',
        },
        { status: 403 }
      );
    }

    if (memStatus === 'APPROVED') {
      const isAccepted = membership.isAccepted === true || membership.accepted === true || Boolean(membership.acceptedAt);
      if (!isAccepted) {
        return NextResponse.json(
          {
            success: false,
            message: `Invitation approved by administrator but pending member acceptance. Workspace access denied.`,
          },
          { status: 403 }
        );
      }
    }

    const entType = (entity.entityType || membership.entityType || 'STARTUP').toUpperCase();

    // Rule: Mentor accounts must not access Investor Organizations
    if (user.accountType.toLowerCase().includes('mentor') && (entType === 'INVESTOR_ORG' || entType === 'INVESTOR')) {
      return NextResponse.json(
        { success: false, message: 'Mentor accounts are strictly prohibited from accessing Investor Organizations.' },
        { status: 403 }
      );
    }

    // Issue ENTITY_WORKSPACE grant
    const grant = await issueEntityWorkspaceGrant(user.id, targetEntityId, membership, user.email);

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

    await logSecurityAuditEvent({
      entityId: targetEntityId,
      actorId: user.id,
      action: 'ENTER_ENTITY_WORKSPACE',
      outcome: 'ALLOWED',
      metadata: {
        sessionId: grant.sessionId,
        role: membership.role || 'Member',
      },
    });

    return NextResponse.json({
      success: true,
      message: `Switched to ${entity.name} (${canonicalType}) workspace`,
      data: {
        contextType: 'ENTITY_WORKSPACE',
        token: grant.token,
        sessionId: grant.sessionId,
        expiresAt: grant.expiresAt,
        entity: {
          id: entity.id,
          name: entity.name,
          entityType: canonicalType,
          rawEntityType: entType,
          role: membership.role || 'Member',
          permissions: Array.isArray(membership.permissions) ? membership.permissions : ['VIEW_ONLY'],
          dashboardUrl: dashboardDestination,
          profileUrl: '/?tab=profile',
          isHead: false,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: 'Error establishing workspace session.' },
      { status: 500 }
    );
  }
}
