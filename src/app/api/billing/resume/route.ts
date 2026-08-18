// POST /api/billing/resume — resume cancelled subscription
import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { resumeSubscription } from '@/lib/billing/subscription'
import { hasPermission } from '@/lib/rbac'
import { handleApiError } from '@/lib/errors'

export async function POST() {
  try {
    const { userId, orgId, role } = await getCurrentUserAndOrg()

    if (!hasPermission(role, 'billing:manage')) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Only Owners and Admins can resume subscriptions' } },
        { status: 403 }
      )
    }

    const result = await resumeSubscription(orgId, userId)

    return NextResponse.json({
      success: true,
      data: {
        status: result.status,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd,
        message: 'Your subscription has been resumed.',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
