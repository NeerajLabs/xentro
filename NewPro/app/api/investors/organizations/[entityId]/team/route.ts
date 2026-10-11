import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ROLE_PERMISSION_PRESETS } from '@/lib/investorOrganizationService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function checkTeamPermission(
  db: any,
  entityId: string,
  userId: string
): Promise<{ allowed: boolean; role: string }> {
  if (!userId) return { allowed: true, role: 'Owner/Managing Partner' };

  const membershipsCol = db.collection('memberships');
  const membership = await membershipsCol.findOne({
    entityId,
    userId,
    status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
  });

  if (!membership) {
    const entitiesCol = db.collection('entities');
    const entity = await entitiesCol.findOne({
      id: entityId,
      $or: [{ createdByUserId: userId }, { currentOwnerUserId: userId }, { primaryOwnerId: userId }],
    });
    if (entity) {
      return { allowed: true, role: 'Owner/Managing Partner' };
    }
    return { allowed: false, role: '' };
  }

  const role = membership.role || 'Viewer';
  const presets = (ROLE_PERMISSION_PRESETS as any)[role];
  if (presets && presets.manageTeam) {
    return { allowed: true, role };
  }

  return { allowed: false, role };
}

/**
 * GET /api/investors/organizations/[entityId]/team
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const membershipsCol = db.collection('memberships');
    const usersCol = db.collection('users');
    const invCol = db.collection('invitations');

    // Fetch memberships
    const memberships = await membershipsCol.find({
      entityId: rawEntityId,
      status: { $in: ['ACTIVE', 'APPROVED', 'Active', 'PENDING_ADMIN_VERIFICATION'] },
    }).toArray();

    // Enrich with user profiles if possible
    const enrichedMembers = await Promise.all(
      memberships.map(async (m) => {
        let user = null;
        if (m.userId) {
          user = await usersCol.findOne({ id: m.userId });
        }
        return {
          id: m.id || `mem_${m._id}`,
          organizationId: rawEntityId,
          userId: m.userId,
          userName: m.userName || user?.fullName || user?.name || 'Team Member',
          userEmail: m.userEmail || user?.email || '',
          role: m.role || 'Viewer',
          title: m.title || m.role || 'Investment Team',
          avatar: m.avatar || user?.avatar || '/xentro-logo.png',
          isOwner: m.role === 'Owner/Managing Partner' || m.isOwner === true,
          isPublicTeam: m.isPublicTeam !== false,
          canAccessWorkspace: m.canAccessWorkspace !== false,
          dealAccessMode: m.dealAccessMode || 'all',
          portfolioAccessMode: m.portfolioAccessMode || 'all',
          status: m.status,
          joinedAt: m.createdAt || new Date().toISOString(),
        };
      })
    );

    // Fetch pending invitations
    const invitations = await invCol.find({
      entityId: rawEntityId,
      status: { $in: ['INVITED', 'PENDING', 'pending'] },
    }).toArray();

    const cleanInvitations = invitations.map((inv) => ({
      id: inv.id || `inv_${inv._id}`,
      organizationId: rawEntityId,
      email: inv.inviteeEmail || inv.email,
      name: inv.name || inv.inviteeName,
      role: inv.role || 'Associate',
      title: inv.title || inv.role || 'Associate',
      dealAccessMode: inv.dealAccessMode || 'all',
      portfolioAccessMode: inv.portfolioAccessMode || 'all',
      status: 'pending',
      invitedAt: inv.invitedAt || inv.createdAt || new Date().toISOString(),
      invitedBy: inv.inviterName || 'Managing Partner',
    }));

    return NextResponse.json({
      success: true,
      data: {
        members: enrichedMembers,
        invitations: cleanInvitations,
        count: enrichedMembers.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching organization team:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error fetching team' }, { status: 500 });
  }
}

/**
 * POST /api/investors/organizations/[entityId]/team
 * Invites a new team member with 9-role definition and scoping modes.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const callerUserId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    const db = await getDatabase();

    if (callerUserId) {
      const auth = await checkTeamPermission(db, rawEntityId, callerUserId);
      if (!auth.allowed) {
        return NextResponse.json({ success: false, message: 'Forbidden: manageTeam permission required.' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { email, name, role, title, dealAccessMode, portfolioAccessMode, invitedBy } = body;

    if (!email || !email.trim()) {
      return NextResponse.json({ success: false, message: 'Valid email address is required.' }, { status: 400 });
    }

    const invCol = db.collection('invitations');
    const nowIso = new Date().toISOString();
    const invId = `inv_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const inviteDoc = {
      id: invId,
      entityId: rawEntityId,
      organizationId: rawEntityId,
      inviteeEmail: email.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      name: name?.trim() || undefined,
      role: role || 'Associate',
      title: title?.trim() || role || 'Associate',
      dealAccessMode: dealAccessMode || 'all',
      portfolioAccessMode: portfolioAccessMode || 'all',
      status: 'INVITED',
      invitedAt: nowIso,
      invitedBy: invitedBy || 'Managing Partner',
      inviterId: callerUserId || undefined,
    };

    await invCol.insertOne(inviteDoc);
    delete (inviteDoc as any)._id;

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${email}`,
      data: inviteDoc,
    });
  } catch (error: any) {
    console.error('Error inviting team member:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error sending invitation' }, { status: 500 });
  }
}

/**
 * PUT /api/investors/organizations/[entityId]/team
 * Updates member role, visibility, or resource access mode.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const callerUserId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    const db = await getDatabase();

    if (callerUserId) {
      const auth = await checkTeamPermission(db, rawEntityId, callerUserId);
      if (!auth.allowed) {
        return NextResponse.json({ success: false, message: 'Forbidden: manageTeam permission required.' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { memberId, role, isPublicTeam, canAccessWorkspace, dealAccessMode, portfolioAccessMode } = body;

    if (!memberId) {
      return NextResponse.json({ success: false, message: 'Member ID is required' }, { status: 400 });
    }

    const membershipsCol = db.collection('memberships');
    const updateFields: any = { updatedAt: new Date().toISOString() };

    if (role) updateFields.role = role;
    if (isPublicTeam !== undefined) updateFields.isPublicTeam = isPublicTeam;
    if (canAccessWorkspace !== undefined) updateFields.canAccessWorkspace = canAccessWorkspace;
    if (dealAccessMode !== undefined) updateFields.dealAccessMode = dealAccessMode;
    if (portfolioAccessMode !== undefined) updateFields.portfolioAccessMode = portfolioAccessMode;

    await membershipsCol.updateOne(
      { entityId: rawEntityId, $or: [{ id: memberId }, { userId: memberId }] },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      message: 'Member access and role updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating member:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error updating member' }, { status: 500 });
  }
}

/**
 * DELETE /api/investors/organizations/[entityId]/team
 * Removes a member or revokes an invitation.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const callerUserId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    const db = await getDatabase();

    if (callerUserId) {
      const auth = await checkTeamPermission(db, rawEntityId, callerUserId);
      if (!auth.allowed) {
        return NextResponse.json({ success: false, message: 'Forbidden: manageTeam permission required.' }, { status: 403 });
      }
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get('memberId');
    const invitationId = searchParams.get('invitationId');

    if (invitationId) {
      const invCol = db.collection('invitations');
      await invCol.deleteOne({ entityId: rawEntityId, id: invitationId });
      return NextResponse.json({ success: true, message: 'Invitation revoked successfully.' });
    }

    if (memberId) {
      const membershipsCol = db.collection('memberships');
      // Protect owner from accidental deletion
      const existing = await membershipsCol.findOne({ entityId: rawEntityId, $or: [{ id: memberId }, { userId: memberId }] });
      if (existing?.role === 'Owner/Managing Partner' || existing?.isOwner) {
        return NextResponse.json({ success: false, message: 'Cannot remove the Owner/Managing Partner.' }, { status: 400 });
      }

      await membershipsCol.deleteOne({ entityId: rawEntityId, $or: [{ id: memberId }, { userId: memberId }] });
      return NextResponse.json({ success: true, message: 'Member removed from organization.' });
    }

    return NextResponse.json({ success: false, message: 'Specify memberId or invitationId to remove.' }, { status: 400 });
  } catch (error: any) {
    console.error('Error deleting team member:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error removing member' }, { status: 500 });
  }
}
