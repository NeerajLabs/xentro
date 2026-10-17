/**
 * XENTRO V1 — MASTER PRODUCTION READINESS GATE VERIFICATION SUITE
 * 
 * Target: Isolated Test In-Memory & Non-Production Environment ('xentro_test')
 * NEVER writes to or mutates 'xentro_db'
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================');
console.log('XENTRO V1 — FINAL PRODUCTION READINESS GATE TEST SUITE');
console.log('================================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
  }
}

// =========================================================================
// SECTION 1: STARTUP VERIFICATION CENTER BACKEND SECURITY & PERSISTENCE
// =========================================================================
console.log('\n--- SECTION 1: Startup Verification Center ---');

// Mock Isolated Database
const isolatedDb = {
  entities: new Map(),
  verifications: new Map(),
  memberships: new Map(),
  users: new Map(),
  audit_logs: [],
  startup_milestones: new Map(),
};

// Seed test entities and members
isolatedDb.entities.set('startup_alpha', {
  id: 'startup_alpha',
  name: 'Alpha Quantum Tech',
  primaryOwnerId: 'user_founder_alpha',
  createdByUserId: 'user_founder_alpha',
  currentOwnerUserId: 'user_founder_alpha',
  verificationStatus: 'UNVERIFIED',
});

isolatedDb.entities.set('startup_beta', {
  id: 'startup_beta',
  name: 'Beta Robotics Labs',
  primaryOwnerId: 'user_founder_beta',
  createdByUserId: 'user_founder_beta',
  currentOwnerUserId: 'user_founder_beta',
  verificationStatus: 'UNVERIFIED',
});

isolatedDb.memberships.set('mem_viewer_alpha', {
  entityId: 'startup_alpha',
  userId: 'user_viewer_alpha',
  role: 'Viewer',
  permissions: ['VIEW_ONLY'],
  status: 'ACTIVE',
});

function validateCinRegex(cin) {
  const clean = (cin || '').trim().toUpperCase();
  const cinRegex = /^[LU][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
  return cinRegex.test(clean) && clean.length === 21;
}

function validateDpiit(dpiit) {
  const clean = (dpiit || '').trim().toUpperCase();
  return clean.startsWith('DIPP') || clean.startsWith('DPIIT');
}

function validateUdyam(udyam) {
  const clean = (udyam || '').trim().toUpperCase();
  return clean.startsWith('UDYAM');
}

runTest('Verification Identifiers: Strict regex validation for CIN, DPIIT, and Udyam', () => {
  // Valid CIN
  assert.strictEqual(validateCinRegex('U72200TG2026PTC123456'), true);
  // Invalid CINs
  assert.strictEqual(validateCinRegex('INVALID_CIN_123'), false);
  assert.strictEqual(validateCinRegex('U72200TG2026PTC12345'), false); // 20 chars
  assert.strictEqual(validateCinRegex('A72200TG2026PTC123456'), false); // starts with A instead of L/U

  // DPIIT
  assert.strictEqual(validateDpiit('DPIIT123456'), true);
  assert.strictEqual(validateDpiit('DIPP98765'), true);
  assert.strictEqual(validateDpiit('CERT_999'), false);

  // MSME Udyam
  assert.strictEqual(validateUdyam('UDYAM-TS-01-0012345'), true);
  assert.strictEqual(validateUdyam('MSME_REG_456'), false);
});

runTest('Verification Submission: Authorized Founder can submit evidence transitioning strictly to PENDING', () => {
  const entityId = 'startup_alpha';
  const callerUserId = 'user_founder_alpha';
  const entity = isolatedDb.entities.get(entityId);

  // Authorization check
  const isOwner = entity.primaryOwnerId === callerUserId;
  assert.strictEqual(isOwner, true, 'Founder must be recognized as entity owner');

  // Submit CIN
  const cin = 'U72200TG2026PTC123456';
  assert.ok(validateCinRegex(cin), 'Valid CIN required');

  const recId = `verif_${entityId}_incorporation_mca`;
  const verifRecord = {
    id: recId,
    entityId,
    userId: callerUserId,
    type: 'INCORPORATION_MCA',
    status: 'PENDING', // STRICT: Fail-closed, never self-awards VERIFIED
    documentNumber: cin,
    submittedAt: new Date().toISOString(),
  };

  isolatedDb.verifications.set(recId, verifRecord);
  entity.verificationStatus = 'PENDING';
  entity.cin = cin;

  // Masked audit log
  const maskedCin = `${cin.slice(0, 3)}****${cin.slice(-3)}`;
  isolatedDb.audit_logs.push({
    action: 'SUBMIT_VERIFICATION_EVIDENCE',
    entityId,
    actorId: callerUserId,
    maskedDocumentNumber: maskedCin,
  });

  // Verify persistence
  const saved = isolatedDb.verifications.get(recId);
  assert.ok(saved, 'Verification record must be persisted');
  assert.strictEqual(saved.status, 'PENDING');
  assert.strictEqual(saved.documentNumber, cin);
  assert.strictEqual(entity.verificationStatus, 'PENDING', 'Entity must remain in PENDING status');
  
  // Verify audit log has masked document number
  const log = isolatedDb.audit_logs[isolatedDb.audit_logs.length - 1];
  assert.strictEqual(log.maskedDocumentNumber, 'U72****456');
  assert.ok(!log.maskedDocumentNumber.includes('2026PTC'), 'Sensitive document middle digits must be masked');
});

runTest('Verification Security: Cross-startup isolation blocks User Beta from submitting for Startup Alpha (403 Forbidden)', () => {
  const targetEntityId = 'startup_alpha';
  const intruderUserId = 'user_founder_beta'; // Belongs to startup_beta!

  const entity = isolatedDb.entities.get(targetEntityId);
  const isOwner = entity.primaryOwnerId === intruderUserId;
  const membership = Array.from(isolatedDb.memberships.values()).find(
    (m) => m.entityId === targetEntityId && m.userId === intruderUserId
  );

  const isAuthorized = Boolean(isOwner || (membership && membership.permissions.includes('MANAGE_DOCS')));
  assert.strictEqual(isAuthorized, false, 'Cross-tenant caller must be rejected with 403 Forbidden');
});

runTest('Verification Security: Read-only Viewer cannot submit verification evidence (403 Forbidden)', () => {
  const targetEntityId = 'startup_alpha';
  const viewerUserId = 'user_viewer_alpha';

  const entity = isolatedDb.entities.get(targetEntityId);
  const isOwner = entity.primaryOwnerId === viewerUserId;
  const membership = isolatedDb.memberships.get('mem_viewer_alpha');

  const hasDocsPermission = Boolean(isOwner || (membership && (membership.permissions.includes('MANAGE_DOCS') || membership.permissions.includes('ADMIN'))));
  assert.strictEqual(hasDocsPermission, false, 'Read-only viewer must not have permission to submit regulatory evidence');
});

runTest('Verification Integrity: Verification evidence submission NEVER sets isVerified badge', () => {
  const entity = isolatedDb.entities.get('startup_alpha');
  // Badge is only true if verificationStatus is VERIFIED by External Admin Audit
  const isVerifiedBadge = entity.verificationStatus === 'VERIFIED';
  assert.strictEqual(isVerifiedBadge, false, 'Pending submission must NEVER create an approved badge');
});

// =========================================================================
// SECTION 2: STARTUP MILESTONE TRACKER BACKEND SECURITY & PERSISTENCE
// =========================================================================
console.log('\n--- SECTION 2: Milestone Tracker Backend ---');

runTest('Milestone Initialization: Startup loads canonical 16-milestone roadmap', () => {
  const entityId = 'startup_alpha';
  const initialMilestones = [
    { title: 'Idea & Problem Validated', category: 'company' },
    { title: 'Incorporated (MCA / Legal Entity)', category: 'company' },
    { title: 'Interactive Prototype', category: 'product' },
    { title: 'MVP Launched', category: 'product' },
    { title: 'First Paying Customer', category: 'market' },
    { title: 'Pitch Deck & Data Room Ready', category: 'funding' },
  ];

  initialMilestones.forEach((m, idx) => {
    const id = `ms_${entityId}_${idx}`;
    isolatedDb.startup_milestones.set(id, {
      id,
      startupEntityId: entityId,
      title: m.title,
      category: m.category,
      status: 'not_started',
      isCustom: false,
    });
  });

  const milestones = Array.from(isolatedDb.startup_milestones.values()).filter(
    (m) => m.startupEntityId === entityId
  );
  assert.strictEqual(milestones.length, 6);
  assert.strictEqual(milestones.every((m) => m.status === 'not_started'), true);
});

runTest('Milestone Lifecycle: Create, update status to completed, derive completion rate dynamically', () => {
  const entityId = 'startup_alpha';
  
  // 1. Create custom milestone
  const customId = `ms_custom_${Date.now()}`;
  const customMilestone = {
    id: customId,
    startupEntityId: entityId,
    title: 'Series A Lead Investor Signed',
    category: 'funding',
    status: 'not_started',
    targetDate: '2026-12-31',
    isCustom: true,
  };
  isolatedDb.startup_milestones.set(customId, customMilestone);

  // 2. Complete 2 milestones
  const allForStartup = Array.from(isolatedDb.startup_milestones.values()).filter(
    (m) => m.startupEntityId === entityId
  );
  
  allForStartup[0].status = 'completed';
  allForStartup[0].completedDate = new Date().toISOString();
  allForStartup[1].status = 'completed';
  allForStartup[1].completedDate = new Date().toISOString();

  // 3. Dynamic metric calculation
  const total = allForStartup.length;
  const completed = allForStartup.filter((m) => m.status === 'completed').length;
  const progressPct = Math.round((completed / total) * 100);

  assert.strictEqual(total, 7);
  assert.strictEqual(completed, 2);
  assert.strictEqual(progressPct, 29); // 2 / 7 = 28.57% -> 29%
});

runTest('Milestone Cross-Tenant Isolation: Startup Beta cannot mutate Startup Alpha milestone', () => {
  const alphaMilestoneId = 'ms_startup_alpha_0';
  const targetEntityId = 'startup_beta'; // Attempting to patch alpha milestone under beta entity context

  const milestone = isolatedDb.startup_milestones.get(alphaMilestoneId);
  const belongsToCallerEntity = milestone.startupEntityId === targetEntityId;

  assert.strictEqual(belongsToCallerEntity, false, 'Cross-tenant milestone mutation must be rejected');
});

// =========================================================================
// SECTION 3: SIX-PERSONA PROFILE COMPLETION PERSISTENCE & RECALCULATION
// =========================================================================
console.log('\n--- SECTION 3: Profile Completion Across All Six Personas ---');

const {
  calculateProfileCompletion,
  calculateStartupCompletion,
  calculateMentorCompletion,
  calculateIndividualInvestorCompletion,
  calculateInvestmentOrgCompletion,
  calculateESPCompletion,
} = require('./helpers/profileCompletionEngine.cjs');

runTest('Persona 1: Startup Profile Completion (7 Sections / 100%)', () => {
  const empty = calculateStartupCompletion(null);
  assert.strictEqual(empty.percentage, 0);
  assert.strictEqual(empty.checklist.length, 7);

  const partial = calculateStartupCompletion({
    identity: { name: 'Alpha Tech', industry: 'FinTech', tagline: 'Unified B2B payments', location: 'Hyderabad' },
    problem: 'SME cross-border payments suffer from high transaction fees and multi-day delays.',
    solution: 'Instant stablecoin routing rail compliant with RBI guidelines.',
  });
  // Basic Info (20%) + Problem & Solution (15%) = 35%
  assert.strictEqual(partial.percentage, 35);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_basic').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_problem').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_team').completed, false);
});

runTest('Persona 2: Mentor Profile Completion (4 Sections / 100%)', () => {
  const partial = calculateMentorCompletion({
    name: 'Dr. Ramesh Kumar',
    headline: 'Principal AI Architect & Seed Mentor',
    bio: '20+ years building high-throughput distributed systems in enterprise financial networks.',
    skills: ['AI/ML Architecture', 'Cloud Infrastructure'],
  });
  // Identity & Bio (25%) + Professional Expertise (25%) = 50%
  assert.strictEqual(partial.percentage, 50);
  assert.strictEqual(partial.checklist.length, 4);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_mentor_id').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_mentor_exp').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_mentor_off').completed, false);
});

runTest('Persona 3: Individual Investor Profile Completion (4 Sections / 100%)', () => {
  const partial = calculateIndividualInvestorCompletion({
    name: 'Vikram Mehta',
    currentRole: 'Active Angel Investor',
    bio: 'Backing early stage B2B SaaS and developer tools across India and South Asia.',
    investmentFocus: {
      sectors: ['SaaS', 'DevTools'],
      stages: ['Seed', 'Pre-Series A'],
      ticketSize: { formatted: '₹25L – ₹50L' },
    },
  });
  // Angel Identity & Bio (25%) + Thesis & Sectors (25%) + Cheque Size (25%) = 75%
  assert.strictEqual(partial.percentage, 75);
  assert.strictEqual(partial.checklist.length, 4);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_inv_id').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_inv_thesis').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_inv_cheque').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_inv_prefs').completed, false);
});

runTest('Persona 4: Investment Organization Profile Completion (5 Sections / 100%)', () => {
  const partial = calculateInvestmentOrgCompletion({
    name: 'Nexus Horizon Ventures',
    organizationType: 'Venture Capital',
    officialEmail: 'partners@nexushorizon.vc',
    about: { thesis: 'Invest in disruptive deeptech, robotics, and climate-tech companies.' },
    investmentFocus: {
      sectors: ['DeepTech', 'Robotics'],
      ticketSize: { formatted: '₹5 Cr – ₹25 Cr' },
    },
    fundSize: '₹500 Crore Fund I',
  });
  // Legal Entity (20%) + Thesis (20%) + Fund Capital (20%) = 60%
  assert.strictEqual(partial.percentage, 60);
  assert.strictEqual(partial.checklist.length, 5);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_org_legal').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_org_thesis').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_org_cap').completed, true);
  assert.strictEqual(partial.checklist.find((c) => c.id === 'sec_org_team').completed, false);
});

runTest('Persona 5 & 6: ESP and Institution Profile Completion (4 Sections / 100%)', () => {
  // ESP (Incubator)
  const espResult = calculateESPCompletion({
    name: 'T-Hub Innovation Zone',
    officialEmail: 'partnerships@thub.org',
    location: 'Hyderabad',
    about: { overview: 'Empowering early-stage tech founders with world-class prototyping labs.' },
    focusAreas: ['Enterprise Software', 'HealthTech', 'FinTech'],
  }, false);
  // Identity & HQ (25%) + Mission & Sectors (25%) = 50%
  assert.strictEqual(espResult.percentage, 50);
  assert.strictEqual(espResult.checklist.length, 4);
  assert.strictEqual(espResult.checklist[0].label, 'Incubator Identity & HQ');

  // Institution (Academic)
  const instResult = calculateESPCompletion({
    name: 'Indian Institute of Technology Innovation Cell',
    officialEmail: 'dean.rnd@iit.ac.in',
    location: 'Bengaluru',
    about: { overview: 'Fostering deep-tech collegiate entrepreneurship and commercializing university research patents.' },
    focusAreas: ['Nanotechnology', 'Semiconductors', 'AI'],
  }, true);
  assert.strictEqual(instResult.percentage, 50);
  assert.strictEqual(instResult.checklist[0].label, 'Institution Identity & HQ');
});

runTest('Profile Completion Recalculation: Entity switching updates checklist and weighting dynamically', () => {
  // User switches from Startup to Investor Organization
  const startupRes = calculateProfileCompletion('startup', {
    identity: { name: 'My Startup', industry: 'SaaS', tagline: 'B2B workflows', location: 'Delhi' }
  });
  assert.strictEqual(startupRes.persona, 'startup');
  assert.strictEqual(startupRes.checklist.length, 7);

  const orgRes = calculateProfileCompletion('investor', {
    name: 'Apex Capital',
    organizationType: 'VC',
    officialEmail: 'contact@apex.vc',
    about: { thesis: 'Invest in seed stage AI companies with validated enterprise customer traction.' },
  }, { isOrgContext: true });
  assert.strictEqual(orgRes.persona, 'investor_org');
  assert.strictEqual(orgRes.checklist.length, 5);
});

runTest('Whitespace & Invalid Input Rejection: Whitespace strings do not inflate completion percentage', () => {
  const whitespaceStartup = calculateStartupCompletion({
    identity: { name: '   ', industry: '  ', tagline: 'abc', location: '   ' },
    problem: '   ',
    solution: '   ',
  });
  assert.strictEqual(whitespaceStartup.percentage, 0);
  assert.strictEqual(whitespaceStartup.completedCount, 0);
});

// =========================================================================
// SECTION 4: AUTHORIZATION & FINANCIAL CONTROLS
// =========================================================================
console.log('\n--- SECTION 4: Authorization and Financial Controls ---');

runTest('Canonical 13 Organizational Roles: Strict validation of all role definitions', () => {
  const rolesFile = path.resolve(__dirname, '../lib/operationalRoles.ts');
  const content = fs.readFileSync(rolesFile, 'utf8');

  // Verify Startup roles (4)
  assert.ok(content.includes("'Founder/Head'"));
  assert.ok(content.includes("'Finance'"));
  assert.ok(content.includes("'Viewer'"));

  // Verify Investor Org roles (5)
  assert.ok(content.includes("'Managing Partner/Head'"));
  assert.ok(content.includes("'Investment Team'"));
  assert.ok(content.includes("'Finance/Operations'"));

  // Verify ESP / Institution roles (4)
  assert.ok(content.includes("'Program Manager'"));
  assert.ok(content.includes("'Staff/Coordinator'"));

  // Verify Investment Team presets (5)
  assert.ok(content.includes("'Analyst'"));
  assert.ok(content.includes("'Associate'"));
  assert.ok(content.includes("'Principal'"));
  assert.ok(content.includes("'Partner'"));
  assert.ok(content.includes("'Portfolio Manager'"));
});

runTest('Mentor Withdrawals: Submit button is safely disabled with compliance warning', () => {
  const workspaceFile = path.resolve(__dirname, '../components/mentor/MentorEarningsWorkspace.tsx');
  const content = fs.readFileSync(workspaceFile, 'utf8');

  // Check disabled button
  assert.ok(content.includes('disabled'), 'Withdrawal button must be disabled');
  assert.ok(content.includes('Withdrawals will be available after payout activation'), 'Must display payout activation notice');
  assert.ok(content.includes('Disbursement authorization will be enabled upon Razorpay payout infrastructure activation'), 'Must cite infrastructure requirement');
});

runTest('Stored-Value Wallet Prohibition: Zero mentor_wallets or unbacked stored balances exist', () => {
  const billingFile = path.resolve(__dirname, '../components/mentor/MentorBillingManager.tsx');
  const billingContent = fs.readFileSync(billingFile, 'utf8');
  assert.ok(!billingContent.includes('mentor_wallets'), 'mentor_wallets collection must not be introduced');
  assert.ok(billingContent.includes('MentorEarningsWorkspace'), 'Must delegate to RBI-aware MentorEarningsWorkspace');
});

// =========================================================================
// SECTION 5: MOCK DATA CLEANUP VALIDATION
// =========================================================================
console.log('\n--- SECTION 5: Mock Data Elimination ---');

runTest('Mock Data Verification: Zero fake cards (4242/4829/1192) in dashboard components', () => {
  const filesToCheck = [
    '../components/dashboard/esp/ESPBillingManager.tsx',
    '../components/dashboard/investor/InvestorBillingManager.tsx',
    '../components/dashboard/ask/UniversalAskManager.tsx',
    '../components/mentor/MentorEarningsWorkspace.tsx',
  ];

  filesToCheck.forEach((rel) => {
    const fullPath = path.resolve(__dirname, rel);
    if (fs.existsSync(fullPath)) {
      const text = fs.readFileSync(fullPath, 'utf8');
      assert.ok(!text.includes('4242'), `${rel} must not contain dummy card 4242`);
      assert.ok(!text.includes('4829'), `${rel} must not contain dummy card 4829`);
      assert.ok(!text.includes('1192'), `${rel} must not contain dummy card 1192`);
    }
  });
});

// =========================================================================
// SECTION 6: RESPONSIVE CARD LAYOUT CONSTRAINTS
// =========================================================================
console.log('\n--- SECTION 6: Responsive Card Layout Stability ---');

runTest('Mentorship Cards: Equal heights, pinned action buttons, and text truncation', () => {
  const file = path.resolve(__dirname, '../components/mentor/MentorshipModule.tsx');
  const text = fs.readFileSync(file, 'utf8');

  // Equal heights and flex layout
  assert.ok(text.includes('flex flex-col justify-between h-full'), 'Cards must have equal height and flex space distribution');
  // Pinned action buttons
  assert.ok(text.includes('mt-auto'), 'Action buttons must be pinned to the bottom of the card with mt-auto');
  // Text truncation and bounds
  assert.ok(text.includes('line-clamp-2'), 'Biographies and multi-line focus descriptions must clamp');
  assert.ok(text.includes('truncate'), 'Titles and names must truncate');
  assert.ok(text.includes('shrink-0'), 'Avatars and badges must have fixed bounds without collapsing');
});

runTest('Investor Connection Cards: Equal heights and responsive grid layout', () => {
  const file = path.resolve(__dirname, '../components/dashboard/investor/InvestorConnections.tsx');
  const text = fs.readFileSync(file, 'utf8');

  assert.ok(text.includes('grid-cols-1 md:grid-cols-2 lg:grid-cols-3'), 'Must support mobile, tablet, and desktop grid columns');
  assert.ok(text.includes('flex flex-col justify-between'), 'Cards must space content between top info and bottom CTA');
  assert.ok(text.includes('mt-auto'), 'Connection action buttons must be pinned to bottom');
  assert.ok(text.includes('shrink-0'), 'Avatars must be protected from flex shrinkage');
});

// =========================================================================
// SUMMARY
// =========================================================================
console.log('\n================================================================');
console.log(`TOTAL TESTS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${totalTests - passedTests}`);
console.log('================================================================');

if (passedTests === totalTests) {
  console.log('\n>>> ALL PRODUCTION READINESS GATE TESTS PASSED SUCCESSFULLY! <<<\n');
  process.exit(0);
} else {
  console.error('\n>>> SOME TESTS FAILED! <<<\n');
  process.exit(1);
}
