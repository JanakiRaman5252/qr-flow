// POST /api/billing/upgrade — upgrade to a higher plan
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { createCheckout } from '@/lib/billing/checkout'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { z } from 'zod'

const upgradeSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
})

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await getCurrentUserAndOrg()
    const body = await req.json()
    const parsed = upgradeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    // For upgrades, we create a new Razorpay subscription (old one gets replaced on activation)
    const result = await createCheckout(orgId, userId, parsed.data.planId, parsed.data.billingCycle)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    console.error('POST /api/billing/upgrade Error:', error)
    return NextResponse.json({ error: 'Failed to create upgrade checkout' }, { status: 500 })
  }
}
