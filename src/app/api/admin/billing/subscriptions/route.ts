import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { isSuperAdminEmail } from '@/lib/is-super-admin'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const { user } = await getCurrentUserAndOrg()

    if (!user || !isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized — Super Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10)
    const status = searchParams.get('status')
    const planSlug = searchParams.get('planSlug')
    const search = searchParams.get('search')

    const where: any = {}
    if (status && status !== 'ALL') where.status = status
    if (planSlug && planSlug !== 'ALL') where.plan = { slug: planSlug }
    if (search) {
      where.OR = [
        { organization: { name: { contains: search, mode: 'insensitive' } } },
        { organization: { slug: { contains: search, mode: 'insensitive' } } },
        {
          organization: {
            members: {
              some: {
                user: { email: { contains: search, mode: 'insensitive' } },
              },
            },
          },
        },
      ]
    }

    const [items, total, stats] = await Promise.all([
      db.subscription.findMany({
        where,
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              members: {
                where: { role: 'OWNER' },
                select: {
                  user: {
                    select: { id: true, name: true, email: true, image: true },
                  },
                },
                take: 1,
              },
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              slug: true,
              monthlyPrice: true,
              yearlyPrice: true,
              isFree: true,
            },
          },
          payments: {
            select: { id: true, amount: true, status: true, createdAt: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.subscription.count({ where }),
      db.subscription.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
        statusStats: stats,
      },
    })
  } catch (err) {
    console.error('Admin GET subscriptions error:', err)
    return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
  }
}
