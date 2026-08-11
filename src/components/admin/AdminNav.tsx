'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Package, Users, CreditCard, FileText, Activity } from 'lucide-react'

const adminTabs = [
  { name: 'Plan Management', href: '/dashboard/admin/plans', icon: Package },
  { name: 'Tenant Purchases', href: '/dashboard/admin/subscriptions', icon: Users },
  { name: 'Payment Logs', href: '/dashboard/admin/payments', icon: CreditCard },
  { name: 'Invoices', href: '/dashboard/admin/invoices', icon: FileText },
  { name: 'Audit & Webhooks', href: '/dashboard/admin/billing-events', icon: Activity },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col space-y-4 border-b border-slate-800 pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Super Admin Console</span>
            <h2 className="text-2xl font-black text-white">SaaS Billing Control</h2>
          </div>
        </div>
      </div>

      <nav className="flex space-x-2 overflow-x-auto pb-1 text-xs font-semibold">
        {adminTabs.map((tab) => {
          const isActive = pathname === tab.href
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-bold'
                  : 'bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
