import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuthenticatedUser } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/memberships/invitations/[id]/decline
 * Declines a pending team invitation.
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
    const auditCol = db.collection('audit_logs');

    const invitation = await invCol.findOne({ id: invId });
    if (!invitation) {
      return NextResponse.json({ success: false, message: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'INVITED' && invitation.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, message: `Invitation cannot be declined. Current status is ${invitation.status}.` },
        { status: 409 }
      );
    }

    const userEmail = (user.email || '').toLowerCase().trim();
    const invEmail = (invitation.inviteeEmail || invitation.email || '').toLowerCase().trim();
    const invUserId = invitation.inviteeUserId;

    const usersCol = db.collection('users');
    const userDoc = await usersCol.findOne({ id: user.id });
    const userTag = (userDoc?.accountTag || userDoc?.username || '').replace(/^@/, '').toLowerCase().trim();
    const invTag = (invitation.inviteeTag || '').replace(/^@/, '').toLowerCase().trim();

    const isMatch =
      (invUserId && invUserId === user.id) ||
      (invEmail && invEmail === userEmail) ||
      (invTag && userTag && invTag === userTag);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'Access denied. You are not the designated recipient of this invitation.' },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();
    await invCol.updateOne(
      { id: invId },
      {
        $set: {
          status: 'DECLINED',
          declinedAt: nowIso,
          updatedAt: nowIso,
        },
      }
    );

    await auditCol.insertOne({
      id: `audit_dec_${Date.now()}`,
      entityId: invitation.entityId,
      actorId: user.id,
      action: 'DECLINE_TEAM_INVITATION',
      details: { invitationId: invId },
      timestamp: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: 'Invitation declined successfully.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error declining invitation' },
      { status: 500 }
    );
  }
}
