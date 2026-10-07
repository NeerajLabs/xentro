import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const excludeUserId = searchParams.get('excludeUserId') || '';
    const excludeEmail = searchParams.get('excludeEmail') || '';

    const backendUrl = new URL('http://127.0.0.1:8000/api/v1/users/recommendations/');
    if (excludeUserId) backendUrl.searchParams.set('excludeUserId', excludeUserId);
    if (excludeEmail) backendUrl.searchParams.set('excludeEmail', excludeEmail);

    const token = req.cookies.get('xentro_session')?.value || req.headers.get('authorization')?.replace('Bearer ', '');
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let res = await fetch(backendUrl.toString(), {
      headers,
      cache: 'no-store',
    });

    if (!res.ok && (res.status === 401 || res.status === 403)) {
      res = await fetch(backendUrl.toString(), {
        cache: 'no-store',
      });
    }

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ success: true, data: data.data || data });
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch recommendations' }, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
