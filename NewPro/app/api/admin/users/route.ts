import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');
    const memCol = db.collection('memberships');
    const connCol = db.collection('connections');
    const mentorCol = db.collection('mentor_profiles');
    const invCol = db.collection('investor_profiles');

    const statusTab = req.nextUrl.searchParams.get('status') || 'All';
    const modeFilter = req.nextUrl.searchParams.get('mode') || 'All';
    const searchQuery = (req.nextUrl.searchParams.get('search') || '').trim().toLowerCase();

    const baseFilter = {
      accountStatus: { $ne: 'DELETED' },
      deleted: { $ne: true },
    };

    const allUsers = await usersCol.find(baseFilter).sort({ createdAt: -1 }).limit(500).toArray();

    const counts = {
      all: 0,
      requests: 0,
      pending_verification: 0,
      verified: 0,
      restricted: 0,
      suspended: 0,
      archived: 0,
    };

    const processedUsers: any[] = [];

    for (const u of allUsers) {
      const uId = u.id || u._id.toString();
      const pProf = u.personalProfile || {};
      const idStatusRaw = String(u.identityStatus || 'NOT_SUBMITTED').toUpperCase();
      const acctStatusRaw = String(u.accountStatus || 'ACTIVE').toUpperCase();
      const isDeleted = Boolean(u.deleted || u.is_deleted);

      // Identity Status
      let idStatusUi = 'Not Submitted';
      if (['VERIFIED', 'APPROVED'].includes(idStatusRaw)) {
        idStatusUi = 'Verified';
      } else if (['UNDER_REVIEW', 'IN_REVIEW'].includes(idStatusRaw)) {
        idStatusUi = 'Under Review';
      } else if (idStatusRaw === 'PENDING') {
        idStatusUi = 'Pending';
      } else if (['REJECTED', 'FAILED'].includes(idStatusRaw)) {
        idStatusUi = 'Failed';
      }

      // Account Status
      let acctStatusUi = 'Active';
      if (isDeleted || acctStatusRaw === 'ARCHIVED') {
        acctStatusUi = 'Archived';
      } else if (['SUSPENDED', 'BANNED'].includes(acctStatusRaw)) {
        acctStatusUi = 'Suspended';
      } else if (['RESTRICTED', 'LOCKED'].includes(acctStatusRaw)) {
        acctStatusUi = 'Restricted';
      } else if (['PENDING_APPROVAL', 'PENDING_VERIFICATION', 'PROFILE_SETUP_PENDING'].includes(acctStatusRaw)) {
        acctStatusUi = 'Pending Verification';
      }

      const isRegRequest = Boolean(
        ['PENDING_APPROVAL', 'REGISTRATION_REQUESTED'].includes(acctStatusRaw) ||
          u.registrationRequest?.status === 'PENDING'
      );

      // Count tallies
      if (!isDeleted && acctStatusUi !== 'Archived') {
        counts.all += 1;
      } else {
        counts.archived += 1;
      }
      if (isRegRequest) counts.requests += 1;
      if (['Pending', 'Under Review'].includes(idStatusUi)) counts.pending_verification += 1;
      if (idStatusUi === 'Verified') counts.verified += 1;
      if (acctStatusUi === 'Restricted') counts.restricted += 1;
      if (acctStatusUi === 'Suspended') counts.suspended += 1;

      // Real Entity Memberships
      const entityMemberships: any[] = [];
      const userMemberships = await memCol.find({ userId: uId }).toArray();
      for (const m of userMemberships) {
        const ent = await entitiesCol.findOne({ id: m.entityId });
        if (ent && !ent.is_deleted && ent.status !== 'ORPHANED_DELETED') {
          entityMemberships.push({
            entityId: ent.id,
            entityName: ent.name || ent.startupName || 'Entity',
            entityType: ent.entityType || 'Startup',
            role: m.role || 'Member',
            status: m.status || 'ACTIVE',
            dateAdded: m.createdAt || m.joinedAt || 'Recently',
          });
        }
      }

      const ownedEnts = await entitiesCol
        .find({
          primaryOwnerId: uId,
          isActive: { $ne: false },
          status: { $nin: ['ORPHANED_DELETED', 'DELETED'] },
        })
        .toArray();

      for (const ent of ownedEnts) {
        if (!entityMemberships.some((e) => e.entityId === ent.id)) {
          entityMemberships.push({
            entityId: ent.id,
            entityName: ent.name || ent.startupName || 'Entity',
            entityType: ent.entityType || 'Startup',
            role: 'Founder / Owner',
            status: 'Active',
            dateAdded: ent.createdAt || 'Recently',
          });
        }
      }

      // Section 4 Directive: Exactly one current personal account type
      const acctType = String(u.accountType || '').trim();
      const roleTitle = String(u.roleTitle || '').trim();
      const mProf = await mentorCol.findOne({ userId: uId, status: { $in: ['ACTIVE', 'APPROVED', 'Active'] } });
      const iProf = await invCol.findOne({ userId: uId, status: { $in: ['ACTIVE', 'APPROVED', 'Active'] } });

      let currentAccountType = 'Explorer';
      if (acctType === 'Mentor' || roleTitle === 'Mentor' || mProf || (u.activeRoles || []).includes('Mentor')) {
        currentAccountType = 'Mentor';
      } else if (
        ['Individual Investor', 'Investor'].includes(acctType) ||
        ['Individual Investor', 'Investor'].includes(roleTitle) ||
        iProf ||
        (u.activeRoles || []).includes('Individual Investor') ||
        (u.activeRoles || []).includes('Investor')
      ) {
        currentAccountType = 'Individual Investor';
      }

      const participationModes = [currentAccountType];

      // Connections Count
      const connCount = await connCol.countDocuments({
        $or: [
          { requesterId: uId, status: 'CONNECTED' },
          { receiverId: uId, status: 'CONNECTED' },
        ],
      });

      const lastActive = u.lastActive || u.lastLogin || 'Unavailable';
      const photo = u.photoUrl || u.avatar || pProf.photoUrl || '';

      processedUsers.push({
        id: uId,
        profileId: u.profileId || uId,
        name: u.fullName || u.name || u.username || 'Explorer',
        email: u.email || '',
        phone: u.phoneNumber || '',
        avatar: photo,
        identityStatus: idStatusUi,
        accountStatus: acctStatusUi,
        isActive: acctStatusUi === 'Active',
        participationModes,
        role: currentAccountType,
        createdDate: (u.createdAt || '').slice(0, 10),
        createdAt: u.createdAt || '',
        lastActive,
        connectionsCount: connCount,
        bio: u.bio || pProf.bio || 'Verified Xentro ecosystem member',
        entityMemberships,
        isRegistrationRequest: isRegRequest,
      });
    }

    // Tab Filtering
    let filtered = processedUsers;
    if (statusTab === 'Registration Requests') {
      filtered = filtered.filter((pu) => pu.isRegistrationRequest);
    } else if (statusTab === 'Pending Verification') {
      filtered = filtered.filter((pu) => ['Pending', 'Under Review'].includes(pu.identityStatus));
    } else if (statusTab === 'Verified') {
      filtered = filtered.filter((pu) => pu.identityStatus === 'Verified');
    } else if (statusTab === 'Restricted') {
      filtered = filtered.filter((pu) => pu.accountStatus === 'Restricted');
    } else if (statusTab === 'Suspended') {
      filtered = filtered.filter((pu) => pu.accountStatus === 'Suspended');
    } else if (statusTab === 'Archived') {
      filtered = filtered.filter((pu) => pu.accountStatus === 'Archived');
    } else if (statusTab === 'All') {
      filtered = filtered.filter((pu) => pu.accountStatus !== 'Archived');
    }

    // Mode Filtering
    if (modeFilter !== 'All') {
      filtered = filtered.filter((pu) => pu.participationModes.includes(modeFilter));
    }

    // Text Search
    if (searchQuery) {
      filtered = filtered.filter(
        (pu) =>
          pu.name.toLowerCase().includes(searchQuery) ||
          pu.email.toLowerCase().includes(searchQuery) ||
          String(pu.phone).toLowerCase().includes(searchQuery) ||
          pu.id.toLowerCase().includes(searchQuery)
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        users: filtered,
        total: filtered.length,
        counts,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
