// POST /api/webhooks/razorpay — Razorpay webhook handler with idempotency
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/billing/razorpay'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { renewSubscription, handlePaymentFailure } from '@/lib/billing/subscription'
import { createInvoice } from '@/lib/billing/invoices'
import { invalidateEntitlementCache } from '@/lib/billing/entitlements'
import { RAZORPAY_EVENT_MAP } from '@/lib/billing/constants'

export async function POST(req: NextRequest) {
  let rawBody: string
  try {
    rawBody = await req.text()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const signature = req.headers.get('x-razorpay-signature') || ''

  // 1. Verify webhook signature
  if (!verifyWebhookSignature({ body: rawBody, signature })) {
    logger.warn('Invalid Razorpay webhook signature')
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const eventId = event.event_id || event.payload?.payment?.entity?.id || `evt_${Date.now()}`
  const eventType = event.event || 'unknown'

  // 2. Idempotency check — persist before processing
  try {
    const existing = await db.billingWebhookEvent.findUnique({
      where: { provider_eventId: { provider: 'razorpay', eventId } },
    })

    if (existing && existing.status === 'PROCESSED') {
      logger.info({ eventId, eventType }, 'Webhook already processed — skipping')
      return NextResponse.json({ received: true, status: 'already_processed' })
    }

    // Upsert the event record
    await db.billingWebhookEvent.upsert({
      where: { provider_eventId: { provider: 'razorpay', eventId } },
      update: { status: 'PENDING' },
      create: {
        provider: 'razorpay',
        eventId,
        eventType,
        payload: event,
        status: 'PENDING',
      },
    })
  } catch (err) {
    logger.error({ err, eventId }, 'Failed to persist webhook event')
  }

  // 3. Process the event
  try {
    await processRazorpayEvent(eventType, event)

    // Mark as processed
    await db.billingWebhookEvent.update({
      where: { provider_eventId: { provider: 'razorpay', eventId } },
      data: { status: 'PROCESSED', processedAt: new Date() },
    })

    logger.info({ eventId, eventType }, 'Webhook processed successfully')
    return NextResponse.json({ received: true })
  } catch (err: any) {
    logger.error({ err, eventId, eventType }, 'Webhook processing failed')

    // Mark as failed
    try {
      await db.billingWebhookEvent.update({
        where: { provider_eventId: { provider: 'razorpay', eventId } },
        data: { status: 'FAILED', processedAt: new Date(), errorMessage: err.message },
      })
    } catch {
      // Best effort
    }

    // Return 200 to prevent Razorpay retries for non-transient errors
    return NextResponse.json({ received: true, error: 'processing_failed' })
  }
}

async function processRazorpayEvent(eventType: string, event: any) {
  switch (eventType) {
    case 'subscription.activated':
    case 'subscription.charged': {
      const sub = event.payload.subscription?.entity
      if (!sub) break

      const periodStart = sub.current_start
        ? new Date(sub.current_start * 1000)
        : new Date()
      const periodEnd = sub.current_end
        ? new Date(sub.current_end * 1000)
        : new Date()

      if (eventType === 'subscription.activated') {
        // Just update period dates — activation happens via checkout/verify
        await db.subscription.updateMany({
          where: { razorpaySubscriptionId: sub.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
          },
        })

        // Invalidate cache for the tenant
        const dbSub = await db.subscription.findUnique({
          where: { razorpaySubscriptionId: sub.id },
        })
        if (dbSub) await invalidateEntitlementCache(dbSub.organizationId)
      } else {
        // subscription.charged = renewal
        await renewSubscription(sub.id, {
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
        })
      }

      // Record payment if present
      const payment = event.payload.payment?.entity
      if (payment) {
        const dbSub = await db.subscription.findUnique({
          where: { razorpaySubscriptionId: sub.id },
        })
        if (dbSub) {
          // Upsert to prevent duplicate payment records
          await db.payment.upsert({
            where: { razorpayPaymentId: payment.id },
            update: { status: payment.status || 'captured' },
            create: {
              subscriptionId: dbSub.id,
              organizationId: dbSub.organizationId,
              razorpayPaymentId: payment.id,
              razorpayOrderId: payment.order_id || null,
              amount: payment.amount || 0,
              currency: payment.currency || 'INR',
              status: payment.status || 'captured',
              methodType: payment.method || null,
            },
          })

          // Create invoice
          await createInvoice({
            organizationId: dbSub.organizationId,
            subscriptionId: dbSub.id,
            providerInvoiceId: event.payload.invoice?.entity?.id || null,
            subtotal: payment.amount || 0,
            tax: payment.tax || 0,
            total: payment.amount || 0,
            currency: payment.currency || 'INR',
            invoiceUrl: event.payload.invoice?.entity?.short_url || null,
            paidAt: new Date(),
          })
        }
      }
      break
    }

    case 'subscription.halted':
    case 'payment.failed': {
      const sub = event.payload.subscription?.entity
      if (sub?.id) {
        await handlePaymentFailure(sub.id)
      }

      // Record failed payment
      const payment = event.payload.payment?.entity
      if (payment) {
        const dbSub = sub?.id
          ? await db.subscription.findUnique({ where: { razorpaySubscriptionId: sub.id } })
          : null
        if (dbSub) {
          await db.payment.upsert({
            where: { razorpayPaymentId: payment.id },
            update: {
              status: 'failed',
              failureReason: payment.error_description || payment.error_reason || null,
            },
            create: {
              subscriptionId: dbSub.id,
              organizationId: dbSub.organizationId,
              razorpayPaymentId: payment.id,
              amount: payment.amount || 0,
              currency: payment.currency || 'INR',
              status: 'failed',
              failureReason: payment.error_description || payment.error_reason || null,
              methodType: payment.method || null,
            },
          })
        }
      }
      break
    }

    case 'subscription.cancelled': {
      const sub = event.payload.subscription?.entity
      if (!sub) break
      await db.subscription.updateMany({
        where: { razorpaySubscriptionId: sub.id },
        data: { status: 'CANCELED', canceledAt: new Date() },
      })
      const dbSub = await db.subscription.findUnique({
        where: { razorpaySubscriptionId: sub.id },
      })
      if (dbSub) await invalidateEntitlementCache(dbSub.organizationId)
      break
    }

    case 'subscription.completed': {
      const sub = event.payload.subscription?.entity
      if (!sub) break
      await db.subscription.updateMany({
        where: { razorpaySubscriptionId: sub.id },
        data: { status: 'EXPIRED', endedAt: new Date() },
      })
      const dbSub = await db.subscription.findUnique({
        where: { razorpaySubscriptionId: sub.id },
      })
      if (dbSub) await invalidateEntitlementCache(dbSub.organizationId)
      break
    }

    case 'payment.captured': {
      const payment = event.payload.payment?.entity
      if (!payment) break
      // Update existing payment record status
      try {
        await db.payment.update({
          where: { razorpayPaymentId: payment.id },
          data: { status: 'captured' },
        })
      } catch {
        // Payment record might not exist yet — that's fine
      }
      break
    }

    default:
      logger.info({ eventType }, 'Unhandled Razorpay webhook event type')
  }
}
