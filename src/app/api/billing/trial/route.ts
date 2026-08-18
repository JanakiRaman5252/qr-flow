// POST /api/billing/trial — start a free trial
// GET  /api/billing/trial — check trial eligibility for all plans
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { startTrial, getTrialEligibility } from '@/lib/billing/subscription'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { hasPermission } from '@/lib/rbac'
import { handleApiError } from '@/lib/errors'
import { z } from 'zod'

const trialSchema = z.object({
  planId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const { orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'billing:manage')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Owners and Admins can start trials' } },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = trialSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid request', details: parsed.error.flatten() } },
        { status: 400 }
      )
    }

    const subscription = await startTrial(orgId, parsed.data.planId)

    return NextResponse.json({
      success: true,
      data: {
        message: 'Trial started successfully! Enjoy your free trial.',
        subscription,
      },
    })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    return handleApiError(error)
  }
}

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const eligibility = await getTrialEligibility(orgId)

    return NextResponse.json({ success: true, data: eligibility })
  } catch (error) {
    return handleApiError(error)
  }
}
