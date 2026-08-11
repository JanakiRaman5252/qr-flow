'use client'

import React, { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import Link from 'next/link'

interface FeatureGateProps {
  featureKey: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({ featureKey, children, fallback }: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/billing/entitlements')
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          const ent = json.data.find((e: any) => e.key === featureKey)
          setHasAccess(ent ? ent.available : false)
        } else {
          setHasAccess(false)
        }
      } catch {
        setHasAccess(false)
      }
    }
    check()
  }, [featureKey])

  if (hasAccess === null) return null // loading state

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>

    return (
      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-6 text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 text-indigo-400">
          <Lock className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">Feature Locked</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            The {featureKey.replace(/_/g, ' ').toLowerCase()} feature is not available on your current plan.
          </p>
        </div>
        <Link
          href="/dashboard/billing"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30"
        >
          Upgrade Plan
        </Link>
      </div>
    )
  }

  return <>{children}</>
}
