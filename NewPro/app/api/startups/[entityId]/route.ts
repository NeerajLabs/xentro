import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  extractAuthToken,
  verifyJwtToken,
  requireAuthenticatedUser,
  requireActiveEntityMembership,
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/startups/[entityId]
 * Fetches authoritative startup entity profile from MongoDB.
 * Enforces Public vs. Authorized Owner/Member data segregation.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const entityId = params?.entityId?.trim();
    if (!entityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const startupsCol = db.collection('startups');
    const membershipsCol = db.collection('memberships');

    // 1. Verify Entity in Central Registry (by ID, username, or accountTag)
    const entity = await entitiesCol.findOne({
      $or: [
        { id: entityId },
        { entityId: entityId },
        { username: entityId },
        { username: `@${entityId.replace(/^@/, '')}` },
        { accountTag: entityId },
        { accountTag: `@${entityId.replace(/^@/, '')}` },
      ],
      status: { $nin: ['ORPHANED_DELETED', 'DELETED'] },
      is_deleted: { $ne: true },
      deleted: { $ne: true },
    });

    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found or inactive' }, { status: 404 });
    }

    const authoritativeEntityId = entity.id || entityId;

    // 2. Fetch Detailed Profile from startups Collection
    let startupProfile: any = await startupsCol.findOne({ entityId });

    // Auto-heal/seed if entity exists but detailed profile document was not yet created
    if (!startupProfile) {
      const nowIso = new Date().toISOString();
      const defaultDoc = {
        entityId,
        name: entity.name,
        createdByUserId: entity.createdByUserId || entity.primaryOwnerId || '',
        currentOwnerUserId: entity.currentOwnerUserId || entity.primaryOwnerId || '',
        identity: {
          name: entity.name,
          logo: entity.logo || '/xentro-logo.png',
          banner: entity.banner || null,
          tagline: entity.details?.pitch || entity.tagline || 'Building next-generation solutions',
          stage: entity.details?.stage || entity.stage || 'MVP',
          industry: entity.details?.sector || entity.industry || 'Technology & Innovation',
          subSector: entity.details?.subSector || '',
          businessModelType: entity.details?.businessModelType || 'B2B',
          foundedYear: entity.details?.foundedYear || new Date().getFullYear(),
          location: entity.details?.location || entity.location || 'India',
          operatingGeography: ['India'],
          website: entity.details?.website || entity.website || '',
          linkedin: entity.details?.linkedin || entity.linkedin || '',
          isVerified: entity.verificationStatus === 'VERIFIED',
        },
        overview: {
          whatItDoes: entity.details?.pitch || `Official venture profile for ${entity.name}.`,
          whoItServes: entity.details?.whoItServes || 'Ecosystem enterprises and partners',
          currentStage: entity.details?.stage || 'Active Venture',
          coreValueProp: entity.details?.pitch || 'Scaling innovative solutions.',
        },
        unsdg: [],
        pitchVideo: null,
        pitchDeck: null,
        problem: {
          problemStatement: '',
          targetUsers: '',
          painPoints: [],
          whyItMatters: '',
          existingAlternatives: '',
        },
        solution: {
          overview: '',
          howItSolves: '',
          coreValueProp: '',
          keyDifferentiators: [],
        },
        product: {
          name: `${entity.name} Product`,
          category: entity.details?.sector || 'Software',
          description: '',
          status: 'MVP',
          keyFeatures: [],
          screenshots: [],
          demoLink: '',
        },
        companyInfo: {
          legalName: entity.name,
          incorporationStatus: 'Active',
          incorporationDate: '',
          registeredLocation: entity.details?.location || 'India',
          isDPIITRecognised: false,
          isMSMERegistered: false,
        },
        market: {
          targetCustomer: '',
          primarySegment: entity.details?.sector || '',
          businessModelCategory: 'B2B',
          targetGeography: ['India'],
          marketOpportunity: '',
        },
        businessModel: {
          businessModel: 'B2B',
          revenueModel: 'Direct / Subscription',
          pricingModel: '',
          revenueStreams: [],
          customerType: 'Enterprise',
          salesModel: 'Direct',
        },
        publicTeam: {
          founders: [
            {
              id: 'founder_1',
              name: entity.primaryOwnerName || 'Founder',
              role: 'Founder & CEO',
              roleCategory: 'founder',
              avatar: '/xentro-logo.png',
              bio: `Founder & Lead at ${entity.name}.`,
              isFullTime: true,
              isVerified: true,
            },
          ],
          leadership: [],
          core: [],
          advisors: [],
        },
        metrics: {
          profileCompletionPct: 75,
          profileViews: 0,
          profileViewsDelta: '+0% this week',
          connectionsCount: 0,
          askResponsesCount: 0,
          opportunitiesAppliedCount: 0,
          ddRequestsCount: 0,
        },
        visibility: entity.visibility || 'PUBLIC',
        createdAt: entity.createdAt || nowIso,
        updatedAt: nowIso,
      };

      await startupsCol.insertOne(defaultDoc);
      startupProfile = defaultDoc;
    }

    // 3. Resolve Current Viewer Authorization
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    let isAuthorizedMember = false;
    let memberRole = 'Viewer';
    let permissions: string[] = [];

    if (userId) {
      if (
        (entity.createdByUserId && entity.createdByUserId === userId) ||
        (entity.currentOwnerUserId && entity.currentOwnerUserId === userId) ||
        (entity.primaryOwnerId && entity.primaryOwnerId === userId)
      ) {
        isAuthorizedMember = true;
        memberRole = 'Owner / Founder';
        permissions = ['OWNER', 'ADMIN', 'MANAGE_TEAM', 'MANAGE_FINANCE', 'MANAGE_DOCS'];
      } else {
        const membership = await membershipsCol.findOne({
          entityId,
          userId,
          status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
        });
        if (membership) {
          isAuthorizedMember = true;
          memberRole = membership.role || 'Team Member';
          permissions = membership.permissions || ['VIEW_ONLY'];
        }
      }
    }

    // 4. Always sync authoritative entity verification status, legal name, and account tag
    const effectiveStartupTag =
      entity.accountTag ||
      entity.username ||
      startupProfile.accountTag ||
      startupProfile.username ||
      `@${(entity.name || 'startup').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

    startupProfile.identity = startupProfile.identity || {};
    startupProfile.identity.name = entity.name || startupProfile.identity.name;
    startupProfile.identity.username = effectiveStartupTag;
    startupProfile.identity.accountTag = effectiveStartupTag;
    startupProfile.identity.isVerified = entity.verificationStatus === 'VERIFIED';
    startupProfile.username = effectiveStartupTag;
    startupProfile.accountTag = effectiveStartupTag;
    startupProfile.visibility = entity.visibility || startupProfile.visibility || 'PUBLIC';

    // Delete MongoDB internal _id
    delete (startupProfile as any)._id;

    // 5. If Viewer is not authorized member, redact private internal fields
    if (!isAuthorizedMember) {
      // Check overall visibility: if Ghost Mode or Private and not connected, return restricted state
      if (startupProfile.visibility === 'Ghost Mode' || startupProfile.visibility === 'Private') {
        return NextResponse.json({
          success: true,
          data: {
            entityId,
            name: entity.name,
            visibility: startupProfile.visibility,
            isRestricted: true,
            identity: {
              name: entity.name,
              logo: startupProfile.identity.logo,
              tagline: 'Profile access is private.',
              stage: startupProfile.identity.stage,
              industry: startupProfile.identity.industry,
              isVerified: startupProfile.identity.isVerified,
            },
          },
        });
      }

      // Mask sensitive regulatory numbers
      if (startupProfile.companyInfo) {
        if (startupProfile.companyInfo.cin) {
          startupProfile.companyInfo.cinMasked = startupProfile.companyInfo.cin.slice(0, 4) + '••••••' + startupProfile.companyInfo.cin.slice(-3);
          delete startupProfile.companyInfo.cin;
        }
        if (startupProfile.companyInfo.gst) {
          startupProfile.companyInfo.gstMasked = startupProfile.companyInfo.gst.slice(0, 3) + '••••••' + startupProfile.companyInfo.gst.slice(-3);
          delete startupProfile.companyInfo.gst;
        }
        if (startupProfile.companyInfo.dpiitNumber) {
          startupProfile.companyInfo.dpiitNumberMasked = 'DPIIT••••••' + startupProfile.companyInfo.dpiitNumber.slice(-3);
          delete startupProfile.companyInfo.dpiitNumber;
        }
      }

      // Hide internal metrics & notes
      delete startupProfile.internalNotes;
    }

    return NextResponse.json({
      success: true,
      data: startupProfile,
      meta: {
        isOwner: isAuthorizedMember && memberRole === 'Owner / Founder',
        isAuthorizedMember,
        role: memberRole,
        permissions,
        entityStatus: entity.status,
      },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error fetching startup profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT/PATCH /api/startups/[entityId]
 * Updates startup entity details in MongoDB with targeted atomic updates.
 * Requires authorized membership / ownership.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const entityId = params?.entityId?.trim();
    if (!entityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const body = await req.json();

    // Authenticate caller strictly using verified JWT session
    const token = extractAuthToken(req);
    let userId = '';
    let userEmail = '';
    if (token) {
      const payload = verifyJwtToken(token);
      if (payload?.sub) {
        userId = payload.sub;
        userEmail = payload.email || '';
      }
    }
    if (!userId) {
      const authRes = await requireAuthenticatedUser(req);
      if ('error' in authRes) {
        return authRes.error;
      }
      userId = authRes.user.id;
      userEmail = authRes.user.email;
    }

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const startupsCol = db.collection('startups');
    const membershipsCol = db.collection('memberships');
    const usersCol = db.collection('users');
    const auditCol = db.collection('audit_logs');

    // 1. Authorize User
    let entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      const st = await startupsCol.findOne({ entityId });
      if (st) {
        const nowIso = new Date().toISOString();
        await entitiesCol.insertOne({
          id: entityId,
          name: st.name || st.identity?.name || 'Startup',
          type: 'startup',
          entityType: 'startup',
          createdByUserId: userId,
          primaryOwnerId: userId,
          status: 'ACTIVE',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        entity = await entitiesCol.findOne({ id: entityId });
      } else {
        return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
      }
    }

    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    const isDirectOwner =
      (entity.createdByUserId && (entity.createdByUserId === userId || entity.createdByUserId === userEmail)) ||
      (entity.currentOwnerUserId && (entity.currentOwnerUserId === userId || entity.currentOwnerUserId === userEmail)) ||
      (entity.primaryOwnerId && (entity.primaryOwnerId === userId || entity.primaryOwnerId === userEmail));

    let isAuthorized = Boolean(isDirectOwner);
    let memberRole = isDirectOwner ? 'Owner / Founder' : '';

    if (!isAuthorized) {
      const memQuery: any[] = [];
      if (userId) memQuery.push({ userId });
      if (userEmail) memQuery.push({ userEmail });

      const membership = await membershipsCol.findOne({
        entityId,
        $or: memQuery,
        status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
      });

      if (membership) {
        memberRole = membership.role || 'Team Member';
        const perms: string[] = membership.permissions || [];
        isAuthorized = perms.includes('OWNER') || perms.includes('ADMIN') || perms.includes('EDIT_PROFILE');
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: You do not have permission to edit this startup profile' },
        { status: 403 }
      );
    }

    // Publication Approval Rules: Publishing or setting visibility to Public requires Founder/Head or PUBLISH_PROFILE
    if (body.visibility === 'Public' || body.visibility === 'PUBLISHED') {
      const memRes = await requireActiveEntityMembership(userId, entityId);
      if (!('error' in memRes)) {
        const canPublish =
          memRes.isHead ||
          memRes.permissions.includes('PUBLISH_PROFILE') ||
          memRes.permissions.includes('OWNER') ||
          memRes.role.toLowerCase().includes('founder') ||
          memRes.role.toLowerCase().includes('admin');
        if (!canPublish) {
          return NextResponse.json(
            { success: false, message: 'Forbidden: Only Founder/Head or authorized Admin may publish startup profile.' },
            { status: 403 }
          );
        }
      }
    }

    const nowIso = new Date().toISOString();
    const updateFields: Record<string, any> = {
      updatedAt: nowIso,
    };

    // 2. Targeted Section Updates (Avoids blindly erasing unrelated fields)
    if (body.identity) {
      for (const [k, v] of Object.entries(body.identity)) {
        // Disallow direct editing of verification status through profile edit
        if (k !== 'isVerified') {
          updateFields[`identity.${k}`] = v;
        }
      }
      // If name updated, keep entity.name in sync
      if (body.identity.name && body.identity.name.trim()) {
        updateFields['name'] = body.identity.name.trim();
        await entitiesCol.updateOne(
          { id: entityId },
          { $set: { name: body.identity.name.trim(), updatedAt: nowIso } }
        );
      }
      // If banner or logo updated
      if (body.identity.banner !== undefined) {
        await entitiesCol.updateOne({ id: entityId }, { $set: { banner: body.identity.banner, updatedAt: nowIso } });
      }
      if (body.identity.logo !== undefined) {
        await entitiesCol.updateOne({ id: entityId }, { $set: { logo: body.identity.logo, updatedAt: nowIso } });
      }
      if (body.identity.tagline !== undefined) {
        await entitiesCol.updateOne({ id: entityId }, { $set: { pitch: body.identity.tagline, tagline: body.identity.tagline, updatedAt: nowIso } });
      }
      if (body.identity.stage !== undefined) {
        await entitiesCol.updateOne({ id: entityId }, { $set: { stage: body.identity.stage, updatedAt: nowIso } });
      }
      if (body.identity.industry !== undefined) {
        await entitiesCol.updateOne({ id: entityId }, { $set: { sector: body.identity.industry, industry: body.identity.industry, updatedAt: nowIso } });
      }
    }

    if (body.overview) updateFields.overview = body.overview;
    if (body.unsdg !== undefined) updateFields.unsdg = body.unsdg;
    if (body.pitchVideo !== undefined) updateFields.pitchVideo = body.pitchVideo;
    if (body.pitchDeck !== undefined) updateFields.pitchDeck = body.pitchDeck;
    if (body.problem) updateFields.problem = body.problem;
    if (body.solution) updateFields.solution = body.solution;
    if (body.product) updateFields.product = body.product;
    if (body.companyInfo) updateFields.companyInfo = body.companyInfo;
    if (body.market) updateFields.market = body.market;
    if (body.businessModel) updateFields.businessModel = body.businessModel;
    if (body.publicTeam) updateFields.publicTeam = body.publicTeam;
    if (body.visibility) {
      updateFields.visibility = body.visibility;
      await entitiesCol.updateOne(
        { id: entityId },
        { $set: { visibility: body.visibility, updatedAt: nowIso } }
      );
    }
    if (body.metrics) updateFields.metrics = body.metrics;

    // 3. Atomically update startups collection
    await startupsCol.updateOne(
      { entityId },
      { $set: updateFields },
      { upsert: true }
    );

    // 4. Record Audit Log
    try {
      await auditCol.insertOne({
        id: `audit_${Date.now()}`,
        entityId,
        actorId: userId,
        actorEmail: userEmail,
        action: 'UPDATE_STARTUP_PROFILE',
        details: {
          updatedSections: Object.keys(body).filter((k) => k !== 'userId' && k !== 'userEmail'),
        },
        timestamp: nowIso,
      });
    } catch (_) {}

    const updated = await startupsCol.findOne({ entityId });
    if (updated) delete (updated as any)._id;

    return NextResponse.json({
      success: true,
      message: 'Startup profile updated successfully',
      data: updated,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error updating startup profile' },
      { status: 500 }
    );
  }
}
