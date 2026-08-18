// GET /api/billing/entitlements — current entitlements for tenant
import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { getEntitlements } from '@/lib/billing/entitlements'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const entitlements = await getEntitlements(orgId)
    return NextResponse.json({ success: true, data: entitlements })
  } catch (error) {
    return handleApiError(error)
  }
}
