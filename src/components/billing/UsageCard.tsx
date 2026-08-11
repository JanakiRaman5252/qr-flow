'use client'

import React from 'react'

interface UsageCardProps {
  title: string
  usage: number
  limit: number
  isUnlimited?: boolean
  unit?: string
  icon?: React.ReactNode
}

export function UsageCard({
  title,
  usage,
  limit,
  isUnlimited = false,
  unit = '',
  icon,
}: UsageCardProps) {
  const percentage = isUnlimited || limit <= 0 ? 0 : Math.min(Math.round((usage / limit) * 100), 100)

  let progressColor = 'bg-indigo-600'
  if (!isUnlimited) {
    if (percentage >= 90) progressColor = 'bg-rose-500'
    else if (percentage >= 75) progressColor = 'bg-amber-500'
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon && <div className="p-2 rounded-xl bg-slate-800/80 text-indigo-400">{icon}</div>}
          <span className="text-sm font-semibold text-slate-300">{title}</span>
        </div>
        <span className="text-xs font-medium text-slate-400">
          {isUnlimited ? 'Unlimited' : `${percentage}% used`}
        </span>
      </div>

      <div className="flex items-baseline justify-between">
        <div className="text-2xl font-extrabold text-white">
          {usage.toLocaleString()} {unit}
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {isUnlimited ? 'No upper limit' : `of ${limit.toLocaleString()} ${unit}`}
        </div>
      </div>

      {!isUnlimited && (
        <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}
