'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  QrCode,
  Globe,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  FileText,
  Share2,
  ArrowLeft,
  Check,
  Loader2,
  AlertCircle,
  Upload,
  Folder,
  MapPin,
  Contact,
  Zap,
  ArrowRight,
} from 'lucide-react'
import { QRType, generateQRRawContent } from '@/lib/qr-generator'
import { QRPreviewCanvas } from '@/components/qr/qr-preview-canvas'

interface FolderItem {
  id: string
  name: string
}

interface TagItem {
  id: string
  name: string
  color: string
}

interface UpgradeDetails {
  limit: number
  usage: number
  recommendedPlan: string
  message: string
}

const qrTypesConfig: { id: QRType; label: string; icon: any; category: string; description: string }[] = [
  { id: 'WEBSITE', label: 'Website URL', icon: Globe, category: 'General', description: 'Link to any website or landing page' },
  { id: 'WIFI', label: 'Wi-Fi Network', icon: Wifi, category: 'General', description: 'Connect users to Wi-Fi automatically' },
  { id: 'EMAIL', label: 'Email Address', icon: Mail, category: 'Contact', description: 'Send pre-written emails instantly' },
  { id: 'PHONE', label: 'Phone Call', icon: Phone, category: 'Contact', description: 'Direct dial phone call' },
  { id: 'SMS', label: 'SMS Message', icon: MessageSquare, category: 'Contact', description: 'Pre-filled text message' },
  { id: 'WHATSAPP', label: 'WhatsApp Chat', icon: MessageSquare, category: 'Contact', description: 'Open WhatsApp chat directly' },
  { id: 'TEXT', label: 'Plain Text', icon: FileText, category: 'General', description: 'Display text or notes' },
  { id: 'VCARD', label: 'vCard Contact', icon: Contact, category: 'Contact', description: 'Digital business card with full details' },
  { id: 'GOOGLE_MAPS', label: 'Location Maps', icon: MapPin, category: 'General', description: 'Google Maps location link' },
  { id: 'YOUTUBE', label: 'YouTube Channel', icon: Share2, category: 'Social', description: 'Link to YouTube video or channel' },
  { id: 'INSTAGRAM', label: 'Instagram', icon: Share2, category: 'Social', description: 'Link to Instagram profile' },
  { id: 'LINKEDIN', label: 'LinkedIn', icon: Share2, category: 'Social', description: 'Link to LinkedIn profile or company' },
]

