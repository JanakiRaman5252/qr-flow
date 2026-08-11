import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { isSuperAdminEmail } from '@/lib/is-super-admin'
import { getAllPlans, createPlan, updatePlan, updatePlanEntitlements } from '@/lib/billing/plans'
import { createRazorpayPlan } from '@/lib/billing/razorpay'
import { z } from 'zod'

export async function GET() {
  try {
    const { user } = await getCurrentUserAndOrg()

    if (!user || !isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized — Super Admin access required' }, { status: 403 })
    }

    const plans = await getAllPlans()
    return NextResponse.json({ success: true, data: plans })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch admin plans' }, { status: 500 })
  }
}

const planSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  monthlyPrice: z.number().min(0),
  yearlyPrice: z.number().min(0),
  trialDays: z.number().min(0).optional(),
  isFree: z.boolean().optional(),
  isRecommended: z.boolean().optional(),
  sortOrder: z.number().optional(),
  marketingFeatures: z.array(z.string()).optional(),
  entitlements: z.array(
    z.object({
      entitlementKey: z.string(),
      valueType: z.enum(['BOOLEAN', 'NUMERIC', 'UNLIMITED']),
      numericValue: z.number().optional(),
      booleanValue: z.boolean().optional(),
    })
  ).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const { user } = await getCurrentUserAndOrg()

    if (!user || !isSuperAdminEmail(user.email)) {
      return NextResponse.json({ error: 'Unauthorized — Super Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = planSchema.parse(body)

    let plan: any

    if (parsed.id) {
      // Update existing
      plan = await updatePlan(parsed.id, parsed, user.id)
      if (parsed.entitlements) {
        await updatePlanEntitlements(parsed.id, parsed.entitlements)
      }
    } else {
      // Create new
      plan = await createPlan({ ...parsed, actorId: user.id })
    }

    // Auto-create Razorpay plans if not set and plan is not free
    if (!plan.isFree) {
      try {
        if (!plan.razorpayPlanIdMonthly && plan.monthlyPrice > 0) {
          const rzpMonthly = await createRazorpayPlan({
            planName: `${plan.name} Monthly`,
            amount: plan.monthlyPrice,
            currency: plan.currency || 'INR',
            period: 'monthly',
            interval: 1,
          })
          plan = await updatePlan(plan.id, { razorpayPlanIdMonthly: rzpMonthly.id }, user.id)
        }

        if (!plan.razorpayPlanIdYearly && plan.yearlyPrice > 0) {
          const rzpYearly = await createRazorpayPlan({
            planName: `${plan.name} Yearly`,
            amount: plan.yearlyPrice,
            currency: plan.currency || 'INR',
            period: 'yearly',
            interval: 1,
          })
          plan = await updatePlan(plan.id, { razorpayPlanIdYearly: rzpYearly.id }, user.id)
        }
      } catch (rzpErr) {
        console.error('Razorpay auto plan creation failed (can set manually):', rzpErr)
      }
    }

    return NextResponse.json({ success: true, data: plan })
  } catch (err: any) {
    console.error('Admin POST plan error:', err)
    return NextResponse.json({ error: err.message || 'Failed to save plan' }, { status: 500 })
  }
}
