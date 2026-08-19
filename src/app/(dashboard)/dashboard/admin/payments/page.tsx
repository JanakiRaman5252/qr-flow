'use client'

import React, { useEffect, useState } from 'react'
import { formatPrice } from '@/lib/billing/formatters'
import { PageLoader } from '@/components/ui/loader'

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchPayments() {
      try {
        setIsLoading(true)
        const res = await fetch('/api/billing/payments?pageSize=50')
        const json = await res.json()
        if (json.success) setPayments(json.data?.items || [])
      } catch (err) {
        console.error('Failed to fetch admin payments:', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPayments()
  }, [])

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 space-y-6 bg-slate-950 text-slate-50 min-h-screen">
        <PageLoader text="Loading Payment Audit Logs" subtext="Fetching Razorpay payment transaction IDs and status history" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white">Payment Transactions</h3>
        <p className="text-xs text-slate-400">Audit raw Razorpay payments received across all tenants.</p>
      </div>

      {payments.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-10">No payments captured yet.</p>
      ) : (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 bg-slate-900">
                <th className="p-4 font-semibold">Payment ID</th>
                <th className="p-4 font-semibold">Amount</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="p-4 font-mono font-semibold text-white">{p.razorpayPaymentId}</td>
                  <td className="p-4 font-bold">{formatPrice(p.amount, p.currency)}</td>
                  <td className="p-4">
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 uppercase">
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{new Date(p.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
