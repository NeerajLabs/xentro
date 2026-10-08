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

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const requestId = params.id;
    const status = String(body.status || '').trim().toUpperCase();
    const adminNotes = String(body.adminNotes || body.reason || '').trim();
    const decisionBy = String(body.decisionBy || 'Xentro Operations Admin').trim();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Status must be APPROVED or REJECTED' },
        { status: 400 }
      );
    }

    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const roleReqCol = db.collection('role_requests');
    const usersCol = db.collection('users');
    const notifCol = db.collection('notifications');

    const existingReq = await roleReqCol.findOne({
      $or: [{ id: requestId }, { requestId: requestId }],
    });

    if (!existingReq) {
      return NextResponse.json({ success: false, message: 'Role request not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    await roleReqCol.updateOne(
      { _id: existingReq._id },
      {
        $set: {
          status,
          adminNotes,
          decisionBy,
          decisionDate: nowIso,
          updatedAt: nowIso,
        },
      }
    );

    const targetUserId = existingReq.userId;
    const targetEmail = existingReq.userEmail;
    const targetName = existingReq.userName || 'Member';
    const requestedRole = existingReq.requestedRole;

    if (status === 'APPROVED') {
      // 1. Grant role to user in MongoDB
      if (targetUserId) {
        await usersCol.updateOne(
          { $or: [{ id: targetUserId }, { _id: targetUserId }] },
          {
            $addToSet: { activeRoles: requestedRole },
            $set: { updatedAt: nowIso },
          }
        );
      }

      // 2. Dispatch Approval Email
      if (targetEmail && targetEmail.includes('@')) {
        try {
          await sendZohoEmail({
            to: targetEmail.trim().toLowerCase(),
            subject: `XENTRO: Role Request Approved (${requestedRole})`,
            text: `Dear ${targetName},\n\nWe are pleased to inform you that your role request for "${requestedRole}" has been APPROVED by XENTRO Platform Administration.\n\nYour account has been granted full access to the ${requestedRole} capabilities, hub workspaces, and permissions.\n\nDecision Notes: ${adminNotes || 'Credentials and compliance verified.'}\nReviewed By: ${decisionBy}\nDate: ${new Date().toLocaleDateString()}\n\nYou can access your updated role workspace right now on your Xentro Dashboard.\n\nWarm regards,\nXENTRO Ecosystem Operations\nhttps://xentro.in`,
          });
        } catch (emailErr) {
          console.warn('[RoleDecision] Approval email error:', emailErr);
        }
      }

      // 3. Dispatch in-app notification
      try {
        await notifCol.insertOne({
          id: `notif_${Date.now()}`,
          userId: targetUserId,
          userEmail: targetEmail,
          type: 'ROLE_REQUEST_APPROVED',
          title: 'Role Request Approved!',
          message: `Your request for the "${requestedRole}" role was approved. You now have full access to ${requestedRole} features.`,
          isRead: false,
          createdAt: nowIso,
        });
      } catch (notifErr) {
        console.warn('[RoleDecision] Approval notif error:', notifErr);
      }
    } else {
      // REJECTED:
      // 1. Dispatch Rejection Email
      if (targetEmail && targetEmail.includes('@')) {
        try {
          await sendZohoEmail({
            to: targetEmail.trim().toLowerCase(),
            subject: `XENTRO: Update on your Role Request (${requestedRole})`,
            text: `Dear ${targetName},\n\nThank you for your interest in joining XENTRO as a "${requestedRole}".\n\nAfter reviewing your application, our compliance team was unable to approve this request at this time.\n\nReason / Feedback: ${adminNotes || 'Requirements or documentation not met at this stage.'}\nReviewed By: ${decisionBy}\n\nYour account remains in good standing with your existing role (${existingReq.currentRole || 'Explorer'}). You are welcome to submit updated documentation or re-apply in the future.\n\nWarm regards,\nXENTRO Ecosystem Operations\nhttps://xentro.in`,
          });
        } catch (emailErr) {
          console.warn('[RoleDecision] Rejection email error:', emailErr);
        }
      }

      // 2. Dispatch in-app notification
      try {
        await notifCol.insertOne({
          id: `notif_${Date.now()}`,
          userId: targetUserId,
          userEmail: targetEmail,
          type: 'ROLE_REQUEST_REJECTED',
          title: 'Role Request Update',
          message: `Your request for the "${requestedRole}" role could not be approved at this time: ${adminNotes || 'Requirements not met'}.`,
          isRead: false,
          createdAt: nowIso,
        });
      } catch (notifErr) {
        console.warn('[RoleDecision] Rejection notif error:', notifErr);
      }
    }

    const updated = await roleReqCol.findOne({ _id: existingReq._id });
    if (updated) delete (updated as any)._id;

    return NextResponse.json({
      success: true,
      message: `Role request ${status.toLowerCase()} successfully.`,
      data: { request: updated },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Failed to process role decision' },
      { status: 500 }
    );
  }
}
