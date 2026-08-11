import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { isSuperAdminEmail } from '@/lib/is-super-admin'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const { user } = await getCurrentUserAndOrg()

    if (!user || !isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized — Super Admin access required' }, { status: 403 })
    }

    const [activeSubsCount, totalRevenue, totalInvoices, planBreakdown] = await Promise.all([
      db.subscription.count({ where: { status: 'ACTIVE' } }),
      db.payment.aggregate({
        where: { status: 'captured' },
        _sum: { amount: true },
      }),
      db.invoice.count(),
      db.subscription.groupBy({
        by: ['planId'],
        _count: { id: true },
      }),
    ])

    // Calculate approximate MRR
    const activeSubs = await db.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { amount: true, billingCycle: true },
    })

    let mrr = 0
    for (const sub of activeSubs) {
      if (!sub.amount) continue
      if (sub.billingCycle === 'YEARLY') {
        mrr += Math.round(sub.amount / 12)
      } else {
        mrr += sub.amount
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        mrr,
        arr: mrr * 12,
        activeSubscriptions: activeSubsCount,
        totalRevenue: totalRevenue._sum.amount || 0,
        totalInvoices,
        planBreakdown,
      },
    })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch admin billing stats' }, { status: 500 })
  }
}
