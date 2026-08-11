// GET /api/billing/invoices — invoice history for tenant
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { getInvoices } from '@/lib/billing/invoices'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)

    const result = await getInvoices(orgId, { page, pageSize })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('GET /api/billing/invoices Error:', error)
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 })
  }
}
