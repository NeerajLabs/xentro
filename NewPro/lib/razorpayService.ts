/**
 * XENTRO V1 — RAZORPAY BILLING & RECURRING SUBSCRIPTION SERVICE
 * 
 * Commercial Rules:
 *   - 250 included qualifying active ESP-affiliated startups.
 *   - Additional capacity: ₹399 per additional startup per month.
 *   - Currency: INR.
 *   - Gateway: Razorpay Subscriptions / Payments.
 *   - Server-Authoritative: Never trust client-submitted status or price.
 *   - Fail-Closed: Gateways without valid keys fail closed without granting paid capacity.
 */

import crypto from 'crypto';
import { Db } from 'mongodb';
import {
  ESP_OVERAGE_RATE_INR,
  EspRecurringSubscription,
  activateEspMonthlySubscription,
  handleEspSubscriptionPastDue,
  cancelEspMonthlySubscription,
} from './affiliationCapacity';

export interface RazorpayConfig {
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  isConfigured: boolean;
}

/**
 * Reads Razorpay configuration from server environment.
 * Fails closed if keys are absent or placeholder values.
 */
export function getRazorpayConfig(): RazorpayConfig {
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();
  const webhookSecret = (process.env.RAZORPAY_WEBHOOK_SECRET || '').trim();

  const isConfigured = Boolean(
    keyId &&
    keySecret &&
    !keyId.includes('placeholder') &&
    !keySecret.includes('placeholder')
  );

  return { keyId, keySecret, webhookSecret, isConfigured };
}

/**
 * Cryptographically verifies Razorpay payment signature for checkout callback.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyRazorpayPaymentSignature(params: {
  orderIdOrSubscriptionId: string;
  paymentId: string;
  signature: string;
  secret?: string;
}): boolean {
  const secret = params.secret || getRazorpayConfig().keySecret;
  if (!secret || !params.signature || !params.paymentId || !params.orderIdOrSubscriptionId) {
    return false;
  }

  try {
    const text = `${params.orderIdOrSubscriptionId}|${params.paymentId}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(text)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(params.signature, 'utf8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error('[Razorpay Signature Error]:', err);
    return false;
  }
}

/**
 * Cryptographically verifies Razorpay Webhook signature (X-Razorpay-Signature).
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret?: string
): boolean {
  const secret = webhookSecret || getRazorpayConfig().webhookSecret || getRazorpayConfig().keySecret;
  if (!secret || !signature || !rawBody) {
    return false;
  }

  try {
    const expected = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(signature, 'utf8');

    if (expectedBuf.length !== actualBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch (err) {
    console.error('[Razorpay Webhook Signature Error]:', err);
    return false;
  }
}

/**
 * Initiates an ESP monthly recurring subscription order.
 * Server determines pricing: slots * 399 INR per month.
 */
