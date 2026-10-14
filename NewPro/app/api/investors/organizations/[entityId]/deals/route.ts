import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ROLE_PERMISSION_PRESETS } from '@/lib/investorOrganizationService';
import { InvestorDeal } from '@/types/investor';
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

async function checkDealPermission(
  db: any,
  entityId: string,
  userId: string,
  requiredPermission: string = 'viewDealFlow',
  dealDoc?: any
): Promise<{ allowed: boolean; role: string; membership: any; isCommitteeMember: boolean }> {
  if (!userId) return { allowed: false, role: '', membership: null, isCommitteeMember: false };

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

  const isHead = Boolean(entity);
  if (isHead) {
    return { allowed: true, role: 'Owner/Managing Partner', membership: { role: 'Owner/Managing Partner' }, isCommitteeMember: true };
  }

  if (!membership) {
    return { allowed: false, role: '', membership: null, isCommitteeMember: false };
  }

  // Check if caller is specifically appointed to the selection/decision committee for this deal
  let isCommitteeMember = false;
  if (dealDoc) {
    const committee = Array.isArray(dealDoc.committeeMembers)
      ? dealDoc.committeeMembers
      : Array.isArray(dealDoc.decisionCommittee)
      ? dealDoc.decisionCommittee
      : [];
    if (committee.includes(userId) || (membership.id && committee.includes(membership.id))) {
      isCommitteeMember = true;
    }
  }

  const role = membership.role || 'Viewer';
  const presets = (ROLE_PERMISSION_PRESETS as any)[role];

  // Committee members have decision authorization on their appointed resource
  if (isCommitteeMember && requiredPermission === 'createInvestmentDecision') {
    return { allowed: true, role, membership, isCommitteeMember: true };
  }

  if (presets && presets[requiredPermission]) {
    return { allowed: true, role, membership, isCommitteeMember };
  }

  return { allowed: false, role, membership, isCommitteeMember };
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

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const db = await getDatabase();
    const dealsCol = db.collection('investor_deals');

    const auth = await checkDealPermission(db, rawEntityId, callerUserId, 'viewDealFlow');
    if (!auth.allowed) {
      return NextResponse.json({ success: false, message: 'Forbidden: viewDealFlow permission required.' }, { status: 403 });
    }

    let filter: any = { organizationId: rawEntityId };

    // Check assigned scoping mode
    if (auth.membership?.dealAccessMode === 'assigned') {
      filter.$or = [
        { assignedMemberId: callerUserId },
        { assignedMemberId: auth.membership.id },
        { createdByUserId: callerUserId },
        { committeeMembers: callerUserId },
      ];
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
      source: 'mongodb-atlas',
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

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const db = await getDatabase();
    const auth = await checkDealPermission(db, rawEntityId, callerUserId, 'editDealFlow');
    if (!auth.allowed) {
      return NextResponse.json({ success: false, message: 'Forbidden: editDealFlow permission required.' }, { status: 403 });
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
      committeeMembers: Array.isArray((dealData as any).committeeMembers) ? (dealData as any).committeeMembers : [],
      createdAt: nowIso,
      updatedAt: nowIso,
      lastActivityDate: 'Just now',
      createdByUserId: callerUserId,
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

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const db = await getDatabase();
    const body = await req.json();
    const { dealId, updates, note, stage, termSheet, assignedMemberId, assignedMemberName, committeeMembers } = body;

    const targetDealId = dealId || updates?.id;
    if (!targetDealId) {
      return NextResponse.json({ success: false, message: 'Deal ID is required for update' }, { status: 400 });
    }

    const dealsCol = db.collection('investor_deals');
    const existing = await dealsCol.findOne({ id: targetDealId, organizationId: rawEntityId });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Deal not found in organization pipeline' }, { status: 404 });
    }

    // RBAC & Committee Gate:
    // If issuing term sheet or moving to invested/passed, requires createInvestmentDecision OR committee appointment on this deal
    const isDecision = stage === 'invested' || stage === 'passed' || termSheet?.status === 'offered';
    const reqPerm = isDecision ? 'createInvestmentDecision' : 'editDealFlow';

    const auth = await checkDealPermission(db, rawEntityId, callerUserId, reqPerm, existing);
    if (!auth.allowed) {
      return NextResponse.json({
        success: false,
        message: `Forbidden: ${reqPerm} permission or Selection Committee appointment required for this deal decision.`,
      }, { status: 403 });
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
    if (committeeMembers && Array.isArray(committeeMembers)) {
      updateFields.committeeMembers = committeeMembers;
    }

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
