'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { QrCode, LayoutDashboard, BarChart3, Folder, Tag, Users, CreditCard, Key, Settings, HelpCircle } from 'lucide-react'

const navItems = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'My QR Codes', href: '/dashboard/qr', icon: QrCode },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Folders & Tags', href: '/dashboard/folders', icon: Folder },
  { name: 'Team Members', href: '/dashboard/team', icon: Users },
  { name: 'Billing & Plan', href: '/dashboard/billing', icon: CreditCard },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex min-h-screen">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center space-x-3 mb-8">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">QRFlow</span>
        </Link>

        <nav className="space-y-1">
          {navItems.map((item) => {
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
        </nav>
      </div>

      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
            JD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">John Doe</p>
            <p className="text-xs text-slate-500 truncate">Pro Workspace</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
