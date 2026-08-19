// GET /api/billing/subscription — returns current tenant's subscription
import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { getActiveSubscription, createTrialSubscription } from '@/lib/billing/subscription'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    let subscription = await getActiveSubscription(orgId)

    const now = new Date()
    const maxAllowedEnd = new Date(now)
    maxAllowedEnd.setDate(maxAllowedEnd.getDate() + 8)

    const needsRecalibration =
      !subscription ||
      !subscription.plan ||
      subscription.plan.isFree ||
      subscription.plan.slug === 'free' ||
      (subscription.status === 'TRIALING' && subscription.trialEnd && new Date(subscription.trialEnd) > maxAllowedEnd)

    if (needsRecalibration) {
      await createTrialSubscription(orgId)
      subscription = await getActiveSubscription(orgId)
    }

    return NextResponse.json({ success: true, data: subscription })
  } catch (error) {
    return handleApiError(error)
  }
}
