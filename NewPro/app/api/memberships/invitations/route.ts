import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  requireAuthenticatedUser,
  requireActiveEntityMembership,
  logSecurityAuditEvent,
} from '@/lib/serverAuth';
import {
  PROHIBITED_INVITATION_ROLES,
  normalizeCanonicalRole,
  requiresHeadApprovalForRoleMutation,
  CANONICAL_ROLE_PERMISSIONS,
} from '@/lib/operationalRoles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/memberships/invitations
 * Lists pending invitations addressed to the authenticated user.
 */
export async function GET(req: NextRequest) {
  try {
    const authRes = await requireAuthenticatedUser(req);
    if ('error' in authRes) {
      return authRes.error;
    }
    const user = authRes.user;

    const db = await getDatabase();
    const invCol = db.collection('invitations');
    const entitiesCol = db.collection('entities');

    const userEmail = (user.email || '').toLowerCase().trim();
    const userId = user.id;

    // Fetch user to get accountTag if present
    const usersCol = db.collection('users');
    const userDoc = await usersCol.findOne({ id: userId });
    const userTag = userDoc?.accountTag || userDoc?.username || '';

    const queryConditions: any[] = [{ status: { $in: ['INVITED', 'PENDING'] } }];
    const recipientOr: any[] = [];
    if (userId) recipientOr.push({ inviteeUserId: userId });
    if (userEmail) recipientOr.push({ inviteeEmail: userEmail }, { email: userEmail });
    if (userTag) {
      recipientOr.push(
        { inviteeTag: userTag },
        { inviteeTag: `@${userTag.replace(/^@/, '')}` },
        { inviteeTag: userTag.replace(/^@/, '') }
      );
    }

    if (recipientOr.length === 0) {
      return NextResponse.json({ success: true, data: [], count: 0 });
    }

    const invitations = await invCol
      .find({
        status: { $in: ['INVITED', 'PENDING'] },
        $or: recipientOr,
      })
      .sort({ invitedAt: -1 })
      .toArray();

    // Enrich with entity metadata
    const entityIds = Array.from(new Set(invitations.map((inv) => inv.entityId).filter(Boolean)));
    const entities = await entitiesCol
      .find({ id: { $in: entityIds } })
      .project({ id: 1, name: 1, entityType: 1, logo: 1, officialEmail: 1 })
      .toArray();
    const entityMap = new Map(entities.map((e) => [e.id, e]));

    const cleanInvitations = invitations.map((inv) => {
      const { _id, ...rest } = inv;
      const ent = entityMap.get(inv.entityId);
      return {
        ...rest,
        entityName: ent?.name || inv.entityName || 'Organization',
        entityType: ent?.entityType || inv.entityType || 'Startup',
        entityLogo: ent?.logo || '/xentro-logo.png',
      };
    });

    return NextResponse.json({
      success: true,
      data: cleanInvitations,
      count: cleanInvitations.length,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error fetching invitations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/memberships/invitations
 * Dispatches an authoritative team invitation based on User Tag or Email.
 * Enforces Head approval for Admin appointments.
 */
export async function POST(req: NextRequest) {
  try {
    const authRes = await requireAuthenticatedUser(req);
    if ('error' in authRes) {
      return authRes.error;
    }
    const inviter = authRes.user;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 422 });
    }

    const {
      entityId,
      inviteeTag,
      email,
      role = 'Viewer',
      title,
      template,
      dealAccessMode = 'all',
      portfolioAccessMode = 'all',
    } = body;

    const cleanEntityId = (entityId || '').trim();
    if (!cleanEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const membershipsCol = db.collection('memberships');
    const invCol = db.collection('invitations');
    const usersCol = db.collection('users');
    const auditCol = db.collection('audit_logs');
    const notifCol = db.collection('notifications');

    // 1. Verify target entity exists
    const entity = await entitiesCol.findOne({ id: cleanEntityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Organization account not found' }, { status: 404 });
    }

    if (entity.is_deleted === true || entity.deleted === true || entity.status === 'DELETED') {
      return NextResponse.json({ success: false, message: 'Organization account is inactive or deleted' }, { status: 403 });
    }

    // 2. Verify inviter holds authorized governing authority or manageTeam permission
    const memRes = await requireActiveEntityMembership(inviter.id, cleanEntityId);
    if ('error' in memRes) {
      return memRes.error;
    }
    const { isHead, permissions: inviterPermissions, role: inviterRole } = memRes;

    const canInvite =
      isHead ||
      inviterPermissions.includes('MANAGE_TEAM') ||
      inviterPermissions.includes('ADMIN') ||
      inviterPermissions.includes('OWNER') ||
      inviterRole.toUpperCase().includes('ADMIN');

    if (!canInvite) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You lack authority to invite team members for this organization.' },
        { status: 403 }
      );
    }

    // 3. Prohibit Head / Owner role invitation
    const normalizedRole = normalizeCanonicalRole(role);
    const upperRole = normalizedRole.toUpperCase();
    if (PROHIBITED_INVITATION_ROLES.has(upperRole)) {
      return NextResponse.json(
        { success: false, message: 'Governing Head and Founder roles cannot be assigned through team invitations.' },
        { status: 403 }
      );
    }

    // 4. Enforce Head Approval for Admin Appointments
    if (requiresHeadApprovalForRoleMutation(normalizedRole)) {
      if (!isHead) {
        return NextResponse.json(
          {
            success: false,
            message: 'Head approval required. Only the authoritative governing Head may appoint or invite Administrator roles.',
            code: 'HEAD_APPROVAL_REQUIRED_FOR_ADMIN',
          },
          { status: 403 }
        );
      }
    }

    // 5. Resolve Invitee by User Tag or Email
    let targetUser: any = null;
    const cleanTag = (inviteeTag || '').trim();
    const cleanEmail = (email || '').toLowerCase().trim();

    if (cleanTag) {
      const tagWithoutAt = cleanTag.replace(/^@/, '');
      const tagWithAt = `@${tagWithoutAt}`;
      targetUser = await usersCol.findOne({
        $or: [
          { accountTag: tagWithAt },
          { accountTag: tagWithoutAt },
          { username: tagWithAt },
          { username: tagWithoutAt },
          { id: cleanTag },
        ],
        deleted: { $ne: true },
        is_deleted: { $ne: true },
      });
    }

    if (!targetUser && cleanEmail) {
      targetUser = await usersCol.findOne({
        email: cleanEmail,
        deleted: { $ne: true },
        is_deleted: { $ne: true },
      });
    }

    const effectiveInviteeEmail = targetUser?.email || cleanEmail;
    const effectiveInviteeUserId = targetUser?.id || null;
    const effectiveInviteeTag = targetUser?.accountTag || cleanTag || (effectiveInviteeEmail ? `@${effectiveInviteeEmail.split('@')[0]}` : '');

    if (!effectiveInviteeEmail && !effectiveInviteeUserId) {
      return NextResponse.json(
        { success: false, message: 'A valid User Tag or email address is required to invite a member.' },
        { status: 400 }
      );
    }

    // 6. Check if invitee is already an active member of this organization
    const existingActive = await membershipsCol.findOne({
      entityId: cleanEntityId,
      $or: [
        ...(effectiveInviteeUserId ? [{ userId: effectiveInviteeUserId }] : []),
        ...(effectiveInviteeEmail ? [{ userEmail: effectiveInviteeEmail }] : []),
      ],
      status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
    });

    if (existingActive) {
      return NextResponse.json(
        { success: false, message: `User is already an active member of ${entity.name || cleanEntityId}.` },
        { status: 409 }
      );
    }

    // 7. Check if pending invitation already exists
    const existingInv = await invCol.findOne({
      entityId: cleanEntityId,
      $or: [
        ...(effectiveInviteeUserId ? [{ inviteeUserId: effectiveInviteeUserId }] : []),
        ...(effectiveInviteeEmail ? [{ inviteeEmail: effectiveInviteeEmail }, { email: effectiveInviteeEmail }] : []),
      ],
      status: { $in: ['INVITED', 'PENDING'] },
    });

    if (existingInv) {
      return NextResponse.json(
        { success: false, message: `An active pending invitation is already outstanding for this recipient.` },
        { status: 409 }
      );
    }

    // 8. Create Authoritative Invitation Record
    const nowIso = new Date().toISOString();
    const invId = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const grantedPermissions = CANONICAL_ROLE_PERMISSIONS[normalizedRole] || ['VIEW_ONLY'];

    const invDoc = {
      id: invId,
      entityId: cleanEntityId,
      entityName: entity.name || 'Organization',
      entityType: entity.entityType || 'Startup',
      inviterId: inviter.id,
      inviterName: inviter.fullName || inviter.email,
      inviteeUserId: effectiveInviteeUserId,
      inviteeEmail: effectiveInviteeEmail,
      inviteeTag: effectiveInviteeTag,
      role: normalizedRole,
      title: (title || template || normalizedRole).trim(),
      template: template || undefined,
      permissions: grantedPermissions,
      dealAccessMode,
      portfolioAccessMode,
      status: 'INVITED',
      invitedAt: nowIso,
      updatedAt: nowIso,
    };

    await invCol.insertOne(invDoc);

    // 9. Dispatch In-App Notification if user exists
    if (effectiveInviteeUserId) {
      await notifCol.insertOne({
        id: `notif_inv_${Date.now()}`,
        userId: effectiveInviteeUserId,
        recipientId: effectiveInviteeUserId,
        actorId: inviter.id,
        actorName: inviter.fullName || 'Organization Admin',
        title: 'Team Invitation',
        message: `${inviter.fullName || 'An administrator'} invited you to join ${entity.name || cleanEntityId} as ${normalizedRole}.`,
        category: 'TEAM_INVITATION',
        metadata: { invitationId: invId, entityId: cleanEntityId, role: normalizedRole },
        isRead: false,
        read: false,
        createdAt: nowIso,
      });
    }

    // 10. Audit Logging
    await auditCol.insertOne({
      id: `audit_inv_${Date.now()}`,
      entityId: cleanEntityId,
      actorId: inviter.id,
      action: 'DISPATCH_TEAM_INVITATION',
      details: {
        invitationId: invId,
        inviteeEmail: effectiveInviteeEmail,
        inviteeTag: effectiveInviteeTag,
        role: normalizedRole,
      },
      timestamp: nowIso,
    });

    const { _id, ...cleanResponse } = invDoc as any;
    return NextResponse.json({
      success: true,
      message: `Invitation successfully dispatched to ${effectiveInviteeTag || effectiveInviteeEmail}.`,
      data: cleanResponse,
      source: 'mongodb-atlas',
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error creating invitation' },
      { status: 500 }
    );
  }
}
