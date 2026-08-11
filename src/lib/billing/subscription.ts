// ─────────────────────────────────────────────
// Subscription Lifecycle Service
// ─────────────────────────────────────────────

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { createBillingAuditLog } from './audit'
import { invalidateEntitlementCache } from './entitlements'
import { resetScanCounter } from './usage'
import { BILLING_EVENTS, BILLING_AUDIT_ACTIONS, BILLING_CONFIG } from './constants'
import type { Subscription, Plan } from '@prisma/client'

type SubscriptionWithPlan = Subscription & { plan: Plan | null }

// ── Queries ─────────────────────────────────

/** Get the active subscription for a tenant, including plan and entitlements */
export async function getActiveSubscription(tenantId: string) {
  return db.subscription.findUnique({
    where: { organizationId: tenantId },
    include: {
      plan: { include: { entitlements: true } },
      nextPlan: true,
    },
  })
}

// ── Create Free Subscription ────────────────

/** Auto-assign the FREE plan to a tenant */
export async function createFreeSubscription(tenantId: string): Promise<Subscription> {
  const freePlan = await db.plan.findFirst({
    where: { isFree: true, isActive: true },
  })

  if (!freePlan) {
    throw new Error('No active free plan found. Run the billing seed script.')
  }

  const existing = await db.subscription.findUnique({
    where: { organizationId: tenantId },
  })

  if (existing) {
    logger.info({ tenantId }, 'Subscription already exists, skipping free plan creation')
    return existing
  }

  const sub = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        organizationId: tenantId,
        planId: freePlan.id,
        status: 'ACTIVE',
        currency: freePlan.currency,
        currentPeriodStart: new Date(),
      },
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: BILLING_EVENTS.SUBSCRIPTION_CREATED,
        newState: { plan: freePlan.slug, status: 'ACTIVE' },
      },
    })

    return subscription
  })

  logger.info({ tenantId, planId: freePlan.id }, 'Free subscription created')
  return sub
}

// ── Activation ──────────────────────────────

/** Activate a subscription after successful payment verification */
export async function activateSubscription(
  tenantId: string,
  {
    planId,
    razorpaySubscriptionId,
    razorpayCustomerId,
    billingCycle,
    amount,
    currency,
    currentPeriodStart,
    currentPeriodEnd,
  }: {
    planId: string
    razorpaySubscriptionId: string
    razorpayCustomerId?: string
    billingCycle: 'MONTHLY' | 'YEARLY'
    amount: number
    currency: string
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
  }
): Promise<Subscription> {
  const now = new Date()

  const sub = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.upsert({
      where: { organizationId: tenantId },
      update: {
        planId,
        razorpaySubscriptionId,
        razorpayCustomerId,
        status: 'ACTIVE',
        billingCycle,
        amount,
        currency,
        currentPeriodStart: currentPeriodStart || now,
        currentPeriodEnd: currentPeriodEnd || null,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        endedAt: null,
        nextPlanId: null,
      },
      create: {
        organizationId: tenantId,
        planId,
        razorpaySubscriptionId,
        razorpayCustomerId,
        status: 'ACTIVE',
        billingCycle,
        amount,
        currency,
        currentPeriodStart: currentPeriodStart || now,
        currentPeriodEnd: currentPeriodEnd || null,
      },
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: BILLING_EVENTS.SUBSCRIPTION_ACTIVATED,
        newState: { planId, status: 'ACTIVE', billingCycle },
      },
    })

    return subscription
  })

  await invalidateEntitlementCache(tenantId)
  logger.info({ tenantId, planId, billingCycle }, 'Subscription activated')
  return sub
}

// ── Renewal ─────────────────────────────────

