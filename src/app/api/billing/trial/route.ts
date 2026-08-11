// POST /api/billing/trial — start a free trial
// GET  /api/billing/trial — check trial eligibility for all plans
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { startTrial, getTrialEligibility } from '@/lib/billing/subscription'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { z } from 'zod'

const trialSchema = z.object({
  planId: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const body = await req.json()
    const parsed = trialSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
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
    console.error('POST /api/billing/trial Error:', error)
    return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const eligibility = await getTrialEligibility(orgId)

    return NextResponse.json({ success: true, data: eligibility })
  } catch (error) {
    console.error('GET /api/billing/trial Error:', error)
    return NextResponse.json({ error: 'Failed to check trial eligibility' }, { status: 500 })
  }
}
