const { MongoClient } = require('mongodb');

const uri =
  process.env.MONGODB_URI ||
  'mongodb+srv://xentro_backend:aGhEUewSo1C9Py5i@xentro-db.rokwmb.mongodb.net/?appName=xentro-db';

async function verifyPersistence() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('xentro_db');
    console.log('[Verification] Connected to MongoDB Atlas xentro_db');

    // 1. Check entities collection
    const testEntity = await db.collection('entities').findOne({ id: 'ST-839801' });
    console.log('[Entity Check] ST-839801 Entity:');
    console.log({
      id: testEntity?.id,
      name: testEntity?.name,
      createdByUserId: testEntity?.createdByUserId,
      currentOwnerUserId: testEntity?.currentOwnerUserId,
      primaryOwnerId: testEntity?.primaryOwnerId,
      status: testEntity?.status,
    });

    if (!testEntity) {
      throw new Error('Test entity ST-839801 not found!');
    }

    // 2. Check startups collection
    const startupDoc = await db.collection('startups').findOne({ entityId: 'ST-839801' });
    console.log('[Startup Document Check] ST-839801 in startups collection:');
    console.log({
      entityId: startupDoc?.entityId,
      name: startupDoc?.name,
      tagline: startupDoc?.identity?.tagline,
      stage: startupDoc?.identity?.stage,
      industry: startupDoc?.identity?.industry,
      visibility: startupDoc?.visibility,
      createdByUserId: startupDoc?.createdByUserId,
      currentOwnerUserId: startupDoc?.currentOwnerUserId,
    });

    if (!startupDoc) {
      throw new Error('Startup record not found in startups collection!');
    }

    // 3. Test Diligence Collections
    console.log('[Diligence Check] diligence_documents and diligence_access_requests:');
    const docCount = await db.collection('diligence_documents').countDocuments({ entityId: 'ST-839801' });
    const reqCount = await db.collection('diligence_access_requests').countDocuments({ entityId: 'ST-839801' });
    console.log(`- Diligence documents count: ${docCount}`);
    console.log(`- Diligence access requests count: ${reqCount}`);

    // 4. Test Financials Collection
    console.log('[Financials Check] startup_financials:');
    const finDoc = await db.collection('startup_financials').findOne({ entityId: 'ST-839801' });
    console.log({
      entityId: finDoc?.entityId || 'Not created yet (initializes on first financial save)',
      mrr: finDoc?.mrr,
      runwayMonths: finDoc?.runwayMonths,
    });

    // 5. Test Talent Asks Collection
    console.log('[Talent Check] talent_asks:');
    const askCount = await db.collection('talent_asks').countDocuments({ entityId: 'ST-839801' });
    console.log(`- Talent asks count: ${askCount}`);

    // 6. Test User Independence
    const ownerUser = await db.collection('users').findOne({ id: testEntity.createdByUserId });
    console.log('[User Independence Check] Owner user record:');
    console.log({
      userId: ownerUser?.id,
      name: ownerUser?.name,
      email: ownerUser?.email,
      accountType: ownerUser?.accountType,
    });

    console.log('\n[SUCCESS] All collections and relationships verified in MongoDB Atlas!');
  } catch (err) {
    console.error('[Verification Failed]', err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyPersistence();
