// ─────────────────────────────────────────────
// Billing Error Classes
// ─────────────────────────────────────────────

export type BillingErrorCode =
  | 'SUBSCRIPTION_REQUIRED'
  | 'FEATURE_NOT_AVAILABLE'
  | 'PLAN_LIMIT_REACHED'
  | 'PAYMENT_REQUIRED'
  | 'PAYMENT_FAILED'
  | 'INVALID_PLAN'
  | 'PLAN_CHANGE_PENDING'
  | 'SUBSCRIPTION_PAST_DUE'
  | 'SUBSCRIPTION_CANCELLED'
  | 'CHECKOUT_FAILED'
  | 'WEBHOOK_INVALID'
  | 'WEBHOOK_ALREADY_PROCESSED'
  | 'TRIAL_ALREADY_USED'
  | 'TRIAL_NOT_AVAILABLE'
  | 'BILLING_ERROR'

export interface BillingErrorPayload {
  code: BillingErrorCode
  message: string
  feature?: string
  usage?: number
  limit?: number
  upgradeRequired?: boolean
  recommendedPlan?: string
}

export class BillingError extends Error {
  public readonly code: BillingErrorCode
  public readonly feature?: string
  public readonly usage?: number
  public readonly limit?: number
  public readonly upgradeRequired: boolean
  public readonly recommendedPlan?: string
  public readonly statusCode: number

  constructor(payload: BillingErrorPayload, statusCode = 403) {
    super(payload.message)
    this.name = 'BillingError'
    this.code = payload.code
    this.feature = payload.feature
    this.usage = payload.usage
    this.limit = payload.limit
    this.upgradeRequired = payload.upgradeRequired ?? false
    this.recommendedPlan = payload.recommendedPlan
    this.statusCode = statusCode
  }

  toJSON(): BillingErrorPayload {
    return {
      code: this.code,
      message: this.message,
      feature: this.feature,
      usage: this.usage,
      limit: this.limit,
      upgradeRequired: this.upgradeRequired,
      recommendedPlan: this.recommendedPlan,
    }
  }
}

export class PlanLimitReachedError extends BillingError {
  constructor(feature: string, usage: number, limit: number, recommendedPlan?: string) {
    super(
      {
        code: 'PLAN_LIMIT_REACHED',
        message: `You have reached your ${feature.toLowerCase().replace(/_/g, ' ')} limit.`,
        feature,
        usage,
        limit,
        upgradeRequired: true,
        recommendedPlan,
      },
      403
    )
    this.name = 'PlanLimitReachedError'
  }
}

export class FeatureNotAvailableError extends BillingError {
  constructor(feature: string, recommendedPlan?: string) {
    super(
      {
        code: 'FEATURE_NOT_AVAILABLE',
        message: `The ${feature.toLowerCase().replace(/_/g, ' ')} feature is not available on your current plan.`,
        feature,
        upgradeRequired: true,
        recommendedPlan,
      },
      403
    )
    this.name = 'FeatureNotAvailableError'
  }
}

export class SubscriptionRequiredError extends BillingError {
  constructor() {
    super(
      {
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'An active subscription is required to perform this action.',
        upgradeRequired: true,
      },
      403
    )
    this.name = 'SubscriptionRequiredError'
  }
}

export class PaymentRequiredError extends BillingError {
  constructor() {
    super(
      {
        code: 'PAYMENT_REQUIRED',
        message: 'Your subscription payment is overdue. Please update your payment method.',
      },
      402
    )
    this.name = 'PaymentRequiredError'
  }
}

export class CheckoutFailedError extends BillingError {
  constructor(detail?: string) {
    super(
      {
        code: 'CHECKOUT_FAILED',
        message: detail || 'Failed to create checkout session.',
      },
      500
    )
    this.name = 'CheckoutFailedError'
  }
}

export class TrialNotAvailableError extends BillingError {
  constructor(reason: string) {
    super(
      {
        code: 'TRIAL_NOT_AVAILABLE',
        message: reason,
      },
      400
    )
    this.name = 'TrialNotAvailableError'
  }
}

/** Convert a BillingError to a safe JSON response body */
export function billingErrorToResponse(err: BillingError) {
  return {
    error: true,
    ...err.toJSON(),
  }
}
