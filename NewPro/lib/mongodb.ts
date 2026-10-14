import { MongoClient, Db } from 'mongodb';
import { resolveAndValidateDatabaseConfig, redactMongoUri } from './dbSafetyGuard';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  const config = resolveAndValidateDatabaseConfig();
  if (!config.uri) {
    throw new Error('Database configuration error: MongoDB connection URI is not defined.');
  }
  if (!cachedClient) {
    try {
      cachedClient = new MongoClient(config.uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      });
      await cachedClient.connect();
    } catch (err: any) {
      console.error(`[DATABASE_CONNECTION_ERROR] Failed to connect to ${redactMongoUri(config.uri)}:`, err?.message);
      throw err;
    }
  }
  return cachedClient;
}

export async function getDatabase(): Promise<Db> {
  if (!cachedDb) {
    const config = resolveAndValidateDatabaseConfig();
    const client = await getMongoClient();
    cachedDb = client.db(config.dbName);
  }
  return cachedDb;
}

