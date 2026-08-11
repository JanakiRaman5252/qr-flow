'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, QrCode, ExternalLink, Download, Trash2, Copy, BarChart3, Star, Loader2, Folder as FolderIcon, Tag as TagIcon, Edit3, Filter } from 'lucide-react'
import { QRDownloadModal } from '@/components/qr/qr-download-modal'
import { QROrganizeModal } from '@/components/qr/qr-organize-modal'

interface FolderItem {
  id: string
  name: string
  color: string
}

interface TagItem {
  id: string
  name: string
  color: string
}

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
  folderId?: string | null
  folder?: FolderItem | null
  tags?: Array<{ tagId: string; tag: TagItem }>
}

const typeColors: Record<string, string> = {
  WEBSITE: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  WIFI: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  PDF: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  RESTAURANT_MENU: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  VCARD: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
}

function QRListContent() {
  const searchParams = useSearchParams()
  const initialFolder = searchParams?.get('folderId') || 'all'
  const initialTag = searchParams?.get('tagId') || 'all'

  const [search, setSearch] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string>(initialFolder)
  const [selectedTagId, setSelectedTagId] = useState<string>(initialTag)

  const [folders, setFolders] = useState<FolderItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [codes, setCodes] = useState<QRCodeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [activeDownloadQR, setActiveDownloadQR] = useState<QRCodeItem | null>(null)
  const [organizeQR, setOrganizeQR] = useState<QRCodeItem | null>(null)

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const [fRes, tRes] = await Promise.all([fetch('/api/folders'), fetch('/api/tags')])
        const [fJson, tJson] = await Promise.all([fRes.json(), tRes.json()])

        if (fJson.success) setFolders(fJson.data)
        if (tJson.success) setTags(tJson.data)
      } catch (err) {
        console.error('Failed to load filter options:', err)
      }
    }
    loadFilterOptions()
  }, [])

  const fetchQRCodes = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedFolderId && selectedFolderId !== 'all') params.set('folderId', selectedFolderId)
      if (selectedTagId && selectedTagId !== 'all') params.set('tagId', selectedTagId)

      const res = await fetch(`/api/qr?${params.toString()}`)
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
  }, [search, selectedFolderId, selectedTagId])

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
    <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
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

      {/* Organize Modal */}
      {organizeQR && (
        <QROrganizeModal
          isOpen={!!organizeQR}
          onClose={() => setOrganizeQR(null)}
          onSuccess={fetchQRCodes}
          qr={organizeQR}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Dynamic QR Codes</h1>
          <p className="text-slate-400 text-sm mt-1">{codes.length} dynamic QR codes in workspace</p>
        </div>
        <Link
          href="/dashboard/qr/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all"
        >
          <Plus className="w-4 h-4" />
          Create New QR
        </Link>
      </div>

      {/* Search & Filters Controls */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, shortcode, URL, folder, or tag..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Folder Filter */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <FolderIcon className="w-4 h-4 text-indigo-400 shrink-0" />
          <select
            value={selectedFolderId}
            onChange={(e) => setSelectedFolderId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none py-1.5 cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-white">All Folders</option>
            <option value="unassigned" className="bg-slate-900 text-white">Unassigned</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id} className="bg-slate-900 text-white">
                Folder: {f.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1">
          <TagIcon className="w-4 h-4 text-pink-400 shrink-0" />
          <select
            value={selectedTagId}
            onChange={(e) => setSelectedTagId(e.target.value)}
            className="bg-transparent text-xs font-semibold text-slate-200 focus:outline-none py-1.5 cursor-pointer"
          >
            <option value="all" className="bg-slate-900 text-white">All Tags</option>
            {tags.map((t) => (
              <option key={t.id} value={t.id} className="bg-slate-900 text-white">
                #{t.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Indicators */}
      {(selectedFolderId !== 'all' || selectedTagId !== 'all') && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Active Filters:</span>
          {selectedFolderId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              Folder: {selectedFolderId === 'unassigned' ? 'Unassigned' : folders.find(f => f.id === selectedFolderId)?.name || selectedFolderId}
              <button onClick={() => setSelectedFolderId('all')} className="ml-1 hover:text-white">×</button>
            </span>
          )}
          {selectedTagId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/20">
              Tag: #{tags.find(t => t.id === selectedTagId)?.name || selectedTagId}
              <button onClick={() => setSelectedTagId('all')} className="ml-1 hover:text-white">×</button>
            </span>
          )}
        </div>
      )}

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
              <p className="text-slate-400 font-medium">No QR codes found for your search or filter</p>
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

                    {/* Folder Badge */}
                    {qr.folder && (
                      <button
                        onClick={() => setSelectedFolderId(qr.folder!.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all"
                        style={{
                          backgroundColor: `${qr.folder.color || '#6366F1'}15`,
                          color: qr.folder.color || '#6366F1',
                          borderColor: `${qr.folder.color || '#6366F1'}35`,
                        }}
                      >
                        <FolderIcon className="w-3 h-3" />
                        <span>{qr.folder.name}</span>
                      </button>
                    )}

                    {/* Tags Pills */}
                    {qr.tags && qr.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {qr.tags.map(({ tag }) => (
                          <button
                            key={tag.id}
                            onClick={() => setSelectedTagId(tag.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border transition-all"
                            style={{
                              backgroundColor: `${tag.color || '#EC4899'}15`,
                              color: tag.color || '#EC4899',
                              borderColor: `${tag.color || '#EC4899'}35`,
                            }}
                          >
                            <span>#{tag.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
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

                  {/* Organize / Edit Button */}
                  <button
                    onClick={() => setOrganizeQR(qr)}
                    title="Organize Folder & Tags"
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  >
                    <Edit3 className="w-4 h-4" />
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

export default function QRListPage() {
  return (
    <Suspense fallback={
      <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-2 font-medium">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
        <span>Loading...</span>
      </div>
    }>
      <QRListContent />
    </Suspense>
  )
}

