'use client'

import React from 'react'
import { Smartphone, Monitor, Tablet, PieChart } from 'lucide-react'

interface BreakdownItem {
  name: string
  count: number
  percentage: number
}

interface DeviceDonutChartProps {
  items: BreakdownItem[]
}

const COLORS = ['#6366f1', '#8b5cf6', '#34d399', '#f59e0b', '#ec4899']

export function DeviceDonutChart({ items }: DeviceDonutChartProps) {
  const total = items.reduce((acc, curr) => acc + curr.count, 0)

  // Generate SVG Donut slices
  let accumulatedAngle = 0

  const slices = items.map((item, idx) => {
    const angle = (item.percentage / 100) * 360
    const startAngle = accumulatedAngle
    const endAngle = accumulatedAngle + angle
    accumulatedAngle += angle

    const x1 = 50 + 40 * Math.cos((Math.PI * (startAngle - 90)) / 180)
    const y1 = 50 + 40 * Math.sin((Math.PI * (startAngle - 90)) / 180)
    const x2 = 50 + 40 * Math.cos((Math.PI * (endAngle - 90)) / 180)
    const y2 = 50 + 40 * Math.sin((Math.PI * (endAngle - 90)) / 180)

    const largeArcFlag = angle > 180 ? 1 : 0

    const pathData =
      items.length === 1 || item.percentage >= 99
        ? `M 50,10 A 40,40 0 1,1 49.99,10 Z`
        : `M ${x1},${y1} A 40,40 0 ${largeArcFlag},1 ${x2},${y2}`

    return {
      ...item,
      pathData,
      color: COLORS[idx % COLORS.length],
    }
  })

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
      <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
          <PieChart className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Device Category Share</h3>
          <p className="text-xs text-slate-400">Mobile vs Desktop audience ratio</p>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500 py-10 text-center">No device data available</p>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-2">
          {/* Donut Graphic */}
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {slices.map((slice, idx) => (
                <path
                  key={idx}
                  d={slice.pathData}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth="16"
                  className="transition-all duration-500 hover:opacity-80"
                />
              ))}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-lg font-black text-white">{total}</span>
              <span className="text-[9px] uppercase font-bold text-slate-400">Scans</span>
            </div>
          </div>

          {/* Legend Items */}
          <div className="space-y-2.5 w-full flex-1">
            {slices.map((slice, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-semibold text-slate-200 truncate">{slice.name}</span>
                </div>
                <span className="font-mono text-slate-400 font-bold">
                  {slice.percentage}% ({slice.count})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
