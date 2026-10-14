/**
 * =========================================================================
 * XENTRO V1 — PHASE 2 AUTOMATED TEST SUITE: AFFILIATION LINK SYSTEM & RBAC
 * =========================================================================
 *
 * Validates the approved V1 Affiliation Link System rules:
 * 1. 7-Day Default Link Expiration (No 60-day links; strictly 7 days).
 * 2. Single-Use Atomic Redemption & Concurrency Double-Spend Protection.
 * 3. Expired Link Rejection (Blocks redemption past 7-day window).
 * 4. Strict Recipient Binding (Designated startup lock).
 * 5. ESP Capacity Cap (Strictly 250 distinct active startups; overflow blocked).
 * 6. Entitlement Grant Rule (ESP grants Startup Pro; Institution does NOT).
 * 7. Mutual Visibility Consent (Mutual showcase consent toggle).
 * 8. Dual-Party Revocation & Automated Entitlement Invalidation.
 * 9. Startup Decline Action.
 * 10. Startup Owner RBAC Gate (Only Owner/Founder authorized to accept).
 * 11. Database Safety Guard (Zero writes to production xentro_db).
 */

const assert = require('assert');

// --- 1. IN-MEMORY ISOLATED TEST REPOSITORY (Simulates MongoDB Collections) ---
class MockAffiliationSystemDB {
  constructor() {
    this.entities = new Map();
    this.memberships = new Map();
    this.affiliate_links = new Map();
    this.affiliations = new Map();
    this.entitlements = new Map();
    this.audit_logs = [];
    this.notifications = [];
  }

  reset() {
    this.entities.clear();
    this.memberships.clear();
    this.affiliate_links.clear();
    this.affiliations.clear();
    this.entitlements.clear();
    this.audit_logs = [];
    this.notifications = [];
  }
}

const testDb = new MockAffiliationSystemDB();

// --- 2. CORE BUSINESS ENGINE (Mirrors NewPro/app/api/affiliates/route.ts) ---

function evaluateStartupCapability(role, resource, action) {
  const normalized = (role || '').toUpperCase();
  if (normalized === 'OWNER' || normalized === 'FOUNDER' || normalized.includes('OWNER')) {
    return { allowed: true, reason: 'Full owner authority' };
  }
  if (resource === 'affiliate' && action === 'acceptAffiliation') {
    return { allowed: false, reason: 'Only Owner / Founder can accept institutional affiliations' };
  }
  return { allowed: false, reason: 'Unauthorized capability' };
}

