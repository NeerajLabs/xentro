import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
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
    const body = await req.json();
    const { id, action, notes, reviewerName } = body;
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
            identityReviewedBy: reviewerName || 'ADMIN_CONSOLE',
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
        performedBy: reviewerName || 'ADMIN_CONSOLE',
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
      await entitiesCol.updateOne(
        { id: entityId },
        {
          $set: {
            verificationStatus: targetStatus,
            ownerApprovalStatus: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
            verifiedBy: reviewerName || 'ADMIN_CONSOLE',
            verifiedAt: now,
            rejectionReason: notes || '',
            updatedAt: now,
          },
        }
      );

      await auditCol.insertOne({
        action: `ENTITY_VERIFICATION_${action}`,
        entityId,
        status: targetStatus,
        performedBy: reviewerName || 'ADMIN_CONSOLE',
        notes: notes || '',
        timestamp: now,
      });

      return NextResponse.json({
        success: true,
        message: `Entity verification marked as ${targetStatus}.`,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid verification ID' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating verification request:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
