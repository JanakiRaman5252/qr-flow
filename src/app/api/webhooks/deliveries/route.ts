import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const webhookId = searchParams.get('webhookId')

    if (!webhookId) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 })
    }

    // Verify webhook belongs to organization
    const webhook = await db.webhook.findFirst({
      where: { id: webhookId, organizationId: orgId },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
    }

    const deliveries = await db.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { deliveredAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ success: true, data: deliveries })
  } catch (error) {
    console.error('GET /api/webhooks/deliveries Error:', error)
    return NextResponse.json({ error: 'Failed to fetch webhook deliveries' }, { status: 500 })
  }
}
