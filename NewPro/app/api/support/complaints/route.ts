import { NextRequest, NextResponse } from 'next/server';
import { getBackendBaseUrl } from '@/lib/backendUrl';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const backendBase = getBackendBaseUrl();
    const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const cookieToken = req.cookies.get('xentro_session')?.value;
    const token = authHdr || cookieToken;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const xUserId = req.headers.get('x-user-id');
    if (xUserId) headers['X-User-Id'] = xUserId;
    const xUserEmail = req.headers.get('x-user-email');
    if (xUserEmail) headers['X-User-Email'] = xUserEmail;
    const xUserName = req.headers.get('x-user-name');
    if (xUserName) headers['X-User-Name'] = xUserName;

    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const res = await fetch(`${backendBase}/support/complaints/`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const backendBase = getBackendBaseUrl();
    const authHdr = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const cookieToken = req.cookies.get('xentro_session')?.value;
    const token = authHdr || cookieToken;

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const xUserId = req.headers.get('x-user-id') || searchParams.get('userId') || searchParams.get('accountId');
    if (xUserId) headers['X-User-Id'] = xUserId;
    const xUserEmail = req.headers.get('x-user-email');
    if (xUserEmail) headers['X-User-Email'] = xUserEmail;
    const xUserName = req.headers.get('x-user-name');
    if (xUserName) headers['X-User-Name'] = xUserName;

    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const url = new URL(`${backendBase}/support/complaints/`);
    searchParams.forEach((val, key) => url.searchParams.set(key, val));

    const res = await fetch(url.toString(), {
      headers,
      cache: 'no-store',
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
