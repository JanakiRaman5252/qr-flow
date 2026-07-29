'use client'

import { useState } from 'react'
import Link from 'next/link'
import { QrCode, Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await fetch('/api/auth/forget-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, redirectTo: '/reset-password' }),
      })
    } catch {
      // Ignore network errors to prevent enumeration
    }

    setSent(true)
    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">QRFlow</span>
        </Link>
        <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">Reset your password</h2>
        <p className="mt-2 text-sm text-slate-400">
          Enter your email to receive a secure reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10">
          {sent ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Check your inbox</h3>
                <p className="text-sm text-slate-400 mt-1">
                  If an account exists for <strong className="text-white">{email}</strong>, a reset link has been sent.
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
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

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm text-slate-400 hover:text-white flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