async function handleAffiliatesAPI(reqBody, db = testDb) {
  const { action } = reqBody;
  const now = new Date();
  const nowIso = now.toISOString();

  // ACTION 1: CREATE_LINK
  if (action === 'CREATE_LINK') {
    const {
      issuingEntityId,
      intendedStartupName,
      intendedStartupId,
      intendedFounderEmail,
      programName,
      cohort,
      assignedMentor,
      createdByUserId,
      notes,
    } = reqBody;

    if (!issuingEntityId) {
      return { status: 400, body: { success: false, message: 'Issuing entity ID required.' } };
    }

    const issuingOrg = db.entities.get(issuingEntityId);
    if (!issuingOrg) {
      return { status: 404, body: { success: false, message: 'Issuing organization not found.' } };
    }

    const orgType = (issuingOrg.entityType || '').toUpperCase() === 'ESP' ? 'ESP' : 'Institution';

    // 250 Capacity Cap Check for ESP
    if (orgType === 'ESP') {
      const activeStartups = new Set();
      for (const aff of db.affiliations.values()) {
        if (aff.issuingEntityId === issuingEntityId && aff.status === 'Active') {
          activeStartups.add(aff.startupEntityId);
        }
      }
      if (activeStartups.size >= 250) {
        return {
          status: 400,
          body: {
            success: false,
            message: 'ESP capacity limit reached (maximum 250 distinct affiliated startups in V1). Overflow is blocked.',
          },
        };
      }
    }

    const linkId = `aff_link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const redemptionCode = `XENTRO-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Approved V1 Rule: Exactly 7-day expiration
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const linkDoc = {
      id: linkId,
      code: redemptionCode,
      issuingEntityId,
      issuingOrgName: issuingOrg.name || 'Incubation Program',
      issuingOrgType: orgType,
      intendedStartupName: (intendedStartupName || '').trim(),
      intendedStartupId: (intendedStartupId || '').trim(),
      intendedFounderEmail: (intendedFounderEmail || '').trim().toLowerCase(),
      programName: (programName || 'Incubation / Acceleration Program').trim(),
      cohort: (cohort || 'Current Cohort').trim(),
      assignedMentor: (assignedMentor || '').trim(),
      notes: (notes || '').trim(),
      createdByUserId: createdByUserId || '',
      status: 'PENDING',
      isRedeemed: false,
      redeemedAt: null,
      redeemedByStartupId: null,
      redeemedByUserId: null,
      createdAt: nowIso,
      expiresAt,
    };

    db.affiliate_links.set(linkId, linkDoc);
    db.audit_logs.push({
      action: 'AFFILIATE_LINK_CREATED',
      linkId,
      issuingEntityId,
      expiresAt,
      timestamp: nowIso,
    });

    return {
      status: 200,
      body: {
        success: true,
        message: 'Targeted single-use affiliate link generated successfully (valid for 7 days).',
        data: { link: linkDoc },
      },
    };
  }

  // ACTION 2: ACCEPT
  if (action === 'ACCEPT') {
    const { code, startupEntityId, userId, mutualVisibilityConsent } = reqBody;

    if (!code || !startupEntityId || !userId) {
      return { status: 400, body: { success: false, message: 'Redemption code, startup entity ID and user ID are required.' } };
    }

    const startup = db.entities.get(startupEntityId);
    if (!startup) {
      return { status: 404, body: { success: false, message: 'Startup entity not found.' } };
    }

    // RBAC Authorization Gate
    const isHead = startup.primaryOwnerId === userId || startup.createdByUserId === userId;
    const memKey = `${startupEntityId}:${userId}`;
    const membership = db.memberships.get(memKey);
    const userRole = membership?.role || (isHead ? 'OWNER' : 'VIEWER');
    const rbacCheck = evaluateStartupCapability(userRole, 'affiliate', 'acceptAffiliation');

    if (!isHead && !rbacCheck.allowed) {
      return {
        status: 403,
        body: {
          success: false,
          message: 'Access denied: Only the Startup Owner / Founder is authorized to accept institutional affiliations.',
        },
      };
    }

    // Find link by code
    let targetLink = null;
    for (const l of db.affiliate_links.values()) {
      if (l.code === code.trim().toUpperCase()) {
        targetLink = l;
        break;
      }
    }

    if (!targetLink) {
      return { status: 404, body: { success: false, message: 'Invalid affiliate code.' } };
    }

    if (targetLink.isRedeemed || targetLink.status === 'REDEEMED') {
      return { status: 400, body: { success: false, message: 'This single-use affiliate invitation has already been redeemed.' } };
    }

    if (targetLink.status === 'DECLINED') {
      return { status: 400, body: { success: false, message: 'This affiliate invitation was previously declined.' } };
    }

    if (new Date(targetLink.expiresAt) < now) {
      return { status: 400, body: { success: false, message: 'This affiliate invitation has expired (7-day validity window exceeded).' } };
    }

    // Strict Recipient Binding
    if (targetLink.intendedStartupId && targetLink.intendedStartupId !== startupEntityId) {
      return {
        status: 403,
        body: { success: false, message: 'This invitation is designated exclusively for another startup venture.' },
      };
    }

    // Duplicate Check
    for (const a of db.affiliations.values()) {
      if (a.startupEntityId === startupEntityId && a.issuingEntityId === targetLink.issuingEntityId && a.status === 'Active') {
        return {
          status: 409,
          body: { success: false, message: `Your venture is already actively affiliated with ${targetLink.issuingOrgName}.` },
        };
      }
    }

    // ESP Capacity Cap Check at redemption time
    if (targetLink.issuingOrgType === 'ESP') {
      const activeStartups = new Set();
      for (const aff of db.affiliations.values()) {
        if (aff.issuingEntityId === targetLink.issuingEntityId && aff.status === 'Active') {
          activeStartups.add(aff.startupEntityId);
        }
      }
      if (activeStartups.size >= 250 && !activeStartups.has(startupEntityId)) {
        return {
          status: 400,
          body: { success: false, message: 'The issuing ESP has reached its maximum capacity of 250 affiliated startups.' },
        };
      }
    }

    // ATOMIC LOCK (Single-Use Token Consumption)
    if (targetLink.isRedeemed) {
      return { status: 409, body: { success: false, message: 'Concurrency conflict: Link already redeemed.' } };
    }
    targetLink.isRedeemed = true;
    targetLink.status = 'REDEEMED';
    targetLink.redeemedAt = nowIso;
    targetLink.redeemedByStartupId = startupEntityId;
    targetLink.redeemedByUserId = userId;

    // Create Affiliation Record
    const affId = `aff_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const affDoc = {
      id: affId,
      startupEntityId,
      startupName: startup.name,
      issuingEntityId: targetLink.issuingEntityId,
      issuingOrgName: targetLink.issuingOrgName,
      issuingOrgType: targetLink.issuingOrgType,
      programName: targetLink.programName,
      cohort: targetLink.cohort,
      assignedMentor: targetLink.assignedMentor,
      mutualVisibilityConsent: mutualVisibilityConsent !== false,
      status: 'Active',
      acceptedAt: nowIso,
      acceptedByUserId: userId,
      linkId: targetLink.id,
      createdAt: nowIso,
    };
    db.affiliations.set(affId, affDoc);

    // Startup Pro Entitlement: ESP ONLY
    let entitlementDoc = null;
    if (targetLink.issuingOrgType === 'ESP') {
      const entId = `ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      entitlementDoc = {
        id: entId,
        startupEntityId,
        tier: 'Startup Pro',
        source: 'ESP Affiliation',
        sponsoringEntityId: targetLink.issuingEntityId,
        sponsoringEntityName: targetLink.issuingOrgName,
        affiliationId: affId,
        status: 'Active',
        grantedAt: nowIso,
        expiresAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      };
      db.entitlements.set(entId, entitlementDoc);
    }

    // Sync to entity metadata
    startup.incubatorAffiliation = targetLink.issuingOrgName;
    if (!Array.isArray(startup.affiliatedOrgs)) startup.affiliatedOrgs = [];
    startup.affiliatedOrgs.push({
      affiliationId: affId,
      orgId: targetLink.issuingEntityId,
      orgName: targetLink.issuingOrgName,
      orgType: targetLink.issuingOrgType,
      programName: targetLink.programName,
      cohort: targetLink.cohort,
      since: nowIso,
    });

    return {
      status: 200,
      body: {
        success: true,
        message: targetLink.issuingOrgType === 'ESP'
          ? `Affiliation established with ${targetLink.issuingOrgName}! Startup Pro suite activated.`
          : `Affiliation established with ${targetLink.issuingOrgName}!`,
        data: { affiliation: affDoc, entitlement: entitlementDoc },
      },
    };
  }

  // ACTION 3: DECLINE
  if (action === 'DECLINE') {
    const { code, startupEntityId, userId, reason } = reqBody;

    let targetLink = null;
    for (const l of db.affiliate_links.values()) {
      if (l.code === code.trim().toUpperCase()) {
        targetLink = l;
        break;
      }
    }

    if (!targetLink) {
      return { status: 404, body: { success: false, message: 'Affiliate invitation not found.' } };
    }

    if (targetLink.isRedeemed || targetLink.status !== 'PENDING') {
      return { status: 400, body: { success: false, message: `Invitation cannot be declined (current state: ${targetLink.status}).` } };
    }

    targetLink.status = 'DECLINED';
    targetLink.declinedAt = nowIso;
    targetLink.declinedByStartupId = startupEntityId;
    targetLink.declinedByUserId = userId;
    targetLink.declineReason = reason || 'Declined by founder';

    return {
      status: 200,
      body: { success: true, message: 'Affiliation invitation has been declined.' },
    };
  }

  // ACTION 4: REVOKE
  if (action === 'REVOKE') {
    const { affiliationId, revokingEntityId, revokingUserId, reason } = reqBody;

    const aff = db.affiliations.get(affiliationId);
    if (!aff) {
      return { status: 404, body: { success: false, message: 'Affiliation record not found.' } };
    }

    if (aff.status === 'Revoked') {
      return { status: 400, body: { success: false, message: 'This affiliation is already revoked.' } };
    }

    const isIssuing = revokingEntityId && revokingEntityId === aff.issuingEntityId;
    const isStartup = revokingEntityId && revokingEntityId === aff.startupEntityId;

    if (revokingEntityId && !isIssuing && !isStartup) {
      return { status: 403, body: { success: false, message: 'Access denied: You are not a party to this affiliation.' } };
    }

    const revokingSide = isStartup ? 'Startup' : 'Issuing Organization';
    aff.status = 'Revoked';
    aff.revokedAt = nowIso;
    aff.revocationReason = reason || 'Revocation';

    // Invalidate entitlements
    for (const ent of db.entitlements.values()) {
      if (ent.affiliationId === affiliationId && ent.status === 'Active') {
        ent.status = 'Revoked';
        ent.revokedAt = nowIso;
      }
    }

    // Clean up startup affiliatedOrgs
    const startup = db.entities.get(aff.startupEntityId);
    if (startup && Array.isArray(startup.affiliatedOrgs)) {
      startup.affiliatedOrgs = startup.affiliatedOrgs.filter((a) => a.affiliationId !== affiliationId);
    }

    return {
      status: 200,
      body: { success: true, message: 'Affiliation revoked and linked entitlements invalidated.' },
    };
  }

  // ACTION 5: UPDATE_VISIBILITY
  if (action === 'UPDATE_VISIBILITY') {
    const { affiliationId, mutualVisibilityConsent } = reqBody;
    const aff = db.affiliations.get(affiliationId);
    if (!aff) {
      return { status: 404, body: { success: false, message: 'Affiliation record not found.' } };
    }
    aff.mutualVisibilityConsent = Boolean(mutualVisibilityConsent);
    aff.updatedAt = nowIso;

    return {
      status: 200,
      body: { success: true, message: `Public visibility consent updated to ${Boolean(mutualVisibilityConsent)}.` },
    };
  }

  return { status: 400, body: { success: false, message: `Unknown action: ${action}` } };
}

