/**
 * XENTRO V1 — INVESTOR WATCHLIST IDEMPOTENT INDEX PROVISIONING PROCEDURE
 * 
 * Purpose:
 *   Explicit, operator-governed provisioning of required MongoDB indexes
 *   for the investor_watchlists collection.
 * 
 * Safety & Guarantees:
 *   1. Inspects existing collection and index metadata.
 *   2. Detects any duplicate (ownerType, ownerId) ownership records.
 *   3. Never deletes, alters, or mutates existing records.
 *   4. Requires explicit operator flag '--confirm-production' before applying
 *      indexes to 'xentro_db'.
 *   5. Can be safely tested against 'xentro_test' (default target).
 *   6. Fully idempotent: safe to execute repeatedly.
 * 
 * Usage:
 *   - Test / Dry Run:
 *       node NewPro/scripts/provision_watchlist_indexes.cjs --db=xentro_test --inspect
 *   - Provision on Test Database:
 *       node NewPro/scripts/provision_watchlist_indexes.cjs --db=xentro_test
 *   - Inspect Production (Read-Only):
 *       node NewPro/scripts/provision_watchlist_indexes.cjs --db=xentro_db --inspect
 *   - Provision Production (Requires Operator Authorization):
 *       node NewPro/scripts/provision_watchlist_indexes.cjs --db=xentro_db --confirm-production
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  if (process.env.MONGODB_URI) return;
  const envPaths = [
    path.resolve(__dirname, '../.env.local'),
    path.resolve(__dirname, '../.env'),
    path.resolve(process.cwd(), 'NewPro/.env.local'),
    path.resolve(process.cwd(), '.env.local'),
  ];
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx > 0) {
            const key = trimmed.substring(0, eqIdx).trim();
            const val = trimmed.substring(eqIdx + 1).trim();
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      }
      break;
    }
  }
}
loadEnv();

const PRODUCTION_DATABASES = ['xentro_db', 'xentro_production', 'xentro_prod', 'xentro_live'];

// Parse CLI flags
const args = process.argv.slice(2);
const dbArg = args.find(a => a.startsWith('--db='));
const targetDbName = dbArg ? dbArg.split('=')[1] : 'xentro_test';
const isInspectOnly = args.includes('--inspect') || args.includes('--dry-run');
const hasProductionConfirmation = args.includes('--confirm-production');

const isProductionTarget = PRODUCTION_DATABASES.includes(targetDbName.toLowerCase().trim());

async function runProvisioning() {
  console.log('========================================================================');
  console.log('XENTRO V1 — INVESTOR WATCHLIST INDEX PROVISIONING');
  console.log('========================================================================');
  console.log(`Timestamp:             ${new Date().toISOString()}`);
  console.log(`Target Database:       ${targetDbName}`);
  console.log(`Mode:                  ${isInspectOnly ? 'INSPECT ONLY (Dry Run)' : 'PROVISION'}`);
  console.log(`Production Guard:      ${isProductionTarget ? (hasProductionConfirmation ? 'AUTHORIZED (--confirm-production)' : 'PROTECTED (Read-Only)') : 'TEST / ISOLATED'}`);
  console.log('========================================================================\n');

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('ERROR: MONGODB_URI environment variable is required.');
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(`[OK] Connected to MongoDB Atlas.`);
    const db = client.db(targetDbName);
    const col = db.collection('investor_watchlists');

    // -------------------------------------------------------------------------
    // STEP 1: Inspect existing collection and indexes
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 1: Inspecting Existing Metadata ---');
    const docCount = await col.countDocuments();
    console.log(`Total documents in 'investor_watchlists': ${docCount}`);

    let existingIndexes = [];
    try {
      existingIndexes = await col.indexes();
      console.log(`Found ${existingIndexes.length} existing index(es):`);
      for (const idx of existingIndexes) {
        console.log(`  - Name: "${idx.name}", Keys: ${JSON.stringify(idx.key)}, Unique: ${!!idx.unique}`);
      }
    } catch (idxErr) {
      console.log(`Collection might not have indexes yet: ${idxErr.message}`);
    }

    // -------------------------------------------------------------------------
    // STEP 2: Detect Duplicate Ownership Records
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 2: Duplicate Ownership Record Detection ---');
    const duplicates = await col.aggregate([
      {
        $group: {
          _id: { ownerType: '$ownerType', ownerId: '$ownerId' },
          count: { $sum: 1 },
          records: {
            $push: {
              id: '$id',
              _id: '$_id',
              createdAt: '$createdAt',
              startupCount: { $size: { $ifNull: ['$startups', []] } },
            },
          },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]).toArray();

    if (duplicates.length > 0) {
      console.error(`\n[CRITICAL ERROR] Found ${duplicates.length} duplicate (ownerType, ownerId) group(s)!`);
      console.error('Unique index provisioning CANNOT proceed while duplicate records exist.');
      console.error('Details:');
      for (const dup of duplicates) {
        console.error(`  Group: ownerType="${dup._id.ownerType}", ownerId="${dup._id.ownerId}", Count: ${dup.count}`);
        for (const rec of dup.records) {
          console.error(`    Doc ID: ${rec.id || rec._id}, Startups: ${rec.startupCount}, CreatedAt: ${rec.createdAt}`);
        }
      }
      console.error('\nPolicy: Existing records are NEVER deleted or altered automatically.');
      console.error('Resolution: Operator must review duplicate documents manually before applying indexes.');
      process.exit(1);
    } else {
      console.log(`[PASS] Zero duplicate ownership records detected. Data integrity is clean.`);
    }

    // Check if unique index already exists
    const hasOwnerUniqueIndex = existingIndexes.some(idx => {
      const k = idx.key || {};
      return k.ownerType === 1 && k.ownerId === 1 && idx.unique === true;
    });

    const hasStartupLookupIndex = existingIndexes.some(idx => {
      const k = idx.key || {};
      return k['startups.startupId'] === 1;
    });

    console.log(`\nIndex Status:`);
    console.log(`  - Unique (ownerType, ownerId):     ${hasOwnerUniqueIndex ? 'PRESENT (Provisioned)' : 'ABSENT'}`);
    console.log(`  - Lookup (startups.startupId):     ${hasStartupLookupIndex ? 'PRESENT (Provisioned)' : 'ABSENT'}`);

    // If inspect only, finish here
    if (isInspectOnly) {
      console.log('\n[INSPECT COMPLETE] Inspection completed without modifying any schema or records.');
      if (!hasOwnerUniqueIndex) {
        console.log(`Release Prerequisite: Index '{ ownerType: 1, ownerId: 1 } (unique)' must be provisioned before production release.`);
      }
      await client.close();
      return;
    }

    // -------------------------------------------------------------------------
    // STEP 3: Production Operator Guard Check
    // -------------------------------------------------------------------------
    if (isProductionTarget && !hasProductionConfirmation) {
      console.log('\n========================================================================');
      console.log('[PRODUCTION GUARD] Production database target detected: ' + targetDbName);
      console.log('Production schema modifications require explicit operator authorization.');
      console.log('To provision indexes in production, rerun with:');
      console.log(`  node NewPro/scripts/provision_watchlist_indexes.cjs --db=${targetDbName} --confirm-production`);
      console.log('========================================================================\n');
      console.log(`Release Prerequisite Status: AWAITING_OPERATOR_APPROVAL`);
      await client.close();
      return;
    }

    // -------------------------------------------------------------------------
    // STEP 4: Idempotent Index Creation
    // -------------------------------------------------------------------------
    console.log('\n--- STEP 4: Applying Idempotent Index Provisioning ---');

    if (hasOwnerUniqueIndex) {
      console.log(`[SKIP] Unique index on { ownerType: 1, ownerId: 1 } already exists.`);
    } else {
      console.log(`Creating unique index 'idx_watchlist_owner_unique' on { ownerType: 1, ownerId: 1 }...`);
      await col.createIndex(
        { ownerType: 1, ownerId: 1 },
        { unique: true, name: 'idx_watchlist_owner_unique' }
      );
      console.log(`[SUCCESS] Unique index 'idx_watchlist_owner_unique' created successfully.`);
    }

    // Final verification
    const verifiedIndexes = await col.indexes();
    console.log('\n--- VERIFICATION OF PROVISIONED INDEXES ---');
    for (const idx of verifiedIndexes) {
      console.log(`  - "${idx.name}": keys=${JSON.stringify(idx.key)}, unique=${!!idx.unique}`);
    }
    console.log('\n[COMPLETE] Index provisioning procedure finished successfully.');

  } finally {
    await client.close();
  }
}

runProvisioning().catch(err => {
  console.error('\n[FATAL ERROR]:', err);
  process.exit(1);
});
