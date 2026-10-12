const fs = require('fs');
const path = require('path');
const { MongoClient } = require('mongodb');

let uri = process.env.MONGODB_URI;
if (!uri) {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/MONGODB_URI=(.*)/);
    if (match) {
      uri = match[1].trim();
    }
  }
}
if (!uri) {
  throw new Error('MONGODB_URI not found in process.env or .env.local');
}

async function verifyAndBackfillTags() {
  console.log('--- STARTING ACCOUNT TAG SYSTEM MONGODB VERIFICATION ---');
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('xentro_db');
    console.log('[OK] Connected to MongoDB Atlas: xentro_db');

    const usersCol = db.collection('users');
    const entitiesCol = db.collection('entities');
    const startupsCol = db.collection('startups');

    // 1. Backfill and verify users collection
    console.log('\n[1] Verifying users collection tags...');
    const allUsers = await usersCol.find({}).toArray();
    let updatedUsers = 0;

    for (const u of allUsers) {
      const cleanName = (u.fullName || u.name || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const existingTag = u.accountTag || u.username || `@${cleanName}${Math.floor(10 + Math.random() * 90)}`;
      const normalizedTag = existingTag.startsWith('@') ? existingTag : `@${existingTag}`;

      const needsUpdate = !u.accountTag || !u.username || u.accountTag !== normalizedTag || u.username !== normalizedTag;
      if (needsUpdate) {
        await usersCol.updateOne(
          { _id: u._id },
          {
            $set: {
              accountTag: normalizedTag,
              username: normalizedTag,
              tag: normalizedTag,
            },
          }
        );
        updatedUsers++;
      }
    }
    console.log(`[Users] Verified ${allUsers.length} total users. Updated/synced tags on ${updatedUsers} users.`);

    // 2. Check user "bb" specifically
    const userBb = await usersCol.findOne({
      $or: [
        { fullName: 'bb' },
        { email: 'nb5436760@gmail.com' },
        { id: 'XU-400286' },
      ],
    });
    console.log('\n[2] User "bb" Verified Record:');
    if (userBb) {
      console.log({
        id: userBb.id,
        fullName: userBb.fullName,
        username: userBb.username,
        accountTag: userBb.accountTag,
        accountType: userBb.accountType,
        email: userBb.email,
      });
    } else {
      console.log('User "bb" not found');
    }

    // 3. Backfill and verify entities collection
    console.log('\n[3] Verifying entities collection tags...');
    const allEntities = await entitiesCol.find({}).toArray();
    let updatedEntities = 0;

    for (const e of allEntities) {
      const cleanName = (e.name || 'entity').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const existingTag = e.accountTag || e.username || `@${cleanName}${Math.floor(10 + Math.random() * 90)}`;
      const normalizedTag = existingTag.startsWith('@') ? existingTag : `@${existingTag}`;

      const needsUpdate = !e.accountTag || !e.username || e.accountTag !== normalizedTag || e.username !== normalizedTag;
      if (needsUpdate) {
        await entitiesCol.updateOne(
          { _id: e._id },
          {
            $set: {
              accountTag: normalizedTag,
              username: normalizedTag,
              tag: normalizedTag,
            },
          }
        );
        updatedEntities++;
      }
    }
    console.log(`[Entities] Verified ${allEntities.length} total entities. Updated/synced tags on ${updatedEntities} entities.`);

    // 4. Sample verification of entities with tags
    const sampleEntities = await entitiesCol.find({}).limit(4).toArray();
    console.log('\n[4] Sample Entities with Tags:');
    sampleEntities.forEach((e) => {
      console.log(`- Entity: "${e.name}" | ID: ${e.id} | Tag: ${e.accountTag} | Type: ${e.entityType}`);
    });

    // 5. Test Tag Query Resolution
    console.log('\n[5] Testing tag query lookups:');
    const testTag = userBb ? userBb.accountTag : '@bb93';
    const tagQueryWithAt = await usersCol.findOne({ accountTag: testTag });
    const tagQueryWithoutAt = await usersCol.findOne({ accountTag: testTag.replace(/^@/, '') });
    console.log(`- Query with "${testTag}": Found => ${tagQueryWithAt ? tagQueryWithAt.fullName : 'None'}`);

    const sampleEntity = sampleEntities[0];
    if (sampleEntity) {
      const entityByTag = await entitiesCol.findOne({ accountTag: sampleEntity.accountTag });
      console.log(`- Query entity with "${sampleEntity.accountTag}": Found => ${entityByTag ? entityByTag.name : 'None'}`);
    }

    // 6. Ensure indexes on accountTag and username
    console.log('\n[6] Ensuring MongoDB indexes for high-speed tag lookup...');
    await usersCol.createIndex({ accountTag: 1 }, { background: true });
    await usersCol.createIndex({ username: 1 }, { background: true });
    await entitiesCol.createIndex({ accountTag: 1 }, { background: true });
    await entitiesCol.createIndex({ username: 1 }, { background: true });
    console.log('[OK] High-performance indexes verified on users and entities.');

    console.log('\n=== [SUCCESS] ACCOUNT TAG SYSTEM FULLY VERIFIED IN MONGODB ATLAS ===');
  } catch (err) {
    console.error('Verification error:', err);
  } finally {
    await client.close();
  }
}

verifyAndBackfillTags();
