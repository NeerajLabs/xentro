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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const rawId = params.id || '';
  if (!rawId) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Remove file extension if present (e.g. upl_123.jpg -> upl_123)
  const cleanId = rawId.replace(/\.[a-zA-Z0-9]+$/, '');

  // 1. Fetch from MongoDB Atlas media_uploads collection
  try {
    const client = await getMongoClient();
    const db = client.db('xentro_db');
    const mediaCol = db.collection('media_uploads');

    const doc = await mediaCol.findOne({
      $or: [
        { id: cleanId },
        { id: rawId },
        { filename: cleanId },
        { filename: rawId },
        { _id: cleanId as any },
      ],
    });

    if (doc && doc.base64Data) {
      const buffer = Buffer.from(doc.base64Data, 'base64');
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': doc.mimeType || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Length': buffer.length.toString(),
        },
      });
    }
  } catch (mongoErr) {
    console.warn('[Uploads Serve] MongoDB lookup error:', mongoErr);
  }

  // 2. Check local public/uploads directory as disk fallback
  try {
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      const match = files.find((f) => f.includes(cleanId) || f === rawId);
      if (match) {
        const filePath = path.join(uploadsDir, match);
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(match).toLowerCase();
        const mimeMap: Record<string, string> = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.gif': 'image/gif',
          '.svg': 'image/svg+xml',
        };
        const mimeType = mimeMap[ext] || 'image/jpeg';
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Content-Length': buffer.length.toString(),
          },
        });
      }
    }
  } catch (_) {}

  return new NextResponse('File not found', { status: 404 });
}
