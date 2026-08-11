'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Edit2, Loader2, RefreshCw } from 'lucide-react'
import { formatPrice } from '@/lib/billing/plans'

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<any | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const fetchPlans = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/admin/billing/plans')
      const json = await res.json()
      if (json.success) setPlans(json.data)
    } catch (err) {
      console.error('Failed to fetch admin plans:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPlans()
  }, [])

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPlan) return

    try {
      setIsSaving(true)
      const res = await fetch('/api/admin/billing/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingPlan),
      })
      const json = await res.json()
      if (json.success) {
        setEditingPlan(null)
        fetchPlans()
      } else {
        alert(json.error || 'Save failed')
      }
    } catch (err) {
      alert('Failed to save plan')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center space-x-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
        <span className="text-xs">Loading plans...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white">Subscription Plans</h3>
          <p className="text-xs text-slate-400">Configure database pricing tiers, quotas, and Razorpay Plan IDs.</p>
        </div>

        <button
          onClick={() =>
            setEditingPlan({
              name: '',
              slug: '',
              description: '',
              monthlyPrice: 0,
              yearlyPrice: 0,
              trialDays: 0,
              isFree: false,
              isRecommended: false,
              sortOrder: plans.length,
              marketingFeatures: [],
            })
          }
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Plan</span>
        </button>
      </div>

      {editingPlan && (
        <form
          onSubmit={handleSavePlan}
          className="rounded-3xl border border-indigo-500/30 bg-slate-900/90 p-6 space-y-4"
        >
          <h4 className="text-base font-bold text-white">
            {editingPlan.id ? 'Edit Plan' : 'Create New Plan'}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Plan Name</label>
              <input
                type="text"
                value={editingPlan.name}
                onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Slug</label>
              <input
                type="text"
                value={editingPlan.slug}
                onChange={(e) => setEditingPlan({ ...editingPlan, slug: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Monthly Price (in Paise, e.g. 49900 = ₹499)</label>
              <input
                type="number"
                value={editingPlan.monthlyPrice}
                onChange={(e) => setEditingPlan({ ...editingPlan, monthlyPrice: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Yearly Price (in Paise, e.g. 499000 = ₹4990)</label>
              <input
                type="number"
                value={editingPlan.yearlyPrice}
                onChange={(e) => setEditingPlan({ ...editingPlan, yearlyPrice: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Razorpay Plan ID (Monthly)</label>
              <input
                type="text"
                value={editingPlan.razorpayPlanIdMonthly || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, razorpayPlanIdMonthly: e.target.value })}
                placeholder="plan_..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Razorpay Plan ID (Yearly)</label>
              <input
                type="text"
                value={editingPlan.razorpayPlanIdYearly || ''}
                onChange={(e) => setEditingPlan({ ...editingPlan, razorpayPlanIdYearly: e.target.value })}
                placeholder="plan_..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex items-center space-x-6 pt-2 text-xs">
            <label className="flex items-center space-x-2 text-slate-300">
              <input
                type="checkbox"
                checked={editingPlan.isFree || false}
                onChange={(e) => setEditingPlan({ ...editingPlan, isFree: e.target.checked })}
              />
              <span>Is Free Plan</span>
            </label>
            <label className="flex items-center space-x-2 text-slate-300">
              <input
                type="checkbox"
                checked={editingPlan.isRecommended || false}
                onChange={(e) => setEditingPlan({ ...editingPlan, isRecommended: e.target.checked })}
              />
              <span>Recommended Badge</span>
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setEditingPlan(null)}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg"
            >
              {isSaving ? 'Saving...' : 'Save Plan'}
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-white">{p.name}</h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                  {p.slug}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{p.description || 'No description'}</p>

              <div className="my-4">
                <div className="text-2xl font-extrabold text-white">
                  {p.isFree ? 'Free' : formatPrice(p.monthlyPrice)}
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Yearly: {p.isFree ? 'Free' : formatPrice(p.yearlyPrice)}
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800 pt-3 font-mono">
                <div>RZP Monthly: {p.razorpayPlanIdMonthly || 'Not set'}</div>
                <div>RZP Yearly: {p.razorpayPlanIdYearly || 'Not set'}</div>
                <div>Entitlements: {p.entitlements?.length || 0} configured</div>
              </div>
            </div>

            <button
              onClick={() => setEditingPlan(p)}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center space-x-2"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Plan</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
