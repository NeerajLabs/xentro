/**
 * XENTRO V1 — PROFILE COMPLETION ENGINE TEST SUITE
 * 
 * Verifies deterministic weighting, persona awareness, null/missing value
 * handling, truthful 100%, and strict decoupling from Verification Status.
 */

const assert = require('assert');

// Mock TypeScript transpilation by requiring or defining the evaluator logic
const {
  calculateProfileCompletion,
  calculateStartupCompletion,
  calculateMentorCompletion,
  calculateIndividualInvestorCompletion,
  calculateInvestmentOrgCompletion,
  calculateESPCompletion,
} = require('./helpers/profileCompletionEngine.cjs');

console.log('================================================================');
console.log('XENTRO V1 — PROFILE COMPLETION ENGINE VERIFICATION SUITE');
console.log('================================================================\n');

let passed = 0;
let failed = 0;

function it(description, fn) {
  try {
    fn();
    console.log(`  [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${description}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

// -------------------------------------------------------------
// 1. STARTUP PERSONA TESTS
// -------------------------------------------------------------
console.log('--- GROUP 1: Startup Profile Completion (7 Sections / 100% Total) ---');

it('Empty/null startup data returns 0% completion with 7 missing items', () => {
  const res = calculateStartupCompletion(null);
  assert.strictEqual(res.percentage, 0);
  assert.strictEqual(res.isComplete, false);
  assert.strictEqual(res.checklist.length, 7);
  assert.strictEqual(res.completedCount, 0);
  assert.strictEqual(res.missingCount, 7);
});

it('Basic info only yields exactly 20% completion', () => {
  const data = {
    identity: {
      name: 'Acme AI Systems',
      industry: 'Enterprise Software',
      tagline: 'Autonomous AI orchestration for enterprise ops',
      location: 'Bengaluru, India',
    },
  };
  const res = calculateStartupCompletion(data);
  assert.strictEqual(res.percentage, 20);
  assert.strictEqual(res.isComplete, false);
  assert.strictEqual(res.checklist.find(c => c.id === 'sec_basic').completed, true);
  assert.strictEqual(res.checklist.find(c => c.id === 'sec_problem').completed, false);
});

it('Whitespace-only strings or short taglines do not count towards completion', () => {
  const data = {
    identity: {
      name: '   ',
      industry: '',
      tagline: 'Hi', // Under 5 chars
      location: '   ',
    },
  };
  const res = calculateStartupCompletion(data);
  assert.strictEqual(res.percentage, 0);
  assert.strictEqual(res.checklist.find(c => c.id === 'sec_basic').completed, false);
});

it('Complete startup profile yields truthful 100%', () => {
  const fullStartup = {
    identity: {
      name: 'VentureScale AI',
      industry: 'B2B Software',
      tagline: 'Enterprise multi-agent collaborative workspace',
      location: 'Hyderabad, India',
    },
    problem: 'Enterprises struggle to coordinate decentralized autonomous agents securely.',
    solution: 'A unified deterministic governance orchestration runtime with audit logs.',
    market: { targetCustomer: 'Fortune 500 Financial Services', primarySegment: 'FinTech' },
    businessModel: { businessModel: 'B2B SaaS', revenueModel: 'Annual Platform License' },
    publicTeam: {
      founders: [{ name: 'Alex Rivera', role: 'Founder & CEO', bio: 'Former Lead Architect' }],
    },
    pitchDeck: {
      previewSlides: ['https://example.com/slide1.png'],
      title: 'Institutional Seed Presentation',
    },
    financials: { runwayMonths: 18, fundingGoal: '₹3,00,00,000' },
    currentAsk: { title: 'Seed Round ₹3 Cr', type: 'Investment' },
  };

  const res = calculateStartupCompletion(fullStartup);
  assert.strictEqual(res.percentage, 100);
  assert.strictEqual(res.isComplete, true);
  assert.strictEqual(res.completedCount, 7);
  assert.strictEqual(res.missingCount, 0);
});

it('Verification status does NOT count towards profile completion', () => {
  // A startup with zero profile fields but with verified badges must still be 0% complete!
  const unpopulatedVerifiedStartup = {
    identity: { isVerified: true },
    verificationStatus: 'VERIFIED',
    verified: true,
  };
  const res = calculateStartupCompletion(unpopulatedVerifiedStartup);
  assert.strictEqual(res.percentage, 0, 'Verified badges must never artificially inflate profile completion');
});

// -------------------------------------------------------------
// 2. MENTOR PERSONA TESTS
// -------------------------------------------------------------
console.log('\n--- GROUP 2: Mentor Profile Completion (4 Sections / 25% Each) ---');

it('Empty mentor returns 0%', () => {
  const res = calculateMentorCompletion({});
  assert.strictEqual(res.percentage, 0);
  assert.strictEqual(res.checklist.length, 4);
});

it('Partial mentor with bio & expertise yields exactly 50%', () => {
  const mentor = {
    name: 'Dr. Priya Sharma',
    headline: 'Senior Principal AI Researcher & Advisor',
    bio: 'Ph.D. in Computer Science with 15+ years guiding high-growth ventures.',
    skills: ['Generative AI', 'GTM Strategy'],
  };
  const res = calculateMentorCompletion(mentor);
  assert.strictEqual(res.percentage, 50);
  assert.strictEqual(res.checklist.find(c => c.id === 'sec_mentor_id').completed, true);
  assert.strictEqual(res.checklist.find(c => c.id === 'sec_mentor_exp').completed, true);
  assert.strictEqual(res.checklist.find(c => c.id === 'sec_mentor_off').completed, false);
});

it('Complete mentor yields 100%', () => {
  const fullMentor = {
    name: 'Dr. Priya Sharma',
    headline: 'Senior Principal AI Researcher & Advisor',
    bio: 'Ph.D. in Computer Science with 15+ years guiding high-growth ventures.',
    skills: ['Generative AI', 'GTM Strategy'],
    offerings: [{ id: 'off_1', enabled: true, price: 15000, duration: '1 Month' }],
    availability: {
      availableDays: ['Mon', 'Thu'],
      startTime: '10:00 AM',
      endTime: '05:00 PM',
    },
  };
  const res = calculateMentorCompletion(fullMentor);
  assert.strictEqual(res.percentage, 100);
  assert.strictEqual(res.isComplete, true);
});

// -------------------------------------------------------------
// 3. INVESTOR PERSONA TESTS (Individual & Org)
// -------------------------------------------------------------
console.log('\n--- GROUP 3: Investor Profile Completion ---');

it('Individual Angel with thesis & cheque parameters returns partial score', () => {
  const angel = {
    name: 'Vikram Malhotra',
    currentRole: 'Active Angel Investor',
    bio: 'Backing early stage B2B SaaS and developer tools across India and SEA.',
    investmentFocus: {
      sectors: ['SaaS', 'DevTools'],
      stages: ['Seed'],
      ticketSize: { formatted: '₹25L – ₹50L' },
    },
  };
  const res = calculateIndividualInvestorCompletion(angel);
  assert.strictEqual(res.percentage, 75); // ID (25) + Thesis (25) + Cheque (25) = 75
  assert.strictEqual(res.checklist.find(c => c.id === 'sec_inv_prefs').completed, false);
});

it('Investment Organization evaluates 5 distinct 20% sections', () => {
  const org = {
    name: 'Summit Ridge Ventures',
    organizationType: 'Venture Capital',
    officialEmail: 'partner@summitridge.vc',
    about: { thesis: 'Backing category-defining Indian enterprise technology founders from Day 0.' },
    investmentFocus: {
      sectors: ['Enterprise Software', 'AI Infrastructure'],
      ticketSize: { formatted: '₹2 Cr – ₹10 Cr' },
    },
    fundSize: '₹350 Cr Fund II',
    teamMembers: [{ name: 'Siddharth Rao', role: 'Managing Partner' }],
    investmentProcess: {
      stages: [{ stepNumber: 1, title: 'Screening' }],
    },
  };
  const res = calculateInvestmentOrgCompletion(org);
  assert.strictEqual(res.percentage, 100);
  assert.strictEqual(res.checklist.length, 5);
});

// -------------------------------------------------------------
// 4. ESP & INSTITUTION PERSONA TESTS
// -------------------------------------------------------------
console.log('\n--- GROUP 4: ESP & Institution Profile Completion ---');

it('ESP and Institution calculate independently with appropriate labels', () => {
  const espData = {
    name: 'Nexus Incubator Hub',
    officialEmail: 'info@nexushub.org',
    headquarters: { city: 'Bengaluru' },
    about: { overview: 'Government supported startup incubator fostering deeptech and clean energy.' },
    focusAreas: ['DeepTech', 'CleanEnergy'],
    programs: [{ id: 'prog_1', title: 'Cohort 2026' }],
    members: [{ name: 'Kavita Menon', role: 'Program Director' }],
  };

  const espRes = calculateESPCompletion(espData, false);
  assert.strictEqual(espRes.percentage, 100);
  assert.strictEqual(espRes.persona, 'esp');

  const instRes = calculateESPCompletion(espData, true);
  assert.strictEqual(instRes.percentage, 100);
  assert.strictEqual(instRes.persona, 'institution');
  assert.strictEqual(instRes.checklist[0].label, 'Institution Identity & HQ');
});

// -------------------------------------------------------------
// 5. UNIVERSAL ROUTER ISOLATION
// -------------------------------------------------------------
console.log('\n--- GROUP 5: Universal Context Routing & Isolation ---');

it('Universal router dispatches to proper evaluator without cross-contamination', () => {
  const sRes = calculateProfileCompletion('startup', { identity: { name: 'S' } });
  assert.strictEqual(sRes.persona, 'startup');

  const mRes = calculateProfileCompletion('mentor', { name: 'M' });
  assert.strictEqual(mRes.persona, 'mentor');

  const iRes = calculateProfileCompletion('investor', { name: 'I' });
  assert.strictEqual(iRes.persona, 'investor_individual');

  const oRes = calculateProfileCompletion('investor', { name: 'O' }, { isOrgContext: true });
  assert.strictEqual(oRes.persona, 'investor_org');

  const eRes = calculateProfileCompletion('esp', { name: 'E' });
  assert.strictEqual(eRes.persona, 'esp');

  const instRes = calculateProfileCompletion('institution', { name: 'U' });
  assert.strictEqual(instRes.persona, 'institution');
});

console.log('\n================================================================');
console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED OUT OF ${passed + failed} TESTS`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
}
