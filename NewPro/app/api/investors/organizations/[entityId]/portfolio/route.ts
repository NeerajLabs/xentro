import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ROLE_PERMISSION_PRESETS } from '@/lib/investorOrganizationService';
import {
  extractAuthToken,
  verifyJwtToken,
  requireAuthenticatedUser,
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function resolveCallerIdentity(req: NextRequest): Promise<{ userId: string | null; error?: NextResponse }> {
  const token = extractAuthToken(req);
  if (token) {
    const payload = verifyJwtToken(token);
    if (payload?.sub) {
      return { userId: payload.sub };
    }
  }

  const authRes = await requireAuthenticatedUser(req);
  if ('error' in authRes) {
    return { userId: null, error: authRes.error };
  }
  return { userId: authRes.user.id };
}

async function checkPortfolioPermission(
  db: any,
  entityId: string,
  userId: string,
  requiredPermission: string = 'viewPortfolio'
): Promise<{ allowed: boolean; role: string; membership: any }> {
  if (!userId) return { allowed: false, role: '', membership: null };

  const membershipsCol = db.collection('memberships');
  const membership = await membershipsCol.findOne({
    entityId,
    userId,
    status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
  });

  const entitiesCol = db.collection('entities');
  const entity = await entitiesCol.findOne({
    id: entityId,
    $or: [{ createdByUserId: userId }, { currentOwnerUserId: userId }, { primaryOwnerId: userId }],
  });

  if (entity) {
    return { allowed: true, role: 'Owner/Managing Partner', membership: { role: 'Owner/Managing Partner' } };
  }

  if (!membership) {
    return { allowed: false, role: '', membership: null };
  }

  const role = membership.role || 'Viewer';
  const presets = (ROLE_PERMISSION_PRESETS as any)[role];
  if (presets && presets[requiredPermission]) {
    return { allowed: true, role, membership };
  }

  return { allowed: false, role, membership };
}

/**
 * Helper to parse currency strings like "₹1.5 Cr", "$750,000", "5000000" into raw numbers
 */
function parseFinancialNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (!val || typeof val !== 'string') return 0;
  const clean = val.replace(/,/g, '').trim();
  if (clean.includes('Cr')) {
    const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 10000000;
  }
  if (clean.includes('L') || clean.includes('Lakh')) {
    const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 100000;
  }
  if (clean.includes('M')) {
    const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 1000000;
  }
  if (clean.includes('k') || clean.includes('K')) {
    const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num * 1000;
  }
  const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * GET /api/investors/organizations/[entityId]/portfolio
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

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const db = await getDatabase();
    const auth = await checkPortfolioPermission(db, rawEntityId, callerUserId, 'viewPortfolio');
    if (!auth.allowed) {
      return NextResponse.json({ success: false, message: 'Forbidden: viewPortfolio permission required.' }, { status: 403 });
    }

    const portCol = db.collection('investor_portfolio');
    const holdings = await portCol.find({ organizationId: rawEntityId }).sort({ updatedAt: -1 }).toArray();

    const cleanHoldings = holdings.map((h) => {
      const copy: any = { ...h };
      delete copy._id;
      return copy;
    });

    // Calculate real portfolio aggregate metrics
    let totalInvestedRaw = 0;
    let totalFairValueRaw = 0;

    cleanHoldings.forEach((h: any) => {
      const checkNum = parseFinancialNumber(h.checkInvested || h.checkSize);
      totalInvestedRaw += checkNum;

      if (h.currentMultiple) {
        const mult = parseFloat(String(h.currentMultiple).replace(/[^0-9.]/g, '')) || 1.0;
        totalFairValueRaw += checkNum * mult;
      } else {
        totalFairValueRaw += checkNum;
      }
    });

    const moic = totalInvestedRaw > 0 ? (totalFairValueRaw / totalInvestedRaw).toFixed(2) + 'x' : '0.00x';

    const metrics = {
      investedCapital: totalInvestedRaw > 0 ? `₹${(totalInvestedRaw / 10000000).toFixed(2)} Cr` : '₹0.00',
      estimatedFairValue: totalFairValueRaw > 0 ? `₹${(totalFairValueRaw / 10000000).toFixed(2)} Cr` : '₹0.00',
      unrealizedMOIC: moic,
      grossFundIRR: cleanHoldings.length > 0 ? 'Available with Fund Reporting' : 'Unavailable',
      activeCompaniesCount: cleanHoldings.length,
    };

    return NextResponse.json({
      success: true,
      data: cleanHoldings,
      metrics,
      count: cleanHoldings.length,
      source: 'mongodb-atlas',
    });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error fetching portfolio' }, { status: 500 });
  }
}

/**
 * POST /api/investors/organizations/[entityId]/portfolio
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const db = await getDatabase();
    const auth = await checkPortfolioPermission(db, rawEntityId, callerUserId, 'editPortfolio');
    if (!auth.allowed) {
      return NextResponse.json({ success: false, message: 'Forbidden: editPortfolio permission required.' }, { status: 403 });
    }

    const body = await req.json();
    const holdingData = body?.holding || body;
    const portCol = db.collection('investor_portfolio');

    const nowIso = new Date().toISOString();
    const holdingId = holdingData.id || `port_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const newHolding = {
      ...holdingData,
      id: holdingId,
      organizationId: rawEntityId,
      status: holdingData.status || 'On Track',
      boardSeat: holdingData.boardSeat || 'None',
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    delete (newHolding as any)._id;

    await portCol.insertOne(newHolding);

    return NextResponse.json({
      success: true,
      message: 'Portfolio company holding added successfully.',
      data: newHolding,
    });
  } catch (error: any) {
    console.error('Error adding portfolio holding:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error adding portfolio holding' }, { status: 500 });
  }
}

/**
 * PUT /api/investors/organizations/[entityId]/portfolio
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

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const db = await getDatabase();
    const auth = await checkPortfolioPermission(db, rawEntityId, callerUserId, 'editPortfolio');
    if (!auth.allowed) {
      return NextResponse.json({ success: false, message: 'Forbidden: editPortfolio permission required.' }, { status: 403 });
    }

    const body = await req.json();
    const { holdingId, updates } = body;
    const targetHoldingId = holdingId || updates?.id;

    if (!targetHoldingId) {
      return NextResponse.json({ success: false, message: 'Holding ID is required for update' }, { status: 400 });
    }

    const portCol = db.collection('investor_portfolio');
    const nowIso = new Date().toISOString();
    const updateFields = { ...updates, updatedAt: nowIso };
    delete updateFields._id;
    delete updateFields.id;
    delete updateFields.organizationId;

    await portCol.updateOne(
      { id: targetHoldingId, organizationId: rawEntityId },
      { $set: updateFields }
    );

    const updated = await portCol.findOne({ id: targetHoldingId, organizationId: rawEntityId });
    delete (updated as any)._id;

    return NextResponse.json({
      success: true,
      message: 'Portfolio holding updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating portfolio holding:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error updating portfolio holding' }, { status: 500 });
  }
}
