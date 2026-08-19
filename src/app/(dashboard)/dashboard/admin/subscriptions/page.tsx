'use client'

import React, { useEffect, useState } from 'react'
import { SubscriptionStatusBadge } from '@/components/billing/SubscriptionStatus'
import { formatPrice } from '@/lib/billing/formatters'
import { Loader2, Search, Filter, Users, ShieldCheck, DollarSign, Calendar, CreditCard } from 'lucide-react'
import { PageLoader } from '@/components/ui/loader'

export default function AdminSubscriptionsPage() {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [planFilter, setPlanFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true)
      const url = new URL('/api/admin/billing/subscriptions', window.location.origin)
      url.searchParams.set('page', page.toString())
      if (search) url.searchParams.set('search', search)
      if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter)
      if (planFilter !== 'ALL') url.searchParams.set('planSlug', planFilter)

      const res = await fetch(url.toString())
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch (err) {
      console.error('Failed to fetch tenant purchases:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [search, statusFilter, planFilter, page])

  const totalPurchases = data?.total || 0
  const items = data?.items || []

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-extrabold text-white">Tenant Purchase & Subscription List</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Overview of all workspaces that have registered or purchased SaaS subscription plans.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search workspace or owner email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="TRIALING">Trialing</option>
              <option value="PAST_DUE">Past Due</option>
              <option value="CANCELED">Canceled</option>
              <option value="INCOMPLETE">Incomplete</option>
            </select>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <span>Plan:</span>
            <select
              value={planFilter}
              onChange={(e) => {
                setPlanFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none"
            >
              <option value="ALL">All Plans</option>
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenant Purchases Table */}
      {isLoading ? (
        <PageLoader text="Loading Tenant Subscriptions" subtext="Fetching active subscriptions, recurring billing, and workspace plans" />
      ) : items.length === 0 ? (
        <div className="p-12 rounded-3xl border border-slate-800 bg-slate-900/60 text-center space-y-2">
          <Users className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">No tenant purchases found.</p>
          <p className="text-xs text-slate-500">Try clearing search or filter criteria.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/90 uppercase tracking-wider text-[11px]">
                  <th className="p-4 font-bold">Tenant Workspace</th>
                  <th className="p-4 font-bold">Owner / Buyer</th>
                  <th className="p-4 font-bold">Purchased Plan</th>
                  <th className="p-4 font-bold">Cycle</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold">Subscribed Date</th>
                  <th className="p-4 font-bold">Renewal Date</th>
                  <th className="p-4 font-bold text-right">Payments</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {items.map((sub: any) => {
                  const owner = sub.organization?.members?.[0]?.user
                  const plan = sub.plan
                  const paymentsCount = sub.payments?.length || 0
                  const capturedPayments = sub.payments?.filter((p: any) => p.status === 'captured') || []
                  const totalPaid = capturedPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white text-sm">{sub.organization?.name || 'Unnamed Org'}</div>
                        <div className="text-[11px] font-mono text-slate-500">slug: {sub.organization?.slug}</div>
                      </td>

                      <td className="p-4">
                        {owner ? (
                          <div>
                            <div className="font-semibold text-slate-200">{owner.name}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{owner.email}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-white text-sm">
                            {plan?.name || 'Free'}
                          </span>
                          {!plan?.isFree && sub.amount ? (
                            <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                              {formatPrice(sub.amount, sub.currency)}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">Free</span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 font-mono text-slate-400">
                        {sub.billingCycle ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300">
                            {sub.billingCycle}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="p-4">
                        <SubscriptionStatusBadge status={sub.status} cancelAtPeriodEnd={sub.cancelAtPeriodEnd} />
                      </td>

                      <td className="p-4 text-slate-400">
                        {new Date(sub.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="p-4 text-slate-400">
                        {sub.currentPeriodEnd
                          ? new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </td>

                      <td className="p-4 text-right">
                        <div className="font-bold text-white">
                          {totalPaid > 0 ? formatPrice(totalPaid, sub.currency) : '₹0'}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {paymentsCount} transaction{paymentsCount === 1 ? '' : 's'}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {data?.totalPages > 1 && (
            <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>
                Page {page} of {data.totalPages} ({totalPurchases} total tenant records)
              </span>
              <div className="flex space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={page >= data.totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-white disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
