// GET /api/billing/plans — Public: returns active plans for pricing page
import { NextResponse } from 'next/server'
import { getActivePlans } from '@/lib/billing/plans'

export async function GET() {
  try {
    const plans = await getActivePlans()
    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    console.error('GET /api/billing/plans Error:', error)
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 })
  }
}
