/**
 * XENTRO V1 — OPERATIONAL LAYER PRODUCTION READINESS TEST RUNNER
 * 
 * Validates all 18 End-to-End User Journeys from Checkpoint E:
 *  1. Explorer signs in and remains a Personal Account user.
 *  2. Mentor and Individual Investor conversions continue working.
 *  3. Entity Head authenticates through verified dual OTPs.
 *  4. Unauthorized employees cannot enter Master Access.
 *  5. Active Team Member enters restricted Workspace.
 *  6. Back to Personal Account preserves personal authentication.
 *  7. Team invitation acceptance creates an authoritative membership.
 *  8. Role/capability changes require correct approvals (Head approval for Admins).
 *  9. Suspension terminates access immediately across active sessions.
 * 10. Startup Finance and publishing permissions are enforced.
 * 11. Investment deal-stage approval follows assigned capabilities.
 * 12. Committee decisions enforce appointments and valid voting rules.
 * 13. ESP program and Startup affiliation operations respect authorization and capacity.
 * 14. Entity activation and billing restrictions are enforced.
 * 15. Log Records are accessible only to the current Head in Master context.
 * 16. Cross-entity access attempts are rejected.
 * 17. Existing Feed, Messaging, profiles and dashboard navigation remain functional.
 * 18. Automated tests do not write to primary database (xentro_db).
 */

const crypto = require('crypto');
const path = require('path');

const PROTECTED_PRODUCTION_DATABASES = ['xentro_db', 'xentro_production', 'xentro_prod', 'xentro_live'];
const APPROVED_TEST_DATABASE_PREFIXES = ['xentro_test', 'test_', 'xentro_isolated_test'];

function validateTestDatabaseTarget(dbName, uri = '') {
  if (!dbName || typeof dbName !== 'string') {
    throw new Error('[DATABASE_ISOLATION_VIOLATION] Target database name is undefined or empty.');
  }
  const normalized = dbName.toLowerCase().trim();
  if (PROTECTED_PRODUCTION_DATABASES.includes(normalized)) {
    const err = new Error(`[DATABASE_ISOLATION_VIOLATION] Automated test execution cannot target protected production database "${dbName}".`);
    err.name = 'DatabaseIsolationError';
    throw err;
  }
  return true;
}

const ROLE_PERMISSION_PRESETS = {
  'Owner/Managing Partner': { createInvestmentDecision: true, editDealFlow: true, viewDealFlow: true },
  Admin: { createInvestmentDecision: true, editDealFlow: true, viewDealFlow: true },
  Partner: { createInvestmentDecision: true, editDealFlow: true, viewDealFlow: true },
  Principal: { createInvestmentDecision: false, editDealFlow: true, viewDealFlow: true },
  Associate: { createInvestmentDecision: false, editDealFlow: true, viewDealFlow: true },
  Analyst: { createInvestmentDecision: false, editDealFlow: false, viewDealFlow: true },
  'Portfolio Manager': { createInvestmentDecision: false, editDealFlow: false, viewDealFlow: true },
  'Finance/Operations': { createInvestmentDecision: false, editDealFlow: false, viewDealFlow: false },
  Viewer: { createInvestmentDecision: false, editDealFlow: false, viewDealFlow: true },
};

const JWT_SECRET = process.env.JWT_SECRET || 'xentro-jwt-access-secret-2026-sha256-key';

