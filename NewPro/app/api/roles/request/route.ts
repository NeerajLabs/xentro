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
    const userName = req.headers.get('x-user-name') || body.userName || body.name || 'Ecosystem Member';
    const currentRole = body.currentRole || 'Explorer';
    const requestedRole = String(body.requestedRole || body.targetRole || '').trim();
    const reason = String(body.reason || '').trim();
    const entityDetails = body.entityDetails || {};

    if (!requestedRole) {
      return NextResponse.json({ success: false, message: 'Requested role is required' }, { status: 400 });
    }

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, message: 'Authenticated user session is required' },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const roleReqCol = db.collection('role_requests');
    const notifCol = db.collection('notifications');

    const requestId = `REQ-${Date.now().toString().slice(-6)}`;
    const nowIso = new Date().toISOString();

    const requestDoc = {
      id: requestId,
      requestId,
      userId: String(userId),
      userEmail: String(userEmail).trim().toLowerCase(),
      userName: String(userName),
      currentRole: String(currentRole),
      requestedRole,
      reason,
      entityDetails,
      status: 'PENDING', // STRICT SECURITY: Must not grant role requiring approval before admin approval
      adminNotes: '',
      decisionBy: '',
      decisionDate: null,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await roleReqCol.insertOne(requestDoc);

    // 1. Email user when request is received, explaining it will be reviewed
    if (userEmail && userEmail.includes('@')) {
      try {
        await sendZohoEmail({
          to: userEmail.trim().toLowerCase(),
          subject: `XENTRO: Role Request Received (${requestedRole}) - Under Review`,
          text: `Dear ${userName},\n\nYour application to add or change your participation type to "${requestedRole}" has been received by XENTRO Platform Operations.\n\nApplication Details:\n- Reference ID: ${requestId}\n- Requested Role: ${requestedRole}\n- Current Role: ${currentRole}\n- Status: UNDER ADMINISTRATIVE REVIEW\n\nYour request has been received and will be reviewed within a few hours by our platform administrators. You will be notified by email as soon as a decision is made.\n\nThank you for growing with the Xentro Ecosystem.\n\nWarm regards,\nXENTRO Ecosystem Operations & Administration\nhttps://xentro.in`,
        });
      } catch (emailErr) {
        console.warn('[RoleRequest] Zoho email dispatch error:', emailErr);
      }
    }

    // 2. Insert in-app notification in MongoDB
    try {
      await notifCol.insertOne({
        id: `notif_${Date.now()}`,
        userId: String(userId),
        userEmail: String(userEmail).toLowerCase(),
        type: 'ROLE_REQUEST_RECEIVED',
        title: 'Role Request Received',
        message: `Your request for the "${requestedRole}" role (#${requestId}) is currently under review by platform administrators.`,
        isRead: false,
        createdAt: nowIso,
      });
    } catch (notifErr) {
      console.warn('[RoleRequest] In-app notification error:', notifErr);
    }

    delete (requestDoc as any)._id;

    return NextResponse.json(
      {
        success: true,
        message: `Role request #${requestId} submitted successfully. Your application is under review.`,
        data: {
          request: requestDoc,
        },
        source: 'mongodb-atlas',
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('[RoleRequest POST] Error:', err);
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to submit role request' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = req.headers.get('x-user-id') || searchParams.get('userId') || '';
    const userEmail = req.headers.get('x-user-email') || searchParams.get('email') || '';

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, message: 'User identification required' },
        { status: 401 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const roleReqCol = db.collection('role_requests');

    const queryConditions: any[] = [];
    if (userId) queryConditions.push({ userId });
    if (userEmail) {
      queryConditions.push({
        userEmail: { $regex: `^${userEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
      });
    }

    const docs = await roleReqCol.find({ $or: queryConditions }).sort({ createdAt: -1 }).toArray();

    const cleanDocs = docs.map((doc: any) => {
      const { _id, ...clean } = doc;
      return clean;
    });

    return NextResponse.json({
      success: true,
      message: 'Success',
      data: {
        requests: cleanDocs,
        count: cleanDocs.length,
      },
      requests: cleanDocs,
      count: cleanDocs.length,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to fetch role requests' },
      { status: 500 }
    );
  }
}
