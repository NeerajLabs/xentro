import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuthenticatedUser } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export type VerificationType =
  | 'INCORPORATION_MCA'
  | 'DPIIT_RECOGNITION'
  | 'MSME_UDYAM'
  | 'OFFICIAL_EMAIL'
  | 'FOUNDER_IDENTITY'
  | 'CORPORATE_WEBSITE';

export interface VerificationItem {
  id: string;
  type: VerificationType;
  title: string;
  status: 'NOT_SUBMITTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  documentNumber?: string;
  documentUrl?: string;
  documentName?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
  verifiedBy?: string;
  badgeColor: string;
}

/**
 * Validates document format for regulatory identifiers.
 */
function validateIdentifier(type: VerificationType, num: string): { valid: boolean; error?: string } {
  const clean = (num || '').trim().toUpperCase();
  if (!clean) return { valid: false, error: 'Identifier number is required' };

  if (type === 'INCORPORATION_MCA') {
    // Standard Indian 21-character Corporate Identification Number (CIN)
    const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
    if (!cinRegex.test(clean) && clean.length !== 21) {
      return { valid: false, error: 'Invalid CIN format. Must be a 21-character Indian Corporate Identity Number (e.g., U72200TG2026PTC123456).' };
    }
  }

  if (type === 'DPIIT_RECOGNITION') {
    if (!clean.startsWith('DIPP') && !clean.startsWith('DPIIT')) {
      return { valid: false, error: 'Invalid DPIIT format. Certificate number typically starts with DIPP or DPIIT.' };
    }
  }

  if (type === 'MSME_UDYAM') {
    if (!clean.startsWith('UDYAM')) {
      return { valid: false, error: 'Invalid Udyam registration format. Must start with UDYAM (e.g., UDYAM-TS-01-0012345).' };
    }
  }

  return { valid: true };
}

/**
 * Checks authorization of user on the startup entity.
 */
async function checkStartupAuth(req: NextRequest, entityId: string, db: any) {
  const authRes = await requireAuthenticatedUser(req);
  if (!authRes.authenticated || !authRes.user) {
    return { error: NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 }) };
  }

  const userId = authRes.user.id || authRes.user.userId || '';
  const userEmail = authRes.user.email || '';
  const userRole = authRes.user.role || '';

  // Admin override if system admin
  if (userRole === 'admin' || userRole === 'INTERNAL_ADMIN' || (authRes.user as any).isSuperuser) {
    return { userId, isOwner: true, role: 'Internal Admin', permissions: ['ALL', 'ADMIN', 'MANAGE_DOCS'] };
  }

  const entitiesCol = db.collection('entities');
  const membershipsCol = db.collection('memberships');

  const entity = await entitiesCol.findOne({ id: entityId });
  if (!entity) {
    return { error: NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 }) };
  }

  const isOwner =
    entity.createdByUserId === userId ||
    entity.createdByUserId === userEmail ||
    entity.currentOwnerUserId === userId ||
    entity.currentOwnerUserId === userEmail ||
    entity.primaryOwnerId === userId ||
    entity.primaryOwnerId === userEmail;

  if (isOwner) {
    return { userId, isOwner: true, role: 'Owner / Founder', permissions: ['OWNER', 'ADMIN', 'MANAGE_DOCS'] };
  }

  const membership = await membershipsCol.findOne({
    entityId,
    $or: [{ userId }, { userEmail }],
    status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
  });

  if (membership) {
    return { userId, isOwner: false, role: membership.role || 'Member', permissions: membership.permissions || [] };
  }

  return { error: NextResponse.json({ success: false, message: 'Forbidden: You do not have access to this startup verification workspace' }, { status: 403 }) };
}

