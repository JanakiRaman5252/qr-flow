'use client'

import { useState } from 'react'
import { CreditCard, CheckCircle2, Zap, Shield, FileText, ArrowUpRight, Check, Sparkles } from 'lucide-react'

const mockInvoices = [
  { id: 'inv_1001', date: '2026-07-01', amount: '₹1,499', plan: 'Pro Monthly', status: 'Paid', receiptUrl: '#' },
  { id: 'inv_1000', date: '2026-06-01', amount: '₹1,499', plan: 'Pro Monthly', status: 'Paid', receiptUrl: '#' },
  { id: 'inv_0999', date: '2026-05-01', amount: '₹1,499', plan: 'Pro Monthly', status: 'Paid', receiptUrl: '#' },
]

export default function BillingPage() {
  const [couponCode, setCouponCode] = useState('')
  const [couponMessage, setCouponMessage] = useState('')

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim()) return
    if (couponCode.toUpperCase() === 'WELCOME20') {
      setCouponMessage('🎉 Coupon applied! 20% discount added to your next renewal.')
    } else {
      setCouponMessage('❌ Invalid or expired coupon code.')
    }
  }

  const handleUpgrade = (planName: string, amount: number) => {
    // Triggers Razorpay Checkout modal
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_placeholder',
      amount: amount * 100, // paise
      currency: 'INR',
      name: 'QRFlow SaaS',
      description: `Upgrade to ${planName} Plan`,
      handler: function (response: any) {
        alert(`Payment successful! Payment ID: ${response.razorpay_payment_id}`)
      },
      theme: {
        color: '#4F46E5',
      },
    }

    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } else {
      alert(`Razorpay checkout initialized for ${planName} Plan (₹${amount}/mo).`)
    }
  }

  return (
    <div className="p-8 space-y-8 bg-slate-950 text-slate-50 min-h-screen">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Billing & Subscription</h1>
        <p className="text-slate-400 text-sm mt-1">Manage your workspace subscription, Razorpay payments, and invoices.</p>
      </div>

      {/* Current Active Plan Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-900/40 via-slate-900 to-slate-900 border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Active Plan</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white">Pro Plan</h2>
          <p className="text-sm text-slate-400">Renews on August 1, 2026 via Razorpay Automatic Billing</p>
        </div>

        {/* Usage Gauges */}
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 min-w-40">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Dynamic QRs</span>
            <div className="text-xl font-bold text-white mt-1">38 / 100</div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full" style={{ width: '38%' }} />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 min-w-40">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Monthly Scans</span>
            <div className="text-xl font-bold text-white mt-1">128.4K / Unlimited</div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Tier Cards */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Available Upgrade Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Starter</h3>
              <p className="text-xs text-slate-400 mt-1">Essential tools for creators</p>
              <div className="mt-4 flex items-baseline space-x-1">
                <span className="text-3xl font-extrabold text-white">₹499</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 20 Dynamic QR Codes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 50,000 Scans / month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Standard Geo Analytics</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('Starter', 499)}
              className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all"
            >
              Downgrade to Starter
            </button>
          </div>

          {/* Pro */}
          <div className="p-6 rounded-2xl bg-slate-900 border-2 border-indigo-500 relative flex flex-col justify-between shadow-lg shadow-indigo-500/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider">
              Current Plan
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Pro</h3>
              <p className="text-xs text-slate-400 mt-1">For growing marketing teams</p>
              <div className="mt-4 flex items-baseline space-x-1">
                <span className="text-3xl font-extrabold text-white">₹1,499</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> 100 Dynamic QR Codes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited Scans</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Advanced Heatmaps & UTM Builder</li>
              </ul>
            </div>
            <button
              disabled
              className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600/30 text-indigo-300 font-semibold text-xs cursor-default"
            >
              Current Active Plan
            </button>
          </div>

          {/* Enterprise */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Enterprise</h3>
              <p className="text-xs text-slate-400 mt-1">Custom limits & SLA guarantees</p>
              <div className="mt-4 flex items-baseline space-x-1">
                <span className="text-3xl font-extrabold text-white">₹4,999</span>
                <span className="text-slate-400 text-xs">/month</span>
              </div>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Unlimited QR Codes</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> Custom Domains & White-label</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-indigo-400 shrink-0" /> REST API & Webhooks Access</li>
              </ul>
            </div>
            <button
              onClick={() => handleUpgrade('Enterprise', 4999)}
              className="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20"
            >
              Upgrade to Enterprise
            </button>
          </div>
        </div>
      </div>

      {/* Coupon Code Section */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 max-w-xl">
        <h3 className="text-sm font-bold text-white mb-2">Have a Promo or Coupon Code?</h3>
        <form onSubmit={handleApplyCoupon} className="flex gap-3">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            placeholder="Enter code (e.g. WELCOME20)"
            className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-all"
          >
            Apply Code
          </button>
        </form>
        {couponMessage && <p className="text-xs mt-3">{couponMessage}</p>}
      </div>

      {/* Invoices Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-6">
        <h3 className="text-lg font-bold text-white mb-4">Payment History & Invoices</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-950/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3 font-semibold">Invoice ID</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3.5 font-mono text-xs text-white">{inv.id}</td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">{inv.date}</td>
                  <td className="px-4 py-3.5 text-xs text-white">{inv.plan}</td>
                  <td className="px-4 py-3.5 font-semibold text-white">{inv.amount}</td>
                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        alert(`Receipt for ${inv.id} downloaded.`)
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Download
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
