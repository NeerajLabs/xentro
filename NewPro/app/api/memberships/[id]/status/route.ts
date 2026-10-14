import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  requireAuthenticatedUser,
  requireActiveEntityMembership,
} from '@/lib/serverAuth';
import { requiresHeadApprovalForRoleMutation } from '@/lib/operationalRoles';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * PATCH /api/memberships/[id]/status
 * Manages membership lifecycle: ACTIVE, SUSPENDED, REVOKED.
 * Enforces Head approval for Admin role changes and immediately revokes active workspace sessions.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await requireAuthenticatedUser(req);
    if ('error' in authRes) {
      return authRes.error;
    }
    const caller = authRes.user;

    const memberId = params?.id?.trim();
    if (!memberId) {
      return NextResponse.json({ success: false, message: 'Member ID is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 422 });
    }

    const { status, role, permissions } = body;
    const cleanStatus = status ? String(status).toUpperCase().trim() : undefined;

    if (cleanStatus && !['ACTIVE', 'SUSPENDED', 'REVOKED'].includes(cleanStatus)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Permitted: ACTIVE, SUSPENDED, REVOKED.' },
        { status: 422 }
      );
    }

    const db = await getDatabase();
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');
    const sessionsCol = db.collection('entity_sessions');
    const auditCol = db.collection('audit_logs');

    // 1. Fetch target membership
    const targetMembership = await membershipsCol.findOne({
      $or: [{ id: memberId }, { userId: memberId }],
    });

    if (!targetMembership) {
      return NextResponse.json({ success: false, message: 'Membership record not found' }, { status: 404 });
    }

    const entityId = targetMembership.entityId;

    // 2. Fetch authoritative entity
    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Organization not found' }, { status: 404 });
    }

    // 3. Prevent Head from being suspended or revoked
    const isTargetHead =
      entity.currentOwnerUserId === targetMembership.userId ||
      entity.primaryOwnerId === targetMembership.userId ||
      entity.createdByUserId === targetMembership.userId;

    if (isTargetHead) {
      return NextResponse.json(
        {
          success: false,
          message: 'The governing Entity Head cannot be suspended or revoked through membership controls.',
        },
        { status: 403 }
      );
    }

    // 4. Verify caller authority
    const memRes = await requireActiveEntityMembership(caller.id, entityId);
    if ('error' in memRes) {
      return memRes.error;
    }
    const { isHead: isCallerHead, permissions: callerPerms, role: callerRole } = memRes;

    const canManageTeam =
      isCallerHead ||
      callerPerms.includes('MANAGE_TEAM') ||
      callerPerms.includes('ADMIN') ||
      callerRole.toUpperCase().includes('ADMIN');

    if (!canManageTeam) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Team management authority required.' },
        { status: 403 }
      );
    }

    // 5. Head Approval Required for Admin modifications
    const targetRole = targetMembership.role || '';
    if (requiresHeadApprovalForRoleMutation(targetRole, role)) {
      if (!isCallerHead) {
        return NextResponse.json(
          {
            success: false,
            message: 'Head approval required. Only the authoritative governing Head may alter Administrator memberships or permissions.',
            code: 'HEAD_APPROVAL_REQUIRED_FOR_ADMIN',
          },
          { status: 403 }
        );
      }
    }

    // 6. Apply modifications
    const nowIso = new Date().toISOString();
    const updateFields: any = { updatedAt: nowIso };

    if (cleanStatus) {
      updateFields.status = cleanStatus;
    }
    if (role) {
      updateFields.role = role;
    }
    if (permissions && Array.isArray(permissions)) {
      updateFields.permissions = permissions;
    }

    await membershipsCol.updateOne(
      { $or: [{ id: memberId }, { userId: memberId }], entityId },
      { $set: updateFields }
    );

    // 7. If SUSPENDED or REVOKED: Immediately terminate active workspace sessions in entity_sessions
    if (cleanStatus === 'SUSPENDED' || cleanStatus === 'REVOKED') {
      await sessionsCol.updateMany(
        {
          entityId,
          userId: targetMembership.userId,
          status: 'ACTIVE',
        },
        {
          $set: {
            status: 'REVOKED',
            revokedAt: nowIso,
            revocationReason: `MEMBERSHIP_${cleanStatus}`,
          },
        }
      );
    }

    // 8. Audit logging
    await auditCol.insertOne({
      id: `audit_mem_${Date.now()}`,
      entityId,
      actorId: caller.id,
      action: 'UPDATE_MEMBERSHIP_STATUS',
      details: {
        targetUserId: targetMembership.userId,
        memberId,
        newStatus: cleanStatus,
        newRole: role,
      },
      timestamp: nowIso,
    });

    const updated = await membershipsCol.findOne({
      $or: [{ id: memberId }, { userId: memberId }],
      entityId,
    });
    if (updated) delete (updated as any)._id;

    return NextResponse.json({
      success: true,
      message: `Membership updated successfully.${cleanStatus === 'SUSPENDED' || cleanStatus === 'REVOKED' ? ' Active workspace sessions terminated.' : ''}`,
      data: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error updating membership' },
      { status: 500 }
    );
  }
}
