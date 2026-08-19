import { describe, it, expect } from 'vitest'
import { validateDestinationUrl, validateWebhookUrl, generateShortCode, validatePagination } from '@/lib/validation'
import { hasPermission, canManageTargetMember, type Role } from '@/lib/rbac'
import { verifyWebhookSignature, verifyPaymentSignature } from '@/lib/billing/razorpay'
import { validateApiKey } from '@/lib/api-key-auth'
import { NextRequest } from 'next/server'

// ─────────────────────────────────────────────
// 1. SECURITY & URL PROTOCOL VALIDATION
// ─────────────────────────────────────────────
describe('Security: URL Protocol Validation (XSS / Protocol Injection)', () => {
  it('allows http and https URLs', () => {
    expect(validateDestinationUrl('https://dynoqr.in/target')).toBe('https://dynoqr.in/target')
    expect(validateDestinationUrl('http://example.com')).toBe('http://example.com')
  })

  it('rejects malicious protocols (javascript:, data:, file:, vbscript:)', () => {
    expect(() => validateDestinationUrl('javascript:alert(1)')).toThrow()
    expect(() => validateDestinationUrl('data:text/html,<script>alert(1)</script>')).toThrow()
    expect(() => validateDestinationUrl('file:///etc/passwd')).toThrow()
    expect(() => validateDestinationUrl('vbscript:msgbox(1)')).toThrow()
  })

  it('rejects overly long URLs (>2048 chars)', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2050)
    expect(() => validateDestinationUrl(longUrl)).toThrow()
  })
})

// ─────────────────────────────────────────────
// 2. SSRF PROTECTION (USER WEBHOOKS)
// ─────────────────────────────────────────────
describe('Security: SSRF Protection for Webhook URLs', () => {
  it('allows valid public HTTPS webhooks', () => {
    expect(validateWebhookUrl('https://api.example.com/webhooks')).toBe('https://api.example.com/webhooks')
  })

  it('rejects HTTP (insecure) webhooks', () => {
    expect(() => validateWebhookUrl('http://api.example.com/webhooks')).toThrow()
  })

  it('rejects local/internal IP ranges (loopback, RFC1918, metadata)', () => {
    expect(() => validateWebhookUrl('https://localhost/hook')).toThrow()
    expect(() => validateWebhookUrl('https://127.0.0.1/hook')).toThrow()
    expect(() => validateWebhookUrl('https://10.0.0.1/hook')).toThrow()
    expect(() => validateWebhookUrl('https://192.168.1.1/hook')).toThrow()
    expect(() => validateWebhookUrl('https://172.16.0.1/hook')).toThrow()
    expect(() => validateWebhookUrl('https://169.254.169.254/latest/meta-data')).toThrow()
  })
})

// ─────────────────────────────────────────────
// 3. RBAC AUTHORIZATION MATRIX
// ─────────────────────────────────────────────
describe('Security: RBAC Authorization Matrix', () => {
  it('enforces VIEWER read-only restrictions', () => {
    expect(hasPermission('VIEWER', 'qr:read')).toBe(true)
    expect(hasPermission('VIEWER', 'analytics:read')).toBe(true)
    expect(hasPermission('VIEWER', 'qr:create')).toBe(false)
    expect(hasPermission('VIEWER', 'qr:update')).toBe(false)
    expect(hasPermission('VIEWER', 'qr:delete')).toBe(false)
    expect(hasPermission('VIEWER', 'billing:manage')).toBe(false)
  })

  it('enforces EDITOR permissions', () => {
    expect(hasPermission('EDITOR', 'qr:create')).toBe(true)
    expect(hasPermission('EDITOR', 'qr:update')).toBe(true)
    expect(hasPermission('EDITOR', 'qr:delete')).toBe(true)
    expect(hasPermission('EDITOR', 'billing:manage')).toBe(false)
    expect(hasPermission('EDITOR', 'team:invite')).toBe(false)
  })

  it('enforces ADMIN permissions', () => {
    expect(hasPermission('ADMIN', 'qr:create')).toBe(true)
    expect(hasPermission('ADMIN', 'team:invite')).toBe(true)
    expect(hasPermission('ADMIN', 'billing:view')).toBe(true)
    expect(hasPermission('ADMIN', 'workspace:delete')).toBe(false) // Only OWNER
  })

  it('enforces OWNER permissions', () => {
    expect(hasPermission('OWNER', 'workspace:delete')).toBe(true)
    expect(hasPermission('OWNER', 'billing:manage')).toBe(true)
  })

  it('prevents ADMINs from managing or removing OWNERs', () => {
    const check = canManageTargetMember('ADMIN', 'OWNER')
    expect(check.allowed).toBe(false)
  })

  it('prevents ADMINs from managing other ADMINs', () => {
    const check = canManageTargetMember('ADMIN', 'ADMIN')
    expect(check.allowed).toBe(false)
  })

  it('allows OWNER to manage ADMINs and MEMBERs', () => {
    expect(canManageTargetMember('OWNER', 'ADMIN').allowed).toBe(true)
    expect(canManageTargetMember('OWNER', 'MEMBER').allowed).toBe(true)
  })
})

// ─────────────────────────────────────────────
// 4. WEBHOOK SIGNATURE & SECURITY (RAZORPAY)
// ─────────────────────────────────────────────
describe('Security: Razorpay Webhook HMAC Verification', () => {
  it('fails closed when signature or secret is missing', () => {
    const verified = verifyWebhookSignature({ body: '{"test":1}', signature: '' })
    expect(verified).toBe(false)
  })

  it('fails closed when payment signature is invalid', () => {
    const verified = verifyPaymentSignature({
      subscriptionId: 'sub_123',
      paymentId: 'pay_123',
      signature: 'invalid_sig',
    })
    expect(verified).toBe(false)
  })
})

// ─────────────────────────────────────────────
// 5. API KEY AUTHENTICATION & SCOPES
// ─────────────────────────────────────────────
describe('Security: API Key Auth & Scope Verification', () => {
  it('rejects requests with missing API key headers', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/qr')
    const result = await validateApiKey(req)
    expect(result.authenticated).toBe(false)
    expect(result.error).toContain('Missing API key')
  })

  it('rejects invalid API key strings', async () => {
    const req = new NextRequest('http://localhost:3000/api/v1/qr', {
      headers: { 'x-api-key': 'invalid_key_string_12345' },
    })
    const result = await validateApiKey(req)
    expect(result.authenticated).toBe(false)
    expect(result.error).toContain('Invalid API key')
  })
})

// ─────────────────────────────────────────────
// 6. SHORTCODE GENERATION
// ─────────────────────────────────────────────
describe('ShortCode Engine: Cryptographic Randomness & URL Safety', () => {
  it('generates 7-character URL-safe string by default', () => {
    const code = generateShortCode()
    expect(code).toHaveLength(7)
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  it('produces unique codes across 1000 iterations', () => {
    const set = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      set.add(generateShortCode(8))
    }
    expect(set.size).toBe(1000)
  })
})
