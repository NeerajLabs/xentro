import { Db, ClientSession } from 'mongodb';
import crypto from 'crypto';

export const ESP_INCLUDED_CAPACITY = 250;
export const ESP_OVERAGE_RATE_INR = 399;

export interface EspRecurringSubscription {
  subscriptionId: string;
  espEntityId: string;
  slots: number;
  ratePerSlotInr: number;
  monthlyAmountInr: number;
  currency: 'INR';
  status: 'PENDING_PAYMENT' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' | 'AWAITING_OPERATOR_GATEWAY_CONFIG';
  billingCycle: {
    currentPeriodStart: string;
    currentPeriodEnd: string;
    renewalDate: string;
  };
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  latestPaymentRef?: string;
  cancellationDetails?: {
    cancelledAt: string;
    cancelAtPeriodEnd: boolean;
    reason?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EspOverageOrder {
  orderId: string;
  slotsPurchased: number;
  amountInr: number;
  overageRateInr: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'AWAITING_OPERATOR_GATEWAY_CONFIG';
  requestedByUserId?: string;
  paymentGatewayRef?: string;
  createdAt: string;
  completedAt?: string;
}

export interface EspCapacityStatus {
  espEntityId: string;
  activeStartupCount: number;
  baseCapacity: number; // 250 included
  purchasedOverageSlots: number; // active paid monthly overage slots
  activeMonthlySlots: number;
  pendingMonthlySlots: number;
  maxCapacity: number; // 250 + activeMonthlySlots
  availableSlots: number;
  isFull: boolean;
  isIncludedCapacityExhausted: boolean;
  isRestrictedOverCapacity: boolean; // Lifecycle: if paid capacity expires while >250 startups
  restrictedReason?: string;
  billingCycleStatus: 'NORMAL' | 'AWAITING_PAYMENT' | 'CAPACITY_RESTRICTED_PAYMENT_DUE';
  overageRateInr: number; // 399
  monthlyCommitmentInr: number;
  nextRenewalDate?: string;
  activeStartupIds: string[];
  subscriptions?: EspRecurringSubscription[];
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
  if (existing) {
    if (existing.baseCapacity === undefined || existing.maxCapacity === undefined) {
      const purchased = existing.purchasedOverageSlots || existing.activeMonthlySlots || 0;
      await capacityCol.updateOne(
        { espEntityId },
        {
          $set: {
            baseCapacity: ESP_INCLUDED_CAPACITY,
            purchasedOverageSlots: purchased,
            activeMonthlySlots: purchased,
            maxCapacity: ESP_INCLUDED_CAPACITY + purchased,
            overageRateInr: ESP_OVERAGE_RATE_INR,
          },
        },
        { session }
      );
    }
    return;
  }

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
        baseCapacity: ESP_INCLUDED_CAPACITY,
        purchasedOverageSlots: 0,
        activeMonthlySlots: 0,
        pendingMonthlySlots: 0,
        maxCapacity: ESP_INCLUDED_CAPACITY,
        overageRateInr: ESP_OVERAGE_RATE_INR,
        activeStartupIds: distinctStartupIds,
        subscriptions: [],
        overageOrders: [],
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true, session }
  );
}

/**
 * Reads authoritative current capacity status for an ESP.
 * Dynamically reconciles recurring subscription states, checks expiration,
 * and handles the safe restricted-capacity state if paid capacity expires.
 */
