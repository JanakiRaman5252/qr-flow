// POST /api/billing/cancel — cancel subscription
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { cancelSubscription } from '@/lib/billing/subscription'
import { cancelRazorpaySubscription } from '@/lib/billing/razorpay'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/rbac'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'

const cancelSchema = z.object({
  immediate: z.boolean().optional().default(false),
})

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'billing:manage')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Owners and Admins can cancel subscriptions' } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = cancelSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request' } },
        { status: 400 }
      )
    }

    const sub = await db.subscription.findUnique({ where: { organizationId: orgId } })

    // Cancel on Razorpay if there's a provider subscription
    if (sub?.razorpaySubscriptionId) {
      try {
        await cancelRazorpaySubscription(sub.razorpaySubscriptionId, !parsed.data.immediate)
      } catch (err) {
        console.error('Razorpay cancel error (continuing with local cancel):', err)
      }
    }

    const result = await cancelSubscription(orgId, {
      immediate: parsed.data.immediate,
      actorId: userId,
    })

    return NextResponse.json({
      success: true,
      data: {
        status: result.status,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd,
        currentPeriodEnd: result.currentPeriodEnd,
        message: result.cancelAtPeriodEnd
          ? `Your subscription will remain active until ${result.currentPeriodEnd?.toLocaleDateString()}.`
          : 'Your subscription has been cancelled.',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
