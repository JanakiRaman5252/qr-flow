// POST /api/billing/downgrade — schedule downgrade at period end
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { scheduleDowngrade } from '@/lib/billing/subscription'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { z } from 'zod'

const downgradeSchema = z.object({
  planId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await getCurrentUserAndOrg()
    const body = await req.json()
    const parsed = downgradeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await scheduleDowngrade(orgId, parsed.data.planId, userId)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Downgrade scheduled at end of current billing period.',
        effectiveAt: result.currentPeriodEnd,
        nextPlanId: result.nextPlanId,
      },
    })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    console.error('POST /api/billing/downgrade Error:', error)
    return NextResponse.json({ error: 'Failed to schedule downgrade' }, { status: 500 })
  }
}
