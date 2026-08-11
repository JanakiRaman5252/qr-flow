// POST /api/billing/resume — resume cancelled subscription
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { resumeSubscription } from '@/lib/billing/subscription'

export async function POST() {
  try {
    const { userId, orgId } = await getCurrentUserAndOrg()
    const result = await resumeSubscription(orgId, userId)

    return NextResponse.json({
      success: true,
      data: {
        status: result.status,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd,
        message: 'Your subscription has been resumed.',
      },
    })
  } catch (error: any) {
    console.error('POST /api/billing/resume Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to resume subscription' },
      { status: 500 }
    )
  }
}
