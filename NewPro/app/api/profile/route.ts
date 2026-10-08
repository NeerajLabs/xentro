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

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';
  const email = req.headers.get('x-user-email') || req.nextUrl.searchParams.get('email') || '';

  // 1. Attempt backend proxy
  try {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;

    const backendUrl = getBackendBaseUrl();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendUrl}/auth/profile/?userId=${encodeURIComponent(userId)}`, {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data?.data?.user || data?.user || data?.profile) {
        return NextResponse.json(data);
      }
    }
  } catch (err: any) {
    console.warn('[Profile GET] Backend proxy error, falling back to MongoDB:', err?.message || err);
  }

  // 2. Direct MongoDB Atlas Fallback
  try {
    if (!userId && !email) {
      return NextResponse.json({ success: false, message: 'User identification required' }, { status: 400 });
    }

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

    const user = await usersCol.findOne({ $or: queryConditions });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User profile not found in database' }, { status: 404 });
    }

    delete (user as any)._id;
    delete (user as any).password;
    delete (user as any).passwordHash;

    const personalProfile = user.personalProfile || {
      fullName: user.fullName || user.name,
      headline: user.headline || '',
      location: user.location || '',
      bio: user.bio || '',
      currentRole: user.currentRole || user.roleTitle || '',
      currentOrganization: user.currentOrganization || user.organization || '',
      education: user.education || '',
      professionalExperience: user.professionalExperience || user.experienceSummary || '',
      skills: user.skills || [],
      industries: user.industries || [],
      startupInterests: user.startupInterests || [],
      linkedin: user.linkedin || '',
      website: user.website || '',
      otherLinks: user.otherLinks || [],
      photoUrl: user.avatar || user.photoUrl,
    };

    return NextResponse.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user,
        profile: personalProfile,
      },
      source: 'mongodb-atlas',
    });
  } catch (mongoErr: any) {
    return NextResponse.json(
      { success: false, message: mongoErr?.message || 'Database error retrieving profile' },
      { status: 500 }
    );
  }
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

    const res = await fetch(`${backendUrl}/auth/profile/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json();
    if (res.ok && data?.success) {
      return NextResponse.json(data, { status: res.status });
    }
  } catch (err: any) {
    console.warn('[Profile POST] Backend proxy error, falling back to MongoDB:', err?.message || err);
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

    const nowIso = new Date().toISOString();
    const photoUrl = body.photoUrl || body.avatar;

    const personalProfile = {
      fullName: body.fullName || '',
      headline: body.headline || '',
      location: body.location || '',
      bio: body.bio || '',
      currentRole: body.currentRole || '',
      currentOrganization: body.currentOrganization || body.organization || '',
      education: body.education || '',
      professionalExperience: body.professionalExperience || body.experienceSummary || '',
      skills: Array.isArray(body.skills) ? body.skills : [],
      areasOfExpertise: Array.isArray(body.skills) ? body.skills : [],
      industries: Array.isArray(body.industries) ? body.industries : [],
      industriesOfFocus: Array.isArray(body.industries) ? body.industries : [],
      startupInterests: Array.isArray(body.startupInterests) ? body.startupInterests : [],
      entrepreneurshipInterests: Array.isArray(body.startupInterests) ? body.startupInterests : [],
      linkedin: body.linkedin || body.linkedinUrl || '',
      website: body.website || body.websiteUrl || '',
      otherLinks: Array.isArray(body.otherLinks) ? body.otherLinks : body.otherLink ? [body.otherLink] : [],
      photoUrl: photoUrl || '',
      avatar: photoUrl || '',
      updatedAt: nowIso,
    };

    const updateFields: any = {
      personalProfile,
      headline: personalProfile.headline,
      location: personalProfile.location,
      bio: personalProfile.bio,
      currentRole: personalProfile.currentRole,
      roleTitle: personalProfile.currentRole,
      organization: personalProfile.currentOrganization,
      currentOrganization: personalProfile.currentOrganization,
      education: personalProfile.education,
      professionalExperience: personalProfile.professionalExperience,
      experienceSummary: personalProfile.professionalExperience,
      skills: personalProfile.skills,
      areasOfExpertise: personalProfile.skills,
      industries: personalProfile.industries,
      industriesOfFocus: personalProfile.industries,
      startupInterests: personalProfile.startupInterests,
      entrepreneurshipInterests: personalProfile.startupInterests,
      linkedin: personalProfile.linkedin,
      website: personalProfile.website,
      otherLinks: personalProfile.otherLinks,
      updatedAt: nowIso,
    };

    if (body.fullName) updateFields.fullName = body.fullName;
    if (photoUrl) {
      updateFields.photoUrl = photoUrl;
      updateFields.avatar = photoUrl;
    }

    if (queryConditions.length > 0) {
      await usersCol.updateOne({ $or: queryConditions }, { $set: updateFields });
    }

    const updatedUser = queryConditions.length > 0 ? await usersCol.findOne({ $or: queryConditions }) : null;
    if (updatedUser) {
      delete (updatedUser as any)._id;
      delete (updatedUser as any).password;
      delete (updatedUser as any).passwordHash;
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully to MongoDB Atlas',
      data: {
        user: updatedUser,
        profile: personalProfile,
      },
      source: 'mongodb-atlas',
    });
  } catch (mongoErr: any) {
    return NextResponse.json(
      { success: false, message: mongoErr?.message || 'Database error saving profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
