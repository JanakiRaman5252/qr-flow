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
  MapPin,
  Contact,
  Zap,
  ArrowRight,
  Palette,
  Sparkles,
  Layers,
  Square,
  Circle,
  Diamond,
  Image as ImageIcon,
  CheckCircle2,
} from 'lucide-react'
import { QRType, generateQRRawContent } from '@/lib/qr-generator'
import { QRPreviewCanvas } from '@/components/qr/qr-preview-canvas'
import {
  DEFAULT_QR_DESIGN,
  QR_THEME_PRESETS,
  PRESET_ICONS,
  type QRDesignConfig,
  type QRDotsStyle,
  type QRCornerSquareStyle,
  type QRCornerDotStyle,
  type QRGradientType,
  type QRFrameTemplate,
  type QRLogoShape,
  type QRThemePreset,
} from '@/lib/qr-design'

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

const qrTypesConfig: {
  id: QRType
  label: string
  icon: any
  category: string
  description: string
}[] = [
  {
    id: 'WEBSITE',
    label: 'Website URL',
    icon: Globe,
    category: 'General',
    description: 'Link to any website or landing page',
  },
  {
    id: 'WIFI',
    label: 'Wi-Fi Network',
    icon: Wifi,
    category: 'General',
    description: 'Connect users to Wi-Fi automatically',
  },
  {
    id: 'EMAIL',
    label: 'Email Address',
    icon: Mail,
    category: 'Contact',
    description: 'Send pre-written emails instantly',
  },
  {
    id: 'PHONE',
    label: 'Phone Call',
    icon: Phone,
    category: 'Contact',
    description: 'Direct dial phone call',
  },
  {
    id: 'SMS',
    label: 'SMS Message',
    icon: MessageSquare,
    category: 'Contact',
    description: 'Pre-filled text message',
  },
  {
    id: 'WHATSAPP',
    label: 'WhatsApp Chat',
    icon: MessageSquare,
    category: 'Contact',
    description: 'Open WhatsApp chat directly',
  },
  {
    id: 'TEXT',
    label: 'Plain Text',
    icon: FileText,
    category: 'General',
    description: 'Display text or notes',
  },
  {
    id: 'VCARD',
    label: 'vCard Contact',
    icon: Contact,
    category: 'Contact',
    description: 'Digital business card with full details',
  },
  {
    id: 'GOOGLE_MAPS',
    label: 'Location Maps',
    icon: MapPin,
    category: 'General',
    description: 'Google Maps location link',
  },
  {
    id: 'YOUTUBE',
    label: 'YouTube Channel',
    icon: Share2,
    category: 'Social',
    description: 'Link to YouTube video or channel',
  },
  {
    id: 'INSTAGRAM',
    label: 'Instagram',
    icon: Share2,
    category: 'Social',
    description: 'Link to Instagram profile',
  },
  {
    id: 'LINKEDIN',
    label: 'LinkedIn',
    icon: Share2,
    category: 'Social',
    description: 'Link to LinkedIn profile or company',
  },
]

