import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ROLE_PERMISSION_PRESETS } from '@/lib/investorOrganizationService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Check if the given user has the required permission for the organization.
 */
async function checkOrgPermission(
  db: any,
  entityId: string,
  userId: string,
  requiredPermission?: string
): Promise<{ allowed: boolean; role: string; membership: any }> {
  if (!userId) return { allowed: false, role: '', membership: null };

  const membershipsCol = db.collection('memberships');
  const membership = await membershipsCol.findOne({
    entityId,
    userId,
    status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
  });

  if (!membership) {
    // Check if user is primary owner on entities collection
    const entitiesCol = db.collection('entities');
    const entity = await entitiesCol.findOne({
      id: entityId,
      $or: [{ createdByUserId: userId }, { currentOwnerUserId: userId }, { primaryOwnerId: userId }],
    });
    if (entity) {
      return { allowed: true, role: 'Owner/Managing Partner', membership: { role: 'Owner/Managing Partner' } };
    }
    return { allowed: false, role: '', membership: null };
  }

  const role = membership.role || 'Viewer';
  if (!requiredPermission) {
    return { allowed: true, role, membership };
  }

  // Check role permission presets
  const presets = (ROLE_PERMISSION_PRESETS as any)[role];
  if (presets && presets[requiredPermission]) {
    return { allowed: true, role, membership };
  }

  // Also check explicit permissions array on membership if present
  if (Array.isArray(membership.permissions) && (membership.permissions.includes('OWNER') || membership.permissions.includes('ADMIN') || membership.permissions.includes(requiredPermission))) {
    return { allowed: true, role, membership };
  }

  return { allowed: false, role, membership };
}

