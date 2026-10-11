const { MongoClient } = require('mongodb');

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';

async function init() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db('xentro_db');
    console.log('Connected to MongoDB Atlas: xentro_db');

    // 1. investment_organizations collection and indexes
    const invOrgCol = db.collection('investment_organizations');
    await invOrgCol.createIndex({ entityId: 1 }, { unique: true });
    await invOrgCol.createIndex({ legalName: 1 });
    await invOrgCol.createIndex({ organizationType: 1 });
    await invOrgCol.createIndex({ currentOwnerUserId: 1 });
    console.log('Indexes created for investment_organizations');

    // 2. investor_deals collection and indexes
    const dealsCol = db.collection('investor_deals');
    await dealsCol.createIndex({ id: 1 }, { unique: true });
    await dealsCol.createIndex({ organizationId: 1, dealStage: 1 });
    await dealsCol.createIndex({ organizationId: 1, assignedMemberId: 1 });
    await dealsCol.createIndex({ organizationId: 1, startupId: 1 });
    await dealsCol.createIndex({ organizationId: 1, updatedAt: -1 });
    console.log('Indexes created for investor_deals');

    // 3. investor_portfolio collection and indexes
    const portCol = db.collection('investor_portfolio');
    await portCol.createIndex({ id: 1 }, { unique: true });
    await portCol.createIndex({ organizationId: 1 });
    await portCol.createIndex({ organizationId: 1, xentroStartupId: 1 });
    console.log('Indexes created for investor_portfolio');

    // 4. Check for existing VCI- entities in 'entities' and migrate baseline records if missing
    const entitiesCol = db.collection('entities');
    const existingVciEntities = await entitiesCol.find({
      $or: [
        { id: { $regex: '^VCI-' } },
        { entityType: 'INVESTOR_ORG' },
        { accountType: 'INVESTOR_ORG' }
      ]
    }).toArray();

    console.log(`Found ${existingVciEntities.length} existing INVESTOR_ORG entities in central registry.`);

    for (const ent of existingVciEntities) {
      const entityId = ent.id || ent.entityId;
      const existingDoc = await invOrgCol.findOne({ entityId });
      if (!existingDoc) {
        const details = ent.details || {};
        const nowIso = new Date().toISOString();
        const newOrgDoc = {
          entityId,
          name: ent.name,
          legalName: ent.name,
          organizationType: details.investorType || details.organizationType || 'VC Firm',
          logo: ent.logo || '/xentro-logo.png',
          banner: ent.banner || '',
          shortDescription: details.pitch || details.tagline || details.shortDescription || `Institutional investment organization ${ent.name}`,
          website: ent.website || '',
          linkedIn: ent.linkedin || '',
          headquarters: {
            city: ent.location?.city || details.location || 'Bengaluru',
            state: ent.location?.state || 'Karnataka',
            country: ent.location?.country || 'India',
          },
          foundedYear: details.foundedYear || '2026',
          officialEmail: ent.officialEmail || '',
          fundSize: details.fundSize || '₹250 Cr',
          aum: details.aum || details.fundSize || '₹250 Cr AUM',
          operatingRegions: details.operatingRegions || ['India'],
          verified: ent.verificationStatus === 'VERIFIED',
          ownerId: ent.currentOwnerUserId || ent.primaryOwnerId || ent.createdByUserId,
          currentOwnerUserId: ent.currentOwnerUserId || ent.primaryOwnerId || ent.createdByUserId,
          createdByUserId: ent.createdByUserId || ent.primaryOwnerId,
          about: {
            overview: details.pitch || `${ent.name} is an institutional fund supporting early-stage ventures.`,
            thesis: details.thesis || 'We back visionary founders building scalable, high-conviction technology enterprises.',
            mission: details.mission || `Empowering founders to scale impactful enterprises.`,
            assetsInfo: details.assetsInfo || details.fundSize || 'Active fund deployment',
            fundGeneration: details.fundGeneration || 'Active Deployment',
            geographicPresence: details.location || 'Bengaluru (HQ), India',
          },
          investmentFocus: {
            sectors: details.sectors || ['Enterprise SaaS', 'FinTech', 'AI & Machine Learning'],
            stages: details.stages || ['Seed', 'Series A'],
            geography: {
              countries: ['India'],
              regions: [ent.location?.city || 'Bengaluru'],
            },
            businessModels: ['B2B', 'SaaS', 'Marketplace'],
            ticketSize: details.ticketSize || {
              min: '₹1 Cr',
              max: '₹5 Cr',
              formatted: '₹1 Cr – ₹5 Cr',
            },
            leadInvestorPreference: 'Lead or Co-Lead',
            investmentInstruments: ['Equity', 'CCPS', 'SAFE notes'],
          },
          valueBeyondCapital: {
            supportAreas: ['Go-To-Market Acceleration', 'Customer Introductions', 'Follow-On Syndication'],
            whatIBringToFounders: 'Hands-on platform support in enterprise scaling, executive hiring, and fundraising guidance.',
            advisoryCapabilities: ['GTM Playbooks', 'Pricing Strategy', 'Enterprise Sales'],
          },
          investmentCriteria: {
            evaluationCriteria: ['High founder integrity and velocity', 'Demonstrated customer demand', 'Defensible technology moat'],
            preferredTraction: ['MVP', 'Early Revenue'],
            diligenceHighlights: ['Customer references', 'Financial audit'],
          },
          investmentProcess: {
            stages: [
              { stepNumber: 1, title: 'Initial Deal Review & Screening', description: 'Deck review within 48 hours.', estimatedTime: '2-3 Days' },
              { stepNumber: 2, title: 'Partner Discussion', description: 'Discussion on product roadmap and traction.', estimatedTime: '1 Week' },
              { stepNumber: 3, title: 'Due Diligence & Term Sheet', description: 'Cap table evaluation and investment memo.', estimatedTime: '1-2 Weeks' }
            ],
            preferredConnectionMethod: 'Platform pitch submission',
            informationRequiredInitially: ['Pitch Deck (PDF)', 'Metrics'],
            typicalDecisionTimeline: '2 to 3 weeks',
            pitchDeckRequirements: 'PDF deck with traction and financial summary',
            warmIntroPreferred: false,
            unsolicitedPitchesAccepted: true,
          },
          experienceStats: {
            totalInvestments: 0,
            activePortfolio: 0,
            followOnInvestments: 0,
            exits: 0,
            yearsOfExperience: '1 Year',
            industriesInvested: (details.sectors || []).length || 3,
          },
          portfolio: [],
          testimonials: [],
          connectionPreferences: {
            openToConnectionRequests: true,
            openToStartupPitches: true,
            introductionPreferred: false,
            currentlyInvesting: true,
            notAcceptingNewPitches: false,
            guidelines: 'Happy to review pitches from mission-driven founders.',
          },
          subscription: {
            tier: 'institutional',
            status: 'active',
            currentPeriodEnd: '2026-12-31T23:59:59Z',
            cancelAtPeriodEnd: false,
            seatsIncluded: 15,
            seatsUsed: 1,
            dealFlowLimit: -1,
            dueDiligenceExportsLimit: 100,
            monthlyPrice: 11490,
            currency: 'INR',
          },
          billingAccount: {
            organizationName: ent.name,
            billingEmail: ent.officialEmail || '',
            gstin: details.gstin || '',
            pan: details.pan || '',
            taxExempt: false,
            billingAddress: {
              line1: 'Corporate Office',
              city: ent.location?.city || 'Bengaluru',
              state: ent.location?.state || 'Karnataka',
              country: ent.location?.country || 'India',
              postalCode: '560001',
            },
          },
          createdAt: ent.createdAt || nowIso,
          updatedAt: ent.updatedAt || nowIso,
        };
        await invOrgCol.insertOne(newOrgDoc);
        console.log(`Migrated entity ${entityId} (${ent.name}) into investment_organizations.`);
      }
    }

    console.log('Database initialization completed successfully.');
  } finally {
    await client.close();
  }
}

init().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
