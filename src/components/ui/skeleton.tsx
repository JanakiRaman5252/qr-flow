import React from 'react'

export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      suppressHydrationWarning
      className={`animate-shimmer rounded-xl bg-slate-800/60 border border-slate-700/40 shadow-inner ${className}`}
      {...props}
    />
  )
}
