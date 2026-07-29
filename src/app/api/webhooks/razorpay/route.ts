import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-razorpay-signature') || ''

    if (!verifyWebhookSignature({ body: rawBody, signature })) {
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
    }

    const event = JSON.parse(rawBody)

    switch (event.event) {
      case 'subscription.charged':
      case 'subscription.activated': {
        const sub = event.payload.subscription.entity
        await db.subscription.updateMany({
          where: { razorpaySubscriptionId: sub.id },
          data: {
            status: 'ACTIVE',
            currentPeriodStart: new Date(sub.current_start * 1000),
            currentPeriodEnd: new Date(sub.current_end * 1000),
          },
        })
        break
      }
      case 'subscription.cancelled': {
        const sub = event.payload.subscription.entity
        await db.subscription.updateMany({
          where: { razorpaySubscriptionId: sub.id },
          data: { status: 'CANCELED', canceledAt: new Date() },
        })
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Razorpay Webhook Error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}
