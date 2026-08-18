import { describe, it, expect } from 'vitest'
import {
  BillingError,
  PlanLimitReachedError,
  FeatureNotAvailableError,
} from '../../src/lib/billing/billing-errors'

describe('Billing Error Payload Tests', () => {
  it('serializes PlanLimitReachedError correctly', () => {
    const err = new PlanLimitReachedError('QR_CODE_LIMIT', 5, 5, 'pro')
    expect(err.code).toBe('PLAN_LIMIT_REACHED')
    expect(err.usage).toBe(5)
    expect(err.limit).toBe(5)
    expect(err.upgradeRequired).toBe(true)
    expect(err.recommendedPlan).toBe('pro')
  })

  it('serializes FeatureNotAvailableError correctly', () => {
    const err = new FeatureNotAvailableError('CUSTOM_DOMAIN', 'pro')
    expect(err.code).toBe('FEATURE_NOT_AVAILABLE')
    expect(err.upgradeRequired).toBe(true)
    expect(err.recommendedPlan).toBe('pro')
  })
})
