// ─────────────────────────────────────────────
// Entitlement Service
// ─────────────────────────────────────────────
// Centralised feature & limit checking.
// All protected operations must go through this service.

import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import {
  ENTITLEMENT_KEYS,
  BILLING_CONFIG,
  type EntitlementKey,
} from './constants'
import {
  FeatureNotAvailableError,
  PlanLimitReachedError,
  SubscriptionRequiredError,
} from './billing-errors'
import type { PlanEntitlement } from '@prisma/client'

interface EntitlementResult {
  key: string
  available: boolean
  valueType: 'BOOLEAN' | 'NUMERIC' | 'UNLIMITED'
  numericValue: number | null
  booleanValue: boolean | null
  isUnlimited: boolean
}

const CACHE_PREFIX = 'billing:entitlements:'

// ── Core Entitlement Lookups ────────────────

/** Get all entitlements for a tenant based on their active subscription's plan */
export async function getEntitlements(tenantId: string): Promise<EntitlementResult[]> {
  // Try cache first
  const cacheKey = `${CACHE_PREFIX}${tenantId}`
  try {
    const cached = await redis.get<EntitlementResult[]>(cacheKey)
    if (cached) return cached
  } catch {
    // Redis unavailable — continue without cache
  }

  let subscription = await db.subscription.findUnique({
    where: { organizationId: tenantId },
    include: {
      plan: { include: { entitlements: true } },
    },
  })

  if (!subscription || !subscription.plan || subscription.plan.isFree || subscription.plan.slug === 'free') {
    try {
      const { createTrialSubscription } = await import('@/lib/billing/subscription')
      await createTrialSubscription(tenantId)
      subscription = await db.subscription.findUnique({
        where: { organizationId: tenantId },
        include: {
          plan: { include: { entitlements: true } },
        },
      })
    } catch {
      // Fallback if DB write fails
    }
  }

  if (!subscription || !subscription.plan) {
    return []
  }

  // Only active/trialing subscriptions grant entitlements
  const activeStatuses = ['ACTIVE', 'TRIALING', 'PAST_DUE']
  if (!activeStatuses.includes(subscription.status)) {
    return []
  }

  const results = subscription.plan.entitlements.map(mapEntitlement)

  // Cache
  try {
    await redis.set(cacheKey, results, { ex: BILLING_CONFIG.ENTITLEMENT_CACHE_TTL_SECONDS })
  } catch {
    // Redis unavailable
  }

  return results
}

/** Get a single entitlement */
export async function getEntitlement(
  tenantId: string,
  key: EntitlementKey
): Promise<EntitlementResult | null> {
  const all = await getEntitlements(tenantId)
  return all.find((e) => e.key === key) || null
}

/** Check if a boolean feature is available */
export async function hasFeature(tenantId: string, key: EntitlementKey): Promise<boolean> {
  const ent = await getEntitlement(tenantId, key)
  if (!ent) return false
  if (ent.isUnlimited) return true
  if (ent.valueType === 'BOOLEAN') return ent.booleanValue === true
  if (ent.valueType === 'NUMERIC') return (ent.numericValue ?? 0) > 0
  return false
}

/** Get the numeric limit for a metered entitlement */
export async function getLimit(
  tenantId: string,
  key: EntitlementKey
): Promise<{ limit: number; isUnlimited: boolean }> {
  const ent = await getEntitlement(tenantId, key)
  if (!ent) return { limit: 0, isUnlimited: false }
  if (ent.isUnlimited) return { limit: Infinity, isUnlimited: true }
  return { limit: ent.numericValue ?? 0, isUnlimited: false }
}

// ── Guard Functions ─────────────────────────

/** Throw if the feature is unavailable on the tenant's plan */
export async function requireFeature(
  tenantId: string,
  key: EntitlementKey,
  recommendedPlan?: string
): Promise<void> {
  const available = await hasFeature(tenantId, key)
  if (!available) {
    throw new FeatureNotAvailableError(key, recommendedPlan)
  }
}

/** Throw if the tenant cannot consume `quantity` more units of a metered entitlement */
export async function requireCapacity(
  tenantId: string,
  key: EntitlementKey,
  currentUsage: number,
  quantity: number = 1,
  recommendedPlan?: string
): Promise<void> {
  const { limit, isUnlimited } = await getLimit(tenantId, key)
  if (isUnlimited) return
  if (currentUsage + quantity > limit) {
    throw new PlanLimitReachedError(key, currentUsage, limit, recommendedPlan)
  }
}

/** Throw if tenant has no active subscription at all */
export async function requireActiveSubscription(tenantId: string): Promise<void> {
  const sub = await db.subscription.findUnique({
    where: { organizationId: tenantId },
  })
  if (!sub || !['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(sub.status)) {
    throw new SubscriptionRequiredError()
  }
}

// ── Cache Invalidation ──────────────────────

/** Invalidate cached entitlements for a tenant. Call after plan/subscription changes. */
export async function invalidateEntitlementCache(tenantId: string): Promise<void> {
  try {
    await redis.del(`${CACHE_PREFIX}${tenantId}`)
  } catch {
    // Redis unavailable
  }
}

// ── Helpers ─────────────────────────────────

function mapEntitlement(pe: PlanEntitlement): EntitlementResult {
  return {
    key: pe.entitlementKey,
    available:
      pe.valueType === 'UNLIMITED'
        ? true
        : pe.valueType === 'BOOLEAN'
          ? pe.booleanValue === true
          : (pe.numericValue ?? 0) > 0,
    valueType: pe.valueType as 'BOOLEAN' | 'NUMERIC' | 'UNLIMITED',
    numericValue: pe.numericValue,
    booleanValue: pe.booleanValue,
    isUnlimited: pe.valueType === 'UNLIMITED',
  }
}
