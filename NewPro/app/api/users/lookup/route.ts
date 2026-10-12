import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const rawTag = req.nextUrl.searchParams.get('tag') || req.nextUrl.searchParams.get('query') || req.nextUrl.searchParams.get('q') || '';
    const clean = rawTag.trim();

    if (!clean) {
      return NextResponse.json({ success: false, message: 'Tag query is required' }, { status: 400 });
    }

    const tagWithoutAt = clean.replace(/^@/, '');
    const tagWithAt = `@${tagWithoutAt}`;

    const db = await getDatabase();
    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');

    // 1. Check users collection
    const user = await usersCol.findOne({
      $or: [
        { accountTag: tagWithAt },
        { accountTag: tagWithoutAt },
        { username: tagWithAt },
        { username: tagWithoutAt },
        { id: clean },
        { xentroId: clean },
        { email: clean.toLowerCase() },
      ],
      deleted: { $ne: true },
      is_deleted: { $ne: true },
    });

    if (user) {
      const p = user.personalProfile || {};
      const tag = user.accountTag || user.username || tagWithAt;
      return NextResponse.json({
        success: true,
        type: 'user',
        data: {
          id: user.id,
          name: user.fullName || user.name || 'Member',
          username: tag,
          accountTag: tag,
          tag,
          role: user.role || user.accountType || p.currentRole || 'Explorer',
          organization: user.organization || p.currentOrganization || '',
          avatar: user.avatar || p.photoUrl || '/xentro-logo.png',
          email: user.email,
          accountType: user.accountType || 'Explorer',
        },
      });
    }

    // 2. Check entities collection
    const entity = await entitiesCol.findOne({
      $or: [
        { accountTag: tagWithAt },
        { accountTag: tagWithoutAt },
        { username: tagWithAt },
        { username: tagWithoutAt },
        { id: clean },
        { entityId: clean },
      ],
      status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
    });

    if (entity) {
      const tag = entity.accountTag || entity.username || tagWithAt;
      return NextResponse.json({
        success: true,
        type: 'entity',
        data: {
          id: entity.id,
          name: entity.name,
          username: tag,
          accountTag: tag,
          tag,
          role: entity.entityType || 'Startup',
          entityType: entity.entityType || 'STARTUP',
          avatar: entity.logo || '/xentro-logo.png',
          officialEmail: entity.officialEmail,
        },
      });
    }

    // 3. Fallback partial regex search for auto-complete dropdown
    const escaped = tagWithoutAt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const usersMatching = await usersCol
      .find({
        $or: [
          { username: { $regex: escaped, $options: 'i' } },
          { accountTag: { $regex: escaped, $options: 'i' } },
          { fullName: { $regex: escaped, $options: 'i' } },
        ],
        deleted: { $ne: true },
      })
      .limit(5)
      .toArray();

    const entitiesMatching = await entitiesCol
      .find({
        $or: [
          { username: { $regex: escaped, $options: 'i' } },
          { accountTag: { $regex: escaped, $options: 'i' } },
          { name: { $regex: escaped, $options: 'i' } },
        ],
        status: { $nin: ['DELETED', 'ORPHANED_DELETED'] },
      })
      .limit(5)
      .toArray();

    const results = [
      ...usersMatching.map((u) => {
        const tag = u.accountTag || u.username || `@${(u.fullName || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
        return {
          id: u.id,
          type: 'user',
          name: u.fullName || u.name || 'Member',
          username: tag,
          accountTag: tag,
          tag,
          role: u.accountType || 'Explorer',
          avatar: u.avatar || '/xentro-logo.png',
          email: u.email,
        };
      }),
      ...entitiesMatching.map((e) => {
        const tag = e.accountTag || e.username || `@${e.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`;
        return {
          id: e.id,
          type: 'entity',
          name: e.name,
          username: tag,
          accountTag: tag,
          tag,
          role: e.entityType || 'Startup',
          avatar: e.logo || '/xentro-logo.png',
        };
      }),
    ];

    if (results.length > 0) {
      return NextResponse.json({
        success: true,
        type: 'list',
        data: results,
      });
    }

    return NextResponse.json({ success: false, message: 'No account found matching this tag' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message || 'Database error during tag lookup' },
      { status: 500 }
    );
  }
}
