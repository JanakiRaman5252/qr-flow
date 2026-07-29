'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, QrCode, ExternalLink, Download, Trash2, Copy, BarChart3, Star, Loader2 } from 'lucide-react'
import { QRDownloadModal } from '@/components/qr/qr-download-modal'

interface QRCodeItem {
  id: string
  title: string
  shortCode: string
  type: string
  destinationUrl: string
  scanCount: number
  fgColor?: string
  bgColor?: string
  logoUrl?: string | null
  isFavorite: boolean
  createdAt: string
}

const typeColors: Record<string, string> = {
  WEBSITE: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  WIFI: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  PDF: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  RESTAURANT_MENU: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  VCARD: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

export default function QRListPage() {
  const [search, setSearch] = useState('')
  const [codes, setCodes] = useState<QRCodeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeDownloadQR, setActiveDownloadQR] = useState<QRCodeItem | null>(null)

  const fetchQRCodes = async () => {
    try {
      const res = await fetch(`/api/qr${search ? `?search=${encodeURIComponent(search)}` : ''}`)
      const json = await res.json()
      if (json.success) {
        setCodes(json.data)
      }
    } catch (err) {
      console.error('Failed to fetch QR codes:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQRCodes()
  }, [search])

  const handleCopy = (shortCode: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/q/${shortCode}`)
    alert(`Copied shortlink: ${window.location.origin}/q/${shortCode}`)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this QR code?')) return

    try {
      const res = await fetch(`/api/qr?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setCodes(codes.filter((c) => c.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete QR:', err)
    }
  }

  return (
    <div className="p-8 space-y-6 bg-slate-950 text-slate-50 min-h-screen">
      {/* Download Modal */}
      {activeDownloadQR && (
        <QRDownloadModal
          isOpen={!!activeDownloadQR}
          onClose={() => setActiveDownloadQR(null)}
          shortCode={activeDownloadQR.shortCode}
          title={activeDownloadQR.title}
          destinationUrl={activeDownloadQR.destinationUrl}
          fgColor={activeDownloadQR.fgColor}
          bgColor={activeDownloadQR.bgColor}
          logoUrl={activeDownloadQR.logoUrl}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Dynamic QR Codes</h1>
          <p className="text-slate-400 text-sm mt-1">{codes.length} dynamic QR codes in your workspace</p>
        </div>
        <Link
          href="/dashboard/qr/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New QR
        </Link>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, shortcode, or target URL..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* QR List */}
      {isLoading ? (
        <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-2 font-medium">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span>Loading QR codes...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.length === 0 ? (
            <div className="py-24 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <QrCode className="w-12 h-12 text-slate-700 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No QR codes found</p>
              <Link
                href="/dashboard/qr/new"
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-md shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" /> Create your first QR
              </Link>
            </div>
          ) : (
            codes.map((qr) => (
              <div
                key={qr.id}
                className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all"
              >
                {/* QR Icon */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 shrink-0">
                  <QrCode className="w-8 h-8 text-indigo-400" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{qr.title}</span>
                    {qr.isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${typeColors[qr.type] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {qr.type.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-1 truncate">
                    /q/{qr.shortCode} → <span className="text-slate-400">{qr.destinationUrl}</span>
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-1.5 text-sm text-white font-semibold shrink-0 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>{qr.scanCount.toLocaleString()} scans</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Download QR Button */}
                  <button
                    onClick={() => setActiveDownloadQR(qr)}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download QR</span>
                  </button>

                  <button
                    onClick={() => handleCopy(qr.shortCode)}
                    title="Copy QR Shortlink"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <a
                    href={`/q/${qr.shortCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Test Redirect"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  <button
                    onClick={() => handleDelete(qr.id)}
                    title="Delete QR"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