export default function CreateQRPage() {
  const router = useRouter()
  const [selectedType, setSelectedType] = useState<QRType>('WEBSITE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  // Specialized Input Fields
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [email, setEmail] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [phone, setPhone] = useState('')
  const [smsMessage, setSmsMessage] = useState('')
  const [wifiSsid, setWifiSsid] = useState('')
  const [wifiPassword, setWifiPassword] = useState('')
  const [wifiEncryption, setWifiEncryption] = useState<'WPA' | 'WEP' | 'nopass'>('WPA')
  const [vCardName, setVCardName] = useState('')
  const [vCardEmail, setVCardEmail] = useState('')
  const [vCardPhone, setVCardPhone] = useState('')
  const [vCardCompany, setVCardCompany] = useState('')
  const [vCardTitle, setVCardTitle] = useState('')
  const [socialHandle, setSocialHandle] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  // Styling & Organization
  const [fgColor, setFgColor] = useState('#000000')
  const [bgColor, setBgColor] = useState('#FFFFFF')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [frameText, setFrameText] = useState('SCAN ME')
  const [folderId, setFolderId] = useState('')
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [upgradeDetails, setUpgradeDetails] = useState<UpgradeDetails | null>(null)

  const previewShortCode = useMemo(() => Math.random().toString(36).substring(2, 9), [])

  // Compute final destination URL dynamically based on type
  const computedDestinationUrl = useMemo(() => {
    return generateQRRawContent({
      type: selectedType,
      url: url || 'https://qrflow.io',
      text,
      email,
      subject: emailSubject,
      body: emailBody,
      phone,
      sms: smsMessage,
      wifiSsid,
      wifiPassword,
      wifiEncryption,
      vCardName,
      vCardEmail,
      vCardPhone,
      vCardCompany,
      vCardTitle,
      socialHandle,
      latitude,
      longitude,
    })
  }, [
    selectedType,
    url,
    text,
    email,
    emailSubject,
    emailBody,
    phone,
    smsMessage,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    vCardName,
    vCardEmail,
    vCardPhone,
    vCardCompany,
    vCardTitle,
    socialHandle,
    latitude,
    longitude,
  ])

  useEffect(() => {
    async function loadOptionsAndUsage() {
      try {
        const [fRes, tRes, uRes] = await Promise.all([
          fetch('/api/folders'),
          fetch('/api/tags'),
          fetch('/api/billing/usage'),
        ])
        const [fJson, tJson, uJson] = await Promise.all([fRes.json(), tRes.json(), uRes.json()])

        if (fJson.success) setFolders(fJson.data)
        if (tJson.success) setTags(tJson.data)

        // Check if QR code limit is already reached on page load
        if (uJson.success && Array.isArray(uJson.data)) {
          const qrMetric = uJson.data.find((m: any) => m.metric === 'QR_CODE')
          if (qrMetric && !qrMetric.isUnlimited && qrMetric.remaining <= 0) {
            setUpgradeDetails({
              limit: qrMetric.limit,
              usage: qrMetric.usage,
              recommendedPlan: 'pro',
              message: `You have reached your QR code limit (${qrMetric.usage} of ${qrMetric.limit} used). Upgrade your plan to create more QR codes.`,
            })
          }
        }
      } catch (err) {
        console.error('Failed to load options/usage:', err)
      }
    }
    loadOptionsAndUsage()
  }, [])

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(selectedTagIds.filter((id) => id !== tagId))
    } else {
      setSelectedTagIds([...selectedTagIds, tagId])
    }
  }

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
    setUpgradeDetails(null)

    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `${selectedType} QR Code`,
          type: selectedType,
          destinationUrl: computedDestinationUrl,
          description,
          fgColor,
          bgColor,
          logoUrl,
          frameText,
          folderId: folderId || undefined,
          tagIds: selectedTagIds,
        }),
      })

      const json = await res.json()

      if (!res.ok || json.error === true || json.code || !json.success) {
        const errorMsg =
          typeof json.message === 'string' && json.message
            ? json.message
            : typeof json.error === 'string'
            ? json.error
            : 'You have reached your QR code limit. Upgrade your plan to create more QR codes.'

        setError(errorMsg)

        if (
          json.upgradeRequired ||
          json.code === 'PLAN_LIMIT_REACHED' ||
          json.error === true ||
          !res.ok
        ) {
          setUpgradeDetails({
            limit: typeof json.limit === 'number' ? json.limit : 5,
            usage: typeof json.usage === 'number' ? json.usage : 5,
            recommendedPlan: json.recommendedPlan || 'pro',
            message: errorMsg,
          })
        }

        setIsSubmitting(false)
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
        }, 50)
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
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
      {/* Top Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => router.back()}
          className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Create & Customize Dynamic QR Code</h1>
          <p className="text-sm text-slate-400">
            Select specialized QR code type, configure details, customize colors & logo, and generate.
          </p>
        </div>
      </div>

      {/* Prominent Upgrade Banner if Plan Limit Reached */}
      {upgradeDetails ? (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border-2 border-amber-500/40 space-y-4 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                <Zap className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-black text-white">
                    Plan Limit Reached ({upgradeDetails.usage} / {upgradeDetails.limit} QRs Used)
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    UPGRADE REQUIRED
                  </span>
                </div>
                <p className="text-xs text-slate-300">{upgradeDetails.message}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-amber-500/20">
            <p className="text-xs text-slate-400 font-medium">
              Upgrade to Pro or Business plan for unlimited QR codes, custom branding, and real-time scan analytics.
            </p>
            <Link
              href="/dashboard/billing"
              className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-slate-950 font-black text-xs transition-all shadow-xl shrink-0"
            >
              <span>Upgrade Plan Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold shadow-lg">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Inputs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Type Picker */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 backdrop-blur-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              1. Select QR Code Type
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {qrTypesConfig.map((type) => {
                const Icon = type.icon
                const isSelected = selectedType === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setSelectedType(type.id)}
                    className={`flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-indigo-600/10 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="text-xs font-bold text-white block">{type.label}</span>
                    <span className="text-[10px] text-slate-500 truncate block mt-0.5 w-full">
                      {type.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Dynamic Specialized Destination Configuration Form */}
          <form onSubmit={handleCreate} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 backdrop-blur-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              2. Configure Content & Details ({qrTypesConfig.find((t) => t.id === selectedType)?.label})
            </h2>

            {/* Title & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">QR Title / Campaign Name</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Marketing Campaign"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Assign to Folder (Optional)</label>
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

            {/* SPECIALIZED INPUT FIELDS BY TYPE */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
              {selectedType === 'WEBSITE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Website Destination URL</label>
                  <input
                    type="url"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.yourwebsite.com"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}

              {selectedType === 'WIFI' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Wi-Fi Network Name (SSID)</label>
                    <input
                      type="text"
                      required
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      placeholder="e.g. Office_Guest_WiFi"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Wi-Fi Password</label>
                      <input
                        type="password"
                        value={wifiPassword}
                        onChange={(e) => setWifiPassword(e.target.value)}
                        placeholder="Network Password"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Encryption Type</label>
                      <select
                        value={wifiEncryption}
                        onChange={(e) => setWifiEncryption(e.target.value as any)}
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3 (Default)</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">No Password (Open)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {selectedType === 'EMAIL' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Recipient Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="support@company.com"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Subject (Optional)</label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Inquiry about services"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Pre-filled Email Body</label>
                    <textarea
                      rows={3}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Hello, I would like to know more about..."
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'PHONE' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Phone Number to Call</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}

              {selectedType === 'SMS' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Pre-filled SMS Message</label>
                    <textarea
                      rows={3}
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="e.g. Please subscribe me to your updates"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'WHATSAPP' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">WhatsApp Phone Number (With Country Code)</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +919876543210"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Pre-filled WhatsApp Message</label>
                    <textarea
                      rows={3}
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="Hi, I saw your QR code and want to connect!"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'TEXT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">Plain Text Content</label>
                  <textarea
                    rows={4}
                    required
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter any text, code, or secret message here..."
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}

              {selectedType === 'VCARD' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Full Name</label>
                      <input
                        type="text"
                        required
                        value={vCardName}
                        onChange={(e) => setVCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Job Title</label>
                      <input
                        type="text"
                        value={vCardTitle}
                        onChange={(e) => setVCardTitle(e.target.value)}
                        placeholder="Product Manager"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
                      <input
                        type="email"
                        value={vCardEmail}
                        onChange={(e) => setVCardEmail(e.target.value)}
                        placeholder="john@company.com"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">Phone Number</label>
                      <input
                        type="tel"
                        value={vCardPhone}
                        onChange={(e) => setVCardPhone(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Company Name</label>
                    <input
                      type="text"
                      value={vCardCompany}
                      onChange={(e) => setVCardCompany(e.target.value)}
                      placeholder="Acme Corporation"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              )}

              {selectedType === 'GOOGLE_MAPS' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Google Maps URL or Coordinates</label>
                    <input
                      type="text"
                      required
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://maps.google.com/?q=37.7749,-122.4194"
                      className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {(selectedType === 'YOUTUBE' || selectedType === 'INSTAGRAM' || selectedType === 'LINKEDIN') && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    {selectedType} Handle or Full URL
                  </label>
                  <input
                    type="text"
                    required
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={
                      selectedType === 'YOUTUBE'
                        ? 'https://youtube.com/@yourchannel'
                        : selectedType === 'INSTAGRAM'
                        ? 'https://instagram.com/yourprofile'
                        : 'https://linkedin.com/in/yourprofile'
                    }
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              )}
            </div>

            {/* Tag Selection */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-300 mb-2">Attach Tags (Optional)</label>
              {tags.length === 0 ? (
                <p className="text-xs text-slate-500">No tags created yet. Manage tags in Folders & Tags.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-pink-400" />}
                        <span>#{tag.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Visual Styling Options */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Visual Style & Logo Branding
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Foreground Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-9 h-9 rounded-xl bg-transparent cursor-pointer border border-slate-800"
                    />
                    <input
                      type="text"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Background Color</label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-9 h-9 rounded-xl bg-transparent cursor-pointer border border-slate-800"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Frame CTA Text</label>
                <input
                  type="text"
                  value={frameText}
                  onChange={(e) => setFrameText(e.target.value)}
                  placeholder="e.g. SCAN ME"
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Upload Logo (Center overlay)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-indigo-400 hover:file:bg-slate-800 cursor-pointer"
                  />
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl(null)}
                      className="text-xs text-rose-400 hover:underline font-medium"
                    >
                      Remove Logo
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (upgradeDetails !== null && upgradeDetails.usage >= upgradeDetails.limit)}
              className={`w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm shadow-xl transition-all flex items-center justify-center space-x-2 ${
                upgradeDetails && upgradeDetails.usage >= upgradeDetails.limit
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/25'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Dynamic QR Code...</span>
                </>
              ) : upgradeDetails && upgradeDetails.usage >= upgradeDetails.limit ? (
                <>
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Limit Reached — Upgrade Plan to Create</span>
                </>
              ) : (
                <>
                  <QrCode className="w-4 h-4" />
                  <span>Create & Save QR Code</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Real-Time Live Preview Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl sticky top-8 space-y-6 text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Real-Time QR Preview</h2>

            <div className="flex justify-center py-4">
              <QRPreviewCanvas
                content={computedDestinationUrl}
                fgColor={fgColor}
                bgColor={bgColor}
                logoUrl={logoUrl}
                frameText={frameText}
                width={220}
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 text-left space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400">Selected Type:</span>
                <span className="font-extrabold text-indigo-400">{selectedType}</span>
              </div>
              <div className="text-[11px] text-slate-400 break-all font-mono">
                <span className="text-slate-500 block">Formed Payload:</span>
                {computedDestinationUrl}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
