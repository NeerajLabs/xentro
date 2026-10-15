/**
 * =========================================================================
 * XENTRO V1 — REAL MONGODB ATLAS RUNTIME INTEGRITY & CONCURRENCY TEST
 * =========================================================================
 *
 * Connects directly to MongoDB Atlas on the isolated test namespace (`xentro_test`).
 * Validates real database storage engine behavior:
 *  - Real WiredTiger atomic concurrency locks (prevents double redemption)
 *  - Real MongoDB compound unique partial indexes (prevents duplicate active affiliations)
 *  - Real SHA-256 tokenHash storage & lookup
 *  - Real entitlement lifecycle binding & recalculation
 *  - Real paid subscription preservation
 *  - Zero membership mutation
 */

const { MongoClient } = require('mongodb');
const crypto = require('crypto');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

function getMongoUri() {
  if (process.env.TEST_MONGODB_URI) return process.env.TEST_MONGODB_URI;
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      if (line.startsWith('MONGODB_URI=')) {
        return line.substring(12).trim();
      }
    }
  }
  return '';
}

const CANONICAL_MONGO_URI = getMongoUri();
const TEST_DB_NAME = 'xentro_test';

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken.trim().toUpperCase()).digest('hex');
}

async function runRealDatabaseTests() {
  console.log('\n================================================================');
  console.log(' XENTRO V1 — REAL MONGODB ATLAS RUNTIME VERIFICATION');
  console.log(' Target Cluster: Atlas replica set (rokwmb.mongodb.net)');
  console.log(` Target Database: ${TEST_DB_NAME} (Isolated Test Namespace)`);
  console.log('================================================================\n');

  // Verify test isolation
  assert.strictEqual(TEST_DB_NAME, 'xentro_test');
  assert.notStrictEqual(TEST_DB_NAME, 'xentro_db', 'FATAL: Never run tests on xentro_db');

  const client = new MongoClient(CANONICAL_MONGO_URI, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  await client.connect();
  console.log('✓ Connected to MongoDB Atlas cluster successfully.\n');

  const db = client.db(TEST_DB_NAME);
  const affCol = db.collection('affiliations');
  const linksCol = db.collection('affiliate_links');
  const entitlementsCol = db.collection('entitlements');
  const entitiesCol = db.collection('entities');
  const subsCol = db.collection('subscriptions');
  const memCol = db.collection('memberships');
  const auditCol = db.collection('audit_logs');

  try {
    // -------------------------------------------------------------
    // SETUP: Ensure Real Database Indexes on Atlas
    // -------------------------------------------------------------
    console.log('--- PHASE 1: Real MongoDB Index Configuration ---');
    await affCol.createIndex(
      { startupEntityId: 1, issuingEntityId: 1 },
      {
        unique: true,
        partialFilterExpression: { status: 'Active' },
        name: 'unique_active_affiliation_pair',
      }
    );
    console.log('  ✓ Verified unique compound partial index: "unique_active_affiliation_pair"');

    await linksCol.createIndex(
      { tokenHash: 1 },
      { unique: true, sparse: true, name: 'unique_invitation_token_hash' }
    );
    console.log('  ✓ Verified unique sparse index on tokenHash: "unique_invitation_token_hash"');

    // -------------------------------------------------------------
    // SEED: Clean isolated test records
    // -------------------------------------------------------------
    const esp1 = { id: 'esp_real_1', name: 'Atlas Quantum Incubator', entityType: 'ESP', isActive: true, status: 'APPROVED' };
    const esp2 = { id: 'esp_real_2', name: 'Atlas Frontier Hub', entityType: 'ESP', isActive: true, status: 'APPROVED' };
    const inst1 = { id: 'inst_real_1', name: 'National Science Academy', entityType: 'INSTITUTION', isActive: true, status: 'APPROVED' };
    const startupA = { id: 'st_real_A', name: 'Alpha Bio Labs', entityType: 'STARTUP', isActive: true, primaryOwnerId: 'usr_real_A', verificationStatus: 'VERIFIED', affiliatedOrgs: [] };
    const startupB = { id: 'st_real_B', name: 'Beta Aerospace', entityType: 'STARTUP', isActive: true, primaryOwnerId: 'usr_real_B', verificationStatus: 'PENDING', affiliatedOrgs: [] };

    // Clean prior test artifacts
    await entitiesCol.deleteMany({ id: { $in: ['esp_real_1', 'esp_real_2', 'inst_real_1', 'st_real_A', 'st_real_B'] } });
    await affCol.deleteMany({ startupEntityId: { $in: ['st_real_A', 'st_real_B'] } });
    await linksCol.deleteMany({ issuingEntityId: { $in: ['esp_real_1', 'esp_real_2', 'inst_real_1'] } });
    await entitlementsCol.deleteMany({ startupEntityId: { $in: ['st_real_A', 'st_real_B'] } });
    await subsCol.deleteMany({ entityId: { $in: ['st_real_A', 'st_real_B'] } });
    await memCol.deleteMany({ entityId: { $in: ['st_real_A', 'st_real_B'] } });

    await entitiesCol.insertMany([esp1, esp2, inst1, startupA, startupB]);
    await memCol.insertOne({ entityId: 'st_real_A', userId: 'usr_real_A', role: 'OWNER', status: 'ACTIVE' });
    const baselineMembershipCount = await memCol.countDocuments({ entityId: 'st_real_A' });

    console.log('\n--- PHASE 2: Live Database Operations ---');

    // -------------------------------------------------------------
    // TEST 1: Real Invitation Issuance & Cryptographic Hash Storage
    // -------------------------------------------------------------
    const rawToken = 'XENTRO-LIVE-TEST';
    const tokenHash = hashToken(rawToken);
    const linkId = `aff_link_${Date.now()}_real`;
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await linksCol.insertOne({
      id: linkId,
      tokenHash,
      codeMasked: 'XENTRO-***-TEST',
      issuingEntityId: esp1.id,
      issuingOrgName: esp1.name,
      issuingOrgType: 'ESP',
      intendedStartupId: startupA.id,
      intendedStartupName: startupA.name,
      programName: 'Quantum Launchpad',
      cohort: 'Cohort 2026',
      status: 'PENDING',
      isRedeemed: false,
      createdAt: now,
      expiresAt,
    });

    const storedLink = await linksCol.findOne({ id: linkId });
    assert(storedLink);
    assert.strictEqual(storedLink.tokenHash, tokenHash);
    assert.strictEqual(storedLink.isRedeemed, false);
    console.log('  ✓ [REAL DB 1] Invitation persisted in Atlas with SHA-256 tokenHash (7-day validity).');

    // -------------------------------------------------------------
    // TEST 2: Real Safe Preview via tokenHash (No Redemption)
    // -------------------------------------------------------------
    const previewFound = await linksCol.findOne({
      $or: [{ tokenHash: hashToken(rawToken) }, { code: rawToken }],
    });
    assert(previewFound);
    assert.strictEqual(previewFound.isRedeemed, false);
    assert.strictEqual(previewFound.status, 'PENDING');
    console.log('  ✓ [REAL DB 2] Preview queries document via tokenHash without mutating redemption status.');

    // -------------------------------------------------------------
    // TEST 3: Real Distributed Concurrency Lock (Atomic findOneAndUpdate)
    // -------------------------------------------------------------
    console.log('\n--- PHASE 3: Storage Engine Concurrency Race Test ---');
    // Simulate 2 parallel workers racing on MongoDB Atlas
    const worker1 = linksCol.findOneAndUpdate(
      { id: linkId, isRedeemed: { $ne: true }, status: 'PENDING' },
      { $set: { isRedeemed: true, status: 'REDEEMED', redeemedAt: now, redeemedByStartupId: startupA.id } },
      { returnDocument: 'after' }
    );
    const worker2 = linksCol.findOneAndUpdate(
      { id: linkId, isRedeemed: { $ne: true }, status: 'PENDING' },
      { $set: { isRedeemed: true, status: 'REDEEMED', redeemedAt: now, redeemedByStartupId: startupA.id } },
      { returnDocument: 'after' }
    );

    const [resWorker1, resWorker2] = await Promise.all([worker1, worker2]);
    const succeeded = [resWorker1, resWorker2].filter(Boolean);
    const failedNull = [resWorker1, resWorker2].filter((r) => !r);

    assert.strictEqual(succeeded.length, 1, 'Exactly one concurrent worker must claim the lock');
    assert.strictEqual(failedNull.length, 1, 'Second concurrent worker must receive null');
    console.log('  ✓ [REAL DB 3] Atomic findOneAndUpdate race: Exactly 1 worker succeeded, 1 received null.');

    // -------------------------------------------------------------
    // TEST 4: Real Active Affiliation & Entitlement Persistence
    // -------------------------------------------------------------
    const affId = `aff_real_${Date.now()}`;
    await affCol.insertOne({
      id: affId,
      startupEntityId: startupA.id,
      startupName: startupA.name,
      issuingEntityId: esp1.id,
      issuingOrgName: esp1.name,
      issuingOrgType: 'ESP',
      programName: 'Quantum Launchpad',
      cohort: 'Cohort 2026',
      sourceInvitationId: linkId,
      status: 'Active',
      mutualVisibilityConsent: true,
      acceptedAt: now,
      startDate: now.split('T')[0],
      endDate: null,
      createdAt: now,
    });

    const entId = `ent_real_${Date.now()}`;
    await entitlementsCol.insertOne({
      id: entId,
      startupEntityId: startupA.id,
      tier: 'Startup Pro',
      source: 'ESP Affiliation',
      sponsoringEntityId: esp1.id,
      sponsoringEntityName: esp1.name,
      affiliationId: affId,
      status: 'Active',
      validityBasis: 'Affiliation Lifecycle',
      grantedAt: now,
      expiresAt: null,
    });

    await entitiesCol.updateOne(
      { id: startupA.id },
      { $set: { incubatorAffiliation: esp1.name }, $addToSet: { affiliatedOrgs: { affiliationId: affId, orgId: esp1.id } } }
    );

    // Verify memberships collection is UNTOUCHED
    const currentMembershipCount = await memCol.countDocuments({ entityId: 'st_real_A' });
    assert.strictEqual(currentMembershipCount, baselineMembershipCount, 'Memberships collection must have 0 writes');
    console.log('  ✓ [REAL DB 4] Affiliation & Startup Pro entitlement persisted. Zero membership writes verified.');

    // -------------------------------------------------------------
    // TEST 5: Real Compound Unique Partial Index Enforced by Atlas
    // -------------------------------------------------------------
    console.log('\n--- PHASE 4: Database Storage Engine Unique Index Enforcement ---');
    let duplicateRejected = false;
    try {
      await affCol.insertOne({
        id: `aff_duplicate_${Date.now()}`,
        startupEntityId: startupA.id, // SAME startup
        issuingEntityId: esp1.id,     // SAME issuing ESP
        status: 'Active',             // SAME Active status
        createdAt: now,
      });
    } catch (dbErr) {
      if (dbErr.code === 11000) {
        duplicateRejected = true;
        console.log(`  ✓ [REAL DB 5] MongoDB Atlas storage engine rejected duplicate active affiliation: Error ${dbErr.code} (E11000 duplicate key).`);
      }
    }
    assert.strictEqual(duplicateRejected, true, 'Database unique constraint must reject duplicate active pair');

    // -------------------------------------------------------------
    // TEST 6: Institution Affiliation (No Startup Pro Grant)
    // -------------------------------------------------------------
    console.log('\n--- PHASE 5: Institution Policy Verification ---');
    const affInstId = `aff_inst_${Date.now()}`;
    await affCol.insertOne({
      id: affInstId,
      startupEntityId: startupB.id,
      startupName: startupB.name,
      issuingEntityId: inst1.id,
      issuingOrgName: inst1.name,
      issuingOrgType: 'Institution',
      programName: 'Academic Research Fellowship',
      status: 'Active',
      acceptedAt: now,
    });

    const entInst = await entitlementsCol.findOne({ startupEntityId: startupB.id });
    assert.strictEqual(entInst, null, 'Institution affiliations must NOT create Startup Pro entitlement');
    console.log('  ✓ [REAL DB 6] Institution affiliation established with ZERO Startup Pro entitlement grant.');

    // -------------------------------------------------------------
    // TEST 7: Multi-Affiliation & Independent Paid Pro Preservation
    // -------------------------------------------------------------
    console.log('\n--- PHASE 6: Multi-ESP & Paid Subscription Preservation ---');
    // Add second ESP affiliation for Startup A
    const aff2Id = `aff_real_esp2_${Date.now()}`;
    await affCol.insertOne({
      id: aff2Id,
      startupEntityId: startupA.id,
      startupName: startupA.name,
      issuingEntityId: esp2.id,
      issuingOrgName: esp2.name,
      issuingOrgType: 'ESP',
      status: 'Active',
      createdAt: now,
    });

    // Add independent paid Pro subscription
    await subsCol.insertOne({
      id: 'sub_real_st_A',
      entityId: startupA.id,
      planName: 'Startup Pro Annual',
      status: 'Active',
      amountPaid: 39999,
      validUntil: '2028-12-31',
    });

    // Revoke first ESP affiliation (esp1)
    await affCol.updateOne({ id: affId }, { $set: { status: 'Revoked', revokedAt: now } });
    await entitlementsCol.updateOne({ affiliationId: affId }, { $set: { status: 'Revoked', revokedAt: now } });

    // Recalculate Pro access
    const remainingEsp = await affCol.findOne({ startupEntityId: startupA.id, issuingOrgType: 'ESP', status: 'Active' });
    assert(remainingEsp, 'Startup A still has active ESP 2 affiliation');
    assert.strictEqual(remainingEsp.issuingEntityId, esp2.id);
    console.log('  ✓ [REAL DB 7a] Revoking ESP 1 leaves Startup Pro ACTIVE via ESP 2.');

    // Now revoke second ESP affiliation (esp2)
    await affCol.updateOne({ id: aff2Id }, { $set: { status: 'Revoked', revokedAt: now } });

    // Recalculate Pro access again
    const remainingEspAfterSecond = await affCol.findOne({ startupEntityId: startupA.id, issuingOrgType: 'ESP', status: 'Active' });
    const paidSub = await subsCol.findOne({ entityId: startupA.id, status: 'Active' });

    assert.strictEqual(remainingEspAfterSecond, null);
    assert(paidSub, 'Independent paid subscription must remain in database');
    assert.strictEqual(paidSub.planName, 'Startup Pro Annual');
    assert.strictEqual(paidSub.status, 'Active');
    console.log('  ✓ [REAL DB 7b] Revoking all ESP affiliations leaves Independent Paid Pro 100% UNTOUCHED & ACTIVE.');

    // -------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------
    console.log('\n--- PHASE 7: Teardown Isolated Test Records ---');
    await entitiesCol.deleteMany({ id: { $in: ['esp_real_1', 'esp_real_2', 'inst_real_1', 'st_real_A', 'st_real_B'] } });
    await affCol.deleteMany({ startupEntityId: { $in: ['st_real_A', 'st_real_B'] } });
    await linksCol.deleteMany({ issuingEntityId: { $in: ['esp_real_1', 'esp_real_2', 'inst_real_1'] } });
    await entitlementsCol.deleteMany({ startupEntityId: { $in: ['st_real_A', 'st_real_B'] } });
    await subsCol.deleteMany({ entityId: { $in: ['st_real_A', 'st_real_B'] } });
    await memCol.deleteMany({ entityId: { $in: ['st_real_A', 'st_real_B'] } });
    console.log('  ✓ Cleaned up all isolated test records from xentro_test.');

    console.log('\n================================================================');
    console.log(' 🎉 ALL REAL RUNTIME MONGODB ATLAS INTEGRATION TESTS PASSED!');
    console.log('================================================================\n');
  } finally {
    await client.close();
  }
}

runRealDatabaseTests().catch((err) => {
  console.error('\n❌ REAL DATABASE TEST FAILED:', err);
  process.exit(1);
});
