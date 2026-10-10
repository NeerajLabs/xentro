import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }
  return cachedClient;
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    const email = req.headers.get('x-user-email') || req.nextUrl.searchParams.get('email') || '';

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to retrieve eligible personas' },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    const query: any[] = [];
    if (userId) query.push({ id: userId }, { _id: userId }, { xentroId: userId });
    if (email) query.push({ email: { $regex: `^${email.trim()}$`, $options: 'i' } });

    const user = await usersCol.findOne({ $or: query });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const personalRoleRaw = (user.accountType || user.primaryRole || user.baseRole || 'Explorer').trim();
    const normalizedPersonalRole =
      personalRoleRaw.toLowerCase().includes('mentor')
        ? 'Mentor'
        : personalRoleRaw.toLowerCase().includes('investor')
        ? 'Individual Investor'
        : 'Explorer';

    const personalDestination =
      normalizedPersonalRole === 'Explorer'
        ? 'feed'
        : normalizedPersonalRole === 'Mentor'
        ? 'dashboard'
        : 'dashboard';

    const personalAccount = {
      userId: user.id,
      name: user.fullName || user.name || 'Personal Account',
      email: user.email,
      role: normalizedPersonalRole,
      accountType: normalizedPersonalRole,
      destination: personalDestination,
      avatar: user.personalProfile?.avatarUrl || user.personalProfile?.photoUrl || user.avatar || null,
      isPersonal: true,
    };

    // Query authoritative memberships from MongoDB
    const userMemberships = await membershipsCol
      .find({
        userId: user.id,
        status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
      })
      .toArray();

    const entityIds = userMemberships.map((m) => m.entityId);
    const entitiesDocs = await entitiesCol
      .find({
        id: { $in: entityIds },
        status: { $nin: ['ORPHANED_DELETED', 'DELETED', 'ARCHIVED'] },
        isActive: { $ne: false },
        is_deleted: { $ne: true },
        deleted: { $ne: true },
      })
      .toArray();

    const entityMap = new Map<string, any>();
    entitiesDocs.forEach((e) => entityMap.set(e.id, e));

    const eligibleEntities: any[] = [];

    for (const mem of userMemberships) {
      const ent = entityMap.get(mem.entityId);
      if (!ent) continue; // Skip deleted/suspended entities

      const entType = (ent.entityType || mem.entityType || 'STARTUP').toUpperCase();

      // Rule: Mentor accounts must not access Investor Organizations
      if (normalizedPersonalRole === 'Mentor' && (entType === 'INVESTOR_ORG' || entType === 'INVESTOR')) {
        continue;
      }

      // Format canonical entity type
      let canonicalType: 'Startup' | 'Investor Organization' | 'ESP' | 'Institution' = 'Startup';
      if (entType.includes('INVESTOR') || entType.includes('VC')) {
        canonicalType = 'Investor Organization';
      } else if (entType.includes('ESP') || entType.includes('INCUBATOR')) {
        canonicalType = 'ESP';
      } else if (entType.includes('INSTITUT')) {
        canonicalType = 'Institution';
      }

      eligibleEntities.push({
        entityId: ent.id,
        name: ent.name || mem.entityName,
        entityType: canonicalType,
        rawEntityType: entType,
        role: mem.role || 'Member',
        membershipStatus: mem.status || 'ACTIVE',
        logo: ent.logo || ent.avatar || ent.icon || null,
        sector: ent.details?.sector || ent.industry || '',
        stage: ent.details?.stage || ent.stage || '',
        permissions: mem.permissions || ['VIEW_ONLY'],
        dashboardUrl: canonicalType === 'Startup' ? '/?tab=dashboard' : `/${canonicalType.toLowerCase().replace(/\s+/g, '-')}/dashboard`,
        profileUrl: '/?tab=profile',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        personalAccount,
        eligibleEntities,
        eligibleCount: eligibleEntities.length,
        userId: user.id,
      },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error retrieving eligible personas' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.headers.get('x-user-id') || body.userId || '';
    const userEmail = req.headers.get('x-user-email') || body.userEmail || '';
    const targetContext = String(body.targetContext || (body.targetEntityId ? 'ENTITY' : 'PERSONAL')).toUpperCase();
    const targetEntityId = body.targetEntityId ? String(body.targetEntityId).trim() : null;

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to switch persona' },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');
    const auditCol = db.collection('audit_logs');

    const query: any[] = [];
    if (userId) query.push({ id: userId }, { _id: userId }, { xentroId: userId });
    if (userEmail) query.push({ email: { $regex: `^${userEmail.trim()}$`, $options: 'i' } });

    const user = await usersCol.findOne({ $or: query });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    if (user.isActive === false || user.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, message: 'Personal account is suspended' },
        { status: 403 }
      );
    }

    const personalRoleRaw = (user.accountType || user.primaryRole || user.baseRole || 'Explorer').trim();
    const normalizedPersonalRole =
      personalRoleRaw.toLowerCase().includes('mentor')
        ? 'Mentor'
        : personalRoleRaw.toLowerCase().includes('investor')
        ? 'Individual Investor'
        : 'Explorer';

    const nowIso = new Date().toISOString();

    // =========================================================================
    // CASE A: Switch back to Personal Account
    // =========================================================================
    if (targetContext === 'PERSONAL' || !targetEntityId) {
      const personalDestination =
        normalizedPersonalRole === 'Explorer'
          ? 'feed'
          : normalizedPersonalRole === 'Mentor'
          ? 'dashboard'
          : 'dashboard';

      // Audit log entry
      try {
        await auditCol.insertOne({
          id: `AUD-${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          eventType: 'PERSONA_SWITCH',
          userId: user.id,
          userEmail: user.email,
          switchedTo: {
            contextType: 'PERSONAL',
            role: normalizedPersonalRole,
            destination: personalDestination,
          },
          timestamp: nowIso,
        });
      } catch (_) {}

      return NextResponse.json({
        success: true,
        message: `Switched to Personal Account: ${user.fullName || 'Personal'} (${normalizedPersonalRole})`,
        data: {
          contextType: 'PERSONAL',
          personalRole: normalizedPersonalRole,
          destinationTab: personalDestination,
          user: {
            id: user.id,
            name: user.fullName,
            email: user.email,
            role: normalizedPersonalRole,
          },
        },
      });
    }

    // =========================================================================
    // CASE B: Switch to Authorized Entity Workspace
    // =========================================================================
    // Check 1 & 2: Authoritative membership record in MongoDB
    const membership = await membershipsCol.findOne({
      userId: user.id,
      entityId: targetEntityId,
    });

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          message: `Access denied. You do not hold an authorized membership in organization "${targetEntityId}".`,
        },
        { status: 403 }
      );
    }

    // Check 3: Membership status must be ACTIVE or APPROVED
    const memStatus = String(membership.status || '').toUpperCase();
    if (memStatus === 'SUSPENDED' || memStatus === 'REVOKED' || memStatus === 'EXPIRED') {
      return NextResponse.json(
        {
          success: false,
          message: `Your membership in organization "${targetEntityId}" is ${memStatus.toLowerCase()}. Access denied.`,
        },
        { status: 403 }
      );
    }
    if (!['ACTIVE', 'APPROVED'].includes(memStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Membership in organization "${targetEntityId}" is pending verification or inactive.`,
        },
        { status: 403 }
      );
    }

    // Check 4 & 5: Valid entity record in MongoDB
    const entity = await entitiesCol.findOne({
      id: targetEntityId,
    });

    if (!entity) {
      return NextResponse.json(
        { success: false, message: 'Entity account not found' },
        { status: 404 }
      );
    }

    if (
      entity.is_deleted === true ||
      entity.deleted === true ||
      entity.status === 'ORPHANED_DELETED' ||
      entity.status === 'DELETED' ||
      entity.isActive === false
    ) {
      return NextResponse.json(
        { success: false, message: 'This organization account is deactivated or deleted' },
        { status: 403 }
      );
    }

    const entType = (entity.entityType || membership.entityType || 'STARTUP').toUpperCase();

    // Check 6: Personal Account Eligibility — Mentor accounts must not access Investor Organizations
    if (normalizedPersonalRole === 'Mentor' && (entType === 'INVESTOR_ORG' || entType === 'INVESTOR')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Mentor accounts are strictly prohibited from accessing Investor Organizations.',
        },
        { status: 403 }
      );
    }

    // Check 7 & 8: Assigned organizational RBAC permissions and dashboard
    const permissions: string[] = Array.isArray(membership.permissions) ? membership.permissions : ['VIEW_ONLY'];
    const assignedRole = membership.role || 'Member';

    let canonicalType: 'Startup' | 'Investor Organization' | 'ESP' | 'Institution' = 'Startup';
    if (entType.includes('INVESTOR') || entType.includes('VC')) {
      canonicalType = 'Investor Organization';
    } else if (entType.includes('ESP') || entType.includes('INCUBATOR')) {
      canonicalType = 'ESP';
    } else if (entType.includes('INSTITUT')) {
      canonicalType = 'Institution';
    }

    const dashboardDestination =
      canonicalType === 'Startup'
        ? '/?tab=dashboard'
        : `/${canonicalType.toLowerCase().replace(/\s+/g, '-')}/dashboard`;

    // Audit log entry for authoritative tracking
    try {
      await auditCol.insertOne({
        id: `AUD-${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        eventType: 'PERSONA_SWITCH',
        userId: user.id,
        userEmail: user.email,
        switchedTo: {
          contextType: 'ENTITY',
          entityId: entity.id,
          entityName: entity.name,
          entityType: canonicalType,
          role: assignedRole,
          permissions,
        },
        timestamp: nowIso,
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: `Switched to ${entity.name} (${canonicalType}) workspace`,
      data: {
        contextType: 'ENTITY',
        entity: {
          id: entity.id,
          name: entity.name,
          entityType: canonicalType,
          rawEntityType: entType,
          role: assignedRole,
          permissions,
          status: membership.status,
          logo: entity.logo || entity.avatar || entity.icon || null,
          sector: entity.details?.sector || entity.industry || '',
          stage: entity.details?.stage || entity.stage || '',
          officialEmail: entity.officialEmail,
          dashboardUrl: dashboardDestination,
          profileUrl: '/?tab=profile',
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error during persona switch' },
      { status: 500 }
    );
  }
}
