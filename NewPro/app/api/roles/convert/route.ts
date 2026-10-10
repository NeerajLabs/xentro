import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { sendZohoEmail } from '@/lib/email/zohoDispatcher';

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
    const token =
      req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const userId = req.headers.get('x-user-id') || body.userId || body.id || '';
    const userEmail = req.headers.get('x-user-email') || body.userEmail || body.email || '';
    const rawTargetRole = String(body.targetRole || body.requestedRole || body.role || '').trim().toLowerCase();

    const targetRole = rawTargetRole.includes('mentor') ? 'Mentor' : rawTargetRole.includes('investor') ? 'Investor' : '';

    if (!targetRole) {
      return NextResponse.json(
        { success: false, message: 'Valid target role (Mentor or Investor) is required for direct conversion' },
        { status: 400 }
      );
    }

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Authenticated user identification is required' },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');
    const personalCol = db.collection('personal_profiles');
    const membershipsCol = db.collection('memberships');
    const auditCol = db.collection('audit_logs');
    const roleReqCol = db.collection('role_requests');

    // 1. Locate existing canonical personal account
    const queryConditions: any[] = [];
    if (userId) {
      queryConditions.push({ id: userId });
      queryConditions.push({ _id: userId });
      queryConditions.push({ xentroId: userId });
    }
    if (userEmail) {
      queryConditions.push({
        email: { $regex: `^${userEmail.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
    }

    const user = await usersCol.findOne({ $or: queryConditions });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User account not found' }, { status: 404 });
    }

    // 2. Check for prohibited memberships (Mentors cannot belong to Investor Organizations)
    if (targetRole === 'Mentor') {
      const activeInvestorOrgMembership = await membershipsCol.findOne({
        $or: [
          { userId: user.id },
          { userEmail: user.email },
        ],
        entityType: { $in: ['INVESTOR_ORG', 'INVESTOR', 'VC'] },
        status: 'ACTIVE',
      });

      if (activeInvestorOrgMembership) {
        return NextResponse.json(
          {
            success: false,
            message:
              'Mentors are strictly prohibited from holding active Investor Organization memberships. Please resign from your Investor Organization before activating a Mentor account.',
          },
          { status: 400 }
        );
      }
    }

    const nowIso = new Date().toISOString();
    const canonicalUserId = user.id || userId;
    const roleLabel = targetRole === 'Mentor' ? 'Mentor' : 'Individual Investor';

    // 3. Prepare role-specific metadata
    const mentorDetails = targetRole === 'Mentor' ? (body.mentorDetails || body.entityDetails?.mentorDetails || {}) : undefined;
    const investorDetails = targetRole === 'Investor' ? (body.investorDetails || body.entityDetails?.investorDetails || {}) : undefined;

    const updateFields: any = {
      accountType: targetRole,
      userType: targetRole,
      primaryRole: targetRole,
      roleTitle: roleLabel,
      participationModes: [targetRole],
      activeRoles: [targetRole],
      updatedAt: nowIso,
    };

    if (body.headline) updateFields.headline = body.headline;
    if (body.bio) updateFields.bio = body.bio;
    if (body.skills) updateFields.skills = Array.isArray(body.skills) ? body.skills : String(body.skills).split(',').map((s) => s.trim()).filter(Boolean);
    if (body.linkedin) updateFields.linkedin = body.linkedin;
    if (mentorDetails) updateFields.mentorDetails = mentorDetails;
    if (investorDetails) updateFields.investorDetails = investorDetails;

    // 4. Update the existing personal account in MongoDB Atlas atomically
    await usersCol.updateOne(
      { _id: user._id },
      {
        $set: updateFields,
      }
    );

    // 5. Update canonical personal profile if present
    try {
      await personalCol.updateOne(
        {
          $or: [
            { userId: canonicalUserId },
            { userEmail: user.email },
          ],
        },
        {
          $set: {
            accountType: targetRole,
            role: targetRole.toLowerCase(),
            roleTitle: roleLabel,
            ...(mentorDetails ? { mentorDetails } : {}),
            ...(investorDetails ? { investorDetails } : {}),
            updatedAt: nowIso,
          },
        },
        { upsert: false }
      );
    } catch (_) {}

    // 6. Record conversion event in audit history
    try {
      await auditCol.insertOne({
        id: `audit_${Date.now()}`,
        actorId: canonicalUserId,
        actorEmail: user.email,
        action: `DIRECT_ACCOUNT_CONVERSION_${targetRole.toUpperCase()}`,
        details: {
          previousRole: user.accountType || user.primaryRole || 'Explorer',
          newRole: targetRole,
          method: 'DIRECT_SELF_ACTIVATION',
          timestamp: nowIso,
        },
        createdAt: nowIso,
      });
    } catch (_) {}

    // 7. Clear any legacy pending generic conversion requests for this user & role
    try {
      await roleReqCol.deleteMany({
        $or: [
          { userId: canonicalUserId },
          { userEmail: user.email },
        ],
        requestedRole: { $regex: targetRole, $options: 'i' },
      });
    } catch (_) {}

    // 8. Dispatch notification / email
    if (user.email && user.email.includes('@')) {
      try {
        await sendZohoEmail({
          to: user.email.trim().toLowerCase(),
          subject: `XENTRO: Your Account is Now Active as ${roleLabel}`,
          text: `Dear ${user.fullName || user.name || 'Member'},\n\nCongratulations! Your personal Xentro account has been directly and permanently converted to a ${roleLabel}.\n\nAccount Details:\n- User ID: ${canonicalUserId}\n- Account Type: ${roleLabel}\n- Dashboard: Activated\n\nYour existing connections, conversations, and personal profile history have been preserved.\n\nAccess your new dashboard here:\nhttps://xentro.in/?tab=dashboard\n\nWarm regards,\nXENTRO Platform Operations\nhttps://xentro.in`,
        });
      } catch (emailErr) {
        console.warn('[RoleConvert] Zoho email dispatch error:', emailErr);
      }
    }

    const updatedUser = await usersCol.findOne({ _id: user._id });
    if (updatedUser) {
      delete (updatedUser as any)._id;
      delete (updatedUser as any).password;
      delete (updatedUser as any).passwordHash;
    }

    return NextResponse.json({
      success: true,
      message: `Account permanently converted to ${roleLabel}. Dashboard activated!`,
      data: {
        user: updatedUser,
        accountType: targetRole,
        role: targetRole.toLowerCase(),
        redirectTab: 'dashboard',
      },
    });
  } catch (err: any) {
    console.error('[RoleConvert] Error executing direct conversion:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error during account conversion' },
      { status: 500 }
    );
  }
}
