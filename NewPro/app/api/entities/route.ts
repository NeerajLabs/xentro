import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDatabase } from '@/lib/mongodb';
import {
  extractAuthToken,
  verifyJwtToken,
  requireAuthenticatedUser,
  logSecurityAuditEvent,
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Generates collision-resistant entity identifiers:
 * e.g., ST-4A8F29BC, VCI-81D299E1, ES-9B4109C2, INS-5E3A1290
 */
function generateCollisionResistantEntityId(prefix: string): string {
  const hex = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${hex}`;
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Enforce cryptographically verified server-side identity (SEC-01 / High Risk)
    const authRes = await requireAuthenticatedUser(req);
    if ('error' in authRes) {
      return authRes.error;
    }
    const user = authRes.user;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 422 });
    }

    const db = await getDatabase();
    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');
    const membershipsCol = db.collection('memberships');
    const otpCol = db.collection('otp_codes');

    // Step 2: Enforce V1 Single-Created-Entity Limit per person (Concurrency-Safe)
    // Check if user already created an active entity
    const existingCreatedEntity = await entitiesCol.findOne({
      createdByUserId: user.id,
      status: { $nin: ['DELETED', 'ORPHANED_DELETED', 'ARCHIVED'] },
      is_deleted: { $ne: true },
    });

    if (existingCreatedEntity) {
      // Reconcile user record if activeCreatedEntityId was unset during past partial failure
      await usersCol.updateOne(
        { $or: [{ id: user.id }, { _id: user.id }], activeCreatedEntityId: { $ne: existingCreatedEntity.id } } as any,
        { $set: { activeCreatedEntityId: existingCreatedEntity.id }, $unset: { entityCreationPendingAt: '' } }
      );
      return NextResponse.json(
        {
          success: false,
          message: `Xentro V1 limits each personal account to creating at most one organization entity. You have already created entity "${existingCreatedEntity.name}" (${existingCreatedEntity.id}).`,
          existingEntityId: existingCreatedEntity.id,
        },
        { status: 403 }
      );
    }

    // Atomic reservation on user document to prevent concurrent duplicate entity creation
    // Includes a 5-minute stale timeout to safely recover from crashed/interrupted requests
    const now = new Date();
    const staleThreshold = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

    const reservation = await usersCol.findOneAndUpdate(
      {
        $or: [{ id: user.id }, { _id: user.id }],
        $and: [
          {
            $or: [
              { activeCreatedEntityId: { $exists: false } },
              { activeCreatedEntityId: null },
              { activeCreatedEntityId: '' },
            ],
          },
          {
            $or: [
              { entityCreationPendingAt: { $exists: false } },
              { entityCreationPendingAt: null },
              { entityCreationPendingAt: '' },
              { entityCreationPendingAt: { $lt: staleThreshold } },
            ],
          },
        ],
      } as any,
      {
        $set: {
          entityCreationPendingAt: now.toISOString(),
        },
      },
      { returnDocument: 'after' }
    );

    if (!reservation) {
      return NextResponse.json(
        {
          success: false,
          message: 'Concurrent entity creation request detected or entity already created for this account.',
        },
        { status: 409 }
      );
    }


    const entityTypeRaw = String(body.entityType || body.type || 'STARTUP').toUpperCase();
    const entityName = String(body.name || body.entityName || '').trim();
    const officialEmail = String(body.officialEmail || body.email || '').trim().toLowerCase();

    if (!entityName) {
      // Clear reservation on validation failure
      await usersCol.updateOne(
        { $or: [{ id: user.id }, { _id: user.id }] } as any,
        { $unset: { entityCreationPendingAt: '' } }
      );
      return NextResponse.json({ success: false, message: 'Entity name is required' }, { status: 422 });
    }

    const challengeId = String(body.challengeId || '').trim();

    // Verify OTP challenge for Startup & Investor Org entities
    if (entityTypeRaw.includes('STARTUP') || entityTypeRaw.includes('VENTURE')) {
      const targetEmail = (officialEmail || user.email).toLowerCase();
      const skipOtp =
        body.skipOtpIfAuthenticated === true ||
        (!challengeId && (user.email?.toLowerCase() === targetEmail || !officialEmail));

      if (challengeId) {
        const otpQuery: any = {
          email: targetEmail,
          purpose: 'STARTUP_EMAIL_VERIFICATION',
          verified: true,
          consumed: false,
          challengeId,
        };
        const otpRec = await otpCol.findOne(otpQuery);
        if (!otpRec) {
          await usersCol.updateOne(
            { $or: [{ id: user.id }, { _id: user.id }] } as any,
            { $unset: { entityCreationPendingAt: '' } }
          );
          return NextResponse.json(
            {
              success: false,
              status: 'otp_required',
              message: 'Official startup email verification is required. Please verify the code sent to your entity email.',
            },
            { status: 400 }
          );
        }
        await otpCol.updateOne({ _id: otpRec._id }, { $set: { consumed: true, consumedAt: new Date().toISOString() } });
      } else if (!skipOtp) {
        const otpQuery: any = {
          email: targetEmail,
          purpose: 'STARTUP_EMAIL_VERIFICATION',
          verified: true,
          consumed: false,
        };
        const otpRec = await otpCol.findOne(otpQuery);
        if (!otpRec) {
          await usersCol.updateOne(
            { $or: [{ id: user.id }, { _id: user.id }] } as any,
            { $unset: { entityCreationPendingAt: '' } }
          );
          return NextResponse.json(
            {
              success: false,
              status: 'otp_required',
              message: 'Official startup email verification is required. Please verify the code sent to your entity email.',
            },
            { status: 400 }
          );
        }
        await otpCol.updateOne({ _id: otpRec._id }, { $set: { consumed: true, consumedAt: new Date().toISOString() } });
      }
    } else if (entityTypeRaw.includes('INVESTOR') || entityTypeRaw.includes('VC') || entityTypeRaw.includes('FIRM')) {
      const targetEmail = (officialEmail || user.email).toLowerCase();
      const skipOtp =
        body.skipOtpIfAuthenticated === true ||
        (!challengeId && (user.email?.toLowerCase() === targetEmail || !officialEmail));

      if (challengeId) {
        const otpQuery: any = {
          email: targetEmail,
          purpose: 'INVESTOR_ORG_EMAIL_VERIFICATION',
          verified: true,
          consumed: false,
          challengeId,
        };
        const otpRec = await otpCol.findOne(otpQuery);
        if (!otpRec) {
          await usersCol.updateOne(
            { $or: [{ id: user.id }, { _id: user.id }] } as any,
            { $unset: { entityCreationPendingAt: '' } }
          );
          return NextResponse.json(
            {
              success: false,
              status: 'otp_required',
              message: 'Official organization email verification is required. Please verify the code sent to your organization email.',
            },
            { status: 400 }
          );
        }
        await otpCol.updateOne({ _id: otpRec._id }, { $set: { consumed: true, consumedAt: new Date().toISOString() } });
      } else if (!skipOtp) {
        const otpQuery: any = {
          email: targetEmail,
          purpose: 'INVESTOR_ORG_EMAIL_VERIFICATION',
          verified: true,
          consumed: false,
        };
        const otpRec = await otpCol.findOne(otpQuery);
        if (!otpRec) {
          await usersCol.updateOne(
            { $or: [{ id: user.id }, { _id: user.id }] } as any,
            { $unset: { entityCreationPendingAt: '' } }
          );
          return NextResponse.json(
            {
              success: false,
              status: 'otp_required',
              message: 'Official organization email verification is required. Please verify the code sent to your organization email.',
            },
            { status: 400 }
          );
        }
        await otpCol.updateOne({ _id: otpRec._id }, { $set: { consumed: true, consumedAt: new Date().toISOString() } });
      }
    }

    // Step 3: Collision-resistant ID generation & strict activation defaults
    let prefix = 'ST';
    let canonicalType = 'STARTUP';
    let verificationStatus = 'PENDING';
    let activationStatus = 'ACTIVE';
    let overallStatus = 'ACTIVE';
    let roleInOrg = 'Founder';
    let initialMembershipStatus = 'ACTIVE';

    if (entityTypeRaw.includes('STARTUP') || entityTypeRaw.includes('VENTURE')) {
      prefix = 'ST';
      canonicalType = 'STARTUP';
      verificationStatus = 'PENDING';
      activationStatus = 'ACTIVE';
      overallStatus = 'ACTIVE';
      roleInOrg = 'Founder';
      initialMembershipStatus = 'ACTIVE';
    } else if (entityTypeRaw.includes('INVESTOR') || entityTypeRaw.includes('VC') || entityTypeRaw.includes('FIRM')) {
      prefix = 'VCI';
      canonicalType = 'INVESTOR_ORG';
      verificationStatus = 'PENDING';
      // High-Risk Remediation: Paid-only entities MUST NOT be set to ACTIVE prematurely
      activationStatus = 'PENDING_COMMERCIAL_ACTIVATION';
      overallStatus = 'PENDING_ACTIVATION';
      roleInOrg = 'Managing Partner';
      initialMembershipStatus = 'PENDING_COMMERCIAL_ACTIVATION';
    } else if (entityTypeRaw.includes('ESP') || entityTypeRaw.includes('INCUBATOR')) {
      prefix = 'ES';
      canonicalType = 'ESP';
      verificationStatus = 'PENDING';
      activationStatus = 'PENDING_ADMIN_APPROVAL';
      overallStatus = 'PENDING_APPROVAL';
      roleInOrg = 'Director';
      initialMembershipStatus = 'PENDING_ADMIN_APPROVAL';
    } else {
      prefix = 'INS';
      canonicalType = 'INSTITUTION';
      verificationStatus = 'PENDING';
      activationStatus = 'PENDING_ADMIN_APPROVAL';
      overallStatus = 'PENDING_APPROVAL';
      roleInOrg = 'Dean / Lead';
      initialMembershipStatus = 'PENDING_ADMIN_APPROVAL';
    }

    // Generate unique ID
    let entityId = generateCollisionResistantEntityId(prefix);
    let collisionAttempts = 0;
    while (await entitiesCol.findOne({ id: entityId })) {
      collisionAttempts++;
      if (collisionAttempts > 5) {
        throw new Error('Collision resolution exceeded maximum attempts for entity identifier');
      }
      entityId = generateCollisionResistantEntityId(prefix);
    }

    const nowIso = new Date().toISOString();

    const rawEntityTag =
      body.accountTag ||
      body.username ||
      `@${entityName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${crypto.randomBytes(2).toString('hex')}`;
    const cleanEntityTag = rawEntityTag.startsWith('@') ? rawEntityTag : `@${rawEntityTag}`;

    const entityDoc = {
      id: entityId,
      entityType: canonicalType,
      accountType: canonicalType,
      name: entityName,
      username: cleanEntityTag,
      accountTag: cleanEntityTag,
      tag: cleanEntityTag,
      officialEmail: officialEmail || user.email,
      createdByUserId: user.id,
      currentOwnerUserId: user.id,
      primaryOwnerId: user.id,
      primaryOwnerName: user.fullName,
      verificationStatus,
      activationStatus,
      status: overallStatus,
      visibility: 'PUBLIC',
      details: body.details || {},
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await entitiesCol.insertOne(entityDoc);

    // If STARTUP entity, seed dedicated startups collection record
    if (canonicalType === 'STARTUP') {
      const startupsCol = db.collection('startups');
      const startupDetails = body.details || {};
      const startupDoc = {
        entityId,
        name: entityName,
        username: cleanEntityTag,
        accountTag: cleanEntityTag,
        tag: cleanEntityTag,
        createdByUserId: user.id,
        currentOwnerUserId: user.id,
        identity: {
          name: entityName,
          username: cleanEntityTag,
          accountTag: cleanEntityTag,
          tag: cleanEntityTag,
          logo: startupDetails.logo || '/xentro-logo.png',
          banner: startupDetails.banner || null,
          tagline: startupDetails.pitch || startupDetails.tagline || 'Building next-generation solutions',
          stage: startupDetails.stage || 'MVP',
          industry: startupDetails.sector || startupDetails.industry || 'Technology & Innovation',
          subSector: startupDetails.subSector || '',
          businessModelType: startupDetails.businessModelType || 'B2B',
          foundedYear: startupDetails.foundedYear || new Date().getFullYear(),
          location: startupDetails.location || 'India',
          operatingGeography: ['India'],
          website: startupDetails.website || '',
          linkedin: startupDetails.linkedin || '',
          isVerified: verificationStatus === 'VERIFIED',
        },
        overview: {
          whatItDoes: startupDetails.pitch || `Official venture profile for ${entityName}.`,
          whoItServes: startupDetails.whoItServes || 'Ecosystem enterprises and partners',
          currentStage: startupDetails.stage || 'Active Venture',
          coreValueProp: startupDetails.pitch || 'Scaling innovative solutions.',
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
          name: `${entityName} Product`,
          category: startupDetails.sector || 'Software',
          description: '',
          status: 'MVP',
          keyFeatures: [],
          screenshots: [],
          demoLink: '',
        },
        companyInfo: {
          legalName: entityName,
          incorporationStatus: 'Active',
          incorporationDate: '',
          registeredLocation: startupDetails.location || 'India',
          isDPIITRecognised: false,
          isMSMERegistered: false,
        },
        market: {
          targetCustomer: '',
          primarySegment: startupDetails.sector || '',
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
              name: user.fullName || 'Founder',
              role: 'Founder & CEO',
              roleCategory: 'founder',
              avatar: '/xentro-logo.png',
              bio: `Founder & Lead at ${entityName}.`,
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
        visibility: 'PUBLIC',
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await startupsCol.insertOne(startupDoc);
    }

    // If INVESTOR_ORG entity, seed dedicated investment_organizations collection record
    let invOrgDoc: any = null;
    if (canonicalType === 'INVESTOR_ORG') {
      const invOrgCol = db.collection('investment_organizations');
      const details = body.details || body;
      invOrgDoc = {
        entityId,
        name: entityName,
        username: cleanEntityTag,
        accountTag: cleanEntityTag,
        tag: cleanEntityTag,
        legalName: body.legalName || details.legalName || entityName,
        organizationType: details.investorType || details.organizationType || body.orgType || 'VC Firm',
        logo: details.logo || body.logo || '/xentro-logo.png',
        banner: details.banner || body.banner || '',
        shortDescription:
          details.pitch ||
          details.shortDescription ||
          body.shortDescription ||
          `Early-stage investment fund backing technology startups across India.`,
        website: details.website || body.website || '',
        linkedIn: details.linkedIn || details.linkedin || body.linkedIn || '',
        headquarters: {
          city: details.city || details.headquarters?.city || body.city || 'Bengaluru',
          state: details.state || details.headquarters?.state || body.state || 'Karnataka',
          country: details.country || details.headquarters?.country || body.country || 'India',
        },
        foundedYear: details.foundedYear || body.foundedYear || '2026',
        officialEmail: officialEmail || user.email,
        fundSize: details.fundSize || body.fundSize || '₹250 Cr',
        aum: details.aum || body.aum || details.fundSize || '₹250 Cr AUM',
        operatingRegions: details.operatingRegions || ['India'],
        verified: false,
        ownerId: user.id,
        currentOwnerUserId: user.id,
        createdByUserId: user.id,
        about: {
          overview: details.about?.overview || details.shortDescription || `${entityName} is an institutional venture fund.`,
          thesis:
            details.about?.thesis ||
            details.thesis ||
            body.thesis ||
            'We back visionary founders building scalable, compounding technology companies.',
          mission: details.about?.mission || `Empowering founders to build enduring tech enterprises.`,
          assetsInfo: details.about?.assetsInfo || details.fundSize || body.fundSize || 'Active fund deployment',
          fundGeneration: details.about?.fundGeneration || 'Active Deployment',
          geographicPresence: details.about?.geographicPresence || `${details.city || body.city || 'Bengaluru'}, India`,
        },
        investmentFocus: details.investmentFocus || {
          sectors: details.selectedSectors || details.sectors || ['Enterprise SaaS', 'FinTech', 'AI & Machine Learning'],
          stages: details.selectedStages || details.stages || ['Seed', 'Series A'],
          geography: {
            countries: [details.country || body.country || 'India'],
            regions: [details.city || body.city || 'Bengaluru'],
          },
          businessModels: ['B2B', 'SaaS', 'Marketplace'],
          ticketSize: details.ticketSize || {
            min: details.minTicket || '₹1 Cr',
            max: details.maxTicket || '₹5 Cr',
            formatted: `${details.minTicket || '₹1 Cr'} – ${details.maxTicket || '₹5 Cr'}`,
          },
          leadInvestorPreference: 'Lead or Co-Lead',
          investmentInstruments: ['Equity', 'CCPS', 'SAFE notes'],
        },
        valueBeyondCapital: details.valueBeyondCapital || {
          supportAreas: ['Go-To-Market Acceleration', 'Customer Introductions', 'Follow-On Syndication'],
          whatIBringToFounders: 'Hands-on platform support in enterprise scaling, executive hiring, and fundraising guidance.',
          advisoryCapabilities: ['GTM Playbooks', 'Pricing Strategy', 'Enterprise Sales'],
        },
        investmentCriteria: details.investmentCriteria || {
          evaluationCriteria: [
            'High founder integrity and velocity',
            'Demonstrated customer demand',
            'Defensible technology moat',
          ],
          preferredTraction: ['MVP', 'Early Revenue'],
          diligenceHighlights: ['Customer references', 'Financial audit'],
        },
        investmentProcess: details.investmentProcess || {
          stages: [
            {
              stepNumber: 1,
              title: 'Initial Deal Review & Screening',
              description: 'Deck review within 48 hours.',
              estimatedTime: '2-3 Days',
            },
            {
              stepNumber: 2,
              title: 'Partner Discussion',
              description: 'Discussion on product roadmap and traction.',
              estimatedTime: '1 Week',
            },
            {
              stepNumber: 3,
              title: 'Due Diligence & Term Sheet',
              description: 'Cap table evaluation and investment memo.',
              estimatedTime: '1-2 Weeks',
            },
          ],
          preferredConnectionMethod: 'Platform pitch submission',
          informationRequiredInitially: ['Pitch Deck (PDF)', 'Metrics'],
          typicalDecisionTimeline: '2 to 3 weeks',
          pitchDeckRequirements: 'PDF deck with traction and financial summary',
          warmIntroPreferred: false,
          unsolicitedPitchesAccepted: true,
        },
        experienceStats: {
          totalInvestments: 0,
          activePortfolio: 0,
          followOnInvestments: 0,
          exits: 0,
          yearsOfExperience: '1 Year',
          industriesInvested: (details.selectedSectors || details.sectors || []).length || 3,
        },
        portfolio: [],
        testimonials: [],
        connectionPreferences: details.connectionPreferences || {
          openToConnectionRequests: true,
          openToStartupPitches: true,
          introductionPreferred: false,
          currentlyInvesting: true,
          notAcceptingNewPitches: false,
          guidelines: 'Happy to review pitches from mission-driven founders.',
        },
        // Real commercial state: Unactivated paid entity must NOT have simulated active entitlement
        subscription: {
          tier: 'institutional',
          status: 'pending_payment',
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          seatsIncluded: 1,
          seatsUsed: 1,
          dealFlowLimit: 0,
          dueDiligenceExportsLimit: 0,
          monthlyPrice: 11490,
          currency: 'INR',
        },
        billingAccount: {
          organizationName: entityName,
          billingEmail: officialEmail || user.email,
          gstin: details.gstin || '',
          pan: details.pan || '',
          taxExempt: false,
          billingAddress: {
            line1: 'Corporate Office',
            city: details.city || body.city || 'Bengaluru',
            state: details.state || body.state || 'Karnataka',
            country: details.country || body.country || 'India',
            postalCode: '560001',
          },
        },
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await invOrgCol.insertOne(invOrgDoc);
    }

    const requestedOrgRole = body.requestedRole || roleInOrg;

    const membershipDoc = {
      id: `MEM-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
      entityId,
      entityName,
      entityType: canonicalType,
      userId: user.id,
      userEmail: user.email,
      role: requestedOrgRole,
      permissions: ['OWNER', 'ADMIN', 'MANAGE_TEAM'],
      status: initialMembershipStatus,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await membershipsCol.insertOne(membershipDoc);

    // Commit active created entity ID on user record
    await usersCol.updateOne(
      { $or: [{ id: user.id }, { _id: user.id }] } as any,
      {
        $set: { activeCreatedEntityId: entityId },
        $unset: { entityCreationPendingAt: '' },
      }
    );

    await logSecurityAuditEvent('ENTITY_CREATED', 'INFO', {
      userId: user.id,
      entityId,
      entityType: canonicalType,
      activationStatus,
    });

    delete (entityDoc as any)._id;
    delete (membershipDoc as any)._id;
    if (invOrgDoc?._id) {
      delete (invOrgDoc as any)._id;
    }

    return NextResponse.json(
      {
        success: true,
        message: `${canonicalType.toLowerCase()} account created successfully. Verification is pending.`,
        data: {
          entity: entityDoc,
          membership: membershipDoc,
          invOrg: invOrgDoc || null,
        },
        source: 'mongodb-atlas',
      },
      { status: 201 }
    );
  } catch (err: any) {
    // Failure recovery: if an exception occurred before entity was inserted, clear the reservation
    try {
      const db = await getDatabase();
      const entitiesCol = db.collection('entities');
      const authRes = await requireAuthenticatedUser(req).catch(() => null);
      const userId = authRes && 'user' in authRes ? authRes.user.id : null;
      if (userId) {
        const existing = await entitiesCol.findOne({
          createdByUserId: userId,
          status: { $nin: ['DELETED', 'ORPHANED_DELETED', 'ARCHIVED'] },
          is_deleted: { $ne: true },
        });
        if (!existing) {
          // Safe to clear reservation because no entity exists for user
          await db.collection('users').updateOne(
            { $or: [{ id: userId }, { _id: userId }] } as any,
            { $unset: { entityCreationPendingAt: '' } }
          );
        }
      }
    } catch (_) {}

    return NextResponse.json(
      { success: false, message: err?.message || 'Database error creating entity account' },
      { status: 500 }
    );
  }

}

export async function GET(req: NextRequest) {
  try {
    let userId = '';
    const token = extractAuthToken(req);
    if (token) {
      const payload = verifyJwtToken(token);
      if (payload?.sub) {
        userId = payload.sub;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to retrieve entity memberships' },
        { status: 401 }
      );
    }

    const db = await getDatabase();
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    const memberships = await membershipsCol.find({ userId, status: { $ne: 'REMOVED' } }).toArray();
    const entityIds = memberships.map((m) => m.entityId);

    const entities = await entitiesCol.find({ id: { $in: entityIds } }).toArray();

    return NextResponse.json({
      success: true,
      data: {
        memberships: memberships.map(({ _id, ...m }) => m),
        entities: entities.map(({ _id, ...e }) => e),
        totalCount: entities.length,
      },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error retrieving entities' },
      { status: 500 }
    );
  }
}
