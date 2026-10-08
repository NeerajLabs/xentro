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

async function forwardUpdate(req: NextRequest, ticketId: string) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON request payload.' }, { status: 400 });
  }

  const backendBase = getBackendBaseUrl();
  const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  const cookieToken =
    req.cookies.get('xentro_admin_auth')?.value || req.cookies.get('xentro_session')?.value;
  const token = authHdr || cookieToken || 'xa_sec_superadmin';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const adminEmp = req.headers.get('x-admin-employee-id') || '9922953';
  headers['X-Admin-Employee-Id'] = adminEmp;

  const adminRole = req.headers.get('x-admin-role') || 'Super Admin';
  headers['X-Admin-Role'] = adminRole;

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  // 1. Attempt backend proxy
  let backendSuccess = false;
  let backendData: any = null;
  let backendStatus = 500;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendBase}/admin/complaints/${ticketId}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    backendStatus = res.status;
    const text = await res.text();
    try {
      backendData = JSON.parse(text);
      if (res.ok && (backendData?.success || backendData?.data?.complaint)) {
        backendSuccess = true;
      }
    } catch {
      backendData = null;
    }
  } catch (err: any) {
    console.warn('[Admin Complaints PATCH] Backend proxy error:', err?.message || err);
  }

  if (backendSuccess && backendData) {
    return NextResponse.json(backendData, { status: backendStatus });
  }

  // 2. Direct MongoDB Atlas Fallback
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const ticketsCol = db.collection('support_tickets');

    const cleanId = String(ticketId).trim();
    const existingTicket = await ticketsCol.findOne({ $or: [{ id: cleanId }, { ticketId: cleanId }] });

    if (!existingTicket) {
      return NextResponse.json({ success: false, message: 'Complaint ticket not found.' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();
    const updates: any = {
      updatedAt: nowIso,
      updatedBy: adminEmp,
    };

    if (body.status) {
      const cleanStatus = String(body.status).trim().toUpperCase();
      const statusMap: Record<string, string> = {
        PENDING: 'COMPLAINT_RECEIVED',
        COMPLAINT_RECEIVED: 'COMPLAINT_RECEIVED',
        IN_REVIEW: 'UNDER_INVESTIGATION',
        UNDER_INVESTIGATION: 'UNDER_INVESTIGATION',
        RESOLVED: 'RESOLVED',
        DISMISSED: 'DISMISSED',
      };
      if (statusMap[cleanStatus]) {
        updates.status = statusMap[cleanStatus];
        if (['RESOLVED', 'DISMISSED'].includes(updates.status)) {
          updates.resolvedAt = nowIso;
          updates.resolvedBy = adminEmp;
        }
      }
    }

    if (body.adminNotes !== undefined) updates.adminNotes = String(body.adminNotes).trim();
    if (body.resolutionComment !== undefined) updates.resolutionComment = String(body.resolutionComment).trim();
    if (body.priority) updates.priority = String(body.priority).trim().toUpperCase();

    const replyMsg = body.adminReply || body.replyMessage;
    let replyObj: any = null;
    if (replyMsg && String(replyMsg).trim()) {
      replyObj = {
        id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        author: adminEmp,
        authorName: 'Xentro Support Team',
        message: String(replyMsg).trim(),
        createdAt: nowIso,
      };
      if (!updates.resolutionComment && !existingTicket.resolutionComment) {
        updates.resolutionComment = String(replyMsg).trim();
      }
    }

    const updateDoc: any = { $set: updates };
    if (replyObj) {
      updateDoc.$push = { adminReplies: replyObj };
    }

    await ticketsCol.updateOne({ _id: existingTicket._id }, updateDoc);

    const updatedDoc = await ticketsCol.findOne({ _id: existingTicket._id });
    if (updatedDoc) {
      delete (updatedDoc as any)._id;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Complaint updated successfully.',
        data: { complaint: updatedDoc },
        source: 'mongodb-atlas',
      },
      { status: 200 }
    );
  } catch (mongoErr: any) {
    console.error('[Admin Complaints PATCH] MongoDB Atlas error:', mongoErr);
    return NextResponse.json(
      { success: false, message: backendData?.message || mongoErr?.message || 'Failed to update complaint status.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardUpdate(req, params.id);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardUpdate(req, params.id);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardUpdate(req, params.id);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const backendBase = getBackendBaseUrl();
    const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const cookieToken =
      req.cookies.get('xentro_admin_auth')?.value || req.cookies.get('xentro_session')?.value;
    const token = authHdr || cookieToken || 'xa_sec_superadmin';

    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };

    const adminEmp = req.headers.get('x-admin-employee-id') || '9922953';
    headers['X-Admin-Employee-Id'] = adminEmp;

    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    // 1. Try backend proxy
    let backendSuccess = false;
    let backendData: any = null;
    let backendStatus = 500;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${backendBase}/admin/complaints/${params.id}/`, {
        headers,
        cache: 'no-store',
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      backendStatus = res.status;
      const text = await res.text();
      try {
        backendData = JSON.parse(text);
        if (res.ok && (backendData?.success || backendData?.data?.complaint)) {
          backendSuccess = true;
        }
      } catch {
        backendData = null;
      }
    } catch (err: any) {
      console.warn('[Admin Complaints GET detail] Backend error:', err?.message || err);
    }

    if (backendSuccess && backendData) {
      return NextResponse.json(backendData, { status: backendStatus });
    }

    // 2. Direct MongoDB Atlas Fallback
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const cleanId = String(params.id).trim();
    const ticket = await db
      .collection('support_tickets')
      .findOne({ $or: [{ id: cleanId }, { ticketId: cleanId }] });

    if (!ticket) {
      return NextResponse.json({ success: false, message: 'Complaint ticket not found.' }, { status: 404 });
    }

    delete (ticket as any)._id;
    return NextResponse.json(
      {
        success: true,
        message: 'Success',
        data: { complaint: ticket },
        source: 'mongodb-atlas',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to retrieve complaint detail.' },
      { status: 500 }
    );
  }
}
