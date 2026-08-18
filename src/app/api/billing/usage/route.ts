// GET /api/billing/usage — current usage for tenant
import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { getUsageSummary } from '@/lib/billing/usage'
import { handleApiError } from '@/lib/errors'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const usage = await getUsageSummary(orgId)
    return NextResponse.json({ success: true, data: usage })
  } catch (error) {
    return handleApiError(error)
  }
}
