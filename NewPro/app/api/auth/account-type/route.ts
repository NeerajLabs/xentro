import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backendUrl';
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
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 400 });
  }

  const token =
    req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  const userId = req.headers.get('x-user-id') || body.userId || body.id || '';
  const email = req.headers.get('x-user-email') || body.email || '';
  const rawAccountType = body.accountType || body.role || body.selectedRole || 'Explorer';

  // Normalize account type
  let accountType = 'Explorer';
  const clean = String(rawAccountType).trim().toLowerCase();
  if (clean.includes('startup') || clean.includes('founder')) accountType = 'Startup';
  else if (clean.includes('mentor') || clean.includes('advisor')) accountType = 'Mentor';
  else if (clean.includes('investor') || clean.includes('angel') || clean.includes('vc')) accountType = 'Investor';
  else if (clean.includes('esp') || clean.includes('incubator') || clean.includes('accelerator')) accountType = 'ESP';
  else accountType = 'Explorer';

  // 1. Attempt backend proxy
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;

    const backendUrl = getBackendBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendUrl}/auth/account-type/`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, accountType, userType: accountType }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (res.ok && data?.success) {
      return NextResponse.json(data, { status: res.status });
    }
  } catch (err: any) {
    console.warn('[Account-Type POST] Backend proxy error, falling back to MongoDB:', err?.message || err);
  }

  // 2. Direct MongoDB Atlas Fallback
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');

    const queryConditions: any[] = [];
    if (userId) {
      queryConditions.push({ id: userId });
      queryConditions.push({ _id: userId });
    }
    if (email) {
      queryConditions.push({
        email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
    }

    if (queryConditions.length === 0) {
      return NextResponse.json({ success: false, message: 'User identification required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const roleLabel =
      accountType === 'Startup'
        ? 'Startup Founder'
        : accountType === 'Mentor'
        ? 'Mentor'
        : accountType === 'Investor'
        ? 'Investor'
        : accountType === 'ESP'
        ? 'ESP Applicant'
        : 'Explorer';

    const updateFields: any = {
      accountType,
      userType: accountType,
      primaryRole: accountType,
      updatedAt: nowIso,
    };

    await usersCol.updateOne(
      { $or: queryConditions },
      {
        $set: updateFields,
        $addToSet: { activeRoles: roleLabel },
      }
    );

    const updatedUser = await usersCol.findOne({ $or: queryConditions });
    if (updatedUser) {
      delete (updatedUser as any)._id;
      delete (updatedUser as any).password;
      delete (updatedUser as any).passwordHash;
    }

    return NextResponse.json({
      success: true,
      message: `Account type successfully updated to ${accountType}`,
      data: {
        user: updatedUser,
        accountType,
      },
      source: 'mongodb-atlas',
    });
  } catch (mongoErr: any) {
    return NextResponse.json(
      { success: false, message: mongoErr?.message || 'Database error updating account type' },
      { status: 500 }
    );
  }
}
