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

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Formats a MongoDB support ticket into the canonical user-facing contract and strips internal notes */
function formatUserTicket(t: any): any {
  const { _id, adminNotes, ...clean } = t;
  const rawStatus = String(clean.status || 'COMPLAINT_RECEIVED').toUpperCase();
  let userFacingStatus = 'Complaint sent';
  let stage = 1;

  if (rawStatus === 'COMPLAINT_RECEIVED' || rawStatus === 'PENDING') {
    userFacingStatus = 'Complaint sent';
    stage = 1;
  } else if (rawStatus === 'UNDER_INVESTIGATION' || rawStatus === 'IN_REVIEW') {
    userFacingStatus = 'Under investigation';
    stage = 2;
  } else if (rawStatus === 'RESOLVED') {
    userFacingStatus = 'Resolved';
    stage = 3;
  } else if (rawStatus === 'DISMISSED') {
    userFacingStatus = 'Resolved';
    stage = 3;
  } else {
    userFacingStatus = 'Complaint sent';
    stage = 1;
  }

  let resolutionComment = clean.resolutionComment || '';
  if (!resolutionComment && rawStatus === 'DISMISSED') {
    resolutionComment = 'Case reviewed and closed by platform operations.';
  }

  const idVal = clean.id || clean.ticketId || clean.referenceId || String(_id);

  return {
    id: idVal,
    ticketId: idVal,
    referenceId: clean.referenceId || idVal,
    accountId: clean.accountId || clean.userId,
    userId: clean.userId || clean.accountId,
    userName: clean.userName || 'Ecosystem Member',
    userEmail: clean.userEmail || '',
    userRole: clean.userRole || 'Explorer',
    subject: clean.subject || '',
    category: clean.category || 'General Support',
    priority: clean.priority || 'NORMAL',
    message: clean.message || '',
    status: rawStatus,
    userFacingStatus,
    stage,
    resolutionComment,
    adminReplies: Array.isArray(clean.adminReplies) ? clean.adminReplies : [],
    submittedAt: clean.submittedAt || clean.createdAt || new Date().toISOString(),
    createdAt: clean.createdAt || clean.submittedAt || new Date().toISOString(),
    updatedAt: clean.updatedAt || clean.createdAt || new Date().toISOString(),
    resolvedAt: clean.resolvedAt || null,
    resolvedBy: clean.resolvedBy || null,
  };
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON request payload.' }, { status: 400 });
  }

  const backendBase = getBackendBaseUrl();
  const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  const cookieToken = req.cookies.get('xentro_session')?.value;
  const token = authHdr || cookieToken;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const xUserId = req.headers.get('x-user-id') || body.userId || body.accountId;
  if (xUserId) headers['X-User-Id'] = String(xUserId);
  const xUserEmail = req.headers.get('x-user-email') || body.userEmail;
  if (xUserEmail) headers['X-User-Email'] = String(xUserEmail);
  const xUserName = req.headers.get('x-user-name') || body.userName;
  if (xUserName) headers['X-User-Name'] = String(xUserName);

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  // 1. Attempt backend proxy first
  let backendSuccess = false;
  let backendData: any = null;
  let backendStatus = 500;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendBase}/support/complaints/`, {
      method: 'POST',
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
      if (res.ok && (backendData?.success || backendData?.data?.referenceId || backendData?.referenceId)) {
        backendSuccess = true;
      }
    } catch {
      backendData = null;
    }
  } catch (err: any) {
    console.warn('[Support Complaints POST] Backend proxy unavailable:', err?.message || err);
  }

  if (backendSuccess && backendData) {
    return NextResponse.json(backendData, { status: backendStatus });
  }

  // 2. Direct MongoDB Atlas Fallback
  try {
    const subject = String(body.subject || '').trim();
    const message = String(body.message || '').trim();
    if (!subject || !message) {
      return NextResponse.json(
        { success: false, message: 'Both subject and detailed complaint message are required.' },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const ticketsCol = db.collection('support_tickets');

    const ticketId = `CMP-${Math.floor(100000 + Math.random() * 900000)}`;
    const nowIso = new Date().toISOString();
    const accountId = String(body.accountId || body.userId || xUserId || 'XU-ANON').trim();
    const userEmail = String(body.userEmail || xUserEmail || '').trim();
    const userName = String(body.userName || xUserName || 'Ecosystem Member').trim();
    const userRole = String(body.userRole || 'Explorer').trim();
    const category = String(body.category || 'Platform Issue').trim();
    const priority = ['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(String(body.priority).toUpperCase())
      ? String(body.priority).toUpperCase()
      : 'NORMAL';

    const newTicketDoc = {
      id: ticketId,
      ticketId,
      referenceId: ticketId,
      accountId,
      userId: accountId,
      userName,
      userEmail,
      userRole,
      subject,
      category,
      priority,
      message,
      status: 'COMPLAINT_RECEIVED',
      adminNotes: '',
      resolutionComment: '',
      adminReplies: [],
      submittedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
      updatedBy: '',
      resolvedAt: null,
      resolvedBy: null,
    };

    await ticketsCol.insertOne(newTicketDoc);
    const formatted = formatUserTicket(newTicketDoc);

    return NextResponse.json(
      {
        success: true,
        message: `Support complaint #${ticketId} created successfully.`,
        data: {
          ticket: formatted,
          referenceId: ticketId,
          status: formatted.userFacingStatus,
        },
        ticket: formatted,
        referenceId: ticketId,
        status: formatted.userFacingStatus,
        source: 'mongodb-atlas',
      },
      { status: 201 }
    );
  } catch (mongoErr: any) {
    console.error('[Support Complaints POST] MongoDB Atlas error:', mongoErr);
    return NextResponse.json(
      { success: false, message: backendData?.message || mongoErr?.message || 'Failed to submit the request.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const backendBase = getBackendBaseUrl();
  const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  const cookieToken = req.cookies.get('xentro_session')?.value;
  const token = authHdr || cookieToken;

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const xUserId = req.headers.get('x-user-id') || searchParams.get('userId') || searchParams.get('accountId');
  if (xUserId) headers['X-User-Id'] = xUserId;
  const xUserEmail = req.headers.get('x-user-email') || searchParams.get('email');
  if (xUserEmail) headers['X-User-Email'] = xUserEmail;
  const xUserName = req.headers.get('x-user-name');
  if (xUserName) headers['X-User-Name'] = xUserName;

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  // 1. Attempt backend proxy first
  let backendSuccess = false;
  let backendData: any = null;
  let backendStatus = 500;

  try {
    const url = new URL(`${backendBase}/support/complaints/`);
    searchParams.forEach((val, key) => url.searchParams.set(key, val));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    backendStatus = res.status;
    const text = await res.text();
    try {
      backendData = JSON.parse(text);
      if (
        res.ok &&
        (backendData?.success ||
          Array.isArray(backendData?.data?.tickets) ||
          Array.isArray(backendData?.tickets))
      ) {
        backendSuccess = true;
      }
    } catch {
      backendData = null;
    }
  } catch (err: any) {
    console.warn('[Support Complaints GET] Backend proxy error:', err?.message || err);
  }

  if (backendSuccess && backendData) {
    return NextResponse.json(backendData, { status: backendStatus });
  }

  // 2. Direct MongoDB Atlas Fallback
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const ticketsCol = db.collection('support_tickets');

    const matchedIds = Array.from(
      new Set(
        [xUserId, searchParams.get('accountId'), searchParams.get('userId')].filter(Boolean) as string[]
      )
    );

    const matchedEmails = Array.from(
      new Set([xUserEmail, searchParams.get('email')].filter(Boolean) as string[])
    );

    if (matchedIds.length === 0 && matchedEmails.length === 0) {
      return NextResponse.json(
        { success: false, message: 'User identification is required to retrieve support tickets.' },
        { status: 401 }
      );
    }

    const queryConditions: any[] = [];
    matchedIds.forEach((id) => {
      queryConditions.push({ accountId: id });
      queryConditions.push({ userId: id });
      queryConditions.push({ id: id });
    });

    matchedEmails.forEach((email) => {
      queryConditions.push({
        userEmail: { $regex: `^${escapeRegex(email)}$`, $options: 'i' },
      });
    });

    const docs = await ticketsCol.find({ $or: queryConditions }).sort({ createdAt: -1 }).toArray();
    const formattedTickets = docs.map(formatUserTicket);

    return NextResponse.json(
      {
        success: true,
        message: 'Success',
        data: {
          tickets: formattedTickets,
          count: formattedTickets.length,
        },
        tickets: formattedTickets,
        count: formattedTickets.length,
        source: 'mongodb-atlas',
      },
      { status: 200 }
    );
  } catch (mongoErr: any) {
    console.error('[Support Complaints GET] MongoDB Atlas error:', mongoErr);
    return NextResponse.json(
      { success: false, message: backendData?.message || mongoErr?.message || 'Failed to retrieve tickets.' },
      { status: 500 }
    );
  }
}
