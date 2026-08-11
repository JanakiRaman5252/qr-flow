import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'

export async function POST(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { webhookId } = await req.json()

    if (!webhookId) {
      return NextResponse.json({ error: 'Webhook ID is required' }, { status: 400 })
    }

    const webhook = await db.webhook.findFirst({
      where: { id: webhookId, organizationId: orgId },
    })

    if (!webhook) {
      return NextResponse.json({ error: 'Webhook endpoint not found' }, { status: 404 })
    }

    const payload = {
      event: 'ping.test',
      timestamp: new Date().toISOString(),
      organizationId: orgId,
      message: 'DynoQR Webhook Test Delivery',
      data: {
        test: true,
        endpointId: webhook.id,
        url: webhook.url,
      },
    }

    const jsonPayload = JSON.stringify(payload)
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(`${timestamp}.${jsonPayload}`)
      .digest('hex')

    let statusCode = 0
    let errorText: string | null = null

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'DynoQR-Webhook-Test-Dispatcher/1.0',
          'X-DynoQR-Signature': `t=${timestamp},v1=${signature}`,
          'X-DynoQR-Event': 'ping.test',
        },
        body: jsonPayload,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      statusCode = res.status
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        errorText = `HTTP ${res.status}: ${text.substring(0, 300)}`
      }
    } catch (err: any) {
      statusCode = 0
      errorText = err?.message || 'Connection timed out or network error'
    }

    // Log the test delivery
    const delivery = await db.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event: 'ping.test',
        payload: payload as any,
        responseCode: statusCode,
        error: errorText,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        delivered: statusCode >= 200 && statusCode < 300,
        statusCode,
        error: errorText,
        deliveryId: delivery.id,
      },
    })
  } catch (error) {
    console.error('POST /api/webhooks/test Error:', error)
    return NextResponse.json({ error: 'Failed to send test ping' }, { status: 500 })
  }
}
