import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { extractAuthToken, verifyJwtToken } from '@/lib/serverAuth';

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

    // Cryptographically verified session identity
    let verifiedUserId: string | null = null;
    const token = extractAuthToken(req);
    if (token) {
      const payload = verifyJwtToken(token);
      if (payload?.sub && payload.type !== 'refresh') {
        verifiedUserId = payload.sub;
      }
    }

    // Check authorization
    let isAuthorizedMember = false;
    let hasApprovedDiligence = false;

    if (verifiedUserId) {
      const isHead =
        entity.createdByUserId === verifiedUserId ||
        entity.currentOwnerUserId === verifiedUserId ||
        entity.primaryOwnerId === verifiedUserId;

      if (isHead) {
        isAuthorizedMember = true;
      } else {
        const mem = await membershipsCol.findOne({
          entityId,
          userId: verifiedUserId,
        });
        if (mem) {
          const status = String(mem.status || '').toUpperCase().trim();
          if (status === 'ACTIVE' || status === 'APPROVED') {
            const role = String(mem.role || '').toUpperCase().trim();
            const perms: string[] = (mem.permissions || []).map((p: string) => String(p).toUpperCase().trim());

            if (role === 'FOUNDER' || role === 'HEAD' || perms.includes('OWNER')) {
              isAuthorizedMember = true;
            } else if (role === 'FINANCE' || role === 'FINANCE LEAD' || perms.includes('MANAGE_FINANCE')) {
              isAuthorizedMember = true;
            }
            // Admin without MANAGE_FINANCE and Viewers remain false
          }
        }
      }

      if (!isAuthorizedMember) {
        const ddReq = await diligenceCol.findOne({
          entityId,
          requesterId: verifiedUserId,
          status: { $in: ['Approved', 'APPROVED'] },
        });
        if (ddReq && !ddReq.isRevoked && ddReq.status !== 'REVOKED') {
          // Check expiration
          const nowIso = new Date().toISOString();
          const expiry = ddReq.expiryDate || ddReq.validUntil;
          const isExpired = expiry && String(expiry).toLowerCase() !== 'never' && String(expiry) < nowIso;
          if (!isExpired) {
            const grantedFolders = (ddReq.grantedFolders || []).map((f: string) => String(f).toUpperCase().trim());
            if (grantedFolders.includes('FINANCIAL') || grantedFolders.includes('ALL')) {
              hasApprovedDiligence = true;
            }
          }
        }
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

    // Cryptographically verified session identity
    const token = extractAuthToken(req);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Missing session credentials.' },
        { status: 401 }
      );
    }
    const payload = verifyJwtToken(token);
    if (!payload?.sub || payload.type === 'refresh') {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired session credentials.' },
        { status: 401 }
      );
    }
    const verifiedUserId = payload.sub;

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const financialsCol = db.collection('startup_financials');
    const membershipsCol = db.collection('memberships');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    // RBAC: Verify Owner or Finance capability
    const isDirectOwner =
      entity.createdByUserId === verifiedUserId ||
      entity.currentOwnerUserId === verifiedUserId ||
      entity.primaryOwnerId === verifiedUserId;

    let isAuthorized = isDirectOwner;

    if (!isAuthorized) {
      const mem = await membershipsCol.findOne({
        entityId,
        userId: verifiedUserId,
      });
      if (mem) {
        const status = String(mem.status || '').toUpperCase().trim();
        if (status === 'ACTIVE' || status === 'APPROVED') {
          const role = String(mem.role || '').toUpperCase().trim();
          const perms: string[] = (mem.permissions || []).map((p: string) => String(p).toUpperCase().trim());

          if (role === 'FOUNDER' || role === 'HEAD' || perms.includes('OWNER')) {
            isAuthorized = true;
          } else if (role === 'FINANCE' || role === 'FINANCE LEAD' || perms.includes('MANAGE_FINANCE')) {
            isAuthorized = true;
          }
          // Admin without MANAGE_FINANCE and Viewers are strictly NOT authorized
        }
      }
    }

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized: Finance management permissions required' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
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
