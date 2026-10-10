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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = req.headers.get('x-user-id') || body.userId || '';
    const userEmail = req.headers.get('x-user-email') || body.userEmail || body.email || '';

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to create an entity account' },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');
    const membershipsCol = db.collection('memberships');

    const query: any[] = [];
    if (userId) query.push({ id: userId }, { _id: userId });
    if (userEmail) query.push({ email: { $regex: `^${userEmail.trim()}$`, $options: 'i' } });

    const user = await usersCol.findOne({ $or: query });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const entityTypeRaw = String(body.entityType || body.type || 'STARTUP').toUpperCase();
    const entityName = String(body.name || body.entityName || '').trim();
    const officialEmail = String(body.officialEmail || body.email || '').trim().toLowerCase();

    if (!entityName) {
      return NextResponse.json({ success: false, message: 'Entity name is required' }, { status: 400 });
    }

    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    let entityId = '';
    let canonicalType = 'STARTUP';
    let verificationStatus = 'PENDING';
    let activationStatus = 'ACTIVE';
    let roleInOrg = 'Founder';

    if (entityTypeRaw.includes('STARTUP') || entityTypeRaw.includes('VENTURE')) {
      entityId = `ST-${randomSuffix}`;
      canonicalType = 'STARTUP';
      verificationStatus = 'PENDING';
      activationStatus = 'ACTIVE';
      roleInOrg = 'Founder';
    } else if (entityTypeRaw.includes('INVESTOR') || entityTypeRaw.includes('VC') || entityTypeRaw.includes('FIRM')) {
      entityId = `VCI-${randomSuffix}`;
      canonicalType = 'INVESTOR_ORG';
      verificationStatus = 'PENDING';
      activationStatus = 'PENDING_COMMERCIAL_ACTIVATION';
      roleInOrg = 'Managing Partner';
    } else if (entityTypeRaw.includes('ESP') || entityTypeRaw.includes('INCUBATOR')) {
      entityId = `ES-${randomSuffix}`;
      canonicalType = 'ESP';
      verificationStatus = 'PENDING';
      activationStatus = 'PENDING_ADMIN_APPROVAL';
      roleInOrg = 'Director';
    } else {
      entityId = `INS-${randomSuffix}`;
      canonicalType = 'INSTITUTION';
      verificationStatus = 'PENDING';
      activationStatus = 'PENDING_ADMIN_APPROVAL';
      roleInOrg = 'Dean / Lead';
    }

    const nowIso = new Date().toISOString();

    const entityDoc = {
      id: entityId,
      entityType: canonicalType,
      accountType: canonicalType,
      name: entityName,
      username: `@${entityName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${Math.floor(10 + Math.random() * 90)}`,
      officialEmail: officialEmail || user.email,
      primaryOwnerId: user.id,
      primaryOwnerName: user.fullName,
      verificationStatus,
      activationStatus,
      status: canonicalType === 'STARTUP' ? 'ACTIVE' : 'PENDING',
      visibility: 'PUBLIC',
      details: body.details || {},
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await entitiesCol.insertOne(entityDoc);

    const isPrivilegedOrg = canonicalType === 'INVESTOR_ORG';
    const requestedOrgRole = body.requestedRole || roleInOrg;

    const membershipDoc = {
      id: `MEM-${Date.now().toString().slice(-6)}`,
      entityId,
      entityName,
      entityType: canonicalType,
      userId: user.id,
      userEmail: user.email,
      role: requestedOrgRole,
      permissions: isPrivilegedOrg ? ['VIEW_ONLY'] : ['OWNER', 'ADMIN', 'MANAGE_TEAM'],
      status: isPrivilegedOrg ? 'PENDING_ADMIN_VERIFICATION' : 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await membershipsCol.insertOne(membershipDoc);

    // If privileged Investor Organization role, create specific role verification ticket for Admin Console review
    if (isPrivilegedOrg) {
      try {
        const roleReqCol = db.collection('role_requests');
        await roleReqCol.insertOne({
          id: `REQ-${Date.now().toString().slice(-6)}`,
          requestId: `REQ-${Date.now().toString().slice(-6)}`,
          userId: user.id,
          userEmail: user.email,
          userName: user.fullName || user.name || 'Member',
          currentRole: user.accountType || 'Explorer',
          requestedRole: `Investor Org Privileged Role: ${requestedOrgRole} (${entityName})`,
          reason: `Privileged administrative verification for Investor Organization ${entityName}`,
          entityId,
          entityName,
          status: 'PENDING',
          createdAt: nowIso,
          updatedAt: nowIso,
        });
      } catch (_) {}
    }

    delete (entityDoc as any)._id;
    delete (membershipDoc as any)._id;

    return NextResponse.json(
      {
        success: true,
        message: `${canonicalType.toLowerCase()} account created successfully. Verification is pending.`,
        data: {
          entity: entityDoc,
          membership: membershipDoc,
        },
        source: 'mongodb-atlas',
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error creating entity account' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
    if (!userId) {
      return NextResponse.json({ success: false, message: 'User identification required' }, { status: 400 });
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    const memberships = await membershipsCol.find({ userId }).toArray();
    const entityIds = memberships.map((m) => m.entityId);

    const entities = await entitiesCol.find({ id: { $in: entityIds } }).toArray();

    return NextResponse.json({
      success: true,
      data: {
        memberships,
        entities,
        totalCount: entities.length,
      },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error retrieving entities' },
      { status: 500 }
    );
  }
}
