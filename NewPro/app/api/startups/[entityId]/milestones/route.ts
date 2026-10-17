import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { requireAuthenticatedUser } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export interface MilestoneItem {
  id: string;
  startupEntityId: string;
  title: string;
  category: 'company' | 'product' | 'market' | 'funding';
  status: 'not_started' | 'in_progress' | 'completed';
  targetDate?: string;
  completedDate?: string;
  description?: string;
  ownerRole?: string;
  evidenceUrl?: string;
  isCustom?: boolean;
  createdAt: string;
  updatedAt: string;
}

const CANONICAL_ROADMAP_MILESTONES: Omit<MilestoneItem, 'id' | 'startupEntityId' | 'createdAt' | 'updatedAt'>[] = [
  // Company & Governance
  { title: 'Idea & Problem Validated', category: 'company', status: 'not_started', description: 'Customer discovery interviews and problem statement sign-off' },
  { title: 'Incorporated (MCA / Legal Entity)', category: 'company', status: 'not_started', description: 'Certificate of incorporation and statutory corporate filings' },
  { title: 'DPIIT Startup Recognition', category: 'company', status: 'not_started', description: 'Government of India DPIIT recognition certificate granted' },
  { title: 'MSME Udyam Registered', category: 'company', status: 'not_started', description: 'Ministry of MSME official registration completed' },
  // Product Engineering
  { title: 'Interactive Prototype', category: 'product', status: 'not_started', description: 'Figma click-through or functional proof-of-concept' },
  { title: 'Minimum Viable Product (MVP)', category: 'product', status: 'not_started', description: 'Core functional product deployed to test environment' },
  { title: 'Private Beta with Early Users', category: 'product', status: 'not_started', description: 'Closed user cohort testing and feedback loop' },
  { title: 'General Availability / Production Live', category: 'product', status: 'not_started', description: 'Public production release with monitoring and uptime SLAs' },
  // Market & Traction
  { title: 'First Active User', category: 'market', status: 'not_started', description: 'First organic non-founding user onboarded' },
  { title: 'First Paying Customer', category: 'market', status: 'not_started', description: 'First commercial revenue invoice generated and cleared' },
  { title: 'Predictable Repeat Revenue', category: 'market', status: 'not_started', description: 'Consistent month-over-month ARR expansion and retention' },
  { title: 'Scale & Growth Flywheel', category: 'market', status: 'not_started', description: 'Efficient customer acquisition with positive unit economics' },
  // Capital & Funding
  { title: 'Pitch Deck & Data Room Ready', category: 'funding', status: 'not_started', description: 'Institutional deck and statutory filings in DD locker' },
  { title: 'Fundraising Campaign Started', category: 'funding', status: 'not_started', description: 'Round terms published and investor outreach underway' },
  { title: 'First Investment Commitment', category: 'funding', status: 'not_started', description: 'First signed term sheet or angel check commitment' },
  { title: 'Investment Round Closed', category: 'funding', status: 'not_started', description: 'Funds wired, SHA executed, and shares allotted' },
];

/**
 * Checks authorization of user on the startup entity.
 */
async function checkStartupAuth(req: NextRequest, entityId: string, db: any) {
  const authRes = await requireAuthenticatedUser(req);
  if (!authRes.authenticated || !authRes.user) {
    return { error: NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 }) };
  }

  const userId = authRes.user.id || authRes.user.userId || '';
  const userEmail = authRes.user.email || '';

  const entitiesCol = db.collection('entities');
  const membershipsCol = db.collection('memberships');

  const entity = await entitiesCol.findOne({ id: entityId });
  if (!entity) {
    return { error: NextResponse.json({ success: false, message: 'Startup entity not found' }, { status: 404 }) };
  }

  const isOwner =
    entity.createdByUserId === userId ||
    entity.createdByUserId === userEmail ||
    entity.currentOwnerUserId === userId ||
    entity.currentOwnerUserId === userEmail ||
    entity.primaryOwnerId === userId ||
    entity.primaryOwnerId === userEmail;

  if (isOwner) {
    return { userId, isOwner: true, role: 'Owner / Founder' };
  }

  const membership = await membershipsCol.findOne({
    entityId,
    $or: [{ userId }, { userEmail }],
    status: { $in: ['ACTIVE', 'APPROVED', 'Active'] },
  });

  if (membership) {
    return { userId, isOwner: false, role: membership.role || 'Member', permissions: membership.permissions || [] };
  }

  return { error: NextResponse.json({ success: false, message: 'Forbidden: You do not have access to this startup workspace' }, { status: 403 }) };
}

