import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { getMongoClient } from '@/lib/mongodb';
import { requireServerAuth } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      queryConditions.push({ xentroId: userId });
      queryConditions.push({ username: userId });
      queryConditions.push({ username: `@${userId.replace(/^@/, '')}` });
      queryConditions.push({ accountTag: userId });
      queryConditions.push({ accountTag: `@${userId.replace(/^@/, '')}` });
    }
    if (email) {
      queryConditions.push({
        email: { $regex: `^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
    }

    const user = await usersCol.findOne({ $or: queryConditions });
    if (!user) {
      // Check entities collection if query was an entityId
      try {
        const entitiesCol = db.collection('entities');
        const entity = await entitiesCol.findOne({
          $or: [
            { id: userId },
            { entityId: userId },
            { slug: userId },
          ],
          status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
        });
        if (entity) {
          return NextResponse.json({
            success: true,
            message: 'Entity profile retrieved successfully',
            data: {
              isEntity: true,
              entity: {
                id: entity.id || entity.entityId,
                name: entity.name,
                canonicalType: entity.canonicalType,
                entityType: entity.entityType,
                description: entity.description || entity.details?.description || '',
                tagline: entity.tagline || entity.details?.tagline || '',
                industry: entity.industry || entity.details?.industry || 'Technology',
                stage: entity.stage || entity.details?.stage || 'Seed',
                logo: entity.logo || '/xentro-logo.png',
                coverImage: entity.coverImage || '',
                location: entity.location || entity.details?.location || {},
                verified: Boolean(entity.verificationStatus === 'VERIFIED'),
                createdAt: entity.createdAt,
              },
            },
            source: 'mongodb-atlas',
          });
        }
      } catch (e) {
        console.warn('[Profile GET] Entity fallback lookup error:', e);
      }
      return NextResponse.json({ success: false, message: 'User profile not found in database' }, { status: 404 });
    }

    delete (user as any)._id;
    delete (user as any).password;
    delete (user as any).passwordHash;

    // Check personal_profiles collection for canonical profile
    let canonicalProfile: any = null;
    try {
      const personalCol = db.collection('personal_profiles');
      canonicalProfile = await personalCol.findOne({
        $or: [
          { userId: user.id },
          { userId: user.xentroId },
          { userEmail: user.email },
        ],
      });
    } catch (_) {}

    const embeddedProfile = user.personalProfile || {};
    const effectiveTag =
      user.accountTag ||
      user.username ||
      canonicalProfile?.accountTag ||
      canonicalProfile?.publicUsername ||
      canonicalProfile?.username ||
      `@${(user.fullName || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;

    const personalProfile = {
      fullName: user.fullName || user.name || canonicalProfile?.displayName || embeddedProfile.fullName || '',
      username: effectiveTag,
      accountTag: effectiveTag,
      publicUsername: effectiveTag,
      headline: user.headline || canonicalProfile?.professional?.designation || embeddedProfile.headline || '',
      location: user.location || canonicalProfile?.location || embeddedProfile.location || '',
      bio: user.bio || canonicalProfile?.bio || embeddedProfile.bio || '',
      currentRole: user.currentRole || user.roleTitle || canonicalProfile?.professional?.category || embeddedProfile.currentRole || '',
      currentOrganization: user.currentOrganization || user.organization || canonicalProfile?.professional?.currentOrganization || embeddedProfile.currentOrganization || '',
      education: (Array.isArray(user.education) && user.education.length > 0)
        ? user.education
        : (Array.isArray(canonicalProfile?.education) && canonicalProfile.education.length > 0)
        ? canonicalProfile.education
        : (Array.isArray(embeddedProfile.education) && embeddedProfile.education.length > 0)
        ? embeddedProfile.education
        : (user.education || canonicalProfile?.education || embeddedProfile.education || ''),
      professionalExperience: user.professionalExperience || canonicalProfile?.professionalExperience || embeddedProfile.professionalExperience || user.experienceSummary || '',
      skills: (user.skills && user.skills.length > 0) ? user.skills : (canonicalProfile?.skills || embeddedProfile.skills || []),
      industries: (user.industries && user.industries.length > 0) ? user.industries : (canonicalProfile?.industries || embeddedProfile.industries || []),
      startupInterests: (user.startupInterests && user.startupInterests.length > 0) ? user.startupInterests : (canonicalProfile?.startupInterests || embeddedProfile.startupInterests || []),
      linkedin: user.linkedin || canonicalProfile?.socialLinks?.linkedin || embeddedProfile.linkedin || '',
      website: user.website || canonicalProfile?.socialLinks?.website || embeddedProfile.website || '',
      otherLinks: user.otherLinks || embeddedProfile.otherLinks || [],
      photoUrl: user.avatar || canonicalProfile?.avatarUrl || embeddedProfile.photoUrl || user.photoUrl,
    };

    // Determine caller ownership for safe PII allowlisting
    const caller = await requireServerAuth(req).catch(() => ({ authenticated: false, user: null }));
    const callerUserId = caller.authenticated && caller.user ? (caller.user.id || caller.user.userId || '') : '';
    const callerEmail = caller.authenticated && caller.user ? (caller.user.email || '') : '';
    const isOwner = Boolean(
      callerUserId &&
      (user.id === callerUserId ||
        String(user._id) === callerUserId ||
        (user.email && callerEmail && user.email.toLowerCase() === callerEmail.toLowerCase()))
    );
    const isStaff = Boolean(caller.authenticated && caller.user?.is_staff);

    // Explicit allowlisted public user projection: NEVER leaks raw MongoDB documents, password hashes, or internal secrets
    const sanitizedUser: Record<string, any> = {
      id: user.id || String(user._id),
      fullName: user.fullName || user.name || personalProfile.fullName || 'Ecosystem Member',
      name: user.fullName || user.name || personalProfile.fullName || 'Ecosystem Member',
      username: effectiveTag,
      accountTag: effectiveTag,
      publicUsername: effectiveTag,
      headline: personalProfile.headline,
      bio: personalProfile.bio,
      role: user.role || user.primaryRole || user.accountType || 'Explorer',
      accountType: user.accountType || user.primaryRole || 'Explorer',
      currentRole: personalProfile.currentRole,
      currentOrganization: personalProfile.currentOrganization,
      organization: personalProfile.currentOrganization || user.startupName || '',
      location: personalProfile.location,
      skills: personalProfile.skills,
      industries: personalProfile.industries,
      education: personalProfile.education,
      professionalExperience: personalProfile.professionalExperience,
      startupInterests: personalProfile.startupInterests,
      linkedin: personalProfile.linkedin,
      website: personalProfile.website,
      otherLinks: personalProfile.otherLinks,
      avatar: personalProfile.photoUrl || '/xentro-logo.png',
      photoUrl: personalProfile.photoUrl || '/xentro-logo.png',
      is_verified: Boolean(user.is_verified || user.verified || user.emailVerified),
      verified: Boolean(user.is_verified || user.verified || user.emailVerified),
      personalProfile,
    };

    // Private contact details and account status only included if caller is account owner or administrative staff
    if (isOwner || isStaff) {
      sanitizedUser.email = user.email || '';
      sanitizedUser.phone = user.phone || user.phoneNumber || '';
      sanitizedUser.accountStatus = user.accountStatus || 'ACTIVE';
      sanitizedUser.activeRoles = user.activeRoles || ['Explorer'];
      sanitizedUser.is_staff = Boolean(user.is_staff);
    }

    return NextResponse.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: sanitizedUser,
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

  const caller = await requireServerAuth(req);
  if (!caller.authenticated || !caller.user) {
    return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
  }

  const callerUserId = caller.user.id || caller.user.userId || '';
  const targetUserId = body.userId || body.id || callerUserId;

  if (targetUserId.toLowerCase() !== callerUserId.toLowerCase() && !caller.user.is_staff) {
    return NextResponse.json({ success: false, message: 'Forbidden: Cannot modify another users profile' }, { status: 403 });
  }

  const token =
    req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
  const userId = callerUserId;
  const email = caller.user.email || body.email || '';

  // 1. Attempt backend proxy
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    headers['X-User-Id'] = userId;

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

    const existingUser = queryConditions.length > 0 ? await usersCol.findOne({ $or: queryConditions }) : null;
    const profileId = existingUser?.profileId || `PRF-${Math.floor(100000 + Math.random() * 900000)}`;
    const userActualId = existingUser?.id || userId || `XU-${Math.floor(100000 + Math.random() * 900000)}`;

    const rawTag =
      body.accountTag ||
      body.username ||
      existingUser?.accountTag ||
      existingUser?.username ||
      `@${(personalProfile.fullName || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}${Math.floor(10 + Math.random() * 90)}`;
    const cleanTag = rawTag.startsWith('@') ? rawTag : `@${rawTag}`;

    (personalProfile as any).username = cleanTag;
    (personalProfile as any).accountTag = cleanTag;
    (personalProfile as any).publicUsername = cleanTag;

    updateFields.username = cleanTag;
    updateFields.accountTag = cleanTag;
    updateFields.tag = cleanTag;

    const canonicalProfile = {
      id: profileId,
      profileId,
      userId: userActualId,
      fullName: personalProfile.fullName,
      publicUsername: cleanTag,
      username: cleanTag,
      accountTag: cleanTag,
      tag: cleanTag,
      professionalHeadline: personalProfile.headline,
      headline: personalProfile.headline,
      location: personalProfile.location,
      currentRole: personalProfile.currentRole,
      currentOrganization: personalProfile.currentOrganization,
      education: personalProfile.education,
      about: personalProfile.bio,
      bio: personalProfile.bio,
      professionalExperience: personalProfile.professionalExperience,
      skills: personalProfile.skills,
      industryInterests: personalProfile.industries,
      ecosystemInterests: personalProfile.startupInterests,
      ecosystemGoals: Array.isArray(body.ecosystemGoals) ? body.ecosystemGoals : [],
      socialLinks: {
        linkedin: personalProfile.linkedin,
        website: personalProfile.website,
        otherLinks: personalProfile.otherLinks,
      },
      linkedin: personalProfile.linkedin,
      website: personalProfile.website,
      photoUrl: personalProfile.photoUrl,
      profilePicture: personalProfile.photoUrl,
      visibility: 'PUBLIC',
      updatedAt: nowIso,
    };

    const profilesCol = db.collection('personal_profiles');
    await profilesCol.updateOne(
      { userId: userActualId },
      { $set: canonicalProfile },
      { upsert: true }
    );

    updateFields.profileId = profileId;
    updateFields.baseRole = 'explorer';
    updateFields.onboardingCompleted = true;
    if (!existingUser || existingUser.accountStatus === 'PENDING_VERIFICATION' || existingUser.accountStatus === 'PROFILE_SETUP_PENDING') {
      updateFields.accountStatus = 'ACTIVE';
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
        profile: canonicalProfile,
        onboardingCompleted: true,
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
