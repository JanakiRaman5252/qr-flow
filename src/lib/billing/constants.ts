// ─────────────────────────────────────────────
// Billing Constants & Entitlement Keys
// ─────────────────────────────────────────────

/** Entitlement keys — used in PlanEntitlement and runtime checks */
export const ENTITLEMENT_KEYS = {
  QR_CODE_LIMIT: 'QR_CODE_LIMIT',
  MONTHLY_SCAN_LIMIT: 'MONTHLY_SCAN_LIMIT',
  TEAM_MEMBER_LIMIT: 'TEAM_MEMBER_LIMIT',
  CUSTOM_DOMAIN: 'CUSTOM_DOMAIN',
  CUSTOM_BRANDING: 'CUSTOM_BRANDING',
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
  API_ACCESS: 'API_ACCESS',
  WHITE_LABEL: 'WHITE_LABEL',
  EXPORT_DATA: 'EXPORT_DATA',
  BULK_QR_GENERATION: 'BULK_QR_GENERATION',
  PRIORITY_SUPPORT: 'PRIORITY_SUPPORT',
} as const

export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[keyof typeof ENTITLEMENT_KEYS]

/** Usage metric keys (subset of entitlements that are counted) */
export const USAGE_METRICS = {
  QR_CODE: 'QR_CODE',
  MONTHLY_SCAN: 'MONTHLY_SCAN',
  TEAM_MEMBER: 'TEAM_MEMBER',
} as const

export type UsageMetric = (typeof USAGE_METRICS)[keyof typeof USAGE_METRICS]

/** Maps usage metrics to their corresponding entitlement limit keys */
export const METRIC_TO_ENTITLEMENT: Record<UsageMetric, EntitlementKey> = {
  QR_CODE: 'QR_CODE_LIMIT',
  MONTHLY_SCAN: 'MONTHLY_SCAN_LIMIT',
  TEAM_MEMBER: 'TEAM_MEMBER_LIMIT',
}

/** Subscription event types (internal, normalized) */
export const BILLING_EVENTS = {
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  TRIAL_STARTED: 'TRIAL_STARTED',
  SUBSCRIPTION_ACTIVATED: 'SUBSCRIPTION_ACTIVATED',
  PAYMENT_SUCCEEDED: 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  SUBSCRIPTION_RENEWED: 'SUBSCRIPTION_RENEWED',
  PLAN_UPGRADED: 'PLAN_UPGRADED',
  PLAN_DOWNGRADED: 'PLAN_DOWNGRADED',
  CANCELLATION_REQUESTED: 'CANCELLATION_REQUESTED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_EXPIRED: 'SUBSCRIPTION_EXPIRED',
  SUBSCRIPTION_RESUMED: 'SUBSCRIPTION_RESUMED',
  LIMIT_REACHED: 'LIMIT_REACHED',
} as const

export type BillingEventType = (typeof BILLING_EVENTS)[keyof typeof BILLING_EVENTS]

/** Audit log actions for billing */
export const BILLING_AUDIT_ACTIONS = {
  PLAN_CREATED: 'PLAN_CREATED',
  PLAN_UPDATED: 'PLAN_UPDATED',
  PLAN_DEACTIVATED: 'PLAN_DEACTIVATED',
  SUBSCRIPTION_CREATED: 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_UPGRADED: 'SUBSCRIPTION_UPGRADED',
  SUBSCRIPTION_DOWNGRADED: 'SUBSCRIPTION_DOWNGRADED',
  SUBSCRIPTION_CANCELLED: 'SUBSCRIPTION_CANCELLED',
  SUBSCRIPTION_RESUMED: 'SUBSCRIPTION_RESUMED',
  PAYMENT_SUCCEEDED: 'PAYMENT_SUCCEEDED',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
} as const

/** Billing configuration defaults */
export const BILLING_CONFIG = {
  DEFAULT_CURRENCY: process.env.BILLING_DEFAULT_CURRENCY || 'INR',
  GRACE_PERIOD_DAYS: parseInt(process.env.BILLING_GRACE_PERIOD_DAYS || '7', 10),
  TRIAL_DAYS: parseInt(process.env.BILLING_TRIAL_DAYS || '14', 10),
  ENTITLEMENT_CACHE_TTL_SECONDS: 300, // 5 minutes
  USAGE_CACHE_TTL_SECONDS: 60, // 1 minute
  SCAN_COUNTER_FLUSH_INTERVAL_SECONDS: 300, // 5 minutes
} as const

/** Razorpay webhook event to internal event mapping */
export const RAZORPAY_EVENT_MAP: Record<string, string> = {
  'subscription.authenticated': BILLING_EVENTS.SUBSCRIPTION_CREATED,
  'subscription.activated': BILLING_EVENTS.SUBSCRIPTION_ACTIVATED,
  'subscription.charged': BILLING_EVENTS.SUBSCRIPTION_RENEWED,
  'subscription.completed': BILLING_EVENTS.SUBSCRIPTION_EXPIRED,
  'subscription.cancelled': BILLING_EVENTS.SUBSCRIPTION_CANCELLED,
  'subscription.halted': BILLING_EVENTS.PAYMENT_FAILED,
  'payment.captured': BILLING_EVENTS.PAYMENT_SUCCEEDED,
  'payment.failed': BILLING_EVENTS.PAYMENT_FAILED,
}

/** Plan slugs used as seed identifiers */
export const PLAN_SLUGS = {
  FREE: 'free',
  STARTER: 'starter',
  PRO: 'pro',
  BUSINESS: 'business',
} as const
