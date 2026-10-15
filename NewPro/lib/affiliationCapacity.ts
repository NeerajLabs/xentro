import { Db, ClientSession } from 'mongodb';

export interface EspCapacityStatus {
  espEntityId: string;
  activeStartupCount: number;
  maxCapacity: number;
  availableSlots: number;
  isFull: boolean;
  activeStartupIds: string[];
}

/**
 * Initializes or migrates an ESP's capacity document in esp_affiliate_capacities
 * from the authoritative affiliations collection if not present.
 */
export async function ensureEspCapacityInitialized(
  db: Db,
  espEntityId: string,
  session?: ClientSession
): Promise<void> {
  const capacityCol = db.collection('esp_affiliate_capacities');
  const existing = await capacityCol.findOne({ espEntityId }, { session });
  if (existing) return;

  const affCol = db.collection('affiliations');
  const activeAffs = await affCol
    .find({ issuingEntityId: espEntityId, status: 'Active' }, { session })
    .project({ startupEntityId: 1 })
    .toArray();

  const distinctStartupIds = Array.from(new Set(activeAffs.map((a: any) => a.startupEntityId)));
  const now = new Date().toISOString();

  await capacityCol.updateOne(
    { espEntityId },
    {
      $setOnInsert: {
        espEntityId,
        activeStartupCount: distinctStartupIds.length,
        maxCapacity: 250,
        activeStartupIds: distinctStartupIds,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true, session }
  );
}

/**
 * Database-enforced atomic reservation:
 * Ensures racing processes at 249/250 cannot admit 251 distinct startups.
 * WiredTiger document-level locking serializes this operation.
 */
export async function reserveEspCapacity(
  db: Db,
  espEntityId: string,
  startupEntityId: string,
  session?: ClientSession
): Promise<{ success: boolean; activeCount: number; alreadyCounted: boolean }> {
  await ensureEspCapacityInitialized(db, espEntityId, session);

  const capacityCol = db.collection('esp_affiliate_capacities');
  const now = new Date().toISOString();

  // 1. Check if startup is already active with this ESP (e.g. re-acceptance or multi-program)
  const alreadyActive = await capacityCol.findOne(
    { espEntityId, activeStartupIds: startupEntityId },
    { session }
  );
  if (alreadyActive) {
    return {
      success: true,
      activeCount: alreadyActive.activeStartupIds?.length || 0,
      alreadyCounted: true,
    };
  }

  // 2. Atomic reservation: matches ONLY if array size is strictly < 250
  const reserved = await capacityCol.findOneAndUpdate(
    {
      espEntityId,
      $expr: { $lt: [{ $size: '$activeStartupIds' }, 250] },
    },
    {
      $addToSet: { activeStartupIds: startupEntityId },
      $set: { updatedAt: now },
    },
    { returnDocument: 'after', session }
  );

  if (!reserved) {
    return {
      success: false,
      activeCount: 250,
      alreadyCounted: false,
    };
  }

  const currentCount = reserved.activeStartupIds?.length || 0;
  // Sync numerical field
  await capacityCol.updateOne(
    { espEntityId },
    { $set: { activeStartupCount: currentCount } },
    { session }
  );

  return {
    success: true,
    activeCount: currentCount,
    alreadyCounted: false,
  };
}

/**
 * Safely releases capacity when an affiliation is revoked or during transactional compensation.
 */
export async function releaseEspCapacity(
  db: Db,
  espEntityId: string,
  startupEntityId: string,
  session?: ClientSession
): Promise<void> {
  const affCol = db.collection('affiliations');
  // Verify startup has no other active affiliations with this ESP
  const otherActive = await affCol.countDocuments(
    { issuingEntityId: espEntityId, startupEntityId, status: 'Active' },
    { session }
  );

  if (otherActive <= 0) {
    const capacityCol = db.collection('esp_affiliate_capacities');
    const now = new Date().toISOString();

    const updated = await capacityCol.findOneAndUpdate(
      { espEntityId },
      {
        $pull: { activeStartupIds: startupEntityId } as any,
        $set: { updatedAt: now },
      },
      { returnDocument: 'after', session }
    );

    if (updated) {
      const currentCount = updated.activeStartupIds?.length || 0;
      await capacityCol.updateOne(
        { espEntityId },
        { $set: { activeStartupCount: currentCount } },
        { session }
      );
    }
  }
}

/**
 * Recalculates and reconciles authoritative counts from affiliations collection.
 */
export async function reconcileEspCapacity(
  db: Db,
  espEntityId: string,
  session?: ClientSession
): Promise<EspCapacityStatus> {
  const affCol = db.collection('affiliations');
  const capacityCol = db.collection('esp_affiliate_capacities');

  const activeAffs = await affCol
    .find({ issuingEntityId: espEntityId, status: 'Active' }, { session })
    .project({ startupEntityId: 1 })
    .toArray();

  const distinctStartupIds = Array.from(new Set(activeAffs.map((a: any) => a.startupEntityId)));
  const count = distinctStartupIds.length;
  const now = new Date().toISOString();

  await capacityCol.updateOne(
    { espEntityId },
    {
      $set: {
        activeStartupCount: count,
        maxCapacity: 250,
        activeStartupIds: distinctStartupIds,
        updatedAt: now,
      },
      $setOnInsert: {
        espEntityId,
        createdAt: now,
      },
    },
    { upsert: true, session }
  );

  return {
    espEntityId,
    activeStartupCount: count,
    maxCapacity: 250,
    availableSlots: Math.max(0, 250 - count),
    isFull: count >= 250,
    activeStartupIds: distinctStartupIds,
  };
}

/**
 * Reads current capacity status for an ESP.
 */
export async function getEspCapacityStatus(
  db: Db,
  espEntityId: string
): Promise<EspCapacityStatus> {
  await ensureEspCapacityInitialized(db, espEntityId);
  const capacityCol = db.collection('esp_affiliate_capacities');
  const doc = await capacityCol.findOne({ espEntityId });
  const activeCount = doc?.activeStartupIds?.length || 0;
  return {
    espEntityId,
    activeStartupCount: activeCount,
    maxCapacity: 250,
    availableSlots: Math.max(0, 250 - activeCount),
    isFull: activeCount >= 250,
    activeStartupIds: doc?.activeStartupIds || [],
  };
}
