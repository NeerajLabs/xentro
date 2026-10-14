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

    // For startup queries, also include pending unredeemed links targeted at this startup
    let linksFilter = { ...filter };
    if (startupId) {
      linksFilter = {
        $or: [
          { startupEntityId: startupId },
          { intendedStartupId: startupId },
          { redeemedByStartupId: startupId },
        ],
      } as any;
    }
    const links = await linksCol.find(linksFilter).sort({ createdAt: -1 }).toArray();

    // Calculate capacity metrics for issuing organization (ESP 250 limit)
    let capacity = null;
    if (issuingId) {
      const distinctActiveStartups = await affCol.distinct('startupEntityId', {
        issuingEntityId: issuingId,
        status: 'Active',
      });
      capacity = {
        used: distinctActiveStartups.length,
        max: 250,
        remaining: Math.max(0, 250 - distinctActiveStartups.length),
        isAtCapacity: distinctActiveStartups.length >= 250,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        affiliations,
        links,
        capacity,
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
    const notifsCol = db.collection('notifications');

    const now = new Date().toISOString();

    // -------------------------------------------------------------
    // ACTION 1: CREATE_LINK (Issued by ESP / Institution)
    // -------------------------------------------------------------
    if (action === 'CREATE_LINK') {
      const {
        issuingEntityId,
        intendedStartupName,
        intendedStartupId,
        intendedFounderEmail,
        programName,
        cohort,
        assignedMentor,
        createdByUserId,
        notes,
      } = body;

      if (!issuingEntityId) {
        return NextResponse.json({ success: false, message: 'Issuing entity ID required.' }, { status: 400 });
      }

      const issuingOrg = await entitiesCol.findOne({ id: issuingEntityId });
      if (!issuingOrg) {
        return NextResponse.json({ success: false, message: 'Issuing organization not found.' }, { status: 404 });
      }

      // Check ESP Capacity (max 250 distinct active affiliated startups in V1)
      const rawOrgType = (issuingOrg.entityType || '').toUpperCase();
      const orgType = rawOrgType === 'ESP' ? 'ESP' : 'Institution';
      if (orgType === 'ESP') {
        const distinctActiveStartups = await affCol.distinct('startupEntityId', {
          issuingEntityId,
          status: 'Active',
        });
        if (distinctActiveStartups.length >= 250) {
          return NextResponse.json(
            {
              success: false,
              message: 'ESP capacity limit reached (maximum 250 distinct affiliated startups in V1). Overflow is blocked.',
            },
            { status: 400 }
          );
        }
      }

      const linkId = `aff_link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const redemptionCode = `XENTRO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Approved V1 Default: 7-day invitation expiry
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const linkDoc = {
        id: linkId,
        code: redemptionCode,
        issuingEntityId,
        issuingOrgName: issuingOrg.name || 'Incubation Program',
        issuingOrgType: orgType,
        intendedStartupName: (intendedStartupName || '').trim(),
        intendedStartupId: (intendedStartupId || '').trim(),
        intendedFounderEmail: (intendedFounderEmail || '').trim().toLowerCase(),
        programName: (programName || 'Incubation / Acceleration Program').trim(),
        cohort: (cohort || 'Current Cohort').trim(),
        assignedMentor: (assignedMentor || '').trim(),
        notes: (notes || '').trim(),
        createdByUserId: createdByUserId || '',
        status: 'PENDING',
        isRedeemed: false,
        redeemedAt: null,
        redeemedByStartupId: null,
        redeemedByUserId: null,
        createdAt: now,
        expiresAt,
      };

      await linksCol.insertOne(linkDoc);

      // Audit Log
      await auditCol.insertOne({
        action: 'AFFILIATE_LINK_CREATED',
        linkId,
        issuingEntityId,
        issuingOrgType: orgType,
        intendedStartupId: linkDoc.intendedStartupId,
        expiresAt,
        performedBy: createdByUserId || 'ESP_ADMIN',
        timestamp: now,
      });

      // Dispatch in-app notification to intended startup owner if known
      if (linkDoc.intendedStartupId) {
        try {
          const targetStartup = await entitiesCol.findOne({ id: linkDoc.intendedStartupId });
          const targetOwnerId = targetStartup?.primaryOwnerId || targetStartup?.currentOwnerUserId || targetStartup?.createdByUserId;
          if (targetOwnerId) {
            await notifsCol.insertOne({
              id: `notif_aff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              userId: targetOwnerId,
              type: 'AFFILIATION_OFFER',
              category: 'affiliation',
              title: `${issuingOrg.name} sent you an Affiliation Invitation`,
              description: `Formal affiliation offer for ${linkDoc.programName} (${linkDoc.cohort}). Valid for 7 days.`,
              time: 'Just now',
              actorName: issuingOrg.name,
              actorId: issuingEntityId,
              linkId,
              code: redemptionCode,
              actionRequired: true,
              actionType: 'affiliation_invite',
              targetTab: 'dashboard',
              unread: true,
              read: false,
              createdAt: now,
              updatedAt: now,
            });
          }
        } catch (notifErr) {
          console.warn('[Affiliates] Failed to dispatch startup notification:', notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Targeted single-use affiliate link generated successfully (valid for 7 days).',
        data: { link: linkDoc },
      });
    }

    // -------------------------------------------------------------
    // ACTION 2: ACCEPT (Startup redeems single-use link)
    // -------------------------------------------------------------
    if (action === 'ACCEPT') {
      const { code, startupEntityId, userId, mutualVisibilityConsent } = body;

      if (!code || !startupEntityId || !userId) {
        return NextResponse.json(
          { success: false, message: 'Redemption code, startup entity ID and user ID are required.' },
          { status: 400 }
        );
      }

      // 1. Verify Startup entity exists
      const startup = await entitiesCol.findOne({ id: startupEntityId });
      if (!startup) {
        return NextResponse.json({ success: false, message: 'Startup entity not found.' }, { status: 404 });
      }

      // 2. Authorize actor: Only Startup Owner / Founder has authority to accept affiliations
      const isHead = (
        startup.primaryOwnerId === userId ||
        startup.currentOwnerUserId === userId ||
        startup.createdByUserId === userId
      );

      const membership = await memCol.findOne({
        entityId: startupEntityId,
        userId,
        status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
      });

      const userRole = membership?.role || (isHead ? 'OWNER' : 'VIEWER');
      const rbacCheck = evaluateStartupCapability(userRole, 'affiliate', 'acceptAffiliation');

      if (!isHead && !rbacCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            message: 'Access denied: Only the Startup Owner / Founder is authorized to accept institutional affiliations.',
          },
          { status: 403 }
        );
      }

      // 3. Look up single-use link and validate constraints
      const link = await linksCol.findOne({ code: code.trim().toUpperCase() });
      if (!link) {
        return NextResponse.json({ success: false, message: 'Invalid affiliate code.' }, { status: 404 });
      }

      if (link.isRedeemed || link.status === 'REDEEMED') {
        return NextResponse.json(
          { success: false, message: 'This single-use affiliate invitation has already been redeemed.' },
          { status: 400 }
        );
      }

      if (link.status === 'DECLINED') {
        return NextResponse.json(
          { success: false, message: 'This affiliate invitation was previously declined.' },
          { status: 400 }
        );
      }

      if (new Date(link.expiresAt) < new Date()) {
        return NextResponse.json(
          { success: false, message: 'This affiliate invitation has expired (7-day validity window exceeded).' },
          { status: 400 }
        );
      }

      // 4. Strict Recipient Binding Check
      if (link.intendedStartupId && link.intendedStartupId !== startupEntityId) {
        return NextResponse.json(
          {
            success: false,
            message: 'This invitation is designated exclusively for another startup venture.',
          },
          { status: 403 }
        );
      }

      // 5. Prevent duplicate active affiliation between the exact same pair
      const existingAff = await affCol.findOne({
        startupEntityId,
        issuingEntityId: link.issuingEntityId,
        status: 'Active',
      });
      if (existingAff) {
        return NextResponse.json(
          {
            success: false,
            message: `Your venture is already actively affiliated with ${link.issuingOrgName}.`,
          },
          { status: 409 }
        );
      }

      // 6. Check issuing ESP capacity limit (max 250 distinct active startups)
      if (link.issuingOrgType === 'ESP') {
        const distinctActive = await affCol.distinct('startupEntityId', {
          issuingEntityId: link.issuingEntityId,
          status: 'Active',
        });
        if (distinctActive.length >= 250 && !distinctActive.includes(startupEntityId)) {
          return NextResponse.json(
            {
              success: false,
              message: 'The issuing ESP has reached its maximum capacity of 250 affiliated startups.',
            },
            { status: 400 }
          );
        }
      }

      // 7. Atomic Lock: Mark link redeemed (prevents concurrency double-spend)
      const lockResult = await linksCol.updateOne(
        { id: link.id, isRedeemed: { $ne: true }, status: 'PENDING' },
        {
          $set: {
            isRedeemed: true,
            status: 'REDEEMED',
            redeemedAt: now,
            redeemedByStartupId: startupEntityId,
            redeemedByUserId: userId,
            updatedAt: now,
          },
        }
      );

      if (lockResult.modifiedCount === 0) {
        return NextResponse.json(
          { success: false, message: 'This invitation was already redeemed in a concurrent session.' },
          { status: 409 }
        );
      }

      // 8. Create Active Affiliation Record
      const affId = `aff_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const affDoc = {
        id: affId,
        startupEntityId,
        startupName: startup.name || 'Startup',
        issuingEntityId: link.issuingEntityId,
        issuingOrgName: link.issuingOrgName,
        issuingOrgType: link.issuingOrgType, // 'ESP' | 'Institution'
        programName: link.programName,
        cohort: link.cohort,
        assignedMentor: link.assignedMentor,
        mutualVisibilityConsent: mutualVisibilityConsent !== false,
        status: 'Active',
        acceptedAt: now,
        acceptedByUserId: userId,
        linkId: link.id,
        createdAt: now,
        updatedAt: now,
      };

      await affCol.insertOne(affDoc);

      // 9. Startup Pro Entitlement (ESP ONLY — Institutions do not automatically grant Pro in V1)
      let entitlementDoc: any = null;
      if (link.issuingOrgType === 'ESP') {
        const entitlementId = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        entitlementDoc = {
          id: entitlementId,
          startupEntityId,
          tier: 'Startup Pro',
          source: 'ESP Affiliation',
          sponsoringEntityId: link.issuingEntityId,
          sponsoringEntityName: link.issuingOrgName,
          affiliationId: affId,
          status: 'Active',
          grantedAt: now,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year sponsored
        };
        await entitlementsCol.insertOne(entitlementDoc);
      }

      // 10. Sync to Startup entity metadata for profile rendering
      await entitiesCol.updateOne(
        { id: startupEntityId },
        {
          $set: {
            incubatorAffiliation: link.issuingOrgName,
            updatedAt: now,
          },
          $addToSet: {
            affiliatedOrgs: {
              affiliationId: affId,
              orgId: link.issuingEntityId,
              orgName: link.issuingOrgName,
              orgType: link.issuingOrgType,
              programName: link.programName,
              cohort: link.cohort,
              since: now,
            },
          },
        }
      );

      // 11. Audit Log
      await auditCol.insertOne({
        action: 'AFFILIATION_ACCEPTED',
        affiliationId: affId,
        startupEntityId,
        issuingEntityId: link.issuingEntityId,
        issuingOrgType: link.issuingOrgType,
        grantedPro: Boolean(entitlementDoc),
        acceptedBy: userId,
        timestamp: now,
      });

      // 12. Notify Issuing ESP / Institution Head
      try {
        const issuingOrg = await entitiesCol.findOne({ id: link.issuingEntityId });
        const issuingHeadId = issuingOrg?.primaryOwnerId || issuingOrg?.currentOwnerUserId || issuingOrg?.createdByUserId;
        if (issuingHeadId) {
          await notifsCol.insertOne({
            id: `notif_aff_acc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: issuingHeadId,
            type: 'AFFILIATION_ACCEPTED',
            category: 'affiliation',
            title: `${startup.name} accepted your Affiliation Invitation`,
            description: `Official affiliation established for ${link.programName} (${link.cohort}).`,
            time: 'Just now',
            actorName: startup.name,
            actorId: startupEntityId,
            affiliationId: affId,
            unread: true,
            read: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      } catch (e) {
        console.warn('[Affiliates] Failed to dispatch issuing org notification:', e);
      }

      const message = link.issuingOrgType === 'ESP'
        ? `Affiliation established with ${link.issuingOrgName}! Startup Pro suite activated.`
        : `Affiliation established with ${link.issuingOrgName}!`;

      return NextResponse.json({
        success: true,
        message,
        data: { affiliation: affDoc, entitlement: entitlementDoc },
      });
    }

    // -------------------------------------------------------------
    // ACTION 3: DECLINE (Startup rejects pending affiliate link)
    // -------------------------------------------------------------
    if (action === 'DECLINE') {
      const { code, startupEntityId, userId, reason } = body;

      if (!code || !startupEntityId || !userId) {
        return NextResponse.json(
          { success: false, message: 'Code, startup entity ID and user ID are required.' },
          { status: 400 }
        );
      }

      const link = await linksCol.findOne({ code: code.trim().toUpperCase() });
      if (!link) {
        return NextResponse.json({ success: false, message: 'Affiliate invitation not found.' }, { status: 404 });
      }

      if (link.isRedeemed || link.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, message: `Invitation cannot be declined (current state: ${link.status}).` },
          { status: 400 }
        );
      }

      await linksCol.updateOne(
        { id: link.id },
        {
          $set: {
            status: 'DECLINED',
            declinedAt: now,
            declinedByStartupId: startupEntityId,
            declinedByUserId: userId,
            declineReason: reason || 'Declined by founder',
            updatedAt: now,
          },
        }
      );

      // Audit Log
      await auditCol.insertOne({
        action: 'AFFILIATION_INVITATION_DECLINED',
        linkId: link.id,
        startupEntityId,
        issuingEntityId: link.issuingEntityId,
        declinedBy: userId,
        reason: reason || 'Declined by founder',
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        message: 'Affiliation invitation has been declined.',
      });
    }

    // -------------------------------------------------------------
    // ACTION 4: REVOKE (Revoke active relationship by EITHER party)
    // -------------------------------------------------------------
    if (action === 'REVOKE') {
      const { affiliationId, revokingEntityId, revokingUserId, reason } = body;

      if (!affiliationId) {
        return NextResponse.json({ success: false, message: 'Affiliation ID required.' }, { status: 400 });
      }

      const aff = await affCol.findOne({ id: affiliationId });
      if (!aff) {
        return NextResponse.json({ success: false, message: 'Affiliation record not found.' }, { status: 404 });
      }

      if (aff.status === 'Revoked') {
        return NextResponse.json({ success: false, message: 'This affiliation is already revoked.' }, { status: 400 });
      }

      // Authorization: Must be initiated by either the Issuing Organization or the Affiliated Startup
      const isIssuing = revokingEntityId && revokingEntityId === aff.issuingEntityId;
      const isStartup = revokingEntityId && revokingEntityId === aff.startupEntityId;

      if (revokingEntityId && !isIssuing && !isStartup) {
        return NextResponse.json(
          { success: false, message: 'Access denied: You are not a party to this affiliation.' },
          { status: 403 }
        );
      }

      const revokingSide = isStartup ? 'Startup' : 'Issuing Organization';

      // 1. Mark affiliation revoked
      await affCol.updateOne(
        { id: affiliationId },
        {
          $set: {
            status: 'Revoked',
            revokedAt: now,
            revokedByUserId: revokingUserId || 'AUTHORIZED_PARTY',
            revokedByEntityId: revokingEntityId || null,
            revokedBySide: revokingSide,
            revocationReason: reason || 'Affiliation revoked by mutual consent or unilateral request',
            updatedAt: now,
          },
        }
      );

      // 2. Invalidate linked Startup Pro entitlement if sponsored by this affiliation
      await entitlementsCol.updateMany(
        { affiliationId, status: 'Active' },
        {
          $set: {
            status: 'Revoked',
            revokedAt: now,
            revocationReason: `Sponsored affiliation revoked by ${revokingSide}`,
            updatedAt: now,
          },
        }
      );

      // 3. Clean up from startup entity's active affiliatedOrgs list
      try {
        await entitiesCol.updateOne(
          { id: aff.startupEntityId },
          {
            $pull: { affiliatedOrgs: { affiliationId } } as any,
          }
        );
      } catch (err) {
        console.warn('[Affiliates] Failed to update startup entity affiliatedOrgs:', err);
      }

      // 4. Audit Log
      await auditCol.insertOne({
        action: 'AFFILIATION_REVOKED',
        affiliationId,
        startupEntityId: aff.startupEntityId,
        issuingEntityId: aff.issuingEntityId,
        revokedBy: revokingUserId || 'AUTHORIZED_PARTY',
        revokedByEntityId: revokingEntityId || null,
        revokedBySide: revokingSide,
        reason: reason || 'Revocation',
        timestamp: now,
      });

      // 5. Notify the other party
      try {
        const targetNotifyEntityId = isStartup ? aff.issuingEntityId : aff.startupEntityId;
        const targetEntity = await entitiesCol.findOne({ id: targetNotifyEntityId });
        const targetHeadId = targetEntity?.primaryOwnerId || targetEntity?.currentOwnerUserId || targetEntity?.createdByUserId;
        if (targetHeadId) {
          await notifsCol.insertOne({
            id: `notif_aff_rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            userId: targetHeadId,
            type: 'AFFILIATION_REVOKED',
            category: 'affiliation',
            title: `Affiliation with ${isStartup ? aff.startupName : aff.issuingOrgName} Revoked`,
            description: `The active affiliation has been terminated by the ${revokingSide}. Reason: ${reason || 'Revocation'}.`,
            time: 'Just now',
            unread: true,
            read: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      } catch (e) {
        console.warn('[Affiliates] Failed to dispatch revocation notification:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Affiliation revoked and linked entitlements invalidated.',
      });
    }

    // -------------------------------------------------------------
    // ACTION 5: UPDATE_VISIBILITY (Toggle mutual public visibility consent)
    // -------------------------------------------------------------
    if (action === 'UPDATE_VISIBILITY') {
      const { affiliationId, mutualVisibilityConsent, userId } = body;

      if (!affiliationId) {
        return NextResponse.json({ success: false, message: 'Affiliation ID required.' }, { status: 400 });
      }

      const aff = await affCol.findOne({ id: affiliationId });
      if (!aff) {
        return NextResponse.json({ success: false, message: 'Affiliation record not found.' }, { status: 404 });
      }

      await affCol.updateOne(
        { id: affiliationId },
        {
          $set: {
            mutualVisibilityConsent: Boolean(mutualVisibilityConsent),
            visibilityUpdatedAt: now,
            visibilityUpdatedBy: userId || 'USER',
            updatedAt: now,
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Public visibility consent updated to ${Boolean(mutualVisibilityConsent)}.`,
      });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error in affiliates API:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

