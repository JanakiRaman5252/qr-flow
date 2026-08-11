'use client'

import React from 'react'
import { QrCode, TrendingUp, Trophy } from 'lucide-react'

interface QRRankItem {
  id: string
  title: string
  shortCode: string
  type: string
  periodScans: number
  totalScans: number
}

interface TopQRCodesCardProps {
  items: QRRankItem[]
}

export function TopQRCodesCard({ items }: TopQRCodesCardProps) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Top Performing QR Codes</h3>
            <p className="text-xs text-slate-400">Ranked by scan volume in selected timeframe</p>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500 py-6 text-center">No QR code scan activity recorded.</p>
      ) : (
        <div className="divide-y divide-slate-800/60">
          {items.map((qr, idx) => (
            <div key={qr.id} className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-xl transition-colors">
              <div className="flex items-center space-x-3 min-w-0">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? 'bg-amber-500 text-slate-950'
                      : idx === 1
                      ? 'bg-slate-300 text-slate-950'
                      : idx === 2
                      ? 'bg-amber-700 text-white'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {idx + 1}
                </span>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{qr.title}</p>
                  <p className="text-[10px] text-indigo-400 font-mono">/q/{qr.shortCode}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold text-emerald-400 block font-mono">
                  +{qr.periodScans.toLocaleString()} scans
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {qr.totalScans.toLocaleString()} lifetime
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
