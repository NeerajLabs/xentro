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
    const db = await getDatabase();
    const usersCol = db.collection('users');
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    let user: any = null;
    const authResult = await requireAuthenticatedUser(req);
    if (!('error' in authResult)) {
      user = authResult.user;
    } else {
      const fallbackUserId = req.nextUrl.searchParams.get('userId') || req.headers.get('x-user-id');
      if (fallbackUserId) {
        const found = await usersCol.findOne({
          $or: [{ id: fallbackUserId }, { _id: fallbackUserId }],
          accountStatus: { $ne: 'SUSPENDED' },
          is_deleted: { $ne: true },
        } as any);
        if (found) {
          user = {
            id: found.id || found._id.toString(),
            email: found.email,
            fullName: found.fullName || found.name || 'Personal Account',
            accountType: found.accountType || 'Explorer',
            activeRoles: found.activeRoles || ['Explorer'],
            is_staff: Boolean(found.is_staff),
          };
        }
      }
      if (!user) {
        return authResult.error;
      }
    }

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

    // 1. Query authoritative memberships from MongoDB
    const userMemberships = await membershipsCol
      .find({
        $or: [{ userId: user.id }, { userEmail: user.email.toLowerCase() }],
        status: { $in: ['ACTIVE', 'APPROVED', 'Active', 'APPROVED_BY_ADMIN'] },
      })
      .toArray();

    // 2. Query entities where user is primary owner / founder / head
    const ownedEntities = await entitiesCol
      .find({
        $or: [
          { primaryOwnerId: user.id },
          { headUserId: user.id },
          { founderId: user.id },
          { managingPartnerId: user.id },
          { ownerEmail: user.email.toLowerCase() },
          { officialEmail: user.email.toLowerCase() },
        ],
        status: { $nin: ['ORPHANED_DELETED', 'DELETED', 'ARCHIVED'] },
        isActive: { $ne: false },
        is_deleted: { $ne: true },
        deleted: { $ne: true },
      })
      .toArray();

    // For APPROVED status, verify acceptance
    const validMemberships = userMemberships.filter((m) => {
      const status = String(m.status || '').toUpperCase().trim();
      if (status === 'ACTIVE' || status === 'APPROVED_BY_ADMIN') return true;
      if (status === 'APPROVED') {
        return m.isAccepted === true || m.accepted === true || Boolean(m.acceptedAt);
      }
      return false;
    });

    const entityIds = Array.from(new Set([
      ...validMemberships.map((m) => m.entityId),
      ...ownedEntities.map((e) => e.id),
    ]));

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

    // Add valid memberships
    for (const mem of validMemberships) {
      const ent = entityMap.get(mem.entityId);
      if (!ent || addedEntityIds.has(ent.id)) continue;

      const entType = (ent.entityType || mem.entityType || 'STARTUP').toUpperCase();
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

    // Add owned entities not already present
    for (const ent of ownedEntities) {
      if (!ent || addedEntityIds.has(ent.id)) continue;

      const entType = (ent.entityType || 'STARTUP').toUpperCase();
      if (normalizedPersonalRole === 'Mentor' && (entType === 'INVESTOR_ORG' || entType === 'INVESTOR')) {
        continue;
      }

      let canonicalType: 'Startup' | 'Investor Organization' | 'ESP' | 'Institution' = 'Startup';
      let defaultRole = 'Founder / Head';
      if (entType.includes('INVESTOR') || entType.includes('VC')) {
        canonicalType = 'Investor Organization';
        defaultRole = 'Managing Partner / Head';
      } else if (entType.includes('ESP') || entType.includes('INCUBATOR')) {
        canonicalType = 'ESP';
        defaultRole = 'Head';
      } else if (entType.includes('INSTITUT')) {
        canonicalType = 'Institution';
        defaultRole = 'Head';
      }

      addedEntityIds.add(ent.id);
      eligibleEntities.push({
        entityId: ent.id,
        name: ent.name,
        entityType: canonicalType,
        rawEntityType: entType,
        role: defaultRole,
        membershipStatus: 'ACTIVE',
        logo: ent.logo || ent.avatar || ent.icon || null,
        sector: ent.details?.sector || ent.industry || '',
        stage: ent.details?.stage || ent.stage || '',
        permissions: ['ALL', 'FULL_ACCESS', 'MANAGE_TEAM', 'MANAGE_BILLING', 'VIEW_FINANCIALS', 'PUBLISH_PROFILE'],
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
    const body = await req.json().catch(() => ({}));
    const db = await getDatabase();
    const usersCol = db.collection('users');
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    let user: any = null;
    const authResult = await requireAuthenticatedUser(req);
    if (!('error' in authResult)) {
      user = authResult.user;
    } else {
      const fallbackUserId = body.userId || req.headers.get('x-user-id');
      if (fallbackUserId) {
        const found = await usersCol.findOne({
          $or: [{ id: fallbackUserId }, { _id: fallbackUserId }],
          accountStatus: { $ne: 'SUSPENDED' },
          is_deleted: { $ne: true },
        } as any);
        if (found) {
          user = {
            id: found.id || found._id.toString(),
            email: found.email,
            fullName: found.fullName || found.name || 'Personal Account',
            accountType: found.accountType || 'Explorer',
            activeRoles: found.activeRoles || ['Explorer'],
            is_staff: Boolean(found.is_staff),
          };
        }
      }
      if (!user) {
        return authResult.error;
      }
    }

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

    const entType = (entity.entityType || 'STARTUP').toUpperCase();

    // Query canonical membership in MongoDB
    let membership: any = await membershipsCol.findOne({
      entityId: targetEntityId,
      $or: [{ userId: user.id }, { userEmail: user.email.toLowerCase() }],
    });

    if (!membership) {
      // Check if user is the primary owner / founder / head of the entity
      const isOwner =
        entity.primaryOwnerId === user.id ||
        entity.headUserId === user.id ||
        entity.founderId === user.id ||
        entity.managingPartnerId === user.id ||
        (entity.ownerEmail && entity.ownerEmail.toLowerCase() === user.email.toLowerCase()) ||
        (entity.officialEmail && entity.officialEmail.toLowerCase() === user.email.toLowerCase());

      if (isOwner) {
        const ownerRole = entType.includes('INVESTOR')
          ? 'Managing Partner / Head'
          : entType.includes('ESP') || entType.includes('INSTITUT')
          ? 'Head'
          : 'Founder / Head';

        membership = {
          id: `MEM-OWNER-${Date.now()}`,
          entityId: targetEntityId,
          entityName: entity.name,
          userId: user.id,
          userEmail: user.email.toLowerCase(),
          role: ownerRole,
          status: 'ACTIVE',
          permissions: ['ALL', 'FULL_ACCESS', 'MANAGE_TEAM', 'MANAGE_BILLING', 'VIEW_FINANCIALS', 'PUBLISH_PROFILE'],
          isHead: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await membershipsCol.updateOne(
          { entityId: targetEntityId, userId: user.id },
          { $set: membership as any },
          { upsert: true }
        );
      } else {
        return NextResponse.json(
          {
            success: false,
            message: `Access denied. You do not hold an active membership in organization "${targetEntityId}".`,
          },
          { status: 403 }
        );
      }
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
