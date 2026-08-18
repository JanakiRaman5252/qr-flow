// GET /api/billing/subscription — returns current tenant's subscription
import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { getActiveSubscription, createTrialSubscription } from '@/lib/billing/subscription'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    let subscription = await getActiveSubscription(orgId)

    // Auto-create 7-day trial subscription if none exists
    if (!subscription) {
      await createTrialSubscription(orgId)
      subscription = await getActiveSubscription(orgId)
    }

    return NextResponse.json({ success: true, data: subscription })
  } catch (error) {
    return handleApiError(error)
  }
}
