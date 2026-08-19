'use client'

import React from 'react'
import { formatPrice } from '@/lib/billing/formatters'
import { CreditCard, ExternalLink, Download } from 'lucide-react'

interface PaymentItem {
  id: string
  razorpayPaymentId: string
  amount: number
  currency: string
  status: string
  createdAt: string
  methodType?: string | null
}

interface InvoiceItem {
  id: string
  invoiceNumber: string
  total: number
  currency: string
  status: string
  issuedAt: string
  invoiceUrl?: string | null
}

interface PaymentHistoryProps {
  payments: PaymentItem[]
  invoices: InvoiceItem[]
}

export function PaymentHistory({ payments, invoices }: PaymentHistoryProps) {
  const [tab, setTab] = React.useState<'payments' | 'invoices'>('payments')

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <h3 className="text-lg font-bold text-white">Billing History</h3>
        <div className="flex space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setTab('payments')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              tab === 'payments' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setTab('invoices')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
              tab === 'invoices' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Invoices
          </button>
        </div>
      </div>

      {tab === 'payments' ? (
        payments.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No payment records found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="pb-3 font-semibold">Payment ID</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {payments.map((pmt) => (
                  <tr key={pmt.id} className="hover:bg-slate-800/30">
                    <td className="py-3 font-mono text-slate-200">{pmt.razorpayPaymentId}</td>
                    <td className="py-3 font-semibold text-white">{formatPrice(pmt.amount, pmt.currency)}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          pmt.status === 'captured'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {pmt.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(pmt.createdAt).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : invoices.length === 0 ? (
        <p className="text-sm text-slate-400 text-center py-6">No invoices found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-3 font-semibold">Invoice #</th>
                <th className="pb-3 font-semibold">Total</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold">Issued Date</th>
                <th className="pb-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30">
                  <td className="py-3 font-mono font-semibold text-white">{inv.invoiceNumber}</td>
                  <td className="py-3 font-semibold">{formatPrice(inv.total, inv.currency)}</td>
                  <td className="py-3">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-amber-500/10 text-amber-400'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400">
                    {new Date(inv.issuedAt).toLocaleDateString('en-IN', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                  <td className="py-3">
                    {inv.invoiceUrl ? (
                      <a
                        href={inv.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center space-x-1 text-indigo-400 hover:text-indigo-300"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
