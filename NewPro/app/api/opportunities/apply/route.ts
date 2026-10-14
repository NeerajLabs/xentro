import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireServerAuth } from '@/lib/serverAuth';
import { getBackendBaseUrl } from '@/lib/backendUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const BACKEND = getBackendBaseUrl();

export async function POST(req: NextRequest) {
  try {
    const caller = await requireServerAuth(req);
    if (!caller.authenticated || !caller.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to apply' },
        { status: 401 }
      );
    }

    const callerUserId = caller.user.id || caller.user.userId || '';
    const body = await req.json();
    const opportunityId = (body?.opportunityId || '').trim();

    if (!opportunityId) {
      return NextResponse.json(
        { success: false, error: 'opportunityId is required' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const applicationsCol = db.collection('applications');
    const opportunitiesCol = db.collection('opportunities');

    // 1. Check duplicate submission
    const existing = await applicationsCol.findOne({
      opportunityId,
      applicantId: callerUserId,
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'You have already submitted an application for this opportunity',
          application: existing,
        },
        { status: 400 }
      );
    }

    // 2. Validate opportunity status and deadline if recorded
    const opp = await opportunitiesCol.findOne({ id: opportunityId });
    if (opp) {
      if (opp.status === 'CLOSED' || opp.status === 'ARCHIVED') {
        return NextResponse.json(
          { success: false, error: 'This opportunity is closed for submissions' },
          { status: 400 }
        );
      }
      if (opp.deadline) {
        const deadlineDate = new Date(opp.deadline);
        if (!isNaN(deadlineDate.getTime()) && deadlineDate.getTime() < Date.now()) {
          return NextResponse.json(
            { success: false, error: 'The application deadline for this opportunity has passed' },
            { status: 400 }
          );
        }
      }
    }

    const nowIso = new Date().toISOString();
    const applicantName = body?.applicantName || caller.user.fullName || caller.user.name || 'Applicant';
    const applicantAvatar = body?.applicantAvatar || caller.user.avatar || '/xentro-logo.png';
    const proposalPitch = body?.proposalPitch || body?.proposal || '';

    const appDoc = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      opportunityId,
      applicantId: callerUserId,
      applicantName,
      applicantAvatar,
      applicantType: body?.applicantType || 'Startup',
      organizationName: body?.organizationName || caller.user.organization || '',
      email: body?.email || caller.user.email || '',
      phone: body?.phone || '',
      location: body?.location || '',
      proposalPitch,
      proposal: proposalPitch,
      submittedDocuments: Array.isArray(body?.submittedDocuments) ? body.submittedDocuments : [],
      status: 'SUBMITTED',
      applicationDate: nowIso.split('T')[0],
      submittedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 3. Persist authoritatively in MongoDB Atlas applications collection
    await applicationsCol.insertOne(appDoc);

    // 4. Increment applicationsCount
    await opportunitiesCol.updateOne(
      { id: opportunityId },
      { $inc: { applicationsCount: 1 } }
    );

    // 5. Best-effort forward to Django Backend
    const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    if (token) {
      try {
        await fetch(`${BACKEND}/opportunities/${encodeURIComponent(opportunityId)}/apply/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ proposal: proposalPitch }),
        });
      } catch (fwdErr) {
        console.warn('[Apply API] Django forward warning:', fwdErr);
      }
    }

    return NextResponse.json({
      success: true,
      application: appDoc,
      message: 'Application submitted and persisted successfully in MongoDB Atlas',
    });
  } catch (err: any) {
    console.error('[Opportunity Apply POST] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const caller = await requireServerAuth(req);
    if (!caller.authenticated || !caller.user) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const callerUserId = caller.user.id || caller.user.userId || '';
    const { searchParams } = new URL(req.url);
    const opportunityId = searchParams.get('opportunityId')?.trim();

    const db = await getDatabase();
    const applicationsCol = db.collection('applications');

    const query: any = {};
    if (opportunityId) {
      query.opportunityId = opportunityId;
      // If querying specific opportunity, caller must be applicant or opportunity owner
      if (!caller.user.is_staff) {
        query.applicantId = callerUserId;
      }
    } else {
      query.applicantId = callerUserId;
    }

    const apps = await applicationsCol.find(query).sort({ submittedAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      applications: apps,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Opportunity Apply GET] Error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Server error' },
      { status: 500 }
    );
  }
}
