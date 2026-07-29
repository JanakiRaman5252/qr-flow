'use client'

import { useState } from 'react'
import { X, QrCode } from 'lucide-react'
import { QRPreviewCanvas } from './qr-preview-canvas'

interface QRDownloadModalProps {
  isOpen: boolean
  onClose: () => void
  shortCode: string
  title: string
  destinationUrl: string
  fgColor?: string
  bgColor?: string
  logoUrl?: string | null
}

export function QRDownloadModal({
  isOpen,
  onClose,
  shortCode,
  title,
  destinationUrl,
  fgColor = '#000000',
  bgColor = '#FFFFFF',
  logoUrl,
}: QRDownloadModalProps) {
  if (!isOpen) return null

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qrflow.io'
  const trackableUrl = `${origin}/q/${shortCode}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-indigo-400" />
            <h3 className="text-lg font-bold text-white truncate max-w-xs">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Preview Canvas with Trackable URL */}
        <div className="flex justify-center py-2">
          <QRPreviewCanvas
            content={trackableUrl}
            fgColor={fgColor}
            bgColor={bgColor}
            logoUrl={logoUrl}
            frameText="SCAN ME"
            width={240}
          />
        </div>

        <div className="pt-2 border-t border-slate-800 space-y-1 text-center">
          <p className="text-xs font-mono text-indigo-400 font-semibold truncate">
            Trackable URL: {trackableUrl}
          </p>
          <p className="text-[11px] text-slate-500 truncate">
            Redirects to: {destinationUrl}
          </p>
        </div>
      </div>
    </div>
  )
}
