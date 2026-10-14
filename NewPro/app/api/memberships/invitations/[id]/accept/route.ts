import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuthenticatedUser } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/memberships/invitations/[id]/accept
 * Authoritatively accepts a pending team invitation and creates canonical active membership.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authRes = await requireAuthenticatedUser(req);
    if ('error' in authRes) {
      return authRes.error;
    }
    const user = authRes.user;

    const invId = params?.id?.trim();
    if (!invId) {
      return NextResponse.json({ success: false, message: 'Invitation ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const invCol = db.collection('invitations');
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');
    const auditCol = db.collection('audit_logs');
    const notifCol = db.collection('notifications');

    const invitation = await invCol.findOne({ id: invId });
    if (!invitation) {
      return NextResponse.json({ success: false, message: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'INVITED' && invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: `Invitation cannot be accepted. Current status is ${invitation.status}.` },
        { status: 409 }
      );
    }

    // Strict Recipient Binding Verification
    const userEmail = (user.email || '').toLowerCase().trim();
    const invEmail = (invitation.inviteeEmail || invitation.email || '').toLowerCase().trim();
    const invUserId = invitation.inviteeUserId;
    const invTag = (invitation.inviteeTag || '').replace(/^@/, '').toLowerCase().trim();

    // Fetch user tag to verify
    const usersCol = db.collection('users');
    const userDoc = await usersCol.findOne({ id: user.id });
    const userTag = (userDoc?.accountTag || userDoc?.username || '').replace(/^@/, '').toLowerCase().trim();

    const isMatch =
      (invUserId && invUserId === user.id) ||
      (invEmail && invEmail === userEmail) ||
      (invTag && userTag && invTag === userTag);

    if (!isMatch) {
      return NextResponse.json(
        {
          success: false,
          message: 'Access denied. You are not the designated recipient of this invitation.',
        },
        { status: 403 }
      );
    }

    // Atomically transition invitation to ACCEPTED to prevent double-acceptance races
    const nowIso = new Date().toISOString();
    const updateInvRes = await invCol.findOneAndUpdate(
      { id: invId, status: { $in: ['INVITED', 'PENDING'] } },
      {
        $set: {
          status: 'ACCEPTED',
          acceptedByUserId: user.id,
          acceptedAt: nowIso,
          updatedAt: nowIso,
        },
      },
      { returnDocument: 'after' }
    );

    if (!updateInvRes) {
      return NextResponse.json(
        { success: false, message: 'Invitation already accepted or modified.' },
        { status: 409 }
      );
    }

    // Fetch entity to record canonical name
    const entity = await entitiesCol.findOne({ id: invitation.entityId });

    // Atomically upsert authoritative membership document in memberships collection
    const memId = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const membershipDoc = {
      id: memId,
      entityId: invitation.entityId,
      entityName: entity?.name || invitation.entityName || 'Organization',
      entityType: entity?.entityType || invitation.entityType || 'Startup',
      userId: user.id,
      userEmail,
      userName: user.fullName || user.email,
      role: invitation.role,
      title: invitation.title || invitation.role,
      permissions: invitation.permissions || ['VIEW_ONLY'],
      dealAccessMode: invitation.dealAccessMode || 'all',
      portfolioAccessMode: invitation.portfolioAccessMode || 'all',
      status: 'ACTIVE',
      isAccepted: true,
      acceptedAt: nowIso,
      invitationId: invId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await membershipsCol.updateOne(
      { entityId: invitation.entityId, userId: user.id },
      { $set: membershipDoc },
      { upsert: true }
    );

    // Dispatched notification to inviter / Head
    if (invitation.inviterId) {
      await notifCol.insertOne({
        id: `notif_acc_${Date.now()}`,
        userId: invitation.inviterId,
        recipientId: invitation.inviterId,
        actorId: user.id,
        actorName: user.fullName || user.email,
        title: 'Invitation Accepted',
        message: `${user.fullName || user.email} accepted your invitation to join ${entity?.name || invitation.entityId} as ${invitation.role}.`,
        category: 'TEAM_INVITATION_ACCEPTED',
        metadata: { invitationId: invId, entityId: invitation.entityId, memberId: memId },
        isRead: false,
        read: false,
        createdAt: nowIso,
      });
    }

    // Audit log
    await auditCol.insertOne({
      id: `audit_acc_${Date.now()}`,
      entityId: invitation.entityId,
      actorId: user.id,
      action: 'ACCEPT_TEAM_INVITATION',
      details: {
        invitationId: invId,
        membershipId: memId,
        role: invitation.role,
      },
      timestamp: nowIso,
    });

    const { _id, ...cleanMem } = membershipDoc as any;
    return NextResponse.json({
      success: true,
      message: `Successfully accepted invitation to join ${entity?.name || invitation.entityId} as ${invitation.role}.`,
      data: cleanMem,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error accepting invitation' },
      { status: 500 }
    );
  }
}
