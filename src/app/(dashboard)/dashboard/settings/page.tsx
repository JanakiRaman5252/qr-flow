'use client'

import { useState } from 'react'
import { User, Shield, Globe, Key, Trash2, CheckCircle2, AlertTriangle, Save } from 'lucide-react'

export default function SettingsPage() {
  const [name, setName] = useState('John Doe')
  const [email, setEmail] = useState('john@company.com')
  const [twoFactor, setTwoFactor] = useState(false)
  const [customDomain, setCustomDomain] = useState('')
  const [dnsVerified, setDnsVerified] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedMessage('Profile settings saved successfully!')
    setTimeout(() => setSavedMessage(''), 3000)
  }

  const handleVerifyDomain = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customDomain.trim()) return
    setDnsVerified(true)
  }

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Account & Workspace Settings</h1>
        <p className="text-slate-400 text-sm mt-1">Manage profile details, 2FA security, custom domain verification, and account preferences.</p>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Profile Form */}
      <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 max-w-3xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-indigo-400" />
          <span>Profile Information</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-600/20"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </form>

      {/* Security / 2FA */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 max-w-3xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-400" />
          <span>Two-Factor Authentication (2FA)</span>
        </h2>
        <p className="text-xs text-slate-400">Add an extra layer of security to your account with TOTP authenticator apps (Google Authenticator, 1Password).</p>

        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div>
            <span className="font-semibold text-white text-sm block">Two-Factor Authentication</span>
            <span className="text-xs text-slate-500">{twoFactor ? 'Enabled' : 'Disabled'}</span>
          </div>

          <button
            onClick={() => setTwoFactor(!twoFactor)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              twoFactor
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            {twoFactor ? 'Disable 2FA' : 'Enable 2FA'}
          </button>
        </div>
      </div>

      {/* Custom Domain Settings */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 max-w-3xl">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <span>Custom Domain Branding</span>
        </h2>
        <p className="text-xs text-slate-400">Connect your custom domain (e.g. <code className="font-mono text-indigo-300">qr.yourbrand.com</code>) for branded short links.</p>

        <form onSubmit={handleVerifyDomain} className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="qr.company.com"
              className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl transition-all shadow-md shadow-cyan-600/20 shrink-0"
            >
              Verify DNS TXT Record
            </button>
          </div>

          {customDomain && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">TXT Name:</span>
                <span className="text-white">_qrflow-challenge.{customDomain}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">TXT Value:</span>
                <span className="text-indigo-400">qrflow-verification-hash-8a9b0c</span>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <span className="text-slate-400">DNS Verification Status:</span>
                <span className={`font-semibold ${dnsVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {dnsVerified ? '✓ DNS Verified & SSL Active' : '⏳ Pending DNS Record...'}
                </span>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-2xl bg-red-950/20 border border-red-900/40 space-y-4 max-w-3xl">
        <h2 className="text-lg font-bold text-red-400 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Danger Zone</span>
        </h2>
        <p className="text-xs text-slate-400">Permanently delete your workspace, all dynamic QR codes, analytics history, and API keys.</p>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to permanently delete your account and workspace? This cannot be undone.')) {
              alert('Account deletion initiated.')
            }
          }}
          className="px-4 py-2.5 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          <span>Delete Workspace & Account</span>
        </button>
      </div>
    </div>
  )
}
