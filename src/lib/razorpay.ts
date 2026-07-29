import Razorpay from 'razorpay'
import crypto from 'crypto'

export const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'secret_placeholder',
})

export function verifyRazorpaySignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string
  paymentId: string
  signature: string
}): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET || ''
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return generatedSignature === signature
}

export function verifyWebhookSignature({
  body,
  signature,
}: {
  body: string
  signature: string
}): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || ''
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex')

  return expectedSignature === signature
}
