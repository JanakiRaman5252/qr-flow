'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QrCode, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { ButtonSpinner } from '@/components/ui/loader'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVerificationSent, setIsVerificationSent] = useState(false)
  const [resendStatus, setResendStatus] = useState('')
  const [isResending, setIsResending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setIsLoading(false)
      return
    }

    const result = await authClient.signUp.email({
      name,
      email: email.trim().toLowerCase(),
      password,
    })

    if (result.error) {
      const msg = result.error.message || ''
      const isAlreadyExists =
        msg.toLowerCase().includes('already') ||
        msg.toLowerCase().includes('exist') ||
        msg.toLowerCase().includes('registered') ||
        (result.error as any)?.code === 'USER_ALREADY_EXISTS'

      if (isAlreadyExists) {
        setError(`An account with ${email.trim().toLowerCase()} already exists. Each email address can only be associated with one account. Please sign in instead.`)
      } else {
        setError(msg || 'Failed to create account.')
      }
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setIsVerificationSent(true)
  }

  const handleResendEmail = async () => {
    setIsResending(true)
    setResendStatus('')
    const result = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/dashboard',
    })
    setIsResending(false)
    if (result.error) {
      setResendStatus('Failed to send verification email. Please try again.')
    } else {
      setResendStatus('Verification link resent successfully! Check your inbox.')
    }
  }

  const handleGoogleSignIn = async () => {
    await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' })
  }

  const handleGithubSignIn = async () => {
    await authClient.signIn.social({ provider: 'github', callbackURL: '/dashboard' })
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
        <h2 className="mt-6 text-3xl font-extrabold text-white tracking-tight">Create your account</h2>
        <p className="mt-2 text-sm text-slate-400">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div
          suppressHydrationWarning
          className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10"
        >

          {isVerificationSent ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Mail className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Check your email</h3>
                <p className="text-sm text-slate-400">
                  We sent a verification link to <span className="text-indigo-400 font-semibold">{email}</span>.
                  Click the link in the email to activate your account.
                </p>
              </div>

              {resendStatus && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-indigo-300">
                  {resendStatus}
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all disabled:opacity-60"
                >
                  {isResending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Resend Verification Email</span>
                  )}
                </button>

                <Link
                  href="/login"
                  className="block text-center text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* OAuth Buttons */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-all"
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
                  onClick={handleGithubSignIn}
                  className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 bg-slate-950 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-all"
                >
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-3 text-slate-500 font-medium">or with email</span>
                </div>
              </div>

              {error && (
                <div className="mb-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  {error.includes('already exists') && (
                    <div className="pt-1 pl-6">
                      <Link
                        href={`/login?email=${encodeURIComponent(email)}`}
                        className="inline-flex items-center space-x-1 font-bold text-indigo-400 hover:text-indigo-300 underline text-xs"
                      >
                        <span>Sign in to your existing account</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Work Email
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
                      placeholder="john@company.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Password <span className="text-slate-500 normal-case">(min 8 chars)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                      placeholder="Create a strong password"
                    />
                  </div>
                </div>

                <p className="text-xs text-slate-500">
                  By signing up you agree to our{' '}
                  <Link href="/terms" className="text-indigo-400 hover:underline">Terms</Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                </p>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <ButtonSpinner className="w-4 h-4 text-white" />
                      <span>Creating account...</span>
                    </>
                  ) : (
                    <>
                      <span suppressHydrationWarning>Start 7-Day Free Trial</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
