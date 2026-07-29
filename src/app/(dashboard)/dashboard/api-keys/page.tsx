'use client'

import { useEffect, useState } from 'react'
import { Key, Plus, Copy, Trash2, Loader2 } from 'lucide-react'

interface APIKeyItem {
  id: string
  name: string
  key: string
  scopes: string[]
  createdAt: string
  lastUsed: string
}

export default function APIKeysPage() {
  const [keys, setKeys] = useState<APIKeyItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [keyName, setKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['qr:read', 'qr:write'])
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/api-keys')
      const json = await res.json()
      if (json.success) setKeys(json.data)
    } catch (err) {
      console.error('Failed to load API keys:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchKeys()
  }, [])

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

  const handleCopy = (keyString: string, id: string) => {
    navigator.clipboard.writeText(keyString)
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

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">API Keys & Webhooks</h1>
        <p className="text-slate-400 text-sm mt-1">Generate programmatic REST API access tokens and configure scan webhooks.</p>
      </div>

      {/* Generate API Key Card */}
      <form onSubmit={handleGenerateKey} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Key className="w-5 h-5 text-indigo-400" />
          <span>Create New API Secret Key</span>
        </h2>

        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            required
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Key Description (e.g. Mobile App Backend)"
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            type="submit"
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Secret Key</span>
          </button>
        </div>

        {/* Scope Selectors */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Key Permissions / Scopes</label>
          <div className="flex flex-wrap gap-3">
            {['qr:read', 'qr:write', 'analytics:read', 'webhooks:manage'].map((scope) => {
              const active = selectedScopes.includes(scope)
              return (
                <button
                  type="button"
                  key={scope}
                  onClick={() => toggleScope(scope)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-all ${
                    active
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
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

      {/* Secret Banner on creation */}
      {newlyCreatedKey && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">New Secret Key Generated</span>
            <p className="font-mono text-sm text-white mt-1 truncate">{newlyCreatedKey}</p>
          </div>
          <button
            onClick={() => handleCopy(newlyCreatedKey, 'new')}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shrink-0"
          >
            {copiedId === 'new' ? 'Copied!' : 'Copy Key'}
          </button>
        </div>
      )}

      {/* Active API Keys List */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Active API Keys</h2>

        {isLoading ? (
          <div className="py-12 text-center text-slate-500 flex items-center justify-center gap-2 font-medium">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Loading API keys...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.length === 0 ? (
              <p className="text-slate-500 text-sm">No API keys created yet.</p>
            ) : (
              keys.map((k) => (
                <div key={k.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{k.name}</span>
                      <span className="text-xs text-slate-500 font-mono">Created {k.createdAt}</span>
                    </div>

                    <p className="text-xs font-mono text-slate-400">
                      {k.key.substring(0, 12)}••••••••••••••••••••••••
                    </p>

                    <div className="flex gap-1.5 flex-wrap pt-1">
                      {k.scopes.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-indigo-400">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopy(k.key, k.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-all flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === k.id ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors"
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
    </div>
  )
}
