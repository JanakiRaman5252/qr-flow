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
  {
    name: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'My QR Codes',
    href: '/dashboard/qr',
    icon: QrCode,
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
  },
  {
    name: 'Folders & Tags',
    href: '/dashboard/folders',
    icon: Folder,
  },
  {
    name: 'Team Members',
    href: '/dashboard/team',
    icon: Users,
  },
  {
    name: 'Billing & Plan',
    href: '/dashboard/billing',
    icon: CreditCard,
  },
  {
    name: 'API Keys',
    href: '/dashboard/api-keys',
    icon: Key,
  },
  {
    name: 'Profile & Account',
    href: '/dashboard/profile',
    icon: User,
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
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

interface UserProfile {
  name?: string
  email?: string
  plan?: string
  isSuperAdmin?: boolean
  organization?: {
    id: string
    name: string
    slug: string
  }
}

export function DashboardSidebar() {
  const pathname = usePathname()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([])

  const [showWorkspaceDropdown, setShowWorkspaceDropdown] =
    useState(false)

  const [isSwitchingWorkspace, setIsSwitchingWorkspace] =
    useState(false)

  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  /**
   * Client-only initialization.
   *
   * Important for hydration:
   * - Server render: isMounted = false
   * - First client render: isMounted = false
   * - After hydration: isMounted = true
   */
  useEffect(() => {
    setIsMounted(true)

    let cancelled = false

    async function loadSidebarData() {
      try {
        setIsLoading(true)

        const [profileRes, workspacesRes] = await Promise.all([
          fetch('/api/user/profile', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch('/api/user/workspaces', {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }),
        ])

        if (!profileRes.ok) {
          throw new Error(
            `Profile request failed: ${profileRes.status}`,
          )
        }

        if (!workspacesRes.ok) {
          throw new Error(
            `Workspace request failed: ${workspacesRes.status}`,
          )
        }

        const [profileJson, workspacesJson] = await Promise.all([
          profileRes.json(),
          workspacesRes.json(),
        ])

        if (cancelled) {
          return
        }

        if (profileJson?.success) {
          setUserProfile(profileJson.data ?? null)
        }

        if (workspacesJson?.success) {
          setWorkspaces(
            Array.isArray(workspacesJson.data)
              ? workspacesJson.data
              : [],
          )
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            'Failed to load dashboard sidebar data:',
            error,
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadSidebarData()

    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Close mobile navigation when changing routes.
   */
  useEffect(() => {
    setMobileOpen(false)
    setShowWorkspaceDropdown(false)
  }, [pathname])

  /**
   * Prevent body scrolling when mobile drawer is open.
   */
  useEffect(() => {
    if (!mobileOpen) {
      return
    }

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [mobileOpen])

  const currentWorkspace =
    workspaces.find((workspace) => workspace.isCurrent) ??
    workspaces[0] ??
    null

  const getInitials = (name?: string) => {
    if (!name?.trim()) {
      return 'U'
    }

    return name
      .trim()
      .split(/\s+/)
      .map((part) => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    )
  }

  const handleSwitchWorkspace = async (
    organizationId: string,
  ) => {
    if (isSwitchingWorkspace) {
      return
    }

    try {
      setIsSwitchingWorkspace(true)

      const response = await fetch('/api/user/workspaces', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          organizationId,
        }),
      })

      const json = await response.json()

      if (!response.ok || !json?.success) {
        throw new Error(
          json?.message ||
            json?.error ||
            'Failed to switch workspace',
        )
      }

      window.location.reload()
    } catch (error) {
      console.error('Switch workspace error:', error)
      setIsSwitchingWorkspace(false)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    try {
      setIsLoggingOut(true)
      await authClient.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      window.location.href = '/login'
    }
  }

  return (
    <aside className="w-full md:w-64 md:shrink-0">
      {/* =========================================================
          MOBILE HEADER
          ========================================================= */}
      <div className="md:hidden w-full border-b border-slate-800 bg-slate-900 sticky top-0 z-50">
        <div className="flex items-center justify-between p-4">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3"
            aria-label="QRFlow Dashboard"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
              <QrCode className="w-5 h-5" />
            </div>

            <span className="font-bold text-xl tracking-tight text-white">
              QRFlow
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileOpen((value) => !value)}
            className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label={
              mobileOpen
                ? 'Close navigation menu'
                : 'Open navigation menu'
            }
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* =======================================================
            MOBILE DRAWER
            ======================================================= */}
        {mobileOpen && (
          <div className="border-t border-slate-800 bg-slate-950 p-4 space-y-6 shadow-2xl">
            {/* Workspace selector */}
            {workspaces.length > 1 && (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2">
                  Active Workspace
                </span>

                <div className="space-y-1">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() =>
                        handleSwitchWorkspace(workspace.id)
                      }
                      disabled={isSwitchingWorkspace}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all ${
                        workspace.isCurrent
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <span className="truncate">
                        {workspace.name}
                      </span>

                      {workspace.isCurrent && (
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation */}
            <nav
              className="space-y-1"
              aria-label="Mobile navigation"
            >
              {baseNavItems.map((item) => {
                const isActive = isActiveRoute(item.href)
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
                    <Icon
                      className={`w-5 h-5 ${
                        isActive
                          ? 'text-indigo-400'
                          : 'text-slate-400'
                      }`}
                    />

                    <span>{item.name}</span>
                  </Link>
                )
              })}

              {/* Platform admin */}
              {isMounted &&
                userProfile?.isSuperAdmin && (
                  <div className="pt-3 mt-3 border-t border-slate-800">
                    <span className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                      Platform Admin
                    </span>

                    <Link
                      href="/dashboard/admin/plans"
                      className={`flex items-center space-x-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all ${
                        pathname.startsWith(
                          '/dashboard/admin',
                        )
                          ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      <Shield
                        className={`w-5 h-5 ${
                          pathname.startsWith(
                            '/dashboard/admin',
                          )
                            ? 'text-indigo-400'
                            : 'text-slate-400'
                        }`}
                      />

                      <span>Admin Control</span>
                    </Link>
                  </div>
                )}
            </nav>

            {/* Mobile profile */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {isMounted ? (
                <Link
                  href="/dashboard/profile"
                  className="flex items-center space-x-3 p-2 rounded-xl bg-slate-900 border border-slate-800"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md shrink-0">
                    {getInitials(userProfile?.name)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {userProfile?.name || 'User'}
                    </p>

                    <p className="text-[11px] text-slate-400 truncate">
                      {userProfile?.plan || 'Starter'} Plan
                    </p>
                  </div>
                </Link>
              ) : (
                <div className="h-13 bg-slate-800/40 rounded-xl animate-pulse" />
              )}

              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}

                <span>
                  {isLoggingOut
                    ? 'Logging out...'
                    : 'Log Out'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================
          DESKTOP SIDEBAR
          ========================================================= */}
      <div className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col justify-between shrink-0 h-screen sticky top-0">
        {/* Main navigation */}
        <div className="p-6 overflow-y-auto min-h-0">
          {/* Logo */}
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 mb-6"
            aria-label="QRFlow Dashboard"
          >
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
              <QrCode className="w-5 h-5" />
            </div>

            <span className="font-bold text-xl tracking-tight text-white">
              QRFlow
            </span>
          </Link>

          {/* Workspace selector */}
          <div className="relative mb-6">
            <button
              type="button"
              onClick={() =>
                setShowWorkspaceDropdown(
                  (value) => !value,
                )
              }
              className="w-full flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 hover:bg-slate-800/80 border border-slate-800 text-left transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500"
              aria-expanded={showWorkspaceDropdown}
              aria-haspopup="menu"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                  <Building2 className="w-3.5 h-3.5" />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate group-hover:text-indigo-300">
                    {currentWorkspace?.name ||
                      userProfile?.organization?.name ||
                      'Workspace'}
                  </p>

                  <p className="text-[10px] text-slate-500 capitalize">
                    {currentWorkspace?.role?.toLowerCase() ||
                      'Member'}
                  </p>
                </div>
              </div>

              {workspaces.length > 1 && (
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    showWorkspaceDropdown
                      ? 'rotate-180'
                      : ''
                  }`}
                />
              )}
            </button>

            {/* Workspace dropdown */}
            {showWorkspaceDropdown &&
              workspaces.length > 1 && (
                <div
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 p-1.5 rounded-xl bg-slate-950 border border-slate-800 shadow-2xl space-y-1"
                  role="menu"
                >
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Switch Workspace
                  </span>

                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => {
                        setShowWorkspaceDropdown(false)
                        handleSwitchWorkspace(
                          workspace.id,
                        )
                      }}
                      disabled={isSwitchingWorkspace}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs transition-all text-left disabled:opacity-50 ${
                        workspace.isCurrent
                          ? 'bg-indigo-600/20 text-indigo-300 font-bold border border-indigo-500/30'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="truncate">
                        <p className="truncate font-semibold">
                          {workspace.name}
                        </p>

                        <p className="text-[10px] text-slate-500 capitalize">
                          {workspace.role.toLowerCase()}
                        </p>
                      </div>

                      {workspace.isCurrent && (
                        <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              )}
          </div>

          {/* Desktop navigation */}
          <nav
            className="space-y-1"
            aria-label="Desktop navigation"
          >
            {baseNavItems.map((item) => {
              const isActive = isActiveRoute(item.href)
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
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-indigo-400'
                        : 'text-slate-400'
                    }`}
                  />

                  <span>{item.name}</span>
                </Link>
              )
            })}

            {/* Platform admin */}
            {isMounted &&
              userProfile?.isSuperAdmin && (
                <div className="pt-3 mt-3 border-t border-slate-800/80">
                  <span className="px-3.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-1">
                    Platform Admin
                  </span>

                  <Link
                    href="/dashboard/admin/plans"
                    className={`flex items-center space-x-3 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                      pathname.startsWith(
                        '/dashboard/admin',
                      )
                        ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <Shield
                      className={`w-4 h-4 ${
                        pathname.startsWith(
                          '/dashboard/admin',
                        )
                          ? 'text-indigo-400'
                          : 'text-slate-400'
                      }`}
                    />

                    <span>Admin Control</span>
                  </Link>
                </div>
              )}
          </nav>
        </div>

        {/* Desktop footer */}
        <div className="p-4 border-t border-slate-800 space-y-3 shrink-0">
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

                <p className="text-[11px] text-slate-400 truncate">
                  {userProfile?.plan || 'Starter'} Plan
                </p>
              </div>
            </Link>
          ) : (
            <div className="h-11 bg-slate-800/40 rounded-xl animate-pulse" />
          )}

          <button
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center space-x-2 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 text-xs font-semibold border border-slate-700/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <LogOut className="w-3.5 h-3.5" />
            )}

            <span>
              {isLoggingOut
                ? 'Logging out...'
                : 'Log Out'}
            </span>
          </button>
        </div>
      </div>
    </aside>
  )
}

