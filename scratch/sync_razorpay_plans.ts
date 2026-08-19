import Razorpay from 'razorpay'
import { db } from '../src/lib/db'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
})

async function main() {
  console.log('Testing Razorpay Connection with key:', process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID)
  
  const plans = await db.plan.findMany({ where: { isFree: false } })

  for (const plan of plans) {
    console.log(`Processing plan: ${plan.name} (${plan.slug})`)

    let monthlyPlanId = plan.razorpayPlanIdMonthly
    let yearlyPlanId = plan.razorpayPlanIdYearly

    // Create Monthly Plan in Razorpay if not exists
    if (!monthlyPlanId) {
      try {
        const rzpMonthly = await razorpay.plans.create({
          period: 'monthly',
          interval: 1,
          item: {
            name: `DynoQR ${plan.name} Plan (Monthly)`,
            amount: plan.monthlyPrice, // in paise
            currency: plan.currency || 'INR',
            description: `${plan.name} Monthly Subscription`,
          },
        })
        monthlyPlanId = rzpMonthly.id
        console.log(`  Created Monthly Razorpay Plan ID: ${monthlyPlanId}`)
      } catch (err: any) {
        console.error(`  Failed to create monthly Razorpay plan for ${plan.name}:`, err.message || err)
      }
    }

    // Create Yearly Plan in Razorpay if not exists
    if (!yearlyPlanId) {
      try {
        const rzpYearly = await razorpay.plans.create({
          period: 'yearly',
          interval: 1,
          item: {
            name: `DynoQR ${plan.name} Plan (Yearly)`,
            amount: plan.yearlyPrice, // in paise
            currency: plan.currency || 'INR',
            description: `${plan.name} Yearly Subscription`,
          },
        })
        yearlyPlanId = rzpYearly.id
        console.log(`  Created Yearly Razorpay Plan ID: ${yearlyPlanId}`)
      } catch (err: any) {
        console.error(`  Failed to create yearly Razorpay plan for ${plan.name}:`, err.message || err)
      }
    }

    // Update in DB
    if (monthlyPlanId || yearlyPlanId) {
      await db.plan.update({
        where: { id: plan.id },
        data: {
          razorpayPlanIdMonthly: monthlyPlanId,
          razorpayPlanIdYearly: yearlyPlanId,
        },
      })
      console.log(`  Updated DB record for ${plan.name}`)
    }
  }

  console.log('Razorpay plan sync complete!')
}

main().catch(console.error).finally(() => process.exit())
