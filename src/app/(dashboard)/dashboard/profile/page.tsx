'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import {
  User,
  Mail,
  Shield,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Lock,
  KeyRound,
  Sparkles,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLoader } from '@/components/ui/loader'

export default function ProfilePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isRevokingSessions, setIsRevokingSessions] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [revokeOthers, setRevokeOthers] = useState(true)
  const [showCurrentPass, setShowCurrentPass] = useState(false)
  const [showNewPass, setShowNewPass] = useState(false)

  // Feedback Messages
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [securityMessage, setSecurityMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    setMounted(true)
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/user/profile')
      const json = await res.json()
      if (json.success) {
        setProfile(json.data)
        setName(json.data.name || '')
        setImage(json.data.image || '')
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileMessage(null)
    try {
      setIsSavingProfile(true)
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image }),
      })
      const json = await res.json()
      if (json.success) {
        setProfileMessage({ type: 'success', text: 'Profile updated successfully!' })
        fetchProfile()
      } else {
        setProfileMessage({ type: 'error', text: json.error || 'Failed to update profile.' })
      }
    } catch (err) {
      setProfileMessage({ type: 'error', text: 'An unexpected error occurred.' })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' })
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' })
      return
    }

    try {
      setIsChangingPassword(true)
      const res = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          revokeOtherSessions: revokeOthers,
        }),
      })

      const json = await res.json()

      if (json.success) {
        setPasswordMessage({ type: 'success', text: json.message || 'Password updated successfully!' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: json.error || 'Failed to update password.' })
      }
    } catch (err) {
      setPasswordMessage({ type: 'error', text: 'An error occurred while changing password.' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const handleRevokeAllSessions = async () => {
    if (!confirm('Are you sure you want to log out of all other devices?')) return
    setSecurityMessage(null)
    try {
      setIsRevokingSessions(true)
      await authClient.revokeSessions()
      setSecurityMessage({ type: 'success', text: 'Signed out of all other device sessions!' })
    } catch (err: any) {
      setSecurityMessage({ type: 'error', text: err?.message || 'Failed to revoke other sessions.' })
    } finally {
      setIsRevokingSessions(false)
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await authClient.signOut()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      window.location.href = '/login'
    }
  }

  const getInitials = (n: string) => {
    if (!n) return 'U'
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  if (!mounted || isLoading) {
    return (
      <div suppressHydrationWarning className="p-4 sm:p-6 md:p-8 flex items-center justify-center min-h-[80vh] bg-slate-950 text-slate-50 w-full max-w-full">
        <PageLoader text="Loading Profile & Account Details" subtext="Securing session credentials and loading user profile" />
      </div>
    )
  }

  return (
    <div suppressHydrationWarning className="p-4 sm:p-6 md:p-8 space-y-8 sm:space-y-10 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">User Profile & Account</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your personal profile, credentials, active sessions, and security options.
          </p>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/30 transition-all shadow-lg self-start sm:self-auto"
        >
          {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
        </button>
      </div>

      {/* User Info Overview Banner */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl flex flex-col sm:flex-row items-center space-y-6 sm:space-y-0 sm:space-x-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
          <Sparkles className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-2xl border-4 border-slate-800 shrink-0 relative overflow-hidden">
          {image ? (
            <img src={image} alt={name} className="w-full h-full rounded-full object-cover" />
          ) : (
            getInitials(profile?.name)
          )}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white">{profile?.name || name}</h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit self-center sm:self-auto">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Verified User
            </span>
          </div>

          <p className="text-xs sm:text-sm font-mono text-slate-400 flex items-center justify-center sm:justify-start space-x-2">
            <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{profile?.email}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2 text-xs">
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
              Role: <strong className="text-indigo-400">{profile?.role || 'Member'}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
              Workspace: <strong className="text-purple-400">{profile?.organization?.name || 'Personal'}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
              Plan: <strong className="text-emerald-400">{profile?.plan || 'Starter'}</strong>
            </span>
            {profile?.createdAt && (
              <span className="px-3 py-1 rounded-full bg-slate-800/60 text-slate-400 border border-slate-800 text-[11px] inline-flex items-center space-x-1">
                <Calendar className="w-3 h-3" />
                <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Edit Profile Form */}
        <form onSubmit={handleUpdateProfile} className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <User className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Personal Profile</h3>
              <p className="text-xs text-slate-400 mt-0.5">Update your display name and avatar photo</p>
            </div>
          </div>

          {profileMessage && (
            <div
              className={`flex items-center space-x-3 p-4 rounded-2xl text-xs font-semibold border ${
                profileMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{profileMessage.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address (Primary Account Email)
              </label>
              <input
                type="email"
                disabled
                value={profile?.email || ''}
                className="w-full px-4 py-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
              <p className="text-[11px] text-slate-500 mt-1">Email changes require workspace owner verification.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Avatar Image URL
              </label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 font-mono text-xs transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">Provide a direct HTTPS link to your profile picture.</p>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center space-x-2 shadow-lg shadow-indigo-600/30 disabled:opacity-60"
            >
              {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSavingProfile ? 'Saving...' : 'Save Profile Details'}</span>
            </button>
          </div>
        </form>

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword} className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
          <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
            <KeyRound className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-lg font-bold text-white">Change Password</h3>
              <p className="text-xs text-slate-400 mt-0.5">Ensure your account uses a strong, secure password</p>
            </div>
          </div>

          {passwordMessage && (
            <div
              className={`flex items-center space-x-3 p-4 rounded-2xl text-xs font-semibold border ${
                passwordMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{passwordMessage.text}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPass ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPass(!showCurrentPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                New Password (Min. 8 characters)
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass(!showNewPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input
                id="revoke-others"
                type="checkbox"
                checked={revokeOthers}
                onChange={(e) => setRevokeOthers(e.target.checked)}
                className="w-4 h-4 rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="revoke-others" className="text-xs text-slate-300 font-medium cursor-pointer">
                Log out of all other devices when updating password
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all inline-flex items-center space-x-2 shadow-lg shadow-indigo-600/30 disabled:opacity-60"
            >
              {isChangingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              <span>{isChangingPassword ? 'Updating Password...' : 'Update Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security & Sessions Box */}
      <div className="p-8 rounded-3xl border border-slate-800 bg-slate-900/60 space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <Shield className="w-5 h-5 text-indigo-400" />
          <div>
            <h3 className="text-lg font-bold text-white">Active Sessions & Security</h3>
            <p className="text-xs text-slate-400 mt-0.5">Manage signed-in sessions across browsers and devices</p>
          </div>
        </div>

        {securityMessage && (
          <div
            className={`flex items-center space-x-3 p-4 rounded-2xl text-xs font-semibold border ${
              securityMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {securityMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{securityMessage.text}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950 border border-slate-800/80">
          <div>
            <span className="text-xs font-bold text-white block">Current Device Session</span>
            <span className="text-xs text-slate-400 block mt-0.5">
              Signed in as <strong className="text-slate-200">{profile?.email}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleRevokeAllSessions}
            disabled={isRevokingSessions}
            className="px-4 py-2 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 font-semibold text-xs rounded-xl border border-slate-700 transition-all shrink-0 self-start sm:self-auto disabled:opacity-60"
          >
            {isRevokingSessions ? 'Revoking...' : 'Sign Out All Other Devices'}
          </button>
        </div>
      </div>
    </div>
  )
}
