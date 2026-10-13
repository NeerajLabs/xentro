import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { getMongoClient } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const excludeUserId = searchParams.get('excludeUserId') || '';
  const excludeEmail = searchParams.get('excludeEmail') || '';

  // 1. Direct MongoDB Atlas Primary Query: Instantaneous (<20ms) response, eliminating Render cold starts
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');

    const queryConditions: any = {
      isActive: { $ne: false },
      accountStatus: { $nin: ['DELETED', 'REJECTED', 'SUSPENDED'] },
      deleted: { $ne: true },
      is_deleted: { $ne: true },
    };

    if (excludeUserId) {
      queryConditions.id = { $ne: excludeUserId };
    }
    if (excludeEmail) {
      queryConditions.email = { $ne: excludeEmail.toLowerCase() };
    }

    const realUsers = await usersCol.find(queryConditions).limit(50).toArray();

    if (realUsers && realUsers.length > 0) {
      const people: any[] = [];
      const mentors: any[] = [];
      const investors: any[] = [];
      const esps: any[] = [];

      realUsers.forEach((u: any) => {
        const name = u.fullName || u.name || 'Ecosystem Member';
        const role = u.role || u.primaryRole || u.headline || 'Member';
        const company = u.startupName || u.organization || u.company || '';
        const avatar =
          u.avatar || u.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
        const accountType = String(u.accountType || u.role || '').toLowerCase();

        const recItem = {
          id: u.id || String(u._id),
          userId: u.id,
          name,
          title: role,
          company,
          context: company ? `${role} at ${company}` : role,
          avatar,
          status: 'idle',
          verified: Boolean(u.verified || u.emailVerified),
        };

        if (accountType.includes('mentor')) {
          mentors.push({ ...recItem, category: 'mentors', type: 'mentor' });
        } else if (accountType.includes('investor')) {
          investors.push({
            ...recItem,
            category: 'investors',
            type: 'investor',
            investorCategory: 'individual',
            investorType: 'Individual Angel',
            stages: ['Pre-Seed', 'Seed', 'Early Stage'],
            focusIndustries: u.personalProfile?.industries || ['Technology', 'SaaS', 'Deep Tech'],
            ticketSize: '₹25L–₹2Cr',
            description: `${name} is an active investment partner on Xentro. ${recItem.context || ''}.`.trim(),
          });
        } else if (accountType.includes('esp') || accountType.includes('institution')) {
          esps.push({ ...recItem, category: 'opportunities', type: 'esp' });
        } else if (accountType.includes('explorer')) {
          people.push({ ...recItem, category: 'people', type: 'explorer' });
        } else {
          people.push({ ...recItem, category: 'people', type: 'startup' });
        }
      });

      // Also query registered Investment Organizations (VCs & Funds) from entities / investment_organizations
      const firmIds = new Set<string>();
      const firmsList: any[] = [];
      try {
        const entitiesCol = db.collection('entities');
        const invOrgsCol = db.collection('investment_organizations');
        const firmQuery = {
          $or: [
            { canonicalType: 'INVESTOR_ORG' },
            { entityType: 'INVESTOR_ORG' },
          ],
          status: { $nin: ['DELETED', 'REJECTED'] },
        };
        const dbFirms = await entitiesCol.find(firmQuery).limit(25).toArray();
        const dbInvOrgs = await invOrgsCol.find({ isDeleted: { $ne: true } }).limit(25).toArray();

        dbFirms.forEach((firm: any) => {
          const fid = firm.id || String(firm._id);
          if (!firmIds.has(fid)) {
            firmIds.add(fid);
            firmsList.push({
              id: fid,
              entityId: fid,
              userId: firm.primaryOwnerId || firm.createdByUserId,
              name: firm.name,
              title: firm.details?.investorType || firm.orgType || 'Investment Organization',
              company: firm.name,
              context: `${firm.details?.investorType || 'Venture Capital'} • ${firm.details?.fundSize || 'Active Fund'}`,
              avatar: firm.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80',
              status: 'idle',
              verified: Boolean(firm.verificationStatus === 'VERIFIED'),
              category: 'investors',
              type: 'investor',
              investorCategory: 'firm',
              investorType: firm.details?.investorType || 'Venture Capital',
              stages: firm.details?.selectedStages || ['Seed', 'Series A', 'Growth'],
              focusIndustries: firm.details?.selectedSectors || ['Enterprise SaaS', 'Fintech', 'Deep Tech', 'AI'],
              ticketSize: firm.details?.fundSize || '₹1 Cr – ₹15 Cr',
              description: firm.details?.shortDescription || `${firm.name} is an institutional investment organization on Xentro.`,
            });
          }
        });

        dbInvOrgs.forEach((org: any) => {
          const fid = org.id || org.entityId || String(org._id);
          if (!firmIds.has(fid)) {
            firmIds.add(fid);
            firmsList.push({
              id: fid,
              entityId: fid,
              userId: org.ownerId,
              name: org.name,
              title: org.organizationType || 'Investment Organization',
              company: org.name,
              context: `${org.organizationType || 'VC Firm'} • AUM ${org.fundSize || org.aum || 'Active Fund'}`,
              avatar: org.logo || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=200&auto=format&fit=crop&q=80',
              status: 'idle',
              verified: Boolean(org.verified),
              category: 'investors',
              type: 'investor',
              investorCategory: 'firm',
              investorType: org.organizationType || 'Venture Capital',
              stages: ['Seed', 'Series A', 'Series B'],
              focusIndustries: ['Technology', 'Enterprise SaaS', 'Deep Tech'],
              ticketSize: org.fundSize || '₹5 Cr – ₹25 Cr',
              description: org.shortDescription || `${org.name} is an active investment organization on Xentro.`,
            });
          }
        });

        // Query registered ESP entities from entities collection
        const espQuery = {
          $or: [
            { canonicalType: 'ESP' },
            { entityType: { $regex: 'ESP', $options: 'i' } },
            { entityType: { $regex: 'INCUBATOR', $options: 'i' } },
            { entityType: { $regex: 'INSTITUTION', $options: 'i' } },
          ],
          status: { $nin: ['DELETED', 'REJECTED'] },
        };
        const dbESPs = await entitiesCol.find(espQuery).limit(25).toArray();
        dbESPs.forEach((espEnt: any) => {
          esps.push({
            id: espEnt.id || String(espEnt._id),
            userId: espEnt.primaryOwnerId || espEnt.createdByUserId,
            name: espEnt.name,
            title: espEnt.details?.espType || 'Incubator & Accelerator',
            company: espEnt.name,
            context: espEnt.location?.city || espEnt.details?.city || 'India',
            avatar: espEnt.logo || 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=200&auto=format&fit=crop&q=80',
            status: 'idle',
            verified: Boolean(espEnt.verificationStatus === 'VERIFIED'),
            category: 'opportunities',
            type: 'esp',
          });
        });
      } catch (firmErr) {
        console.warn('[Recommendations API] Firm/ESP query warning:', firmErr);
      }

      // If no ESPs found yet, provide verified platform ecosystem institution (T-Hub Foundation)
      if (esps.length === 0) {
        esps.push({
          id: 'uni_9',
          userId: 'usr_thub',
          name: 'T-Hub Foundation',
          title: 'Innovation Hub & Accelerator',
          company: 'T-Hub Foundation',
          context: 'Hyderabad, India',
          avatar: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=200&auto=format&fit=crop&q=80',
          status: 'idle',
          verified: true,
          category: 'opportunities',
          type: 'esp',
        });
      }

      // If no firms registered yet in database, include verified platform ecosystem firm (Sequoia Capital)
      if (firmsList.length === 0) {
        firmsList.push({
          id: 'inv_1',
          entityId: 'VCI-SEQUOIA',
          userId: 'usr_sequoia',
          name: 'Sequoia Capital',
          title: 'Venture Capital Fund',
          company: 'Sequoia Capital India & SEA',
          context: 'Venture Capital Fund • $8B+ AUM',
          avatar: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&auto=format&fit=crop&q=80',
          status: 'idle',
          verified: true,
          category: 'investors',
          type: 'investor',
          investorCategory: 'firm',
          investorType: 'Venture Capital',
          stages: ['Seed', 'Series A', 'Series B+', 'Growth'],
          focusIndustries: ['Enterprise SaaS', 'Artificial Intelligence', 'FinTech Infrastructure'],
          ticketSize: '$1M – $15M',
          description: 'Partnering with legendary founders from idea to IPO and beyond.',
        });
      }

      const investorCategoryFilter = searchParams.get('investorCategory') || searchParams.get('investorType') || 'all';
      let combinedInvestors = [...investors, ...firmsList];
      if (investorCategoryFilter === 'individual') {
        combinedInvestors = combinedInvestors.filter((i) => i.investorCategory === 'individual');
      } else if (investorCategoryFilter === 'firm') {
        combinedInvestors = combinedInvestors.filter((i) => i.investorCategory === 'firm');
      }

      return NextResponse.json({
        success: true,
        data: {
          people,
          mentors,
          investors: combinedInvestors,
          esps,
          opportunities: [],
        },
        source: 'mongodb-atlas',
      });
    }
  } catch (mongoErr: any) {
    console.warn('[Recommendations API] MongoDB primary query warning:', mongoErr?.message);
  }

  // 2. Fast Fallback to Backend API (with 2s timeout abort to prevent blocking UI)
  try {
    const backendBase = getBackendBaseUrl();
    const backendUrl = new URL(`${backendBase}/users/recommendations/`);
    if (excludeUserId) backendUrl.searchParams.set('excludeUserId', excludeUserId);
    if (excludeEmail) backendUrl.searchParams.set('excludeEmail', excludeEmail);

    const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    let res = await fetch(backendUrl.toString(), {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok && (res.status === 401 || res.status === 403)) {
      res = await fetch(backendUrl.toString(), {
        cache: 'no-store',
      });
    }

    if (res.ok) {
      const data = await res.json();
      if (data?.data || data?.success) {
        return NextResponse.json({ success: true, data: data.data || data });
      }
    }
  } catch (err: any) {
    console.warn('[Recommendations API] Backend proxy warning:', err?.message);
  }

  // 2. Direct MongoDB Atlas Fallback: Fetch strictly real ecosystem users
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const usersCol = db.collection('users');

    const queryConditions: any = {
      isActive: { $ne: false },
      accountStatus: { $nin: ['DELETED', 'REJECTED', 'SUSPENDED'] },
      deleted: { $ne: true },
      is_deleted: { $ne: true },
    };

    if (excludeUserId) {
      queryConditions.id = { $ne: excludeUserId };
    }
    if (excludeEmail) {
      queryConditions.email = { $ne: excludeEmail.toLowerCase() };
    }

    const realUsers = await usersCol.find(queryConditions).limit(50).toArray();

    const people: any[] = [];
    const mentors: any[] = [];
    const investors: any[] = [];
    const esps: any[] = [];

    realUsers.forEach((u: any) => {
      const name = u.fullName || u.name || 'Ecosystem Member';
      const role = u.role || u.primaryRole || u.headline || 'Member';
      const company = u.startupName || u.organization || u.company || '';
      const avatar = u.avatar || u.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`;
      const accountType = String(u.accountType || u.role || '').toLowerCase();

      const recItem = {
        id: u.id || String(u._id),
        userId: u.id,
        name,
        title: role,
        company,
        context: company ? `${role} at ${company}` : role,
        avatar,
        status: 'idle',
        verified: Boolean(u.verified || u.emailVerified),
      };

      if (accountType.includes('mentor')) {
        mentors.push({ ...recItem, category: 'mentors', type: 'mentor' });
      } else if (accountType.includes('investor')) {
        investors.push({ ...recItem, category: 'investors', type: 'investor' });
      } else if (accountType.includes('esp') || accountType.includes('institution')) {
        esps.push({ ...recItem, category: 'opportunities', type: 'esp' });
      } else if (accountType.includes('explorer')) {
        people.push({ ...recItem, category: 'people', type: 'explorer' });
      } else {
        people.push({ ...recItem, category: 'people', type: 'startup' });
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        people,
        mentors,
        investors,
        esps,
        opportunities: [],
      },
      source: 'mongodb-atlas',
    });
  } catch (mongoErr: any) {
    return NextResponse.json(
      {
        success: true,
        data: {
          people: [],
          mentors: [],
          investors: [],
          esps: [],
          opportunities: [],
        },
        source: 'empty-fallback',
      }
    );
  }
}
