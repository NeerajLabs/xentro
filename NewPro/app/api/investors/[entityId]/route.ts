import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { FullInvestorProfile } from '@/types/investor';
import { investorProfilesMap } from '@/data/investorProfilesData';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Ensures any partial or database investor document has complete sub-objects
 * so UI tabs (Investment Profile, Portfolio, Connect, Content) never throw undefined errors.
 */
function hydrateFullInvestorProfile(raw: any, fallbackId: string = 'inv_fallback'): FullInvestorProfile {
  const name = raw.name || raw.fullName || 'Investor';
  const org = raw.organization || raw.company || raw.startupName || 'Investment Partner';
  const role = raw.currentRole || raw.role || 'Investor';
  const sectors = Array.isArray(raw.investmentFocus?.sectors) && raw.investmentFocus.sectors.length > 0
    ? raw.investmentFocus.sectors
    : Array.isArray(raw.sectors) && raw.sectors.length > 0
    ? raw.sectors
    : ['Technology', 'SaaS', 'Deep Tech', 'AI'];

  const stages = Array.isArray(raw.investmentFocus?.stages) && raw.investmentFocus.stages.length > 0
    ? raw.investmentFocus.stages
    : ['Seed', 'Series A', 'Early Stage'];

  const countries = Array.isArray(raw.investmentFocus?.geography?.countries) && raw.investmentFocus.geography.countries.length > 0
    ? raw.investmentFocus.geography.countries
    : [raw.location?.country || 'India'];

  const ticketFormatted = raw.investmentFocus?.ticketSize?.formatted || raw.ticketSize || '₹25L – ₹2Cr';

  return {
    id: raw.id || raw.entityId || fallbackId,
    name,
    username: raw.username || raw.accountTag || `@${name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
    accountTag: raw.accountTag || raw.username || `@${name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
    tag: raw.accountTag || raw.username || `@${name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`,
    logo: raw.logo || raw.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    banner: raw.banner || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&auto=format&fit=crop&q=80',
    investorType: raw.investorType || 'Angel Network',
    currentRole: role,
    organization: org,
    location: {
      city: raw.location?.city || '',
      state: raw.location?.state || '',
      country: raw.location?.country || 'India',
    },
    website: raw.website || '',
    linkedIn: raw.linkedIn || raw.linkedin || '',
    verified: Boolean(raw.verified),
    primaryInvestmentFocus: raw.primaryInvestmentFocus || sectors.join(' · '),
    bio: raw.bio || `${name} is an active investor in the Xentro ecosystem.`,
    background: raw.background || `${role} at ${org}`,
    yearsOfInvestingExperience: raw.yearsOfInvestingExperience || '5+ Years',
    overview: {
      whoTheyInvestIn: raw.overview?.whoTheyInvestIn || 'Early-stage technology and high-growth ventures with defensible unit economics.',
      sectorsFocus: raw.overview?.sectorsFocus || sectors.join(', '),
      investmentPhilosophy: raw.overview?.investmentPhilosophy || 'Backing ambitious founders building sustainable, mission-critical businesses.',
      aimToContribute: raw.overview?.aimToContribute || 'Strategic advisory, follow-on syndication, and network access.',
    },
    investmentFocus: {
      sectors,
      stages,
      geography: {
        countries,
        regions: raw.investmentFocus?.geography?.regions || [],
      },
      businessModels: Array.isArray(raw.investmentFocus?.businessModels) && raw.investmentFocus.businessModels.length > 0
        ? raw.investmentFocus.businessModels
        : ['B2B', 'SaaS', 'Marketplace'],
      ticketSize: {
        min: raw.investmentFocus?.ticketSize?.min || '25L',
        max: raw.investmentFocus?.ticketSize?.max || '2Cr',
        formatted: ticketFormatted,
      },
      leadInvestorPreference: raw.investmentFocus?.leadInvestorPreference || 'Lead / Co-lead Preferred',
      coInvestorPreference: raw.investmentFocus?.coInvestorPreference || 'Open to syndicating with verified funds & angels',
      investmentInstruments: Array.isArray(raw.investmentFocus?.investmentInstruments) && raw.investmentFocus.investmentInstruments.length > 0
        ? raw.investmentFocus.investmentInstruments
        : ['Priced Equity', 'SAFE', 'Convertible'],
    },
    valueBeyondCapital: {
      supportAreas: Array.isArray(raw.valueBeyondCapital?.supportAreas) && raw.valueBeyondCapital.supportAreas.length > 0
        ? raw.valueBeyondCapital.supportAreas
        : ['Strategic Guidance', 'Industry Connections', 'Hiring & Talent'],
      whatIBringToFounders: raw.valueBeyondCapital?.whatIBringToFounders || 'Committed operational guidance and enterprise customer introductions.',
      advisoryCapabilities: Array.isArray(raw.valueBeyondCapital?.advisoryCapabilities) && raw.valueBeyondCapital.advisoryCapabilities.length > 0
        ? raw.valueBeyondCapital.advisoryCapabilities
        : ['Go-to-Market Strategy', 'Fundraising Preparation', 'Executive Hiring'],
    },
    investmentCriteria: {
      evaluationCriteria: Array.isArray(raw.investmentCriteria?.evaluationCriteria) && raw.investmentCriteria.evaluationCriteria.length > 0
        ? raw.investmentCriteria.evaluationCriteria
        : ['Clear Problem-Solution Fit', 'Defensible Moat', 'Scalable Unit Economics'],
      preferredTraction: Array.isArray(raw.investmentCriteria?.preferredTraction) && raw.investmentCriteria.preferredTraction.length > 0
        ? raw.investmentCriteria.preferredTraction
        : ['MVP', 'Early Revenue', 'PMF'],
      diligenceHighlights: Array.isArray(raw.investmentCriteria?.diligenceHighlights) && raw.investmentCriteria.diligenceHighlights.length > 0
        ? raw.investmentCriteria.diligenceHighlights
        : ['Founding Team Domain Experience', 'Market Sizing'],
    },
    investmentProcess: {
      stages: Array.isArray(raw.investmentProcess?.stages) && raw.investmentProcess.stages.length > 0
        ? raw.investmentProcess.stages
        : [
            { stepNumber: 1, title: 'Introductory Call', description: 'Initial alignment on thesis and problem domain', estimatedTime: '30 mins' },
            { stepNumber: 2, title: 'Thesis & Model Review', description: 'Deep-dive into unit economics, product demo and defensibility', estimatedTime: '1 week' },
            { stepNumber: 3, title: 'Partner Discussion', description: 'Syndicate alignment and strategic value creation', estimatedTime: '1 week' },
            { stepNumber: 4, title: 'Term Sheet', description: 'Final terms negotiation and cheque deployment', estimatedTime: '3–5 days' },
          ],
      preferredConnectionMethod: raw.investmentProcess?.preferredConnectionMethod || 'Platform Connect or Direct Intro',
      informationRequiredInitially: Array.isArray(raw.investmentProcess?.informationRequiredInitially) && raw.investmentProcess.informationRequiredInitially.length > 0
        ? raw.investmentProcess.informationRequiredInitially
        : ['Pitch Deck', 'Traction Metrics'],
      typicalDecisionTimeline: raw.investmentProcess?.typicalDecisionTimeline || '2–3 Weeks',
      pitchDeckRequirements: raw.investmentProcess?.pitchDeckRequirements || 'Executive Summary, Problem, Product, Traction, Financials',
      warmIntroPreferred: Boolean(raw.investmentProcess?.warmIntroPreferred),
      unsolicitedPitchesAccepted: Boolean(raw.investmentProcess?.unsolicitedPitchesAccepted !== false),
    },
    connectionPreferences: {
      openToConnectionRequests: Boolean(raw.connectionPreferences?.openToConnectionRequests !== false),
      openToStartupPitches: Boolean(raw.connectionPreferences?.openToStartupPitches !== false),
      introductionPreferred: Boolean(raw.connectionPreferences?.introductionPreferred),
      currentlyInvesting: Boolean(raw.connectionPreferences?.currentlyInvesting !== false),
      notAcceptingNewPitches: Boolean(raw.connectionPreferences?.notAcceptingNewPitches),
      guidelines: raw.connectionPreferences?.guidelines || 'Open to high-conviction founders solving mission-critical problems.',
    },
    experienceStats: {
      totalInvestments: raw.experienceStats?.totalInvestments || 8,
      activePortfolio: raw.experienceStats?.activePortfolio || 6,
      followOnInvestments: raw.experienceStats?.followOnInvestments || 3,
      exits: raw.experienceStats?.exits || 2,
      yearsOfExperience: raw.experienceStats?.yearsOfExperience || raw.yearsOfInvestingExperience || '5+ Years',
      industriesInvested: raw.experienceStats?.industriesInvested || 4,
    },
    portfolio: Array.isArray(raw.portfolio) ? raw.portfolio : [],
    testimonials: Array.isArray(raw.testimonials) ? raw.testimonials : [],
    content: Array.isArray(raw.content) ? raw.content : [],
    activities: Array.isArray(raw.activities) ? raw.activities : [],
  };
}

/**
 * GET /api/investors/[entityId]
 * Fetches authoritative investor profile from MongoDB Atlas.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json(
        { success: false, message: 'Entity ID is required' },
        { status: 400 }
      );
    }

    // 0. Check predefined static records (e.g. VCI-SEQUOIA, inv_1 .. inv_10)
    if (rawEntityId === 'VCI-SEQUOIA' && investorProfilesMap['inv_1']) {
      return NextResponse.json({
        success: true,
        data: hydrateFullInvestorProfile({ ...investorProfilesMap['inv_1'], id: 'VCI-SEQUOIA', entityId: 'VCI-SEQUOIA' }, 'VCI-SEQUOIA'),
      });
    }

    if (investorProfilesMap[rawEntityId]) {
      return NextResponse.json({
        success: true,
        data: hydrateFullInvestorProfile(investorProfilesMap[rawEntityId], rawEntityId),
      });
    }

    const db = await getDatabase();
    const investorsCol = db.collection('investors');
    const entitiesCol = db.collection('entities');
    const invOrgsCol = db.collection('investment_organizations');
    const usersCol = db.collection('users');

    // 1. Query investors collection
    const profile = await investorsCol.findOne({
      $or: [
        { id: rawEntityId },
        { entityId: rawEntityId },
        { userId: rawEntityId },
        { createdByUserId: rawEntityId },
      ],
      deleted: { $ne: true },
      is_deleted: { $ne: true },
    });

    if (profile) {
      delete (profile as any)._id;
      return NextResponse.json({
        success: true,
        data: hydrateFullInvestorProfile(profile, rawEntityId),
      });
    }

    // 2. Query dedicated investment_organizations collection
    const invOrg = await invOrgsCol.findOne({
      $or: [
        { entityId: rawEntityId },
        { id: rawEntityId },
        { code: rawEntityId },
        { name: { $regex: new RegExp(`^${rawEntityId}$`, 'i') } },
      ],
      status: { $nin: ['DELETED', 'REJECTED'] },
    });

    if (invOrg) {
      delete (invOrg as any)._id;
      const orgProfile = hydrateFullInvestorProfile({
        id: invOrg.entityId || invOrg.id || rawEntityId,
        entityId: invOrg.entityId || invOrg.id || rawEntityId,
        name: invOrg.name,
        logo: invOrg.logo || '/xentro-logo.png',
        banner: invOrg.banner || '',
        investorType: invOrg.organizationType || 'Venture Capital',
        currentRole: 'Managing Partner',
        organization: invOrg.name,
        location: {
          city: invOrg.headquarters?.city || '',
          state: invOrg.headquarters?.state || '',
          country: invOrg.headquarters?.country || 'India',
        },
        website: invOrg.website || '',
        linkedIn: invOrg.linkedIn || '',
        verified: Boolean(invOrg.verified),
        bio: invOrg.shortDescription || invOrg.about?.overview || `${invOrg.name} is an active investment organization on Xentro.`,
        ticketSize: invOrg.fundSize || '₹5 Cr – ₹25 Cr',
        valueBeyondCapital: invOrg.valueBeyondCapital || undefined,
        investmentCriteria: invOrg.investmentCriteria || undefined,
        investmentProcess: invOrg.investmentProcess || undefined,
        portfolio: invOrg.portfolio || [],
      }, rawEntityId);

      return NextResponse.json({
        success: true,
        data: orgProfile,
      });
    }

    // 3. Check entities collection if entity exists as an INVESTOR or INVESTOR_ORG
    const entity = await entitiesCol.findOne({
      $or: [
        { id: rawEntityId },
        { entityId: rawEntityId },
        { username: rawEntityId },
        { username: `@${rawEntityId.replace(/^@/, '')}` },
        { accountTag: rawEntityId },
        { accountTag: `@${rawEntityId.replace(/^@/, '')}` },
        { createdByUserId: rawEntityId },
        { primaryOwnerId: rawEntityId },
      ],
      status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
    });

    if (entity) {
      delete (entity as any)._id;
      const entityProfile = hydrateFullInvestorProfile({
        id: entity.id || rawEntityId,
        name: entity.name,
        logo: entity.logo || '/xentro-logo.png',
        banner: entity.banner || '',
        investorType: entity.details?.investorType || 'Angel Investor',
        currentRole: entity.details?.currentRole || 'Investor',
        organization: entity.name,
        location: {
          city: entity.location?.city || '',
          state: entity.location?.state || '',
          country: entity.location?.country || 'India',
        },
        website: entity.website || '',
        linkedIn: entity.linkedin || '',
        verified: entity.verificationStatus === 'VERIFIED',
        bio: entity.details?.shortDescription || entity.details?.pitch || `${entity.name} is a verified investment partner on Xentro.`,
        overview: {
          whoTheyInvestIn: entity.details?.whoItServes || 'Early-stage founders with strong product-market fit.',
          sectorsFocus: entity.details?.sector || 'Technology, SaaS, Deep Tech',
          investmentPhilosophy: entity.details?.pitch || 'Founder-first capital partner.',
          aimToContribute: 'Strategic growth and follow-on fundraising.',
        },
        investmentFocus: {
          sectors: entity.details?.sectors || [],
          stages: entity.details?.stages || ['Seed', 'Series A'],
          geography: { countries: ['India'], regions: [] },
          businessModels: ['B2B', 'SaaS'],
          ticketSize: entity.details?.ticketSize || { min: '10L', max: '1Cr', formatted: '₹10L - ₹1Cr' },
        },
        portfolio: entity.portfolio || [],
      }, rawEntityId);

      return NextResponse.json({
        success: true,
        data: entityProfile,
      });
    }

    // 4. Check users collection if user exists as an individual investor
    const userConditions: any[] = [
      { id: rawEntityId },
      { xentroId: rawEntityId },
      { username: rawEntityId },
      { username: `@${rawEntityId.replace(/^@/, '')}` },
      { accountTag: rawEntityId },
      { accountTag: `@${rawEntityId.replace(/^@/, '')}` },
      { email: rawEntityId.toLowerCase() },
    ];
    const userDoc = await usersCol.findOne({
      $or: userConditions,
      deleted: { $ne: true },
      is_deleted: { $ne: true },
    } as any);

    if (userDoc) {
      delete (userDoc as any).password;
      delete (userDoc as any).passwordHash;
      const pProfile = userDoc.personalProfile || {};
      const name = userDoc.fullName || userDoc.name || pProfile.fullName || 'Investor';
      const company = userDoc.organization || userDoc.company || userDoc.startupName || pProfile.currentOrganization || 'Angel Network';
      const headline = userDoc.headline || pProfile.headline || pProfile.professionalHeadline || `${userDoc.role || 'Investor'} at ${company}`;
      const bio = userDoc.bio || pProfile.bio || pProfile.about || `${name} is an active investor in the Xentro ecosystem.`;
      const locationObj = pProfile.location || {
        city: userDoc.city || '',
        state: userDoc.state || '',
        country: userDoc.country || 'India',
      };
      const sectors = Array.isArray(pProfile.industries) && pProfile.industries.length > 0
        ? pProfile.industries
        : Array.isArray(pProfile.areasOfExpertise) && pProfile.areasOfExpertise.length > 0
        ? pProfile.areasOfExpertise
        : ['Technology', 'SaaS', 'Deep Tech'];

      const userProfile = hydrateFullInvestorProfile({
        id: userDoc.id || rawEntityId,
        name,
        logo: userDoc.avatar || userDoc.photoUrl || pProfile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
        banner: userDoc.banner || pProfile.banner || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&auto=format&fit=crop&q=80',
        investorType: userDoc.investorType || pProfile.professional?.category || 'Individual Angel',
        currentRole: userDoc.currentRole || userDoc.role || 'Investor',
        organization: company,
        location: {
          city: locationObj.city || '',
          state: locationObj.state || '',
          country: locationObj.country || 'India',
        },
        verified: Boolean(userDoc.verified || userDoc.emailVerified),
        primaryInvestmentFocus: sectors.join(' · '),
        bio,
        background: headline,
        yearsOfInvestingExperience: '5+ Years',
        overview: {
          whoTheyInvestIn: 'Early-stage technology and high-growth ventures with defensible unit economics.',
          sectorsFocus: sectors.join(', '),
          investmentPhilosophy: 'Backing ambitious founders building sustainable, mission-critical businesses.',
          aimToContribute: 'Strategic advisory, follow-on syndication, and network access.',
        },
        investmentFocus: {
          sectors,
          stages: ['Pre-Seed', 'Seed', 'Early Stage'],
          geography: { countries: [locationObj.country || 'India'], regions: [] },
          businessModels: ['B2B', 'SaaS', 'Marketplace'],
          ticketSize: { min: '25L', max: '2Cr', formatted: '₹25L – ₹2Cr' },
        },
      }, rawEntityId);

      return NextResponse.json({
        success: true,
        data: userProfile,
      });
    }

    return NextResponse.json(
      { success: false, message: 'Investor profile not found in database' },
      { status: 404 }
    );
  } catch (error: any) {
    console.error('Error fetching investor profile:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error fetching investor profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/investors/[entityId]
 * Persists investor profile to MongoDB Atlas and keeps entities registry in sync.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json(
        { success: false, message: 'Entity ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const profileData: FullInvestorProfile = body?.profile || body;

    if (!profileData || typeof profileData !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Valid profile payload is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const investorsCol = db.collection('investors');
    const entitiesCol = db.collection('entities');

    const nowIso = new Date().toISOString();
    const profileToSave = {
      ...profileData,
      id: profileData.id || rawEntityId,
      entityId: rawEntityId,
      updatedAt: nowIso,
    };
    delete (profileToSave as any)._id;

    // 1. Upsert into investors collection
    await investorsCol.updateOne(
      {
        $or: [
          { id: rawEntityId },
          { entityId: rawEntityId },
          { id: profileData.id },
        ],
      },
      {
        $set: profileToSave,
        $setOnInsert: {
          createdAt: nowIso,
        },
      },
      { upsert: true }
    );

    // 2. Sync central entities collection
    const entityUpdate: any = {
      name: profileData.name || undefined,
      logo: profileData.logo || undefined,
      banner: profileData.banner || undefined,
      website: profileData.website || undefined,
      linkedin: profileData.linkedIn || undefined,
      updatedAt: nowIso,
      'details.investorType': profileData.investorType || undefined,
      'details.currentRole': profileData.currentRole || undefined,
      'details.ticketSize': profileData.investmentFocus?.ticketSize || undefined,
      'details.sectors': profileData.investmentFocus?.sectors || undefined,
      'details.stages': profileData.investmentFocus?.stages || undefined,
      'details.openToPitches': profileData.connectionPreferences?.openToStartupPitches ?? true,
      'details.openToConnections': profileData.connectionPreferences?.openToConnectionRequests ?? true,
    };

    // Remove undefined values
    Object.keys(entityUpdate).forEach((key) => {
      if (entityUpdate[key] === undefined) {
        delete entityUpdate[key];
      }
    });

    await entitiesCol.updateOne(
      {
        $or: [
          { id: rawEntityId },
          { entityId: rawEntityId },
        ],
      },
      {
        $set: entityUpdate,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Investor profile persisted successfully to MongoDB',
      data: profileToSave,
    });
  } catch (error: any) {
    console.error('Error saving investor profile:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error updating investor profile' },
      { status: 500 }
    );
  }
}
