'use client'

import React from 'react'
import { Clock, Sparkles, ArrowRight } from 'lucide-react'

interface TrialBannerProps {
  planName: string
  trialEnd: string
  onUpgrade: () => void
}

export function TrialBanner({ planName, trialEnd, onUpgrade }: TrialBannerProps) {
  const now = new Date()
  const end = new Date(trialEnd)
  const diffMs = end.getTime() - now.getTime()
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
  const hoursLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)))

  // Calculate progress (max 7-day trial)
  const totalTrialDays = 7
  const elapsed = totalTrialDays - daysLeft
  const progress = Math.min(100, Math.max(0, (elapsed / totalTrialDays) * 100))

  const isExpiringSoon = daysLeft <= 3
  const isExpired = diffMs <= 0

  if (isExpired) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-r from-rose-500/10 to-rose-600/5 p-5 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-rose-500/10">
              <Clock className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-300">Trial Expired</h4>
              <p className="text-xs text-rose-300/70 mt-0.5">
                Your {planName} trial has ended. Upgrade now to keep your features.
              </p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold text-xs transition-all shadow-lg shadow-rose-600/30"
          >
            <Sparkles className="w-4 h-4" />
            <span>Upgrade Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border p-5 backdrop-blur-xl transition-all ${
        isExpiringSoon
          ? 'border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-orange-500/5'
          : 'border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 to-purple-500/5'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start space-x-3 flex-1">
          <div
            className={`p-2 rounded-xl ${
              isExpiringSoon ? 'bg-amber-500/10' : 'bg-indigo-500/10'
            }`}
          >
            <Clock
              className={`w-5 h-5 ${
                isExpiringSoon ? 'text-amber-400' : 'text-indigo-400'
              }`}
            />
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <h4
                className={`text-sm font-bold ${
                  isExpiringSoon ? 'text-amber-300' : 'text-indigo-300'
                }`}
              >
                {planName} Trial
                {isExpiringSoon ? ' — Ending Soon!' : ''}
              </h4>
              <p
                className={`text-xs mt-0.5 ${
                  isExpiringSoon ? 'text-amber-300/70' : 'text-indigo-300/70'
                }`}
              >
                {daysLeft > 1
                  ? `${daysLeft} days remaining`
                  : daysLeft === 1
                    ? `${hoursLeft} hours remaining`
                    : `Less than a day remaining`}{' '}
                — Upgrade to keep all your features.
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full max-w-xs">
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isExpiringSoon
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onUpgrade}
          className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all shadow-lg whitespace-nowrap ${
            isExpiringSoon
              ? 'bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-amber-600/30'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Upgrade Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