/**
 * GET /api/startups/[entityId]/verification
 * Returns authoritative regulatory and identity verification items for the startup.
 * Enforces cross-startup isolation and caller authorization.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const { entityId } = params;
    const db = await getDatabase();

    const authCheck = await checkStartupAuth(req, entityId, db);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const entitiesCol = db.collection('entities');
    const verifCol = db.collection('verifications');
    const usersCol = db.collection('users');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    // Load all verification records for this entity
    const records = await verifCol.find({ entityId }).toArray();
    const recMap = new Map<string, any>();
    for (const r of records) {
      recMap.set(r.type, r);
    }

    // Check founder identity in users collection
    let founderIdentityStatus: 'NOT_SUBMITTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' = 'NOT_SUBMITTED';
    const founderId = entity.primaryOwnerId || entity.createdByUserId || entity.currentOwnerUserId;
    if (founderId) {
      const founderUser = await usersCol.findOne({ $or: [{ id: founderId }, { email: founderId }] });
      if (founderUser) {
        const rawStatus = String(founderUser.identityStatus || '').toUpperCase();
        if (['VERIFIED', 'APPROVED'].includes(rawStatus)) founderIdentityStatus = 'VERIFIED';
        else if (['PENDING', 'SUBMITTED'].includes(rawStatus)) founderIdentityStatus = 'PENDING';
        else if (['UNDER_REVIEW', 'IN_REVIEW'].includes(rawStatus)) founderIdentityStatus = 'UNDER_REVIEW';
        else if (['REJECTED', 'FAILED'].includes(rawStatus)) founderIdentityStatus = 'REJECTED';
      }
    }

    // Build canonical verification items list
    const items: VerificationItem[] = [
      buildItem('OFFICIAL_EMAIL', 'Official Corporate Email', entity.officialEmailVerified ? 'VERIFIED' : (entity.officialEmail ? 'PENDING' : 'NOT_SUBMITTED'), recMap.get('OFFICIAL_EMAIL')),
      buildItem('FOUNDER_IDENTITY', 'Founder Identity (Govt ID)', founderIdentityStatus, recMap.get('FOUNDER_IDENTITY')),
      buildItem('INCORPORATION_MCA', 'Company Incorporation (MCA / CIN)', resolveStatus(entity.mcaVerified, recMap.get('INCORPORATION_MCA')), recMap.get('INCORPORATION_MCA')),
      buildItem('DPIIT_RECOGNITION', 'DPIIT Startup Recognition', resolveStatus(entity.dpiitVerified, recMap.get('DPIIT_RECOGNITION')), recMap.get('DPIIT_RECOGNITION')),
      buildItem('MSME_UDYAM', 'MSME Udyam Registration', resolveStatus(entity.msmeVerified, recMap.get('MSME_UDYAM')), recMap.get('MSME_UDYAM')),
      buildItem('CORPORATE_WEBSITE', 'Official Corporate Website', entity.website ? 'VERIFIED' : 'NOT_SUBMITTED', recMap.get('CORPORATE_WEBSITE')),
    ];

    const verifiedCount = items.filter((i) => i.status === 'VERIFIED').length;
    const pendingCount = items.filter((i) => i.status === 'PENDING' || i.status === 'UNDER_REVIEW').length;

    let overallStatus = 'UNVERIFIED';
    if (verifiedCount >= 4) overallStatus = 'FULLY_VERIFIED';
    else if (verifiedCount > 0) overallStatus = 'PARTIALLY_VERIFIED';
    else if (pendingCount > 0) overallStatus = 'VERIFICATION_PENDING';

    return NextResponse.json({
      success: true,
      data: {
        entityId,
        overallStatus,
        verifiedCount,
        totalCount: items.length,
        items,
      },
    });
  } catch (error: any) {
    console.error('Error fetching verification status:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/startups/[entityId]/verification
 * Submits evidence for a regulatory verification category (CIN, DPIIT, Udyam, Govt ID).
 * Strictly transitions to 'PENDING' for Admin audit review. Never self-awards 'VERIFIED'.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const { entityId } = params;
    const db = await getDatabase();

    const authCheck = await checkStartupAuth(req, entityId, db);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    // RBAC: Only Owner/Founder, Admin, or members with MANAGE_DOCS permission can submit verification evidence
    if (!authCheck.isOwner && !authCheck.permissions?.includes('MANAGE_DOCS') && !authCheck.permissions?.includes('ADMIN')) {
      return NextResponse.json({ success: false, message: 'Forbidden: Insufficient permissions to submit regulatory verification evidence' }, { status: 403 });
    }

    const userId = authCheck.userId;

    const body = await req.json();
    const { type, documentNumber, documentUrl, documentName, remarks } = body;

    const validTypes: VerificationType[] = [
      'INCORPORATION_MCA',
      'DPIIT_RECOGNITION',
      'MSME_UDYAM',
      'OFFICIAL_EMAIL',
      'FOUNDER_IDENTITY',
      'CORPORATE_WEBSITE',
    ];

    if (!validTypes.includes(type)) {
      return NextResponse.json({ success: false, message: 'Invalid verification type' }, { status: 400 });
    }

    // Format validation if documentNumber is provided
    if (documentNumber) {
      const val = validateIdentifier(type, documentNumber);
      if (!val.valid) {
        return NextResponse.json({ success: false, message: val.error }, { status: 400 });
      }
    }

    const nowIso = new Date().toISOString();
    const verifCol = db.collection('verifications');
    const entitiesCol = db.collection('entities');

    const cleanNum = (documentNumber || '').trim().toUpperCase();

    const recordDoc = {
      id: `verif_${entityId}_${type.toLowerCase()}`,
      entityId,
      userId,
      type,
      status: 'PENDING',
      documentNumber: cleanNum || undefined,
      documentUrl: documentUrl || undefined,
      documentName: documentName || undefined,
      remarks: remarks?.trim() || undefined,
      submittedAt: nowIso,
      updatedAt: nowIso,
    };

    await verifCol.updateOne(
      { entityId, type },
      { $set: recordDoc },
      { upsert: true }
    );

    // Keep entities record in pending review
    const entityUpdate: Record<string, any> = {
      updatedAt: nowIso,
      verificationStatus: 'PENDING',
    };
    if (type === 'INCORPORATION_MCA' && cleanNum) entityUpdate.cin = cleanNum;
    if (type === 'DPIIT_RECOGNITION' && cleanNum) entityUpdate.dpiitNumber = cleanNum;
    if (type === 'MSME_UDYAM' && cleanNum) entityUpdate.udyamNumber = cleanNum;

    await entitiesCol.updateOne({ id: entityId }, { $set: entityUpdate });

    // Audit log submission with masked sensitive document numbers
    try {
      const maskedNum = cleanNum.length > 6 ? `${cleanNum.slice(0, 3)}****${cleanNum.slice(-3)}` : (cleanNum ? '****' : undefined);
      await db.collection('audit_logs').insertOne({
        id: `audit_${Date.now()}`,
        entityId,
        actorId: userId,
        action: 'SUBMIT_VERIFICATION_EVIDENCE',
        details: { type, maskedDocumentNumber: maskedNum },
        timestamp: nowIso,
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Verification evidence submitted successfully. Your submission is now in the queue for Internal Admin audit review.',
      data: recordDoc,
    });
  } catch (error: any) {
    console.error('Error submitting verification evidence:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

function resolveStatus(isDirectlyVerified: boolean | undefined, record: any): 'NOT_SUBMITTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' {
  if (isDirectlyVerified) return 'VERIFIED';
  if (!record) return 'NOT_SUBMITTED';
  const s = String(record.status || '').toUpperCase();
  if (['VERIFIED', 'APPROVED'].includes(s)) return 'VERIFIED';
  if (['REJECTED', 'FAILED'].includes(s)) return 'REJECTED';
  if (['UNDER_REVIEW', 'IN_REVIEW'].includes(s)) return 'UNDER_REVIEW';
  return 'PENDING';
}

function buildItem(
  type: VerificationType,
  title: string,
  status: 'NOT_SUBMITTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED',
  record?: any
): VerificationItem {
  let badgeColor = 'text-gray-500 bg-gray-100 dark:bg-gray-800/50';
  if (status === 'VERIFIED') badgeColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/30';
  else if (status === 'PENDING' || status === 'UNDER_REVIEW') badgeColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30';
  else if (status === 'REJECTED') badgeColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/30';

  return {
    id: `verif_item_${type.toLowerCase()}`,
    type,
    title,
    status,
    documentNumber: record?.documentNumber,
    documentUrl: record?.documentUrl,
    documentName: record?.documentName,
    submittedAt: record?.submittedAt,
    verifiedAt: record?.verifiedAt,
    rejectionReason: record?.rejectionReason,
    verifiedBy: record?.verifiedBy,
    badgeColor,
  };
}
