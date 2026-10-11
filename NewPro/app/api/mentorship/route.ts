import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/mentorship
 * Retrieves mentorship data (offerings, requests, active mentorships) from MongoDB Atlas.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const mentorId = searchParams.get('mentorId');
    const startupId = searchParams.get('startupId');
    const type = searchParams.get('type') || 'all'; // 'offerings', 'requests', 'active', 'all'

    const db = await getDatabase();
    const requestsCol = db.collection('mentorship_requests');
    const mentorshipsCol = db.collection('mentorships');
    const offeringsCol = db.collection('mentorship_offerings');

    const result: any = {};

    if (type === 'all' || type === 'offerings') {
      const offFilter: any = {};
      if (mentorId) offFilter.mentorId = mentorId;
      result.offerings = await offeringsCol.find(offFilter).toArray();
    }

    if (type === 'all' || type === 'requests') {
      const reqFilter: any = {};
      if (mentorId) reqFilter.mentorId = mentorId;
      if (startupId) reqFilter.startupId = startupId;
      result.requests = await requestsCol.find(reqFilter).sort({ createdAt: -1 }).toArray();
    }

    if (type === 'all' || type === 'active') {
      const activeFilter: any = {};
      if (mentorId) activeFilter.mentorId = mentorId;
      if (startupId) activeFilter.startupId = startupId;
      result.activeMentorships = await mentorshipsCol.find(activeFilter).sort({ createdAt: -1 }).toArray();
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error('Mentorship GET error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mentorship
 * Creates or updates mentorship requests, offerings, or status in MongoDB Atlas.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action; // 'create_request', 'update_request', 'save_offerings', 'update_active'
    const db = await getDatabase();

    const nowIso = new Date().toISOString();

    if (action === 'create_request') {
      const request = body?.request;
      if (!request || !request.mentorId) {
        return NextResponse.json({ success: false, message: 'Valid request required' }, { status: 400 });
      }
      const requestsCol = db.collection('mentorship_requests');
      const doc = {
        ...request,
        id: request.id || `req_${Date.now()}`,
        status: request.status || 'PENDING',
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      await requestsCol.updateOne({ id: doc.id }, { $set: doc }, { upsert: true });
      return NextResponse.json({ success: true, data: doc });
    }

    if (action === 'update_request') {
      const { requestId, status, reason } = body;
      if (!requestId || !status) {
        return NextResponse.json({ success: false, message: 'requestId and status required' }, { status: 400 });
      }
      const requestsCol = db.collection('mentorship_requests');
      await requestsCol.updateOne(
        { id: requestId },
        { $set: { status, declineReason: reason || null, updatedAt: nowIso } }
      );
      return NextResponse.json({ success: true });
    }

    if (action === 'save_offerings') {
      const { mentorId, offerings } = body;
      if (!mentorId || !Array.isArray(offerings)) {
        return NextResponse.json({ success: false, message: 'mentorId and offerings array required' }, { status: 400 });
      }
      const offeringsCol = db.collection('mentorship_offerings');
      await offeringsCol.deleteMany({ mentorId });
      if (offerings.length > 0) {
        const docs = offerings.map((o: any) => ({ ...o, mentorId, updatedAt: nowIso }));
        await offeringsCol.insertMany(docs);
      }
      return NextResponse.json({ success: true, count: offerings.length });
    }

    if (action === 'create_active') {
      const mentorship = body?.mentorship;
      if (!mentorship) {
        return NextResponse.json({ success: false, message: 'mentorship object required' }, { status: 400 });
      }
      const mentorshipsCol = db.collection('mentorships');
      await mentorshipsCol.updateOne(
        { id: mentorship.id },
        { $set: { ...mentorship, updatedAt: nowIso }, $setOnInsert: { createdAt: nowIso } },
        { upsert: true }
      );
      return NextResponse.json({ success: true, data: mentorship });
    }

    return NextResponse.json({ success: false, message: 'Unknown mentorship action' }, { status: 400 });
  } catch (error: any) {
    console.error('Mentorship POST error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error' },
      { status: 500 }
    );
  }
}
