// GET /api/billing/payments — payment history for tenant
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    const where = { organizationId: orgId }

    const [items, total] = await Promise.all([
      db.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.payment.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (error) {
    console.error('GET /api/billing/payments Error:', error)
    return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 })
  }
}