/** Handle successful subscription charge (renewal) */
export async function renewSubscription(
  razorpaySubscriptionId: string,
  {
    currentPeriodStart,
    currentPeriodEnd,
  }: {
    currentPeriodStart: Date
    currentPeriodEnd: Date
  }
): Promise<Subscription | null> {
  const sub = await db.subscription.findUnique({
    where: { razorpaySubscriptionId },
    include: { plan: true },
  })

  if (!sub) {
    logger.warn({ razorpaySubscriptionId }, 'Subscription not found for renewal')
    return null
  }

  // If a downgrade is pending, execute it at renewal
  if (sub.nextPlanId) {
    return executeScheduledPlanChange(sub, currentPeriodStart, currentPeriodEnd)
  }

  const updated = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({
      where: { id: sub.id },
      data: {
        status: 'ACTIVE',
        currentPeriodStart,
        currentPeriodEnd,
      },
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        eventType: BILLING_EVENTS.SUBSCRIPTION_RENEWED,
        newState: { currentPeriodStart, currentPeriodEnd },
      },
    })

    return subscription
  })

  // Reset monthly scan counter for the new period
  await resetScanCounter(sub.organizationId)
  await invalidateEntitlementCache(sub.organizationId)

  logger.info({ subscriptionId: sub.id }, 'Subscription renewed')
  return updated
}

// ── Payment Failure ─────────────────────────

/** Handle failed payment — move to PAST_DUE */
export async function handlePaymentFailure(
  razorpaySubscriptionId: string
): Promise<Subscription | null> {
  const sub = await db.subscription.findUnique({
    where: { razorpaySubscriptionId },
  })
  if (!sub) return null

  const updated = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({
      where: { id: sub.id },
      data: { status: 'PAST_DUE' },
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        eventType: BILLING_EVENTS.PAYMENT_FAILED,
        previousState: { status: sub.status },
        newState: { status: 'PAST_DUE' },
      },
    })

    return subscription
  })

  await invalidateEntitlementCache(sub.organizationId)
  logger.warn({ subscriptionId: sub.id }, 'Subscription moved to PAST_DUE')
  return updated
}

// ── Cancel ──────────────────────────────────

/** Cancel subscription — at period end (default) or immediately */
export async function cancelSubscription(
  tenantId: string,
  { immediate = false, actorId }: { immediate?: boolean; actorId?: string } = {}
): Promise<Subscription> {
  const sub = await db.subscription.findUnique({
    where: { organizationId: tenantId },
  })

  if (!sub) throw new Error('No subscription found')

  const now = new Date()

  const updated = await db.$transaction(async (tx) => {
    const data: any = {
      canceledAt: now,
    }

    if (immediate) {
      data.status = 'CANCELED'
      data.endedAt = now
    } else {
      data.cancelAtPeriodEnd = true
    }

    const subscription = await tx.subscription.update({
      where: { id: sub.id },
      data,
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        eventType: immediate
          ? BILLING_EVENTS.SUBSCRIPTION_CANCELLED
          : BILLING_EVENTS.CANCELLATION_REQUESTED,
        previousState: { status: sub.status },
        newState: { status: subscription.status, cancelAtPeriodEnd: subscription.cancelAtPeriodEnd },
      },
    })

    return subscription
  })

  await createBillingAuditLog({
    actorId,
    organizationId: tenantId,
    action: BILLING_AUDIT_ACTIONS.SUBSCRIPTION_CANCELLED,
    entityType: 'Subscription',
    entityId: sub.id,
    previousState: { status: sub.status },
    newState: { status: updated.status, cancelAtPeriodEnd: updated.cancelAtPeriodEnd },
  })

  if (immediate) {
    await invalidateEntitlementCache(tenantId)
  }

  logger.info({ tenantId, immediate }, 'Subscription cancelled')
  return updated
}

// ── Resume ──────────────────────────────────

/** Resume a subscription that was scheduled for cancellation */
export async function resumeSubscription(
  tenantId: string,
  actorId?: string
): Promise<Subscription> {
  const sub = await db.subscription.findUnique({
    where: { organizationId: tenantId },
  })

  if (!sub) throw new Error('No subscription found')
  if (!sub.cancelAtPeriodEnd) throw new Error('Subscription is not scheduled for cancellation')

  const updated = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({
      where: { id: sub.id },
      data: {
        cancelAtPeriodEnd: false,
        canceledAt: null,
      },
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        eventType: BILLING_EVENTS.SUBSCRIPTION_RESUMED,
        newState: { cancelAtPeriodEnd: false },
      },
    })

    return subscription
  })

  await createBillingAuditLog({
    actorId,
    organizationId: tenantId,
    action: BILLING_AUDIT_ACTIONS.SUBSCRIPTION_RESUMED,
    entityType: 'Subscription',
    entityId: sub.id,
  })

  logger.info({ tenantId }, 'Subscription resumed')
  return updated
}