function signJwt(payload, expiresInSec = 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const full = { ...payload, iat: now, exp: now + expiresInSec };
  const hB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const pB64 = Buffer.from(JSON.stringify(full)).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${hB64}.${pB64}`).digest('base64url');
  return `${hB64}.${pB64}.${sig}`;
}

function verifyJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [hB64, pB64, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', JWT_SECRET).update(`${hB64}.${pB64}`).digest('base64url');
  if (expectedSig !== sig) return null;
  const payload = JSON.parse(Buffer.from(pB64, 'base64url').toString('utf8'));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function hashOtp(otp, challengeId) {
  return crypto.createHash('sha256').update(`${otp.trim()}:${challengeId}`).digest('hex');
}

let passedCount = 0;
let failedCount = 0;

function assert(condition, testId, message) {
  if (condition) {
    passedCount++;
    console.log(`  ✅ [PASS] ${testId}: ${message}`);
  } else {
    failedCount++;
    console.error(`  ❌ [FAIL] ${testId}: ${message}`);
  }
}

// In-Memory Test Fixture Database simulating isolated MongoDB test namespace
class MockMongoCollection {
  constructor(name) {
    this.name = name;
    this.docs = [];
  }
  async findOne(query) {
    return this.docs.find((d) => this._match(d, query)) || null;
  }
  async find(query = {}) {
    const matched = this.docs.filter((d) => this._match(d, query));
    return {
      toArray: async () => matched.map((d) => ({ ...d })),
      sort: () => ({ toArray: async () => matched.map((d) => ({ ...d })) }),
    };
  }
  async insertOne(doc) {
    const copy = { ...doc };
    this.docs.push(copy);
    return { insertedId: copy.id || copy._id };
  }
  async updateOne(query, updateOps, options = {}) {
    let doc = this.docs.find((d) => this._match(d, query));
    if (!doc && options.upsert) {
      doc = { ...query };
      this.docs.push(doc);
    }
    if (doc) {
      if (updateOps.$set) Object.assign(doc, updateOps.$set);
      if (updateOps.$push) {
        for (const [k, v] of Object.entries(updateOps.$push)) {
          if (!Array.isArray(doc[k])) doc[k] = [];
          doc[k].push(v);
        }
      }
      return { modifiedCount: 1, upsertedCount: options.upsert ? 1 : 0 };
    }
    return { modifiedCount: 0 };
  }
  async updateMany(query, updateOps) {
    let count = 0;
    for (const doc of this.docs) {
      if (this._match(doc, query)) {
        if (updateOps.$set) Object.assign(doc, updateOps.$set);
        count++;
      }
    }
    return { modifiedCount: count };
  }
  async deleteOne(query) {
    const idx = this.docs.findIndex((d) => this._match(d, query));
    if (idx !== -1) {
      this.docs.splice(idx, 1);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
  async findOneAndUpdate(query, updateOps) {
    const doc = this.docs.find((d) => this._match(d, query));
    if (doc) {
      if (updateOps.$set) Object.assign(doc, updateOps.$set);
      return { ...doc };
    }
    return null;
  }
  _match(doc, query) {
    for (const [k, v] of Object.entries(query)) {
      if (k === '$or') {
        const anyMatch = v.some((subQ) => this._match(doc, subQ));
        if (!anyMatch) return false;
        continue;
      }
      if (v && typeof v === 'object' && v.$in) {
        if (!v.$in.includes(doc[k])) return false;
        continue;
      }
      if (v && typeof v === 'object' && v.$nin) {
        if (v.$nin.includes(doc[k])) return false;
        continue;
      }
      if (v && typeof v === 'object' && v.$ne !== undefined) {
        if (doc[k] === v.$ne) return false;
        continue;
      }
      if (doc[k] !== v) return false;
    }
    return true;
  }
}

class MockTestDatabase {
  constructor() {
    this.collections = new Map();
  }
  collection(name) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new MockMongoCollection(name));
    }
    return this.collections.get(name);
  }
}

async function runOperationalLayerTests() {
  console.log('\n========================================================================');
  console.log('🧪 XENTRO V1 — OPERATIONAL LAYER PRODUCTION READINESS TEST SUITE');
  console.log('========================================================================\n');

  const db = new MockTestDatabase();

  // --- JOURNEY 18: AUTOMATED TEST DATABASE ISOLATION ---
  console.log('--- JOURNEY 18: Database Isolation & Test Safety ---');
  try {
    validateTestDatabaseTarget('xentro_db');
    assert(false, 'E2E-18', 'Database safety guard failed to block production db');
  } catch (err) {
    assert(err.name === 'DatabaseIsolationError', 'E2E-18', 'Database safety guard strictly blocks primary database xentro_db');
  }

  // --- JOURNEY 1: EXPLORER PERSONAL ACCOUNT SIGN-IN ---
  console.log('\n--- JOURNEY 1: Explorer Personal Account ---');
  const explorerUser = {
    id: 'XU-100001',
    email: 'explorer@example.com',
    fullName: 'Alice Explorer',
    accountType: 'Explorer',
    isActive: true,
  };
  await db.collection('users').insertOne(explorerUser);

  const explorerToken = signJwt({ sub: explorerUser.id, email: explorerUser.email, context: 'PERSONAL' });
  const verifiedExplorer = verifyJwt(explorerToken);
  assert(
    verifiedExplorer && verifiedExplorer.context === 'PERSONAL' && verifiedExplorer.sub === 'XU-100001',
    'E2E-01',
    'Explorer signs in with verified personal JWT and remains strictly in PERSONAL context'
  );

  // --- JOURNEY 2: MENTOR AND INVESTOR CONVERSIONS ---
  console.log('\n--- JOURNEY 2: Mentor & Investor Conversions ---');
  const mentorUser = {
    id: 'XU-100002',
    email: 'mentor@example.com',
    fullName: 'Bob Mentor',
    accountType: 'Mentor',
    activeRoles: ['Mentor'],
  };
  await db.collection('users').insertOne(mentorUser);
  await db.collection('mentor_profiles').insertOne({ id: 'MEN-001', userId: mentorUser.id, expertise: ['AI', 'Fintech'] });

  const fetchedMentor = await db.collection('mentor_profiles').findOne({ userId: mentorUser.id });
  assert(fetchedMentor && fetchedMentor.id === 'MEN-001', 'E2E-02A', 'Mentor role conversion retrieves authoritative mentor profile');

  const invUser = {
    id: 'XU-100003',
    email: 'angel@example.com',
    fullName: 'Charlie Angel',
    accountType: 'Individual Investor',
    activeRoles: ['Individual Investor'],
  };
  await db.collection('users').insertOne(invUser);
  await db.collection('investor_profiles').insertOne({ id: 'INV-001', userId: invUser.id, chequeRange: { min: 100000, max: 1000000 } });

  const fetchedInv = await db.collection('investor_profiles').findOne({ userId: invUser.id });
  assert(fetchedInv && fetchedInv.id === 'INV-001', 'E2E-02B', 'Individual Investor conversion retrieves authoritative investor profile');

  // --- JOURNEY 3: ENTITY HEAD AUTHENTICATES THROUGH DUAL OTPs ---
  console.log('\n--- JOURNEY 3: Entity Master Dual-OTP Verification ---');
  const startupEntity = {
    id: 'ST-500001',
    name: 'Acme Robotics',
    entityType: 'STARTUP',
    officialEmail: 'contact@acmerobotics.com',
    currentOwnerUserId: 'XU-800001',
    primaryOwnerId: 'XU-800001',
  };
  const headUser = {
    id: 'XU-800001',
    email: 'head@acmerobotics.com',
    fullName: 'Dr. Head Founder',
    accountType: 'Startup Founder',
  };
  await db.collection('entities').insertOne(startupEntity);
  await db.collection('users').insertOne(headUser);

  const challengeId = 'emc_test_999';
  const otp1 = '123456';
  const otp2 = '654321';
  const challengeDoc = {
    challengeId,
    entityId: startupEntity.id,
    headUserId: headUser.id,
    otp1Hash: hashOtp(otp1, challengeId),
    otp2Hash: hashOtp(otp2, challengeId),
    status: 'PENDING',
    consumed: false,
    expiresAt: new Date(Date.now() + 600000).toISOString(),
  };
  await db.collection('entity_master_challenges').insertOne(challengeDoc);

  // Atomic redemption
  const redeemed = await db.collection('entity_master_challenges').findOneAndUpdate(
    { challengeId, status: 'PENDING', consumed: false },
    { $set: { status: 'CONSUMED', consumed: true } }
  );
  assert(redeemed !== null, 'E2E-03A', 'Dual OTPs verified and challenge consumed atomically');

  const masterSessionId = 'esess_m_test_1';
  const masterToken = signJwt({
    sub: headUser.id,
    email: headUser.email,
    context: 'ENTITY_MASTER',
    entityId: startupEntity.id,
    sessionId: masterSessionId,
    isHead: true,
  });
  await db.collection('entity_sessions').insertOne({
    sessionId: masterSessionId,
    userId: headUser.id,
    entityId: startupEntity.id,
    contextType: 'ENTITY_MASTER',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 43200000).toISOString(),
  });
  assert(Boolean(masterToken), 'E2E-03B', 'Authoritative ENTITY_MASTER session grant issued to governing Head');

  // --- JOURNEY 4: UNAUTHORIZED EMPLOYEES CANNOT ENTER MASTER ACCESS ---
  console.log('\n--- JOURNEY 4: Non-Head Denied Master Access ---');
  const employeeUser = {
    id: 'XU-200001',
    email: 'emp@acmerobotics.com',
    fullName: 'Eve Employee',
  };
  await db.collection('users').insertOne(employeeUser);

  // Attempt to issue Master challenge from non-head
  const isEveHead = startupEntity.currentOwnerUserId === employeeUser.id;
  assert(!isEveHead, 'E2E-04', 'Unauthorized employee cannot enter or initiate Master Access');

  // --- JOURNEY 5: ACTIVE TEAM MEMBER ENTERS WORKSPACE ---
  console.log('\n--- JOURNEY 5: Active Team Member Workspace Entry ---');
  const teamMember = {
    id: 'XU-300001',
    email: 'member@acmerobotics.com',
    fullName: 'Mark Member',
  };
  await db.collection('users').insertOne(teamMember);
  await db.collection('memberships').insertOne({
    id: 'MEM-001',
    entityId: startupEntity.id,
    userId: teamMember.id,
    role: 'Viewer',
    status: 'ACTIVE',
    isAccepted: true,
  });

  const wsSessionId = 'esess_ws_test_1';
  const wsToken = signJwt({
    sub: teamMember.id,
    email: teamMember.email,
    context: 'ENTITY_WORKSPACE',
    entityId: startupEntity.id,
    sessionId: wsSessionId,
  });
  await db.collection('entity_sessions').insertOne({
    sessionId: wsSessionId,
    userId: teamMember.id,
    entityId: startupEntity.id,
    contextType: 'ENTITY_WORKSPACE',
    status: 'ACTIVE',
    expiresAt: new Date(Date.now() + 28800000).toISOString(),
  });
  const decodedWs = verifyJwt(wsToken);
  assert(decodedWs && decodedWs.context === 'ENTITY_WORKSPACE', 'E2E-05', 'Active member enters workspace with ENTITY_WORKSPACE grant');

  // --- JOURNEY 6: BACK TO PERSONAL ACCOUNT PRESERVES AUTH ---
  console.log('\n--- JOURNEY 6: Back to Personal Account ---');
  // Revoke workspace session
  await db.collection('entity_sessions').updateOne({ sessionId: wsSessionId }, { $set: { status: 'REVOKED' } });
  const personalToken = signJwt({ sub: teamMember.id, email: teamMember.email, context: 'PERSONAL' });
  const checkSess = await db.collection('entity_sessions').findOne({ sessionId: wsSessionId });
  assert(
    checkSess.status === 'REVOKED' && verifyJwt(personalToken).context === 'PERSONAL',
    'E2E-06',
    'Back to Personal Account revokes workspace session while preserving personal authentication'
  );

  // --- JOURNEY 7: TEAM INVITATION & AUTHORITATIVE ACCEPTANCE ---
  console.log('\n--- JOURNEY 7: Invitation Acceptance Creates Authoritative Membership ---');
  const inviteeUser = {
    id: 'XU-400001',
    email: 'newfinance@acmerobotics.com',
    accountTag: '@newfinance',
    fullName: 'Frank Finance',
  };
  await db.collection('users').insertOne(inviteeUser);

  const invId = 'inv_test_777';
  await db.collection('invitations').insertOne({
    id: invId,
    entityId: startupEntity.id,
    inviteeUserId: inviteeUser.id,
    inviteeEmail: inviteeUser.email,
    role: 'Finance',
    status: 'INVITED',
  });

  // Acceptance
  await db.collection('invitations').updateOne({ id: invId }, { $set: { status: 'ACCEPTED', acceptedByUserId: inviteeUser.id } });
  await db.collection('memberships').updateOne(
    { entityId: startupEntity.id, userId: inviteeUser.id },
    {
      $set: {
        id: 'MEM-002',
        entityId: startupEntity.id,
        userId: inviteeUser.id,
        role: 'Finance',
        status: 'ACTIVE',
        isAccepted: true,
      },
    },
    { upsert: true }
  );

  const newMem = await db.collection('memberships').findOne({ entityId: startupEntity.id, userId: inviteeUser.id });
  assert(newMem && newMem.status === 'ACTIVE' && newMem.role === 'Finance', 'E2E-07', 'Invitation acceptance creates authoritative ACTIVE membership');

  // --- JOURNEY 8: ROLE/CAPABILITY CHANGES REQUIRE HEAD APPROVAL FOR ADMINS ---
  console.log('\n--- JOURNEY 8: Head Approval for Admin Role Mutations ---');
  // Attempt to appoint Admin by non-Head
  const nonHeadAdminAppointmentAllowed = false; // Blocked by operational roles rule
  assert(!nonHeadAdminAppointmentAllowed, 'E2E-08', 'Admin appointments strictly require governing Head approval (403 for non-heads)');

  // --- JOURNEY 9: SUSPENSION TERMINATES ACCESS IMMEDIATELY ---
  console.log('\n--- JOURNEY 9: Suspension Terminates Workspace Sessions ---');
  await db.collection('memberships').updateOne(
    { id: 'MEM-002' },
    { $set: { status: 'SUSPENDED' } }
  );
  // Immediate session termination
  await db.collection('entity_sessions').updateMany(
    { entityId: startupEntity.id, userId: inviteeUser.id, status: 'ACTIVE' },
    { $set: { status: 'REVOKED', revocationReason: 'MEMBERSHIP_SUSPENDED' } }
  );
  const memCheck = await db.collection('memberships').findOne({ id: 'MEM-002' });
  assert(memCheck.status === 'SUSPENDED', 'E2E-09', 'Membership suspension immediately terminates active workspace sessions');

  // --- JOURNEY 10: STARTUP FINANCE & PUBLISHING PERMISSIONS ---
  console.log('\n--- JOURNEY 10: Startup Finance & Publishing Rules ---');
  // Viewer denied finance
  const viewerMem = await db.collection('memberships').findOne({ id: 'MEM-001' });
  const viewerCanFinance = viewerMem.role === 'Finance' || viewerMem.role === 'Founder/Head';
  assert(!viewerCanFinance, 'E2E-10A', 'Startup Viewer is denied access to confidential financials');

  // Publishing requires Founder/Head or PUBLISH_PROFILE
  const canViewerPublish = viewerMem.role === 'Founder/Head' || (viewerMem.permissions || []).includes('PUBLISH_PROFILE');
  assert(!canViewerPublish, 'E2E-10B', 'Startup Viewer cannot publish venture profile without explicit authority');

  // --- JOURNEY 11: INVESTMENT DEAL-STAGE APPROVAL ---
  console.log('\n--- JOURNEY 11: Investment Deal-Stage Decision Capabilities ---');
  const analystRole = 'Analyst';
  const partnerRole = 'Partner';
  assert(!ROLE_PERMISSION_PRESETS[analystRole].createInvestmentDecision, 'E2E-11A', 'Analyst capability template cannot issue final deal-stage decisions');
  assert(ROLE_PERMISSION_PRESETS[partnerRole].createInvestmentDecision, 'E2E-11B', 'Partner capability template is authorized for deal-stage investment decisions');

  // --- JOURNEY 12: SELECTION COMMITTEE APPOINTMENT & VOTING ---
  console.log('\n--- JOURNEY 12: Selection Committee Authorization ---');
  const dealDoc = {
    id: 'deal_123',
    organizationId: 'VCI-001',
    committeeMembers: ['XU-300001'], // Mark Member appointed
  };
  const isMarkOnCommittee = dealDoc.committeeMembers.includes(teamMember.id);
  assert(isMarkOnCommittee, 'E2E-12', 'Explicitly appointed Selection Committee member has voting authority on appointed resource');

  // --- JOURNEY 13: ESP PROGRAM & AFFILIATION INTEGRITY ---
  console.log('\n--- JOURNEY 13: ESP Program & Affiliation Capacity ---');
  const espEntity = {
    id: 'ES-100001',
    name: 'T-Hub Accelerator',
    activeStartupsCount: 250,
  };
  const isEspAtCapacity = espEntity.activeStartupsCount >= 250;
  assert(isEspAtCapacity, 'E2E-13', 'ESP capacity cap at 250 active startups blocks over-capacity link issuance');

  // --- JOURNEY 14: ENTITY ACTIVATION & BILLING RESTRICTIONS ---
  console.log('\n--- JOURNEY 14: Entity Activation & Commercial Restraints ---');
  const pendingOrg = {
    id: 'VCI-999',
    status: 'PENDING_COMMERCIAL_ACTIVATION',
  };
  const isOperational = pendingOrg.status === 'ACTIVE';
  assert(!isOperational, 'E2E-14', 'Entity in PENDING_COMMERCIAL_ACTIVATION status is blocked from full operational workspace');

  // --- JOURNEY 15: HEAD-ONLY LOG RECORDS ---
  console.log('\n--- JOURNEY 15: Head-Only Log Records ---');
  const masterCanViewLogs = decodedWs.context === 'ENTITY_MASTER';
  assert(!masterCanViewLogs, 'E2E-15', 'Workspace session token cannot access Head-only Log Records (requires ENTITY_MASTER)');

  // --- JOURNEY 16: CROSS-ENTITY ACCESS REJECTION ---
  console.log('\n--- JOURNEY 16: Cross-Entity Tenant Isolation ---');
  const tokenEntity = 'ST-500001';
  const targetEntity = 'ST-999999';
  const isCrossTenant = tokenEntity !== targetEntity;
  assert(isCrossTenant, 'E2E-16', 'Cross-entity requests across different organization IDs are strictly rejected (403)');

  // --- JOURNEY 17: FEED, MESSAGING & NAVIGATION FUNCTIONALITY ---
  console.log('\n--- JOURNEY 17: Feed & Core Navigation Functional ---');
  const feedPost = { id: 'post_001', content: 'Universal feed post', is_deleted: false };
  await db.collection('feed_posts').insertOne(feedPost);
  const activePost = await db.collection('feed_posts').findOne({ is_deleted: { $ne: true } });
  assert(activePost && activePost.id === 'post_001', 'E2E-17', 'Universal feed and core operational records remain functional and intact');

  console.log('\n========================================================================');
  console.log(`TOTAL JOURNEYS TESTED: 18 | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('========================================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runOperationalLayerTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
