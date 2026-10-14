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
 * GET /api/esp/[entityId]/programs
 * Retrieves programs/cohorts for an ESP or Institution from MongoDB.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const programsCol = db.collection('esp_programs');

    const programs = await programsCol
      .find({
        $or: [{ entityId: rawEntityId }, { espId: rawEntityId }, { institutionId: rawEntityId }],
        isDeleted: { $ne: true },
      })
      .sort({ createdAt: -1 })
      .toArray();

    const cleanPrograms = programs.map((p) => {
      const copy: any = { ...p };
      delete copy._id;
      return copy;
    });

    return NextResponse.json({
      success: true,
      data: cleanPrograms,
      count: cleanPrograms.length,
      source: 'mongodb-atlas',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error fetching programs' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/esp/[entityId]/programs
 * Creates or updates an accelerator/incubator program cohort.
 * Requires Head, Admin, or Program Manager authorization.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const rawEntityId = params?.entityId?.trim();
    if (!rawEntityId) {
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    const callerRes = await resolveCallerIdentity(req);
    if (callerRes.error) {
      return callerRes.error;
    }
    const callerUserId = callerRes.userId!;

    const memRes = await requireActiveEntityMembership(callerUserId, rawEntityId);
    if ('error' in memRes) {
      return memRes.error;
    }
    const { isHead, permissions, role } = memRes;

    const canManagePrograms =
      isHead ||
      permissions.includes('MANAGE_PROGRAMS') ||
      permissions.includes('ADMIN') ||
      role.toLowerCase().includes('program manager') ||
      role.toLowerCase().includes('admin');

    if (!canManagePrograms) {
      return NextResponse.json(
        { success: false, message: 'Forbidden: Program Manager or Head authority required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Invalid JSON request payload' }, { status: 422 });
    }

    const {
      id,
      name,
      type = 'Accelerator',
      duration = '12 Weeks',
      cohortSize = '20 Startups',
      funding = '₹25 Lakhs Grant Support',
      equity = '0% Equity (Non-Dilutive)',
      description = '',
      status = 'Active',
      category = 'active',
      committeeMembers = [],
    } = body;

    if (!name || !String(name).trim()) {
      return NextResponse.json({ success: false, message: 'Program name is required' }, { status: 422 });
    }

    const db = await getDatabase();
    const programsCol = db.collection('esp_programs');
    const auditCol = db.collection('audit_logs');
    const nowIso = new Date().toISOString();

    const programId = id || `prog_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const programDoc = {
      id: programId,
      entityId: rawEntityId,
      name: String(name).trim(),
      type,
      duration,
      cohortSize,
      funding,
      equity,
      description: String(description).slice(0, 5000),
      status,
      category,
      committeeMembers: Array.isArray(committeeMembers) ? committeeMembers : [],
      createdBy: callerUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await programsCol.updateOne(
      { id: programId, entityId: rawEntityId },
      { $set: programDoc },
      { upsert: true }
    );

    await auditCol.insertOne({
      id: `audit_prog_${Date.now()}`,
      entityId: rawEntityId,
      actorId: callerUserId,
      action: 'SAVE_ESP_PROGRAM',
      details: { programId, name: programDoc.name, type: programDoc.type },
      timestamp: nowIso,
    });

    return NextResponse.json({
      success: true,
      message: 'Program cohort saved successfully.',
      data: programDoc,
      source: 'mongodb-atlas',
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error saving program' },
      { status: 500 }
    );
  }
}