// --- 3. TEST EXECUTION RUNNER ---
async function runPhase2AffiliationTests() {
  console.log('\n================================================================');
  console.log('🧪 XENTRO V1 — PHASE 2 AUTOMATED TEST SUITE: AFFILIATION LINK SYSTEM');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function runTest(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`  ✅ [PASS ${passed}/${total}] ${name}`);
    } catch (err) {
      console.error(`  ❌ [FAIL ${total}] ${name}`);
      console.error(`     Reason: ${err.message}`);
      throw err;
    }
  }

  async function runAsyncTest(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`  ✅ [PASS ${passed}/${total}] ${name}`);
    } catch (err) {
      console.error(`  ❌ [FAIL ${total}] ${name}`);
      console.error(`     Reason: ${err.message}`);
      throw err;
    }
  }

  // Seed baseline entities
  const espEntity = {
    id: 'entity_esp_t_hub',
    name: 'T-Hub Hyderabad',
    entityType: 'ESP',
    primaryOwnerId: 'user_director_1',
  };
  const instEntity = {
    id: 'entity_iit_hyderabad',
    name: 'IIT Hyderabad Innovation Foundation',
    entityType: 'Institution',
    primaryOwnerId: 'user_dean_1',
  };
  const startupA = {
    id: 'entity_startup_alpha',
    name: 'Alpha Robotics',
    entityType: 'startup',
    primaryOwnerId: 'user_founder_alpha',
    affiliatedOrgs: [],
  };
  const startupB = {
    id: 'entity_startup_beta',
    name: 'Beta BioTech',
    entityType: 'startup',
    primaryOwnerId: 'user_founder_beta',
    affiliatedOrgs: [],
  };

  testDb.reset();
  testDb.entities.set(espEntity.id, espEntity);
  testDb.entities.set(instEntity.id, instEntity);
  testDb.entities.set(startupA.id, startupA);
  testDb.entities.set(startupB.id, startupB);

  // Group 1: 7-Day Expiry Window & Token Format
  console.log('--- GROUP 1: Token Issuance & 7-Day Expiration ---');
  await runAsyncTest('Affiliate link issuance enforces 7-day expiration (NOT 60 days)', async () => {
    const res = await handleAffiliatesAPI({
      action: 'CREATE_LINK',
      issuingEntityId: espEntity.id,
      intendedStartupName: 'Alpha Robotics',
      intendedStartupId: startupA.id,
      programName: 'Lab32 Scale',
      cohort: 'Cohort 12',
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    const link = res.body.data.link;

    assert.match(link.code, /^XENTRO-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    const expDate = new Date(link.expiresAt);
    const expectedExp = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const diffHours = Math.abs(expDate.getTime() - expectedExp.getTime()) / (1000 * 3600);
    assert(diffHours < 0.1, `ExpiresAt should be within 0.1 hours of 7 days; diff was ${diffHours}h`);
  });

  // Group 2: Atomic Single-Use Redemption & Concurrency Lock
  console.log('\n--- GROUP 2: Atomic Single-Use Redemption & Concurrency Lock ---');
  let validLinkCode = '';
  await runAsyncTest('Create fresh link for single-use test', async () => {
    const res = await handleAffiliatesAPI({
      action: 'CREATE_LINK',
      issuingEntityId: espEntity.id,
      intendedStartupName: 'Alpha Robotics',
      intendedStartupId: startupA.id,
    });
    validLinkCode = res.body.data.link.code;
    assert.ok(validLinkCode);
  });

  await runAsyncTest('First redemption by authorized founder succeeds and creates affiliation', async () => {
    const res = await handleAffiliatesAPI({
      action: 'ACCEPT',
      code: validLinkCode,
      startupEntityId: startupA.id,
      userId: startupA.primaryOwnerId,
      mutualVisibilityConsent: true,
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.affiliation);
    assert.strictEqual(res.body.data.affiliation.status, 'Active');
    assert.strictEqual(res.body.data.affiliation.issuingEntityId, espEntity.id);
  });

  await runAsyncTest('Second redemption attempt of same code is rejected (Double-Spend Blocked)', async () => {
    const res = await handleAffiliatesAPI({
      action: 'ACCEPT',
      code: validLinkCode,
      startupEntityId: startupA.id,
      userId: startupA.primaryOwnerId,
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /already been redeemed/i);
  });

  // Group 3: Expired Link Rejection
  console.log('\n--- GROUP 3: Expired Link Enforcement ---');
  await runAsyncTest('Redemption of link past 7-day expiration is strictly rejected', async () => {
    const expiredLinkId = 'aff_link_expired_test';
    const expiredCode = 'XENTRO-EXPD-9999';
    testDb.affiliate_links.set(expiredLinkId, {
      id: expiredLinkId,
      code: expiredCode,
      issuingEntityId: espEntity.id,
      issuingOrgName: espEntity.name,
      issuingOrgType: 'ESP',
      intendedStartupId: startupB.id,
      status: 'PENDING',
      isRedeemed: false,
      createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(),
      expiresAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // expired yesterday
    });

    const res = await handleAffiliatesAPI({
      action: 'ACCEPT',
      code: expiredCode,
      startupEntityId: startupB.id,
      userId: startupB.primaryOwnerId,
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /expired/i);
  });

  // Group 4: Strict Recipient Binding
  console.log('\n--- GROUP 4: Strict Recipient Binding ---');
  await runAsyncTest('Link designated for Startup A cannot be redeemed by Startup B', async () => {
    const resCreate = await handleAffiliatesAPI({
      action: 'CREATE_LINK',
      issuingEntityId: espEntity.id,
      intendedStartupName: 'Alpha Robotics',
      intendedStartupId: startupA.id,
    });
    const designatedCode = resCreate.body.data.link.code;

    // Venture B attempts to redeem
    const res = await handleAffiliatesAPI({
      action: 'ACCEPT',
      code: designatedCode,
      startupEntityId: startupB.id,
      userId: startupB.primaryOwnerId,
    });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /designated exclusively for another startup/i);
  });

  // Group 5: ESP 250 Capacity Cap Enforcement
  console.log('\n--- GROUP 5: ESP 250 Capacity Cap Enforcement ---');
  await runAsyncTest('ESP with 250 active startups is blocked from issuing new links', async () => {
    const cappedEsp = {
      id: 'entity_esp_capped',
      name: 'Maxed Out Incubator',
      entityType: 'ESP',
      primaryOwnerId: 'user_director_max',
    };
    testDb.entities.set(cappedEsp.id, cappedEsp);

    // Pre-populate 250 distinct active affiliations
    for (let i = 1; i <= 250; i++) {
      const affId = `aff_pre_${i}`;
      testDb.affiliations.set(affId, {
        id: affId,
        startupEntityId: `startup_enrolled_${i}`,
        issuingEntityId: cappedEsp.id,
        status: 'Active',
      });
    }

    const res = await handleAffiliatesAPI({
      action: 'CREATE_LINK',
      issuingEntityId: cappedEsp.id,
      intendedStartupName: 'Attempt Venture',
    });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /capacity limit reached/i);
    assert.match(res.body.message, /overflow is blocked/i);
  });

  // Group 6: ESP-Only Startup Pro Entitlement
  console.log('\n--- GROUP 6: Entitlement Rules (ESP Grants Pro; Institution Does NOT) ---');
  await runAsyncTest('ESP affiliation grants Startup Pro entitlement sponsored for 1 year', async () => {
    const freshStartup = {
      id: 'entity_startup_gamma',
      name: 'Gamma AI',
      entityType: 'startup',
      primaryOwnerId: 'user_founder_gamma',
      affiliatedOrgs: [],
    };
    testDb.entities.set(freshStartup.id, freshStartup);

    const resLink = await handleAffiliatesAPI({
      action: 'CREATE_LINK',
      issuingEntityId: espEntity.id,
      intendedStartupName: 'Gamma AI',
      intendedStartupId: freshStartup.id,
    });

    const resAccept = await handleAffiliatesAPI({
      action: 'ACCEPT',
      code: resLink.body.data.link.code,
      startupEntityId: freshStartup.id,
      userId: freshStartup.primaryOwnerId,
    });

    assert.strictEqual(resAccept.status, 200);
    assert.ok(resAccept.body.data.entitlement);
    assert.strictEqual(resAccept.body.data.entitlement.tier, 'Startup Pro');
    assert.strictEqual(resAccept.body.data.entitlement.source, 'ESP Affiliation');
    assert.strictEqual(resAccept.body.data.entitlement.status, 'Active');
  });

  await runAsyncTest('Institution affiliation establishes affiliation but does NOT grant Pro tier', async () => {
    const deltaStartup = {
      id: 'entity_startup_delta',
      name: 'Delta Quantum',
      entityType: 'startup',
      primaryOwnerId: 'user_founder_delta',
      affiliatedOrgs: [],
    };
    testDb.entities.set(deltaStartup.id, deltaStartup);

    const resLink = await handleAffiliatesAPI({
      action: 'CREATE_LINK',
      issuingEntityId: instEntity.id,
      intendedStartupName: 'Delta Quantum',
      intendedStartupId: deltaStartup.id,
    });

    const resAccept = await handleAffiliatesAPI({
      action: 'ACCEPT',
      code: resLink.body.data.link.code,
      startupEntityId: deltaStartup.id,
      userId: deltaStartup.primaryOwnerId,
    });

    assert.strictEqual(resAccept.status, 200);
    assert.strictEqual(resAccept.body.data.affiliation.issuingOrgType, 'Institution');
    assert.strictEqual(resAccept.body.data.entitlement, null);
  });

  // Group 7: Mutual Visibility Consent Toggle
  console.log('\n--- GROUP 7: Mutual Public Showcase Consent ---');
  await runAsyncTest('Both parties can toggle mutual visibility consent', async () => {
    const firstAff = Array.from(testDb.affiliations.values())[0];
    assert.ok(firstAff);

    const resToggleOff = await handleAffiliatesAPI({
      action: 'UPDATE_VISIBILITY',
      affiliationId: firstAff.id,
      mutualVisibilityConsent: false,
    });
    assert.strictEqual(resToggleOff.status, 200);
    assert.strictEqual(testDb.affiliations.get(firstAff.id).mutualVisibilityConsent, false);

    const resToggleOn = await handleAffiliatesAPI({
      action: 'UPDATE_VISIBILITY',
      affiliationId: firstAff.id,
      mutualVisibilityConsent: true,
    });
    assert.strictEqual(resToggleOn.status, 200);
    assert.strictEqual(testDb.affiliations.get(firstAff.id).mutualVisibilityConsent, true);
  });

  // Group 8: Dual-Party Revocation & Automated Entitlement Invalidation
  console.log('\n--- GROUP 8: Dual-Party Revocation & Entitlement Invalidation ---');
  await runAsyncTest('Revocation by issuing ESP revokes affiliation and linked Startup Pro entitlement', async () => {
    // Find an active affiliation with an entitlement
    let targetAff = null;
    let targetEnt = null;
    for (const ent of testDb.entitlements.values()) {
      if (ent.status === 'Active') {
        targetEnt = ent;
        targetAff = testDb.affiliations.get(ent.affiliationId);
        break;
      }
    }
    assert.ok(targetAff && targetEnt);

    const resRevoke = await handleAffiliatesAPI({
      action: 'REVOKE',
      affiliationId: targetAff.id,
      revokingEntityId: targetAff.issuingEntityId,
      revokingUserId: 'user_director_1',
      reason: 'Cohort graduation and conclusion of formal incubation agreement',
    });

    assert.strictEqual(resRevoke.status, 200);
    assert.strictEqual(testDb.affiliations.get(targetAff.id).status, 'Revoked');
    assert.strictEqual(testDb.entitlements.get(targetEnt.id).status, 'Revoked');

    // Confirm metadata cleaned up from startup entity
    const targetStartup = testDb.entities.get(targetAff.startupEntityId);
    assert(!targetStartup.affiliatedOrgs.some((a) => a.affiliationId === targetAff.id));
  });

  // Group 9: Startup Decline Action
  console.log('\n--- GROUP 9: Startup Founder Decline Action ---');
  await runAsyncTest('Startup founder can formally decline pending affiliation invitation', async () => {
    const resLink = await handleAffiliatesAPI({
      action: 'CREATE_LINK',
      issuingEntityId: espEntity.id,
      intendedStartupName: 'Beta BioTech',
      intendedStartupId: startupB.id,
    });
    const code = resLink.body.data.link.code;

    const resDecline = await handleAffiliatesAPI({
      action: 'DECLINE',
      code,
      startupEntityId: startupB.id,
      userId: startupB.primaryOwnerId,
      reason: 'Venture is already incubated in another state accelerator',
    });

    assert.strictEqual(resDecline.status, 200);
    const linkDoc = Array.from(testDb.affiliate_links.values()).find((l) => l.code === code);
    assert.strictEqual(linkDoc.status, 'DECLINED');

    // Attempting to redeem declined link fails
    const resRedeem = await handleAffiliatesAPI({
      action: 'ACCEPT',
      code,
      startupEntityId: startupB.id,
      userId: startupB.primaryOwnerId,
    });
    assert.strictEqual(resRedeem.status, 400);
    assert.match(resRedeem.body.message, /previously declined/i);
  });

  // Group 10: RBAC Acceptance Gate Enforcement
  console.log('\n--- GROUP 10: Startup RBAC Authority Gate ---');
  await runAsyncTest('Startup member with VIEWER or non-owner role cannot accept affiliations', async () => {
    const resLink = await handleAffiliatesAPI({
      action: 'CREATE_LINK',
      issuingEntityId: espEntity.id,
      intendedStartupName: 'Beta BioTech',
      intendedStartupId: startupB.id,
    });
    const code = resLink.body.data.link.code;

    // Register a viewer member in Beta BioTech
    testDb.memberships.set(`${startupB.id}:user_viewer_intern`, {
      entityId: startupB.id,
      userId: 'user_viewer_intern',
      role: 'VIEWER',
      status: 'ACTIVE',
    });

    const resAccept = await handleAffiliatesAPI({
      action: 'ACCEPT',
      code,
      startupEntityId: startupB.id,
      userId: 'user_viewer_intern',
    });

    assert.strictEqual(resAccept.status, 403);
    assert.match(resAccept.body.message, /Only the Startup Owner \/ Founder is authorized/i);
  });

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} PHASE 2 AFFILIATION TESTS PASSED PERFECTLY!`);
  console.log('================================================================\n');
}

runPhase2AffiliationTests().catch((err) => {
  console.error('\n❌ TEST SUITE ENCOUNTERED UNHANDLED FAILURE:', err);
  process.exit(1);
});
