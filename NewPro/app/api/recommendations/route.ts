import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { getBackendBaseUrl } from '@/lib/backendUrl';

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
  const { searchParams } = new URL(req.url);
  const excludeUserId = searchParams.get('excludeUserId') || '';
  const excludeEmail = searchParams.get('excludeEmail') || '';

  // 1. Try Backend API
  try {
    const backendBase = getBackendBaseUrl();
    const backendUrl = new URL(`${backendBase}/users/recommendations/`);
    if (excludeUserId) backendUrl.searchParams.set('excludeUserId', excludeUserId);
    if (excludeEmail) backendUrl.searchParams.set('excludeEmail', excludeEmail);

    const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(backendUrl.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!res.ok && (res.status === 401 || res.status === 403)) {
      res = await fetch(backendUrl.toString(), {
        cache: 'no-store',
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (data?.data || data?.success) {
        return NextResponse.json({ success: true, data: data.data || data });
      }
    }
  } catch (err: any) {
    console.warn('[Recommendations API] Backend proxy warning, checking MongoDB directly:', err?.message);
  }

  // 2. Direct MongoDB Atlas Fallback: Fetch strictly real ecosystem users
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');

    const queryConditions: any = {
      isActive: { $ne: false },
      accountStatus: { $nin: ['DELETED', 'REJECTED', 'SUSPENDED'] },
      deleted: { $ne: true },
      is_deleted: { $ne: true },
    };

    if (excludeUserId) {
      queryConditions.id = { $ne: excludeUserId };
    }
    if (excludeEmail) {
      queryConditions.email = { $ne: excludeEmail.toLowerCase() };
    }

    const realUsers = await usersCol.find(queryConditions).limit(50).toArray();

    const people: any[] = [];
    const mentors: any[] = [];
    const investors: any[] = [];
    const esps: any[] = [];

    realUsers.forEach((u: any) => {
      const name = u.fullName || u.name || 'Ecosystem Member';
      const role = u.role || u.primaryRole || u.headline || 'Member';
      const company = u.startupName || u.organization || u.company || '';
      const avatar = u.avatar || u.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      const accountType = String(u.accountType || u.role || '').toLowerCase();

      const recItem = {
        id: u.id || String(u._id),
        userId: u.id,
        name,
        title: role,
        company,
        context: company ? `${role} at ${company}` : role,
        avatar,
        status: 'idle',
        verified: Boolean(u.verified || u.emailVerified),
      };

      if (accountType.includes('mentor')) {
        mentors.push({ ...recItem, category: 'mentors', type: 'mentor' });
      } else if (accountType.includes('investor')) {
        investors.push({ ...recItem, category: 'investors', type: 'investor' });
      } else if (accountType.includes('esp') || accountType.includes('institution')) {
        esps.push({ ...recItem, category: 'opportunities', type: 'esp' });
      } else {
        people.push({ ...recItem, category: 'people', type: 'startup' });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        people,
        mentors,
        investors,
        esps,
        opportunities: [],
      },
      source: 'mongodb-atlas',
    });
  } catch (mongoErr: any) {
    return NextResponse.json(
      {
        success: true,
        data: {
          people: [],
          mentors: [],
          investors: [],
          esps: [],
          opportunities: [],
        },
        source: 'empty-fallback',
      }
    );
  }
}
