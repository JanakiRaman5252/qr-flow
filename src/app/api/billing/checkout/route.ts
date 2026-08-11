// POST /api/billing/checkout — create Razorpay checkout session
// POST /api/billing/checkout/verify — handled in verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { createCheckout } from '@/lib/billing/checkout'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { z } from 'zod'

const checkoutSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
})

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId } = await getCurrentUserAndOrg()
    const body = await req.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const result = await createCheckout(orgId, userId, parsed.data.planId, parsed.data.billingCycle)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    console.error('POST /api/billing/checkout Error:', error)
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }
}
