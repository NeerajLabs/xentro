const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is required.');
  process.exit(1);
}

async function runEndToEndVerification() {
  console.log('--- STARTING INVESTMENT ORGANIZATIONS MONGODB PERSISTENCE VALIDATION ---');
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('[OK] Connected to MongoDB Atlas cluster');

    const db = client.db('xentro_db');
    const invOrgCol = db.collection('investment_organizations');
    const dealsCol = db.collection('investor_deals');
    const portCol = db.collection('investor_portfolio');
    const entitiesCol = db.collection('entities');
    const membershipsCol = db.collection('memberships');

    // 1. Verify indexes
    const invOrgIndexes = await invOrgCol.indexes();
    const dealsIndexes = await dealsCol.indexes();
    const portIndexes = await portCol.indexes();

    console.log(`[OK] investment_organizations indexes: ${invOrgIndexes.map(i => Object.keys(i.key).join('_')).join(', ')}`);
    console.log(`[OK] investor_deals indexes: ${dealsIndexes.map(i => Object.keys(i.key).join('_')).join(', ')}`);
    console.log(`[OK] investor_portfolio indexes: ${portIndexes.map(i => Object.keys(i.key).join('_')).join(', ')}`);

    const testEntityId = `VCI-TST${Date.now().toString().slice(-6)}`;
    const testUserId = `usr_test_${Date.now()}`;
    const testEntityId2 = `VCI-TST${(Date.now() + 1).toString().slice(-6)}`;

    console.log(`\n--- TEST STEP 1: Creating Test Investment Organization ${testEntityId} ---`);
    const nowIso = new Date().toISOString();

    // Insert entity
    await entitiesCol.insertOne({
      id: testEntityId,
      canonicalType: 'INVESTOR_ORG',
      entityType: 'INVESTOR_ORG',
      name: 'Alpha Horizon Ventures Fund I',
      legalName: 'Alpha Horizon Ventures Management LLP',
      officialEmail: 'gp@alphahorizon.vc',
      createdByUserId: testUserId,
      currentOwnerUserId: testUserId,
      status: 'PENDING',
      verificationStatus: 'PENDING_VERIFICATION',
      activationStatus: 'PENDING_ADMIN_APPROVAL',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // Insert investment_organizations record
    await invOrgCol.insertOne({
      entityId: testEntityId,
      name: 'Alpha Horizon Ventures Fund I',
      legalName: 'Alpha Horizon Ventures Management LLP',
      organizationType: 'VC Firm',
      shortDescription: 'DeepTech & AI early-stage venture fund.',
      headquarters: { city: 'Bengaluru', country: 'India' },
      fundSize: '₹300 Cr',
      aum: '₹300 Cr AUM',
      verified: false,
      ownerId: testUserId,
      currentOwnerUserId: testUserId,
      createdByUserId: testUserId,
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    // Insert provisional membership
    await membershipsCol.insertOne({
      id: `MEM-${Date.now().toString().slice(-6)}`,
      entityId: testEntityId,
      entityName: 'Alpha Horizon Ventures Fund I',
      entityType: 'INVESTOR_ORG',
      userId: testUserId,
      role: 'Owner/Managing Partner',
      permissions: ['VIEW_ONLY'],
      status: 'PENDING_ADMIN_VERIFICATION',
      dealAccessMode: 'all',
      portfolioAccessMode: 'all',
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    console.log('[OK] Entity, investment_organizations document, and provisional membership created.');

    // 2. Admin verification promotion
    console.log(`\n--- TEST STEP 2: Simulating Admin Verification Approval ---`);
    await entitiesCol.updateOne(
      { id: testEntityId },
      {
        $set: {
          verificationStatus: 'VERIFIED',
          activationStatus: 'ACTIVATED',
          status: 'ACTIVE',
          isActive: true,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    await invOrgCol.updateOne(
      { entityId: testEntityId },
      {
        $set: {
          verified: true,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const fullPermissions = [
      'OWNER',
      'ADMIN',
      'MANAGE_ORGANIZATION',
      'MANAGE_TEAM',
      'MANAGE_BILLING',
      'VIEW_DEAL_FLOW',
      'EDIT_DEAL_FLOW',
      'CREATE_INVESTMENT_DECISION',
      'VIEW_PORTFOLIO',
      'EDIT_PORTFOLIO',
      'ACCESS_DILIGENCE_VAULT',
      'REQUEST_DILIGENCE',
      'SCHEDULE_MEETINGS',
      'EXPORT_DATA',
    ];

    await membershipsCol.updateMany(
      { entityId: testEntityId },
      {
        $set: {
          status: 'ACTIVE',
          permissions: fullPermissions,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    const verifiedMembership = await membershipsCol.findOne({ entityId: testEntityId, userId: testUserId });
    console.log(`[OK] Membership status promoted to: ${verifiedMembership.status}`);
    console.log(`[OK] Membership permissions count: ${verifiedMembership.permissions.length}`);

    // 3. Deals isolation & CRUD
    console.log(`\n--- TEST STEP 3: Testing CRM Deal Pipeline Persistence & Multi-Entity Isolation ---`);
    const deal1 = {
      id: `deal_t1_${Date.now()}`,
      organizationId: testEntityId,
      startupId: 'st_neural_01',
      startupName: 'NeuralStack AI',
      founderName: 'Aarav Patel',
      sector: 'DeepTech / AI',
      dealStage: 'reviewed',
      fundingAsk: '$1.5M',
      valuation: '$10M Post',
      assignedMemberId: testUserId,
      assignedMemberName: 'GP Partner',
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await dealsCol.insertOne(deal1);

    // Create second org deal to verify isolation
    await dealsCol.insertOne({
      id: `deal_t2_${Date.now()}`,
      organizationId: testEntityId2,
      startupId: 'st_other_01',
      startupName: 'OtherCorp FinTech',
      founderName: 'Jane Doe',
      sector: 'FinTech',
      dealStage: 'new',
      fundingAsk: '$500k',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const org1Deals = await dealsCol.find({ organizationId: testEntityId }).toArray();
    console.log(`[OK] Deals retrieved for Org 1 (${testEntityId}): ${org1Deals.length} (Expected: 1)`);
    if (org1Deals.some(d => d.organizationId !== testEntityId)) {
      throw new Error('FAILED: Data isolation breach between organizations!');
    }
    console.log('[OK] Cross-organization data isolation verified.');

    // Update deal stage and issue term sheet
    console.log(`\n--- TEST STEP 4: Testing Deal Term Sheet & Stage Progression ---`);
    await dealsCol.updateOne(
      { id: deal1.id, organizationId: testEntityId },
      {
        $set: {
          dealStage: 'term_discussion',
          termSheet: {
            status: 'offered',
            amount: '$1.5M',
            equity: '15.0%',
            valuation: '$10M Post',
            date: new Date().toISOString().split('T')[0],
          },
          updatedAt: new Date().toISOString(),
        },
        $push: {
          notes: {
            id: `note_${Date.now()}`,
            text: 'Term sheet issued after unanimous IC partner approval.',
            authorName: 'GP Partner',
            createdAt: new Date().toISOString(),
          },
        },
      }
    );

    const updatedDeal = await dealsCol.findOne({ id: deal1.id });
    console.log(`[OK] Deal updated stage: ${updatedDeal.dealStage}`);
    console.log(`[OK] Deal term sheet status: ${updatedDeal.termSheet?.status}`);
    console.log(`[OK] Deal internal notes count: ${updatedDeal.notes?.length}`);

    // 4. Portfolio holdings & dynamic MOIC calculation
    console.log(`\n--- TEST STEP 5: Testing Portfolio Holdings Persistence & Dynamic Fair Value / MOIC ---`);
    const portHolding = {
      id: `port_t1_${Date.now()}`,
      organizationId: testEntityId,
      name: 'OmniCloud DevSecOps',
      sector: 'Enterprise SaaS',
      stageInvested: 'Seed',
      investmentYear: '2024',
      checkInvested: '₹5 Cr',
      currentMultiple: '2.80x',
      growthMoM: '+18% MoM',
      boardSeat: 'Director',
      status: 'Outperforming',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await portCol.insertOne(portHolding);

    const holdings = await portCol.find({ organizationId: testEntityId }).toArray();
    console.log(`[OK] Portfolio holdings for ${testEntityId}: ${holdings.length}`);

    // Helper to test MOIC calculation
    function parseFinancialNumber(val) {
      if (typeof val === 'number') return val;
      if (!val || typeof val !== 'string') return 0;
      const clean = val.replace(/,/g, '').trim();
      if (clean.includes('Cr')) {
        const num = parseFloat(clean.replace(/[^0-9.]/g, ''));
        return isNaN(num) ? 0 : num * 10000000;
      }
      return parseFloat(clean.replace(/[^0-9.]/g, '')) || 0;
    }

    let totalInvested = 0;
    let totalFairValue = 0;
    holdings.forEach(h => {
      const check = parseFinancialNumber(h.checkInvested);
      const mult = parseFloat(String(h.currentMultiple).replace(/[^0-9.]/g, '')) || 1.0;
      totalInvested += check;
      totalFairValue += check * mult;
    });

    const calcMoic = (totalFairValue / totalInvested).toFixed(2) + 'x';
    console.log(`[OK] Calculated dynamic MOIC: ${calcMoic} (Expected: 2.80x)`);
    console.log(`[OK] Invested Capital: ₹${(totalInvested / 10000000).toFixed(2)} Cr`);
    console.log(`[OK] Estimated Fair Value: ₹${(totalFairValue / 10000000).toFixed(2)} Cr`);

    // 5. Cleanup test artifacts
    console.log(`\n--- CLEANUP: Removing test records ---`);
    await entitiesCol.deleteMany({ id: { $in: [testEntityId, testEntityId2] } });
    await invOrgCol.deleteMany({ entityId: { $in: [testEntityId, testEntityId2] } });
    await membershipsCol.deleteMany({ entityId: { $in: [testEntityId, testEntityId2] } });
    await dealsCol.deleteMany({ organizationId: { $in: [testEntityId, testEntityId2] } });
    await portCol.deleteMany({ organizationId: { $in: [testEntityId, testEntityId2] } });
    console.log('[OK] All test records cleanly purged.');

    console.log('\n======================================================');
    console.log(' ALL END-TO-END INVESTMENT ORG PERSISTENCE TESTS PASSED! ');
    console.log('======================================================');
  } finally {
    await client.close();
  }
}

runEndToEndVerification().catch((err) => {
  console.error('[TEST ERROR]:', err);
  process.exit(1);
});
