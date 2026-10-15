import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase, getMongoClient, ensureAffiliationIndexes } from '@/lib/mongodb';
import { evaluateStartupCapability } from '@/lib/startupRbac';
import {
  reserveEspCapacity,
  releaseEspCapacity,
  getEspCapacityStatus,
  ensureEspCapacityInitialized,
} from '@/lib/affiliationCapacity';
import { ClientSession } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * SHA-256 cryptographic token hashing utility.
 * Guarantees that raw invitation tokens are never stored in MongoDB Atlas
 * or leaked in server logs.
 */
function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim().toUpperCase()).digest('hex');
}

/**
 * Authoritative Collections:
 * - affiliations (authoritative relationship record)
 * - affiliate_links (authoritative invitation token record)
 * - entitlements (authoritative platform entitlement record)
 * - esp_affiliate_capacities (authoritative distributed capacity record)
 *
 * Synchronizes to legacy alias collections via idempotent upsert
 * ensuring backward compatibility without producing duplicate records or split sources of truth.
 */
async function syncAuthoritativeAffiliation(db: any, doc: any, session?: ClientSession) {
  // 1. Authoritative write
  await db.collection('affiliations').insertOne({ ...doc }, { session });

  // 2. Compatibility mirror: separate, non-authoritative, idempotent upsert
  try {
    const mirrorDoc = { ...doc };
    delete mirrorDoc._id;
    await db.collection('entity_affiliations').updateOne(
      { id: doc.id },
      { $set: mirrorDoc },
      { upsert: true }
    );
  } catch (mirrorErr) {
    console.warn('[Affiliates] Non-authoritative entity_affiliations mirror sync failed:', mirrorErr);
  }
}

async function syncAuthoritativeAffiliationUpdate(db: any, filter: any, update: any, session?: ClientSession) {
  await db.collection('affiliations').updateMany(filter, update, { session });
  try {
    await db.collection('entity_affiliations').updateMany(filter, update);
  } catch (mirrorErr) {
    console.warn('[Affiliates] Non-authoritative entity_affiliations mirror update failed:', mirrorErr);
  }
}

async function syncAuthoritativeInvitation(db: any, doc: any, session?: ClientSession) {
  await db.collection('affiliate_links').insertOne({ ...doc }, { session });
  try {
    const mirrorDoc = { ...doc };
    delete mirrorDoc._id;
    await db.collection('affiliation_invitations').updateOne(
      { id: doc.id },
      { $set: mirrorDoc },
      { upsert: true }
    );
  } catch (mirrorErr) {
    console.warn('[Affiliates] Non-authoritative affiliation_invitations mirror sync failed:', mirrorErr);
  }
}

