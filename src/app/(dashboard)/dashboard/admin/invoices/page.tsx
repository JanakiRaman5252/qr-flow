'use client'

import React, { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/billing/formatters'
import { PageLoader } from '@/components/ui/loader'

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setIsLoading(true)
        const res = await fetch('/api/billing/invoices?pageSize=50')
        const json = await res.json()
        if (json.success) setInvoices(json.data?.items || [])
      } catch (err) {
        console.error('Failed to fetch admin invoices:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchInvoices()
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-950 text-slate-50 min-h-screen">
        <PageLoader text="Loading Admin Invoices" subtext="Fetching invoice numbers, statuses, and payment records" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Generated Invoices</h3>
        <p className="text-xs text-slate-400">System invoice records generated upon payment capture.</p>
      </div>

      {invoices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No invoices issued yet.</p>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                <th className="p-4 font-semibold">Invoice #</th>
                <th className="p-4 font-semibold">Total</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Issued Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30">
                  <td className="p-4 font-mono font-semibold text-white">{inv.invoiceNumber}</td>
                  <td className="p-4 font-bold">{formatPrice(inv.total, inv.currency)}</td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase">
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(inv.issuedAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
