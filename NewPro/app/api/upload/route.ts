import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    await cachedClient.connect();
  }
  return cachedClient;
}

export async function POST(req: NextRequest) {
  try {
    let buffer: Buffer;
    let filename = 'upload.jpg';
    let mimeType = 'image/jpeg';
    let size = 0;

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
      }

      filename = file.name || 'image.jpg';
      mimeType = file.type || 'image/jpeg';
      size = file.size;
      const bytes = await file.arrayBuffer();
      buffer = Buffer.from(bytes);
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      const dataUrl = body?.dataUrl || body?.base64;
      if (!dataUrl) {
        return NextResponse.json({ success: false, error: 'dataUrl required in JSON payload' }, { status: 400 });
      }

      filename = body?.filename || 'image.jpg';
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(dataUrl, 'base64');
      }
      size = buffer.length;
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported Content-Type. Expected multipart/form-data or application/json' },
        { status: 400 }
      );
    }

    const cleanOriginalName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uploadId = `upl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Persist directly in MongoDB Atlas media_uploads for durable serverless storage
    try {
      const client = await getMongoClient();
      const db = client.db('xentro_db');
      const mediaCol = db.collection('media_uploads');

      await mediaCol.insertOne({
        id: uploadId,
        filename: cleanOriginalName,
        mimeType: mimeType || 'image/jpeg',
        size: buffer.length,
        base64Data: buffer.toString('base64'),
        createdAt: new Date().toISOString(),
      });
    } catch (mongoErr: any) {
      console.error('[Upload API] MongoDB Atlas storage error:', mongoErr);
    }

    // 2. Also write to public/uploads on disk for fast local development caching if writable
    try {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const diskFilename = `${uploadId}_${cleanOriginalName}`;
      fs.writeFileSync(path.join(uploadsDir, diskFilename), buffer);
    } catch (_) {
      // In serverless / read-only disk environments (Vercel), ignore disk write failure
    }

    const durableUrl = `/api/uploads/${uploadId}`;

    return NextResponse.json({
      success: true,
      url: durableUrl,
      id: uploadId,
      filename: cleanOriginalName,
      size: buffer.length,
      mimeType,
    });
  } catch (err: any) {
    console.error('[Upload API] Error saving file:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
