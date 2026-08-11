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
  Loader2,
  Menu,
  X,
  ChevronDown,
  Building2,
  Check,
} from 'lucide-react'
import { authClient } from '@/lib/auth-client'

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

interface WorkspaceItem {
  id: string
  name: string
  slug: string
  role: string
  memberCount: number
  qrCount: number
  isCurrent: boolean
}

export function DashboardSidebar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<{
    name?: string
    email?: string
    plan?: string
    isSuperAdmin?: boolean
    organization?: { id: string; name: string; slug: string }
  } | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false)
  const [isSwitchingWorkspace, setIsSwitchingWorkspace] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    async function loadData() {
      try {
        const [profileRes, workspacesRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/workspaces'),
        ])
        const profileJson = await profileRes.json()
        const workspacesJson = await workspacesRes.json()

        if (profileJson.success) {
          setUserProfile(profileJson.data)
        }
        if (workspacesJson.success) {
          setWorkspaces(workspacesJson.data)
        }
      } catch (err) {
        console.error('Failed to fetch sidebar data:', err)
      }
    }
    loadData()
  }, [])

  // Auto-close mobile drawer on route navigation
  useEffect(() => {
    setMobileOpen(false)
    setShowWorkspaceDropdown(false)
  }, [pathname])

  const handleSwitchWorkspace = async (organizationId: string) => {
    try {
      setIsSwitchingWorkspace(true)
      const res = await fetch('/api/user/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId }),
      })
      const json = await res.json()
      if (json.success) {
        window.location.reload()
      }
    } catch (err) {
      console.error('Switch workspace error:', err)
      setIsSwitchingWorkspace(false)
    }
  }

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

  const currentWorkspace = workspaces.find((w) => w.isCurrent) || workspaces[0]

  return (
    <div suppressHydrationWarning className="w-full md:w-64 md:shrink-0">
      {/* 📱 MOBILE TOP HEADER & DRAWER (Visible ONLY on Mobile < md) */}
      <div className="w-full md:hidden border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">QRFlow</span>
          </Link>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Slide-Down Drawer */}
        {mobileOpen && (
          <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-6 shadow-2xl">
            {/* Mobile Workspace Selector */}
            {workspaces.length > 1 && (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2">
                  Active Workspace
                </span>
                <div className="space-y-1">
                  {workspaces.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleSwitchWorkspace(w.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all ${
                        w.isCurrent ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">{w.name}</span>
                      {w.isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

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

              {/* Super Admin Console Link (Mobile) */}
              {isMounted && userProfile?.isSuperAdmin && (
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
                    <Shield
                      className={`w-5 h-5 ${pathname.includes('/admin') ? 'text-indigo-400' : 'text-slate-400'}`}
                    />
                    <span>Admin Control</span>
                  </Link>
                </div>
              )}
            </nav>

            {/* Mobile Footer Profile */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {isMounted && (
                <Link
                  href="/dashboard/profile"
                  className="flex items-center space-x-3 p-2 rounded-xl bg-slate-900 border border-slate-800"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                    {getInitials(userProfile?.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">{userProfile?.name || 'User'}</p>
                    <p className="text-[11px] text-slate-400 truncate">{userProfile?.plan || 'Free'} Plan</p>
                  </div>
                </Link>
              )}

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

      {/* 💻 DESKTOP SIDEBAR (Visible ONLY on Desktop >= md) */}
      <aside
        suppressHydrationWarning
        className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 h-screen sticky top-0"
      >
        <div className="p-6 overflow-y-auto">
          {/* Logo Brand */}
          <Link href="/dashboard" className="flex items-center space-x-3 mb-6">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
              <QrCode className="w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">QRFlow</span>
          </Link>

          {/* Workspace Switcher Selector */}
          <div className="relative mb-6">
            <button
              onClick={() => setShowWorkspaceDropdown(!showWorkspaceDropdown)}
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                    {currentWorkspace?.name || userProfile?.organization?.name || 'Workspace'}
                  </p>
                  <p className="text-[10px] text-slate-500 capitalize">{currentWorkspace?.role?.toLowerCase() || 'Member'}</p>
                </div>
              </div>
              {workspaces.length > 1 && (
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showWorkspaceDropdown ? 'rotate-180' : ''}`} />
              )}
            </button>

            {/* Dropdown Menu for Workspaces */}
            {showWorkspaceDropdown && workspaces.length > 1 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 p-1.5 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl space-y-1">
                <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Switch Workspace
                </span>
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    onClick={() => {
                      setShowWorkspaceDropdown(false)
                      handleSwitchWorkspace(w.id)
                    }}
                    disabled={isSwitchingWorkspace}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all text-left ${
                      w.isCurrent
                        ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="truncate">
                      <p className="truncate font-semibold">{w.name}</p>
                      <p className="text-[10px] text-slate-500 capitalize">{w.role.toLowerCase()}</p>
                    </div>
                    {w.isCurrent && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <nav suppressHydrationWarning className="space-y-1">
            {baseNavItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Super Admin Console Link */}
            {isMounted && userProfile?.isSuperAdmin && (
              <div className="pt-3 mt-3 border-t border-slate-800/80">
                <span className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                  Platform Admin
                </span>
                <Link
                  href="/dashboard/admin/plans"
                  className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    pathname.includes('/admin')
                      ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Shield
                    className={`w-4 h-4 ${pathname.includes('/admin') ? 'text-indigo-400' : 'text-slate-400'}`}
                  />
                  <span>Admin Control</span>
                </Link>
              </div>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-3 shrink-0" suppressHydrationWarning>
          {isMounted ? (
            <Link
              href="/dashboard/profile"
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-slate-800/60 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                {getInitials(userProfile?.name)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                  {userProfile?.name || 'User'}
                </p>
                <p className="text-[11px] text-slate-400 truncate">{userProfile?.plan || 'Free'} Plan</p>
              </div>
            </Link>
          ) : (
            <div className="h-11 bg-slate-800/40 rounded-xl animate-pulse" />
          )}

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-all"
          >
            {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
          </button>
        </div>
      </aside>
    </div>
  )
}
