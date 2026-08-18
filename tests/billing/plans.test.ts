import { describe, it, expect } from 'vitest'
import { formatPrice } from '../../src/lib/billing/plans'

describe('Billing Plans Helper Tests', () => {
  it('formats paise price to INR currency string', () => {
    expect(formatPrice(49900, 'INR')).toContain('499')
    expect(formatPrice(149900, 'INR')).toContain('1,499')
    expect(formatPrice(0, 'INR')).toContain('0')
  })
})
