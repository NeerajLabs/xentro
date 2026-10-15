import { MongoClient, Db } from 'mongodb';
import { resolveAndValidateDatabaseConfig, redactMongoUri } from './dbSafetyGuard';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let indexesEnsured = false;

/**
 * Ensures required unique and performance indexes exist on MongoDB Atlas
 * for the Affiliation Link System.
 */
export async function ensureAffiliationIndexes(db: Db): Promise<void> {
  if (indexesEnsured) return;
  try {
    // 1. Storage-engine enforced unique constraint: Exactly one active affiliation per pair
    await db.collection('affiliations').createIndex(
      { startupEntityId: 1, issuingEntityId: 1 },
      {
        unique: true,
        partialFilterExpression: { status: 'Active' },
        name: 'unique_active_affiliation_pair',
      }
    );

    // 2. Storage-engine enforced token uniqueness on invitations
    await db.collection('affiliate_links').createIndex(
      { tokenHash: 1 },
      { unique: true, sparse: true, name: 'unique_invitation_token_hash' }
    );

    // 3. Performance lookups for dashboard & capacity enforcement
    await db.collection('affiliations').createIndex(
      { issuingEntityId: 1, status: 1 },
      { name: 'idx_affiliations_issuing_status' }
    );
    await db.collection('affiliations').createIndex(
      { startupEntityId: 1, status: 1 },
      { name: 'idx_affiliations_startup_status' }
    );
    await db.collection('affiliate_links').createIndex(
      { issuingEntityId: 1, status: 1 },
      { name: 'idx_links_issuing_status' }
    );
    await db.collection('entitlements').createIndex(
      { affiliationId: 1 },
      { name: 'idx_entitlements_affiliation_id' }
    );

    // 4. Distributed ESP capacity unique index
    await db.collection('esp_affiliate_capacities').createIndex(
      { espEntityId: 1 },
      { unique: true, name: 'unique_esp_capacity_entity' }
    );

    // 5. Internal admin sessions unique index
    await db.collection('admin_sessions').createIndex(
      { token: 1 },
      { unique: true, name: 'unique_admin_session_token' }
    );

    indexesEnsured = true;
  } catch (err: any) {
    // Index may already exist or running in constrained environment
    console.warn('[MONGODB_INDEX_NOTICE]', err?.message);
  }
}

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
    // Asynchronously ensure indexes exist
    ensureAffiliationIndexes(cachedDb).catch(() => {});
  }
  return cachedDb;
}
