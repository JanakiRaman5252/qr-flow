'use client'

import React from 'react'

interface BreakdownItem {
  name: string
  count: number
  percentage: number
}

interface BreakdownCardProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  items: BreakdownItem[]
  emptyText?: string
  barColor?: string
}

export function BreakdownCard({
  title,
  subtitle,
  icon,
  items,
  emptyText = 'No data available',
  barColor = 'bg-indigo-600',
}: BreakdownCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
        {icon && <div className="p-2 rounded-xl bg-slate-800 text-indigo-400">{icon}</div>}
        <div>
          <h3 className="text-base font-bold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-3 pt-1">
          {items.slice(0, 5).map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                <span className="font-mono text-slate-400 font-medium">
                  {item.count.toLocaleString()} ({item.percentage}%)
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
