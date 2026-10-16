import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { extractAuthToken, verifyJwtToken } from '@/lib/serverAuth';
import { ROLE_PERMISSION_PRESETS } from '@/lib/investorOrganizationService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const WATCHLIST_CAPACITIES = {
  personal: 10,
  organization: 30,
} as const;

export type WatchlistOwnerType = 'personal' | 'organization';

export interface WatchlistStartupItem {
  startupId: string;
  name: string;
  logo?: string;
  tagline?: string;
  founder?: string;
  location?: string;
  sector?: string;
  stage?: string;
  askingRound?: string;
  valuation?: string;
  tractionMRR?: string;
  matchScore?: number;
  tags?: string[];
  addedAt: string;
  addedByUserId?: string;
}

export interface WatchlistDocument {
  id: string;
  ownerType: WatchlistOwnerType;
  ownerId: string;
  capacityLimit: number;
  activeCount: number;
  startups: WatchlistStartupItem[];
  createdAt: string;
  updatedAt: string;
}

interface CallerAuth {
  userId: string;
  userEmail?: string;
  token: string;
}

/**
 * Resolves authenticated identity from request headers or session cookies.
 * Zero trust in client-supplied user parameters.
 */
function resolveCallerAuth(req: NextRequest): { auth: CallerAuth | null; error?: NextResponse } {
  const token = extractAuthToken(req);
  if (!token) {
    return {
      auth: null,
      error: NextResponse.json(
        { success: false, message: 'Authentication required. Missing session credentials.' },
        { status: 401 }
      ),
    };
  }

  const payload = verifyJwtToken(token);
  if (!payload || !payload.sub) {
    return {
      auth: null,
      error: NextResponse.json(
        { success: false, message: 'Invalid or expired session credentials. Please sign in again.' },
        { status: 401 }
      ),
    };
  }

  return {
    auth: {
      userId: String(payload.sub),
      userEmail: payload.email,
      token,
    },
  };
}

interface WatchlistAuthorizationResult {
  authorized: boolean;
  effectiveOwnerId: string;
  effectiveOwnerType: WatchlistOwnerType;
  limit: number;
  role?: string;
  error?: NextResponse;
}

/**
 * Server-enforces ownership and tenant-isolated RBAC rules:
 * - Personal: Derived strictly from authenticated session token (sub). Cross-tenant forgery rejected.
 * - Organization: Verifies entity existence, caller's active membership (or Head status),
 *   rejects suspended members, and validates required RBAC capability (viewDealFlow for read, editDealFlow for write).
 */
