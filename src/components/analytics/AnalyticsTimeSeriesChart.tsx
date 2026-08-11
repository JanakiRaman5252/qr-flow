'use client'

import React from 'react'
import { TrendingUp, Users, Activity } from 'lucide-react'

interface TimeSeriesPoint {
  date: string
  scans: number
  unique: number
}

interface AnalyticsTimeSeriesChartProps {
  data: TimeSeriesPoint[]
  timeframe: string
}

export function AnalyticsTimeSeriesChart({ data, timeframe }: AnalyticsTimeSeriesChartProps) {
  const maxScans = Math.max(...data.map((d) => d.scans), 1)

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <span>Scan Volume & Traffic Trends</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly & daily breakdown of total scans vs. unique visitors ({timeframe}).
          </p>
        </div>

        <div className="flex items-center space-x-4 text-xs font-semibold">
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            <span className="text-slate-300">Total Scans</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
            <span className="text-slate-300">Unique Visitors</span>
          </div>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="py-16 text-center text-slate-500 text-xs">No scan data recorded for this timeframe.</div>
      ) : (
        <div className="space-y-4">
          <div className="h-48 flex items-end justify-between gap-1 sm:gap-2 pt-6 pb-2 px-2">
            {data.map((pt, idx) => {
              const scanHeight = Math.max(Math.round((pt.scans / maxScans) * 100), 4)
              const uniqueHeight = Math.max(Math.round((pt.unique / maxScans) * 100), 2)

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  {/* Tooltip */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl shadow-xl text-[11px] text-white whitespace-nowrap pointer-events-none">
                    <span className="font-bold">{pt.date}</span>
                    <span className="text-indigo-400 font-semibold">{pt.scans} total scans</span>
                    <span className="text-emerald-400">{pt.unique} unique visitors</span>
                  </div>

                  {/* Bars */}
                  <div className="w-full max-w-[28px] flex items-end justify-center space-x-0.5 h-full">
                    <div
                      className="w-1/2 bg-indigo-600 group-hover:bg-indigo-500 rounded-t-md transition-all duration-300 shadow-lg shadow-indigo-600/20"
                      style={{ height: `${scanHeight}%` }}
                    />
                    <div
                      className="w-1/2 bg-emerald-500 group-hover:bg-emerald-400 rounded-t-md transition-all duration-300 shadow-lg shadow-emerald-500/20"
                      style={{ height: `${uniqueHeight}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* X Axis Labels */}
          <div className="flex justify-between text-[10px] text-slate-500 font-mono border-t border-slate-800/80 pt-2 px-2">
            <span>{data[0]?.date}</span>
            {data.length > 2 && <span>{data[Math.floor(data.length / 2)]?.date}</span>}
            <span>{data[data.length - 1]?.date}</span>
          </div>
        </div>
      )}
    </div>
  )
}