// ── Upgrade ─────────────────────────────────

/** Upgrade to a higher plan — takes effect immediately after payment */
export async function upgradeSubscription(
  tenantId: string,
  {
    planId,
    razorpaySubscriptionId,
    billingCycle,
    amount,
    currency,
    currentPeriodStart,
    currentPeriodEnd,
    actorId,
  }: {
    planId: string
    razorpaySubscriptionId: string
    billingCycle: 'MONTHLY' | 'YEARLY'
    amount: number
    currency: string
    currentPeriodStart?: Date
    currentPeriodEnd?: Date
    actorId?: string
  }
): Promise<Subscription> {
  const sub = await db.subscription.findUnique({
    where: { organizationId: tenantId },
    include: { plan: true },
  })

  const previousPlan = sub?.plan?.slug || 'unknown'

  const updated = await activateSubscription(tenantId, {
    planId,
    razorpaySubscriptionId,
    billingCycle,
    amount,
    currency,
    currentPeriodStart,
    currentPeriodEnd,
  })

  await createBillingAuditLog({
    actorId,
    organizationId: tenantId,
    action: BILLING_AUDIT_ACTIONS.SUBSCRIPTION_UPGRADED,
    entityType: 'Subscription',
    entityId: updated.id,
    previousState: { plan: previousPlan },
    newState: { planId, billingCycle },
  })

  return updated
}

// ── Downgrade ───────────────────────────────

/** Schedule a downgrade — takes effect at end of current billing period */
export async function scheduleDowngrade(
  tenantId: string,
  targetPlanId: string,
  actorId?: string
): Promise<Subscription> {
  const sub = await db.subscription.findUnique({
    where: { organizationId: tenantId },
    include: { plan: true },
  })

  if (!sub) throw new Error('No subscription found')

  const updated = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({
      where: { id: sub.id },
      data: { nextPlanId: targetPlanId },
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        eventType: BILLING_EVENTS.PLAN_DOWNGRADED,
        previousState: { planId: sub.planId },
        newState: { nextPlanId: targetPlanId },
        metadata: { effectiveAt: sub.currentPeriodEnd },
      },
    })

    return subscription
  })

  await createBillingAuditLog({
    actorId,
    organizationId: tenantId,
    action: BILLING_AUDIT_ACTIONS.SUBSCRIPTION_DOWNGRADED,
    entityType: 'Subscription',
    entityId: sub.id,
    previousState: { planId: sub.planId },
    newState: { nextPlanId: targetPlanId, effectiveAt: sub.currentPeriodEnd },
  })

  logger.info({ tenantId, targetPlanId }, 'Downgrade scheduled')
  return updated
}

// ── Trial ───────────────────────────────────

/** Check if a tenant has already used a trial (any plan) */
export async function hasUsedTrial(tenantId: string, planId?: string): Promise<boolean> {
  const sub = await db.subscription.findUnique({
    where: { organizationId: tenantId },
  })
  if (!sub) return false

  // Check for any past TRIAL_STARTED event for this tenant
  const query: any = {
    subscriptionId: sub.id,
    eventType: BILLING_EVENTS.TRIAL_STARTED,
  }

  // If a specific planId is provided, check for that plan only
  if (planId) {
    // We store planId in the newState metadata
    const events = await db.subscriptionEvent.findMany({
      where: query,
    })
    return events.some((e: any) => {
      const state = e.newState as any
      return state?.planId === planId
    })
  }

  const count = await db.subscriptionEvent.count({ where: query })
  return count > 0
}

/** Get trial eligibility for all available plans */
export async function getTrialEligibility(tenantId: string) {
  const plans = await db.plan.findMany({
    where: { isActive: true, isFree: false, trialDays: { gt: 0 } },
    select: { id: true, slug: true, name: true, trialDays: true },
  })

  const sub = await db.subscription.findUnique({
    where: { organizationId: tenantId },
    include: { plan: true },
  })

  // Can't trial if already on a paid plan or already trialing
  const isOnPaidPlan = sub && !sub.plan?.isFree && ['ACTIVE', 'TRIALING'].includes(sub.status)

  const results = await Promise.all(
    plans.map(async (plan) => {
      const used = await hasUsedTrial(tenantId, plan.id)
      return {
        planId: plan.id,
        planSlug: plan.slug,
        planName: plan.name,
        trialDays: plan.trialDays,
        canTrial: !used && !isOnPaidPlan,
        reason: used
          ? 'Trial already used for this plan'
          : isOnPaidPlan
            ? 'Already on a paid or trialing subscription'
            : null,
      }
    })
  )

  return results
}