/**
 * GET /api/startups/[entityId]/milestones
 * Retrieves real persisted milestone progress for the startup.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const { entityId } = params;
    const db = await getDatabase();

    const authCheck = await checkStartupAuth(req, entityId, db);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const milestonesCol = db.collection('startup_milestones');
    let items = await milestonesCol
      .find({ startupEntityId: entityId })
      .sort({ createdAt: 1 })
      .toArray();

    // Return only actual persisted milestones for this startup from MongoDB.
    // Canonical roadmap templates are provided as suggestions, NOT auto-inserted into the database.

    // Clean MongoDB _id
    const sanitized: MilestoneItem[] = items.map((m: any) => ({
      id: m.id || String(m._id),
      startupEntityId: m.startupEntityId,
      title: m.title,
      category: m.category,
      status: m.status || 'not_started',
      targetDate: m.targetDate,
      completedDate: m.completedDate,
      description: m.description,
      ownerRole: m.ownerRole,
      evidenceUrl: m.evidenceUrl,
      isCustom: Boolean(m.isCustom),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    // Calculate progress metrics
    const totalCount = sanitized.length;
    const completedCount = sanitized.filter((m) => m.status === 'completed').length;
    const inProgressCount = sanitized.filter((m) => m.status === 'in_progress').length;
    const overallProgressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const categories = {
      company: {
        total: sanitized.filter((m) => m.category === 'company').length,
        completed: sanitized.filter((m) => m.category === 'company' && m.status === 'completed').length,
      },
      product: {
        total: sanitized.filter((m) => m.category === 'product').length,
        completed: sanitized.filter((m) => m.category === 'product' && m.status === 'completed').length,
      },
      market: {
        total: sanitized.filter((m) => m.category === 'market').length,
        completed: sanitized.filter((m) => m.category === 'market' && m.status === 'completed').length,
      },
      funding: {
        total: sanitized.filter((m) => m.category === 'funding').length,
        completed: sanitized.filter((m) => m.category === 'funding' && m.status === 'completed').length,
      },
    };

    // Determine current phase truthfully
    let phase = 'Concept Validation';
    if (categories.company.completed >= 2 && categories.product.completed >= 1) {
      phase = 'Early Execution';
    }
    if (categories.product.completed >= 2 && categories.market.completed >= 1) {
      phase = 'Market Validation';
    }
    if (categories.market.completed >= 2 && categories.funding.completed >= 2) {
      phase = 'Growth Acceleration';
    }

    return NextResponse.json({
      success: true,
      data: {
        milestones: sanitized,
        suggestedTemplates: CANONICAL_ROADMAP_MILESTONES,
        metrics: {
          totalCount,
          completedCount,
          inProgressCount,
          overallProgressPct,
          phase,
          categories,
        },
      },
    });
  } catch (error: any) {
    console.error('Error fetching startup milestones:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * POST /api/startups/[entityId]/milestones
 * Adds a new custom operational milestone.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const { entityId } = params;
    const db = await getDatabase();

    const authCheck = await checkStartupAuth(req, entityId, db);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const body = await req.json();

    if (body.action === 'ADOPT_ALL_TEMPLATES') {
      const nowIso = new Date().toISOString();
      const initialDocs = CANONICAL_ROADMAP_MILESTONES.map((m, idx) => ({
        id: `ms_${entityId}_${idx + 1}`,
        startupEntityId: entityId,
        title: m.title,
        category: m.category,
        status: m.status,
        description: m.description,
        isCustom: false,
        createdAt: nowIso,
        updatedAt: nowIso,
      }));

      const milestonesCol = db.collection('startup_milestones');
      await milestonesCol.insertMany(initialDocs);

      try {
        await db.collection('audit_logs').insertOne({
          id: `audit_${Date.now()}`,
          entityId,
          actorId: authCheck.userId,
          action: 'ADOPT_ROADMAP_TEMPLATES',
          details: { count: initialDocs.length },
          timestamp: nowIso,
        });
      } catch (_) {}

      return NextResponse.json({
        success: true,
        message: 'Canonical roadmap templates adopted successfully',
        data: initialDocs,
      });
    }

    const { title, category, targetDate, description, ownerRole } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, message: 'Milestone title is required' }, { status: 400 });
    }

    const validCategories = ['company', 'product', 'market', 'funding'];
    const chosenCategory = validCategories.includes(category) ? category : 'company';

    const nowIso = new Date().toISOString();
    const newMilestone: MilestoneItem = {
      id: `ms_custom_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      startupEntityId: entityId,
      title: title.trim(),
      category: chosenCategory,
      status: 'not_started',
      targetDate: targetDate || undefined,
      description: description?.trim() || undefined,
      ownerRole: ownerRole || authCheck.role || 'Founder',
      isCustom: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const milestonesCol = db.collection('startup_milestones');
    await milestonesCol.insertOne(newMilestone);

    // Audit log
    try {
      await db.collection('audit_logs').insertOne({
        id: `audit_${Date.now()}`,
        entityId,
        actorId: authCheck.userId,
        action: 'CREATE_STARTUP_MILESTONE',
        details: { milestoneId: newMilestone.id, title: newMilestone.title, category: newMilestone.category },
        timestamp: nowIso,
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Milestone added successfully',
      data: newMilestone,
    });
  } catch (error: any) {
    console.error('Error creating startup milestone:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * PATCH /api/startups/[entityId]/milestones
 * Updates status or progress of an existing milestone.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const { entityId } = params;
    const db = await getDatabase();

    const authCheck = await checkStartupAuth(req, entityId, db);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const body = await req.json();
    const { milestoneId, status, evidenceUrl, targetDate, description } = body;

    if (!milestoneId) {
      return NextResponse.json({ success: false, message: 'Milestone ID is required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const updateFields: Record<string, any> = { updatedAt: nowIso };

    if (status) {
      if (!['not_started', 'in_progress', 'completed'].includes(status)) {
        return NextResponse.json({ success: false, message: 'Invalid milestone status' }, { status: 400 });
      }
      updateFields.status = status;
      if (status === 'completed') {
        updateFields.completedDate = nowIso;
      } else {
        updateFields.completedDate = null;
      }
    }

    if (evidenceUrl !== undefined) updateFields.evidenceUrl = evidenceUrl;
    if (targetDate !== undefined) updateFields.targetDate = targetDate;
    if (description !== undefined) updateFields.description = description;

    const milestonesCol = db.collection('startup_milestones');
    const result = await milestonesCol.findOneAndUpdate(
      { id: milestoneId, startupEntityId: entityId },
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json({ success: false, message: 'Milestone not found' }, { status: 404 });
    }

    // Audit log status transition
    try {
      await db.collection('audit_logs').insertOne({
        id: `audit_${Date.now()}`,
        entityId,
        actorId: authCheck.userId,
        action: 'UPDATE_STARTUP_MILESTONE_STATUS',
        details: { milestoneId, status, updatedBy: authCheck.userId },
        timestamp: nowIso,
      });
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Milestone updated successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('Error updating startup milestone:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/startups/[entityId]/milestones
 * Deletes a custom milestone.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { entityId: string } }
) {
  try {
    const { entityId } = params;
    const db = await getDatabase();

    const authCheck = await checkStartupAuth(req, entityId, db);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { searchParams } = new URL(req.url);
    const milestoneId = searchParams.get('milestoneId');

    if (!milestoneId) {
      return NextResponse.json({ success: false, message: 'Milestone ID is required' }, { status: 400 });
    }

    const milestonesCol = db.collection('startup_milestones');
    const existing = await milestonesCol.findOne({ id: milestoneId, startupEntityId: entityId });
    if (!existing) {
      return NextResponse.json({ success: false, message: 'Milestone not found' }, { status: 404 });
    }

    await milestonesCol.deleteOne({ id: milestoneId, startupEntityId: entityId });

    return NextResponse.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting startup milestone:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
