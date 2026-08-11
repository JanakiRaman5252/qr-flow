// ─────────────────────────────────────────────
// Invoice Service
// ─────────────────────────────────────────────

import { db } from '@/lib/db'
import { logger } from '@/lib/logger'

/** Generate a sequential invoice number */
function generateInvoiceNumber(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `INV-${year}${month}-${random}`
}

/** Create an invoice from a payment event */
export async function createInvoice({
  organizationId,
  subscriptionId,
  providerInvoiceId,
  subtotal,
  tax,
  discount,
  total,
  currency,
  invoiceUrl,
  paidAt,
}: {
  organizationId: string
  subscriptionId?: string
  providerInvoiceId?: string
  subtotal: number
  tax?: number
  discount?: number
  total: number
  currency?: string
  invoiceUrl?: string
  paidAt?: Date
}) {
  // Check for duplicate
  if (providerInvoiceId) {
    const existing = await db.invoice.findUnique({
      where: { providerInvoiceId },
    })
    if (existing) return existing
  }

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      organizationId,
      subscriptionId,
      providerInvoiceId,
      subtotal,
      tax: tax || 0,
      discount: discount || 0,
      total,
      currency: currency || 'INR',
      status: paidAt ? 'PAID' : 'ISSUED',
      invoiceUrl,
      paidAt,
    },
  })

  logger.info({ invoiceId: invoice.id, organizationId }, 'Invoice created')
  return invoice
}

/** Get invoices for a tenant with pagination */
export async function getInvoices(
  organizationId: string,
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}
) {
  const where = { organizationId }

  const [items, total] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.invoice.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}

/** Get a single invoice for a tenant */
export async function getInvoiceById(organizationId: string, invoiceId: string) {
  return db.invoice.findFirst({
    where: { id: invoiceId, organizationId },
  })
}

/** Get all invoices (admin) with pagination */
export async function getAllInvoices({
  page = 1,
  pageSize = 25,
  search,
}: {
  page?: number
  pageSize?: number
  search?: string
} = {}) {
  const where: any = {}
  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { providerInvoiceId: { contains: search, mode: 'insensitive' } },
    ]
  }

  const [items, total] = await Promise.all([
    db.invoice.findMany({
      where,
      orderBy: { issuedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { organization: { select: { id: true, name: true, slug: true } } },
    }),
    db.invoice.count({ where }),
  ])

  return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
}
