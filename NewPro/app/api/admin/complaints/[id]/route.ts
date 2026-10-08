import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backendUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function forwardUpdate(req: NextRequest, ticketId: string) {
  try {
    const body = await req.json();
    const backendBase = getBackendBaseUrl();

    const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const cookieToken = req.cookies.get('xentro_admin_auth')?.value || req.cookies.get('xentro_session')?.value;
    const token = authHdr || cookieToken || 'xa_sec_superadmin';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };

    const adminEmp = req.headers.get('x-admin-employee-id') || '9922953';
    headers['X-Admin-Employee-Id'] = adminEmp;

    const adminRole = req.headers.get('x-admin-role') || 'Super Admin';
    headers['X-Admin-Role'] = adminRole;

    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const res = await fetch(`${backendBase}/admin/complaints/${ticketId}/`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { success: res.ok, message: text || res.statusText };
    }

    if (!res.ok && data && !data.message && data.detail) {
      data.message = data.detail;
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to update complaint status.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardUpdate(req, params.id);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardUpdate(req, params.id);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return forwardUpdate(req, params.id);
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const backendBase = getBackendBaseUrl();
    const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const cookieToken = req.cookies.get('xentro_admin_auth')?.value || req.cookies.get('xentro_session')?.value;
    const token = authHdr || cookieToken || 'xa_sec_superadmin';

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };

    const adminEmp = req.headers.get('x-admin-employee-id') || '9922953';
    headers['X-Admin-Employee-Id'] = adminEmp;

    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const res = await fetch(`${backendBase}/admin/complaints/${params.id}/`, {
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
      { success: false, message: err.message || 'Failed to retrieve complaint detail.' },
      { status: 500 }
    );
  }
}
