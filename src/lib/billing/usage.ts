// ─────────────────────────────────────────────
// Usage Tracking Service
// ─────────────────────────────────────────────
// Atomic counters backed by Redis for hot path (scans)
// and PostgreSQL for persistence and dashboard queries.

import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { METRIC_TO_ENTITLEMENT, BILLING_CONFIG, type UsageMetric } from './constants'
import { getLimit } from './entitlements'
import { PlanLimitReachedError } from './billing-errors'

export interface UsageCheckResult {
  allowed: boolean
  usage: number
  limit: number
  remaining: number
  isUnlimited: boolean
  code?: string
}

export interface UsageSummaryItem {
  metric: string
  usage: number
  limit: number
  remaining: number
  isUnlimited: boolean
  percentUsed: number
}

const REDIS_USAGE_PREFIX = 'billing:usage:'

// ── Check / Consume ─────────────────────────

/** Check whether a tenant can consume `quantity` of a metric */
export async function canConsume(
  tenantId: string,
  metric: UsageMetric,
  quantity: number = 1
): Promise<UsageCheckResult> {
  const entitlementKey = METRIC_TO_ENTITLEMENT[metric]
  const { limit, isUnlimited } = await getLimit(tenantId, entitlementKey)

  if (isUnlimited) {
    const usage = await getCurrentUsage(tenantId, metric)
    return { allowed: true, usage, limit: Infinity, remaining: Infinity, isUnlimited: true }
  }

  const usage = await getCurrentUsage(tenantId, metric)
  const remaining = Math.max(0, limit - usage)
  const allowed = usage + quantity <= limit

  return {
    allowed,
    usage,
    limit,
    remaining,
    isUnlimited: false,
    code: allowed ? undefined : 'PLAN_LIMIT_REACHED',
  }
}

/** Throw if capacity is not available */
export async function requireCapacity(
  tenantId: string,
  metric: UsageMetric,
  quantity: number = 1,
  recommendedPlan?: string
): Promise<void> {
  const result = await canConsume(tenantId, metric, quantity)
  if (!result.allowed) {
    throw new PlanLimitReachedError(
      METRIC_TO_ENTITLEMENT[metric],
      result.usage,
      result.limit,
      recommendedPlan
    )
  }
}

// ── Usage Reading ───────────────────────────

/** Get current usage for a metric.
 *  - QR_CODE / TEAM_MEMBER → live COUNT from DB
 *  - MONTHLY_SCAN → Redis atomic counter (fast path) or DB fallback
 */
export async function getCurrentUsage(
  tenantId: string,
  metric: UsageMetric
): Promise<number> {
  switch (metric) {
    case 'QR_CODE':
      return db.qRCode.count({
        where: { organizationId: tenantId, isInTrash: false },
      })

    case 'TEAM_MEMBER':
      return db.member.count({
        where: { organizationId: tenantId },
      })

    case 'MONTHLY_SCAN': {
      // Try Redis counter first
      const redisKey = getScanCounterKey(tenantId)
      try {
        const redisVal = await redis.get<number>(redisKey)
        if (redisVal !== null && redisVal !== undefined) return redisVal
      } catch {
        // fallback to DB
      }
      // DB fallback: count from UsageCounter for current period
      const now = new Date()
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const counter = await db.usageCounter.findFirst({
        where: {
          organizationId: tenantId,
          metric: 'MONTHLY_SCAN',
          periodStart: { lte: now },
          periodEnd: { gt: now },
        },
      })
      return counter?.usage ?? 0
    }

    default:
      return 0
  }
}

