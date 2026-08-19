'use client'

import React from 'react'
import { QrCode } from 'lucide-react'

interface LoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  text?: string
  subtext?: string
  className?: string
}

export function PulseLoader({ size = 'md', text, subtext, className = '' }: LoaderProps) {
  const sizeMap = {
    sm: { container: 'w-8 h-8', icon: 'w-4 h-4', border: 'border-2' },
    md: { container: 'w-12 h-12', icon: 'w-6 h-6', border: 'border-2' },
    lg: { container: 'w-16 h-16', icon: 'w-8 h-8', border: 'border-3' },
    xl: { container: 'w-24 h-24', icon: 'w-12 h-12', border: 'border-4' },
  }

  const currentSize = sizeMap[size] || sizeMap.md

  return (
    <div
      suppressHydrationWarning
      className={`flex flex-col items-center justify-center text-center mx-auto my-auto py-8 space-y-4 ${className}`}
    >
      <div
        suppressHydrationWarning
        className={`relative ${currentSize.container} flex items-center justify-center mx-auto`}
      >
        {/* Outer glowing gradient ring */}
        <div
          suppressHydrationWarning
          className={`absolute inset-0 rounded-full border-t-indigo-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin ${currentSize.border} shadow-lg shadow-indigo-500/20`}
        />

        {/* Inner reverse rotating ring */}
        <div
          suppressHydrationWarning
          className={`absolute inset-1 rounded-full border-t-transparent border-r-transparent border-b-violet-400 border-l-emerald-400 animate-spin-reverse ${currentSize.border} opacity-80`}
        />

        {/* Center glowing icon */}
        <div
          suppressHydrationWarning
          className="relative z-10 animate-pulse-glow text-indigo-400 flex items-center justify-center"
        >
          <QrCode className={currentSize.icon} />
        </div>
      </div>

      {text && (
        <div suppressHydrationWarning className="text-center space-y-1 max-w-xs mx-auto">
          <p
            suppressHydrationWarning
            className="text-sm font-semibold text-slate-200 tracking-wide flex items-center justify-center space-x-1"
          >
            <span>{text}</span>
            <span className="inline-flex animate-pulse">...</span>
          </p>
          {subtext && (
            <p suppressHydrationWarning className="text-xs text-slate-400 font-medium">
              {subtext}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export function PageLoader({
  text = 'Loading QRFlow workspace...',
  subtext = 'Securing session and loading workspace data',
  fullScreen = false,
}: {
  text?: string
  subtext?: string
  fullScreen?: boolean
}) {
  return (
    <div
      suppressHydrationWarning
      className={`flex w-full flex-col items-center justify-center text-center mx-auto my-auto py-16 px-4 ${
        fullScreen ? 'min-h-screen bg-slate-950 text-slate-50' : 'min-h-[70vh]'
      }`}
    >
      <div
        suppressHydrationWarning
        className="relative flex flex-col items-center justify-center space-y-6 max-w-sm w-full mx-auto"
      >
        {/* Soft borderless ambient radial glow */}
        <div
          suppressHydrationWarning
          className="absolute -inset-10 -z-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/25 via-purple-500/10 to-transparent pointer-events-none blur-xl"
        />

        {/* Dual Orbiting Rings Loader */}
        <div suppressHydrationWarning className="relative w-20 h-20 flex items-center justify-center mx-auto">
          <div
            suppressHydrationWarning
            className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-purple-500 border-b-transparent border-l-transparent animate-spin shadow-lg shadow-indigo-500/30"
          />
          <div
            suppressHydrationWarning
            className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-transparent border-b-violet-400 border-l-cyan-400 animate-spin-reverse opacity-85"
          />

          <div
            suppressHydrationWarning
            className="relative z-10 p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-400 shadow-inner border border-indigo-500/30 animate-pulse-glow flex items-center justify-center"
          >
            <QrCode className="w-8 h-8" />
          </div>
        </div>

        <div suppressHydrationWarning className="text-center space-y-1.5 max-w-sm mx-auto">
          <h3
            suppressHydrationWarning
            className="text-base font-bold text-white tracking-tight flex items-center justify-center space-x-2"
          >
            <span>{text}</span>
            <span className="inline-flex animate-pulse">...</span>
          </h3>
          {subtext && (
            <p suppressHydrationWarning className="text-xs text-slate-400 font-medium">
              {subtext}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export function ButtonSpinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <span suppressHydrationWarning className={`inline-block relative ${className}`}>
      <span
        suppressHydrationWarning
        className="absolute inset-0 rounded-full border-2 border-current border-t-transparent animate-spin"
      />
    </span>
  )
}
