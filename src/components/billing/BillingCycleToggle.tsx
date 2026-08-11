'use client'

import React from 'react'

interface BillingCycleToggleProps {
  cycle: 'MONTHLY' | 'YEARLY'
  onChange: (cycle: 'MONTHLY' | 'YEARLY') => void
  discountText?: string
}

export function BillingCycleToggle({
  cycle,
  onChange,
  discountText = 'Save up to 20%',
}: BillingCycleToggleProps) {
  return (
    <div className="inline-flex items-center p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
      <button
        type="button"
        onClick={() => onChange('MONTHLY')}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
          cycle === 'MONTHLY'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('YEARLY')}
        className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center space-x-2 ${
          cycle === 'YEARLY'
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <span>Yearly</span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          {discountText}
        </span>
      </button>
    </div>
  )
}
