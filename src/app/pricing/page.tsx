import React from 'react'
import Link from 'next/link'
import { getActivePlans, formatPrice } from '@/lib/billing/plans'
import { Check, Sparkles, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PublicPricingPage() {
  // Filter out any legacy free plans from the pricing page
  let plans: any[] = []
  try {
    const allPlans = await getActivePlans()
    plans = allPlans.filter((p) => !p.isFree)
  } catch (err) {
    console.error('Failed to fetch pricing plans:', err)
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRANSPARENT PRICING</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white">
            Simple, predictable plans for every marketing team
          </h1>
          <p className="text-slate-400 text-base">
            Try any plan free for 7 days. No credit card required. Pick the plan that fits your scale.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(plans.length, 4)} gap-8 items-stretch`}>
          {plans.map((plan) => {
            const features: string[] = Array.isArray(plan.marketingFeatures)
              ? (plan.marketingFeatures as string[])
              : []

            return (
              <div
                key={plan.id}
                className={`relative flex flex-col justify-between rounded-3xl p-8 backdrop-blur-xl transition-all ${
                  plan.isRecommended
                    ? 'bg-slate-900 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20'
                    : 'bg-slate-900/50 border border-slate-800'
                }`}
              >
                {plan.isRecommended && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-[10px] font-extrabold text-white uppercase tracking-wider">
                    RECOMMENDED
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[36px]">{plan.description}</p>

                  <div className="my-6">
                    <div className="flex items-baseline space-x-1">
                      <span className="text-4xl font-extrabold tracking-tight text-white">
                        {formatPrice(plan.monthlyPrice)}
                      </span>
                      <span className="text-xs text-slate-400">/month</span>
                    </div>
                    {plan.trialDays > 0 && (
                      <p className="mt-2 text-xs text-emerald-400 font-semibold">
                        {plan.trialDays}-day free trial
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 border-t border-slate-800/80 pt-6 my-6 text-xs text-slate-300">
                    {features.map((feat, idx) => (
                      <li key={idx} className="flex items-start space-x-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  href="/dashboard/billing"
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center space-x-2 ${
                    plan.isRecommended
                      ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
