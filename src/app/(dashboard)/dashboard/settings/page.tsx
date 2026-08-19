'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  User,
  Shield,
  Globe,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save,
  Loader2,
  Sparkles,
  Building2,
  Lock,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface ProfileData {
  id: string
  name: string
  email: string
  role: string
  twoFactorEnabled: boolean
  organization: {
    id: string
    name: string
    slug: string
  }
  plan: string
  isSuperAdmin?: boolean
}

interface CustomDomainData {
  id: string
  domain: string
  verified: boolean
  sslActive: boolean
  dnsTxtRecord: string
}

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [customDomain, setCustomDomain] = useState<CustomDomainData | null>(null)
  const [hasDomainEntitlement, setHasDomainEntitlement] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Form states
  const [name, setName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [domainInput, setDomainInput] = useState('')
  const [twoFactor, setTwoFactor] = useState(false)

  // Saving states
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)
  const [isToggling2FA, setIsToggling2FA] = useState(false)
  const [isAddingDomain, setIsAddingDomain] = useState(false)
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false)
  const [isDeletingWorkspace, setIsDeletingWorkspace] = useState(false)

  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null)

  function extractErrorMessage(err: any): string {
    if (!err) return 'An unexpected error occurred.'
    if (typeof err === 'string') return err
    if (typeof err?.message === 'string') return err.message
    if (typeof err?.error === 'string') return err.error
    if (typeof err?.error?.message === 'string') return err.error.message
    return 'An unexpected error occurred.'
  }

  const loadSettingsData = async () => {
    try {
      setIsLoading(true)
      const [profileRes, domainRes] = await Promise.all([
        fetch('/api/user/profile'),
        fetch('/api/custom-domain'),
      ])

      if (profileRes.status === 401) {
        window.location.href = '/login'
        return
      }

      const profileJson = profileRes.ok && profileRes.headers.get('content-type')?.includes('application/json')
        ? await profileRes.json()
        : null
      const domainJson = domainRes.ok && domainRes.headers.get('content-type')?.includes('application/json')
        ? await domainRes.json()
        : null

      if (profileJson?.success && profileJson?.data) {
        setProfile(profileJson.data)
        setName(profileJson.data.name || '')
        setWorkspaceName(profileJson.data.organization?.name || '')
        setTwoFactor(profileJson.data.twoFactorEnabled || false)
      }

      if (domainJson?.success) {
        setCustomDomain(domainJson.data || null)
        setHasDomainEntitlement(Boolean(domainJson.hasEntitlement))
        if (domainJson.data?.domain) {
          setDomainInput(domainJson.data.domain)
        }
      }
    } catch (err) {
      console.error('Failed to load settings:', err)
      setFeedbackError('Failed to load settings data.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSettingsData()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackError(null)
    setFeedbackSuccess(null)
    setIsSavingProfile(true)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const json = await res.json()

      if (json.success) {
        setFeedbackSuccess('Profile details updated successfully!')
        setProfile((prev) => (prev ? { ...prev, name: json.data.name } : null))
      } else {
        setFeedbackError(extractErrorMessage(json.error) || 'Failed to update profile.')
      }
    } catch (err) {
      setFeedbackError(extractErrorMessage(err))
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setFeedbackError(null)
    setFeedbackSuccess(null)
    setIsSavingWorkspace(true)

    try {
      const res = await fetch('/api/user/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName }),
      })
      const json = await res.json()

      if (json.success) {
        setFeedbackSuccess('Workspace name updated successfully!')
        setProfile((prev) =>
          prev ? { ...prev, organization: { ...prev.organization, name: json.data.name } } : null
        )
      } else {
        setFeedbackError(extractErrorMessage(json.error) || 'Failed to update workspace name.')
      }
    } catch (err) {
      setFeedbackError(extractErrorMessage(err))
    } finally {
      setIsSavingWorkspace(false)
    }
  }

  const handleToggle2FA = async () => {
    setFeedbackError(null)
    setFeedbackSuccess(null)
    setIsToggling2FA(true)

    try {
      const targetState = !twoFactor
      const res = await fetch('/api/user/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twoFactorEnabled: targetState }),
      })
      const json = await res.json()

      if (json.success) {
        setTwoFactor(targetState)
        setFeedbackSuccess(json.message || 'Two-Factor settings updated!')
      } else {
        setFeedbackError(extractErrorMessage(json.error) || 'Failed to update 2FA.')
      }
    } catch (err) {
      setFeedbackError(extractErrorMessage(err))
    } finally {
      setIsToggling2FA(false)
    }
  }

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!domainInput.trim()) return

    setFeedbackError(null)
    setFeedbackSuccess(null)
    setIsAddingDomain(true)

    try {
      const res = await fetch('/api/custom-domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput }),
      })
      const json = await res.json()

      if (json.success) {
        setCustomDomain(json.data)
        setFeedbackSuccess('Custom domain record created! Add the TXT record to your DNS to verify.')
      } else {
        setFeedbackError(extractErrorMessage(json.error) || 'Failed to connect custom domain.')
      }
    } catch (err) {
      setFeedbackError(extractErrorMessage(err))
    } finally {
      setIsAddingDomain(false)
    }
  }

  const handleVerifyDNS = async () => {
    if (!customDomain) return
    setFeedbackError(null)
    setFeedbackSuccess(null)
    setIsVerifyingDomain(true)

    try {
      const res = await fetch('/api/custom-domain', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: customDomain.id }),
      })
      const json = await res.json()

      if (json.success) {
        setCustomDomain(json.data)
        setFeedbackSuccess(json.message || 'Domain verified successfully!')
      } else {
        setFeedbackError(extractErrorMessage(json.error) || 'DNS verification failed.')
      }
    } catch (err) {
      setFeedbackError(extractErrorMessage(err))
    } finally {
      setIsVerifyingDomain(false)
    }
  }

  const handleDeleteDomain = async () => {
    if (!customDomain) return
    if (!confirm('Are you sure you want to disconnect this custom domain?')) return

    setFeedbackError(null)
    setFeedbackSuccess(null)

    try {
      const res = await fetch(`/api/custom-domain?id=${customDomain.id}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (json.success) {
        setCustomDomain(null)
        setDomainInput('')
        setFeedbackSuccess('Custom domain disconnected.')
      } else {
        setFeedbackError(extractErrorMessage(json.error) || 'Failed to remove domain.')
      }
    } catch (err) {
      setFeedbackError(extractErrorMessage(err))
    }
  }

  const handleDeleteWorkspace = async () => {
    if (
      !confirm(
        'WARNING: Deleting this workspace will permanently erase all dynamic QR codes, analytics events, and member associations. Are you sure?'
      )
    ) {
      return
    }

    setIsDeletingWorkspace(true)
    setFeedbackError(null)

    try {
      const res = await fetch('/api/user/workspaces', {
        method: 'DELETE',
      })
      const json = await res.json()

      if (json.success) {
        alert('Workspace deleted successfully. Redirecting...')
        router.push('/dashboard')
        router.refresh()
      } else {
        setFeedbackError(extractErrorMessage(json.error) || 'Failed to delete workspace.')
      }
    } catch (err) {
      setFeedbackError(extractErrorMessage(err))
    } finally {
      setIsDeletingWorkspace(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
        <div className="space-y-3">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>

        <div className="space-y-6 max-w-3xl">
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Account & Workspace Settings</h1>
        <p className="text-slate-400 text-sm mt-1">
          Manage your workspace details, personal profile, security configuration, and custom domain branding.
        </p>
      </div>

      {/* Global Feedback Alerts */}
      {feedbackError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm font-semibold flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{feedbackError}</span>
        </div>
      )}

      {feedbackSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm font-semibold flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{feedbackSuccess}</span>
        </div>
      )}

      <div className="space-y-8 max-w-3xl">
        {/* Workspace Details Form */}
        <form onSubmit={handleSaveWorkspace} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-400" />
              <span>Workspace Profile</span>
            </h2>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
              Role: {profile?.role || 'MEMBER'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Workspace Name
              </label>
              <input
                type="text"
                required
                disabled={profile?.role !== 'OWNER' && profile?.role !== 'ADMIN'}
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Workspace Slug / Identifier
              </label>
              <input
                type="text"
                disabled
                value={profile?.organization?.slug || ''}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 font-mono cursor-not-allowed"
              />
            </div>
          </div>

          {(profile?.role === 'OWNER' || profile?.role === 'ADMIN') && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSavingWorkspace}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {isSavingWorkspace ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Workspace Name</span>
                  </>
                )}
              </button>
            </div>
          )}
        </form>

        {/* Profile Information Form */}
        <form onSubmit={handleSaveProfile} className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-6 shadow-xl">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <User className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-extrabold text-white">Personal Profile</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-400 cursor-not-allowed"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">Email is locked to your session identity</span>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Security & Two-Factor Authentication */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" />
            <span>Two-Factor Authentication (2FA)</span>
          </h2>
          <p className="text-xs text-slate-400">
            Enforce TOTP authenticator protection for all dashboard sign-in requests and API actions.
          </p>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <span className="font-bold text-white text-sm block">Authenticator 2FA Security</span>
              <span className="text-xs text-slate-400">
                Status: {twoFactor ? <strong className="text-emerald-400">Enabled ✓</strong> : <strong className="text-slate-400">Disabled</strong>}
              </span>
            </div>

            <button
              type="button"
              disabled={isToggling2FA}
              onClick={handleToggle2FA}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-2 ${
                twoFactor
                  ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {isToggling2FA ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 text-violet-400" />
              )}
              <span>{twoFactor ? 'Disable 2FA' : 'Enable 2FA'}</span>
            </button>
          </div>
        </div>

        {/* Custom Domain Branding */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              <span>Custom Domain Branding</span>
            </h2>
            {!hasDomainEntitlement && (
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                PRO FEATURE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            Serve dynamic QR short URLs under your own branded domain (e.g. <code className="font-mono text-cyan-300">qr.yourbrand.com</code>).
          </p>

          {!hasDomainEntitlement ? (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-3">
              <p>Custom domain branding is enabled on <strong>Pro</strong> and <strong>Business</strong> plans.</p>
              <button
                type="button"
                onClick={() => router.push('/dashboard/billing')}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-indigo-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade to Pro</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleAddDomain} className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="qr.company.com"
                  className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={isAddingDomain}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-cyan-600/20 shrink-0 disabled:opacity-50"
                >
                  {isAddingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connect Domain'}
                </button>
              </div>

              {customDomain && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Target Domain:</span>
                    <span className="text-white font-bold">{customDomain.domain}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">DNS TXT Name:</span>
                    <span className="text-slate-300">_dynoqr-challenge.{customDomain.domain}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">DNS TXT Value:</span>
                    <span className="text-cyan-400">{customDomain.dnsTxtRecord}</span>
                  </div>
                  <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                    <span className="text-slate-400">DNS Status:</span>
                    <span className={`font-bold ${customDomain.verified ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {customDomain.verified ? '✓ DNS Verified & SSL Active' : '⏳ Pending DNS Record...'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    {!customDomain.verified && (
                      <button
                        type="button"
                        disabled={isVerifyingDomain}
                        onClick={handleVerifyDNS}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow-md shadow-emerald-600/20"
                      >
                        {isVerifyingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify DNS Record'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleDeleteDomain}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-400 font-bold text-xs border border-slate-700 transition-all"
                    >
                      Disconnect Domain
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Danger Zone: Workspace Deletion */}
        {profile?.role === 'OWNER' && (
          <div className="p-6 rounded-3xl bg-rose-950/20 border border-rose-900/40 space-y-4 max-w-3xl shadow-xl">
            <h2 className="text-lg font-extrabold text-rose-400 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              <span>Workspace Danger Zone</span>
            </h2>
            <p className="text-xs text-slate-400">
              Permanently delete this workspace along with all dynamic QR codes, redirection rules, analytics telemetry, and team memberships.
            </p>

            <button
              type="button"
              disabled={isDeletingWorkspace}
              onClick={handleDeleteWorkspace}
              className="px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-600/40 text-rose-300 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isDeletingWorkspace ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 text-rose-400" />
              )}
              <span>Delete Workspace & Account</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
