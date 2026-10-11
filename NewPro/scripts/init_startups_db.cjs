const { MongoClient } = require('mongodb');

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';

async function initStartupDatabase() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('xentro_db');
    console.log('[DB Init] Connected to xentro_db');

    // 1. Create Required Indexes
    await db.collection('startups').createIndex({ entityId: 1 }, { unique: true });
    await db.collection('startup_financials').createIndex({ entityId: 1 }, { unique: true });
    await db.collection('diligence_documents').createIndex({ entityId: 1 });
    await db.collection('diligence_access_requests').createIndex({ entityId: 1 });
    await db.collection('talent_asks').createIndex({ entityId: 1 });
    await db.collection('talent_applicants').createIndex({ entityId: 1 });
    await db.collection('entities').createIndex({ id: 1 }, { unique: true });
    await db.collection('memberships').createIndex({ entityId: 1, userId: 1 });
    console.log('[DB Init] Unique & lookup indexes confirmed.');

    // 2. Identify active startup entities and ensure a canonical record exists in startups
    const entities = await db.collection('entities').find({ entityType: 'STARTUP' }).toArray();
    const activeEntities = entities.filter(
      (e) =>
        e.status !== 'DELETED' &&
        e.status !== 'ORPHANED_DELETED' &&
        !e.deleted &&
        !e.is_deleted
    );

    console.log(`[DB Init] Found ${activeEntities.length} active startup entities.`);

    for (const ent of activeEntities) {
      const existing = await db.collection('startups').findOne({ entityId: ent.id });
      const nowIso = new Date().toISOString();

      if (!existing) {
        const startupDoc = {
          entityId: ent.id,
          name: ent.name,
          createdByUserId: ent.createdByUserId || ent.primaryOwnerId || '',
          currentOwnerUserId: ent.currentOwnerUserId || ent.primaryOwnerId || '',
          identity: {
            name: ent.name,
            logo: ent.logo || '/xentro-logo.png',
            banner: ent.banner || null,
            tagline: ent.details?.pitch || ent.tagline || 'Building innovative enterprise solutions',
            stage: ent.details?.stage || ent.stage || 'MVP',
            industry: ent.details?.sector || ent.industry || 'Technology & Innovation',
            subSector: ent.details?.subSector || '',
            businessModelType: ent.details?.businessModelType || 'B2B',
            foundedYear: ent.details?.foundedYear || new Date().getFullYear(),
            location: ent.details?.location || ent.location || 'India',
            operatingGeography: ['India'],
            website: ent.details?.website || ent.website || '',
            linkedin: ent.details?.linkedin || ent.linkedin || '',
            isVerified: ent.verificationStatus === 'VERIFIED',
          },
          overview: {
            whatItDoes: ent.details?.pitch || `Official venture profile for ${ent.name}.`,
            whoItServes: ent.details?.whoItServes || 'Ecosystem enterprises and partners',
            currentStage: ent.details?.stage || 'Active Venture',
            coreValueProp: ent.details?.pitch || 'Scaling innovative solutions.',
          },
          unsdg: [],
          pitchVideo: null,
          pitchDeck: null,
          problem: {
            problemStatement: '',
            targetUsers: '',
            painPoints: [],
            whyItMatters: '',
            existingAlternatives: '',
          },
          solution: {
            overview: '',
            howItSolves: '',
            coreValueProp: '',
            keyDifferentiators: [],
          },
          product: {
            name: `${ent.name} Platform`,
            category: ent.details?.sector || 'Software',
            description: '',
            status: 'MVP',
            keyFeatures: [],
            screenshots: [],
            demoLink: '',
          },
          companyInfo: {
            legalName: ent.name,
            incorporationStatus: 'Active',
            incorporationDate: '',
            registeredLocation: ent.details?.location || 'India',
            isDPIITRecognised: false,
            isMSMERegistered: false,
          },
          market: {
            targetCustomer: '',
            primarySegment: ent.details?.sector || '',
            businessModelCategory: 'B2B',
            targetGeography: ['India'],
            marketOpportunity: '',
          },
          businessModel: {
            businessModel: 'B2B',
            revenueModel: 'Direct / Subscription',
            pricingModel: '',
            revenueStreams: [],
            customerType: 'Enterprise',
            salesModel: 'Direct',
          },
          publicTeam: {
            founders: [
              {
                id: 'founder_1',
                name: ent.primaryOwnerName || 'Founder',
                role: 'Founder & CEO',
                roleCategory: 'founder',
                avatar: '/xentro-logo.png',
                bio: `Founder & Lead at ${ent.name}.`,
                isFullTime: true,
                isVerified: true,
              },
            ],
            leadership: [],
            core: [],
            advisors: [],
          },
          metrics: {
            profileCompletionPct: 75,
            profileViews: 0,
            profileViewsDelta: '+0% this week',
            connectionsCount: 0,
            askResponsesCount: 0,
            opportunitiesAppliedCount: 0,
            ddRequestsCount: 0,
          },
          visibility: ent.visibility || 'PUBLIC',
          createdAt: ent.createdAt || nowIso,
          updatedAt: nowIso,
        };

        await db.collection('startups').insertOne(startupDoc);
        console.log(`[DB Init] Created startups record for ${ent.id} (${ent.name})`);
      }

      // Also ensure entity record in entities has createdByUserId and currentOwnerUserId
      const updateFields = {
        createdByUserId: ent.createdByUserId || ent.primaryOwnerId || '',
        currentOwnerUserId: ent.currentOwnerUserId || ent.primaryOwnerId || '',
        primaryOwnerId: ent.primaryOwnerId || '',
        updatedAt: nowIso,
      };

      await db.collection('entities').updateOne({ id: ent.id }, { $set: updateFields });
    }

    console.log('[DB Init] Completed successfully!');
  } finally {
    await client.close();
  }
}

initStartupDatabase().catch((err) => {
  console.error('[DB Init Error]', err);
  process.exit(1);
});
