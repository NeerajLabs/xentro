import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/investors/organizations
 * Returns list of Investment Organizations.
 * If ?userId= is provided, returns organizations where caller has active membership or ownership.
 * Otherwise returns public directory of organizations.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId')?.trim();

    const db = await getDatabase();
    const invOrgCol = db.collection('investment_organizations');
    const membershipsCol = db.collection('memberships');

    if (userId) {
      // Find memberships for this user
      const userMemberships = await membershipsCol.find({
        userId,
        status: { $in: ['ACTIVE', 'APPROVED', 'Active', 'PENDING_ADMIN_VERIFICATION'] },
      }).toArray();

      const memberEntityIds = userMemberships.map((m) => m.entityId);

      const orgs = await invOrgCol.find({
        $or: [
          { entityId: { $in: memberEntityIds } },
          { ownerId: userId },
          { currentOwnerUserId: userId },
          { createdByUserId: userId },
        ],
      }).toArray();

      const clean = orgs.map((o) => {
        const copy: any = { ...o };
        delete copy._id;
        copy.id = copy.entityId || copy.id;
        return copy;
      });

      return NextResponse.json({
        success: true,
        data: clean,
        count: clean.length,
      });
    }

    // Public listing of organizations
    const publicOrgs = await invOrgCol.find({}).limit(50).toArray();
    const cleanPublic = publicOrgs.map((o) => {
      const copy: any = { ...o };
      delete copy._id;
      delete copy.subscription;
      delete copy.billingAccount;
      delete copy.invoices;
      copy.id = copy.entityId || copy.id;
      return copy;
    });

    return NextResponse.json({
      success: true,
      data: cleanPublic,
      count: cleanPublic.length,
    });
  } catch (error: any) {
    console.error('Error listing investment organizations:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error listing organizations' }, { status: 500 });
  }
}
