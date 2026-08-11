// ─────────────────────────────────────────────
// Checkout Service
// ─────────────────────────────────────────────

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { getPlanById } from './plans'
import {
  createRazorpaySubscription,
  verifyPaymentSignature,
} from './razorpay'
import { activateSubscription } from './subscription'
import { createBillingAuditLog } from './audit'
import { CheckoutFailedError, BillingError } from './billing-errors'
import { BILLING_AUDIT_ACTIONS } from './constants'

export interface CheckoutResult {
  razorpaySubscriptionId: string
  razorpayKeyId: string
  planName: string
  amount: number
  currency: string
}

/** Create a Razorpay checkout session */
export async function createCheckout(
  tenantId: string,
  userId: string,
  planId: string,
  billingCycle: 'MONTHLY' | 'YEARLY'
): Promise<CheckoutResult> {
  // 1. Validate plan
  const plan = await getPlanById(planId)
  if (!plan || !plan.isActive) {
    throw new BillingError({ code: 'INVALID_PLAN', message: 'Plan not found or inactive.' }, 400)
  }
  if (plan.isFree) {
    throw new BillingError({ code: 'INVALID_PLAN', message: 'Cannot checkout for a free plan.' }, 400)
  }

  // 2. Get Razorpay plan ID
  const razorpayPlanId =
    billingCycle === 'YEARLY' ? plan.razorpayPlanIdYearly : plan.razorpayPlanIdMonthly

  if (!razorpayPlanId) {
    throw new CheckoutFailedError(
      `Razorpay plan ID not configured for ${plan.name} (${billingCycle}). Configure it in admin.`
    )
  }

  // 3. Check for existing active subscription
  const existing = await db.subscription.findUnique({
    where: { organizationId: tenantId },
  })

  if (existing && ['ACTIVE', 'TRIALING'].includes(existing.status) && existing.razorpaySubscriptionId) {
    throw new BillingError({
      code: 'PLAN_CHANGE_PENDING',
      message: 'You already have an active subscription. Use upgrade or downgrade instead.',
    }, 400)
  }

  // 4. Create Razorpay subscription
  try {
    const rzpSub = await createRazorpaySubscription({
      razorpayPlanId,
      totalCount: billingCycle === 'YEARLY' ? 10 : 120,
      customerNotify: 1,
      notes: {
        tenantId,
        userId,
        planId: plan.id,
        planSlug: plan.slug,
        billingCycle,
      },
    })

    // 5. Persist pending subscription
    await db.subscription.upsert({
      where: { organizationId: tenantId },
      update: {
        planId: plan.id,
        razorpaySubscriptionId: rzpSub.id,
        billingCycle,
        amount: billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice,
        currency: plan.currency,
        status: 'INCOMPLETE',
      },
      create: {
        organizationId: tenantId,
        planId: plan.id,
        razorpaySubscriptionId: rzpSub.id,
        billingCycle,
        amount: billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice,
        currency: plan.currency,
        status: 'INCOMPLETE',
      },
    })

    logger.info({ tenantId, planId, billingCycle, rzpSubId: rzpSub.id }, 'Checkout created')

    return {
      razorpaySubscriptionId: rzpSub.id,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
      planName: plan.name,
      amount: billingCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice,
      currency: plan.currency,
    }
  } catch (err: any) {
    logger.error({ err, tenantId, planId }, 'Checkout creation failed')
    if (err instanceof BillingError) throw err
    throw new CheckoutFailedError(err.message || 'Failed to create checkout')
  }
}

/** Verify a completed Razorpay payment and activate the subscription */
export async function verifyCheckout(
  tenantId: string,
  {
    razorpayPaymentId,
    razorpaySubscriptionId,
    razorpaySignature,
  }: {
    razorpayPaymentId: string
    razorpaySubscriptionId: string
    razorpaySignature: string
  }
): Promise<{ success: boolean; subscriptionId: string }> {
  // 1. Verify signature
  const isValid = verifyPaymentSignature({
    subscriptionId: razorpaySubscriptionId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  })

  if (!isValid) {
    throw new BillingError({
      code: 'CHECKOUT_FAILED',
      message: 'Payment signature verification failed.',
    }, 400)
  }

  // 2. Verify the subscription belongs to this tenant
  const sub = await db.subscription.findUnique({
    where: { organizationId: tenantId },
    include: { plan: true },
  })

  if (!sub || sub.razorpaySubscriptionId !== razorpaySubscriptionId) {
    throw new BillingError({
      code: 'CHECKOUT_FAILED',
      message: 'Subscription mismatch.',
    }, 400)
  }

  // 3. Activate
  const now = new Date()
  const periodEnd = new Date(now)
  if (sub.billingCycle === 'YEARLY') {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  const activated = await activateSubscription(tenantId, {
    planId: sub.planId!,
    razorpaySubscriptionId,
    billingCycle: sub.billingCycle as 'MONTHLY' | 'YEARLY',
    amount: sub.amount || 0,
    currency: sub.currency,
    currentPeriodStart: now,
    currentPeriodEnd: periodEnd,
  })

  // 4. Record payment
  await db.payment.create({
    data: {
      subscriptionId: activated.id,
      organizationId: tenantId,
      razorpayPaymentId,
      amount: sub.amount || 0,
      currency: sub.currency,
      status: 'captured',
    },
  })

  await createBillingAuditLog({
    organizationId: tenantId,
    action: BILLING_AUDIT_ACTIONS.PAYMENT_SUCCEEDED,
    entityType: 'Payment',
    entityId: razorpayPaymentId,
    newState: { amount: sub.amount, currency: sub.currency, plan: sub.plan?.slug },
  })

  logger.info({ tenantId, razorpayPaymentId }, 'Checkout verified and subscription activated')

  return { success: true, subscriptionId: activated.id }
}