export async function initiateEspMonthlyCheckout(
  db: Db,
  espEntityId: string,
  slotsToPurchase: number,
  userId: string
): Promise<{
  success: boolean;
  subscriptionId: string;
  slots: number;
  ratePerSlotInr: number;
  monthlyAmountInr: number;
  currency: 'INR';
  status: string;
  requiresOperatorPaymentConfig: boolean;
  razorpayOptions?: {
    key: string;
    subscription_id?: string;
    order_id?: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
  };
  message: string;
}> {
  if (slotsToPurchase < 1) {
    throw new Error('Must subscribe to at least 1 additional startup slot.');
  }

  const cfg = getRazorpayConfig();
  const ratePerSlotInr = ESP_OVERAGE_RATE_INR; // 399
  const monthlyAmountInr = slotsToPurchase * ratePerSlotInr;
  const subscriptionId = `sub_${espEntityId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const subDoc: EspRecurringSubscription = {
    subscriptionId,
    espEntityId,
    slots: slotsToPurchase,
    ratePerSlotInr,
    monthlyAmountInr,
    currency: 'INR',
    status: cfg.isConfigured ? 'PENDING_PAYMENT' : 'AWAITING_OPERATOR_GATEWAY_CONFIG',
    billingCycle: {
      currentPeriodStart: now.toISOString(),
      currentPeriodEnd: periodEnd.toISOString(),
      renewalDate: periodEnd.toISOString(),
    },
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const subsCol = db.collection('esp_subscriptions');
  await subsCol.insertOne(subDoc);

  // Link in esp_affiliate_capacities
  const capCol = db.collection('esp_affiliate_capacities');
  await capCol.updateOne(
    { espEntityId },
    {
      $push: { subscriptions: subDoc } as any,
      $set: { updatedAt: now.toISOString() },
    },
    { upsert: true }
  );

  if (!cfg.isConfigured) {
    return {
      success: false,
      subscriptionId,
      slots: slotsToPurchase,
      ratePerSlotInr,
      monthlyAmountInr,
      currency: 'INR',
      status: 'AWAITING_OPERATOR_GATEWAY_CONFIG',
      requiresOperatorPaymentConfig: true,
      message:
        'Live commercial checkout requires operator Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET). The subscription order has been recorded in pending state.',
    };
  }

  return {
    success: true,
    subscriptionId,
    slots: slotsToPurchase,
    ratePerSlotInr,
    monthlyAmountInr,
    currency: 'INR',
    status: 'PENDING_PAYMENT',
    requiresOperatorPaymentConfig: false,
    razorpayOptions: {
      key: cfg.keyId,
      order_id: subscriptionId,
      amount: monthlyAmountInr * 100, // paise
      currency: 'INR',
      name: 'Xentro Ecosystem Service Provider Capacity',
      description: `Additional Capacity: +${slotsToPurchase} startups (₹399/startup/month)`,
    },
    message: `Subscription order ${subscriptionId} initialized for ${slotsToPurchase} startups at ₹${monthlyAmountInr}/month.`,
  };
}

/**
 * Idempotently processes incoming Razorpay Webhook events.
 * Deduplicates events via `esp_payment_events` collection.
 */
export async function processRazorpayWebhookEvent(
  db: Db,
  event: {
    id: string;
    event: string;
    payload: any;
    created_at?: number;
  }
): Promise<{
  success: boolean;
  handled: boolean;
  alreadyProcessed: boolean;
  eventType: string;
  message: string;
}> {
  const eventsCol = db.collection('esp_payment_events');
  const now = new Date().toISOString();

  // 1. Idempotency Check: prevent duplicate event processing
  const existing = await eventsCol.findOne({ eventId: event.id });
  if (existing) {
    return {
      success: true,
      handled: true,
      alreadyProcessed: true,
      eventType: event.event,
      message: `Event ${event.id} already processed at ${existing.processedAt}.`,
    };
  }

  // Record event before processing
  await eventsCol.updateOne(
    { eventId: event.id },
    {
      $setOnInsert: {
        eventId: event.id,
        eventType: event.event,
        receivedAt: now,
        status: 'PROCESSING',
      },
    },
    { upsert: true }
  );

  try {
    let resultMessage = '';

    switch (event.event) {
      // -------------------------------------------------------------
      // EVENT: subscription.authenticated / subscription.activated
      // -------------------------------------------------------------
      case 'subscription.authenticated':
      case 'subscription.activated': {
        const subData = event.payload?.subscription?.entity || event.payload?.payment?.entity;
        const subId = subData?.id || subData?.notes?.subscriptionId;
        const espEntityId = subData?.notes?.espEntityId;
        const paymentRef = event.payload?.payment?.entity?.id || subData?.id;

        if (espEntityId && subId) {
          await activateEspMonthlySubscription(db, espEntityId, subId, paymentRef, true);
          resultMessage = `Subscription ${subId} activated for ESP ${espEntityId}`;
        }
        break;
      }

      // -------------------------------------------------------------
      // EVENT: payment.captured (Monthly Renewal or Initial Payment)
      // -------------------------------------------------------------
      case 'payment.captured': {
        const payment = event.payload?.payment?.entity;
        const notes = payment?.notes || {};
        const espEntityId = notes.espEntityId;
        const subId = notes.subscriptionId || payment.order_id;

        if (espEntityId && subId) {
          await activateEspMonthlySubscription(db, espEntityId, subId, payment.id, true);
          resultMessage = `Payment ${payment.id} captured. Activated/renewed subscription ${subId}.`;
        }
        break;
      }

      // -------------------------------------------------------------
      // EVENT: payment.failed / subscription.halted
      // -------------------------------------------------------------
      case 'payment.failed':
      case 'subscription.halted': {
        const payment = event.payload?.payment?.entity;
        const notes = payment?.notes || {};
        const espEntityId = notes.espEntityId;
        const subId = notes.subscriptionId || payment?.order_id;

        if (espEntityId && subId) {
          await handleEspSubscriptionPastDue(db, espEntityId, subId, payment?.error_description || 'Payment failed');
          resultMessage = `Payment failed for subscription ${subId}. Placed in past-due state.`;
        }
        break;
      }

      // -------------------------------------------------------------
      // EVENT: subscription.cancelled
      // -------------------------------------------------------------
      case 'subscription.cancelled': {
        const subData = event.payload?.subscription?.entity;
        const subId = subData?.id || subData?.notes?.subscriptionId;
        const espEntityId = subData?.notes?.espEntityId;

        if (espEntityId && subId) {
          await cancelEspMonthlySubscription(db, espEntityId, subId, 'Cancelled via Razorpay Webhook');
          resultMessage = `Subscription ${subId} marked cancelled.`;
        }
        break;
      }

      default:
        resultMessage = `Ignored event type: ${event.event}`;
    }

    await eventsCol.updateOne(
      { eventId: event.id },
      {
        $set: {
          status: 'COMPLETED',
          processedAt: new Date().toISOString(),
          resultMessage,
        },
      }
    );

    return {
      success: true,
      handled: true,
      alreadyProcessed: false,
      eventType: event.event,
      message: resultMessage || `Handled ${event.event}`,
    };
  } catch (err: any) {
    await eventsCol.updateOne(
      { eventId: event.id },
      {
        $set: {
          status: 'ERROR',
          error: err.message,
          failedAt: new Date().toISOString(),
        },
      }
    );
    throw err;
  }
}
