// ─────────────────────────────────────────────
// Plan Service
// ─────────────────────────────────────────────

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { createBillingAuditLog } from './audit'
import { BILLING_AUDIT_ACTIONS } from './constants'
import type { Plan, PlanEntitlement } from '@prisma/client'

export type PlanWithEntitlements = Plan & { entitlements: PlanEntitlement[] }

/** Get all active plans ordered by sortOrder, with entitlements */
export async function getActivePlans(): Promise<PlanWithEntitlements[]> {
  return db.plan.findMany({
    where: { isActive: true },
    include: { entitlements: true },
    orderBy: { sortOrder: 'asc' },
  })
}

/** Get all plans (including inactive) for admin */
export async function getAllPlans(): Promise<PlanWithEntitlements[]> {
  return db.plan.findMany({
    include: { entitlements: true },
    orderBy: { sortOrder: 'asc' },
  })
}

/** Get a single plan by slug */
export async function getPlanBySlug(slug: string): Promise<PlanWithEntitlements | null> {
  return db.plan.findUnique({
    where: { slug },
    include: { entitlements: true },
  })
}

/** Get a single plan by ID */
export async function getPlanById(id: string): Promise<PlanWithEntitlements | null> {
  return db.plan.findUnique({
    where: { id },
    include: { entitlements: true },
  })
}

/** Get the free plan */
export async function getFreePlan(): Promise<PlanWithEntitlements | null> {
  return db.plan.findFirst({
    where: { isFree: true, isActive: true },
    include: { entitlements: true },
  })
}

/** Create a new plan (admin) */
export async function createPlan({
  name,
  slug,
  description,
  monthlyPrice,
  yearlyPrice,
  currency,
  trialDays,
  isFree,
  isRecommended,
  sortOrder,
  marketingFeatures,
  entitlements,
  actorId,
}: {
  name: string
  slug: string
  description?: string
  monthlyPrice: number
  yearlyPrice: number
  currency?: string
  trialDays?: number
  isFree?: boolean
  isRecommended?: boolean
  sortOrder?: number
  marketingFeatures?: any
  entitlements?: Array<{
    entitlementKey: string
    valueType: 'BOOLEAN' | 'NUMERIC' | 'UNLIMITED'
    numericValue?: number
    booleanValue?: boolean
  }>
  actorId?: string
}): Promise<PlanWithEntitlements> {
  const plan = await db.plan.create({
    data: {
      name,
      slug,
      description,
      monthlyPrice,
      yearlyPrice,
      currency: currency || 'INR',
      trialDays: trialDays || 0,
      isFree: isFree || false,
      isRecommended: isRecommended || false,
      sortOrder: sortOrder || 0,
      marketingFeatures: marketingFeatures ?? undefined,
      entitlements: entitlements
        ? {
            create: entitlements.map((e) => ({
              entitlementKey: e.entitlementKey,
              valueType: e.valueType,
              numericValue: e.numericValue,
              booleanValue: e.booleanValue,
            })),
          }
        : undefined,
    },
    include: { entitlements: true },
  })

  logger.info({ planId: plan.id, slug }, 'Plan created')

  await createBillingAuditLog({
    actorId,
    organizationId: 'system',
    action: BILLING_AUDIT_ACTIONS.PLAN_CREATED,
    entityType: 'Plan',
    entityId: plan.id,
    newState: { name, slug, monthlyPrice, yearlyPrice },
  })

  return plan
}

/** Update an existing plan (admin) */
export async function updatePlan(
  id: string,
  data: {
    name?: string
    description?: string
    monthlyPrice?: number
    yearlyPrice?: number
    trialDays?: number
    isActive?: boolean
    isRecommended?: boolean
    sortOrder?: number
    marketingFeatures?: any
    razorpayPlanIdMonthly?: string
    razorpayPlanIdYearly?: string
  },
  actorId?: string
): Promise<PlanWithEntitlements> {
  const previous = await db.plan.findUnique({ where: { id } })

  const plan = await db.plan.update({
    where: { id },
    data,
    include: { entitlements: true },
  })

  await createBillingAuditLog({
    actorId,
    organizationId: 'system',
    action: previous?.isActive && data.isActive === false
      ? BILLING_AUDIT_ACTIONS.PLAN_DEACTIVATED
      : BILLING_AUDIT_ACTIONS.PLAN_UPDATED,
    entityType: 'Plan',
    entityId: id,
    previousState: previous ? { name: previous.name, monthlyPrice: previous.monthlyPrice, isActive: previous.isActive } : undefined,
    newState: data,
  })

  return plan
}

/** Update entitlements for a plan (admin) — replaces all entitlements */
export async function updatePlanEntitlements(
  planId: string,
  entitlements: Array<{
    entitlementKey: string
    valueType: 'BOOLEAN' | 'NUMERIC' | 'UNLIMITED'
    numericValue?: number
    booleanValue?: boolean
  }>
) {
  await db.$transaction([
    db.planEntitlement.deleteMany({ where: { planId } }),
    ...entitlements.map((e) =>
      db.planEntitlement.create({
        data: {
          planId,
          entitlementKey: e.entitlementKey,
          valueType: e.valueType,
          numericValue: e.numericValue,
          booleanValue: e.booleanValue,
        },
      })
    ),
  ])

  return db.plan.findUnique({
    where: { id: planId },
    include: { entitlements: true },
  })
}

/** Deactivate a plan (admin) — does not delete */
export async function deactivatePlan(id: string, actorId?: string) {
  return updatePlan(id, { isActive: false }, actorId)
}

/** Format plan price for display */
export function formatPrice(paise: number, currency = 'INR'): string {
  const amount = paise / 100
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}
