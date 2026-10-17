import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { verifyJwtToken } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Validates internal Admin session using cryptographic JWT verification or active admin_sessions record.
 * Merely possessing an unvalidated bearer prefix or random cookie is strictly rejected.
 */
async function verifyAdminAuth(req: NextRequest, getDb?: () => Promise<any>): Promise<{ authenticated: boolean; errorStatus?: number; message?: string; adminInfo?: any }> {
  const authHeader = req.headers.get('authorization') || req.headers.get('x-admin-token');
  const cookieToken = req.cookies.get('xentro_admin_auth')?.value;
  let rawToken = cookieToken || '';

  if (authHeader) {
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      rawToken = authHeader.substring(7).trim();
    } else {
      rawToken = authHeader.trim();
    }
  }

  if (!rawToken) {
    return { authenticated: false, errorStatus: 401, message: 'Authentication required: Missing administrative session credentials.' };
  }

  // 1. Attempt cryptographic JWT verification
  const jwtPayload = verifyJwtToken(rawToken);
  if (jwtPayload) {
    const isStaffOrAdmin =
      jwtPayload.is_staff === true ||
      jwtPayload.isAdmin === true ||
      ['Super Admin', 'Master Admin', 'Identity Verification Admin', 'Entity Verification Admin', 'Operations Admin', 'Compliance Admin', 'Read-Only Auditor', 'Support Agent'].includes(jwtPayload.role) ||
      ['9922953', '8121417', '9911223', 'admin'].includes(String(jwtPayload.employeeId || jwtPayload.sub).toLowerCase());

    if (!isStaffOrAdmin) {
      return { authenticated: false, errorStatus: 403, message: 'Forbidden: Caller does not possess administrative staff credentials.' };
    }

    return { authenticated: true, adminInfo: jwtPayload };
  }

  // 2. Fallback: Check MongoDB authoritative admin_sessions collection
  if (getDb) {
    try {
      const db = await getDb();
      const sessionDoc = await db.collection('admin_sessions').findOne({
        $or: [{ token: rawToken }, { jwtToken: rawToken }],
        expiresAt: { $gt: new Date().toISOString() },
      });
      if (sessionDoc) {
        return { authenticated: true, adminInfo: sessionDoc };
      }
    } catch (err) {
      console.warn('[Admin Auth] Session lookup warning:', err);
    }
  }

  return { authenticated: false, errorStatus: 401, message: 'Invalid or expired administrative session token.' };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req, getDatabase);
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, message: auth.message || 'Forbidden: Valid internal administrative session token required.' },
        { status: auth.errorStatus || 403 }
      );
    }

    const db = await getDatabase();
    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');
    const verifCol = db.collection('verifications');

    const list: any[] = [];

    // 1. Government Identity Verification Cases
    const identityUsers = await usersCol
      .find({
        identityStatus: { $in: ['PENDING', 'Under Review', 'IN_REVIEW', 'VERIFIED', 'REJECTED'] },
        isActive: { $ne: false },
        deleted: { $ne: true },
      })
      .sort({ updatedAt: -1 })
      .limit(50)
      .toArray();

    for (const u of identityUsers) {
      let status = 'Pending';
      const idRaw = String(u.identityStatus || '').toUpperCase();
      if (['VERIFIED', 'APPROVED'].includes(idRaw)) status = 'Verified';
      else if (['REJECTED', 'FAILED'].includes(idRaw)) status = 'Rejected';
      else if (['UNDER_REVIEW', 'IN_REVIEW'].includes(idRaw)) status = 'Under Review';

      list.push({
        id: `verif_id_${u.id}`,
        userId: u.id,
        name: u.fullName || u.name || 'User',
        email: u.email,
        userType: 'Government Identity',
        verificationType: 'Aadhaar / Government ID',
        status,
        submittedAt: (u.updatedAt || u.createdAt || '').slice(0, 10) || 'Recently',
        reviewer: u.identityReviewedBy || (status === 'Verified' ? 'Platform Administrator' : undefined),
        notes: u.identityNotes ? [u.identityNotes] : [],
        documents: [
          { name: 'Masked Identity Record.xml', type: 'Aadhaar Offline XML' },
          { name: 'Identity Declaration Consent', type: 'Digital Consent' },
        ],
      });
    }

    // 2. Entity Verification Cases & Investor Org Privileged Roles
    const entities = await entitiesCol
      .find({
        $or: [
          { verificationStatus: { $in: ['PENDING', 'Under Review', 'IN_REVIEW', 'VERIFIED', 'REJECTED'] } },
          { ownerApprovalStatus: 'PENDING_ADMIN_VERIFICATION' },
        ],
        isActive: { $ne: false },
        deleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    for (const e of entities) {
      let status = 'Pending';
      const verifRaw = String(e.verificationStatus || '').toUpperCase();
      if (['VERIFIED', 'APPROVED'].includes(verifRaw)) status = 'Verified';
      else if (['REJECTED'].includes(verifRaw)) status = 'Rejected';
      else if (['UNDER_REVIEW', 'IN_REVIEW'].includes(verifRaw)) status = 'Under Review';

      const isPrivilegedInvestor = e.ownerApprovalStatus === 'PENDING_ADMIN_VERIFICATION';

      list.push({
        id: `verif_ent_${e.id}`,
        entityId: e.id,
        name: e.primaryOwnerName || e.founderName || 'Founder',
        organization: e.name || 'Organization',
        email: e.officialEmail || '',
        userType: isPrivilegedInvestor ? 'Investor Organization Privileged Role' : `${e.entityType || 'Entity'} Registration`,
        verificationType: isPrivilegedInvestor ? 'Owner / Managing Partner Verification' : 'Entity Legal Verification',
        status: isPrivilegedInvestor ? 'Pending' : status,
        submittedAt: (e.createdAt || '').slice(0, 10) || 'Recently',
        reviewer: e.verifiedBy || (status === 'Approved' ? 'Platform Administrator' : undefined),
        notes: e.rejectionReason ? [e.rejectionReason] : [],
        documents: [
          { name: 'Certificate of Incorporation.pdf', type: 'Registration' },
          { name: 'Official Domain Verification.txt', type: 'Domain OTP' },
        ],
      });
    }

    return NextResponse.json({
      success: true,
      data: { requests: list },
    });
  } catch (error: any) {
    console.error('Error fetching verification requests:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyAdminAuth(req, getDatabase);
    if (!auth.authenticated) {
      return NextResponse.json(
        { success: false, message: auth.message || 'Forbidden: Valid internal administrative session token required.' },
        { status: auth.errorStatus || 403 }
      );
    }

    const role = auth.adminInfo?.role || '';
    const permissions = auth.adminInfo?.permissions || [];
    const isSuperOrMaster =
      ['Super Admin', 'Master Admin', 'System Administrator'].includes(role) ||
      ['9922953', '8121417', '9911223', 'admin'].includes(String(auth.adminInfo?.employeeId || auth.adminInfo?.sub).toLowerCase());

    // Ground Staff, Support Agent, Read-Only Auditor, and ordinary Viewers are strictly prohibited from approving/rejecting
    if (['Read-Only Auditor', 'Support Agent', 'Viewer'].includes(role)) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Insufficient administrative privileges to review or alter verification status.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, action, notes } = body;

    if (!id || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { success: false, message: 'Valid verification ID and action (APPROVE or REJECT) are required.' },
        { status: 400 }
      );
    }

    // Role boundaries: Identity verification vs Entity verification
    if (id.startsWith('verif_id_')) {
      const canReviewIdentity =
        isSuperOrMaster ||
        ['Identity Verification Admin', 'Operations Admin', 'Compliance Admin'].includes(role) ||
        permissions.includes('identity_verification.review') ||
        permissions.includes('super:all');

      if (!canReviewIdentity) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Your administrative role is not authorized for Government Identity verification review.' },
          { status: 403 }
        );
      }
    } else if (id.startsWith('verif_ent_')) {
      const canReviewEntity =
        isSuperOrMaster ||
        ['Entity Verification Admin', 'Operations Admin', 'Compliance Admin'].includes(role) ||
        permissions.includes('verification.review') ||
        permissions.includes('super:all');

      if (!canReviewEntity) {
        return NextResponse.json(
          { success: false, message: 'Forbidden: Your administrative role is not authorized for Entity Legal verification review.' },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ success: false, message: 'Invalid verification ID' }, { status: 400 });
    }

    const authoritativeReviewer = auth.adminInfo?.name || auth.adminInfo?.employeeId || 'Platform Administrator';
    const db = await getDatabase();
    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');
    const auditCol = db.collection('audit_logs');

    const now = new Date().toISOString();
    const targetStatus = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';

    if (id?.startsWith('verif_id_')) {
      const userId = id.replace('verif_id_', '');
      await usersCol.updateOne(
        { id: userId },
        {
          $set: {
            identityStatus: targetStatus,
            identityReviewedBy: authoritativeReviewer,
            verificationReviewedAt: now,
            identityNotes: notes || '',
            updatedAt: now,
          },
        }
      );

      await auditCol.insertOne({
        action: `IDENTITY_VERIFICATION_${action}`,
        userId,
        status: targetStatus,
        performedBy: authoritativeReviewer,
        adminRole: role,
        notes: notes || '',
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        message: `Identity verification marked as ${targetStatus}.`,
      });
    }

    if (id?.startsWith('verif_ent_')) {
      const entityId = id.replace('verif_ent_', '');
      const membershipsCol = db.collection('memberships');
      const roleReqCol = db.collection('role_requests');
      const invOrgCol = db.collection('investment_organizations');

      await entitiesCol.updateOne(
        { id: entityId },
        {
          $set: {
            verificationStatus: targetStatus,
            ownerApprovalStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            verifiedBy: authoritativeReviewer,
            verifiedAt: now,
            rejectionReason: notes || '',
            updatedAt: now,
          },
        }
      );

      if (action === 'APPROVE') {
        // 1. Promote pending memberships to ACTIVE with full RBAC permissions
        await membershipsCol.updateMany(
          { entityId, status: { $in: ['PENDING_ADMIN_VERIFICATION', 'PENDING', 'pending'] } },
          {
            $set: {
              status: 'ACTIVE',
              permissions: [
                'OWNER',
                'ADMIN',
                'MANAGE_ORGANIZATION',
                'MANAGE_TEAM',
                'MANAGE_BILLING',
                'VIEW_DEAL_FLOW',
                'EDIT_DEAL_FLOW',
                'CREATE_INVESTMENT_DECISION',
                'VIEW_PORTFOLIO',
                'EDIT_PORTFOLIO',
                'ACCESS_DILIGENCE_VAULT',
                'REQUEST_DILIGENCE',
                'SCHEDULE_MEETINGS',
                'PUBLISH_CONTENT',
                'EXPORT_DATA',
              ],
              updatedAt: now,
            },
          }
        );

        // 2. Mark role requests approved
        await roleReqCol.updateMany(
          { entityId, status: 'PENDING' },
          { $set: { status: 'APPROVED', reviewedBy: authoritativeReviewer, updatedAt: now } }
        );

        // 3. Mark investment_organizations as verified
        await invOrgCol.updateOne(
          { $or: [{ entityId }, { id: entityId }] },
          { $set: { verified: true, updatedAt: now } }
        );
      } else {
        await roleReqCol.updateMany(
          { entityId, status: 'PENDING' },
          { $set: { status: 'REJECTED', rejectionReason: notes || '', updatedAt: now } }
        );
      }

      await auditCol.insertOne({
        action: `ENTITY_VERIFICATION_${action}`,
        entityId,
        status: targetStatus,
        performedBy: authoritativeReviewer,
        adminRole: role,
        notes: notes || '',
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        message: `Entity verification marked as ${targetStatus} and memberships synchronized.`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid verification ID' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating verification request:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
