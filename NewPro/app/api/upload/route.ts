import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Clean and sanitize filename
    const cleanOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueFilename = `${Date.now()}_${cleanOriginalName}`;
    const destinationPath = path.join(uploadsDir, uniqueFilename);

    // Save binary to disk
    fs.writeFileSync(destinationPath, buffer);

    const publicUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err: any) {
    console.error('[Upload API] Error saving file:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