export async function getEspCapacityStatus(
  db: Db,
  espEntityId: string
): Promise<EspCapacityStatus> {
  await ensureEspCapacityInitialized(db, espEntityId);
  const capacityCol = db.collection('esp_affiliate_capacities');
  const doc = await capacityCol.findOne({ espEntityId });
  const activeStartupIds: string[] = doc?.activeStartupIds || [];
  const activeCount = activeStartupIds.length;

  const now = new Date();
  const subsCol = db.collection('esp_subscriptions');
  const subscriptions: EspRecurringSubscription[] = await subsCol
    .find({ espEntityId })
    .toArray() as any;

  let activeMonthlySlots = 0;
  let pendingMonthlySlots = 0;
  let nextRenewalDate: string | undefined = undefined;

  for (const sub of subscriptions) {
    if (sub.status === 'ACTIVE') {
      const periodEnd = new Date(sub.billingCycle.currentPeriodEnd);
      if (periodEnd.getTime() < now.getTime()) {
        // Period expired without renewal event: mark EXPIRED
        sub.status = 'EXPIRED';
        await subsCol.updateOne(
          { subscriptionId: sub.subscriptionId },
          { $set: { status: 'EXPIRED', updatedAt: now.toISOString() } }
        );
      } else {
        activeMonthlySlots += sub.slots;
        if (!nextRenewalDate || new Date(sub.billingCycle.renewalDate) < new Date(nextRenewalDate)) {
          nextRenewalDate = sub.billingCycle.renewalDate;
        }
      }
    } else if (sub.status === 'PENDING_PAYMENT') {
      pendingMonthlySlots += sub.slots;
    }
  }

  // Legacy compatibility: check if doc had permanent overage prior to monthly transition
  const legacySlots = doc?.purchasedOverageSlots || 0;
  const effectivePaidSlots = Math.max(activeMonthlySlots, legacySlots);
  const maxCap = ESP_INCLUDED_CAPACITY + effectivePaidSlots;

  // Lifecycle check: If an ESP's paid capacity expired while having >250 affiliated startups,
  // do NOT delete records. Mark as restricted over-capacity.
  const isRestrictedOverCapacity = activeCount > maxCap;
  const restrictedReason = isRestrictedOverCapacity
    ? `Paid monthly overage capacity expired. Currently ${activeCount} active ventures (${activeCount - maxCap} over included allowance of 250). Please renew subscription to resume full capacity.`
    : undefined;

  let billingCycleStatus: 'NORMAL' | 'AWAITING_PAYMENT' | 'CAPACITY_RESTRICTED_PAYMENT_DUE' = 'NORMAL';
  if (isRestrictedOverCapacity) {
    billingCycleStatus = 'CAPACITY_RESTRICTED_PAYMENT_DUE';
  } else if (pendingMonthlySlots > 0) {
    billingCycleStatus = 'AWAITING_PAYMENT';
  }

  // Update cached numerical values
  await capacityCol.updateOne(
    { espEntityId },
    {
      $set: {
        activeStartupCount: activeCount,
        purchasedOverageSlots: effectivePaidSlots,
        activeMonthlySlots: effectivePaidSlots,
        pendingMonthlySlots,
        maxCapacity: maxCap,
        updatedAt: now.toISOString(),
      },
    }
  );

  return {
    espEntityId,
    activeStartupCount: activeCount,
    baseCapacity: ESP_INCLUDED_CAPACITY,
    purchasedOverageSlots: effectivePaidSlots,
    activeMonthlySlots: effectivePaidSlots,
    pendingMonthlySlots,
    maxCapacity: maxCap,
    availableSlots: Math.max(0, maxCap - activeCount),
    isFull: activeCount >= maxCap,
    isIncludedCapacityExhausted: activeCount >= ESP_INCLUDED_CAPACITY,
    isRestrictedOverCapacity,
    restrictedReason,
    billingCycleStatus,
    overageRateInr: ESP_OVERAGE_RATE_INR,
    monthlyCommitmentInr: effectivePaidSlots * ESP_OVERAGE_RATE_INR,
    nextRenewalDate,
    activeStartupIds,
    subscriptions,
  };
}

/**
 * Database-enforced atomic reservation:
 * Ensures racing processes cannot exceed current maxCapacity (250 included + purchased overage slots).
 * Also blocks any new reservations if ESP is in restricted-capacity state.
 */
