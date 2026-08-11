'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, ArrowRight, X } from 'lucide-react'

interface LimitReachedDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
  feature?: string
  usage?: number
  limit?: number
}

export function LimitReachedDialog({
  isOpen,
  onClose,
  title = 'Plan Limit Reached',
  message,
  feature,
  usage,
  limit,
}: LimitReachedDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {feature && <p className="text-xs text-amber-400/90 font-medium">Metric: {feature}</p>}
          </div>
        </div>

        <p className="text-sm text-slate-300">
          {message ||
            `You have reached your allocated quota${
              limit ? ` of ${limit}` : ''
            }. Upgrade your plan to continue creating resources and unlocking features.`}
        </p>

        {usage !== undefined && limit !== undefined && (
          <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Current Usage</span>
            <span className="font-bold text-white">
              {usage} / {limit}
            </span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancel
          </button>
          <Link
            href="/dashboard/billing"
            onClick={onClose}
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span>Upgrade Subscription</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
