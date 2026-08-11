'use client'

import { useEffect, useState } from 'react'
import {
  Key,
  Plus,
  Copy,
  Trash2,
  Loader2,
  Webhook as WebhookIcon,
  CheckCircle2,
  XCircle,
  Play,
  History,
  Check,
  Code,
  Shield,
  Send,
  ExternalLink,
} from 'lucide-react'

interface APIKeyItem {
  id: string
  name: string
  key: string
  scopes: string[]
  createdAt: string
  lastUsed: string
}

interface WebhookItem {
  id: string
  name: string
  url: string
  secret: string
  events: string[]
  isActive: boolean
  createdAt: string
  deliveries?: Array<{
    id: string
    event: string
    responseCode: number | null
    deliveredAt: string
    error: string | null
  }>
}

interface WebhookDeliveryItem {
  id: string
  event: string
  payload: any
  responseCode: number | null
  error: string | null
  deliveredAt: string
}

export default function APIKeysAndWebhooksPage() {
  const [activeTab, setActiveTab] = useState<'keys' | 'webhooks'>('keys')

  // API Keys state
  const [keys, setKeys] = useState<APIKeyItem[]>([])
  const [isLoadingKeys, setIsLoadingKeys] = useState(true)
  const [keyName, setKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['qr:read', 'qr:write'])
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Webhooks state
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([])
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(true)
  const [whName, setWhName] = useState('')
  const [whUrl, setWhUrl] = useState('')
  const [whEvents, setWhEvents] = useState<string[]>(['qr.scanned', 'qr.created'])
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string } | null>(null)

  // Webhook Logs Modal State
  const [selectedWebhookForLogs, setSelectedWebhookForLogs] = useState<WebhookItem | null>(null)
  const [logs, setLogs] = useState<WebhookDeliveryItem[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)

  const fetchKeys = async () => {
    try {
      setIsLoadingKeys(true)
      const res = await fetch('/api/api-keys')
      const json = await res.json()
      if (json.success) setKeys(json.data)
    } catch (err) {
      console.error('Failed to load API keys:', err)
    } finally {
      setIsLoadingKeys(false)
    }
  }

  const fetchWebhooks = async () => {
    try {
      setIsLoadingWebhooks(true)
      const res = await fetch('/api/webhooks')
      const json = await res.json()
      if (json.success) setWebhooks(json.data)
    } catch (err) {
      console.error('Failed to load webhooks:', err)
    } finally {
      setIsLoadingWebhooks(false)
    }
  }

  useEffect(() => {
    fetchKeys()
    fetchWebhooks()
  }, [])

  // ── API Key Actions ──
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyName.trim()) return

    try {
      const res = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: keyName, scopes: selectedScopes }),
      })
      const json = await res.json()
      if (json.success) {
        setNewlyCreatedKey(json.data.key)
        setKeyName('')
        fetchKeys()
      }
    } catch (err) {
      console.error('Failed to generate key:', err)
    }
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return
    try {
      const res = await fetch(`/api/api-keys?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setKeys(keys.filter((k) => k.id !== id))
      }
    } catch (err) {
      console.error('Failed to revoke API key:', err)
    }
  }

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope))
    } else {
      setSelectedScopes([...selectedScopes, scope])
    }
  }

  // ── Webhook Actions ──
  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!whName.trim() || !whUrl.trim()) return

    try {
      const res = await fetch('/api/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: whName, url: whUrl, events: whEvents }),
      })
      const json = await res.json()
      if (json.success) {
        setWhName('')
        setWhUrl('')
        fetchWebhooks()
      } else {
        alert(json.error || 'Failed to create webhook')
      }
    } catch (err) {
      console.error('Failed to create webhook:', err)
    }
  }

  const toggleWebhookActive = async (wh: WebhookItem) => {
    try {
      const res = await fetch('/api/webhooks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wh.id, isActive: !wh.isActive }),
      })
      const json = await res.json()
      if (json.success) {
        setWebhooks(webhooks.map((w) => (w.id === wh.id ? { ...w, isActive: !w.isActive } : w)))
      }
    } catch (err) {
      console.error('Failed to toggle webhook:', err)
    }
  }

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook endpoint?')) return
    try {
      const res = await fetch(`/api/webhooks?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setWebhooks(webhooks.filter((w) => w.id !== id))
      }
    } catch (err) {
      console.error('Failed to delete webhook:', err)
    }
  }

  const handleTestPing = async (id: string) => {
    setTestingId(id)
    setTestResult(null)
    try {
      const res = await fetch('/api/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ webhookId: id }),
      })
      const json = await res.json()
      if (json.success) {
        setTestResult({
          id,
          success: json.data.delivered,
          message: json.data.delivered
            ? `Test ping delivered! HTTP ${json.data.statusCode}`
            : `Delivery failed: ${json.data.error || `HTTP ${json.data.statusCode}`}`,
        })
        fetchWebhooks()
      } else {
        setTestResult({ id, success: false, message: json.error || 'Test failed' })
      }
    } catch (err) {
      console.error('Failed to test webhook:', err)
      setTestResult({ id, success: false, message: 'Network error sending test ping' })
    } finally {
      setTestingId(null)
    }
  }

  const toggleWhEvent = (evt: string) => {
    if (whEvents.includes(evt)) {
      setWhEvents(whEvents.filter((e) => e !== evt))
    } else {
      setWhEvents([...whEvents, evt])
    }
  }

  const openLogsModal = async (wh: WebhookItem) => {
    setSelectedWebhookForLogs(wh)
    setIsLoadingLogs(true)
    try {
      const res = await fetch(`/api/webhooks/deliveries?webhookId=${wh.id}`)
      const json = await res.json()
      if (json.success) setLogs(json.data)
    } catch (err) {
      console.error('Failed to load webhook logs:', err)
    } finally {
      setIsLoadingLogs(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white">Developer Suite & Webhooks</h1>
          <p className="text-slate-400 text-sm mt-1">
            Programmatic REST API keys, OAuth scopes, and real-time HTTP event webhooks.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-900 border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('keys')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'keys'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>API Keys ({keys.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('webhooks')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
              activeTab === 'webhooks'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <WebhookIcon className="w-4 h-4" />
            <span>Webhooks ({webhooks.length})</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: API KEYS ── */}
      {activeTab === 'keys' && (
        <div className="space-y-8">
          {/* Create API Key Card */}
          <form onSubmit={handleGenerateKey} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 backdrop-blur-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <Key className="w-4 h-4" />
              <span>Create New Secret API Key</span>
            </h2>

            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                required
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Key Name (e.g. Mobile App Backend / Zapier Integration)"
                className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              <button
                type="submit"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Key</span>
              </button>
            </div>

            {/* Scope Selectors */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Permission Scopes
              </label>
              <div className="flex flex-wrap gap-2">
                {['qr:read', 'qr:write', 'analytics:read', 'webhooks:manage'].map((scope) => {
                  const active = selectedScopes.includes(scope)
                  return (
                    <button
                      type="button"
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${
                        active
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {scope}
                    </button>
                  )
                })}
              </div>
            </div>
          </form>

          {/* Newly Generated Secret Banner */}
          {newlyCreatedKey && (
            <div className="p-6 rounded-3xl bg-emerald-500/10 border-2 border-emerald-500/30 space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                  New API Secret Key Created — Copy Now!
                </span>
                <span className="text-[10px] text-emerald-300/70">
                  Save this key in your environment variables. It will not be shown again.
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-emerald-500/30">
                <code className="flex-1 font-mono text-sm text-emerald-300 break-all">{newlyCreatedKey}</code>
                <button
                  onClick={() => handleCopy(newlyCreatedKey, 'new')}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs transition-all shrink-0 flex items-center space-x-1.5"
                >
                  {copiedId === 'new' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'new' ? 'Copied!' : 'Copy Key'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Active API Keys Table */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 backdrop-blur-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Active API Keys</h2>

            {isLoadingKeys ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading API keys...</span>
              </div>
            ) : keys.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No API keys generated yet. Use the form above to generate your first key.
              </div>
            ) : (
              <div className="space-y-3">
                {keys.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-white text-sm">{k.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Created {k.createdAt}</span>
                      </div>

                      <div className="flex items-center space-x-2 font-mono text-xs text-slate-400">
                        <span>{k.key.substring(0, 12)}••••••••••••••••</span>
                        <span className="text-[10px] text-slate-600">
                          (Last used: {k.lastUsed === 'Never' ? 'Never' : new Date(k.lastUsed).toLocaleDateString()})
                        </span>
                      </div>

                      <div className="flex gap-1.5 flex-wrap pt-1">
                        {k.scopes.map((s) => (
                          <span
                            key={s}
                            className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        onClick={() => handleCopy(k.key, k.id)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-all flex items-center space-x-1.5"
                      >
                        {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedId === k.id ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick REST API Code Example */}
          <div className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-2">
              <Code className="w-4 h-4 text-indigo-400" />
              <span>Public REST API v1 Authentication Example</span>
            </h3>

            <div className="p-4 rounded-2xl bg-slate-950 font-mono text-xs text-indigo-300 space-y-2 overflow-x-auto border border-slate-800">
              <p className="text-slate-500">// Fetch all QR codes via cURL</p>
              <p>curl -X GET "https://dynoqr.com/api/v1/qr" \</p>
              <p className="pl-4">-H "Authorization: Bearer qrf_live_your_secret_key_hash" \</p>
              <p className="pl-4">-H "Content-Type: application/json"</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: WEBHOOKS ── */}
      {activeTab === 'webhooks' && (
        <div className="space-y-8">
          {/* Create Webhook Form */}
          <form onSubmit={handleCreateWebhook} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 backdrop-blur-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-2">
              <WebhookIcon className="w-4 h-4" />
              <span>Register New Webhook Endpoint</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Friendly Endpoint Name</label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. Production Analytics Server"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Webhook Payload URL (HTTPS)</label>
                <input
                  type="url"
                  required
                  value={whUrl}
                  onChange={(e) => setWhUrl(e.target.value)}
                  placeholder="https://api.yourserver.com/webhooks/dynoqr"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Subscribed Events Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Subscribed Event Triggers
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'qr.scanned', label: '⚡ qr.scanned (Live Scans)' },
                  { id: 'qr.created', label: '➕ qr.created (New QR)' },
                  { id: 'qr.updated', label: '✏️ qr.updated (Updated QR)' },
                  { id: 'qr.deleted', label: '🗑️ qr.deleted (Deleted QR)' },
                ].map((evt) => {
                  const active = whEvents.includes(evt.id)
                  return (
                    <button
                      type="button"
                      key={evt.id}
                      onClick={() => toggleWhEvent(evt.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        active
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 ring-1 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {evt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/25"
            >
              <Plus className="w-4 h-4" />
              <span>Register Webhook Endpoint</span>
            </button>
          </form>

          {/* Active Webhook Endpoints List */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 backdrop-blur-xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Registered Webhook Endpoints</h2>

            {isLoadingWebhooks ? (
              <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Loading webhooks...</span>
              </div>
            ) : webhooks.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                No webhook endpoints registered yet. Register your first endpoint above.
              </div>
            ) : (
              <div className="space-y-4">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <span className="font-extrabold text-white text-base">{wh.name}</span>
                          <button
                            onClick={() => toggleWebhookActive(wh)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all ${
                              wh.isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-slate-800 text-slate-500 border border-slate-700'
                            }`}
                          >
                            {wh.isActive ? 'ACTIVE' : 'DISABLED'}
                          </button>
                        </div>
                        <p className="font-mono text-xs text-indigo-400 break-all">{wh.url}</p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {/* Send Test Ping */}
                        <button
                          onClick={() => handleTestPing(wh.id)}
                          disabled={testingId === wh.id}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5"
                        >
                          {testingId === wh.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                          ) : (
                            <Play className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          <span>Test Ping</span>
                        </button>

                        {/* View Delivery Logs */}
                        <button
                          onClick={() => openLogsModal(wh)}
                          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all flex items-center space-x-1.5"
                        >
                          <History className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Logs</span>
                        </button>

                        {/* Delete Webhook */}
                        <button
                          onClick={() => handleDeleteWebhook(wh.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Test Result Alert Banner */}
                    {testResult && testResult.id === wh.id && (
                      <div
                        className={`p-3 rounded-xl text-xs font-bold flex items-center justify-between border ${
                          testResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          {testResult.success ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-rose-400" />
                          )}
                          <span>{testResult.message}</span>
                        </div>
                      </div>
                    )}

                    {/* Secret Key & Event Badges */}
                    <div className="pt-2 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-2 font-mono text-[11px] text-slate-400">
                        <Shield className="w-3.5 h-3.5 text-slate-500" />
                        <span>Signing Secret:</span>
                        <code className="text-slate-300">{wh.secret.substring(0, 14)}••••••••</code>
                        <button
                          onClick={() => handleCopy(wh.secret, wh.id)}
                          className="text-indigo-400 hover:underline text-[10px] font-sans font-semibold ml-1"
                        >
                          {copiedId === wh.id ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {wh.events.map((evt) => (
                          <span
                            key={evt}
                            className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-900 border border-slate-800 text-indigo-400"
                          >
                            {evt}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── WEBHOOK DELIVERY HISTORY LOGS MODAL ── */}
      {selectedWebhookForLogs && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-6 max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  <span>Webhook Delivery Logs</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{selectedWebhookForLogs.url}</p>
              </div>

              <button
                onClick={() => setSelectedWebhookForLogs(null)}
                className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {isLoadingLogs ? (
                <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>Fetching delivery history logs...</span>
                </div>
              ) : logs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  No delivery logs recorded for this endpoint yet.
                </div>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.responseCode && log.responseCode >= 200 && log.responseCode < 300
                  return (
                    <div
                      key={log.id}
                      className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              isSuccess
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {log.responseCode ? `HTTP ${log.responseCode}` : 'TIMED OUT'}
                          </span>
                          <span className="font-mono text-indigo-300 font-bold">{log.event}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(log.deliveredAt).toLocaleString()}
                        </span>
                      </div>

                      {log.error && (
                        <p className="text-xs text-rose-400 font-mono bg-rose-950/40 p-2 rounded-xl border border-rose-900/50">
                          {log.error}
                        </p>
                      )}

                      <details className="text-[11px] font-mono text-slate-400">
                        <summary className="cursor-pointer hover:text-slate-200 transition-colors">
                          View Dispatched JSON Payload
                        </summary>
                        <pre className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 overflow-x-auto text-[10px]">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                onClick={() => setSelectedWebhookForLogs(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
              >
                Close Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
