// GET /api/billing/usage — current usage for tenant
import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { getUsageSummary } from '@/lib/billing/usage'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const usage = await getUsageSummary(orgId)
    return NextResponse.json({ success: true, data: usage })
  } catch (error) {
    console.error('GET /api/billing/usage Error:', error)
    return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 })
  }
}
