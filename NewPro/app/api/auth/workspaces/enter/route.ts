import { NextRequest, NextResponse } from 'next/server';
import { POST as workspacesPost } from '../route';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  return workspacesPost(req);
}
