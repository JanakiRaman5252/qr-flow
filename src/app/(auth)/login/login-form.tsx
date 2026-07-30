'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
QrCode,
Mail,
Lock,
ArrowRight,
Loader2,
AlertCircle,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export default function LoginForm() {
const router = useRouter()
const searchParams = useSearchParams()

const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [error, setError] = useState('')

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  setIsLoading(true)
  setError('')

  const result = await authClient.signIn.email({
    email,
    password,
  })

  if (result.error) {
    setError(
      result.error.message ||
        'Invalid credentials. Please try again.'
    )
    setIsLoading(false)
    return
  }

  router.push(callbackUrl)
  router.refresh()
}

const handleGoogleSignIn = async () => {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: callbackUrl,
  })
}

const handleGithubSignIn = async () => {
  await authClient.signIn.social({
    provider: 'github',
    callbackURL: callbackUrl,
  })
}

return (
  <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />

    <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <Link href="/" className="inline-flex items-center space-x-2">
        <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
          <QrCode className="w-6 h-6" />
        </div>

        <span className="font-bold text-2xl tracking-tight text-white">
          QRFlow
        </span>
      </Link>

      <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">
        Welcome back
      </h2>

      <p className="mt-2 text-sm text-slate-400">
        No account?{' '}
        <Link
          href="/signup"
          className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          Create one free
        </Link>
      </p>
    </div>

    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
      <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10">

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-all"
          >
            Google
          </button>

          <button
            type="button"
            onClick={handleGithubSignIn}
            className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-all"
          >
            GitHub
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>

          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-slate-900 px-3 text-slate-500 font-medium">
              or with email
            </span>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5"
            >
              Email address
            </label>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Mail className="h-4 w-4" />
              </div>

              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
              >
                Password
              </label>

              <Link
                href="/forgot-password"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Lock className="h-4 w-4" />
              </div>

              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign in to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  </div>
)
}