/** Start a trial subscription for a paid plan */
export async function startTrial(
  tenantId: string,
  planId: string
): Promise<Subscription> {
  // 1. Validate plan exists and has trial
  const plan = await db.plan.findUnique({
    where: { id: planId },
    include: { entitlements: true },
  })

  if (!plan || !plan.isActive) {
    const { BillingError } = await import('./billing-errors')
    throw new BillingError({ code: 'INVALID_PLAN', message: 'Plan not found or inactive.' }, 400)
  }

  if (plan.isFree) {
    const { BillingError } = await import('./billing-errors')
    throw new BillingError({ code: 'INVALID_PLAN', message: 'Free plans do not have trials.' }, 400)
  }

  if (!plan.trialDays || plan.trialDays <= 0) {
    const { TrialNotAvailableError } = await import('./billing-errors')
    throw new TrialNotAvailableError('This plan does not offer a free trial.')
  }

  // 2. Check existing subscription
  const existing = await db.subscription.findUnique({
    where: { organizationId: tenantId },
    include: { plan: true },
  })

  if (existing && !existing.plan?.isFree && ['ACTIVE', 'TRIALING'].includes(existing.status)) {
    const { TrialNotAvailableError } = await import('./billing-errors')
    throw new TrialNotAvailableError(
      existing.status === 'TRIALING'
        ? 'You are already on a trial. Upgrade or wait for it to end.'
        : 'You already have an active paid subscription.'
    )
  }

  // 3. Check if trial already used for this plan
  const alreadyUsed = await hasUsedTrial(tenantId, planId)
  if (alreadyUsed) {
    const { BillingError } = await import('./billing-errors')
    throw new BillingError(
      {
        code: 'TRIAL_ALREADY_USED',
        message: `You have already used your free trial for the ${plan.name} plan.`,
      },
      400
    )
  }

  // 4. Create the trial subscription
  const now = new Date()
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + plan.trialDays)

  const sub = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.upsert({
      where: { organizationId: tenantId },
      update: {
        planId: plan.id,
        status: 'TRIALING',
        trialStart: now,
        trialEnd,
        billingCycle: null,
        amount: 0,
        currency: plan.currency,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        endedAt: null,
        nextPlanId: null,
        razorpaySubscriptionId: null,
      },
      create: {
        organizationId: tenantId,
        planId: plan.id,
        status: 'TRIALING',
        trialStart: now,
        trialEnd,
        currency: plan.currency,
        currentPeriodStart: now,
        currentPeriodEnd: trialEnd,
      },
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        eventType: BILLING_EVENTS.TRIAL_STARTED,
        newState: {
          planId: plan.id,
          planSlug: plan.slug,
          status: 'TRIALING',
          trialDays: plan.trialDays,
          trialEnd: trialEnd.toISOString(),
        },
      },
    })

    return subscription
  })

  await invalidateEntitlementCache(tenantId)

  await createBillingAuditLog({
    organizationId: tenantId,
    action: 'TRIAL_STARTED',
    entityType: 'Subscription',
    entityId: sub.id,
    newState: {
      planId: plan.id,
      planSlug: plan.slug,
      trialDays: plan.trialDays,
      trialEnd: trialEnd.toISOString(),
    },
  })

  logger.info(
    { tenantId, planId, planSlug: plan.slug, trialDays: plan.trialDays, trialEnd },
    'Trial started'
  )

  return sub
}

