import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }
  return cachedClient;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.headers.get('x-user-id') || body.userId || '';
    const userEmail = req.headers.get('x-user-email') || body.userEmail || body.email || '';

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to create an entity account' },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');
    const membershipsCol = db.collection('memberships');

    const query: any[] = [];
    if (userId) query.push({ id: userId }, { _id: userId });
    if (userEmail) query.push({ email: { $regex: `^${userEmail.trim()}$`, $options: 'i' } });

    const user = await usersCol.findOne({ $or: query });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const entityTypeRaw = String(body.entityType || body.type || 'STARTUP').toUpperCase();
    const entityName = String(body.name || body.entityName || '').trim();
    const officialEmail = String(body.officialEmail || body.email || '').trim().toLowerCase();

    if (!entityName) {
      return NextResponse.json({ success: false, message: 'Entity name is required' }, { status: 400 });
    }

    const otpCol = db.collection('otp_codes');
    const challengeId = String(body.challengeId || '').trim();

    // Verify OTP challenge for Startup & Investor Org entities
    if (entityTypeRaw.includes('STARTUP') || entityTypeRaw.includes('VENTURE')) {
      const targetEmail = (officialEmail || user.email).toLowerCase();
      const skipOtp = body.skipOtpIfAuthenticated === true || (!challengeId && (user.email?.toLowerCase() === targetEmail || !officialEmail));

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
      const skipOtp = body.skipOtpIfAuthenticated === true || (!challengeId && (user.email?.toLowerCase() === targetEmail || !officialEmail));

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

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    let entityId = '';
    let canonicalType = 'STARTUP';
    let verificationStatus = 'PENDING';
    let activationStatus = 'ACTIVE';
    let roleInOrg = 'Founder';

    if (entityTypeRaw.includes('STARTUP') || entityTypeRaw.includes('VENTURE')) {
      entityId = `ST-${randomSuffix}`;
      canonicalType = 'STARTUP';
      verificationStatus = 'PENDING';
      activationStatus = 'ACTIVE';
      roleInOrg = 'Founder';
    } else if (entityTypeRaw.includes('INVESTOR') || entityTypeRaw.includes('VC') || entityTypeRaw.includes('FIRM')) {
      entityId = `VCI-${randomSuffix}`;
      canonicalType = 'INVESTOR_ORG';
      verificationStatus = 'PENDING';
      activationStatus = 'PENDING_COMMERCIAL_ACTIVATION';
      roleInOrg = 'Managing Partner';
    } else if (entityTypeRaw.includes('ESP') || entityTypeRaw.includes('INCUBATOR')) {
      entityId = `ES-${randomSuffix}`;
      canonicalType = 'ESP';
      verificationStatus = 'PENDING';
      activationStatus = 'PENDING_ADMIN_APPROVAL';
      roleInOrg = 'Director';
    } else {
      entityId = `INS-${randomSuffix}`;
      canonicalType = 'INSTITUTION';
      verificationStatus = 'PENDING';
      activationStatus = 'PENDING_ADMIN_APPROVAL';
      roleInOrg = 'Dean / Lead';
    }

    const nowIso = new Date().toISOString();

    const rawEntityTag =
      body.accountTag ||
      body.username ||
      `@${entityName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${Math.floor(10 + Math.random() * 90)}`;
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
      status: canonicalType === 'STARTUP' ? 'ACTIVE' : 'PENDING',
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
              avatar: user.avatar || '/xentro-logo.png',
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
        shortDescription: details.pitch || details.shortDescription || body.shortDescription || `Early-stage investment fund backing technology startups across India.`,
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
          thesis: details.about?.thesis || details.thesis || body.thesis || 'We back visionary founders building scalable, compounding technology companies.',
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
          evaluationCriteria: ['High founder integrity and velocity', 'Demonstrated customer demand', 'Defensible technology moat'],
          preferredTraction: ['MVP', 'Early Revenue'],
          diligenceHighlights: ['Customer references', 'Financial audit'],
        },
        investmentProcess: details.investmentProcess || {
          stages: [
            { stepNumber: 1, title: 'Initial Deal Review & Screening', description: 'Deck review within 48 hours.', estimatedTime: '2-3 Days' },
            { stepNumber: 2, title: 'Partner Discussion', description: 'Discussion on product roadmap and traction.', estimatedTime: '1 Week' },
            { stepNumber: 3, title: 'Due Diligence & Term Sheet', description: 'Cap table evaluation and investment memo.', estimatedTime: '1-2 Weeks' },
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
        subscription: {
          tier: 'institutional',
          status: 'active',
          currentPeriodEnd: '2026-12-31T23:59:59Z',
          cancelAtPeriodEnd: false,
          seatsIncluded: 15,
          seatsUsed: 1,
          dealFlowLimit: -1,
          dueDiligenceExportsLimit: 100,
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

    const isPrivilegedOrg = canonicalType === 'INVESTOR_ORG';
    const requestedOrgRole = body.requestedRole || roleInOrg;

    const membershipDoc = {
      id: `MEM-${Date.now().toString().slice(-6)}`,
      entityId,
      entityName,
      entityType: canonicalType,
      userId: user.id,
      userEmail: user.email,
      role: requestedOrgRole,
      permissions: isPrivilegedOrg ? ['VIEW_ONLY'] : ['OWNER', 'ADMIN', 'MANAGE_TEAM'],
      status: isPrivilegedOrg ? 'PENDING_ADMIN_VERIFICATION' : 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await membershipsCol.insertOne(membershipDoc);

    // If privileged Investor Organization role, create specific role verification ticket for Admin Console review
    if (isPrivilegedOrg) {
      try {
        const roleReqCol = db.collection('role_requests');
        await roleReqCol.insertOne({
          id: `REQ-${Date.now().toString().slice(-6)}`,
          requestId: `REQ-${Date.now().toString().slice(-6)}`,
          userId: user.id,
          userEmail: user.email,
          userName: user.fullName || user.name || 'Member',
          currentRole: user.accountType || 'Explorer',
          requestedRole: `Investor Org Privileged Role: ${requestedOrgRole} (${entityName})`,
          reason: `Privileged administrative verification for Investor Organization ${entityName}`,
          entityId,
          entityName,
          status: 'PENDING',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      } catch (_) {}
    }

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
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error creating entity account' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User identification required' }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    const memberships = await membershipsCol.find({ userId }).toArray();
    const entityIds = memberships.map((m) => m.entityId);

    const entities = await entitiesCol.find({ id: { $in: entityIds } }).toArray();

    return NextResponse.json({
      success: true,
      data: {
        memberships,
        entities,
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
