// POST /api/billing/checkout/verify — verify Razorpay payment
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { verifyCheckout } from '@/lib/billing/checkout'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'

const verifySchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpaySubscriptionId: z.string().min(1),
  razorpaySignature: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const body = await req.json()
    const parsed = verifySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const result = await verifyCheckout(orgId, parsed.data)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    return handleApiError(error)
  }
}
