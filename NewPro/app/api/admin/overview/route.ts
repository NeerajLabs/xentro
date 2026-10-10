import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const db = await getDatabase();
    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');
    const verifCol = db.collection('verifications');
    const ticketsCol = db.collection('admin_tickets');

    const activeUserFilter = {
      isActive: { $ne: false },
      deleted: { $ne: true },
      is_deleted: { $ne: true },
    };

    const totalUsers = await usersCol.countDocuments(activeUserFilter);
    const verifiedUsers = await usersCol.countDocuments({
      identityStatus: { $in: ['VERIFIED', 'Verified'] },
      ...activeUserFilter,
    });

    const activeEntityFilter = {
      status: { $nin: ['ORPHANED_DELETED', 'DELETED', 'INACTIVE', 'ARCHIVED', 'REJECTED'] },
      isActive: { $ne: false },
      is_deleted: { $ne: true },
      deleted: { $ne: true },
    };

    const startupsCount = await entitiesCol.countDocuments({
      entityType: { $in: ['STARTUP', 'Startup'] },
      ...activeEntityFilter,
    });

    const investorsCount = await entitiesCol.countDocuments({
      entityType: { $in: ['INVESTOR', 'Investor', 'INVESTOR_ORG'] },
      ...activeEntityFilter,
    });

    const espsCount = await entitiesCol.countDocuments({
      entityType: { $in: ['ESP', 'Esp'] },
      ...activeEntityFilter,
    });

    const mentorsCount = await usersCol.countDocuments({
      accountType: 'Mentor',
      ...activeUserFilter,
    });

    const pendingKyc = await verifCol.countDocuments({ status: { $in: ['PENDING', 'Under Review'] } });
    const pendingStartups = await entitiesCol.countDocuments({
      entityType: { $in: ['STARTUP', 'Startup'] },
      verificationStatus: { $in: ['PENDING', 'Pending', 'Under Review'] },
      ...activeEntityFilter,
    });
    const pendingEsps = await ticketsCol.countDocuments({
      requestCategory: { $in: ['ESP', 'INSTITUTION'] },
      status: { $in: ['PENDING', 'OPEN', 'UNDER_REVIEW'] },
    });

    return NextResponse.json({
      success: true,
      data: {
        kpis: {
          totalPersonalAccounts: totalUsers,
          verifiedPersonalAccounts: verifiedUsers,
          startupEntities: startupsCount,
          mentors: mentorsCount,
          investorEntities: investorsCount,
          espEntities: espsCount,
          mrr: 480000,
          activeSubscriptions: startupsCount + investorsCount,
        },
        attentionQueue: {
          pendingKycReviews: pendingKyc,
          pendingStartupVerifications: pendingStartups,
          pendingEspRequests: pendingEsps,
          pendingEndorsements: 0,
          openSupportCases: 0,
          reportedPosts: 0,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin overview KPIs:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
