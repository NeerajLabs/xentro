import { NextRequest, NextResponse } from 'next/server';
import { getMongoClient } from '@/lib/mongodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const R2_ACCOUNT_ID = process.env.CLOUDFLARE_R2_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'xentro-storage';
const R2_ENDPOINT_URL =
  process.env.CLOUDFLARE_R2_ENDPOINT_URL ||
  (R2_ACCOUNT_ID ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : '');
const R2_PUBLIC_URL = (process.env.CLOUDFLARE_R2_PUBLIC_URL || 'https://media.xentro.in').replace(/\/+$/, '');

let cachedS3Client: S3Client | null = null;

function getR2Client(): S3Client | null {
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) return null;
  if (!cachedS3Client) {
    cachedS3Client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT_URL,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return cachedS3Client;
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
    const storageKey = `uploads/${uploadId}_${cleanOriginalName}`;

    let r2Uploaded = false;
    let r2Url: string | null = null;

    // 1. Attempt Cloudflare R2 Upload
    try {
      const r2 = getR2Client();
      if (r2) {
        await r2.send(
          new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: storageKey,
            Body: buffer,
            ContentType: mimeType,
          })
        );
        r2Uploaded = true;
        r2Url = `${R2_PUBLIC_URL}/${storageKey}`;
      }
    } catch (r2Err: any) {
      console.warn('[Upload API] Cloudflare R2 upload warning (falling back to MongoDB Atlas):', r2Err?.message);
    }

    // 2. Persist directly in MongoDB Atlas media_uploads for durable serverless storage
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
        r2Uploaded,
        r2Key: r2Uploaded ? storageKey : null,
        r2Url,
        createdAt: new Date().toISOString(),
      });
    } catch (mongoErr: any) {
      console.error('[Upload API] MongoDB Atlas storage error:', mongoErr);
    }

    // 3. Also write to public/uploads on disk for fast local development caching if writable
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

    // Durable serving URL: /api/uploads/${uploadId} serves directly from MongoDB Atlas
    // with zero dependency on unmapped external DNS domains (e.g. media.xentro.in)
    const durableUrl = `/api/uploads/${uploadId}`;

    return NextResponse.json({
      success: true,
      url: durableUrl,
      r2Url: r2Url || undefined,
      id: uploadId,
      filename: cleanOriginalName,
      size: buffer.length,
      mimeType,
      storage: r2Uploaded ? 'cloudflare-r2-and-mongodb' : 'mongodb-atlas',
    });
  } catch (err: any) {
    console.error('[Upload API] Error saving file:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Upload failed' }, { status: 500 });
  }
}
