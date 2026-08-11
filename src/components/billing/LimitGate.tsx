'use client'

import React from 'react'

interface LimitGateProps {
  usage: number
  limit: number
  isUnlimited?: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function LimitGate({
  usage,
  limit,
  isUnlimited = false,
  children,
  fallback,
}: LimitGateProps) {
  if (isUnlimited) return <>{children}</>

  if (usage >= limit) {
    if (fallback) return <>{fallback}</>
    return null
  }

  return <>{children}</>
}
