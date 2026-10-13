import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  extractAuthToken,
  verifyJwtToken,
  requireAuthenticatedUser,
  requireActiveEntityMembership,
  logSecurityAuditEvent,
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/startups/[entityId]/diligence
 * Fetches authoritative Diligence documents, access requests, active access, and audit log.
 * Enforces folder-level RBAC & investor diligence approval using verified sessions.
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
    const auditCol = db.collection('audit_logs');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    // Resolve caller identity through cryptographically verified session token ONLY
    let verifiedUserId: string | null = null;
    let isAuthorizedMember = false;
    let approvedGrant: any = null;

    const token = extractAuthToken(req);
    if (token) {
      const payload = verifyJwtToken(token);
      if (payload?.sub) {
        verifiedUserId = payload.sub;
        const memRes = await requireActiveEntityMembership(payload.sub, entityId);
        if (!('error' in memRes)) {
          const { isHead, permissions, role } = memRes;
          isAuthorizedMember =
            isHead ||
            permissions.includes('OWNER') ||
            permissions.includes('ADMIN') ||
            permissions.includes('MANAGE_DOCS') ||
            role === 'Owner' ||
            role === 'Admin';
        }

        if (!isAuthorizedMember && verifiedUserId) {
          approvedGrant = await requestsCol.findOne({
            entityId,
            requesterId: verifiedUserId,
            status: 'Approved',
          });
        }
      }
    }

    // 1. Fetch Documents belonging to this entity
    const allDocs = await docsCol.find({ entityId }).sort({ createdAt: -1, updatedDate: -1 }).toArray();
    const cleanDocs = allDocs.map((d) => {
      const { _id, ...rest } = d;
      return rest;
    });

    // Authorized internal team members view full DD locker management
    if (isAuthorizedMember) {
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

    // Approved external visitors view ONLY folders they were explicitly granted
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

    // Unapproved visitor: NEVER expose confidential documents, access requests, or audit logs
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
 * STRICT ENFORCEMENT: All actions authenticate through verified server sessions.
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

    // Step 1: Enforce cryptographically verified server-side identity
    const authRes = await requireAuthenticatedUser(req);
    if ('error' in authRes) {
      return authRes.error;
    }
    const user = authRes.user;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 422 });
    }

    const action = body.action;
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

    // 1. SYNC_ALL: Prohibited legacy mass-sync to prevent state corruption
    if (action === 'SYNC_ALL') {
      await logSecurityAuditEvent('PROHIBITED_DD_SYNC_ATTEMPT', 'WARNING', {
        userId: user.id,
        entityId,
      });
      return NextResponse.json(
        {
          success: false,
          message:
            'Arbitrary mass DD synchronization is disabled in Phase 1 to prevent authoritative document state corruption.',
        },
        { status: 422 }
      );
    }

    // 2. APPROVE_REQUEST: Transitional Fail-Closed Enforcement (SEC-03)
    // Under Xentro V1 policy: Only Startup Entity Head operating through Entity Master Access
    // may approve external DD Locker access. Since Entity Master Login is deferred to Phase 2,
    // Phase 1 strictly fails closed to protect confidential deal and cap-table data.
    if (action === 'APPROVE_REQUEST') {
      await logSecurityAuditEvent('DENIED_DD_APPROVAL_ATTEMPT', 'WARNING', {
        userId: user.id,
        userEmail: user.email,
        entityId,
        requestId: body.requestId,
        policyReason: 'Entity Master Access required for external DD Locker approval. Transitional fail-closed.',
      });

      return NextResponse.json(
        {
          success: false,
          message:
            'External DD Locker access approval requires verified Entity Master Access. Approval is transitional fail-closed in Phase 1 to protect confidential assets. Existing pending requests are safely preserved.',
          code: 'MASTER_ACCESS_REQUIRED',
        },
        { status: 403 }
      );
    }

    // 3. REQUEST_ACCESS: Authenticated user requests access to DD Locker
    if (action === 'REQUEST_ACCESS') {
      const requestRecord = {
        id: body.id || `req_${Date.now()}`,
        entityId,
        requesterId: user.id, // Strictly bind to authenticated user identity
        requesterEmail: user.email,
        userName: body.userName || user.fullName || 'Investor',
        userRole: String(body.userRole || 'Partner').slice(0, 50),
        organization: String(body.organization || 'Investment Organization').slice(0, 100),
        userType: String(body.userType || 'Investor').slice(0, 50),
        avatar: body.avatar || '/xentro-logo.png',
        requestedDate:
          body.requestedDate ||
          new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        requestedFolders: Array.isArray(body.requestedFolders)
          ? body.requestedFolders.map(String)
          : ['Corporate', 'Financial', 'Legal'],
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
        actorId: user.id,
        action: 'DD_REQUEST_ACCESS',
        details: {
          actionLabel: 'Requested DD Access',
          userName: requestRecord.userName,
          organization: requestRecord.organization,
        },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, data: requestRecord }, { status: 201 });
    }

    // Operations below (UPLOAD, DELETE, REJECT, REVOKE) require active authorized entity membership
    const memRes = await requireActiveEntityMembership(user.id, entityId);
    if ('error' in memRes) {
      await logSecurityAuditEvent('UNAUTHORIZED_DD_MUTATION_ATTEMPT', 'WARNING', {
        userId: user.id,
        entityId,
        action,
      });
      return memRes.error;
    }
    const { isHead, permissions } = memRes;
    const canManageDocs =
      isHead ||
      permissions.includes('OWNER') ||
      permissions.includes('ADMIN') ||
      permissions.includes('MANAGE_DOCS');

    if (!canManageDocs) {
      return NextResponse.json(
        { success: false, message: 'Forbidden. You lack permission to manage DD locker documents or access.' },
        { status: 403 }
      );
    }

    // 4. UPLOAD_DOCUMENT
    if (action === 'UPLOAD_DOCUMENT') {
      const doc = body.document;
      if (!doc || typeof doc !== 'object' || !doc.name || !doc.folder) {
        return NextResponse.json(
          { success: false, message: 'Valid document name and folder are required' },
          { status: 422 }
        );
      }

      const docRecord = {
        id: doc.id || `doc_${Date.now()}`,
        entityId,
        name: String(doc.name).slice(0, 200),
        folder: String(doc.folder).slice(0, 100),
        fileSize: String(doc.fileSize || '1.0 MB').slice(0, 20),
        updatedDate: doc.updatedDate || 'Just now',
        fileType: String(doc.fileType || 'PDF').slice(0, 10),
        isConfidential: doc.isConfidential !== undefined ? Boolean(doc.isConfidential) : true,
        fileUrl: String(doc.fileUrl || ''),
        uploadedBy: user.id,
        createdAt: nowIso,
        updatedAt: nowIso,
      };

      await docsCol.updateOne(
        { entityId, id: docRecord.id },
        { $set: docRecord },
        { upsert: true }
      );

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.fullName || 'Member',
        action: 'DD_UPLOAD_DOCUMENT',
        details: {
          actionLabel: 'Uploaded Document',
          documentName: docRecord.name,
          folder: docRecord.folder,
          isConfidential: docRecord.isConfidential,
        },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, data: docRecord }, { status: 201 });
    }

    // 5. DELETE_DOCUMENT
    if (action === 'DELETE_DOCUMENT') {
      const documentId = body.documentId;
      if (!documentId) {
        return NextResponse.json({ success: false, message: 'Document ID is required' }, { status: 422 });
      }

      const existingDoc = await docsCol.findOne({ entityId, id: documentId });
      if (!existingDoc) {
        return NextResponse.json({ success: false, message: 'Document not found in organization' }, { status: 404 });
      }

      await docsCol.deleteOne({ entityId, id: documentId });

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: user.id,
        actorEmail: user.email,
        actorName: user.fullName || 'Member',
        action: 'DD_DELETE_DOCUMENT',
        details: {
          actionLabel: 'Deleted Document',
          documentName: existingDoc.name,
        },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Document deleted successfully' });
    }

    // 6. REJECT_REQUEST
    if (action === 'REJECT_REQUEST') {
      const requestId = body.requestId;
      if (!requestId) {
        return NextResponse.json({ success: false, message: 'Request ID is required' }, { status: 422 });
      }

      await requestsCol.updateOne(
        { entityId, id: requestId },
        { $set: { status: 'Rejected', updatedAt: nowIso, reviewedBy: user.id } }
      );

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: user.id,
        action: 'DD_REJECT_ACCESS',
        details: { actionLabel: 'Rejected DD Access', requestId },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Access request rejected' });
    }

    // 7. REVOKE_ACCESS
    if (action === 'REVOKE_ACCESS') {
      const requestId = body.requestId;
      if (!requestId) {
        return NextResponse.json({ success: false, message: 'Request ID is required' }, { status: 422 });
      }

      await requestsCol.updateOne(
        { entityId, id: requestId },
        { $set: { status: 'Revoked', updatedAt: nowIso, revokedBy: user.id } }
      );

      await auditCol.insertOne({
        id: `audit_dd_${Date.now()}`,
        entityId,
        actorId: user.id,
        action: 'DD_REVOKE_ACCESS',
        details: { actionLabel: 'Revoked DD Access', requestId },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Access revoked successfully' });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 422 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error processing DD action' },
      { status: 500 }
    );
  }
}
