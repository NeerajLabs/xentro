import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyJwtToken } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Validates internal Admin session using cryptographic JWT verification or active admin_sessions record.
 * Merely possessing an unvalidated bearer prefix or random cookie is strictly rejected.
 */
async function verifyAdminAuth(req: NextRequest, db: any): Promise<{ authenticated: boolean; adminInfo?: any }> {
  const authHeader = req.headers.get('authorization') || req.headers.get('x-admin-token');
  const cookieToken = req.cookies.get('xentro_admin_auth')?.value;
  let rawToken = cookieToken || '';

  if (authHeader) {
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      rawToken = authHeader.substring(7).trim();
    } else {
      rawToken = authHeader.trim();
    }
  }

  if (!rawToken) {
    return { authenticated: false };
  }

  // 1. Attempt cryptographic JWT verification
  const jwtPayload = verifyJwtToken(rawToken);
  if (jwtPayload) {
    const isStaffOrAdmin =
      jwtPayload.is_staff === true ||
      jwtPayload.isAdmin === true ||
      ['Super Admin', 'Master Admin', 'Operations Admin'].includes(jwtPayload.role) ||
      ['9922953', '8121417', '9911223', 'admin'].includes(String(jwtPayload.employeeId || jwtPayload.sub).toLowerCase());

    if (isStaffOrAdmin) {
      return { authenticated: true, adminInfo: jwtPayload };
    }
  }

  // 2. Fallback: Check MongoDB authoritative admin_sessions collection
  try {
    const sessionDoc = await db.collection('admin_sessions').findOne({
      $or: [{ token: rawToken }, { jwtToken: rawToken }],
      expiresAt: { $gt: new Date().toISOString() },
    });
    if (sessionDoc) {
      return { authenticated: true, adminInfo: sessionDoc };
    }
  } catch (err) {
    console.warn('[Admin Auth] Session lookup warning:', err);
  }

  return { authenticated: false };
}

/**
 * Internal Admin Affiliation Inspection Endpoint
 * Queries authoritative MongoDB collections: entity_affiliations, affiliation_invitations, entitlements, audit_logs.
 * Does not create shadow copies. Read-only inspection for authorized internal operations.
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    const affCol = db.collection('affiliations');
    const linksCol = db.collection('affiliate_links');
    const entitlementsCol = db.collection('entitlements');
    const auditCol = db.collection('audit_logs');
    const entitiesCol = db.collection('entities');

    const startupId = req.nextUrl.searchParams.get('startupId');
    const issuingId = req.nextUrl.searchParams.get('issuingId');
    const status = req.nextUrl.searchParams.get('status');
    const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') || '100', 10), 500);

    const auth = await verifyAdminAuth(req, db);
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Internal Administrative authorization required.' },
        { status: 401 }
      );
    }

    const affFilter: any = {};
    if (startupId) affFilter.startupEntityId = startupId;
    if (issuingId) affFilter.issuingEntityId = issuingId;
    if (status) affFilter.status = status;

    // 1. Fetch active and historical affiliations
    const rawAffiliations = await affCol
      .find(affFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    // Enrich affiliations with linked entitlement reference and startup/issuer details
    const affiliations = await Promise.all(
      rawAffiliations.map(async (aff: any) => {
        const entitlement = await entitlementsCol.findOne({
          affiliationId: aff.id,
        });

        return {
          affiliationId: aff.id,
          issuingEntityId: aff.issuingEntityId,
          issuingOrgName: aff.issuingOrgName,
          issuingOrgType: aff.issuingOrgType,
          startupEntityId: aff.startupEntityId,
          startupName: aff.startupName,
          category: aff.category || aff.programName,
          program: aff.programName,
          cohort: aff.cohort,
          sourceInvitationId: aff.sourceInvitationId || aff.linkId || null,
          invitationStatus: 'REDEEMED',
          activeRelationshipStatus: aff.status,
          acceptedAt: aff.acceptedAt || aff.createdAt,
          acceptedByUserId: aff.acceptedByUserId,
          revokedAt: aff.revokedAt || null,
          revokedByUserId: aff.revokedByUserId || null,
          revokedBySide: aff.revokedBySide || null,
          revocationReason: aff.revocationReason || null,
          issuerVisibilityConsent: aff.issuerVisibilityConsent !== false,
          startupVisibilityConsent: aff.startupVisibilityConsent !== false,
          isPubliclyVisible: Boolean(aff.issuerVisibilityConsent !== false && aff.startupVisibilityConsent !== false),
          mutualVisibilityConsent: Boolean(aff.issuerVisibilityConsent !== false && aff.startupVisibilityConsent !== false),
          entitlementReference: entitlement
            ? {
                id: entitlement.id,
                tier: entitlement.tier,
                status: entitlement.status,
                expiresAt: entitlement.expiresAt,
              }
            : null,
          startDate: aff.startDate || aff.acceptedAt || aff.createdAt,
          endDate: aff.endDate || '2027-03-31',
        };
      })
    );

    // 2. Fetch pending and historical invitation links
    const linkFilter: any = {};
    if (startupId) {
      linkFilter.$or = [
        { intendedStartupId: startupId },
        { redeemedByStartupId: startupId },
        { startupEntityId: startupId },
      ];
    }
    if (issuingId) linkFilter.issuingEntityId = issuingId;

    const rawInvitations = await linksCol
      .find(linkFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray();

    const invitations = rawInvitations.map((inv: any) => ({
      invitationId: inv.id,
      issuingEntityId: inv.issuingEntityId,
      issuingOrgName: inv.issuingOrgName,
      issuingOrgType: inv.issuingOrgType,
      intendedStartupId: inv.intendedStartupId || null,
      intendedStartupName: inv.intendedStartupName || null,
      category: inv.category || inv.programName,
      programName: inv.programName,
      cohort: inv.cohort,
      tokenMasked: inv.codeMasked || (inv.code ? `XENTRO-***-${inv.code.slice(-4)}` : 'XENTRO-***'),
      hasTokenHash: Boolean(inv.tokenHash),
      status: inv.status,
      isRedeemed: Boolean(inv.isRedeemed),
      redeemedAt: inv.redeemedAt || null,
      redeemedByStartupId: inv.redeemedByStartupId || null,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      isExpired: new Date(inv.expiresAt) < new Date(),
    }));

    // 3. Fetch audit history
    const auditFilter: any = {
      action: {
        $in: [
          'AFFILIATE_LINK_CREATED',
          'AFFILIATION_ACCEPTED',
          'AFFILIATION_INVITATION_DECLINED',
          'AFFILIATION_REVOKED',
          'AFFILIATION_INVITATION_CANCELLED',
        ],
      },
    };
    if (startupId) auditFilter.startupEntityId = startupId;
    if (issuingId) auditFilter.issuingEntityId = issuingId;

    const auditHistory = await auditCol
      .find(auditFilter)
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();

    // 4. Global statistics
    const totalActiveAffiliations = await affCol.countDocuments({ status: 'Active' });
    const totalRevokedAffiliations = await affCol.countDocuments({ status: 'Revoked' });
    const totalPendingInvitations = await linksCol.countDocuments({ status: 'PENDING', isRedeemed: { $ne: true } });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalActiveAffiliations,
          totalRevokedAffiliations,
          totalPendingInvitations,
        },
        affiliations,
        invitations,
        auditHistory,
      },
    });
  } catch (error: any) {
    console.error('Error in Admin affiliations API:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