type DesignTab = 'presets' | 'colors' | 'shapes' | 'frames' | 'logo'

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
  const [wifiEncryption, setWifiEncryption] = useState<
    'WPA' | 'WEP' | 'nopass'
  >('WPA')

  const [vCardName, setVCardName] = useState('')
  const [vCardEmail, setVCardEmail] = useState('')
  const [vCardPhone, setVCardPhone] = useState('')
  const [vCardCompany, setVCardCompany] = useState('')
  const [vCardTitle, setVCardTitle] = useState('')

  const [socialHandle, setSocialHandle] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')

  // QR Design State
  const [designConfig, setDesignConfig] =
    useState<QRDesignConfig>(DEFAULT_QR_DESIGN)

  const [activeDesignTab, setActiveDesignTab] =
    useState<DesignTab>('presets')

  const [activePresetId, setActivePresetId] =
    useState<string>('classic')

  // Folders & Tags
  const [folderId, setFolderId] = useState('')
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [tags, setTags] = useState<TagItem[]>([])
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([])

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [upgradeDetails, setUpgradeDetails] =
    useState<UpgradeDetails | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // ============================================================
  // COMPUTED QR PAYLOAD
  // ============================================================

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

  // ============================================================
  // LOAD FOLDERS / TAGS / USAGE
  // ============================================================

  useEffect(() => {
    setIsMounted(true)
    async function loadOptionsAndUsage() {
      try {
        const [fRes, tRes, uRes] = await Promise.all([
          fetch('/api/folders'),
          fetch('/api/tags'),
          fetch('/api/billing/usage'),
        ])

        const [fJson, tJson, uJson] = await Promise.all([
          fRes.json(),
          tRes.json(),
          uRes.json(),
        ])

        if (fJson.success) {
          setFolders(fJson.data)
        }

        if (tJson.success) {
          setTags(tJson.data)
        }

        if (uJson.success && Array.isArray(uJson.data)) {
          const qrMetric = uJson.data.find(
            (m: any) => m.metric === 'QR_CODE'
          )

          if (
            qrMetric &&
            !qrMetric.isUnlimited &&
            qrMetric.remaining <= 0
          ) {
            setUpgradeDetails({
              limit: qrMetric.limit,
              usage: qrMetric.usage,
              recommendedPlan: 'pro',
              message: `You have reached your QR code limit (${qrMetric.usage} of ${qrMetric.limit} used). Upgrade your plan to create more QR codes.`,
            })
          }
        }
      } catch (err) {
        console.error(
          'Failed to load options/usage:',
          err
        )
      }
    }

    loadOptionsAndUsage()
  }, [])

  // ============================================================
  // TAGS
  // ============================================================

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      setSelectedTagIds(
        selectedTagIds.filter((id) => id !== tagId)
      )
    } else {
      setSelectedTagIds([
        ...selectedTagIds,
        tagId,
      ])
    }
  }

  // ============================================================
  // PRESETS
  // ============================================================

  const applyPresetTheme = (
    preset: QRThemePreset
  ) => {
    setActivePresetId(preset.id)

    setDesignConfig((prev) => ({
      ...prev,
      ...preset.config,
    }))
  }

  // ============================================================
  // LOGO UPLOAD
  // ============================================================

  const handleLogoUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = (event) => {
      setDesignConfig((prev) => ({
        ...prev,
        logoUrl: event.target?.result as string,
      }))
    }

    reader.readAsDataURL(file)
  }

  // ============================================================
  // DESIGN UPDATE
  // ============================================================

  const updateDesign = <
    K extends keyof QRDesignConfig
  >(
    key: K,
    value: QRDesignConfig[K]
  ) => {
    setDesignConfig((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // ============================================================
  // CREATE QR
  // ============================================================

  const handleCreate = async (
    e: React.FormEvent
  ) => {
    e.preventDefault()

    setIsSubmitting(true)
    setError('')
    setUpgradeDetails(null)

    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title:
            title ||
            `${selectedType} QR Code`,

          type: selectedType,

          destinationUrl:
            computedDestinationUrl,

          description,

          fgColor:
            designConfig.fgColor,

          bgColor:
            designConfig.bgColor,

          logoUrl:
            designConfig.logoUrl,

          dotsStyle:
            designConfig.dotsStyle,

          cornerDotsStyle:
            designConfig.cornerDotStyle,

          frameTemplate:
            designConfig.frameTemplate,

          frameText:
            designConfig.frameText,

          designConfig,

          folderId:
            folderId || undefined,

          tagIds:
            selectedTagIds,
        }),
      })

      const json = await res.json()

      if (
        !res.ok ||
        json.error === true ||
        json.code ||
        !json.success
      ) {
        const errorMsg =
          typeof json.message === 'string' &&
          json.message
            ? json.message
            : typeof json.error === 'string'
            ? json.error
            : 'You have reached your QR code limit. Upgrade your plan to create more QR codes.'

        setError(errorMsg)

        if (
          json.upgradeRequired ||
          json.code ===
            'PLAN_LIMIT_REACHED' ||
          json.error === true ||
          !res.ok
        ) {
          setUpgradeDetails({
            limit:
              typeof json.limit === 'number'
                ? json.limit
                : 5,

            usage:
              typeof json.usage === 'number'
                ? json.usage
                : 5,

            recommendedPlan:
              json.recommendedPlan ||
              'pro',

            message:
              errorMsg,
          })
        }

        setIsSubmitting(false)

        setTimeout(() => {
          if (
            typeof window !==
            'undefined'
          ) {
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            })
          }
        }, 50)

        return
      }

      router.push('/dashboard/qr')
      router.refresh()
    } catch (err) {
      console.error(
        'Failed to create QR:',
        err
      )

      setError(
        'An unexpected error occurred.'
      )

      setIsSubmitting(false)
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      suppressHydrationWarning
      className="space-y-8 max-w-7xl mx-auto pb-20"
    >
      {/* ====================================================== */}
      {/* PAGE HEADER                                            */}
      {/* ====================================================== */}

      <div
        suppressHydrationWarning
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <Link
            href="/dashboard/qr"
            className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to QR Codes
          </Link>

          <h1
            suppressHydrationWarning
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight"
          >
            Create & Customize Dynamic QR Code
          </h1>

          <p
            suppressHydrationWarning
            className="text-xs sm:text-sm text-slate-400 mt-1"
          >
            Choose your destination, apply designer themes,
            and watch your QR code transform side-by-side
            in real-time.
          </p>
        </div>
      </div>

      {/* ====================================================== */}
      {/* PLAN LIMIT                                             */}
      {/* ====================================================== */}

      {upgradeDetails &&
        upgradeDetails.usage >=
          upgradeDetails.limit && (
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900 border border-amber-500/40 shadow-2xl backdrop-blur-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Zap className="w-6 h-6 animate-pulse" />
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Plan Limit Reached
                  </h3>

                  <p className="text-xs text-amber-200/80 mt-0.5">
                    {upgradeDetails.message}
                  </p>
                </div>
              </div>

              <Link
                href="/dashboard/billing"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 hover:scale-105 transition-all flex items-center justify-center space-x-1.5"
              >
                <span>
                  Upgrade Plan Now
                </span>

                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}

      {/* ====================================================== */}
      {/* ERROR                                                  */}
      {/* ====================================================== */}

      {error && !upgradeDetails && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form
        onSubmit={handleCreate}
        className="space-y-8"
      >
        {/* ==================================================== */}
        {/* SECTION 1                                             */}
        {/* ==================================================== */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* STEP 1 */}
          <div className="lg:col-span-12 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                1
              </div>

              <h2 className="text-base font-bold text-white">
                Choose QR Code Type
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {qrTypesConfig.map(
                (item) => {
                  const Icon = item.icon

                  const isSelected =
                    selectedType ===
                    item.id

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setSelectedType(
                          item.id
                        )
                      }
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-2 ${
                        isSelected
                          ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`p-2 rounded-xl ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-bold text-white">
                          {item.label}
                        </div>

                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    </button>
                  )
                }
              )}
            </div>
          </div>

          {/* STEP 2 */}
          <div className="lg:col-span-12 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                2
              </div>

              <h2 className="text-base font-bold text-white">
                Content & Destination
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  QR Title
                </label>

                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) =>
                    setTitle(
                      e.target.value
                    )
                  }
                  placeholder="e.g. Summer Promo 2026"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Folder
                </label>

                <select
                  value={folderId}
                  onChange={(e) =>
                    setFolderId(
                      e.target.value
                    )
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">
                    No Folder (Root)
                  </option>

                  {folders.map(
                    (folder) => (
                      <option
                        key={folder.id}
                        value={folder.id}
                      >
                        {folder.name}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            {/* WEBSITE */}
            {selectedType ===
              'WEBSITE' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Target Website URL
                </label>

                <input
                  type="url"
                  required
                  value={url}
                  onChange={(e) =>
                    setUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://example.com/landing"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            )}

            {/* WIFI */}
            {selectedType ===
              'WIFI' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Network Name (SSID)
                    </label>

                    <input
                      type="text"
                      required
                      value={wifiSsid}
                      onChange={(e) =>
                        setWifiSsid(
                          e.target.value
                        )
                      }
                      placeholder="Guest_WiFi"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Password
                    </label>

                    <input
                      type="text"
                      value={
                        wifiPassword
                      }
                      onChange={(e) =>
                        setWifiPassword(
                          e.target.value
                        )
                      }
                      placeholder="wifi-secret-password"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Encryption Type
                  </label>

                  <select
                    value={
                      wifiEncryption
                    }
                    onChange={(e) =>
                      setWifiEncryption(
                        e.target.value as
                          | 'WPA'
                          | 'WEP'
                          | 'nopass'
                      )
                    }
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="WPA">
                      WPA / WPA2 (Recommended)
                    </option>

                    <option value="WEP">
                      WEP
                    </option>

                    <option value="nopass">
                      None (Open Network)
                    </option>
                  </select>
                </div>
              </div>
            )}

            {/* EMAIL */}
            {selectedType ===
              'EMAIL' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Recipient Email
                  </label>

                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    placeholder="contact@company.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Subject
                    </label>

                    <input
                      type="text"
                      value={
                        emailSubject
                      }
                      onChange={(e) =>
                        setEmailSubject(
                          e.target.value
                        )
                      }
                      placeholder="Inquiry about services"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Pre-filled Body
                    </label>

                    <input
                      type="text"
                      value={emailBody}
                      onChange={(e) =>
                        setEmailBody(
                          e.target.value
                        )
                      }
                      placeholder="Hi, I'd like more details..."
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* PHONE / SMS / WHATSAPP */}
            {(selectedType ===
              'PHONE' ||
              selectedType ===
                'SMS' ||
              selectedType ===
                'WHATSAPP') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Phone Number (with country code)
                  </label>

                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>

                {(selectedType ===
                  'SMS' ||
                  selectedType ===
                    'WHATSAPP') && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Pre-filled Message
                    </label>

                    <textarea
                      rows={2}
                      value={
                        smsMessage
                      }
                      onChange={(e) =>
                        setSmsMessage(
                          e.target.value
                        )
                      }
                      placeholder="Hello, I would like to learn more..."
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TEXT */}
            {selectedType ===
              'TEXT' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Plain Text Message
                </label>

                <textarea
                  rows={3}
                  required
                  value={text}
                  onChange={(e) =>
                    setText(
                      e.target.value
                    )
                  }
                  placeholder="Enter any text or note to display..."
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}

            {/* VCARD */}
            {selectedType ===
              'VCARD' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Full Name
                    </label>

                    <input
                      type="text"
                      required
                      value={vCardName}
                      onChange={(e) =>
                        setVCardName(
                          e.target.value
                        )
                      }
                      placeholder="Jane Doe"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Job Title
                    </label>

                    <input
                      type="text"
                      value={
                        vCardTitle
                      }
                      onChange={(e) =>
                        setVCardTitle(
                          e.target.value
                        )
                      }
                      placeholder="Product Designer"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Email
                    </label>

                    <input
                      type="email"
                      value={
                        vCardEmail
                      }
                      onChange={(e) =>
                        setVCardEmail(
                          e.target.value
                        )
                      }
                      placeholder="jane@company.com"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Phone
                    </label>

                    <input
                      type="tel"
                      value={
                        vCardPhone
                      }
                      onChange={(e) =>
                        setVCardPhone(
                          e.target.value
                        )
                      }
                      placeholder="+1 234 567 8900"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Company
                  </label>

                  <input
                    type="text"
                    value={
                      vCardCompany
                    }
                    onChange={(e) =>
                      setVCardCompany(
                        e.target.value
                      )
                    }
                    placeholder="Acme Corp"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* SOCIAL / MAPS */}
            {(selectedType ===
              'YOUTUBE' ||
              selectedType ===
                'INSTAGRAM' ||
              selectedType ===
                'LINKEDIN' ||
              selectedType ===
                'GOOGLE_MAPS') && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  {selectedType ===
                  'GOOGLE_MAPS'
                    ? 'Google Maps URL or Coordinates'
                    : `${selectedType} URL or Handle`}
                </label>

                <input
                  type="text"
                  required
                  value={url}
                  onChange={(e) =>
                    setUrl(
                      e.target.value
                    )
                  }
                  placeholder={
                    selectedType ===
                    'GOOGLE_MAPS'
                      ? 'https://maps.google.com/?q=37.7749,-122.4194'
                      : selectedType ===
                        'YOUTUBE'
                      ? 'https://youtube.com/@channel'
                      : selectedType ===
                        'INSTAGRAM'
                      ? 'https://instagram.com/profile'
                      : 'https://linkedin.com/in/profile'
                  }
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* SECTION 2 — DESIGN STUDIO + LIVE PREVIEW             */}
        {/* ==================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-7 items-start">
          {/* ================================================== */}
          {/* LEFT — DESIGN STUDIO                              */}
          {/* ================================================== */}

          <div className="xl:col-span-7 min-w-0 space-y-6">
            <div className="rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl overflow-hidden shadow-xl">
              {/* Studio Header */}
              <div className="px-6 py-5 border-b border-slate-800">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-bold text-xs flex items-center justify-center">
                      3
                    </div>

                    <div>
                      <h2 className="text-base font-bold text-white">
                        QR Design & Customization Studio
                      </h2>

                      <p className="text-xs text-slate-400 mt-0.5">
                        Customize your QR code and see every change instantly.
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20">
                    <Sparkles className="w-3 h-3 text-indigo-400" />

                    <span className="text-[10px] font-bold text-indigo-300">
                      DESIGN MODE
                    </span>
                  </div>
                </div>
              </div>

              {/* Studio Controls */}
              <div className="p-5 sm:p-6 space-y-6">
                {/* Design Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-950 border border-slate-800">
                  {[
                    {
                      id: 'presets',
                      label: 'Presets',
                      icon: Sparkles,
                    },
                    {
                      id: 'colors',
                      label: 'Colors',
                      icon: Palette,
                    },
                    {
                      id: 'shapes',
                      label: 'Shapes',
                      icon: Layers,
                    },
                    {
                      id: 'frames',
                      label: 'Frames',
                      icon: Square,
                    },
                    {
                      id: 'logo',
                      label: 'Logo',
                      icon: ImageIcon,
                    },
                  ].map((tab) => {
                    const TabIcon =
                      tab.icon

                    const isActive =
                      activeDesignTab ===
                      tab.id

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() =>
                          setActiveDesignTab(
                            tab.id as DesignTab
                          )
                        }
                        className={`flex-1 min-w-[90px] flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25'
                            : 'text-slate-400 hover:text-white hover:bg-slate-900'
                        }`}
                      >
                        <TabIcon className="w-3.5 h-3.5" />

                        <span>
                          {tab.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* ================================================== */}
                {/* PRESETS                                            */}
                {/* ================================================== */}

                {activeDesignTab ===
                  'presets' && (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400">
                      Click any curated theme below to instantly style the live preview on the right.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {QR_THEME_PRESETS.map(
                        (preset) => {
                          const isSelected =
                            activePresetId ===
                            preset.id

                          return (
                            <button
                              key={
                                preset.id
                              }
                              type="button"
                              onClick={() =>
                                applyPresetTheme(
                                  preset
                                )
                              }
                              className={`p-4 rounded-2xl border text-left transition-all space-y-2.5 ${
                                isSelected
                                  ? 'bg-slate-950 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shadow-inner ${preset.previewBadge}`}
                                >
                                  QR
                                </div>

                                {isSelected && (
                                  <Check className="w-4 h-4 text-indigo-400" />
                                )}
                              </div>

                              <div>
                                <div className="text-xs font-bold text-white">
                                  {preset.name}
                                </div>

                                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                                  {
                                    preset.description
                                  }
                                </div>
                              </div>
                            </button>
                          )
                        }
                      )}
                    </div>
                  </div>
                )}

                {/* ================================================== */}
                {/* COLORS                                              */}
                {/* ================================================== */}

                {activeDesignTab ===
                  'colors' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Fill Mode
                      </label>

                      <div className="grid grid-cols-2 gap-3 max-w-sm">
                        <button
                          type="button"
                          onClick={() =>
                            updateDesign(
                              'colorType',
                              'solid'
                            )
                          }
                          className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                            designConfig.colorType ===
                            'solid'
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Solid Color
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            updateDesign(
                              'colorType',
                              'gradient'
                            )
                          }
                          className={`py-2 px-4 rounded-xl text-xs font-bold border transition-all ${
                            designConfig.colorType ===
                            'gradient'
                              ? 'bg-indigo-600 border-indigo-500 text-white shadow-md'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          Vibrant Gradient
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          {designConfig.colorType ===
                          'gradient'
                            ? 'Start Gradient Color'
                            : 'Foreground Color'}
                        </label>

                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={
                              designConfig.fgColor
                            }
                            onChange={(e) =>
                              updateDesign(
                                'fgColor',
                                e.target.value
                              )
                            }
                            className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-800"
                          />

                          <input
                            type="text"
                            value={
                              designConfig.fgColor
                            }
                            onChange={(e) =>
                              updateDesign(
                                'fgColor',
                                e.target.value
                              )
                            }
                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      {designConfig.colorType ===
                        'gradient' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            End Gradient Color
                          </label>

                          <div className="flex items-center space-x-3">
                            <input
                              type="color"
                              value={
                                designConfig.fgColor2
                              }
                              onChange={(e) =>
                                updateDesign(
                                  'fgColor2',
                                  e.target.value
                                )
                              }
                              className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-800"
                            />

                            <input
                              type="text"
                              value={
                                designConfig.fgColor2
                              }
                              onChange={(e) =>
                                updateDesign(
                                  'fgColor2',
                                  e.target.value
                                )
                              }
                              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Background Color
                        </label>

                        <div className="flex items-center space-x-3">
                          <input
                            type="color"
                            value={
                              designConfig.bgColor ===
                              'transparent'
                                ? '#FFFFFF'
                                : designConfig.bgColor
                            }
                            onChange={(e) =>
                              updateDesign(
                                'bgColor',
                                e.target.value
                              )
                            }
                            className="w-10 h-10 rounded-xl bg-transparent cursor-pointer border border-slate-800"
                          />

                          <input
                            type="text"
                            value={
                              designConfig.bgColor
                            }
                            onChange={(e) =>
                              updateDesign(
                                'bgColor',
                                e.target.value
                              )
                            }
                            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                          />
                        </div>
                      </div>

                      {designConfig.colorType ===
                        'gradient' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Gradient Direction
                          </label>

                          <select
                            value={
                              designConfig.gradientType
                            }
                            onChange={(e) =>
                              updateDesign(
                                'gradientType',
                                e.target.value as QRGradientType
                              )
                            }
                            className="w-full px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="linear-diagonal">
                              Diagonal (Top-Left to Bottom-Right)
                            </option>

                            <option value="linear-h">
                              Horizontal (Left to Right)
                            </option>

                            <option value="linear-v">
                              Vertical (Top to Bottom)
                            </option>

                            <option value="radial">
                              Radial (Center Outward)
                            </option>
                          </select>
                        </div>
                      )}
                    </div>

                    {/* Eye Colors */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Corner Eye Colors
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Outer Eye Frame Color
                          </label>

                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={
                                designConfig.eyeFrameColor ||
                                designConfig.fgColor
                              }
                              onChange={(e) =>
                                updateDesign(
                                  'eyeFrameColor',
                                  e.target.value
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-800"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateDesign(
                                  'eyeFrameColor',
                                  null
                                )
                              }
                              className="text-[11px] text-indigo-400 hover:underline"
                            >
                              Auto Match
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] text-slate-400 mb-1">
                            Inner Eye Dot Color
                          </label>

                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={
                                designConfig.eyeDotColor ||
                                designConfig.fgColor2 ||
                                designConfig.fgColor
                              }
                              onChange={(e) =>
                                updateDesign(
                                  'eyeDotColor',
                                  e.target.value
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-800"
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateDesign(
                                  'eyeDotColor',
                                  null
                                )
                              }
                              className="text-[11px] text-indigo-400 hover:underline"
                            >
                              Auto Match
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================================== */}
                {/* SHAPES                                             */}
                {/* ================================================== */}

                {activeDesignTab ===
                  'shapes' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Body Pixel / Dot Style
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                        {[
                          {
                            id: 'square',
                            label: 'Classic Square',
                            icon: Square,
                          },
                          {
                            id: 'dots',
                            label: 'Circular Dots',
                            icon: Circle,
                          },
                          {
                            id: 'rounded',
                            label: 'Smooth Rounded',
                            icon: Square,
                          },
                          {
                            id: 'extra-rounded',
                            label: 'Pill / Organic',
                            icon: Circle,
                          },
                          {
                            id: 'classy',
                            label: 'Diamond Star',
                            icon: Diamond,
                          },
                        ].map((item) => {
                          const Icon =
                            item.icon

                          const isSelected =
                            designConfig.dotsStyle ===
                            item.id

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                updateDesign(
                                  'dotsStyle',
                                  item.id as QRDotsStyle
                                )
                              }
                              className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center space-y-1.5 ${
                                isSelected
                                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-md'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <Icon className="w-5 h-5 text-indigo-400" />

                              <span className="text-[11px] font-bold">
                                {item.label}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Corner Eye Outer Frame Shape
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          {
                            id: 'square',
                            label: 'Square',
                          },
                          {
                            id: 'rounded',
                            label: 'Rounded',
                          },
                          {
                            id: 'extra-rounded',
                            label: 'Circular Ring',
                          },
                          {
                            id: 'leaf',
                            label: 'Organic Leaf',
                          },
                        ].map((item) => {
                          const isSelected =
                            designConfig.cornerSquareStyle ===
                            item.id

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                updateDesign(
                                  'cornerSquareStyle',
                                  item.id as QRCornerSquareStyle
                                )
                              }
                              className={`py-2.5 px-3 rounded-xl border text-center transition-all text-xs font-bold ${
                                isSelected
                                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              {item.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Corner Eye Center Dot Shape
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {[
                          {
                            id: 'square',
                            label: 'Square',
                          },
                          {
                            id: 'dot',
                            label: 'Circle',
                          },
                          {
                            id: 'rounded',
                            label: 'Rounded',
                          },
                          {
                            id: 'diamond',
                            label: 'Diamond',
                          },
                        ].map((item) => {
                          const isSelected =
                            designConfig.cornerDotStyle ===
                            item.id

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                updateDesign(
                                  'cornerDotStyle',
                                  item.id as QRCornerDotStyle
                                )
                              }
                              className={`py-2.5 px-3 rounded-xl border text-center transition-all text-xs font-bold ${
                                isSelected
                                  ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              {item.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* ================================================== */}
                {/* FRAMES                                             */}
                {/* ================================================== */}

                {activeDesignTab ===
                  'frames' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Frame Template
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                          {
                            id: 'none',
                            label: 'Clean (No Frame)',
                            desc: 'Standard standalone QR',
                          },
                          {
                            id: 'top-badge',
                            label: 'Top Banner Badge',
                            desc: 'Floating badge above QR',
                          },
                          {
                            id: 'bottom-badge',
                            label: 'Bottom Banner Badge',
                            desc: 'Curved CTA pill below',
                          },
                          {
                            id: 'modern-card',
                            label: 'Modern Card',
                            desc: 'Rounded card with caption',
                          },
                          {
                            id: 'chat-bubble',
                            label: 'Speech Bubble',
                            desc: 'Interactive chat style',
                          },
                          {
                            id: 'polaroid',
                            label: 'Polaroid Style',
                            desc: 'White photo card aesthetic',
                          },
                        ].map(
                          (template) => {
                            const isSelected =
                              designConfig.frameTemplate ===
                              template.id

                            return (
                              <button
                                key={
                                  template.id
                                }
                                type="button"
                                onClick={() =>
                                  updateDesign(
                                    'frameTemplate',
                                    template.id as QRFrameTemplate
                                  )
                                }
                                className={`p-3.5 rounded-2xl border text-left transition-all space-y-1 ${
                                  isSelected
                                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-md'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                                }`}
                              >
                                <div className="text-xs font-bold text-white">
                                  {
                                    template.label
                                  }
                                </div>

                                <div className="text-[10px] text-slate-500">
                                  {
                                    template.desc
                                  }
                                </div>
                              </button>
                            )
                          }
                        )}
                      </div>
                    </div>

                    {designConfig.frameTemplate !==
                      'none' && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-300 mb-1.5">
                            Frame Call-to-Action Text
                          </label>

                          <input
                            type="text"
                            value={
                              designConfig.frameText
                            }
                            onChange={(e) =>
                              updateDesign(
                                'frameText',
                                e.target.value
                              )
                            }
                            placeholder="e.g. SCAN ME, CONNECT, VISIT US"
                            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white uppercase font-bold"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">
                              Frame Color
                            </label>

                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={
                                  designConfig.frameColor
                                }
                                onChange={(e) =>
                                  updateDesign(
                                    'frameColor',
                                    e.target.value
                                  )
                                }
                                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-800"
                              />

                              <input
                                type="text"
                                value={
                                  designConfig.frameColor
                                }
                                onChange={(e) =>
                                  updateDesign(
                                    'frameColor',
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-slate-300 mb-1.5">
                              Frame Text Color
                            </label>

                            <div className="flex items-center space-x-3">
                              <input
                                type="color"
                                value={
                                  designConfig.frameTextColor
                                }
                                onChange={(e) =>
                                  updateDesign(
                                    'frameTextColor',
                                    e.target.value
                                  )
                                }
                                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border border-slate-800"
                              />

                              <input
                                type="text"
                                value={
                                  designConfig.frameTextColor
                                }
                                onChange={(e) =>
                                  updateDesign(
                                    'frameTextColor',
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================================================== */}
                {/* LOGO                                               */}
                {/* ================================================== */}

                {activeDesignTab ===
                  'logo' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-2">
                        Preset Brand & System Icons
                      </label>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {PRESET_ICONS.map(
                          (icon) => {
                            const isSelected =
                              designConfig.logoUrl ===
                              icon.svg

                            return (
                              <button
                                key={
                                  icon.id
                                }
                                type="button"
                                onClick={() =>
                                  updateDesign(
                                    'logoUrl',
                                    isSelected
                                      ? null
                                      : icon.svg
                                  )
                                }
                                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center space-y-1.5 ${
                                  isSelected
                                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-md'
                                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white'
                                }`}
                              >
                                <img
                                  src={
                                    icon.svg
                                  }
                                  alt={
                                    icon.name
                                  }
                                  className="w-6 h-6 object-contain"
                                />

                                <span className="text-[11px] font-bold">
                                  {
                                    icon.name
                                  }
                                </span>
                              </button>
                            )
                          }
                        )}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
                      <label className="block text-xs font-bold text-slate-300">
                        Or Upload Custom Logo Image
                      </label>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={
                            handleLogoUpload
                          }
                          className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-slate-900 file:text-indigo-400 hover:file:bg-slate-800 cursor-pointer"
                        />

                        {designConfig.logoUrl && (
                          <button
                            type="button"
                            onClick={() =>
                              updateDesign(
                                'logoUrl',
                                null
                              )
                            }
                            className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-300 text-xs font-bold hover:bg-rose-500/20 transition-colors"
                          >
                            Remove Logo
                          </button>
                        )}
                      </div>

                      {designConfig.logoUrl && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                              Logo Shape Backing
                            </label>

                            <select
                              value={
                                designConfig.logoShape
                              }
                              onChange={(e) =>
                                updateDesign(
                                  'logoShape',
                                  e.target.value as QRLogoShape
                                )
                              }
                              className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
                            >
                              <option value="circle">
                                Circular Badge
                              </option>

                              <option value="rounded">
                                Rounded Square
                              </option>

                              <option value="square">
                                Square
                              </option>

                              <option value="none">
                                None (Transparent)
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                              Logo Scale (
                              {Math.round(
                                designConfig.logoSize *
                                  100
                              )}
                              %)
                            </label>

                            <input
                              type="range"
                              min="0.15"
                              max="0.30"
                              step="0.01"
                              value={
                                designConfig.logoSize
                              }
                              onChange={(e) =>
                                updateDesign(
                                  'logoSize',
                                  parseFloat(
                                    e.target.value
                                  )
                                )
                              }
                              className="w-full cursor-pointer accent-indigo-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ================================================== */}
            {/* STEP 4 — TAGS                                     */}
            {/* ================================================== */}

            <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center">
                  4
                </div>

                <h2 className="text-base font-bold text-white">
                  Attach Tags (Optional)
                </h2>
              </div>

              {tags.length ===
              0 ? (
                <p className="text-xs text-slate-500">
                  No tags created yet. Organize QR codes by tags from Folders & Tags.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const isSelected =
                      selectedTagIds.includes(
                        tag.id
                      )

                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() =>
                          toggleTag(
                            tag.id
                          )
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                          isSelected
                            ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-pink-400" />
                        )}

                        <span>
                          #{tag.name}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ================================================== */}
          {/* RIGHT — LIVE QR PREVIEW                            */}
          {/* ================================================== */}

          <div className="xl:col-span-5 min-w-0 xl:sticky xl:top-6">
            <div className="rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl overflow-hidden">
              {/* Preview Header */}
              <div className="px-5 py-4 border-b border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center">
                      <QrCode className="w-4 h-4 text-indigo-400" />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-white">
                        Live QR Preview
                      </h3>

                      <p className="text-[10px] text-slate-500">
                        Updates instantly as you customize
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />

                    <span className="text-[10px] font-bold text-emerald-400">
                      LIVE
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* QR VISUAL STAGE */}
                <div className="relative rounded-3xl bg-slate-950 border border-slate-800 p-6 min-h-[390px] flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.10),transparent_65%)]" />

                  <div className="relative z-10 flex justify-center">
                    <QRPreviewCanvas
                      content={
                        computedDestinationUrl
                      }
                      designConfig={
                        designConfig
                      }
                      title={
                        title ||
                        'Custom QR'
                      }
                      width={280}
                    />
                  </div>
                </div>

                {/* DESIGN SUMMARY */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      QR Type
                    </div>

                    <div className="mt-1 text-xs font-bold text-indigo-400">
                      {selectedType}
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      Pattern
                    </div>

                    <div className="mt-1 text-xs font-bold text-white capitalize">
                      {
                        designConfig.dotsStyle
                      }
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      Frame
                    </div>

                    <div className="mt-1 text-xs font-bold text-white capitalize">
                      {
                        designConfig.frameTemplate
                      }
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <div className="text-[10px] uppercase tracking-wider text-slate-500">
                      Fill
                    </div>

                    <div className="mt-1 text-xs font-bold text-white capitalize">
                      {
                        designConfig.colorType
                      }
                    </div>
                  </div>
                </div>

                {/* DESTINATION */}
                <div className="mt-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                    Destination
                  </div>

                  <div className="text-[10px] text-slate-400 font-mono break-all leading-relaxed max-h-16 overflow-auto">
                    {
                      computedDestinationUrl
                    }
                  </div>
                </div>

                {/* CREATE BUTTON */}
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    (upgradeDetails !==
                      null &&
                      upgradeDetails.usage >=
                        upgradeDetails.limit)
                  }
                  className={`mt-5 w-full py-3.5 px-6 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
                    upgradeDetails &&
                    upgradeDetails.usage >=
                      upgradeDetails.limit
                      ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                      : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/20 hover:from-indigo-500 hover:to-purple-500 hover:scale-[1.01] active:scale-[0.99]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />

                      <span>
                        Creating Dynamic QR Code...
                      </span>
                    </>
                  ) : upgradeDetails &&
                    upgradeDetails.usage >=
                      upgradeDetails.limit ? (
                    <>
                      <Zap className="w-4 h-4 text-amber-400" />

                      <span>
                        Limit Reached — Upgrade Plan
                      </span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />

                      <span>
                        Create & Save Customized QR
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
