import { Suspense } from 'react'
import ResetPasswordForm from './reset-password-form'

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-sm text-slate-400">
            Loading reset password...
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}