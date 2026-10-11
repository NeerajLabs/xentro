import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/startups/[entityId]/diligence
 * Fetches authoritative Diligence documents, access requests, active access, and audit log.
 * Enforces folder-level RBAC & investor diligence approval.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const entityId = params?.entityId?.trim();
    if (!entityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const docsCol = db.collection('diligence_documents');
    const requestsCol = db.collection('diligence_access_requests');
    const membershipsCol = db.collection('memberships');
    const auditCol = db.collection('audit_logs');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';

    // Check Authorization
    let isAuthorizedMember = false;
    let approvedGrant: any = null;

    if (userId) {
      if (
        entity.createdByUserId === userId ||
        entity.currentOwnerUserId === userId ||
        entity.primaryOwnerId === userId
      ) {
        isAuthorizedMember = true;
      } else {
        const membership = await membershipsCol.findOne({
          entityId,
          userId,
          status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
        });
        if (membership) {
          const perms: string[] = membership.permissions || [];
          isAuthorizedMember =
            perms.includes('OWNER') ||
            perms.includes('ADMIN') ||
            perms.includes('MANAGE_DOCS') ||
            membership.role === 'Owner' ||
            membership.role === 'Admin';
        }
      }

      if (!isAuthorizedMember) {
        approvedGrant = await requestsCol.findOne({
          entityId,
          requesterId: userId,
          status: 'Approved',
        });
      }
    }

    // 1. Fetch Documents
    const allDocs = await docsCol.find({ entityId }).sort({ createdAt: -1, updatedDate: -1 }).toArray();
    const cleanDocs = allDocs.map((d) => {
      const { _id, ...rest } = d;
      return rest;
    });

    if (isAuthorizedMember) {
      // Return full control view
      const allRequests = await requestsCol.find({ entityId }).sort({ requestedDate: -1 }).toArray();
      const cleanRequests = allRequests.map((r) => {
        const { _id, ...rest } = r;
        return rest;
      });

      const pendingRequests = cleanRequests.filter((r) => r.status === 'Pending');
      const activeAccess = cleanRequests
        .filter((r) => r.status === 'Approved')
        .map((r) => ({
          id: r.id,
          userName: r.userName || r.requesterName,
          organization: r.organization || r.requesterOrg,
          grantedFolders: r.grantedFolders || [],
          dateGranted: r.dateGranted || r.updatedAt || 'Recently',
          expiryDate: r.expiryDate || r.validUntil || 'Never',
          status: 'Active',
        }));

      const auditLogs = await auditCol
        .find({ entityId, action: { $regex: '^DD_' } })
        .sort({ timestamp: -1 })
        .limit(50)
        .toArray();

      const cleanAudit = auditLogs.map((a) => ({
        id: a.id,
        userName: a.actorName || a.details?.userName || 'User',
        organization: a.details?.organization || entity.name,
        action: a.details?.actionLabel || a.action.replace('DD_', '').replace('_', ' '),
        documentName: a.details?.documentName || 'DD Room',
        timestamp: a.timestamp || 'Recently',
      }));

      return NextResponse.json({
        success: true,
        data: {
          documents: cleanDocs,
          accessRequests: pendingRequests,
          activeAccess,
          auditLog: cleanAudit,
        },
        meta: { isAuthorizedMember: true },
        source: 'mongodb-atlas',
      });
    }

    // If external approved visitor
    if (approvedGrant) {
      const allowedFolders: string[] = approvedGrant.grantedFolders || [];
      const accessibleDocs = cleanDocs.filter((d) => allowedFolders.includes(d.folder));

      return NextResponse.json({
        success: true,
        data: {
          documents: accessibleDocs,
          accessRequests: [],
          activeAccess: [],
          auditLog: [],
        },
        meta: {
          isAuthorizedMember: false,
          isApprovedVisitor: true,
          grantedFolders: allowedFolders,
        },
      });
    }

    // Unapproved visitor
    return NextResponse.json({
      success: true,
      data: {
        documents: cleanDocs.filter((d) => !d.isConfidential),
        accessRequests: [],
        activeAccess: [],
        auditLog: [],
      },
      meta: {
        isAuthorizedMember: false,
        isApprovedVisitor: false,
        requiresAccessRequest: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error fetching DD locker' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/startups/[entityId]/diligence
 * Handles document upload, deletion, access requests, approvals, and audits.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const entityId = params?.entityId?.trim();
    if (!entityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const action = body.action;
    const userId = req.headers.get('x-user-id') || body.userId || '';
    const userEmail = req.headers.get('x-user-email') || body.userEmail || '';

    const db = await getDatabase();
    const entitiesCol = db.collection('entities');
    const docsCol = db.collection('diligence_documents');
    const requestsCol = db.collection('diligence_access_requests');
    const auditCol = db.collection('audit_logs');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    // 1. SYNC_ALL (Mass sync from local state to MongoDB Atlas)
    if (action === 'SYNC_ALL') {
      if (Array.isArray(body.documents)) {
        for (const doc of body.documents) {
          if (!doc || !doc.id) continue;
          await docsCol.updateOne(
            { entityId, id: doc.id },
            {
              $set: {
                ...doc,
                entityId,
                updatedAt: nowIso,
              },
            },
            { upsert: true }
          );
        }
      }

      if (Array.isArray(body.accessRequests)) {
        for (const req of body.accessRequests) {
          if (!req || !req.id) continue;
          await requestsCol.updateOne(
            { entityId, id: req.id },
            {
              $set: {
                ...req,
                entityId,
                updatedAt: nowIso,
              },
            },
            { upsert: true }
          );
        }
      }

      return NextResponse.json({ success: true, message: 'DD locker synced to MongoDB successfully' });
    }

    // 2. UPLOAD_DOCUMENT
    if (action === 'UPLOAD_DOCUMENT') {
      const doc = body.document;
      if (!doc || !doc.name || !doc.folder) {
        return NextResponse.json({ success: false, message: 'Valid document details required' }, { status: 400 });
      }

      const docRecord = {
        id: doc.id || `doc_${Date.now()}`,
        entityId,
        name: doc.name,
        folder: doc.folder,
        fileSize: doc.fileSize || '1.5 MB',
        updatedDate: doc.updatedDate || 'Just now',
        fileType: doc.fileType || 'PDF',
        isConfidential: doc.isConfidential !== undefined ? doc.isConfidential : true,
        fileUrl: doc.fileUrl || '',
        uploadedBy: userId,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await docsCol.updateOne(
        { entityId, id: docRecord.id },
        { $set: docRecord },
        { upsert: true }
      );

      // Audit Log
      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: userId,
        actorEmail: userEmail,
        actorName: body.actorName || 'Founder',
        action: 'DD_UPLOAD_DOCUMENT',
        details: {
          actionLabel: 'Uploaded Document',
          documentName: docRecord.name,
          folder: docRecord.folder,
          organization: body.organization || entity.name,
        },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, data: docRecord });
    }

    // 3. DELETE_DOCUMENT
    if (action === 'DELETE_DOCUMENT') {
      const documentId = body.documentId;
      if (!documentId) {
        return NextResponse.json({ success: false, message: 'Document ID is required' }, { status: 400 });
      }

      await docsCol.deleteOne({ entityId, id: documentId });

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: userId,
        actorEmail: userEmail,
        actorName: body.actorName || 'Founder',
        action: 'DD_DELETE_DOCUMENT',
        details: {
          actionLabel: 'Deleted Document',
          documentName: body.documentName || documentId,
          organization: body.organization || entity.name,
        },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Document deleted' });
    }

    // 4. REQUEST_ACCESS
    if (action === 'REQUEST_ACCESS') {
      const requestRecord = {
        id: body.id || `req_${Date.now()}`,
        entityId,
        requesterId: userId,
        userName: body.userName || 'Investor',
        userRole: body.userRole || 'Partner',
        organization: body.organization || 'Venture Capital',
        userType: body.userType || 'Investor',
        avatar: body.avatar || '/xentro-logo.png',
        requestedDate: body.requestedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        requestedFolders: body.requestedFolders || ['Corporate', 'Financial', 'Legal'],
        status: 'Pending',
        createdAt: nowIso,
      };

      await requestsCol.updateOne(
        { entityId, id: requestRecord.id },
        { $set: requestRecord },
        { upsert: true }
      );

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: userId,
        action: 'DD_REQUEST_ACCESS',
        details: {
          actionLabel: 'Requested DD Access',
          userName: requestRecord.userName,
          organization: requestRecord.organization,
        },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, data: requestRecord });
    }

    // 5. APPROVE_REQUEST
    if (action === 'APPROVE_REQUEST') {
      const requestId = body.requestId;
      const grantedFolders = body.grantedFolders || ['Corporate', 'Financial'];
      const expiryDate = body.expiryDate || '30 Days';

      await requestsCol.updateOne(
        { entityId, id: requestId },
        {
          $set: {
            status: 'Approved',
            grantedFolders,
            expiryDate,
            dateGranted: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            approvedBy: userId,
            updatedAt: nowIso,
          },
        }
      );

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: userId,
        action: 'DD_GRANT_ACCESS',
        details: {
          actionLabel: 'Approved DD Access',
          grantedFolders,
          requestId,
        },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Access granted' });
    }

    // 6. REJECT_REQUEST
    if (action === 'REJECT_REQUEST') {
      const requestId = body.requestId;
      await requestsCol.updateOne(
        { entityId, id: requestId },
        { $set: { status: 'Rejected', updatedAt: nowIso } }
      );

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: userId,
        action: 'DD_REJECT_ACCESS',
        details: { actionLabel: 'Rejected DD Access', requestId },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Access rejected' });
    }

    // 7. REVOKE_ACCESS
    if (action === 'REVOKE_ACCESS') {
      const requestId = body.requestId;
      await requestsCol.updateOne(
        { entityId, id: requestId },
        { $set: { status: 'Revoked', updatedAt: nowIso } }
      );

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: userId,
        action: 'DD_REVOKE_ACCESS',
        details: { actionLabel: 'Revoked DD Access', requestId },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Access revoked' });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error processing DD action' },
      { status: 500 }
    );
  }
}
