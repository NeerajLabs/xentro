import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Authorized static admin credentials held securely on the server only.
// NEVER bundled or exposed in client-side code.
const SERVER_ADMIN_REGISTRY: Record<
  string,
  {
    passwords: string[];
    name: string;
    role: string;
    department: string;
    email: string;
  }
> = {
  '9922953': {
    passwords: ['Kar04052003', 'kar04052003'],
    name: 'Karunya Kranthi Kumar',
    role: 'Super Admin',
    department: 'Executive Operations',
    email: 'karunya@xentro.in',
  },
  '8121417': {
    passwords: ['Sra231206', 'sra231206'],
    name: 'Sravan Kumar',
    role: 'Super Admin',
    department: 'Platform Architecture & Security',
    email: 'sravan@xentro.in',
  },
  'admin': {
    passwords: ['Sra231206', 'sra231206'],
    name: 'Sravan Kumar',
    role: 'Super Admin',
    department: 'Platform Architecture & Security',
    email: 'sravan@xentro.in',
  },
  '9911223': {
    passwords: ['Kar04052003', 'kar04052003'],
    name: 'Karunya Kranthi Kumar',
    role: 'Super Admin',
    department: 'Executive Operations',
    email: 'karunya@xentro.in',
  },
};

const ALL_SUPERADMIN_PERMISSIONS = [
  'admin:access',
  'users:read',
  'users:write',
  'users:ban',
  'startups:verify',
  'startups:reject',
  'startups:write',
  'content:moderate',
  'content:delete',
  'system:settings',
  'system:logs',
  'audit:view',
  'finance:view',
  'finance:manage',
  'super:all',
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const employeeId = String(body?.employeeId || '').trim();
    const password = String(body?.password || '').trim();

    if (!employeeId || !password) {
      return NextResponse.json(
        { success: false, message: 'Employee ID and password are required' },
        { status: 400 }
      );
    }

    let matchedAdmin: any = null;

    // 1. Check Server-Side Registry (Instant & Zero Cold-Start)
    const normalizedId = employeeId.toLowerCase();
    const serverEntryKey = Object.keys(SERVER_ADMIN_REGISTRY).find(
      (k) => k.toLowerCase() === normalizedId
    );

    if (serverEntryKey) {
      const entry = SERVER_ADMIN_REGISTRY[serverEntryKey];
      const valid = entry.passwords.some(
        (p) => p === password || p.toLowerCase() === password.toLowerCase()
      );
      if (valid) {
        matchedAdmin = {
          employeeId: serverEntryKey,
          name: entry.name,
          role: entry.role,
          department: entry.department,
          permissions: ALL_SUPERADMIN_PERMISSIONS,
        };
      }
    }

    // 2. Check MongoDB Atlas admin_users collection if not found in static registry
    if (!matchedAdmin) {
      try {
        const db = await getDatabase();
        const adminCol = db.collection('admin_users');
        const dbAdmin = await adminCol.findOne({
          $or: [
            { employeeId },
            { employeeId: employeeId.toLowerCase() },
            { username: employeeId.toLowerCase() },
            { email: employeeId.toLowerCase() },
          ],
        });

        if (dbAdmin) {
          const passValid =
            dbAdmin.password === password ||
            dbAdmin.passwordHash === crypto.createHash('sha256').update(password).digest('hex');

          if (passValid) {
            matchedAdmin = {
              employeeId: dbAdmin.employeeId || employeeId,
              name: dbAdmin.name || 'Admin User',
              role: dbAdmin.role || 'Super Admin',
              department: dbAdmin.department || 'Operations',
              permissions: dbAdmin.permissions || ALL_SUPERADMIN_PERMISSIONS,
            };
          }
        }
      } catch (dbErr: any) {
        console.warn('[Admin Login] MongoDB check warning:', dbErr?.message);
      }
    }

    // 3. Optional Proxy to Django Backend (Fast 1.5s timeout abort)
    if (!matchedAdmin) {
      try {
        const backendUrl = getBackendBaseUrl();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1500);

        const resp = await fetch(`${backendUrl}/admin/auth/login/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employeeId, password }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = await resp.json();
          if (data?.success && data?.data?.session) {
            const s = data.data.session;
            matchedAdmin = {
              employeeId: s.employeeId,
              name: s.name,
              role: s.role,
              department: s.department,
              permissions: s.permissions || ALL_SUPERADMIN_PERMISSIONS,
            };
          }
        }
      } catch (backErr) {
        // Backend cold or unavailable
      }
    }

    if (!matchedAdmin) {
      return NextResponse.json(
        { success: false, message: 'Invalid administrative credentials or unassigned role' },
        { status: 401 }
      );
    }

    const sessionToken =
      'xa_sec_' + crypto.randomBytes(24).toString('hex') + '_' + Date.now().toString(36);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const session = {
      employeeId: matchedAdmin.employeeId,
      name: matchedAdmin.name,
      role: matchedAdmin.role,
      department: matchedAdmin.department,
      permissions: matchedAdmin.permissions,
      token: sessionToken,
      expiresAt,
    };

    const res = NextResponse.json({
      success: true,
      data: {
        session,
      },
    });

    // Set secure HTTP-only cookie for admin
    res.cookies.set('xentro_admin_auth', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return res;
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error during authentication' },
      { status: 500 }
    );
  }
}
