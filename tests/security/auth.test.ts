import { describe, it, expect } from 'vitest'
import { validateDestinationUrl, generateShortCode, validateWebhookUrl, validatePagination } from '@/lib/validation'
import { AuthenticationError, AuthorizationError, ValidationError, handleApiError } from '@/lib/errors'
import { isSuperAdminEmail } from '@/lib/is-super-admin'

// ─────────────────────────────────────────────
// URL Validation Tests
// ─────────────────────────────────────────────

describe('validateDestinationUrl', () => {
  it('accepts valid http URLs', () => {
    expect(validateDestinationUrl('http://example.com')).toBe('http://example.com')
  })

  it('accepts valid https URLs', () => {
    expect(validateDestinationUrl('https://example.com/path?q=1')).toBe('https://example.com/path?q=1')
  })

  it('rejects javascript: URLs', () => {
    expect(() => validateDestinationUrl('javascript:alert(1)')).toThrow(ValidationError)
  })

  it('rejects data: URLs', () => {
    expect(() => validateDestinationUrl('data:text/html,<h1>hi</h1>')).toThrow(ValidationError)
  })

  it('rejects file: URLs', () => {
    expect(() => validateDestinationUrl('file:///etc/passwd')).toThrow(ValidationError)
  })

  it('rejects vbscript: URLs', () => {
    expect(() => validateDestinationUrl('vbscript:MsgBox("hi")')).toThrow(ValidationError)
  })

  it('rejects empty strings', () => {
    expect(() => validateDestinationUrl('')).toThrow(ValidationError)
  })

  it('rejects ftp: URLs', () => {
    expect(() => validateDestinationUrl('ftp://ftp.example.com')).toThrow(ValidationError)
  })

  it('rejects URLs over 2048 characters', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2048)
    expect(() => validateDestinationUrl(longUrl)).toThrow(ValidationError)
  })

  it('rejects malformed URLs', () => {
    expect(() => validateDestinationUrl('not-a-url')).toThrow(ValidationError)
  })
})

// ─────────────────────────────────────────────
// ShortCode Generation Tests
// ─────────────────────────────────────────────

describe('generateShortCode', () => {
  it('generates codes of correct length', () => {
    const code = generateShortCode(7)
    expect(code).toHaveLength(7)
  })

  it('generates unique codes', () => {
    const codes = new Set<string>()
    for (let i = 0; i < 100; i++) {
      codes.add(generateShortCode())
    }
    expect(codes.size).toBe(100)
  })

  it('generates URL-safe characters only', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateShortCode()
      expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
    }
  })
})

// ─────────────────────────────────────────────
// Webhook URL (SSRF) Validation Tests
// ─────────────────────────────────────────────

describe('validateWebhookUrl', () => {
  it('accepts valid HTTPS URLs', () => {
    expect(validateWebhookUrl('https://webhook.site/test')).toBe('https://webhook.site/test')
  })

  it('rejects HTTP URLs', () => {
    expect(() => validateWebhookUrl('http://webhook.site/test')).toThrow(ValidationError)
  })

  it('rejects localhost', () => {
    expect(() => validateWebhookUrl('https://localhost/hook')).toThrow(ValidationError)
  })

  it('rejects 127.0.0.1', () => {
    expect(() => validateWebhookUrl('https://127.0.0.1/hook')).toThrow(ValidationError)
  })

  it('rejects 0.0.0.0', () => {
    expect(() => validateWebhookUrl('https://0.0.0.0/hook')).toThrow(ValidationError)
  })

  it('rejects private IPs (10.x)', () => {
    expect(() => validateWebhookUrl('https://10.0.0.1/hook')).toThrow(ValidationError)
  })

  it('rejects private IPs (192.168.x)', () => {
    expect(() => validateWebhookUrl('https://192.168.1.1/hook')).toThrow(ValidationError)
  })

  it('rejects private IPs (172.16.x)', () => {
    expect(() => validateWebhookUrl('https://172.16.0.1/hook')).toThrow(ValidationError)
  })

  it('rejects cloud metadata endpoint', () => {
    expect(() => validateWebhookUrl('https://169.254.169.254/metadata')).toThrow(ValidationError)
  })
})

// ─────────────────────────────────────────────
// Error Classes Tests
// ─────────────────────────────────────────────

describe('Error classes', () => {
  it('AuthenticationError has status 401', () => {
    const err = new AuthenticationError()
    expect(err.statusCode).toBe(401)
    expect(err.code).toBe('UNAUTHENTICATED')
  })

  it('AuthorizationError has status 403', () => {
    const err = new AuthorizationError()
    expect(err.statusCode).toBe(403)
    expect(err.code).toBe('FORBIDDEN')
  })

  it('ValidationError has status 400', () => {
    const err = new ValidationError('bad input')
    expect(err.statusCode).toBe(400)
    expect(err.message).toBe('bad input')
  })

  it('handleApiError returns proper JSON for AuthenticationError', () => {
    const response = handleApiError(new AuthenticationError())
    expect(response.status).toBe(401)
  })

  it('handleApiError returns 500 for unknown errors', () => {
    const response = handleApiError(new Error('kaboom'))
    expect(response.status).toBe(500)
  })
})

// ─────────────────────────────────────────────
// Pagination Validation Tests
// ─────────────────────────────────────────────

describe('validatePagination', () => {
  it('returns defaults for empty params', () => {
    const result = validatePagination()
    expect(result).toEqual({ page: 1, limit: 25, skip: 0 })
  })

  it('respects max limit', () => {
    const result = validatePagination('1', '500')
    expect(result.limit).toBe(100)
  })

  it('handles negative page', () => {
    const result = validatePagination('-1')
    expect(result.page).toBe(1)
  })

  it('calculates skip correctly', () => {
    const result = validatePagination('3', '10')
    expect(result.skip).toBe(20)
  })
})

// ─────────────────────────────────────────────
// Super Admin Tests
// ─────────────────────────────────────────────

describe('isSuperAdminEmail', () => {
  it('returns false when no email provided', () => {
    expect(isSuperAdminEmail()).toBe(false)
    expect(isSuperAdminEmail(null)).toBe(false)
    expect(isSuperAdminEmail('')).toBe(false)
  })

  it('returns false when SUPER_ADMIN_EMAIL env is not set', () => {
    const original = process.env.SUPER_ADMIN_EMAIL
    delete process.env.SUPER_ADMIN_EMAIL
    expect(isSuperAdminEmail('admin@test.com')).toBe(false)
    process.env.SUPER_ADMIN_EMAIL = original
  })
})
