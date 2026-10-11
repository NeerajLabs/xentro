import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/startups/[entityId]/financials
 * Retrieves authoritative financial records and cap table from startup_financials.
 * Enforces per-metric visibility and RBAC.
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
    const financialsCol = db.collection('startup_financials');
    const membershipsCol = db.collection('memberships');
    const diligenceCol = db.collection('diligence_access_requests');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';

    // Check authorization
    let isAuthorizedMember = false;
    let hasApprovedDiligence = false;

    if (userId) {
      if (
        entity.createdByUserId === userId ||
        entity.currentOwnerUserId === userId ||
        entity.primaryOwnerId === userId
      ) {
        isAuthorizedMember = true;
      } else {
        const mem = await membershipsCol.findOne({
          entityId,
          userId,
          status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
        });
        if (mem) isAuthorizedMember = true;
      }

      if (!isAuthorizedMember) {
        const ddReq = await diligenceCol.findOne({
          entityId,
          requesterId: userId,
          status: 'Approved',
        });
        if (ddReq) hasApprovedDiligence = true;
      }
    }

    let records: any = await financialsCol.findOne({ entityId });
    if (!records) {
      // Return initial structured empty state
      records = {
        entityId,
        revenueCurrentMonth: '₹0',
        expensesCurrentMonth: '₹0',
        burnRateMonthly: '₹0',
        cashAvailable: '₹0',
        runwayMonths: 0,
        mrr: '₹0',
        arr: '₹0',
        growthPct: '0%',
        totalFundingRaised: '₹0',
        currentValuation: '₹0',
        visibility: {
          revenue: 'Private',
          burn: 'Private',
          cash: 'Private',
          runway: 'Private',
          funding: 'Private',
        },
        fundingHistory: [],
        capTable: [],
        monthlyPerformance: [],
        quarterlyPerformance: [],
        forecasts: [],
        updatedAt: new Date().toISOString(),
      };
    } else {
      delete (records as any)._id;
    }

    // Apply visibility filtering for unauthorized public visitors
    if (!isAuthorizedMember && !hasApprovedDiligence) {
      const vis = records.visibility || {};
      const sanitized: any = {
        entityId,
        visibility: vis,
        fundingHistory: vis.funding === 'Public' ? records.fundingHistory : [],
        totalFundingRaised: vis.funding === 'Public' ? records.totalFundingRaised : 'Confidential',
      };

      if (vis.revenue === 'Public') {
        sanitized.revenueCurrentMonth = records.revenueCurrentMonth;
        sanitized.mrr = records.mrr;
        sanitized.arr = records.arr;
        sanitized.growthPct = records.growthPct;
      } else {
        sanitized.revenueCurrentMonth = 'Confidential';
        sanitized.mrr = 'Confidential';
        sanitized.arr = 'Confidential';
      }

      if (vis.burn === 'Public') sanitized.burnRateMonthly = records.burnRateMonthly;
      if (vis.cash === 'Public') sanitized.cashAvailable = records.cashAvailable;
      if (vis.runway === 'Public') sanitized.runwayMonths = records.runwayMonths;

      // Cap table and granular monthly P&L are never public
      sanitized.capTable = [];
      sanitized.monthlyPerformance = [];
      sanitized.quarterlyPerformance = [];

      return NextResponse.json({
        success: true,
        data: sanitized,
        meta: { isAuthorized: false, requiresDiligenceUnlock: true },
      });
    }

    return NextResponse.json({
      success: true,
      data: records,
      meta: { isAuthorized: true, isOwner: isAuthorizedMember },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error fetching financials' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/startups/[entityId]/financials
 * Persists financial updates, Cap Table, and visibility settings in startup_financials.
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
    const userId = req.headers.get('x-user-id') || body.userId || '';

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const financialsCol = db.collection('startup_financials');
    const membershipsCol = db.collection('memberships');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    // RBAC: Verify Owner or Finance Lead
    const isDirectOwner =
      entity.createdByUserId === userId ||
      entity.currentOwnerUserId === userId ||
      entity.primaryOwnerId === userId;

    let isAuthorized = isDirectOwner;

    if (!isAuthorized && userId) {
      const mem = await membershipsCol.findOne({
        entityId,
        userId,
        status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
      });
      if (mem) {
        const perms: string[] = mem.permissions || [];
        isAuthorized =
          perms.includes('OWNER') ||
          perms.includes('ADMIN') ||
          perms.includes('MANAGE_FINANCE') ||
          mem.role === 'Finance' ||
          mem.role === 'Finance Lead';
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Finance management permissions required' },
        { status: 403 }
      );
    }

    const nowIso = new Date().toISOString();
    const updateFields: any = {
      entityId,
      updatedAt: nowIso,
    };

    if (body.revenueCurrentMonth !== undefined) updateFields.revenueCurrentMonth = body.revenueCurrentMonth;
    if (body.expensesCurrentMonth !== undefined) updateFields.expensesCurrentMonth = body.expensesCurrentMonth;
    if (body.burnRateMonthly !== undefined) updateFields.burnRateMonthly = body.burnRateMonthly;
    if (body.cashAvailable !== undefined) updateFields.cashAvailable = body.cashAvailable;
    if (body.runwayMonths !== undefined) updateFields.runwayMonths = Number(body.runwayMonths) || 0;
    if (body.mrr !== undefined) updateFields.mrr = body.mrr;
    if (body.arr !== undefined) updateFields.arr = body.arr;
    if (body.growthPct !== undefined) updateFields.growthPct = body.growthPct;
    if (body.totalFundingRaised !== undefined) updateFields.totalFundingRaised = body.totalFundingRaised;
    if (body.currentValuation !== undefined) updateFields.currentValuation = body.currentValuation;
    if (body.visibility !== undefined) updateFields.visibility = body.visibility;
    if (body.fundingHistory !== undefined) updateFields.fundingHistory = body.fundingHistory;
    if (body.capTable !== undefined) updateFields.capTable = body.capTable;
    if (body.monthlyPerformance !== undefined) updateFields.monthlyPerformance = body.monthlyPerformance;
    if (body.quarterlyPerformance !== undefined) updateFields.quarterlyPerformance = body.quarterlyPerformance;
    if (body.forecasts !== undefined) updateFields.forecasts = body.forecasts;

    await financialsCol.updateOne(
      { entityId },
      { $set: updateFields },
      { upsert: true }
    );

    const updated = await financialsCol.findOne({ entityId });
    if (updated) delete (updated as any)._id;

    return NextResponse.json({
      success: true,
      message: 'Financial records saved successfully',
      data: updated,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error saving financials' },
      { status: 500 }
    );
  }
}