export async function reserveEspCapacity(
  db: Db,
  espEntityId: string,
  startupEntityId: string,
  session?: ClientSession
): Promise<{
  success: boolean;
  activeCount: number;
  maxCapacity?: number;
  alreadyCounted: boolean;
  isIncludedCapacityExhausted?: boolean;
  isRestrictedOverCapacity?: boolean;
  requiresOveragePurchase?: boolean;
  overageRateInr?: number;
  isOverageTier?: boolean;
  message?: string;
}> {
  await ensureEspCapacityInitialized(db, espEntityId, session);

  const capacityCol = db.collection('esp_affiliate_capacities');
  const now = new Date().toISOString();

  // 1. Check if startup is already active with this ESP (e.g. re-acceptance or multi-program)
  const alreadyActive = await capacityCol.findOne(
    { espEntityId, activeStartupIds: startupEntityId },
    { session }
  );
  if (alreadyActive) {
    const currentMax = alreadyActive.maxCapacity || ESP_INCLUDED_CAPACITY;
    return {
      success: true,
      activeCount: alreadyActive.activeStartupIds?.length || 0,
      maxCapacity: currentMax,
      alreadyCounted: true,
    };
  }

  // 2. Check current capacity and restricted state
  const status = await getEspCapacityStatus(db, espEntityId);
  if (status.isRestrictedOverCapacity) {
    return {
      success: false,
      activeCount: status.activeStartupCount,
      maxCapacity: status.maxCapacity,
      isIncludedCapacityExhausted: true,
      isRestrictedOverCapacity: true,
      requiresOveragePurchase: true,
      overageRateInr: ESP_OVERAGE_RATE_INR,
      alreadyCounted: false,
      message: `Reservation blocked: ESP monthly overage capacity is expired or payment is past due (${status.activeStartupCount}/${status.maxCapacity} active startups). Complete payment to restore active capacity.`,
    };
  }

  // 3. Atomic reservation: matches ONLY if array size is strictly < maxCapacity
  const reserved = await capacityCol.findOneAndUpdate(
    {
      espEntityId,
      $expr: { $lt: [{ $size: '$activeStartupIds' }, { $ifNull: ['$maxCapacity', ESP_INCLUDED_CAPACITY] }] },
    },
    {
      $addToSet: { activeStartupIds: startupEntityId },
      $set: { updatedAt: now },
    },
    { returnDocument: 'after', session }
  );

  if (!reserved) {
    const docAfter = await capacityCol.findOne({ espEntityId }, { session });
    const count = docAfter?.activeStartupIds?.length || ESP_INCLUDED_CAPACITY;
    const effMax = docAfter?.maxCapacity || ESP_INCLUDED_CAPACITY;
    return {
      success: false,
      activeCount: count,
      maxCapacity: effMax,
      isIncludedCapacityExhausted: count >= ESP_INCLUDED_CAPACITY,
      isRestrictedOverCapacity: false,
      requiresOveragePurchase: count >= effMax,
      overageRateInr: ESP_OVERAGE_RATE_INR,
      alreadyCounted: false,
      message: `Reservation blocked: ESP capacity limit reached (${count}/${effMax} active startups). Additional capacity is ₹399/startup/month.`,
    };
  }

  const currentCount = reserved.activeStartupIds?.length || 0;
  const currentMax = reserved.maxCapacity || ESP_INCLUDED_CAPACITY;

  // Sync numerical field
  await capacityCol.updateOne(
    { espEntityId },
    { $set: { activeStartupCount: currentCount } },
    { session }
  );

  return {
    success: true,
    activeCount: currentCount,
    maxCapacity: currentMax,
    isOverageTier: currentCount > ESP_INCLUDED_CAPACITY,
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
 * Server-verified activation or renewal of an ESP monthly recurring subscription.
 * Atomically updates maxCapacity and activeMonthlySlots.
 * Idempotent against duplicate webhooks.
 */
export async function activateEspMonthlySubscription(
  db: Db,
  espEntityId: string,
  subscriptionId: string,
  paymentGatewayRef: string,
  verifiedBySignature: boolean
): Promise<{
  success: boolean;
  alreadyProcessed?: boolean;
  newMaxCapacity: number;
  activeMonthlySlots: number;
  message: string;
}> {
  if (!verifiedBySignature) {
    throw new Error('Cryptographic payment verification failed. Unsigned subscription grant is blocked.');
  }

  await ensureEspCapacityInitialized(db, espEntityId);
  const subsCol = db.collection('esp_subscriptions');
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30-day billing cycle

  const existingSub: any = await subsCol.findOne({ subscriptionId });
  if (!existingSub) {
    throw new Error(`Subscription ${subscriptionId} not found.`);
  }

  if (existingSub.status === 'ACTIVE' && existingSub.latestPaymentRef === paymentGatewayRef) {
    const capStatus = await getEspCapacityStatus(db, espEntityId);
    return {
      success: true,
      alreadyProcessed: true,
      newMaxCapacity: capStatus.maxCapacity,
      activeMonthlySlots: capStatus.activeMonthlySlots,
      message: `Subscription ${subscriptionId} was already activated with payment ref ${paymentGatewayRef}.`,
    };
  }

  // Update subscription to ACTIVE and roll over period
  await subsCol.updateOne(
    { subscriptionId },
    {
      $set: {
        status: 'ACTIVE',
        latestPaymentRef: paymentGatewayRef,
        'billingCycle.currentPeriodStart': now.toISOString(),
        'billingCycle.currentPeriodEnd': periodEnd.toISOString(),
        'billingCycle.renewalDate': periodEnd.toISOString(),
        updatedAt: now.toISOString(),
      },
    }
  );

  const capStatus = await getEspCapacityStatus(db, espEntityId);
  return {
    success: true,
    newMaxCapacity: capStatus.maxCapacity,
    activeMonthlySlots: capStatus.activeMonthlySlots,
    message: `Successfully activated monthly recurring subscription for ${existingSub.slots} additional startups (₹${existingSub.monthlyAmountInr}/month). New total capacity: ${capStatus.maxCapacity}.`,
  };
}

/**
 * Handles payment failure / halted subscription. Enters past-due state.
 * Preserves existing affiliation documents (never deletes).
 */
export async function handleEspSubscriptionPastDue(
  db: Db,
  espEntityId: string,
  subscriptionId: string,
  reason: string
): Promise<void> {
  const subsCol = db.collection('esp_subscriptions');
  const now = new Date().toISOString();

  await subsCol.updateOne(
    { subscriptionId },
    {
      $set: {
        status: 'PAST_DUE',
        lastFailureReason: reason,
        updatedAt: now,
      },
    }
  );

  await getEspCapacityStatus(db, espEntityId);
}

/**
 * Cancels an ESP recurring subscription.
 */
export async function cancelEspMonthlySubscription(
  db: Db,
  espEntityId: string,
  subscriptionId: string,
  reason: string = 'User requested cancellation'
): Promise<void> {
  const subsCol = db.collection('esp_subscriptions');
  const now = new Date().toISOString();

  await subsCol.updateOne(
    { subscriptionId },
    {
      $set: {
        status: 'CANCELLED',
        'cancellationDetails.cancelledAt': now,
        'cancellationDetails.cancelAtPeriodEnd': true,
        'cancellationDetails.reason': reason,
        updatedAt: now,
      },
    }
  );

  await getEspCapacityStatus(db, espEntityId);
}

/**
 * Backwards compatibility wrapper for one-time order calls.
 */
export async function initiateEspOveragePurchase(
  db: Db,
  espEntityId: string,
  slotsToPurchase: number,
  requestedByUserId?: string
) {
  const { initiateEspMonthlyCheckout } = await import('./razorpayService');
  return initiateEspMonthlyCheckout(db, espEntityId, slotsToPurchase, requestedByUserId || 'system');
}

/**
 * Backwards compatibility wrapper for confirm payment calls.
 */
export async function confirmEspOveragePayment(
  db: Db,
  espEntityId: string,
  orderId: string,
  paymentGatewayRef: string,
  verifiedBySignature: boolean
) {
  return activateEspMonthlySubscription(db, espEntityId, orderId, paymentGatewayRef, verifiedBySignature);
}
