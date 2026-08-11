'use client'

import React, { useState } from 'react'
import { Activity, TrendingUp } from 'lucide-react'

interface TimeSeriesPoint {
  date: string
  scans: number
  unique: number
}

interface AnalyticsAreaChartProps {
  data: TimeSeriesPoint[]
  timeframe: string
}

export function AnalyticsAreaChart({ data, timeframe }: AnalyticsAreaChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const points = data.length > 0 ? data : [
    { date: 'Mon', scans: 0, unique: 0 },
    { date: 'Tue', scans: 0, unique: 0 },
    { date: 'Wed', scans: 0, unique: 0 },
  ]

  const maxVal = Math.max(...points.map((p) => p.scans), 5)
  const svgWidth = 800
  const svgHeight = 220
  const padding = 30

  const widthUsable = svgWidth - padding * 2
  const heightUsable = svgHeight - padding * 2

  // Generate SVG path coordinates
  const scanCoords = points.map((p, idx) => {
    const x = padding + (idx / Math.max(points.length - 1, 1)) * widthUsable
    const y = svgHeight - padding - (p.scans / maxVal) * heightUsable
    return { x, y, point: p }
  })

  const uniqueCoords = points.map((p, idx) => {
    const x = padding + (idx / Math.max(points.length - 1, 1)) * widthUsable
    const y = svgHeight - padding - (p.unique / maxVal) * heightUsable
    return { x, y, point: p }
  })

  const scanPathD = scanCoords.reduce(
    (acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
    ''
  )

  const areaPathD = `${scanPathD} L ${scanCoords[scanCoords.length - 1]?.x || 0} ${
    svgHeight - padding
  } L ${padding} ${svgHeight - padding} Z`

  const uniquePathD = uniqueCoords.reduce(
    (acc, c, idx) => (idx === 0 ? `M ${c.x} ${c.y}` : `${acc} L ${c.x} ${c.y}`),
    ''
  )

  const hovered = hoveredIdx !== null ? scanCoords[hoveredIdx] : null

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Interactive Traffic & Scan Curve</span>
            </h3>
            <p className="text-xs text-slate-400">Visual trend analysis over timeframe: {timeframe}</p>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs font-semibold">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-md shadow-indigo-500/50" />
            <span className="text-slate-200">Total Scans</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-md shadow-emerald-400/50" />
            <span className="text-slate-200">Unique Visitors</span>
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto overflow-visible"
        >
          <defs>
            <linearGradient id="scanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
            const y = padding + pct * heightUsable
            return (
              <line
                key={idx}
                x1={padding}
                y1={y}
                x2={svgWidth - padding}
                y2={y}
                stroke="#1e293b"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            )
          })}

          {/* Area Fill */}
          <path d={areaPathD} fill="url(#scanGradient)" />

          {/* Scan Line */}
          <path
            d={scanPathD}
            fill="none"
            stroke="#6366f1"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Unique Visitors Line */}
          <path
            d={uniquePathD}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.5"
            strokeDasharray="5 5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Data Points */}
          {scanCoords.map((c, idx) => (
            <g key={idx} className="cursor-pointer">
              <circle
                cx={c.x}
                cy={c.y}
                r={hoveredIdx === idx ? 6 : 4}
                className="fill-indigo-500 stroke-slate-900 transition-all"
                strokeWidth="2"
                onMouseEnter={() => setHoveredIdx(idx)}
              />
              <circle
                cx={c.x}
                cy={c.y}
                r="14"
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            </g>
          ))}
        </svg>

        {/* Dynamic Hover Tooltip */}
        {hovered && (
          <div
            className="absolute top-2 z-30 px-3.5 py-2 rounded-2xl bg-slate-950/95 border border-indigo-500/40 text-xs shadow-2xl space-y-1 pointer-events-none transition-all"
            style={{
              left: `${Math.min(Math.max((hovered.x / svgWidth) * 100, 10), 85)}%`,
            }}
          >
            <p className="font-bold text-white">{hovered.point.date}</p>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="text-indigo-400 font-semibold">{hovered.point.scans} Scans</span>
              <span className="text-emerald-400 font-semibold">{hovered.point.unique} Unique</span>
            </div>
          </div>
        )}
      </div>

      {/* Axis Dates Footer */}
      <div className="flex justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800 pt-3">
        <span>{points[0]?.date}</span>
        {points.length > 2 && <span>{points[Math.floor(points.length / 2)]?.date}</span>}
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  )
}
