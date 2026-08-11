'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  QrCode,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Building2,
  Sparkles,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryEmail = searchParams.get('email') || ''
  const queryWorkspace = searchParams.get('workspace') || 'Workspace'
  const queryOrgId = searchParams.get('orgId') || ''
  const queryRole = searchParams.get('role') || 'Member'

  const [name, setName] = useState('')
  const [email, setEmail] = useState(queryEmail)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [workspaceName, setWorkspaceName] = useState(queryWorkspace)
  const [roleName, setRoleName] = useState(queryRole)
  const [orgId, setOrgId] = useState(queryOrgId)

  const [hasPassword, setHasPassword] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function checkUser() {
      if (!queryEmail) {
        setIsChecking(false)
        return
      }
      try {
        const res = await fetch(`/api/auth/check-invite?email=${encodeURIComponent(queryEmail)}&orgId=${encodeURIComponent(queryOrgId)}`)
        const json = await res.json()
        if (json.success) {
          if (json.hasPassword) setHasPassword(true)
          if (json.name) setName(json.name)
          if (json.workspaceName) setWorkspaceName(json.workspaceName)
          if (json.role) setRoleName(json.role)
          if (json.orgId) setOrgId(json.orgId)
        }
      } catch (err) {
        console.error('Failed to check invite status:', err)
      } finally {
        setIsChecking(false)
      }
    }
    checkUser()
  }, [queryEmail, queryOrgId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!hasPassword) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.')
        setIsLoading(false)
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.')
        setIsLoading(false)
        return
      }
    }

    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          organizationId: orgId,
        }),
      })

      const json = await res.json()

      if (!json.success) {
        setError(json.error || 'Failed to complete setup.')
        setIsLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    await authClient.signIn.social({ provider, callbackURL: '/dashboard' })
  }

  if (isChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center space-x-3 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
        <span className="text-sm font-medium">Verifying invitation...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">QRFlow</span>
        </Link>
      </div>

      {/* Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-3xl sm:px-10 space-y-6">
          
          {/* Workspace Invitation Badge */}
          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-1.5">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 text-[11px] font-bold uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>Workspace Invitation</span>
            </div>
            <h3 className="text-base font-bold text-white">
              Join <span className="text-indigo-400">{workspaceName}</span>
            </h3>
            <p className="text-xs text-slate-400">
              You've been invited with <strong className="text-slate-200">{roleName}</strong> access.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white">
              {hasPassword ? 'Sign in to join' : 'Create your password'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {hasPassword
                ? 'Enter your existing account password to join this workspace.'
                : 'Set up your name and a new password to activate your account.'}
            </p>
          </div>

          {/* Social Sign In */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleSocialSignIn('google')}
              className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleSocialSignIn('github')}
              className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              GitHub
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
              <span className="bg-slate-900 px-3 text-slate-500 font-semibold">or continue with email</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Account activated! Entering workspace...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!hasPassword && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Your Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Jane Doe"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-75"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                {hasPassword ? 'Password' : 'Create Password'} {!hasPassword && <span className="text-slate-500 normal-case">(min 8 chars)</span>}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  placeholder={hasPassword ? 'Enter your password' : 'Create a strong password'}
                />
              </div>
            </div>

            {!hasPassword && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || success}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{hasPassword ? 'Signing in...' : 'Setting up account...'}</span>
                </>
              ) : (
                <>
                  <span>{hasPassword ? 'Sign In & Join Workspace' : 'Set Password & Join Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle between Set Password / Sign in mode */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setHasPassword(!hasPassword)}
              className="text-xs text-slate-400 hover:text-indigo-300 transition-colors"
            >
              {hasPassword
                ? "Don't have a password yet? Create one now"
                : 'Already have an existing password? Sign in instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center space-x-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          <span className="text-sm font-medium">Loading invitation...</span>
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  )
}
