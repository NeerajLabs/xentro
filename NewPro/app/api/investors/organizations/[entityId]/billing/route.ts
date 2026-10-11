import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ROLE_PERMISSION_PRESETS } from '@/lib/investorOrganizationService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function checkBillingPermission(
  db: any,
  entityId: string,
  userId: string
): Promise<{ allowed: boolean; role: string }> {
  if (!userId) return { allowed: true, role: 'Owner/Managing Partner' };

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
      return { allowed: true, role: 'Owner/Managing Partner' };
    }
    return { allowed: false, role: '' };
  }

  const role = membership.role || 'Viewer';
  const presets = (ROLE_PERMISSION_PRESETS as any)[role];
  if (presets && presets.manageBilling) {
    return { allowed: true, role };
  }

  return { allowed: false, role };
}

/**
 * GET /api/investors/organizations/[entityId]/billing
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

    if (callerUserId) {
      const auth = await checkBillingPermission(db, rawEntityId, callerUserId);
      if (!auth.allowed) {
        return NextResponse.json({ success: false, message: 'Forbidden: manageBilling permission required.' }, { status: 403 });
      }
    }

    const invOrgCol = db.collection('investment_organizations');
    const org = await invOrgCol.findOne({ $or: [{ entityId: rawEntityId }, { id: rawEntityId }] });

    const subscription = org?.subscription || {
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
    };

    const billingAccount = org?.billingAccount || {
      organizationName: org?.legalName || org?.name || 'Investment Management LLP',
      billingEmail: org?.officialEmail || '',
      gstin: '',
      pan: '',
      taxExempt: false,
      billingAddress: {
        line1: 'Corporate Office',
        city: org?.headquarters?.city || 'Bengaluru',
        state: org?.headquarters?.state || 'Karnataka',
        country: org?.headquarters?.country || 'India',
        postalCode: '560001',
      },
      defaultPaymentMethod: {
        type: 'card',
        last4: '4829',
        brand: 'Visa Business',
      },
    };

    const invoices = org?.invoices || [];

    return NextResponse.json({
      success: true,
      data: {
        subscription,
        billingAccount,
        invoices,
      },
    });
  } catch (error: any) {
    console.error('Error fetching billing data:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error fetching billing data' }, { status: 500 });
  }
}

/**
 * PUT /api/investors/organizations/[entityId]/billing
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

    if (callerUserId) {
      const auth = await checkBillingPermission(db, rawEntityId, callerUserId);
      if (!auth.allowed) {
        return NextResponse.json({ success: false, message: 'Forbidden: manageBilling permission required.' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { billingAccount, subscriptionTier } = body;

    const invOrgCol = db.collection('investment_organizations');
    const updateFields: any = { updatedAt: new Date().toISOString() };

    if (billingAccount) {
      updateFields.billingAccount = billingAccount;
    }

    if (subscriptionTier) {
      updateFields['subscription.tier'] = subscriptionTier;
    }

    await invOrgCol.updateOne(
      { $or: [{ entityId: rawEntityId }, { id: rawEntityId }] },
      { $set: updateFields }
    );

    return NextResponse.json({
      success: true,
      message: 'Billing details updated successfully.',
    });
  } catch (error: any) {
    console.error('Error updating billing details:', error);
    return NextResponse.json({ success: false, message: error?.message || 'Server error updating billing details' }, { status: 500 });
  }
}
