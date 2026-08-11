'use client'

import React from 'react'

interface SubscriptionStatusBadgeProps {
  status: string
  cancelAtPeriodEnd?: boolean
}

export function SubscriptionStatusBadge({ status, cancelAtPeriodEnd }: SubscriptionStatusBadgeProps) {
  let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700'
  let label = status

  switch (status.toUpperCase()) {
    case 'ACTIVE':
      if (cancelAtPeriodEnd) {
        badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
        label = 'Cancels at period end'
      } else {
        badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        label = 'Active'
      }
      break
    case 'TRIALING':
      badgeStyle = 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      label = 'Trialing'
      break
    case 'PAST_DUE':
      badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      label = 'Past Due'
      break
    case 'CANCELED':
    case 'EXPIRED':
      badgeStyle = 'bg-slate-800 text-slate-400 border-slate-700'
      label = status === 'CANCELED' ? 'Canceled' : 'Expired'
      break
    case 'INCOMPLETE':
      badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      label = 'Payment Pending'
      break
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  )
}
