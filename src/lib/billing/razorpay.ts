// ─────────────────────────────────────────────
// Razorpay Server Client — Extended
// ─────────────────────────────────────────────
// Provider-specific logic is isolated here so a future
// migration to Stripe or another gateway only touches this file.

import Razorpay from 'razorpay'
import crypto from 'crypto'
import { logger } from '@/lib/logger'

export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
})

// ── Signature Verification ──────────────────

export function verifyPaymentSignature({
  subscriptionId,
  paymentId,
  signature,
}: {
  subscriptionId: string
  paymentId: string
  signature: string
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || ''
  const generated = crypto
    .createHmac('sha256', secret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex')
  return generated === signature
}

export function verifyWebhookSignature({
  body,
  signature,
}: {
  body: string
  signature: string
}): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
  if (!webhookSecret) {
    logger.warn('RAZORPAY_WEBHOOK_SECRET is not set — skipping verification in dev')
    return process.env.NODE_ENV === 'development'
  }
  const expected = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')
  return expected === signature
}

// ── Plan Management ─────────────────────────

export async function createRazorpayPlan({
  planName,
  amount,
  currency,
  period,
  interval,
}: {
  planName: string
  amount: number // paise
  currency: string
  period: 'monthly' | 'yearly'
  interval: number
}) {
  try {
    const plan = await (razorpay.plans as any).create({
      period: period === 'yearly' ? 'yearly' : 'monthly',
      interval,
      item: {
        name: planName,
        amount,
        currency: currency.toUpperCase(),
      },
    })
    logger.info({ razorpayPlanId: plan.id, planName }, 'Razorpay plan created')
    return plan
  } catch (err: any) {
    logger.error({ err, planName }, 'Failed to create Razorpay plan')
    throw err
  }
}

// ── Subscription Management ─────────────────

export async function createRazorpaySubscription({
  razorpayPlanId,
  totalCount,
  customerNotify,
  notes,
}: {
  razorpayPlanId: string
  totalCount?: number
  customerNotify?: 0 | 1
  notes?: Record<string, string>
}) {
  try {
    const sub = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      total_count: totalCount || 120,
      customer_notify: customerNotify ?? 1,
      notes: notes || {},
    })
    logger.info({ subscriptionId: sub.id }, 'Razorpay subscription created')
    return sub
  } catch (err: any) {
    logger.error({ err, razorpayPlanId }, 'Failed to create Razorpay subscription')
    throw err
  }
}

export async function fetchRazorpaySubscription(subscriptionId: string) {
  try {
    return await razorpay.subscriptions.fetch(subscriptionId)
  } catch (err: any) {
    logger.error({ err, subscriptionId }, 'Failed to fetch Razorpay subscription')
    throw err
  }
}

export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd: boolean
) {
  try {
    const result = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd)
    logger.info({ subscriptionId, cancelAtCycleEnd }, 'Razorpay subscription cancelled')
    return result
  } catch (err: any) {
    logger.error({ err, subscriptionId }, 'Failed to cancel Razorpay subscription')
    throw err
  }
}

// ── Payment ─────────────────────────────────

export async function fetchRazorpayPayment(paymentId: string) {
  try {
    return await razorpay.payments.fetch(paymentId)
  } catch (err: any) {
    logger.error({ err, paymentId }, 'Failed to fetch Razorpay payment')
    throw err
  }
}
