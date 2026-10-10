import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const usersCol = db.collection('users');
    const memCol = db.collection('memberships');
    const subCol = db.collection('subscriptions');
    const affCol = db.collection('affiliations');

    const query = {
      status: { $nin: ['ORPHANED_DELETED', 'DELETED', 'INACTIVE', 'ARCHIVED', 'REJECTED'] },
      isActive: { $ne: false },
      is_deleted: { $ne: true },
      deleted: { $ne: true },
    };

    const allEntities = await entitiesCol.find(query).sort({ createdAt: -1 }).limit(200).toArray();
    const results: any[] = [];

    for (const e of allEntities) {
      const eId = e.id || e._id.toString();
      const ownerId = e.primaryOwnerId || e.founderPersonalAccountId;
      let ownerName = e.primaryOwnerName || e.founderName || 'Founder';
      let ownerEmail = e.officialEmail || '';

      if (ownerId) {
        const owner = await usersCol.findOne({
          id: ownerId,
          isActive: { $ne: false },
          deleted: { $ne: true },
        });
        if (!owner) {
          // Skip orphaned entities whose owner was removed
          continue;
        }
        ownerName = owner.fullName || ownerName;
        ownerEmail = owner.email || ownerEmail;
      }

      const eType = e.entityType || 'Startup';
      let uiType = 'Startup';
      if (String(eType).toUpperCase() === 'STARTUP') {
        uiType = 'Startup';
      } else if (String(eType).toUpperCase() === 'ESP') {
        uiType = 'ESP';
      } else if (['INVESTOR', 'INVESTOR_ORG', 'VCI'].includes(String(eType).toUpperCase())) {
        uiType = 'Investor Organization';
      } else {
        uiType = eType;
      }

      // Real member count from memberships
      const realMemberCount = await memCol.countDocuments({
        entityId: eId,
        status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
      });
      const totalMembers = Math.max(1, realMemberCount);

      // Entitlement & Pro Status (Paid vs ESP Affiliation)
      const activeSub = await subCol.findOne({ entityId: eId, status: 'Active' });
      const activeAff = await affCol.findOne({ startupEntityId: eId, status: 'Active' });

      let entitlementTier = 'Startup Free';
      let entitlementSource = 'Complimentary Access';
      if (activeSub && activeSub.planName?.includes('Pro')) {
        entitlementTier = 'Startup Pro';
        entitlementSource = 'Paid Subscription';
      } else if (activeAff) {
        entitlementTier = 'Startup Pro';
        entitlementSource = `ESP Affiliation (${activeAff.issuingOrgName || 'ESP'})`;
      }

      // Capacity calculation for ESP
      let capacityData = null;
      if (uiType === 'ESP') {
        const usedCapacity = await affCol.countDocuments({ issuingEntityId: eId, status: 'Active' });
        capacityData = {
          includedCapacity: 250,
          usedCapacity,
          remainingCapacity: Math.max(0, 250 - usedCapacity),
        };
      }

      // Verification status
      const rawVerif = String(e.verificationStatus || '').toUpperCase();
      let uiVerif = 'Pending';
      if (['VERIFIED', 'APPROVED'].includes(rawVerif)) {
        uiVerif = 'Verified';
      } else if (['UNDER_REVIEW', 'IN_REVIEW'].includes(rawVerif)) {
        uiVerif = 'Under Review';
      }

      results.push({
        id: eId,
        name: e.name || e.startupName || 'Entity',
        legalName: e.legalName || e.name || 'Entity Legal',
        type: uiType,
        domain: e.officialDomain || e.website || '',
        officialEmail: ownerEmail || e.officialEmail || '',
        status: e.isActive !== false ? 'Active' : 'Suspended',
        verificationStatus: uiVerif,
        ownerApprovalStatus: e.ownerApprovalStatus || 'APPROVED',
        primaryOwner: {
          id: ownerId || '',
          name: ownerName,
          email: ownerEmail,
          role: 'Founder / Owner',
        },
        totalMembers,
        workspacesCount: 1,
        entitlementTier,
        entitlementSource,
        capacity: capacityData,
        createdAt: e.createdAt || '',
        createdDate: (e.createdAt || '').slice(0, 10),
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        entities: results,
        total: results.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin entities:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const entityId = url.searchParams.get('id');
    if (!entityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const reason = body.reason || 'Entity removed by Admin';

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const auditCol = db.collection('audit_logs');

    const ent = await entitiesCol.findOne({ id: entityId });
    if (!ent) {
      return NextResponse.json({ success: false, message: 'Entity not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    await auditCol.insertOne({
      action: 'ENTITY_ACCOUNT_DELETED',
      objectType: 'ENTITY',
      objectId: entityId,
      previousState: { id: entityId, name: ent.name, type: ent.entityType },
      reason,
      timestamp: now,
      performedBy: 'ADMIN_CONSOLE',
    });

    await entitiesCol.updateOne(
      { id: entityId },
      {
        $set: {
          isActive: false,
          is_deleted: true,
          deleted: true,
          status: 'DELETED',
          deletedAt: now,
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: `Entity '${ent.name}' removed successfully.`,
      deletedEntityId: entityId,
    });
  } catch (error: any) {
    console.error('Error deleting admin entity:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