async function authorizeWatchlistAccess(
  db: any,
  auth: CallerAuth,
  requestedOwnerType: WatchlistOwnerType,
  requestedOwnerId: string | null | undefined,
  isMutation: boolean = false
): Promise<WatchlistAuthorizationResult> {
  const callerUserId = auth.userId;

  // -----------------------------------------------------------------
  // 1. PERSONAL WATCHLIST (Limit: 10 startups)
  // -----------------------------------------------------------------
  if (requestedOwnerType === 'personal') {
    const effectiveOwnerId = callerUserId;

    // Detect and reject client forgery attempts trying to target other users' personal watchlists
    if (requestedOwnerId && requestedOwnerId !== callerUserId) {
      return {
        authorized: false,
        effectiveOwnerId,
        effectiveOwnerType: 'personal',
        limit: WATCHLIST_CAPACITIES.personal,
        error: NextResponse.json(
          {
            success: false,
            message: 'Cross-tenant access forbidden. Personal watchlist ownership is server-derived and cannot target another user.',
          },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      effectiveOwnerId,
      effectiveOwnerType: 'personal',
      limit: WATCHLIST_CAPACITIES.personal,
    };
  }

  // -----------------------------------------------------------------
  // 2. INVESTMENT ORGANIZATION WATCHLIST (Limit: 30 startups)
  // -----------------------------------------------------------------
  if (requestedOwnerType === 'organization') {
    if (!requestedOwnerId) {
      return {
        authorized: false,
        effectiveOwnerId: '',
        effectiveOwnerType: 'organization',
        limit: WATCHLIST_CAPACITIES.organization,
        error: NextResponse.json(
          { success: false, message: 'Organization entityId (ownerId) is required.' },
          { status: 400 }
        ),
      };
    }

    const entityId = requestedOwnerId.trim();

    // Verify entity existence
    const entitiesCol = db.collection('entities');
    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return {
        authorized: false,
        effectiveOwnerId: entityId,
        effectiveOwnerType: 'organization',
        limit: WATCHLIST_CAPACITIES.organization,
        error: NextResponse.json(
          { success: false, message: `Investment organization '${entityId}' not found.` },
          { status: 404 }
        ),
      };
    }

    // Check if caller is Entity Head / Governing Owner
    const isHead =
      entity.createdByUserId === callerUserId ||
      entity.currentOwnerUserId === callerUserId ||
      entity.primaryOwnerId === callerUserId;

    let role = isHead ? 'Owner/Managing Partner' : '';
    let isSuspended = false;

    // Check membership in organization
    const membershipsCol = db.collection('memberships');
    const membership = await membershipsCol.findOne({
      entityId,
      userId: callerUserId,
    });

    if (membership) {
      const status = (membership.status || '').toUpperCase();
      if (status === 'SUSPENDED') {
        isSuspended = true;
      }
      if (!role) {
        role = membership.role || 'Viewer';
      }
    }

    if (isSuspended) {
      return {
        authorized: false,
        effectiveOwnerId: entityId,
        effectiveOwnerType: 'organization',
        limit: WATCHLIST_CAPACITIES.organization,
        error: NextResponse.json(
          { success: false, message: 'Access denied: Your membership in this investment organization is suspended.' },
          { status: 403 }
        ),
      };
    }

    // Must be either governing Head or have active membership
    if (!isHead && (!membership || !['ACTIVE', 'APPROVED', 'Active'].includes(membership.status))) {
      return {
        authorized: false,
        effectiveOwnerId: entityId,
        effectiveOwnerType: 'organization',
        limit: WATCHLIST_CAPACITIES.organization,
        error: NextResponse.json(
          { success: false, message: 'Access denied: Active membership in this investment organization is required.' },
          { status: 403 }
        ),
      };
    }

    // Role-based capability check using canonical ROLE_PERMISSION_PRESETS
    const preset = (ROLE_PERMISSION_PRESETS as any)[role] || { viewDealFlow: false, editDealFlow: false };

    if (isMutation) {
      // Mutations (ADD, REMOVE, RECONCILE) require editDealFlow capability (or Head)
      if (!isHead && !preset.editDealFlow) {
        return {
          authorized: false,
          effectiveOwnerId: entityId,
          effectiveOwnerType: 'organization',
          limit: WATCHLIST_CAPACITIES.organization,
          role,
          error: NextResponse.json(
            {
              success: false,
              message: `Access denied: Role '${role}' is not authorized to modify the organization watchlist. Requires editDealFlow capability.`,
            },
            { status: 403 }
          ),
        };
      }
    } else {
      // Reading requires viewDealFlow capability (or Head)
      if (!isHead && !preset.viewDealFlow) {
        return {
          authorized: false,
          effectiveOwnerId: entityId,
          effectiveOwnerType: 'organization',
          limit: WATCHLIST_CAPACITIES.organization,
          role,
          error: NextResponse.json(
            {
              success: false,
              message: `Access denied: Role '${role}' is not authorized to view the organization watchlist.`,
            },
            { status: 403 }
          ),
        };
      }
    }

    return {
      authorized: true,
      effectiveOwnerId: entityId,
      effectiveOwnerType: 'organization',
      limit: WATCHLIST_CAPACITIES.organization,
      role,
    };
  }

  return {
    authorized: false,
    effectiveOwnerId: '',
    effectiveOwnerType: 'personal',
    limit: WATCHLIST_CAPACITIES.personal,
    error: NextResponse.json(
      { success: false, message: `Invalid ownerType '${requestedOwnerType}'. Must be 'personal' or 'organization'.` },
      { status: 400 }
    ),
  };
}

/**
 * GET /api/investor/watchlist?ownerType=personal|organization&ownerId=<id>
 * Fetches authoritative watchlist with server-enforced identity and RBAC.
 */
export async function GET(req: NextRequest) {
  try {
    const { auth, error: authErr } = resolveCallerAuth(req);
    if (authErr || !auth) {
      return authErr!;
    }

    const requestedOwnerType = (req.nextUrl.searchParams.get('ownerType') || 'personal') as WatchlistOwnerType;
    const requestedOwnerId = req.nextUrl.searchParams.get('ownerId');

    const db = await getDatabase();
    const authz = await authorizeWatchlistAccess(db, auth, requestedOwnerType, requestedOwnerId, false);
    if (!authz.authorized) {
      return authz.error!;
    }

    const { effectiveOwnerType, effectiveOwnerId, limit } = authz;
    const col = db.collection('investor_watchlists');

    let doc: any = await col.findOne({ ownerType: effectiveOwnerType, ownerId: effectiveOwnerId });
    if (!doc) {
      const now = new Date().toISOString();
      const newDoc = {
        id: `wl_${effectiveOwnerType}_${effectiveOwnerId}`,
        ownerType: effectiveOwnerType,
        ownerId: effectiveOwnerId,
        capacityLimit: limit,
        activeCount: 0,
        startups: [],
        createdAt: now,
        updatedAt: now,
      };
      await col.updateOne(
        { ownerType: effectiveOwnerType, ownerId: effectiveOwnerId },
        { $setOnInsert: newDoc },
        { upsert: true }
      );
      doc = newDoc;
    }

    const startups: WatchlistStartupItem[] = doc?.startups || [];
    const activeCount = startups.length;
    const remainingSlots = Math.max(0, limit - activeCount);
    const isAtCapacity = activeCount >= limit;

    return NextResponse.json({
      success: true,
      data: {
        id: doc.id || `wl_${effectiveOwnerType}_${effectiveOwnerId}`,
        ownerType: effectiveOwnerType,
        ownerId: effectiveOwnerId,
        capacityLimit: limit,
        activeCount,
        remainingSlots,
        isAtCapacity,
        startups,
      },
    });
  } catch (err: any) {
    console.error('[Investor Watchlist GET Error]:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/**
 * POST /api/investor/watchlist
 * Operations: ADD, REMOVE, RECONCILE
 * Enforces server-derived identity, atomic capacity, duplicate prevention, and RBAC mutation permissions.
 */
export async function POST(req: NextRequest) {
  try {
    const { auth, error: authErr } = resolveCallerAuth(req);
    if (authErr || !auth) {
      return authErr!;
    }

    const body = await req.json();
    const action = (body.action || '').toUpperCase();
    const requestedOwnerType = (body.ownerType || 'personal') as WatchlistOwnerType;
    const requestedOwnerId = body.ownerId;

    const db = await getDatabase();
    const authz = await authorizeWatchlistAccess(db, auth, requestedOwnerType, requestedOwnerId, true);
    if (!authz.authorized) {
      return authz.error!;
    }

    const { effectiveOwnerType, effectiveOwnerId, limit } = authz;
    const col = db.collection('investor_watchlists');
    const now = new Date().toISOString();

    // Ensure document exists
    await col.updateOne(
      { ownerType: effectiveOwnerType, ownerId: effectiveOwnerId },
      {
        $setOnInsert: {
          id: `wl_${effectiveOwnerType}_${effectiveOwnerId}`,
          ownerType: effectiveOwnerType,
          ownerId: effectiveOwnerId,
          capacityLimit: limit,
          activeCount: 0,
          startups: [],
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true }
    );

    // =========================================================================
    // 1. ADD STARTUP TO WATCHLIST (Atomic capacity enforcement)
    // =========================================================================
    if (action === 'ADD') {
      const startup = body.startup;
      if (!startup || !startup.startupId) {
        return NextResponse.json(
          { success: false, message: 'startup object with valid startupId is required.' },
          { status: 400 }
        );
      }

      // Check if already in watchlist (duplicate prevention)
      const existing = await col.findOne({
        ownerType: effectiveOwnerType,
        ownerId: effectiveOwnerId,
        'startups.startupId': startup.startupId,
      });

      if (existing) {
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          message: 'Startup is already in your Watchlist.',
          data: {
            ownerType: effectiveOwnerType,
            ownerId: effectiveOwnerId,
            capacityLimit: limit,
            activeCount: existing.startups?.length || 0,
            remainingSlots: Math.max(0, limit - (existing.startups?.length || 0)),
            isAtCapacity: (existing.startups?.length || 0) >= limit,
            startups: existing.startups || [],
          },
        });
      }

      const itemToInsert: WatchlistStartupItem = {
        startupId: startup.startupId,
        name: startup.name || 'Venture',
        logo: startup.logo || '/xentro-logo.png',
        tagline: startup.tagline || startup.description || 'Verified venture in Xentro Ecosystem',
        founder: startup.founder || 'Founding Team',
        location: startup.location || 'India',
        sector: startup.sector || 'Technology',
        stage: startup.stage || 'Seed',
        askingRound: startup.askingRound || '$1M',
        valuation: startup.valuation || '$8M',
        tractionMRR: startup.tractionMRR || '$20k MRR',
        matchScore: startup.matchScore || 85,
        tags: Array.isArray(startup.tags) ? startup.tags : ['Growth'],
        addedAt: now,
        addedByUserId: auth.userId, // Authenticated server-derived user ID
      };

      // Atomic insertion conditioned strictly on $size < limit
      const updated = await col.findOneAndUpdate(
        {
          ownerType: effectiveOwnerType,
          ownerId: effectiveOwnerId,
          $expr: { $lt: [{ $size: '$startups' }, limit] },
        },
        {
          $push: { startups: itemToInsert } as any,
          $set: { updatedAt: now },
        },
        { returnDocument: 'after' }
      );

      if (!updated) {
        // Capacity limit was reached (concurrency safe)
        const currentDoc = await col.findOne({ ownerType: effectiveOwnerType, ownerId: effectiveOwnerId });
        const currentCount = currentDoc?.startups?.length || limit;
        return NextResponse.json(
          {
            success: false,
            isAtCapacity: true,
            capacityLimit: limit,
            activeCount: currentCount,
            message: `Watchlist capacity limit reached (${limit} unique startups maximum for ${
              effectiveOwnerType === 'organization' ? 'Investment Organizations' : 'Individual Investors'
            }). Remove an existing startup before adding a new one.`,
          },
          { status: 400 }
        );
      }

      const currentCount = updated.startups?.length || 0;
      await col.updateOne({ ownerType: effectiveOwnerType, ownerId: effectiveOwnerId }, { $set: { activeCount: currentCount } });

      return NextResponse.json({
        success: true,
        message: `${itemToInsert.name} added to Watchlist!`,
        data: {
          ownerType: effectiveOwnerType,
          ownerId: effectiveOwnerId,
          capacityLimit: limit,
          activeCount: currentCount,
          remainingSlots: Math.max(0, limit - currentCount),
          isAtCapacity: currentCount >= limit,
          startups: updated.startups,
        },
      });
    }

    // =========================================================================
    // 2. REMOVE STARTUP FROM WATCHLIST
    // =========================================================================
    if (action === 'REMOVE') {
      const startupId = body.startupId;
      if (!startupId) {
        return NextResponse.json(
          { success: false, message: 'startupId is required for REMOVE action.' },
          { status: 400 }
        );
      }

      const updated = await col.findOneAndUpdate(
        { ownerType: effectiveOwnerType, ownerId: effectiveOwnerId },
        {
          $pull: { startups: { startupId } } as any,
          $set: { updatedAt: now },
        },
        { returnDocument: 'after' }
      );

      const currentCount = updated?.startups?.length || 0;
      await col.updateOne({ ownerType: effectiveOwnerType, ownerId: effectiveOwnerId }, { $set: { activeCount: currentCount } });

      return NextResponse.json({
        success: true,
        message: 'Startup removed from Watchlist.',
        data: {
          ownerType: effectiveOwnerType,
          ownerId: effectiveOwnerId,
          capacityLimit: limit,
          activeCount: currentCount,
          remainingSlots: Math.max(0, limit - currentCount),
          isAtCapacity: currentCount >= limit,
          startups: updated?.startups || [],
        },
      });
    }

    // =========================================================================
    // 3. RECONCILE / BULK IMPORT (e.g. from local storage cache)
    // =========================================================================
    if (action === 'RECONCILE') {
      const incomingList = Array.isArray(body.startups) ? body.startups : [];
      const currentDoc = await col.findOne({ ownerType: effectiveOwnerType, ownerId: effectiveOwnerId });
      const currentItems: WatchlistStartupItem[] = currentDoc?.startups || [];
      const existingIds = new Set(currentItems.map((i) => i.startupId));

      const merged = [...currentItems];
      for (const item of incomingList) {
        if (!item.startupId && item.id) item.startupId = item.id;
        if (item.startupId && !existingIds.has(item.startupId) && merged.length < limit) {
          merged.push({
            startupId: item.startupId,
            name: item.name || 'Venture',
            logo: item.logo || '/xentro-logo.png',
            tagline: item.tagline || item.description || 'Venture on Xentro',
            founder: item.founder || 'Founding Team',
            location: item.location || 'India',
            sector: item.sector || 'Technology',
            stage: item.stage || 'Seed',
            askingRound: item.askingRound || '$1M',
            valuation: item.valuation || '$8M',
            tractionMRR: item.tractionMRR || '$20k MRR',
            matchScore: item.matchScore || 85,
            tags: item.tags || ['Growth'],
            addedAt: item.addedAt || now,
            addedByUserId: auth.userId,
          });
          existingIds.add(item.startupId);
        }
      }

      await col.updateOne(
        { ownerType: effectiveOwnerType, ownerId: effectiveOwnerId },
        {
          $set: {
            startups: merged,
            activeCount: merged.length,
            updatedAt: now,
          },
        }
      );

      return NextResponse.json({
        success: true,
        message: 'Watchlist reconciled successfully.',
        data: {
          ownerType: effectiveOwnerType,
          ownerId: effectiveOwnerId,
          capacityLimit: limit,
          activeCount: merged.length,
          remainingSlots: Math.max(0, limit - merged.length),
          isAtCapacity: merged.length >= limit,
          startups: merged,
        },
      });
    }

    return NextResponse.json(
      { success: false, message: `Unsupported action '${action}'. Allowed: ADD, REMOVE, RECONCILE.` },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[Investor Watchlist POST Error]:', err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