/**
 * GET /api/investors/organizations/[entityId]
 * Fetches authoritative institutional profile from MongoDB Atlas.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const invOrgCol = db.collection('investment_organizations');
    const entitiesCol = db.collection('entities');

    let org: any = await invOrgCol.findOne({
      $or: [{ entityId: rawEntityId }, { id: rawEntityId }],
    });

    if (!org) {
      // Fallback: check entities collection and construct baseline
      const entity = await entitiesCol.findOne({
        $or: [{ id: rawEntityId }, { entityId: rawEntityId }],
        status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
      });

      if (!entity) {
        return NextResponse.json(
          { success: false, message: 'Investment Organization not found' },
          { status: 404 }
        );
      }

      const details = entity.details || {};
      org = {
        entityId: entity.id,
        id: entity.id,
        name: entity.name,
        legalName: details.legalName || entity.name,
        organizationType: details.investorType || details.organizationType || 'VC Firm',
        logo: entity.logo || '/xentro-logo.png',
        banner: entity.banner || '',
        shortDescription: details.pitch || details.tagline || details.shortDescription || `Institutional investment fund ${entity.name}`,
        website: entity.website || '',
        linkedIn: entity.linkedin || '',
        headquarters: {
          city: entity.location?.city || details.location || 'Bengaluru',
          state: entity.location?.state || 'Karnataka',
          country: entity.location?.country || 'India',
        },
        foundedYear: details.foundedYear || '2026',
        officialEmail: entity.officialEmail || '',
        fundSize: details.fundSize || '₹250 Cr',
        aum: details.aum || details.fundSize || '₹250 Cr AUM',
        operatingRegions: details.operatingRegions || ['India'],
        verified: entity.verificationStatus === 'VERIFIED',
        ownerId: entity.currentOwnerUserId || entity.primaryOwnerId || entity.createdByUserId,
        about: {
          overview: details.pitch || `${entity.name} is an institutional venture capital firm.`,
          thesis: details.thesis || 'We back ambitious founders solving scalable global challenges.',
          mission: details.mission || 'Empowering founders to scale impactful tech enterprises.',
          assetsInfo: details.assetsInfo || details.fundSize || 'Active fund deployment',
          fundGeneration: details.fundGeneration || 'Active Deployment',
          geographicPresence: details.location || 'Bengaluru, India',
        },
        investmentFocus: {
          sectors: details.sectors || ['Enterprise SaaS', 'FinTech', 'AI & Machine Learning'],
          stages: details.stages || ['Seed', 'Series A'],
          geography: { countries: ['India'], regions: ['Bengaluru'] },
          businessModels: ['B2B', 'SaaS', 'Marketplace'],
          ticketSize: details.ticketSize || { min: '₹1 Cr', max: '₹5 Cr', formatted: '₹1 Cr – ₹5 Cr' },
          leadInvestorPreference: 'Lead or Co-Lead',
          investmentInstruments: ['Equity', 'CCPS', 'SAFE notes'],
        },
        valueBeyondCapital: {
          supportAreas: ['Go-To-Market Acceleration', 'Customer Introductions', 'Follow-On Syndication'],
          whatIBringToFounders: 'Hands-on platform support in enterprise scaling and executive hiring.',
          advisoryCapabilities: ['GTM Playbooks', 'Pricing Strategy'],
        },
        investmentCriteria: {
          evaluationCriteria: ['Founder integrity and velocity', 'Demonstrated demand', 'Defensible moat'],
          preferredTraction: ['MVP', 'Early Revenue'],
          diligenceHighlights: ['Customer references', 'Financial audit'],
        },
        investmentProcess: {
          stages: [
            { stepNumber: 1, title: 'Screening', description: 'Review within 48h.', estimatedTime: '2 Days' },
            { stepNumber: 2, title: 'Partner Discussion', description: 'Deep-dive on product.', estimatedTime: '1 Week' },
          ],
          preferredConnectionMethod: 'Platform pitch submission',
          typicalDecisionTimeline: '2 to 3 weeks',
          pitchDeckRequirements: 'PDF deck',
          warmIntroPreferred: false,
          unsolicitedPitchesAccepted: true,
        },
        experienceStats: {
          totalInvestments: 0,
          activePortfolio: 0,
          followOnInvestments: 0,
          exits: 0,
          yearsOfExperience: '1 Year',
          industriesInvested: 3,
        },
        portfolio: [],
        testimonials: [],
        connectionPreferences: {
          openToConnectionRequests: true,
          openToStartupPitches: true,
          introductionPreferred: false,
          currentlyInvesting: true,
          notAcceptingNewPitches: false,
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
          organizationName: entity.name,
          billingEmail: entity.officialEmail || '',
          taxExempt: false,
          billingAddress: {
            line1: 'Corporate Office',
            city: 'Bengaluru',
            state: 'Karnataka',
            country: 'India',
            postalCode: '560001',
          },
        },
      };

      // Upsert into investment_organizations for persistence
      await invOrgCol.updateOne(
        { entityId: entity.id },
        { $setOnInsert: org },
        { upsert: true }
      );
    }

    if (org && org._id) {
      delete (org as any)._id;
    }

    // Load real portfolio count and deals count from operational collections if available
    const dealsCol = db.collection('investor_deals');
    const portCol = db.collection('investor_portfolio');
    const orgEntityId = org?.entityId || org?.id || rawEntityId;
    const dealsCount = await dealsCol.countDocuments({ organizationId: orgEntityId });
    const portfolioHoldings = await portCol.find({ organizationId: orgEntityId }).toArray();

    if (org && portfolioHoldings.length > 0) {
      org.portfolio = portfolioHoldings.map((p) => {
        const copy: any = { ...p };
        delete copy._id;
        return copy;
      });
      if (org.experienceStats) {
        org.experienceStats.activePortfolio = portfolioHoldings.length;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...org,
        id: orgEntityId,
        dealsCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching investment organization profile:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error fetching profile' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/investors/organizations/[entityId]
 * Updates authoritative institutional profile in MongoDB Atlas.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const callerUserId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    const db = await getDatabase();

    // Check permission
    if (callerUserId) {
      const authResult = await checkOrgPermission(db, rawEntityId, callerUserId, 'manageOrganization');
      if (!authResult.allowed) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Caller lacks manageOrganization permission.' },
          { status: 403 }
        );
      }
    }

    const body = await req.json();
    const updateData = body?.organization || body;
    delete (updateData as any)._id;
    delete (updateData as any).verified; // Rule: Verification cannot be self-asserted

    const nowIso = new Date().toISOString();
    updateData.updatedAt = nowIso;
    updateData.entityId = rawEntityId;

    const invOrgCol = db.collection('investment_organizations');
    const entitiesCol = db.collection('entities');

    await invOrgCol.updateOne(
      { $or: [{ entityId: rawEntityId }, { id: rawEntityId }] },
      {
        $set: updateData,
        $setOnInsert: { createdAt: nowIso },
      },
      { upsert: true }
    );

    // Sync central entities collection
    const entityUpdate: any = {
      name: updateData.name || undefined,
      logo: updateData.logo || undefined,
      banner: updateData.banner || undefined,
      website: updateData.website || undefined,
      linkedin: updateData.linkedIn || undefined,
      updatedAt: nowIso,
      'details.fundSize': updateData.fundSize || undefined,
      'details.aum': updateData.aum || undefined,
      'details.ticketSize': updateData.investmentFocus?.ticketSize || undefined,
      'details.sectors': updateData.investmentFocus?.sectors || undefined,
      'details.stages': updateData.investmentFocus?.stages || undefined,
      'details.pitch': updateData.about?.thesis || undefined,
      'details.openToPitches': updateData.connectionPreferences?.openToStartupPitches ?? true,
      'details.openToConnections': updateData.connectionPreferences?.openToConnectionRequests ?? true,
    };

    Object.keys(entityUpdate).forEach((key) => {
      if (entityUpdate[key] === undefined) delete entityUpdate[key];
    });

    await entitiesCol.updateOne(
      { $or: [{ id: rawEntityId }, { entityId: rawEntityId }] },
      { $set: entityUpdate }
    );

    return NextResponse.json({
      success: true,
      message: 'Investment organization profile updated successfully.',
      data: updateData,
    });
  } catch (error: any) {
    console.error('Error updating investment organization profile:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error updating profile' },
      { status: 500 }
    );
  }
}
