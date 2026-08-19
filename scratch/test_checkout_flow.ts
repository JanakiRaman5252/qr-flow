import { createCheckout } from '../src/lib/billing/checkout'
import { db } from '../src/lib/db'

async function test() {
  const org = await db.organization.findFirst()
  const user = await db.user.findFirst()
  const proPlan = await db.plan.findUnique({ where: { slug: 'pro' } })

  if (!org || !user || !proPlan) {
    console.error('Missing test org/user/plan')
    return
  }

  console.log('Testing createCheckout for Org:', org.id, 'Plan:', proPlan.name)

  try {
    const result = await createCheckout(org.id, user.id, proPlan.id, 'MONTHLY')
    console.log('Checkout Created Successfully!')
    console.log('Razorpay Key ID:', result.razorpayKeyId)
    console.log('Razorpay Subscription ID:', result.razorpaySubscriptionId)
    console.log('Amount:', result.amount)
    console.log('Plan Name:', result.planName)
  } catch (err: any) {
    console.error('Checkout creation error:', err)
  }
}

test().catch(console.error).finally(() => process.exit())
