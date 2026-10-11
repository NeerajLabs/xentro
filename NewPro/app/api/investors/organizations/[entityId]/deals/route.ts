import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ROLE_PERMISSION_PRESETS } from '@/lib/investorOrganizationService';
import { InvestorDeal } from '@/types/investor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function checkDealPermission(
  db: any,
  entityId: string,
  userId: string,
  requiredPermission: string = 'viewDealFlow'
): Promise<{ allowed: boolean; role: string; membership: any }> {
  if (!userId) return { allowed: true, role: 'Owner/Managing Partner', membership: null }; // default allow in open session, or strict if provided

  const membershipsCol = db.collection('memberships');
  const membership = await membershipsCol.findOne({
    entityId,
    userId,
    status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
  });

  if (!membership) {
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
  const presets = (ROLE_PERMISSION_PRESETS as any)[role];
  if (presets && presets[requiredPermission]) {
    return { allowed: true, role, membership };
  }

  return { allowed: false, role, membership };
}

/**
 * GET /api/investors/organizations/[entityId]/deals
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

    const callerUserId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    const db = await getDatabase();
    const dealsCol = db.collection('investor_deals');

    let filter: any = { organizationId: rawEntityId };

    if (callerUserId) {
      const auth = await checkDealPermission(db, rawEntityId, callerUserId, 'viewDealFlow');
      if (!auth.allowed) {
        return NextResponse.json({ success: false, message: 'Forbidden: viewDealFlow permission required.' }, { status: 403 });
      }

      // Check assigned scoping mode
      if (auth.membership?.dealAccessMode === 'assigned') {
        filter.$or = [
          { assignedMemberId: callerUserId },
          { assignedMemberId: auth.membership.id },
          { createdByUserId: callerUserId },
        ];
      }
    }

    const deals = await dealsCol.find(filter).sort({ updatedAt: -1 }).toArray();
    const cleanDeals = deals.map((d) => {
      const copy: any = { ...d };
      delete copy._id;
      return copy;
    });

    return NextResponse.json({
      success: true,
      data: cleanDeals,
      count: cleanDeals.length,
    });
  } catch (error: any) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error fetching deals' }, { status: 500 });
  }
}

/**
 * POST /api/investors/organizations/[entityId]/deals
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

    const callerUserId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    const db = await getDatabase();

    if (callerUserId) {
      const auth = await checkDealPermission(db, rawEntityId, callerUserId, 'editDealFlow');
      if (!auth.allowed) {
        return NextResponse.json({ success: false, message: 'Forbidden: editDealFlow permission required.' }, { status: 403 });
      }
    }

    const body = await req.json();
    const dealData: Partial<InvestorDeal> = body?.deal || body;

    const dealsCol = db.collection('investor_deals');
    const nowIso = new Date().toISOString();
    const dealId = dealData.id || `deal_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;

    const newDeal = {
      ...dealData,
      id: dealId,
      organizationId: rawEntityId,
      dealStage: dealData.dealStage || 'new',
      notes: dealData.notes || [],
      tags: dealData.tags || ['Inbound'],
      createdAt: nowIso,
      updatedAt: nowIso,
      lastActivityDate: 'Just now',
      createdByUserId: callerUserId || undefined,
    };
    delete (newDeal as any)._id;

    await dealsCol.insertOne(newDeal);

    return NextResponse.json({
      success: true,
      message: 'Deal created and added to pipeline.',
      data: newDeal,
    });
  } catch (error: any) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error creating deal' }, { status: 500 });
  }
}

/**
 * PUT /api/investors/organizations/[entityId]/deals
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
    const body = await req.json();
    const { dealId, updates, note, stage, termSheet, assignedMemberId, assignedMemberName } = body;

    const targetDealId = dealId || updates?.id;
    if (!targetDealId) {
      return NextResponse.json({ success: false, message: 'Deal ID is required for update' }, { status: 400 });
    }

    const dealsCol = db.collection('investor_deals');
    const existing = await dealsCol.findOne({ id: targetDealId, organizationId: rawEntityId });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Deal not found in organization pipeline' }, { status: 404 });
    }

    // RBAC: If creating/issuing term sheet or moving to invested/passed, requires createInvestmentDecision
    const isDecision = stage === 'invested' || stage === 'passed' || termSheet?.status === 'offered';
    const reqPerm = isDecision ? 'createInvestmentDecision' : 'editDealFlow';

    if (callerUserId) {
      const auth = await checkDealPermission(db, rawEntityId, callerUserId, reqPerm);
      if (!auth.allowed) {
        return NextResponse.json({ success: false, message: `Forbidden: ${reqPerm} permission required.` }, { status: 403 });
      }
    }

    const nowIso = new Date().toISOString();
    const updateFields: any = {
      updatedAt: nowIso,
      lastActivityDate: 'Recently',
    };

    if (stage) updateFields.dealStage = stage;
    if (termSheet) updateFields.termSheet = termSheet;
    if (assignedMemberId !== undefined) updateFields.assignedMemberId = assignedMemberId;
    if (assignedMemberName !== undefined) updateFields.assignedMemberName = assignedMemberName;

    if (updates && typeof updates === 'object') {
      Object.assign(updateFields, updates);
      delete updateFields._id;
      delete updateFields.id;
      delete updateFields.organizationId;
    }

    const updateOps: any = { $set: updateFields };

    if (note && typeof note === 'object' && note.text) {
      updateOps.$push = {
        notes: {
          id: `note_${Date.now()}`,
          authorName: note.authorName || 'Team Member',
          authorRole: note.authorRole || 'Investor',
          text: note.text,
          timestamp: 'Just now',
          createdAt: nowIso,
        },
      };
    }

    await dealsCol.updateOne({ id: targetDealId, organizationId: rawEntityId }, updateOps);

    const updated = await dealsCol.findOne({ id: targetDealId, organizationId: rawEntityId });
    delete (updated as any)._id;

    return NextResponse.json({
      success: true,
      message: 'Deal updated successfully.',
      data: updated,
    });
  } catch (error: any) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error updating deal' }, { status: 500 });
  }
}