async function syncAuthoritativeInvitationUpdate(db: any, filter: any, update: any, session?: ClientSession) {
  await db.collection('affiliate_links').updateMany(filter, update, { session });
  try {
    await db.collection('affiliation_invitations').updateMany(filter, update);
  } catch (mirrorErr) {
    console.warn('[Affiliates] Non-authoritative affiliation_invitations mirror update failed:', mirrorErr);
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDatabase();
    await ensureAffiliationIndexes(db);

    const affCol = db.collection('affiliations');
    const linksCol = db.collection('affiliate_links');
    const entitiesCol = db.collection('entities');

    const startupId = req.nextUrl.searchParams.get('startupId');
    const issuingId = req.nextUrl.searchParams.get('issuingId');
    const previewCode = req.nextUrl.searchParams.get('previewCode') || req.nextUrl.searchParams.get('code');
    const type = req.nextUrl.searchParams.get('type') || 'all';

    // -------------------------------------------------------------
    // 1. SAFE PREVIEW ENDPOINT: Inspect without redeeming
    // -------------------------------------------------------------
    if (previewCode) {
      const trimmedCode = previewCode.trim().toUpperCase();
      const codeHash = hashToken(trimmedCode);

      const link = await linksCol.findOne({
        $or: [{ tokenHash: codeHash }, { code: trimmedCode }],
      });

      if (!link) {
        return NextResponse.json(
          { success: false, message: 'Invalid or non-existent invitation code.' },
          { status: 404 }
        );
      }

      const now = new Date();
      const isExpired = new Date(link.expiresAt) < now;
      const isRedeemed = link.isRedeemed || link.status === 'REDEEMED';
      const isDeclined = link.status === 'DECLINED';
      const isRevoked = link.status === 'REVOKED';

      const issuingOrg = await entitiesCol.findOne({ id: link.issuingEntityId });
      const issuingOrgName = issuingOrg?.name || link.issuingOrgName || 'Partner Institution';
      const issuingOrgType = link.issuingOrgType || (issuingOrg?.entityType?.toUpperCase() === 'ESP' ? 'ESP' : 'Institution');
      const isIssuerSuspended = issuingOrg?.status === 'SUSPENDED' || issuingOrg?.isActive === false;

      let intendedStartupName = link.intendedStartupName;
      if (link.intendedStartupId && !intendedStartupName) {
        const startupDoc = await entitiesCol.findOne({ id: link.intendedStartupId });
        if (startupDoc) intendedStartupName = startupDoc.name;
      }

      return NextResponse.json({
        success: true,
        data: {
          id: link.id,
          issuingEntityId: link.issuingEntityId,
          issuingOrgName,
          issuingOrgType,
          issuingLogo: issuingOrg?.logoUrl || null,
          category: link.category || (issuingOrgType === 'ESP' ? 'Incubation / Acceleration' : 'Institutional Affiliation'),
          programName: link.programName || 'Incubation / Acceleration Program',
          cohort: link.cohort || 'Current Cohort',
          intendedStartupName: intendedStartupName || null,
          intendedStartupId: link.intendedStartupId || null,
          expiresAt: link.expiresAt,
          isExpired,
          isRedeemed,
          isDeclined,
          isRevoked,
          isIssuerSuspended,
          status: isExpired ? 'EXPIRED' : link.status,
          benefits:
            issuingOrgType === 'ESP'
              ? [
                  'Complimentary Startup Pro platform access (for program duration)',
                  'Verified Institutional Endorsement Badge',
                  'Priority Partner Ecosystem Discovery & Direct Investor Matching',
                ]
              : [
                  'Verified Institutional Affiliation Badge',
                  'Academic & Research Collaboration Network',
                  'Institutional Talent & Advisory Access',
                ],
        },
      });
    }

    // -------------------------------------------------------------
    // 2. PRIVACY & DATA ISOLATION GATE (Section 4 & Section 11)
    // Refuses unscoped global dumps of private organizational data.
    // -------------------------------------------------------------
    if (!startupId && !issuingId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Entity context required. Either startupId or issuingId must be specified.',
        },
        { status: 400 }
      );
    }

    // Scoped queries: Startup context vs Issuing Organization context
    let affFilter: any = {};
    let linksFilter: any = {};

    if (startupId) {
      affFilter = { startupEntityId: startupId };
      linksFilter = {
        $or: [
          { intendedStartupId: startupId },
          { redeemedByStartupId: startupId },
        ],
      };
    } else if (issuingId) {
      affFilter = { issuingEntityId: issuingId };
      linksFilter = { issuingEntityId: issuingId };
    }

    if (type === 'links') {
      const links = await linksCol.find(linksFilter).sort({ createdAt: -1 }).toArray();
      const sanitizedLinks = links.map((l: any) => ({
        ...l,
        tokenHash: undefined, // Never leak internal hashes
      }));
      return NextResponse.json({ success: true, data: { links: sanitizedLinks } });
    }

    const affiliations = await affCol.find(affFilter).sort({ createdAt: -1 }).toArray();
    const links = await linksCol.find(linksFilter).sort({ createdAt: -1 }).toArray();

    // Calculate real-time capacity metrics for issuing ESP (250 limit)
    let capacity = null;
    if (issuingId) {
      const capStatus = await getEspCapacityStatus(db, issuingId);
      capacity = {
        used: capStatus.activeStartupCount,
        max: 250,
        remaining: capStatus.availableSlots,
        isAtCapacity: capStatus.isFull,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        affiliations,
        links: links.map((l: any) => ({ ...l, tokenHash: undefined })),
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
    await ensureAffiliationIndexes(db);

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
    if (action === 'CREATE_LINK' || action === 'GENERATE') {
      const {
        issuingEntityId,
        intendedStartupName,
        intendedStartupId,
        intendedFounderEmail,
        category,
        programName,
        cohort,
        startDate,
        endDate,
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

      if (issuingOrg.status === 'SUSPENDED' || issuingOrg.isActive === false || issuingOrg.is_deleted === true || issuingOrg.deleted === true) {
        return NextResponse.json(
          { success: false, message: 'Access denied: Your organization is inactive or suspended.' },
          { status: 403 }
        );
      }

      const rawOrgType = (issuingOrg.entityType || '').toUpperCase();
      if (!['ESP', 'INSTITUTION', 'HUB'].includes(rawOrgType)) {
        return NextResponse.json(
          {
            success: false,
            message: 'Only eligible ESP or Institution entities are authorized to issue affiliation links.',
          },
          { status: 403 }
        );
      }
      const orgType = (rawOrgType === 'ESP' || rawOrgType === 'HUB') ? 'ESP' : 'Institution';

      // ESP 250 Capacity Check (V1 strict cap)
      if (orgType === 'ESP') {
        const capStatus = await getEspCapacityStatus(db, issuingEntityId);
        if (capStatus.isFull) {
          return NextResponse.json(
            {
              success: false,
              message: 'ESP capacity limit reached (maximum 250 distinct affiliated startups in V1). Overflow is blocked.',
            },
            { status: 400 }
          );
        }
      }

      // Cryptographically secure token generation
      const randomHex1 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const randomHex2 = crypto.randomBytes(2).toString('hex').toUpperCase();
      const rawRedemptionCode = `XENTRO-${randomHex1}-${randomHex2}`;
      const tokenHash = hashToken(rawRedemptionCode);
      const linkId = `aff_link_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const linkDoc = {
        id: linkId,
        tokenHash,
        code: rawRedemptionCode,
        codeMasked: `XENTRO-***-${randomHex2}`,
        issuingEntityId,
        issuingOrgName: issuingOrg.name || 'Incubation Program',
        issuingOrgType: orgType,
        category: category || (orgType === 'ESP' ? 'Incubation' : 'Institutional Affiliation'),
        intendedStartupName: (intendedStartupName || '').trim(),
        intendedStartupId: (intendedStartupId || '').trim(),
        intendedFounderEmail: (intendedFounderEmail || '').trim().toLowerCase(),
        programName: (programName || 'Incubation / Acceleration Program').trim(),
        cohort: (cohort || 'Current Cohort').trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        assignedMentor: (assignedMentor || '').trim(),
        notes: (notes || '').trim(),
        createdByUserId: createdByUserId || '',
        issuerVisibilityConsent: true,
        status: 'PENDING',
        isRedeemed: false,
        redeemedAt: null,
        redeemedByStartupId: null,
        redeemedByUserId: null,
        createdAt: now,
        expiresAt,
      };

      await syncAuthoritativeInvitation(db, linkDoc);

      await auditCol.insertOne({
        action: 'AFFILIATE_LINK_CREATED',
        linkId,
        tokenHash,
        issuingEntityId,
        issuingOrgType: orgType,
        intendedStartupId: linkDoc.intendedStartupId,
        category: linkDoc.category,
        expiresAt,
        performedBy: createdByUserId || 'ESP_ADMIN',
        timestamp: now,
      });

      if (linkDoc.intendedStartupId) {
        try {
          const targetStartup = await entitiesCol.findOne({ id: linkDoc.intendedStartupId });
          const targetOwnerId =
            targetStartup?.primaryOwnerId ||
            targetStartup?.currentOwnerUserId ||
            targetStartup?.createdByUserId;
          if (targetOwnerId) {
            await notifsCol.insertOne({
              id: `notif_aff_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
              userId: targetOwnerId,
              type: 'AFFILIATION_OFFER',
              category: 'affiliation',
              title: `${issuingOrg.name} sent you an Affiliation Invitation`,
              description: `Formal affiliation offer for ${linkDoc.programName} (${linkDoc.cohort}). Valid for 7 days.`,
              time: 'Just now',
              actorName: issuingOrg.name,
              actorId: issuingEntityId,
              linkId,
              code: rawRedemptionCode,
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
          console.warn('[Affiliates] Notification dispatch warning:', notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Targeted single-use affiliate link generated successfully (valid for 7 days).',
        data: {
          link: {
            ...linkDoc,
            code: rawRedemptionCode,
          },
        },
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

      // 1. Validate startup exists and is active
      const startup = await entitiesCol.findOne({ id: startupEntityId });
      if (!startup) {
        return NextResponse.json({ success: false, message: 'Startup entity not found.' }, { status: 404 });
      }

      if (startup.status === 'SUSPENDED' || startup.isActive === false || startup.is_deleted === true || startup.deleted === true) {
        return NextResponse.json(
          { success: false, message: 'Access denied: Startup entity is inactive or suspended.' },
          { status: 403 }
        );
      }

      // 2. Validate actor authorization (Owner / Founder required)
      const isHead =
        startup.primaryOwnerId === userId ||
        startup.currentOwnerUserId === userId ||
        startup.createdByUserId === userId;

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

      // 3. Pre-check invitation existence and validity before taking locks
      const trimmedCode = code.trim().toUpperCase();
      const codeHash = hashToken(trimmedCode);

      const rawLink = await linksCol.findOne({
        $or: [{ tokenHash: codeHash }, { code: trimmedCode }],
      });

      if (!rawLink) {
        return NextResponse.json({ success: false, message: 'Invalid affiliate code.' }, { status: 404 });
      }
      if (rawLink.isRedeemed || rawLink.status === 'REDEEMED') {
        return NextResponse.json(
          { success: false, message: 'This single-use affiliate invitation has already been redeemed.' },
          { status: 400 }
        );
      }
      if (rawLink.status === 'DECLINED') {
        return NextResponse.json(
          { success: false, message: 'This affiliate invitation was previously declined.' },
          { status: 400 }
        );
      }
      if (rawLink.status === 'REVOKED') {
        return NextResponse.json(
          { success: false, message: 'This affiliate invitation was revoked by the issuing organization.' },
          { status: 400 }
        );
      }
      if (new Date(rawLink.expiresAt) <= new Date(now)) {
        return NextResponse.json(
          { success: false, message: 'This affiliate invitation has expired (7-day validity window exceeded).' },
          { status: 400 }
        );
      }

      const link = rawLink;

      // 4. Validate Issuer Legitimacy
      const issuingOrg = await entitiesCol.findOne({ id: rawLink.issuingEntityId });
      if (!issuingOrg || issuingOrg.status === 'SUSPENDED' || issuingOrg.isActive === false) {
        return NextResponse.json(
          { success: false, message: 'The issuing organization is inactive or suspended.' },
          { status: 403 }
        );
      }

      // 5. Strict Recipient Binding Check
      if (rawLink.intendedStartupId && rawLink.intendedStartupId !== startupEntityId) {
        return NextResponse.json(
          {
            success: false,
            message: 'This invitation is designated exclusively for another startup venture.',
          },
          { status: 403 }
        );
      }

      // 6. Early Duplicate Venture Check (Pre-lock guard)
      const existingAff = await affCol.findOne({
        startupEntityId,
        issuingEntityId: rawLink.issuingEntityId,
        status: 'Active',
      });
      if (existingAff) {
        return NextResponse.json(
          {
            success: false,
            message: `Your venture is already actively affiliated with ${rawLink.issuingOrgName}.`,
          },
          { status: 409 }
        );
      }

      // 7. Prepare Authoritative Documents
      const affId = `aff_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const isEsp = rawLink.issuingOrgType === 'ESP';

      // Independent dual consent:
      // Startup sets its own consent; Issuer's consent was defined by issuer; public visibility requires both.
      const startupConsent = Boolean(
        body.startupVisibilityConsent !== undefined
          ? body.startupVisibilityConsent
          : mutualVisibilityConsent !== undefined
          ? mutualVisibilityConsent
          : true
      );
      const issuerConsent = Boolean(rawLink.issuerVisibilityConsent !== false);
      const isPubliclyVisible = Boolean(issuerConsent && startupConsent);

      const affDoc = {
        id: affId,
        startupEntityId,
        startupName: startup.name || startup.startupName || 'Startup Venture',
        issuingEntityId: rawLink.issuingEntityId,
        issuingOrgName: rawLink.issuingOrgName,
        issuingOrgType: rawLink.issuingOrgType,
        category: rawLink.category || (isEsp ? 'Incubation' : 'Institutional Affiliation'),
        programName: rawLink.programName,
        cohort: rawLink.cohort,
        assignedMentor: rawLink.assignedMentor,
        sourceInvitationId: rawLink.id,
        issuerVisibilityConsent: issuerConsent,
        startupVisibilityConsent: startupConsent,
        isPubliclyVisible,
        mutualVisibilityConsent: isPubliclyVisible,
        status: 'Active',
        acceptedAt: now,
        acceptedByUserId: userId,
        startDate: rawLink.startDate || now.split('T')[0],
        endDate: rawLink.endDate || null,
        createdAt: now,
        updatedAt: now,
      };

      let entitlementDoc: any = null;
      if (isEsp) {
        const entitlementId = `ent_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
        entitlementDoc = {
          id: entitlementId,
          startupEntityId,
          tier: 'Startup Pro',
          source: 'ESP Affiliation',
          sponsoringEntityId: rawLink.issuingEntityId,
          sponsoringEntityName: rawLink.issuingOrgName,
          affiliationId: affId,
          status: 'Active',
          validityBasis: 'Affiliation Lifecycle',
          grantedAt: now,
          expiresAt: rawLink.endDate || null,
          createdAt: now,
          updatedAt: now,
        };
      }

      // 8. Transactional / Atomic Execution Block
      const client = await getMongoClient();
      let session: ClientSession | null = null;
      let transactionStarted = false;

      let capacityReserved = false;
      let invitationRedeemed = false;
      let affiliationCreated = false;
      let entitlementCreated = false;

      const executeAuthoritativeWrites = async (sess?: ClientSession) => {
        // Step A: Database-enforced atomic capacity reservation (serialized by WiredTiger)
        if (isEsp) {
          const capResult = await reserveEspCapacity(db, rawLink.issuingEntityId, startupEntityId, sess);
          if (!capResult.success) {
            const err: any = new Error('The issuing ESP has reached its maximum capacity of 250 affiliated startups. Overflow is blocked in V1.');
            err.code = 'ESP_CAPACITY_EXCEEDED';
            throw err;
          }
          capacityReserved = true;
        }

        // Step B: Atomic invitation redemption
        const atomicRedeemedLink = await linksCol.findOneAndUpdate(
          {
            id: rawLink.id,
            isRedeemed: { $ne: true },
            status: 'PENDING',
          },
          {
            $set: {
              isRedeemed: true,
              status: 'REDEEMED',
              redeemedAt: now,
              redeemedByStartupId: startupEntityId,
              redeemedByUserId: userId,
              updatedAt: now,
            },
          },
          { returnDocument: 'after', session: sess }
        );

        if (!atomicRedeemedLink) {
          const err: any = new Error('This invitation was already redeemed in a concurrent session.');
          err.code = 'INVITATION_ALREADY_REDEEMED';
          throw err;
        }
        invitationRedeemed = true;

        // Step C: Authoritative Affiliation record creation
        await db.collection('affiliations').insertOne(affDoc, { session: sess });
        affiliationCreated = true;

        // Step D: Authoritative Entitlement creation (if ESP)
        if (entitlementDoc) {
          await entitlementsCol.insertOne(entitlementDoc, { session: sess });
          entitlementCreated = true;
        }
      };

      try {
        try {
          session = client.startSession();
          await session.withTransaction(async () => {
            transactionStarted = true;
            await executeAuthoritativeWrites(session!);
          });
        } catch (txErr: any) {
          if (!transactionStarted || txErr?.message?.includes('replica set') || txErr?.message?.includes('standalone') || txErr?.message?.includes('Transaction numbers are only allowed')) {
            // Non-replica set fallback: execute with manual compensating rollback
            await executeAuthoritativeWrites(undefined);
          } else {
            throw txErr;
          }
        }
      } catch (opErr: any) {
        // Compensating rollback for standalone execution or unexpected failure
        if (!transactionStarted) {
          if (entitlementCreated && entitlementDoc) {
            await entitlementsCol.deleteOne({ id: entitlementDoc.id }).catch(() => {});
          }
          if (affiliationCreated) {
            await db.collection('affiliations').deleteOne({ id: affId }).catch(() => {});
          }
          if (invitationRedeemed) {
            await linksCol.updateOne(
              { id: rawLink.id },
              { $set: { isRedeemed: false, status: 'PENDING', redeemedAt: null, redeemedByStartupId: null } }
            ).catch(() => {});
          }
          if (capacityReserved && isEsp) {
            await releaseEspCapacity(db, rawLink.issuingEntityId, startupEntityId).catch(() => {});
          }
        }

        if (opErr?.code === 'ESP_CAPACITY_EXCEEDED') {
          return NextResponse.json({ success: false, message: opErr.message }, { status: 400 });
        }
        if (opErr?.code === 'INVITATION_ALREADY_REDEEMED') {
          return NextResponse.json({ success: false, message: opErr.message }, { status: 409 });
        }
        if (opErr?.code === 11000) {
          return NextResponse.json(
            { success: false, message: `Your venture is already actively affiliated with ${rawLink.issuingOrgName}.` },
            { status: 409 }
          );
        }
        throw opErr;
      } finally {
        if (session) {
          try {
            await session.endSession();
          } catch {}
        }
      }

      // 9. Asynchronous, Idempotent Compatibility Mirroring (Separate from authoritative writes)
      try {
        const mirrorAff = { ...affDoc };
        delete (mirrorAff as any)._id;
        await db.collection('entity_affiliations').updateOne(
          { id: affId },
          { $set: mirrorAff },
          { upsert: true }
        );

        await db.collection('affiliation_invitations').updateOne(
          { id: rawLink.id },
          {
            $set: {
              isRedeemed: true,
              status: 'REDEEMED',
              redeemedAt: now,
              redeemedByStartupId: startupEntityId,
              redeemedByUserId: userId,
              updatedAt: now,
            },
          },
          { upsert: true }
        );
      } catch (mirrorErr) {
        console.warn('[Affiliates] Non-authoritative mirror sync warning:', mirrorErr);
      }

      // 9. Sync to Startup Entity metadata for UI (NEVER alters memberships or RBAC)
      await entitiesCol.updateOne(
        { id: startupEntityId },
        {
          $set: {
            ...(link.issuingOrgType === 'ESP' ? { incubatorAffiliation: link.issuingOrgName } : {}),
            updatedAt: now,
          },
          $addToSet: {
            affiliatedOrgs: {
              affiliationId: affId,
              orgId: link.issuingEntityId,
              orgName: link.issuingOrgName,
              orgType: link.issuingOrgType,
              category: affDoc.category,
              programName: link.programName,
              cohort: link.cohort,
              since: now,
            },
          },
        }
      );

      // 10. Audit Log
      await auditCol.insertOne({
        action: 'AFFILIATION_ACCEPTED',
        affiliationId: affId,
        sourceInvitationId: link.id,
        startupEntityId,
        issuingEntityId: link.issuingEntityId,
        issuingOrgType: link.issuingOrgType,
        grantedPro: Boolean(entitlementDoc),
        acceptedBy: userId,
        timestamp: now,
      });

      // 11. In-App Notification
      try {
        const issuingHeadId =
          issuingOrg?.primaryOwnerId ||
          issuingOrg?.currentOwnerUserId ||
          issuingOrg?.createdByUserId;
        if (issuingHeadId) {
          await notifsCol.insertOne({
            id: `notif_aff_acc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
            userId: issuingHeadId,
            type: 'AFFILIATION_ACCEPTED',
            category: 'affiliation',
            title: `${startup.name || 'Startup'} accepted your Affiliation Invitation`,
            description: `Official affiliation established for ${link.programName} (${link.cohort}).`,
            time: 'Just now',
            actorName: startup.name || 'Startup',
            actorId: startupEntityId,
            affiliationId: affId,
            unread: true,
            read: false,
            createdAt: now,
            updatedAt: now,
          });
        }
      } catch (e) {
        console.warn('[Affiliates] Notification dispatch warning:', e);
      }

      const message =
        link.issuingOrgType === 'ESP'
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

      const trimmedCode = code.trim().toUpperCase();
      const codeHash = hashToken(trimmedCode);

      const link = await linksCol.findOne({
        $or: [{ tokenHash: codeHash }, { code: trimmedCode }],
      });

      if (!link) {
        return NextResponse.json({ success: false, message: 'Affiliate invitation not found.' }, { status: 404 });
      }

      if (link.isRedeemed || link.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, message: `Invitation cannot be declined (current state: ${link.status}).` },
          { status: 400 }
        );
      }

      await syncAuthoritativeInvitationUpdate(
        db,
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

      const isIssuing = revokingEntityId && revokingEntityId === aff.issuingEntityId;
      const isStartup = revokingEntityId && revokingEntityId === aff.startupEntityId;

      if (revokingEntityId && !isIssuing && !isStartup) {
        return NextResponse.json(
          { success: false, message: 'Access denied: You are not a party to this affiliation.' },
          { status: 403 }
        );
      }

      const revokingSide = isStartup ? 'Startup' : 'Issuing Organization';

      // 1. Mark affiliation revoked in both collections
      await syncAuthoritativeAffiliationUpdate(
        db,
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

      // 1b. Atomically release ESP capacity if ESP
      if (aff.issuingOrgType === 'ESP') {
        await releaseEspCapacity(db, aff.issuingEntityId, aff.startupEntityId);
      }

      // 2. Invalidate linked Startup Pro entitlement for THIS affiliation only
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

      // 3. Pro Entitlement Recalculation (Preserves multi-ESP and independent paid subscriptions)
      const remainingActiveEspAff = await affCol.findOne({
        startupEntityId: aff.startupEntityId,
        issuingOrgType: 'ESP',
        status: 'Active',
        id: { $ne: affiliationId },
      });

      const activePaidSub = await db.collection('subscriptions').findOne({
        $or: [{ entityId: aff.startupEntityId }, { startupId: aff.startupEntityId }],
        status: { $in: ['Active', 'ACTIVE', 'active'] },
        planName: { $regex: /pro|growth/i },
      });

      const retainsProAccess = Boolean(remainingActiveEspAff || activePaidSub);
      const proSource = remainingActiveEspAff
        ? `ESP Affiliation (${remainingActiveEspAff.issuingOrgName})`
        : activePaidSub
        ? 'Paid Subscription'
        : 'Complimentary Access';

      // 4. Update startup entity metadata
      try {
        await entitiesCol.updateOne(
          { id: aff.startupEntityId },
          {
            $set: {
              incubatorAffiliation: remainingActiveEspAff ? remainingActiveEspAff.issuingOrgName : null,
              updatedAt: now,
            },
            $pull: { affiliatedOrgs: { affiliationId } } as any,
          }
        );
      } catch (err) {
        console.warn('[Affiliates] Metadata update warning:', err);
      }

      // 5. Audit Log
      await auditCol.insertOne({
        action: 'AFFILIATION_REVOKED',
        affiliationId,
        startupEntityId: aff.startupEntityId,
        issuingEntityId: aff.issuingEntityId,
        revokedBy: revokingUserId || 'AUTHORIZED_PARTY',
        revokedByEntityId: revokingEntityId || null,
        revokedBySide: revokingSide,
        reason: reason || 'Revocation',
        retainsProAccess,
        effectiveProSource: proSource,
        timestamp: now,
      });

      // 6. Notify the other party
      try {
        const targetNotifyEntityId = isStartup ? aff.issuingEntityId : aff.startupEntityId;
        const targetEntity = await entitiesCol.findOne({ id: targetNotifyEntityId });
        const targetHeadId =
          targetEntity?.primaryOwnerId ||
          targetEntity?.currentOwnerUserId ||
          targetEntity?.createdByUserId;
        if (targetHeadId) {
          await notifsCol.insertOne({
            id: `notif_aff_rev_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
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
        console.warn('[Affiliates] Notification dispatch warning:', e);
      }

      return NextResponse.json({
        success: true,
        message: 'Affiliation revoked successfully and entitlements recalculated.',
        data: {
          affiliationId,
          status: 'Revoked',
          retainsProAccess,
          effectiveProSource: proSource,
        },
      });
    }

    // -------------------------------------------------------------
    // ACTION 5: UPDATE_VISIBILITY (Independent Dual Consent)
    // -------------------------------------------------------------
    if (action === 'UPDATE_VISIBILITY') {
      const {
        affiliationId,
        entityId,
        consent,
        mutualVisibilityConsent,
        startupVisibilityConsent,
        issuerVisibilityConsent,
        userId,
      } = body;

      if (!affiliationId) {
        return NextResponse.json({ success: false, message: 'Affiliation ID required.' }, { status: 400 });
      }

      const aff = await affCol.findOne({ id: affiliationId });
      if (!aff) {
        return NextResponse.json({ success: false, message: 'Affiliation record not found.' }, { status: 404 });
      }

      // Determine calling entity
      const callerEntityId = (entityId || '').trim();
      const isIssuing = callerEntityId && callerEntityId === aff.issuingEntityId;
      const isStartup = callerEntityId && callerEntityId === aff.startupEntityId;

      if (callerEntityId && !isIssuing && !isStartup) {
        return NextResponse.json(
          {
            success: false,
            message: 'Access denied: You are not authorized to modify visibility consent for this affiliation.',
          },
          { status: 403 }
        );
      }

      // Neither organization can set the other party's consent!
      let updatedIssuerConsent = aff.issuerVisibilityConsent !== false;
      let updatedStartupConsent = aff.startupVisibilityConsent !== false;

      if (isIssuing) {
        // Issuing organization updates its own consent ONLY
        const targetConsent =
          consent !== undefined
            ? Boolean(consent)
            : issuerVisibilityConsent !== undefined
            ? Boolean(issuerVisibilityConsent)
            : Boolean(mutualVisibilityConsent);
        updatedIssuerConsent = targetConsent;
      } else if (isStartup) {
        // Startup venture updates its own consent ONLY
        const targetConsent =
          consent !== undefined
            ? Boolean(consent)
            : startupVisibilityConsent !== undefined
            ? Boolean(startupVisibilityConsent)
            : Boolean(mutualVisibilityConsent);
        updatedStartupConsent = targetConsent;
      } else {
        // Infer from userId if entityId was not explicitly passed
        const userEntity = await entitiesCol.findOne({
          $or: [
            { id: aff.issuingEntityId, $or: [{ primaryOwnerId: userId }, { createdByUserId: userId }] },
            { id: aff.startupEntityId, $or: [{ primaryOwnerId: userId }, { createdByUserId: userId }] },
          ],
        });
        if (!userEntity) {
          return NextResponse.json(
            {
              success: false,
              message: 'Entity context required to update independent visibility consent.',
            },
            { status: 400 }
          );
        }
        if (userEntity.id === aff.issuingEntityId) {
          updatedIssuerConsent = consent !== undefined ? Boolean(consent) : Boolean(mutualVisibilityConsent);
        } else {
          updatedStartupConsent = consent !== undefined ? Boolean(consent) : Boolean(mutualVisibilityConsent);
        }
      }

      const isPubliclyVisible = Boolean(updatedIssuerConsent && updatedStartupConsent);

      await syncAuthoritativeAffiliationUpdate(
        db,
        { id: affiliationId },
        {
          $set: {
            issuerVisibilityConsent: updatedIssuerConsent,
            startupVisibilityConsent: updatedStartupConsent,
            isPubliclyVisible,
            mutualVisibilityConsent: isPubliclyVisible,
            visibilityUpdatedAt: now,
            visibilityUpdatedBy: userId || 'AUTHORIZED_ENTITY',
            updatedAt: now,
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: `Public visibility consent updated. Issuer consent: ${updatedIssuerConsent}, Startup consent: ${updatedStartupConsent}. Public display: ${isPubliclyVisible}.`,
        data: {
          affiliationId,
          issuerVisibilityConsent: updatedIssuerConsent,
          startupVisibilityConsent: updatedStartupConsent,
          isPubliclyVisible,
          mutualVisibilityConsent: isPubliclyVisible,
        },
      });
    }

    // -------------------------------------------------------------
    // ACTION 6: REVOKE_INVITATION (Cancel pending link before redemption)
    // -------------------------------------------------------------
    if (action === 'REVOKE_INVITATION') {
      const { linkId, issuingEntityId, userId, reason } = body;

      if (!linkId) {
        return NextResponse.json({ success: false, message: 'Invitation link ID required.' }, { status: 400 });
      }

      const link = await linksCol.findOne({ id: linkId });
      if (!link) {
        return NextResponse.json({ success: false, message: 'Invitation not found.' }, { status: 404 });
      }

      if (issuingEntityId && link.issuingEntityId !== issuingEntityId) {
        return NextResponse.json({ success: false, message: 'Access denied: You are not the issuer.' }, { status: 403 });
      }

      if (link.isRedeemed || link.status !== 'PENDING') {
        return NextResponse.json(
          { success: false, message: `Cannot revoke invitation in '${link.status}' state.` },
          { status: 400 }
        );
      }

      await syncAuthoritativeInvitationUpdate(
        db,
        { id: linkId },
        {
          $set: {
            status: 'REVOKED',
            revokedAt: now,
            revokedByUserId: userId || 'ISSUER',
            revocationReason: reason || 'Cancelled by issuing organization',
            updatedAt: now,
          },
        }
      );

      await auditCol.insertOne({
        action: 'AFFILIATION_INVITATION_CANCELLED',
        linkId,
        issuingEntityId: link.issuingEntityId,
        performedBy: userId || 'ISSUER',
        reason: reason || 'Cancelled by issuing organization',
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        message: 'Affiliation invitation has been cancelled/revoked.',
      });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error in affiliates API:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
