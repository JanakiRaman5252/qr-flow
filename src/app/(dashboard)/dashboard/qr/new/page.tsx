'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, Globe, Wifi, Mail, Phone, FileText, Share2, ArrowLeft, Check, Loader2, AlertCircle, Upload, Folder } from 'lucide-react'
import { QRType } from '@/lib/qr-generator'
import { QRPreviewCanvas } from '@/components/qr/qr-preview-canvas'

interface FolderItem {
  id: string
  name: string
}

const qrTypes: { id: QRType; label: string; icon: any; category: string }[] = [
  { id: 'WEBSITE', label: 'Website URL', icon: Globe, category: 'General' },
  { id: 'WIFI', label: 'Wi-Fi Network', icon: Wifi, category: 'General' },
  { id: 'EMAIL', label: 'Email Address', icon: Mail, category: 'Contact' },
  { id: 'PHONE', label: 'Phone Call', icon: Phone, category: 'Contact' },
  { id: 'SMS', label: 'SMS Message', icon: Share2, category: 'Contact' },
  { id: 'TEXT', label: 'Plain Text', icon: FileText, category: 'General' },
  { id: 'YOUTUBE', label: 'YouTube Channel', icon: Share2, category: 'Social' },
  { id: 'INSTAGRAM', label: 'Instagram Profile', icon: Share2, category: 'Social' },
  { id: 'LINKEDIN', label: 'LinkedIn Page', icon: Share2, category: 'Social' },
]

export default function CreateQRPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<QRType>('WEBSITE')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [frameText, setFrameText] = useState('SCAN ME')
  const [folderId, setFolderId] = useState('')
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const previewShortCode = useMemo(() => Math.random().toString(36).substring(2, 9), [])

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://qrflow.io'
  const trackablePreviewUrl = `${origin}/q/${previewShortCode}`

  useEffect(() => {
    async function loadFolders() {
      try {
        const res = await fetch('/api/folders')
        const json = await res.json()
        if (json.success) setFolders(json.data)
      } catch (err) {
        console.error('Failed to load folders:', err)
      }
    }
    loadFolders()
  }, [])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setLogoUrl(event.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type: selectedType,
          destinationUrl: url,
          description,
          fgColor,
          bgColor,
          logoUrl,
          frameText,
          folderId: folderId || undefined,
        }),
      })

      const json = await res.json()

      if (!json.success) {
        setError(json.error || 'Failed to create QR code')
        setIsSubmitting(false)
        return
      }

      router.push('/dashboard/qr')
      router.refresh()
    } catch (err) {
      console.error('Failed to create QR:', err)
      setError('An unexpected error occurred.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-950 text-slate-50 min-h-screen">
      {/* Top Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Create & Customize Dynamic QR Code</h1>
          <p className="text-sm text-slate-400">Choose type, upload your logo, select brand colors, assign folders, and download in PNG, SVG, or PDF.</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Type Picker */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">1. Select QR Code Type</h2>
            <div className="grid grid-cols-3 gap-3">
              {qrTypes.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/10'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Destination Form */}
          <form onSubmit={handleCreate} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">2. Configure Destination & Details</h2>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Campaign / QR Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Vivo Official Campaign"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Destination URL</label>
                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.vivo.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Assign to Folder (Optional)</label>
                <select
                  value={folderId}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No Folder (Unassigned)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Customization Colors & Logo */}
            <div className="pt-4 border-t border-slate-800 space-y-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">3. Brand Colors & Logo Overlay</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center space-x-6">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Foreground</label>
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Background</label>
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Frame Call-To-Action</label>
                  <select
                    value={frameText}
                    onChange={(e) => setFrameText(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="SCAN ME">SCAN ME</option>
                    <option value="SCAN TO ORDER">SCAN TO ORDER</option>
                    <option value="VISIT WEBSITE">VISIT WEBSITE</option>
                    <option value="CONNECT WIFI">CONNECT WIFI</option>
                    <option value="">No Frame Text</option>
                  </select>
                </div>
              </div>

              {/* Logo Upload Box */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Upload Center Logo / Brand Mark</label>
                <div className="flex items-center gap-4">
                  <label className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 hover:bg-slate-950 cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs text-slate-300 font-medium">
                      {logoUrl ? 'Change Logo Image' : 'Choose PNG/JPEG Logo...'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>

                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="text-xs text-red-400 hover:underline shrink-0"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to Database & Redis...</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Save & Publish Dynamic QR</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Preview & Download Column */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 sticky top-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Preview & Download</h3>
            
            <QRPreviewCanvas
              content={trackablePreviewUrl}
              fgColor={fgColor}
              bgColor={bgColor}
              logoUrl={logoUrl}
              frameText={frameText}
              width={220}
            />

            <div className="w-full text-left space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs text-slate-500 font-mono block truncate">
                Redirect Target: {url || 'https://www.vivo.com'}
              </span>
              <div className="flex items-center space-x-2 text-xs text-emerald-400">
                <Check className="w-3.5 h-3.5" />
                <span>Trackable Shortlink Encoded</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
