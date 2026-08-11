// ─────────────────────────────────────────────
// Billing Audit Log Service
// ─────────────────────────────────────────────

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function createBillingAuditLog({
  actorId,
  organizationId,
  action,
  entityType,
  entityId,
  previousState,
  newState,
  requestId,
}: {
  actorId?: string
  organizationId: string
  action: string
  entityType: string
  entityId?: string
  previousState?: Record<string, any>
  newState?: Record<string, any>
  requestId?: string
}) {
  try {
    await db.billingAuditLog.create({
      data: {
        actorId,
        organizationId,
        action,
        entityType,
        entityId,
        previousState: previousState ?? undefined,
        newState: newState ?? undefined,
        requestId,
      },
    })
  } catch (err) {
    // Audit log failures should never block the primary operation
    logger.error({ err, action, entityType, entityId }, 'Failed to create billing audit log')
  }
}

export async function getBillingAuditLogs({
  organizationId,
  page = 1,
  pageSize = 25,
  action,
}: {
  organizationId?: string
  page?: number
  pageSize?: number
  action?: string
}) {
  const where: any = {}
  if (organizationId) where.organizationId = organizationId
  if (action) where.action = action

  const [items, total] = await Promise.all([
    db.billingAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.billingAuditLog.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
