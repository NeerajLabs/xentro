import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/startups/[entityId]/team
 * Fetches authoritative Team Members, Talent Asks, and Applicants.
 * Enforces RBAC & Public vs Member visibility.
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
    const startupsCol = db.collection('startups');
    const asksCol = db.collection('talent_asks');
    const applicantsCol = db.collection('talent_applicants');
    const membershipsCol = db.collection('memberships');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';

    // Check Authorization
    let isAuthorizedMember = false;
    if (userId) {
      if (
        entity.createdByUserId === userId ||
        entity.currentOwnerUserId === userId ||
        entity.primaryOwnerId === userId
      ) {
        isAuthorizedMember = true;
      } else {
        const mem = await membershipsCol.findOne({
          entityId,
          userId,
          status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
        });
        if (mem) isAuthorizedMember = true;
      }
    }

    // 1. Fetch Team from startups document
    const startup = await startupsCol.findOne({ entityId });
    const publicTeam = startup?.publicTeam || { founders: [], leadership: [], core: [], advisors: [] };

    // Also fetch memberships to reconcile dashboard roles
    const memberships = await membershipsCol.find({ entityId, status: { $ne: 'REMOVED' } }).toArray();

    // 2. Fetch Talent Asks
    const askQuery: any = { entityId };
    if (!isAuthorizedMember) {
      askQuery.status = 'Open';
      askQuery.visibility = { $in: ['Public', 'Xentro Users'] };
    }
    const asks = await asksCol.find(askQuery).sort({ createdAt: -1 }).toArray();
    const cleanAsks = asks.map((a) => {
      const { _id, ...rest } = a;
      return rest;
    });

    // 3. Fetch Applicants (Only for authorized members)
    let cleanApplicants: any[] = [];
    if (isAuthorizedMember) {
      const applicants = await applicantsCol.find({ entityId }).sort({ appliedDate: -1 }).toArray();
      cleanApplicants = applicants.map((a) => {
        const { _id, ...rest } = a;
        return rest;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        team: publicTeam,
        memberships: isAuthorizedMember ? memberships.map(({ _id, ...m }) => m) : [],
        talentAsks: cleanAsks,
        applicants: cleanApplicants,
      },
      meta: { isAuthorizedMember },
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error fetching team & talent' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/startups/[entityId]/team
 * Handles Talent Asks creation/updates, Applicant status changes, and Team sync.
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
    const startupsCol = db.collection('startups');
    const asksCol = db.collection('talent_asks');
    const applicantsCol = db.collection('talent_applicants');
    const membershipsCol = db.collection('memberships');
    const auditCol = db.collection('audit_logs');

    const entity = await entitiesCol.findOne({ id: entityId });
    if (!entity) {
      return NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 });
    }

    const nowIso = new Date().toISOString();

    // 1. SYNC_ALL_TEAM (Migrates local team and talent asks to MongoDB)
    if (action === 'SYNC_ALL_TEAM') {
      if (body.publicTeam) {
        await startupsCol.updateOne(
          { entityId },
          { $set: { publicTeam: body.publicTeam, updatedAt: nowIso } },
          { upsert: true }
        );
      }

      if (Array.isArray(body.talentAsks)) {
        for (const ask of body.talentAsks) {
          if (!ask || !ask.id) continue;
          await asksCol.updateOne(
            { entityId, id: ask.id },
            { $set: { ...ask, entityId, updatedAt: nowIso } },
            { upsert: true }
          );
        }
      }

      if (Array.isArray(body.applicants)) {
        for (const app of body.applicants) {
          if (!app || !app.id) continue;
          await applicantsCol.updateOne(
            { entityId, id: app.id },
            { $set: { ...app, entityId, updatedAt: nowIso } },
            { upsert: true }
          );
        }
      }

      return NextResponse.json({ success: true, message: 'Team & talent synced successfully' });
    }

    // 2. CREATE_TALENT_ASK
    if (action === 'CREATE_TALENT_ASK') {
      const ask = body.ask;
      if (!ask || !ask.title || !ask.role) {
        return NextResponse.json({ success: false, message: 'Title and role are required' }, { status: 400 });
      }

      // Grants cannot be listed under asks (strict rule)
      if (ask.type === 'Grant' || ask.category === 'Grant') {
        return NextResponse.json({ success: false, message: 'Grants must be accessed via Opportunities.' }, { status: 400 });
      }

      const newAsk = {
        id: ask.id || `ask_tal_${Date.now()}`,
        entityId,
        title: ask.title,
        role: ask.role,
        department: ask.department || 'General',
        roleType: ask.roleType || 'Full-time',
        location: ask.location || 'Remote',
        workplaceType: ask.workplaceType || 'Remote',
        compensationType: ask.compensationType || 'Equity + Stipend',
        equityRange: ask.equityRange || '',
        stipendRange: ask.stipendRange || '',
        salaryRange: ask.salaryRange || '',
        experienceLevel: ask.experienceLevel || '1-3 years',
        skillsRequired: Array.isArray(ask.skillsRequired) ? ask.skillsRequired : [],
        description: ask.description || '',
        responsibilities: ask.responsibilities || '',
        requirements: ask.requirements || '',
        status: ask.status || 'Open',
        visibility: ask.visibility || 'Public',
        viewsCount: 0,
        applicationsCount: 0,
        shortlistedCount: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: userId,
      };

      await asksCol.insertOne(newAsk);

      await auditCol.insertOne({
        id: `audit_ask_${Date.now()}`,
        entityId,
        actorId: userId,
        action: 'CREATE_TALENT_ASK',
        details: { title: newAsk.title, role: newAsk.role },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, data: newAsk });
    }

    // 3. UPDATE_TALENT_ASK
    if (action === 'UPDATE_TALENT_ASK') {
      const askId = body.askId;
      const updates = body.updates || {};
      delete updates._id;
      delete updates.id;
      delete updates.entityId;

      updates.updatedAt = nowIso;

      await asksCol.updateOne({ entityId, id: askId }, { $set: updates });

      return NextResponse.json({ success: true, message: 'Talent ask updated' });
    }

    // 4. DELETE_TALENT_ASK
    if (action === 'DELETE_TALENT_ASK') {
      const askId = body.askId;
      await asksCol.deleteOne({ entityId, id: askId });
      await applicantsCol.deleteMany({ entityId, talentAskId: askId });

      return NextResponse.json({ success: true, message: 'Talent ask deleted' });
    }

    // 5. UPDATE_APPLICANT_STAGE
    if (action === 'UPDATE_APPLICANT_STAGE') {
      const applicantId = body.applicantId;
      const stage = body.stage;
      const notes = body.notes;
      const rating = body.rating;

      const upd: any = { updatedAt: nowIso };
      if (stage) upd.stage = stage;
      if (notes !== undefined) upd.notes = notes;
      if (rating !== undefined) upd.rating = rating;

      await applicantsCol.updateOne({ entityId, id: applicantId }, { $set: upd });

      return NextResponse.json({ success: true, message: 'Applicant stage updated' });
    }

    // 6. UPDATE_TEAM_MEMBERS
    if (action === 'UPDATE_TEAM_MEMBERS') {
      const team = body.team;
      if (!team) {
        return NextResponse.json({ success: false, message: 'Team structure required' }, { status: 400 });
      }

      await startupsCol.updateOne(
        { entityId },
        { $set: { publicTeam: team, updatedAt: nowIso } },
        { upsert: true }
      );

      return NextResponse.json({ success: true, message: 'Team members updated' });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error processing team action' },
      { status: 500 }
    );
  }
}
