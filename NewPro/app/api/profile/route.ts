import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const userId = req.headers.get('x-user-id') || req.nextUrl.searchParams.get('userId') || '';

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;

    const res = await fetch(`http://127.0.0.1:8000/api/v1/auth/profile/?userId=${encodeURIComponent(userId)}`, {
      headers,
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data);
    }
    return NextResponse.json({ success: false, message: 'Failed to fetch profile from backend' }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const userId = req.headers.get('x-user-id') || body.userId || '';

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (userId) headers['X-User-Id'] = userId;

    const res = await fetch('http://127.0.0.1:8000/api/v1/auth/profile/', {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
