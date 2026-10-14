import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import {
  extractAuthToken,
  verifyJwtToken,
  requireAuthenticatedUser,
  requireActiveEntityMembership,
} from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function resolveCallerIdentity(req: NextRequest): Promise<{ userId: string | null; error?: NextResponse }> {
  const token = extractAuthToken(req);
  if (token) {
    const payload = verifyJwtToken(token);
    if (payload?.sub) {
      return { userId: payload.sub };
    }
  }

  const authRes = await requireAuthenticatedUser(req);
  if ('error' in authRes) {
    return { userId: null, error: authRes.error };
  }
  return { userId: authRes.user.id };
}

/**
 * GET /api/esp/[entityId]/programs/[programId]/applications
 * Retrieves applications for a specific program cohort.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string; programId: string } }
) {
  try {
    const { entityId, programId } = params;
    if (!entityId || !programId) {
      return NextResponse.json({ success: false, message: 'Entity ID and Program ID are required' }, { status: 400 });
    }

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const db = await getDatabase();
    const programsCol = db.collection('esp_programs');
    const appsCol = db.collection('esp_applications');

    const program = await programsCol.findOne({ id: programId, entityId });
    if (!program) {
      return NextResponse.json({ success: false, message: 'Program cohort not found' }, { status: 404 });
    }

    const committee = Array.isArray(program.committeeMembers) ? program.committeeMembers : [];
    const isCommitteeMember = committee.includes(callerUserId);

    // Verify caller is member of this ESP or committee member
    const memRes = await requireActiveEntityMembership(callerUserId, entityId);
    if ('error' in memRes && !isCommitteeMember) {
      return memRes.error;
    }

    const applications = await appsCol.find({ programId, entityId }).sort({ appliedAt: -1 }).toArray();
    const cleanApps = applications.map((a) => {
      const copy: any = { ...a };
      delete copy._id;
      return copy;
    });

    return NextResponse.json({
      success: true,
      data: cleanApps,
      count: cleanApps.length,
      programName: program.name,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error fetching program applications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/esp/[entityId]/programs/[programId]/applications
 * Submits startup application or updates selection decision stage.
 * Selection decisions enforce selection committee appointments or Head/PM authorization.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { entityId: string; programId: string } }
) {
  try {
    const { entityId, programId } = params;
    if (!entityId || !programId) {
      return NextResponse.json({ success: false, message: 'Entity ID and Program ID are required' }, { status: 400 });
    }

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 422 });
    }

    const db = await getDatabase();
    const programsCol = db.collection('esp_programs');
    const appsCol = db.collection('esp_applications');
    const auditCol = db.collection('audit_logs');
    const nowIso = new Date().toISOString();

    const program = await programsCol.findOne({ id: programId, entityId });
    if (!program) {
      return NextResponse.json({ success: false, message: 'Program cohort not found' }, { status: 404 });
    }

    const action = body.action || (body.applicationId ? 'UPDATE_STAGE' : 'APPLY');

    // CASE A: UPDATE SELECTION DECISION STAGE
    if (action === 'UPDATE_STAGE') {
      const { applicationId, stage, notes, rating } = body;
      if (!applicationId || !stage) {
        return NextResponse.json({ success: false, message: 'Application ID and stage are required' }, { status: 422 });
      }

      const validStages = ['Under Review', 'Shortlisted', 'Interviewed', 'Accepted', 'Rejected'];
      if (!validStages.includes(stage)) {
        return NextResponse.json(
          { success: false, message: `Invalid stage. Permitted: ${validStages.join(', ')}` },
          { status: 422 }
        );
      }

      // Check selection decision authorization: Head, Program Manager, or Selection Committee appointment
      const committee = Array.isArray(program.committeeMembers) ? program.committeeMembers : [];
      const isCommitteeMember = committee.includes(callerUserId);

      const memRes = await requireActiveEntityMembership(callerUserId, entityId);
      let canDecide = isCommitteeMember;
      if (!('error' in memRes)) {
        const { isHead, permissions, role } = memRes;
        canDecide =
          canDecide ||
          isHead ||
          permissions.includes('APPROVE_SELECTIONS') ||
          permissions.includes('ADMIN') ||
          role.toLowerCase().includes('program manager') ||
          role.toLowerCase().includes('head');
      }

      if (!canDecide) {
        return NextResponse.json(
          {
            success: false,
            message: 'Forbidden: Selection decision requires Head authority, Program Manager, or explicit Selection Committee appointment.',
            code: 'COMMITTEE_APPOINTMENT_REQUIRED',
          },
          { status: 403 }
        );
      }

      const existingApp = await appsCol.findOne({ id: applicationId, programId });
      if (!existingApp) {
        return NextResponse.json({ success: false, message: 'Application not found' }, { status: 404 });
      }

      const updateFields: any = {
        status: stage,
        stage,
        updatedAt: nowIso,
        decidedBy: callerUserId,
      };
      if (notes !== undefined) updateFields.notes = String(notes);
      if (rating !== undefined) updateFields.rating = Number(rating);

      await appsCol.updateOne(
        { id: applicationId, programId },
        { $set: updateFields }
      );

      await auditCol.insertOne({
        id: `audit_app_${Date.now()}`,
        entityId,
        actorId: callerUserId,
        action: 'UPDATE_SELECTION_DECISION',
        details: { applicationId, programId, newStage: stage, wasCommitteeMember: isCommitteeMember },
        timestamp: nowIso,
      });

      return NextResponse.json({
        success: true,
        message: `Application stage updated to "${stage}" by authorized evaluator.`,
      });
    }

    // CASE B: SUBMIT APPLICATION
    const { startupId, startupName, founderName, founderEmail, pitch, tractionSummary, ask } = body;
    const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newApp = {
      id: appId,
      programId,
      entityId,
      applicantUserId: callerUserId,
      startupId: startupId || undefined,
      startupName: String(startupName || 'Applicant Venture').slice(0, 200),
      founderName: String(founderName || 'Founder').slice(0, 200),
      founderEmail: String(founderEmail || '').toLowerCase().trim(),
      pitch: String(pitch || '').slice(0, 5000),
      tractionSummary: String(tractionSummary || '').slice(0, 2000),
      ask: String(ask || '').slice(0, 1000),
      status: 'Under Review',
      stage: 'Under Review',
      appliedAt: nowIso,
      updatedAt: nowIso,
    };

    await appsCol.insertOne(newApp);

    return NextResponse.json({
      success: true,
      message: 'Application successfully submitted to program.',
      data: newApp,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error processing program application' },
      { status: 500 }
    );
  }
}
