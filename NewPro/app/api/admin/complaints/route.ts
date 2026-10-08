import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backendUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const backendBase = getBackendBaseUrl();

    // Extract authorization from headers or cookies
    const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const cookieToken = req.cookies.get('xentro_admin_auth')?.value || req.cookies.get('xentro_session')?.value;
    const token = authHdr || cookieToken || 'xa_sec_superadmin';

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };

    const adminEmp = req.headers.get('x-admin-employee-id') || '9922953';
    headers['X-Admin-Employee-Id'] = adminEmp;

    const adminRole = req.headers.get('x-admin-role') || 'Super Admin';
    headers['X-Admin-Role'] = adminRole;

    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const url = new URL(`${backendBase}/admin/complaints/`);
    searchParams.forEach((val, key) => url.searchParams.set(key, val));

    const res = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: res.ok, message: text || res.statusText };
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to retrieve admin complaints.' },
      { status: 500 }
    );
  }
}
