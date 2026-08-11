// GET /api/billing/entitlements — current entitlements for tenant
import { NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { getEntitlements } from '@/lib/billing/entitlements'

export async function GET() {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const entitlements = await getEntitlements(orgId)
    return NextResponse.json({ success: true, data: entitlements })
  } catch (error) {
    console.error('GET /api/billing/entitlements Error:', error)
    return NextResponse.json({ error: 'Failed to fetch entitlements' }, { status: 500 })
  }
}
