// POST /api/billing/checkout — create Razorpay checkout session
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { createCheckout } from '@/lib/billing/checkout'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { hasPermission } from '@/lib/rbac'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'

const checkoutSchema = z.object({
  planId: z.string().min(1),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
})

export async function POST(req: NextRequest) {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    // RBAC: Only OWNER and ADMIN can manage billing
    if (!hasPermission(role, 'billing:manage')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only workspace Owners and Admins can manage billing' } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = checkoutSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const result = await createCheckout(orgId, userId, parsed.data.planId, parsed.data.billingCycle)

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    return handleApiError(error)
  }
}
