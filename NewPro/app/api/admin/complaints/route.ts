import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backendUrl';
import { getMongoClient } from '@/lib/mongodb';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const backendBase = getBackendBaseUrl();

  const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
  const cookieToken =
    req.cookies.get('xentro_admin_auth')?.value || req.cookies.get('xentro_session')?.value;
  const token = authHdr || cookieToken;
  if (!token) {
    return NextResponse.json(
      { success: false, message: 'Authentication required. Admin session token is missing.' },
      { status: 401 }
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/json',
  };

  const adminEmp = req.headers.get('x-admin-employee-id');
  if (adminEmp) headers['X-Admin-Employee-Id'] = adminEmp;

  const adminRole = req.headers.get('x-admin-role');
  if (adminRole) headers['X-Admin-Role'] = adminRole;

  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) headers['Cookie'] = cookieHeader;

  // 1. Try backend proxy
  let backendSuccess = false;
  let backendData: any = null;
  let backendStatus = 500;

  try {
    const url = new URL(`${backendBase}/admin/complaints/`);
    searchParams.forEach((val, key) => url.searchParams.set(key, val));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    backendStatus = res.status;
    const text = await res.text();
    try {
      backendData = JSON.parse(text);
      if (
        res.ok &&
        (backendData?.success ||
          Array.isArray(backendData?.data?.complaints) ||
          Array.isArray(backendData?.complaints))
      ) {
        backendSuccess = true;
      }
    } catch {
      backendData = null;
    }
  } catch (err: any) {
    console.warn('[Admin Complaints GET list] Backend error:', err?.message || err);
  }

  if (backendSuccess && backendData) {
    return NextResponse.json(backendData, { status: backendStatus });
  }

  // 2. Direct MongoDB Atlas Fallback
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const ticketsCol = db.collection('support_tickets');

    const statusParam = searchParams.get('status');
    const query: any = {};
    if (statusParam) {
      query.status = statusParam.toUpperCase();
    }

    const docs = await ticketsCol.find(query).sort({ createdAt: -1 }).toArray();
    const complaints = docs.map((doc: any) => {
      const { _id, ...clean } = doc;
      return {
        ...clean,
        id: clean.id || clean.ticketId || clean.referenceId || String(_id),
        adminReplies: Array.isArray(clean.adminReplies) ? clean.adminReplies : [],
      };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Success',
        data: {
          complaints,
          count: complaints.length,
        },
        complaints,
        count: complaints.length,
        source: 'mongodb-atlas',
      },
      { status: 200 }
    );
  } catch (mongoErr: any) {
    console.error('[Admin Complaints GET list] MongoDB fallback error:', mongoErr);
    return NextResponse.json(
      {
        success: false,
        message: backendData?.message || mongoErr?.message || 'Failed to retrieve admin complaints.',
      },
      { status: 500 }
    );
  }
}
