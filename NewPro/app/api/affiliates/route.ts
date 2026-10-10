import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { evaluateStartupCapability } from '@/lib/startupRbac';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    const affCol = db.collection('affiliations');
    const linksCol = db.collection('affiliate_links');

    const startupId = req.nextUrl.searchParams.get('startupId');
    const issuingId = req.nextUrl.searchParams.get('issuingId');
    const type = req.nextUrl.searchParams.get('type') || 'all';

    const filter: any = {};
    if (startupId) filter.startupEntityId = startupId;
    if (issuingId) filter.issuingEntityId = issuingId;

    if (type === 'links') {
      const links = await linksCol.find(filter).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ success: true, data: { links } });
    }

    const affiliations = await affCol.find(filter).sort({ createdAt: -1 }).toArray();
    const links = await linksCol.find(filter).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      data: {
        affiliations,
        links,
      },
    });
  } catch (error: any) {
    console.error('Error fetching affiliations:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const db = await getDatabase();
    const affCol = db.collection('affiliations');
    const linksCol = db.collection('affiliate_links');
    const entitlementsCol = db.collection('entitlements');
    const entitiesCol = db.collection('entities');
    const auditCol = db.collection('audit_logs');
    const memCol = db.collection('memberships');

    const now = new Date().toISOString();

    // -------------------------------------------------------------
    // ACTION 1: CREATE_LINK (Issued by ESP / Institution)
    // -------------------------------------------------------------
    if (action === 'CREATE_LINK') {
      const {
        issuingEntityId,
        intendedStartupName,
        intendedStartupId,
        programName,
        cohort,
        assignedMentor,
        createdByUserId,
      } = body;

      if (!issuingEntityId) {
        return NextResponse.json({ success: false, message: 'Issuing entity ID required.' }, { status: 400 });
      }

      const issuingOrg = await entitiesCol.findOne({ id: issuingEntityId });
      if (!issuingOrg) {
        return NextResponse.json({ success: false, message: 'Issuing organization not found.' }, { status: 404 });
      }

      // Check ESP Capacity (max 250 distinct affiliated startups)
      const orgType = (issuingOrg.entityType || '').toUpperCase();
      if (orgType === 'ESP') {
        const distinctStartups = await affCol.distinct('startupEntityId', {
          issuingEntityId,
          status: 'Active',
        });
        if (distinctStartups.length >= 250) {
          return NextResponse.json(
            { success: false, message: 'ESP capacity limit reached (250 distinct startup accounts).' },
            { status: 400 }
          );
        }
      }

      const linkId = `aff_link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const redemptionCode = `XENTRO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const linkDoc = {
        id: linkId,
        code: redemptionCode,
        issuingEntityId,
        issuingOrgName: issuingOrg.name || 'Incubation Program',
        issuingOrgType: orgType === 'ESP' ? 'ESP' : 'Institution',
        intendedStartupName: intendedStartupName || '',
        intendedStartupId: intendedStartupId || '',
        programName: programName || 'Acceleration Cohort',
        cohort: cohort || '2025/2026',
        assignedMentor: assignedMentor || '',
        createdByUserId: createdByUserId || '',
        status: 'PENDING',
        isRedeemed: false,
        redeemedAt: null,
        redeemedByStartupId: null,
        createdAt: now,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      };

      await linksCol.insertOne(linkDoc);

      await auditCol.insertOne({
        action: 'AFFILIATE_LINK_CREATED',
        linkId,
        issuingEntityId,
        performedBy: createdByUserId || 'ESP_ADMIN',
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        message: 'Single-use affiliate link generated successfully.',
        data: { link: linkDoc },
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: ACCEPT (Startup redeems single-use link)
    // -------------------------------------------------------------
    if (action === 'ACCEPT') {
      const { code, startupEntityId, userId } = body;

      if (!code || !startupEntityId || !userId) {
        return NextResponse.json(
          { success: false, message: 'Redemption code, startup entity ID and user ID are required.' },
          { status: 400 }
        );
      }

      // Check Startup RBAC: Only Owner/Founder can accept affiliation commitments
      const membership = await memCol.findOne({
        entityId: startupEntityId,
        userId,
        status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
      });

      const userRole = membership?.role || 'VIEWER';
      const rbacCheck = evaluateStartupCapability(userRole, 'affiliate', 'acceptAffiliation');
      if (!rbacCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            message: 'Only the Startup Owner / Founder has authorization to accept institutional affiliations.',
          },
          { status: 403 }
        );
      }

      // Look up and validate single-use link
      const link = await linksCol.findOne({ code: code.trim().toUpperCase() });
      if (!link) {
        return NextResponse.json({ success: false, message: 'Invalid affiliate code.' }, { status: 404 });
      }

      if (link.isRedeemed || link.status === 'REDEEMED') {
        return NextResponse.json(
          { success: false, message: 'This single-use affiliate code has already been redeemed.' },
          { status: 400 }
        );
      }

      if (new Date(link.expiresAt) < new Date()) {
        return NextResponse.json({ success: false, message: 'This affiliate code has expired.' }, { status: 400 });
      }

      // Validate intended startup if explicitly designated
      if (link.intendedStartupId && link.intendedStartupId !== startupEntityId) {
        return NextResponse.json(
          { success: false, message: 'This invitation was designated for a different venture.' },
          { status: 403 }
        );
      }

      const startup = await entitiesCol.findOne({ id: startupEntityId });
      if (!startup) {
        return NextResponse.json({ success: false, message: 'Startup entity not found.' }, { status: 404 });
      }

      // Mark link redeemed (Single-use policy)
      await linksCol.updateOne(
        { id: link.id },
        {
          $set: {
            isRedeemed: true,
            status: 'REDEEMED',
            redeemedAt: now,
            redeemedByStartupId: startupEntityId,
            redeemedByUserId: userId,
          },
        }
      );

      // Create Active Affiliation Record
      const affId = `aff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const affDoc = {
        id: affId,
        startupEntityId,
        startupName: startup.name || 'Startup',
        issuingEntityId: link.issuingEntityId,
        issuingOrgName: link.issuingOrgName,
        issuingOrgType: link.issuingOrgType,
        programName: link.programName,
        cohort: link.cohort,
        assignedMentor: link.assignedMentor,
        status: 'Active',
        acceptedAt: now,
        acceptedByUserId: userId,
        linkId: link.id,
      };

      await affCol.insertOne(affDoc);

      // Grant Affiliation-based Startup Pro Entitlement
      const entitlementId = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const entitlementDoc = {
        id: entitlementId,
        startupEntityId,
        tier: 'Startup Pro',
        source: `${link.issuingOrgType} Affiliation`,
        sponsoringEntityId: link.issuingEntityId,
        sponsoringEntityName: link.issuingOrgName,
        affiliationId: affId,
        status: 'Active',
        grantedAt: now,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year sponsored
      };

      await entitlementsCol.insertOne(entitlementDoc);

      // Audit Log
      await auditCol.insertOne({
        action: 'AFFILIATION_ACCEPTED_PRO_GRANTED',
        affiliationId: affId,
        startupEntityId,
        issuingEntityId: link.issuingEntityId,
        entitlementId,
        acceptedBy: userId,
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        message: `Affiliation accepted with ${link.issuingOrgName}! Startup Pro suite activated.`,
        data: { affiliation: affDoc, entitlement: entitlementDoc },
      });
    }

    // -------------------------------------------------------------
    // ACTION 3: REVOKE (Revoke affiliation & invalidate entitlement)
    // -------------------------------------------------------------
    if (action === 'REVOKE') {
      const { affiliationId, revokingUserId, reason } = body;

      if (!affiliationId) {
        return NextResponse.json({ success: false, message: 'Affiliation ID required.' }, { status: 400 });
      }

      const aff = await affCol.findOne({ id: affiliationId });
      if (!aff) {
        return NextResponse.json({ success: false, message: 'Affiliation record not found.' }, { status: 404 });
      }

      // Mark affiliation revoked
      await affCol.updateOne(
        { id: affiliationId },
        {
          $set: {
            status: 'Revoked',
            revokedAt: now,
            revokedByUserId: revokingUserId || 'ADMIN',
            revocationReason: reason || 'Administrative revocation',
          },
        }
      );

      // Invalidate linked entitlement
      await entitlementsCol.updateMany(
        { affiliationId, status: 'Active' },
        {
          $set: {
            status: 'Revoked',
            revokedAt: now,
            revocationReason: reason || 'Affiliation revoked',
          },
        }
      );

      // Audit Log
      await auditCol.insertOne({
        action: 'AFFILIATION_REVOKED',
        affiliationId,
        startupEntityId: aff.startupEntityId,
        issuingEntityId: aff.issuingEntityId,
        revokedBy: revokingUserId || 'ADMIN',
        reason: reason || 'Revocation',
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        message: 'Affiliation revoked and linked entitlement invalidated.',
      });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error in affiliates API:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
