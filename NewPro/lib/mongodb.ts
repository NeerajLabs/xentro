import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'xentro_db';

if (!MONGODB_URI && process.env.NODE_ENV === 'production') {
  console.error('[CRITICAL_SECURITY] Missing MONGODB_URI environment variable in production.');
}

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!MONGODB_URI) {
    throw new Error('Database configuration error: MONGODB_URI environment variable is not defined.');
  }
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

export async function getDatabase(): Promise<Db> {
  if (!cachedDb) {
    const client = await getMongoClient();
    cachedDb = client.db(DB_NAME);
  }
  return cachedDb;
}
