'use client'

import React from 'react'
import { Check, Sparkles, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/billing/formatters'

interface PlanCardProps {
  plan: {
    id: string
    name: string
    slug: string
    description?: string | null
    monthlyPrice: number
    yearlyPrice: number
    trialDays?: number
    isFree: boolean
    isRecommended?: boolean
    marketingFeatures?: any
  }
  currentCycle: 'MONTHLY' | 'YEARLY'
  isCurrentPlan?: boolean
  canTrial?: boolean
  onSelect: (planId: string) => void
  onStartTrial?: (planId: string) => void
  isLoading?: boolean
}

export function PlanCard({
  plan,
  currentCycle,
  isCurrentPlan = false,
  canTrial = false,
  onSelect,
  onStartTrial,
  isLoading = false,
}: PlanCardProps) {
  const price = currentCycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice
  const features: string[] = Array.isArray(plan.marketingFeatures)
    ? (plan.marketingFeatures as string[])
    : []

  return (
    <div
      className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${
        plan.isRecommended
          ? 'bg-slate-900 border-2 border-indigo-500/80 shadow-2xl shadow-indigo-500/10'
          : 'bg-slate-900/60 border border-slate-800 hover:border-slate-700'
      }`}
    >
      {plan.isRecommended && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-[11px] font-bold text-white shadow-lg flex items-center space-x-1">
          <Sparkles className="w-3 h-3" />
          <span>MOST POPULAR</span>
        </div>
      )}

      <div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">{plan.name}</h3>
          {plan.description && <p className="text-xs text-slate-400 min-h-[36px]">{plan.description}</p>}
        </div>

        <div className="my-6">
          <div className="flex items-baseline space-x-1">
            <span className="text-4xl font-extrabold tracking-tight text-white">
              {formatPrice(price)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              /{currentCycle === 'YEARLY' ? 'year' : 'month'}
            </span>
          </div>
          {currentCycle === 'YEARLY' && (
            <p className="text-[11px] text-emerald-400 font-medium mt-1">
              Equivalent to {formatPrice(Math.round(price / 12))}/mo
            </p>
          )}
          {/* Trial badge */}
          {canTrial && plan.trialDays && plan.trialDays > 0 && (
            <div className="flex items-center space-x-1.5 mt-2">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-semibold text-indigo-400">
                {plan.trialDays}-day free trial available
              </span>
            </div>
          )}
        </div>

        <div className="space-y-3 border-t border-slate-800/80 pt-5 my-6">
          <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Features included:</p>
          <ul className="space-y-2.5">
            {features.map((feat, idx) => (
              <li key={idx} className="flex items-start space-x-2.5 text-xs text-slate-300">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="space-y-2">
        {/* Start Trial button — shown when trial is available */}
        {canTrial && plan.trialDays && plan.trialDays > 0 && onStartTrial && !isCurrentPlan && (
          <button
            type="button"
            disabled={isLoading}
            onClick={() => onStartTrial(plan.id)}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
              plan.isRecommended
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center space-x-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>Starting Trial...</span>
              </span>
            ) : (
              <>Start {plan.trialDays}-Day Free Trial</>
            )}
          </button>
        )}

        {/* Upgrade/Select button */}
        <button
          type="button"
          disabled={isCurrentPlan || isLoading}
          onClick={() => onSelect(plan.id)}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition-all ${
            isCurrentPlan
              ? 'bg-slate-800 text-slate-400 cursor-default border border-slate-700'
              : canTrial && plan.trialDays && plan.trialDays > 0 && onStartTrial
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs'
                : plan.isRecommended
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
          }`}
        >
          {isCurrentPlan
            ? 'Current Plan'
            : canTrial && plan.trialDays && plan.trialDays > 0 && onStartTrial
              ? 'Or Subscribe Now'
              : 'Upgrade Plan'}
        </button>
      </div>
    </div>
  )
}
