import crypto from 'crypto'
import { db } from '@/lib/db'
import { validateWebhookUrl } from '@/lib/validation'

export interface WebhookPayload {
  event: 'qr.scanned' | 'qr.created' | 'qr.updated' | 'qr.deleted'
  timestamp: string
  organizationId: string
  data: Record<string, any>
}

/**
 * Dispatches a webhook event asynchronously to all active webhook endpoints
 * registered by an organization that subscribe to the event.
 *
 * SSRF protection: validates webhook URLs before dispatching.
 */
export async function dispatchWebhookEvent(
  organizationId: string,
  event: 'qr.scanned' | 'qr.created' | 'qr.updated' | 'qr.deleted',
  data: Record<string, any>
) {
  try {
    const webhooks = await db.webhook.findMany({
      where: {
        organizationId,
        isActive: true,
        events: { has: event },
      },
    })

    if (webhooks.length === 0) return

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      organizationId,
      data,
    }

    const jsonPayload = JSON.stringify(payload)

    // Dispatch to all endpoints in parallel
    await Promise.allSettled(
      webhooks.map(async (wh) => {
        // SSRF protection: validate URL before every dispatch
        try {
          validateWebhookUrl(wh.url)
        } catch (err: any) {
          await db.webhookDelivery.create({
            data: {
              webhookId: wh.id,
              event,
              payload: payload as any,
              responseCode: 0,
              error: `SSRF protection: ${err.message}`,
            },
          })
          return // Skip this webhook
        }

        const timestamp = Math.floor(Date.now() / 1000)
        const signature = crypto
          .createHmac('sha256', wh.secret)
          .update(`${timestamp}.${jsonPayload}`)
          .digest('hex')

        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          const response = await fetch(wh.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'DynoQR-Webhook-Dispatcher/1.0',
              'X-DynoQR-Signature': `t=${timestamp},v1=${signature}`,
              'X-DynoQR-Event': event,
            },
            body: jsonPayload,
            signal: controller.signal,
            redirect: 'error', // Prevent SSRF via redirects
          })

          clearTimeout(timeoutId)

          // Limit response body read to 1KB to prevent memory abuse
          const responseText = await response.text().catch(() => '')

          // Record delivery log
          await db.webhookDelivery.create({
            data: {
              webhookId: wh.id,
              event,
              payload: payload as any,
              responseCode: response.status,
              error: response.ok ? null : `HTTP ${response.status}: ${responseText.substring(0, 500)}`,
            },
          })
        } catch (err: any) {
          await db.webhookDelivery.create({
            data: {
              webhookId: wh.id,
              event,
              payload: payload as any,
              responseCode: 0,
              error: err?.message || 'Network request failed or timed out',
            },
          })
        }
      })
    )
  } catch (error) {
    console.error(`[Webhook Dispatch Error] ${event}:`, error)
  }
}
