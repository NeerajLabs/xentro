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
        { success: false, message: 'Authentication required to view workspaces' },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');
    const membershipsCol = db.collection('memberships');
    const entitiesCol = db.collection('entities');

    const query: any[] = [];
    if (userId) query.push({ id: userId }, { _id: userId });
    if (email) query.push({ email: { $regex: `^${email.trim()}$`, $options: 'i' } });

    const user = await usersCol.findOne({ $or: query });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const workspaces: any[] = [
      {
        id: 'explorer',
        name: 'Explorer Workspace',
        role: 'Explorer',
        type: 'PERSONAL',
        url: '/',
        isActive: true,
        badge: 'Base Account',
      },
    ];

    const activeRoles: string[] = user.activeRoles || ['Explorer'];
    if (activeRoles.includes('Mentor')) {
      workspaces.push({
        id: 'mentor',
        name: 'Mentor Workspace',
        role: 'Mentor',
        type: 'PERSONAL_ROLE',
        url: '/mentor/dashboard',
        isActive: false,
        badge: 'Approved Role',
      });
    }
    if (activeRoles.includes('Investor') || activeRoles.includes('Individual Investor')) {
      workspaces.push({
        id: 'investor',
        name: 'Individual Investor Workspace',
        role: 'Individual Investor',
        type: 'PERSONAL_ROLE',
        url: '/investor/dashboard',
        isActive: false,
        badge: 'Approved Role',
      });
    }

    // Linked entity memberships
    const userMemberships = await membershipsCol
      .find({
        userId: user.id,
        status: { $in: ['ACTIVE', 'APPROVED'] },
      })
      .toArray();

    for (const mem of userMemberships) {
      const ent = await entitiesCol.findOne({ id: mem.entityId });
      const entName = mem.entityName || ent?.name || 'Entity';
      const entType = mem.entityType || ent?.entityType || 'STARTUP';
      const entUrl = `/${entType.toLowerCase()}/dashboard`;

      workspaces.push({
        id: mem.entityId,
        name: `${entName} (${entType})`,
        role: mem.role || 'Admin',
        type: 'ENTITY',
        entityType: entType,
        url: entUrl,
        isActive: false,
        badge: mem.role || 'Member',
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        workspaces,
        totalCount: workspaces.length,
        userId: user.id,
      },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error retrieving workspaces' },
      { status: 500 }
    );
  }
}
