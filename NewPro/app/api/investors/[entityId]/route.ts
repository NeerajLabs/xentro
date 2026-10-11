import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { FullInvestorProfile } from '@/types/investor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const db = await getDatabase();
    const investorsCol = db.collection('investors');
    const entitiesCol = db.collection('entities');

    // Query investors collection
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
        data: profile,
      });
    }

    // Check entities collection if entity exists as an INVESTOR
    const entity = await entitiesCol.findOne({
      $or: [
        { id: rawEntityId },
        { entityId: rawEntityId },
        { createdByUserId: rawEntityId },
        { primaryOwnerId: rawEntityId },
      ],
      status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
    });

    if (entity) {
      delete (entity as any)._id;
      return NextResponse.json({
        success: true,
        data: {
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
          overview: {
            whoTheyInvestIn: entity.details?.whoItServes || '',
            sectorsFocus: entity.details?.sector || '',
            investmentPhilosophy: entity.details?.pitch || '',
            aimToContribute: '',
          },
          investmentFocus: {
            sectors: entity.details?.sectors || [],
            stages: entity.details?.stages || ['Seed', 'Series A'],
            geography: { countries: ['India'], regions: [] },
            businessModels: ['B2B', 'SaaS'],
            ticketSize: entity.details?.ticketSize || { min: '10L', max: '1Cr', formatted: '₹10L - ₹1Cr' },
          },
          connectionPreferences: {
            openToConnectionRequests: true,
            openToStartupPitches: true,
            introductionPreferred: false,
            currentlyInvesting: true,
            notAcceptingNewPitches: false,
          },
          portfolio: [],
          testimonials: [],
        },
      });
    }

    // Check users collection if user exists as an individual investor
    const usersCol = db.collection('users');
    const userConditions: any[] = [
      { id: rawEntityId },
      { xentroId: rawEntityId },
      { username: rawEntityId },
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

      return NextResponse.json({
        success: true,
        data: {
          id: userDoc.id || rawEntityId,
          name,
          logo: userDoc.avatar || userDoc.photoUrl || pProfile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
          banner: userDoc.banner || pProfile.banner || 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1600&auto=format&fit=crop&q=80',
          investorType: userDoc.investorType || pProfile.professional?.category || 'Angel Network',
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
          connectionPreferences: {
            openToConnectionRequests: true,
            openToStartupPitches: true,
            introductionPreferred: false,
            currentlyInvesting: true,
            notAcceptingNewPitches: false,
          },
          portfolio: [],
          testimonials: [],
        },
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
