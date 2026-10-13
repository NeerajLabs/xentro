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
 * GET /api/startups/[entityId]/team
 * Fetches authoritative Team Members, Talent Asks, and Applicants.
 * Enforces RBAC & Public vs Member visibility using cryptographically verified sessions.
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

    // Authenticate caller via verified server-side JWT session (never unverified query params or headers)
    let isAuthorizedMember = false;
    const token = extractAuthToken(req);
    if (token) {
      const payload = verifyJwtToken(token);
      if (payload?.sub) {
        const memRes = await requireActiveEntityMembership(payload.sub, entityId);
        if (!('error' in memRes)) {
          isAuthorizedMember = true;
        }
      }
    }

    // 1. Fetch Team from startups document
    const startup = await startupsCol.findOne({ entityId });
    const publicTeam = startup?.publicTeam || { founders: [], leadership: [], core: [], advisors: [] };

    // Also fetch memberships to reconcile dashboard roles if authorized
    const memberships = isAuthorizedMember
      ? await membershipsCol.find({ entityId, status: { $ne: 'REMOVED' } }).toArray()
      : [];

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

    // 3. Fetch Applicants (Strictly for verified authorized entity members only)
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
 * Handles Talent Asks creation/updates, Applicant status changes, and Team member updates.
 * STRICT ENFORCEMENT: Requires verified authentication and active entity membership.
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

    // Step 2: Enforce active entity governing authority or active membership
    const memRes = await requireActiveEntityMembership(user.id, entityId);
    if ('error' in memRes) {
      await logSecurityAuditEvent('UNAUTHORIZED_TEAM_MUTATION_ATTEMPT', 'WARNING', {
        userId: user.id,
        userEmail: user.email,
        targetEntityId: entityId,
      });
      return memRes.error;
    }
    const { isHead, permissions, role } = memRes;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 422 });
    }

    const action = body.action;
    const db = await getDatabase();
    const startupsCol = db.collection('startups');
    const asksCol = db.collection('talent_asks');
    const applicantsCol = db.collection('talent_applicants');
    const auditCol = db.collection('audit_logs');

    const nowIso = new Date().toISOString();

    // 1. SYNC_ALL_TEAM: Prohibited legacy mass-sync to prevent authoritative state corruption
    if (action === 'SYNC_ALL_TEAM') {
      await logSecurityAuditEvent('PROHIBITED_TEAM_SYNC_ATTEMPT', 'WARNING', {
        userId: user.id,
        entityId,
        action: 'SYNC_ALL_TEAM',
      });
      return NextResponse.json(
        {
          success: false,
          message:
            'Arbitrary mass team synchronization is disabled in Phase 1 to prevent authoritative data corruption. Use individual mutations (UPDATE_TEAM_MEMBERS, CREATE_TALENT_ASK).',
        },
        { status: 422 }
      );
    }

    // 2. CREATE_TALENT_ASK
    if (action === 'CREATE_TALENT_ASK') {
      const hasPermission =
        isHead ||
        permissions.includes('MANAGE_TEAM') ||
        permissions.includes('ADMIN') ||
        permissions.includes('OWNER') ||
        permissions.includes('HR');

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: 'Forbidden. You lack permission to create talent asks for this organization.' },
          { status: 403 }
        );
      }

      const ask = body.ask;
      if (!ask || typeof ask !== 'object' || !ask.title || !ask.role) {
        return NextResponse.json({ success: false, message: 'Title and role are required' }, { status: 422 });
      }

      if (ask.type === 'Grant' || ask.category === 'Grant') {
        return NextResponse.json({ success: false, message: 'Grants must be accessed via Opportunities.' }, { status: 422 });
      }

      const newAsk = {
        id: ask.id || `ask_tal_${Date.now()}`,
        entityId,
        title: String(ask.title).slice(0, 200),
        role: String(ask.role).slice(0, 100),
        department: String(ask.department || 'General').slice(0, 100),
        roleType: String(ask.roleType || 'Full-time'),
        location: String(ask.location || 'Remote').slice(0, 100),
        workplaceType: String(ask.workplaceType || 'Remote'),
        compensationType: String(ask.compensationType || 'Equity + Stipend'),
        equityRange: String(ask.equityRange || ''),
        stipendRange: String(ask.stipendRange || ''),
        salaryRange: String(ask.salaryRange || ''),
        experienceLevel: String(ask.experienceLevel || '1-3 years'),
        skillsRequired: Array.isArray(ask.skillsRequired) ? ask.skillsRequired.map(String) : [],
        description: String(ask.description || '').slice(0, 5000),
        responsibilities: String(ask.responsibilities || '').slice(0, 5000),
        requirements: String(ask.requirements || '').slice(0, 5000),
        status: ask.status === 'Closed' ? 'Closed' : 'Open',
        visibility: ask.visibility === 'Confidential' ? 'Confidential' : 'Public',
        viewsCount: 0,
        applicationsCount: 0,
        shortlistedCount: 0,
        createdAt: nowIso,
        updatedAt: nowIso,
        createdBy: user.id,
      };

      await asksCol.insertOne(newAsk);

      await auditCol.insertOne({
        id: `audit_ask_${Date.now()}`,
        entityId,
        actorId: user.id,
        action: 'CREATE_TALENT_ASK',
        details: { title: newAsk.title, role: newAsk.role, askId: newAsk.id },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, data: newAsk }, { status: 201 });
    }

    // 3. UPDATE_TALENT_ASK
    if (action === 'UPDATE_TALENT_ASK') {
      const hasPermission =
        isHead ||
        permissions.includes('MANAGE_TEAM') ||
        permissions.includes('ADMIN') ||
        permissions.includes('OWNER') ||
        permissions.includes('HR');

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: 'Forbidden. You lack permission to update talent asks.' },
          { status: 403 }
        );
      }

      const askId = body.askId;
      if (!askId) {
        return NextResponse.json({ success: false, message: 'Talent ask ID is required' }, { status: 422 });
      }

      // Verify the target ask exists and belongs to this entity
      const existingAsk = await asksCol.findOne({ entityId, id: askId });
      if (!existingAsk) {
        return NextResponse.json(
          { success: false, message: 'Talent ask not found for this organization.' },
          { status: 404 }
        );
      }

      const updates = { ...(body.updates || {}) };
      delete updates._id;
      delete updates.id;
      delete updates.entityId;
      delete updates.createdBy;

      updates.updatedAt = nowIso;

      await asksCol.updateOne({ entityId, id: askId }, { $set: updates });

      await auditCol.insertOne({
        id: `audit_ask_upd_${Date.now()}`,
        entityId,
        actorId: user.id,
        action: 'UPDATE_TALENT_ASK',
        details: { askId },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Talent ask updated successfully' });
    }

    // 4. DELETE_TALENT_ASK
    if (action === 'DELETE_TALENT_ASK') {
      const hasPermission =
        isHead ||
        permissions.includes('MANAGE_TEAM') ||
        permissions.includes('ADMIN') ||
        permissions.includes('OWNER');

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: 'Forbidden. You lack permission to delete talent asks.' },
          { status: 403 }
        );
      }

      const askId = body.askId;
      if (!askId) {
        return NextResponse.json({ success: false, message: 'Talent ask ID is required' }, { status: 422 });
      }

      const existingAsk = await asksCol.findOne({ entityId, id: askId });
      if (!existingAsk) {
        return NextResponse.json(
          { success: false, message: 'Talent ask not found for this organization.' },
          { status: 404 }
        );
      }

      await asksCol.deleteOne({ entityId, id: askId });
      await applicantsCol.deleteMany({ entityId, talentAskId: askId });

      await auditCol.insertOne({
        id: `audit_ask_del_${Date.now()}`,
        entityId,
        actorId: user.id,
        action: 'DELETE_TALENT_ASK',
        details: { askId },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Talent ask deleted successfully' });
    }

    // 5. UPDATE_APPLICANT_STAGE
    if (action === 'UPDATE_APPLICANT_STAGE') {
      const hasPermission =
        isHead ||
        permissions.includes('MANAGE_TEAM') ||
        permissions.includes('ADMIN') ||
        permissions.includes('OWNER') ||
        permissions.includes('HR');

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: 'Forbidden. You lack permission to update applicants.' },
          { status: 403 }
        );
      }

      const applicantId = body.applicantId;
      if (!applicantId) {
        return NextResponse.json({ success: false, message: 'Applicant ID is required' }, { status: 422 });
      }

      const existingApplicant = await applicantsCol.findOne({ entityId, id: applicantId });
      if (!existingApplicant) {
        return NextResponse.json(
          { success: false, message: 'Applicant not found for this organization.' },
          { status: 404 }
        );
      }

      const upd: any = { updatedAt: nowIso };
      if (body.stage) upd.stage = String(body.stage);
      if (body.notes !== undefined) upd.notes = String(body.notes);
      if (body.rating !== undefined) upd.rating = Number(body.rating);

      await applicantsCol.updateOne({ entityId, id: applicantId }, { $set: upd });

      return NextResponse.json({ success: true, message: 'Applicant stage updated successfully' });
    }

    // 6. UPDATE_TEAM_MEMBERS
    if (action === 'UPDATE_TEAM_MEMBERS') {
      const hasPermission =
        isHead ||
        permissions.includes('MANAGE_TEAM') ||
        permissions.includes('ADMIN') ||
        permissions.includes('OWNER');

      if (!hasPermission) {
        return NextResponse.json(
          { success: false, message: 'Forbidden. Only authorized team managers may update team structure.' },
          { status: 403 }
        );
      }

      const team = body.team;
      if (!team || typeof team !== 'object') {
        return NextResponse.json({ success: false, message: 'Valid team structure is required' }, { status: 422 });
      }

      // Sanitize team structure to preserve schema integrity
      const sanitizedTeam = {
        founders: Array.isArray(team.founders) ? team.founders : [],
        leadership: Array.isArray(team.leadership) ? team.leadership : [],
        core: Array.isArray(team.core) ? team.core : [],
        advisors: Array.isArray(team.advisors) ? team.advisors : [],
      };

      await startupsCol.updateOne(
        { entityId },
        { $set: { publicTeam: sanitizedTeam, updatedAt: nowIso } },
        { upsert: true }
      );

      await auditCol.insertOne({
        id: `audit_team_upd_${Date.now()}`,
        entityId,
        actorId: user.id,
        action: 'UPDATE_TEAM_MEMBERS',
        details: { foundersCount: sanitizedTeam.founders.length },
        timestamp: nowIso,
      });

      return NextResponse.json({ success: true, message: 'Team members updated successfully' });
    }

    return NextResponse.json({ success: false, message: `Unknown action: ${action}` }, { status: 422 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error processing team action' },
      { status: 500 }
    );
  }
}
