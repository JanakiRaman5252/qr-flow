// ─────────────────────────────────────────────
// Billing Email Notifications
// ─────────────────────────────────────────────

import { sendEmail } from '@/lib/email'
import { logger } from '@/lib/logger'
import { formatPrice } from './plans'

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'QRFlow'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function send(to: string, subject: string, html: string) {
  try {
    await sendEmail({ to, subject, html })
  } catch (err) {
    logger.error({ err, to, subject }, 'Failed to send billing email')
  }
}

export async function sendPaymentSuccess(email: string, amount: number, planName: string) {
  await send(
    email,
    `${APP_NAME}: Payment Received`,
    `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#4F46E5;">Payment Confirmed ✓</h2>
      <p>Your payment of <strong>${formatPrice(amount)}</strong> for the <strong>${planName}</strong> plan has been processed.</p>
      <p><a href="${APP_URL}/dashboard/billing" style="color:#4F46E5;">View your billing dashboard →</a></p>
    </div>`
  )
}

export async function sendPaymentFailed(email: string, planName: string) {
  await send(
    email,
    `${APP_NAME}: Payment Failed — Action Required`,
    `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#EF4444;">Payment Failed</h2>
      <p>We were unable to process your payment for the <strong>${planName}</strong> plan.</p>
      <p>Please update your payment method to avoid service interruption.</p>
      <p><a href="${APP_URL}/dashboard/billing" style="color:#4F46E5;">Update payment method →</a></p>
    </div>`
  )
}

export async function sendUpgradeConfirmation(email: string, planName: string) {
  await send(
    email,
    `${APP_NAME}: Welcome to ${planName}!`,
    `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2 style="color:#4F46E5;">Plan Upgraded 🚀</h2>
      <p>Your workspace has been upgraded to the <strong>${planName}</strong> plan. Enjoy your new features!</p>
      <p><a href="${APP_URL}/dashboard" style="color:#4F46E5;">Go to dashboard →</a></p>
    </div>`
  )
}

export async function sendDowngradeScheduled(
  email: string,
  currentPlan: string,
  newPlan: string,
  effectiveDate: Date
) {
  const dateStr = effectiveDate.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  await send(
    email,
    `${APP_NAME}: Plan Downgrade Scheduled`,
    `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2>Downgrade Scheduled</h2>
      <p>Your workspace will be downgraded from <strong>${currentPlan}</strong> to <strong>${newPlan}</strong> on <strong>${dateStr}</strong>.</p>
      <p>You'll retain ${currentPlan} features until then.</p>
      <p><a href="${APP_URL}/dashboard/billing" style="color:#4F46E5;">Manage subscription →</a></p>
    </div>`
  )
}

export async function sendCancellationConfirmed(email: string, planName: string, endDate?: Date) {
  const dateStr = endDate
    ? endDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'the end of your billing period'
  await send(
    email,
    `${APP_NAME}: Subscription Cancelled`,
    `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2>Subscription Cancelled</h2>
      <p>Your <strong>${planName}</strong> subscription has been cancelled.</p>
      <p>You'll retain access until <strong>${dateStr}</strong>.</p>
      <p><a href="${APP_URL}/dashboard/billing" style="color:#4F46E5;">Resume subscription →</a></p>
    </div>`
  )
}

export async function sendTrialEndingSoon(email: string, daysLeft: number) {
  await send(
    email,
    `${APP_NAME}: Your Trial Ends in ${daysLeft} Days`,
    `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2>Trial Ending Soon</h2>
      <p>Your free trial ends in <strong>${daysLeft} days</strong>. Upgrade now to keep your features!</p>
      <p><a href="${APP_URL}/dashboard/billing" style="color:#4F46E5;">Choose a plan →</a></p>
    </div>`
  )
}

export async function sendLimitApproaching(
  email: string,
  metric: string,
  usage: number,
  limit: number,
  percentUsed: number
) {
  const metricLabel = metric.replace(/_/g, ' ').toLowerCase()
  await send(
    email,
    `${APP_NAME}: ${percentUsed}% of ${metricLabel} limit used`,
    `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
      <h2>Usage Alert</h2>
      <p>You've used <strong>${usage}</strong> of <strong>${limit}</strong> ${metricLabel} (${percentUsed}%).</p>
      <p><a href="${APP_URL}/dashboard/billing" style="color:#4F46E5;">Upgrade for more →</a></p>
    </div>`
  )
}
