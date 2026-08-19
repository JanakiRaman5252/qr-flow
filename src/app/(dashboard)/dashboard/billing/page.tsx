'use client'

import React, { useEffect, useState } from 'react'
import {
  CreditCard,
  QrCode,
  Users,
  BarChart2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { UsageCard } from '@/components/billing/UsageCard'
import { SubscriptionStatusBadge } from '@/components/billing/SubscriptionStatus'
import { BillingCycleToggle } from '@/components/billing/BillingCycleToggle'
import { PlanCard } from '@/components/billing/PlanCard'
import { PaymentHistory } from '@/components/billing/PaymentHistory'
import { TrialBanner } from '@/components/billing/TrialBanner'
import { formatPrice } from '@/lib/billing/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { PageLoader } from '@/components/ui/loader'

declare global {
  interface Window {
    Razorpay: any
  }
}

interface TrialEligibility {
  planId: string
  planSlug: string
  planName: string
  trialDays: number
  canTrial: boolean
  reason: string | null
}

export default function BillingPage() {
  const [mounted, setMounted] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [plans, setPlans] = useState<any[]>([])
  const [usage, setUsage] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [trialEligibility, setTrialEligibility] = useState<TrialEligibility[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cycle, setCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionSuccess, setActionSuccess] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
    // Load Razorpay Checkout SDK
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [subRes, plansRes, usageRes, pmtRes, invRes, trialRes] = await Promise.all([
        fetch('/api/billing/subscription'),
        fetch('/api/billing/plans'),
        fetch('/api/billing/usage'),
        fetch('/api/billing/payments'),
        fetch('/api/billing/invoices'),
        fetch('/api/billing/trial'),
      ])

      const subData = await subRes.json()
      const plansData = await plansRes.json()
      const usageData = await usageRes.json()
      const pmtData = await pmtRes.json()
      const invData = await invRes.json()
      const trialData = await trialRes.json()

      if (subData.success) setSubscription(subData.data)
      if (plansData.success) setPlans(plansData.data)
      if (usageData.success) setUsage(usageData.data)
      if (pmtData.success) setPayments(pmtData.data?.items || [])
      if (invData.success) setInvoices(invData.data?.items || [])
      if (trialData.success) setTrialEligibility(trialData.data || [])
    } catch (err) {
      console.error('Failed to load billing data:', err)
      setActionError('Failed to load billing information.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleStartTrial = async (planId: string) => {
    setActionError(null)
    setActionSuccess(null)
    setProcessingPlanId(planId)

    try {
      const res = await fetch('/api/billing/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const json = await res.json()

      if (json.success) {
        setActionSuccess(json.data?.message || 'Trial started successfully!')
        fetchData()
      } else {
        setActionError(json.message || json.error || 'Failed to start trial.')
      }
    } catch (err) {
      console.error('Start trial error:', err)
      setActionError('An error occurred while starting the trial.')
    } finally {
      setProcessingPlanId(null)
    }
  }

  const handleSelectPlan = async (planId: string) => {
    setActionError(null)
    setActionSuccess(null)
    setProcessingPlanId(planId)

    try {
      const targetPlan = plans.find((p) => p.id === planId)

      // Check if downgrading to a lower plan
      const currentSortOrder = currentPlan?.sortOrder ?? 0
      const targetSortOrder = targetPlan?.sortOrder ?? 0

      if (targetSortOrder < currentSortOrder) {
        // Downgrade
        const res = await fetch('/api/billing/downgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planId }),
        })
        const json = await res.json()
        if (json.success) {
          setActionSuccess(json.data.message || 'Downgrade scheduled at end of billing period.')
          fetchData()
        } else {
          setActionError(json.error?.message || json.message || 'Failed to change plan.')
        }
        setProcessingPlanId(null)
        return
      }

      // Paid plan checkout
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, billingCycle: cycle }),
      })

      const json = await res.json()

      if (!json.success) {
        setActionError(json.message || json.error || 'Checkout initiation failed.')
        setProcessingPlanId(null)
        return
      }

      const checkoutData = json.data

      const options = {
        key: checkoutData.razorpayKeyId,
        subscription_id: checkoutData.razorpaySubscriptionId,
        name: 'DynoQR',
        description: `${checkoutData.planName} Plan (${cycle.toLowerCase()})`,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch('/api/billing/checkout/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySubscriptionId: response.razorpay_subscription_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const verifyJson = await verifyRes.json()
            if (verifyJson.success) {
              setActionSuccess('Subscription activated successfully!')
              fetchData()
            } else {
              setActionError(verifyJson.message || 'Payment verification failed.')
            }
          } catch (err) {
            setActionError('Error verifying payment.')
          } finally {
            setProcessingPlanId(null)
          }
        },
        modal: {
          ondismiss: function () {
            setProcessingPlanId(null)
          },
        },
        theme: {
          color: '#4F46E5',
        },
      }

      if (window.Razorpay) {
        const rzp = new window.Razorpay(options)
        rzp.open()
      } else {
        setActionError('Razorpay SDK failed to load. Refresh and try again.')
        setProcessingPlanId(null)
      }
    } catch (err) {
      console.error('Plan selection error:', err)
      setActionError('An error occurred during plan selection.')
      setProcessingPlanId(null)
    }
  }

  const handleCancelSubscription = async (immediate = false) => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return

    try {
      const res = await fetch('/api/billing/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ immediate }),
      })
      const json = await res.json()
      if (json.success) {
        setActionSuccess(json.data.message)
        fetchData()
      } else {
        setActionError(json.error || 'Failed to cancel subscription.')
      }
    } catch (err) {
      setActionError('Cancellation failed.')
    }
  }

  const handleResumeSubscription = async () => {
    try {
      const res = await fetch('/api/billing/resume', {
        method: 'POST',
      })
      const json = await res.json()
      if (json.success) {
        setActionSuccess(json.data.message)
        fetchData()
      } else {
        setActionError(json.error || 'Failed to resume subscription.')
      }
    } catch (err) {
      setActionError('Resume failed.')
    }
  }

  // Scroll to plans section when upgrade is clicked from trial banner
  const handleTrialUpgrade = () => {
    const plansSection = document.getElementById('available-plans')
    if (plansSection) {
      plansSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (!mounted || isLoading) {
    return (
      <div suppressHydrationWarning className="p-4 sm:p-6 md:p-8 flex items-center justify-center min-h-[80vh] bg-slate-950 text-slate-50 w-full max-w-full">
        <PageLoader text="Loading Billing & Subscriptions" subtext="Fetching plan entitlements, quota limits, and payment history" />
      </div>
    )
  }

  const currentPlan = subscription?.plan
  const qrUsage = usage.find((u) => u.metric === 'QR_CODE')
  const scanUsage = usage.find((u) => u.metric === 'MONTHLY_SCAN')
  const teamUsage = usage.find((u) => u.metric === 'TEAM_MEMBER')

  const isTrialing = subscription?.status === 'TRIALING'

  // Build a lookup for trial eligibility per plan
  const trialMap = new Map(trialEligibility.map((t) => [t.planId, t]))

  return (
    <div suppressHydrationWarning className="p-4 sm:p-6 md:p-8 space-y-8 sm:space-y-10 bg-slate-950 text-slate-50 min-h-screen w-full max-w-full">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Billing & Plans</h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage your workspace plan, entitlements, capacity limits, and payment history.
          </p>
        </div>

        <BillingCycleToggle cycle={cycle} onChange={setCycle} />
      </div>

      {actionError && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Trial Countdown Banner */}
      {isTrialing && subscription?.trialEnd && (
        <TrialBanner
          planName={currentPlan?.name || 'Trial'}
          trialEnd={subscription.trialEnd}
          onUpgrade={handleTrialUpgrade}
        />
      )}

      {/* Current Active Plan Overview Card */}
      <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-8 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 pointer-events-none opacity-5">
          <Sparkles className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Current Workspace Plan</span>
              {isTrialing ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Starter (7-Day Trial)
                </span>
              ) : (
                <SubscriptionStatusBadge
                  status={subscription?.status || 'ACTIVE'}
                  cancelAtPeriodEnd={subscription?.cancelAtPeriodEnd}
                />
              )}
            </div>

            <div className="flex items-baseline space-x-3">
              <h2 className="text-3xl font-black text-white">{currentPlan?.name || 'Starter'}</h2>
              {subscription?.amount ? (
                <span className="text-sm font-semibold text-slate-400">
                  ({formatPrice(subscription.amount, subscription.currency)}/{subscription.billingCycle?.toLowerCase()})
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  7-Day Free Trial
                </span>
              )}
            </div>

            <div className="text-xs text-slate-400 max-w-lg space-y-1">
              <p>{currentPlan?.description || 'Essential tools for creators and small businesses.'}</p>
              {subscription?.trialEnd ? (
                <div className="mt-2 inline-flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-slate-300">
                  <Clock className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>
                    Trial Period: <strong className="text-white">7 Days</strong> (Ends{' '}
                    <strong className="text-indigo-300">
                      {new Date(subscription.trialEnd).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </strong>
                    )
                  </span>
                </div>
              ) : subscription?.currentPeriodEnd ? (
                <p className="mt-1 text-slate-400">
                  {subscription.cancelAtPeriodEnd
                    ? `Access ends on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isTrialing || subscription?.status === 'EXPIRED' || subscription?.status === 'CANCELED' ? (
              <button
                onClick={handleTrialUpgrade}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30"
              >
                <Sparkles className="w-4 h-4" />
                <span>Upgrade Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : subscription?.cancelAtPeriodEnd ? (
              <button
                onClick={handleResumeSubscription}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-600/30"
              >
                Resume Subscription
              </button>
            ) : subscription ? (
              <button
                onClick={() => handleCancelSubscription(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-slate-300 font-semibold text-xs border border-slate-700 transition-all"
              >
                Cancel Subscription
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Real-time Usage & Quota Cards */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white">Usage & Quotas</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <UsageCard
            title="Dynamic QR Codes"
            usage={qrUsage?.usage || 0}
            limit={qrUsage?.limit || 0}
            isUnlimited={qrUsage?.isUnlimited}
            unit="codes"
            icon={<QrCode className="w-5 h-5" />}
          />
          <UsageCard
            title="Monthly Scans"
            usage={scanUsage?.usage || 0}
            limit={scanUsage?.limit || 0}
            isUnlimited={scanUsage?.isUnlimited}
            unit="scans"
            icon={<BarChart2 className="w-5 h-5" />}
          />
          <UsageCard
            title="Team Members"
            usage={teamUsage?.usage || 0}
            limit={teamUsage?.limit || 0}
            isUnlimited={teamUsage?.isUnlimited}
            unit="members"
            icon={<Users className="w-5 h-5" />}
          />
        </div>
      </div>

      {/* Available Plans Grid */}
      <div id="available-plans" className="space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Available Upgrade Plans</h3>
          <p className="text-xs text-slate-400 mt-1">
            Choose a plan that fits your business scale and feature needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((p) => {
            const eligibility = trialMap.get(p.id)
            return (
              <PlanCard
                key={p.id}
                plan={p}
                currentCycle={cycle}
                isCurrentPlan={p.id === currentPlan?.id}
                canTrial={eligibility?.canTrial || false}
                onSelect={handleSelectPlan}
                onStartTrial={handleStartTrial}
                isLoading={processingPlanId === p.id}
              />
            )
          })}
        </div>
      </div>

      {/* Billing & Invoice History */}
      <PaymentHistory payments={payments} invoices={invoices} />
    </div>
  )
}
