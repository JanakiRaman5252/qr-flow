'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { QrCode, CheckCircle2, XCircle, Loader2, ArrowRight, Mail } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { PulseLoader } from '@/components/ui/loader'

function VerifyEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const callbackURL = searchParams.get('callbackURL') || '/dashboard'

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setErrorMessage('Missing email verification token.')
      return
    }

    const verify = async () => {
      try {
        const result = await authClient.verifyEmail({
          query: {
            token,
          },
        })

        if (result.error) {
          setStatus('error')
          setErrorMessage(result.error.message || 'Invalid or expired verification link.')
        } else {
          setStatus('success')
          setTimeout(() => {
            router.push(callbackURL)
            router.refresh()
          }, 2000)
        }
      } catch (err: any) {
        setStatus('error')
        setErrorMessage(err.message || 'Failed to verify email.')
      }
    }

    verify()
  }, [token, callbackURL, router])

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl sm:px-10 text-center space-y-6">
      {status === 'loading' && (
        <PulseLoader text="Verifying your email..." subtext="Validating activation token and initializing session" />
      )}

      {status === 'success' && (
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Email verified!</h3>
            <p className="text-sm text-slate-400">Your account is active. Redirecting you now...</p>
          </div>
          <Link
            href={callbackURL}
            className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
          >
            <span>Continue to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <XCircle className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Verification failed</h3>
            <p className="text-sm text-slate-400">{errorMessage || 'The link may be expired or already used.'}</p>
          </div>
          <div className="space-y-3 pt-2">
            <Link
              href="/login"
              className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white">QRFlow</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Suspense fallback={
          <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-slate-800 rounded-2xl text-center text-slate-400">
            Loading...
          </div>
        }>
          <VerifyEmailContent />
        </Suspense>
      </div>
    </div>
  )
}