/** Get usage summary for all metrics (for the dashboard) */
export async function getUsageSummary(tenantId: string): Promise<UsageSummaryItem[]> {
  const metrics: UsageMetric[] = ['QR_CODE', 'MONTHLY_SCAN', 'TEAM_MEMBER']
  const results: UsageSummaryItem[] = []

  for (const metric of metrics) {
    const entitlementKey = METRIC_TO_ENTITLEMENT[metric]
    const { limit, isUnlimited } = await getLimit(tenantId, entitlementKey)
    const usage = await getCurrentUsage(tenantId, metric)
    const remaining = isUnlimited ? Infinity : Math.max(0, limit - usage)
    const percentUsed = isUnlimited ? 0 : limit > 0 ? Math.round((usage / limit) * 100) : 0

    results.push({
      metric,
      usage,
      limit: isUnlimited ? -1 : limit,
      remaining: isUnlimited ? -1 : remaining,
      isUnlimited,
      percentUsed,
    })
  }

  return results
}

// ── Increment / Track ───────────────────────

/** Increment scan counter atomically in Redis */
export async function incrementScanCounter(tenantId: string, quantity: number = 1): Promise<number> {
  const redisKey = getScanCounterKey(tenantId)
  try {
    const newVal = await redis.incrby(redisKey, quantity)
    // Set TTL to end of current month + 1 day buffer if not already set
    const ttl = await redis.ttl(redisKey)
    if (ttl < 0) {
      const now = new Date()
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      const secondsLeft = Math.ceil((endOfMonth.getTime() - now.getTime()) / 1000) + 86400
      await redis.expire(redisKey, secondsLeft)
    }
    return newVal
  } catch {
    // Redis unavailable — log and use DB-only path
    logger.warn({ tenantId }, 'Redis unavailable for scan counter, falling back to DB')
    return incrementScanCounterDB(tenantId, quantity)
  }
}

/** Flush Redis scan counter to PostgreSQL UsageCounter (called by cron) */
export async function flushScanCountersToDB(): Promise<number> {
  let flushed = 0
  try {
    // Scan for all counter keys
    const pattern = `${REDIS_USAGE_PREFIX}scan:*`
    const keys: string[] = []

    // Upstash doesn't support SCAN; use a known-tenant approach
    // Instead, we'll iterate through active subscriptions
    const activeSubs = await db.subscription.findMany({
      where: { status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] } },
      select: { organizationId: true },
    })

    const now = new Date()
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    for (const sub of activeSubs) {
      const redisKey = getScanCounterKey(sub.organizationId)
      try {
        const val = await redis.get<number>(redisKey)
        if (val === null || val === undefined) continue

        await db.usageCounter.upsert({
          where: {
            organizationId_metric_periodStart_periodEnd: {
              organizationId: sub.organizationId,
              metric: 'MONTHLY_SCAN',
              periodStart,
              periodEnd,
            },
          },
          update: { usage: val },
          create: {
            organizationId: sub.organizationId,
            metric: 'MONTHLY_SCAN',
            periodStart,
            periodEnd,
            usage: val,
            limitSnapshot: 0,
          },
        })
        flushed++
      } catch (err) {
        logger.error({ err, tenantId: sub.organizationId }, 'Failed to flush scan counter')
      }
    }
  } catch (err) {
    logger.error({ err }, 'Failed to flush scan counters')
  }
  return flushed
}

/** Reset scan counter for a tenant (called on billing period renewal) */
export async function resetScanCounter(tenantId: string): Promise<void> {
  const redisKey = getScanCounterKey(tenantId)
  try {
    await redis.del(redisKey)
  } catch {
    // Redis unavailable
  }
}

// ── Internal helpers ────────────────────────

function getScanCounterKey(tenantId: string): string {
  const now = new Date()
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return `${REDIS_USAGE_PREFIX}scan:${tenantId}:${period}`
}

async function incrementScanCounterDB(tenantId: string, quantity: number): Promise<number> {
  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const counter = await db.usageCounter.upsert({
    where: {
      organizationId_metric_periodStart_periodEnd: {
        organizationId: tenantId,
        metric: 'MONTHLY_SCAN',
        periodStart,
        periodEnd,
      },
    },
    update: { usage: { increment: quantity } },
    create: {
      organizationId: tenantId,
      metric: 'MONTHLY_SCAN',
      periodStart,
      periodEnd,
      usage: quantity,
      limitSnapshot: 0,
    },
  })
  return counter.usage
}
