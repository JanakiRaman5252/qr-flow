'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  QrCode,
  LayoutDashboard,
  BarChart3,
  Folder,
  Users,
  CreditCard,
  Key,
  Settings,
  Shield,
  User,
  LogOut,
  Menu,
  X,
  Loader2,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'

export function MobileHeader() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    name?: string
    email?: string
    plan?: string
    isSuperAdmin?: boolean
  } | null>(null)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/user/profile')
        const json = await res.json()
        if (json.success) {
          setUserProfile(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch mobile header user:', err)
      }
    }
    loadUser()
  }, [])

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      await authClient.signOut()
    } catch (err) {
      console.error('Sign out error:', err)
    } finally {
      window.location.href = '/login'
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  const baseNavItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My QR Codes', href: '/dashboard/qr', icon: QrCode },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'Folders & Tags', href: '/dashboard/folders', icon: Folder },
    { name: 'Team Members', href: '/dashboard/team', icon: Users },
    { name: 'Billing & Plan', href: '/dashboard/billing', icon: CreditCard },
    { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
    { name: 'Profile & Account', href: '/dashboard/profile', icon: User },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="block md:hidden border-b border-slate-800 bg-slate-900 sticky top-0 z-40">
      {/* Mobile Top Bar */}
      <div className="flex items-center justify-between p-4">
        <Link href="/dashboard" className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white">QRFlow</span>
        </Link>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:outline-none"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {isOpen && (
        <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-6 animate-fade-in shadow-2xl">
          <nav className="space-y-1">
            {baseNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Super Admin Console Link */}
            {userProfile?.isSuperAdmin && (
              <div className="pt-3 mt-3 border-t border-slate-800">
                <span className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Platform Admin
                </span>
                <Link
                  href="/dashboard/admin/plans"
                  className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                    pathname.includes('/admin')
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Shield className={`w-5 h-5 ${pathname.includes('/admin') ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>Admin Control</span>
                </Link>
              </div>
            )}
          </nav>

          {/* User Profile & Logout Footer */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <Link
              href="/dashboard/profile"
              className="flex items-center space-x-3 p-2 rounded-xl bg-slate-900 border border-slate-800"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                {getInitials(userProfile?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{userProfile?.name || 'User'}</p>
                <p className="text-[11px] text-slate-400 truncate">{userProfile?.plan || 'Starter'} Plan</p>
              </div>
            </Link>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-all"
            >
              {isLoggingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
              <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
