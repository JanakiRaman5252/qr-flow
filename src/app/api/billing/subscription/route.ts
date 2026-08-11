// GET /api/billing/subscription — returns current tenant's subscription
import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { getActiveSubscription, createFreeSubscription } from '@/lib/billing/subscription'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    let subscription = await getActiveSubscription(orgId)

    // Auto-create free subscription if none exists
    if (!subscription) {
      await createFreeSubscription(orgId)
      subscription = await getActiveSubscription(orgId)
    }

    return NextResponse.json({ success: true, data: subscription })
  } catch (error) {
    console.error('GET /api/billing/subscription Error:', error)
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
  }
}