/** Check and expire trial subscriptions (called by cron) */
export async function checkTrialExpirations(): Promise<number> {
  const now = new Date()
  const expiredTrials = await db.subscription.findMany({
    where: {
      status: 'TRIALING',
      trialEnd: { lte: now },
    },
  })

  let processed = 0
  for (const sub of expiredTrials) {
    try {
      // If no payment method was added, downgrade to free
      const freePlan = await db.plan.findFirst({
        where: { isFree: true, isActive: true },
      })

      if (freePlan) {
        await db.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'ACTIVE',
              planId: freePlan.id,
              trialEnd: null,
              amount: 0,
            },
          })

          await tx.subscriptionEvent.create({
            data: {
              subscriptionId: sub.id,
              eventType: BILLING_EVENTS.SUBSCRIPTION_EXPIRED,
              previousState: { status: 'TRIALING' },
              newState: { status: 'ACTIVE', plan: freePlan.slug },
              metadata: { reason: 'trial_expired' },
            },
          })
        })

        await invalidateEntitlementCache(sub.organizationId)
        processed++
      }
    } catch (err) {
      logger.error({ err, subscriptionId: sub.id }, 'Failed to process trial expiration')
    }
  }

  logger.info({ processed }, 'Trial expiration check completed')
  return processed
}

/** Check and enforce grace period expiration (called by cron) */
export async function checkGracePeriodExpirations(): Promise<number> {
  const graceDays = BILLING_CONFIG.GRACE_PERIOD_DAYS
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - graceDays)

  const expiredGrace = await db.subscription.findMany({
    where: {
      status: 'PAST_DUE',
      updatedAt: { lte: cutoff },
    },
  })

  let processed = 0
  for (const sub of expiredGrace) {
    try {
      const freePlan = await db.plan.findFirst({
        where: { isFree: true, isActive: true },
      })

      if (freePlan) {
        await db.$transaction(async (tx) => {
          await tx.subscription.update({
            where: { id: sub.id },
            data: {
              planId: freePlan.id,
              status: 'ACTIVE',
              amount: 0,
              razorpaySubscriptionId: null,
              cancelAtPeriodEnd: false,
              nextPlanId: null,
            },
          })

          await tx.subscriptionEvent.create({
            data: {
              subscriptionId: sub.id,
              eventType: BILLING_EVENTS.SUBSCRIPTION_EXPIRED,
              previousState: { status: 'PAST_DUE' },
              newState: { status: 'ACTIVE', plan: freePlan.slug },
              metadata: { reason: 'grace_period_expired' },
            },
          })
        })

        await invalidateEntitlementCache(sub.organizationId)
        processed++
      }
    } catch (err) {
      logger.error({ err, subscriptionId: sub.id }, 'Failed to process grace period expiration')
    }
  }

  logger.info({ processed }, 'Grace period expiration check completed')
  return processed
}

// ── Internal ────────────────────────────────

async function executeScheduledPlanChange(
  sub: SubscriptionWithPlan,
  periodStart: Date,
  periodEnd: Date
): Promise<Subscription> {
  const newPlan = await db.plan.findUnique({ where: { id: sub.nextPlanId! } })
  if (!newPlan) {
    logger.error({ subscriptionId: sub.id, nextPlanId: sub.nextPlanId }, 'Next plan not found')
    // Clear the invalid nextPlanId and just renew normally
    return db.subscription.update({
      where: { id: sub.id },
      data: { nextPlanId: null, currentPeriodStart: periodStart, currentPeriodEnd: periodEnd },
    })
  }

  const updated = await db.$transaction(async (tx) => {
    const subscription = await tx.subscription.update({
      where: { id: sub.id },
      data: {
        planId: newPlan.id,
        nextPlanId: null,
        amount: sub.billingCycle === 'YEARLY' ? newPlan.yearlyPrice : newPlan.monthlyPrice,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        status: newPlan.isFree ? 'ACTIVE' : 'ACTIVE',
      },
    })

    await tx.subscriptionEvent.create({
      data: {
        subscriptionId: sub.id,
        eventType: BILLING_EVENTS.PLAN_DOWNGRADED,
        previousState: { planId: sub.planId },
        newState: { planId: newPlan.id },
        metadata: { executedAt: new Date() },
      },
    })

    return subscription
  })

  await resetScanCounter(sub.organizationId)
  await invalidateEntitlementCache(sub.organizationId)

  logger.info({ subscriptionId: sub.id, newPlanId: newPlan.id }, 'Scheduled plan change executed')
  return updated
}
