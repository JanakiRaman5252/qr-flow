// ─────────────────────────────────────────────
// Input Validation Utilities
// ─────────────────────────────────────────────

import crypto from 'crypto'
import { ValidationError } from '@/lib/errors'

/** Allowed URL schemes for QR code destinations */
const ALLOWED_SCHEMES = ['http:', 'https:']

/** Dangerous URL schemes that must always be rejected */
const BLOCKED_SCHEMES = ['javascript:', 'data:', 'file:', 'vbscript:', 'ftp:', 'blob:']

/**
 * Validates a QR destination URL.
 * Only allows http: and https: schemes.
 * Rejects dangerous schemes, empty URLs, and malformed input.
 */
export function validateDestinationUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('Destination URL is required')
  }

  const trimmed = url.trim()
  if (trimmed.length === 0) {
    throw new ValidationError('Destination URL cannot be empty')
  }

  if (trimmed.length > 2048) {
    throw new ValidationError('Destination URL is too long (max 2048 characters)')
  }

  // Check for blocked schemes before attempting URL parse
  const lowerUrl = trimmed.toLowerCase()
  for (const scheme of BLOCKED_SCHEMES) {
    if (lowerUrl.startsWith(scheme)) {
      throw new ValidationError(`URL scheme "${scheme}" is not allowed`)
    }
  }

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new ValidationError('Invalid URL format')
  }

  if (!ALLOWED_SCHEMES.includes(parsed.protocol)) {
    throw new ValidationError(`URL scheme "${parsed.protocol}" is not supported. Use http: or https:`)
  }

  // Block empty hostnames
  if (!parsed.hostname || parsed.hostname.length === 0) {
    throw new ValidationError('URL must have a valid hostname')
  }

  return trimmed
}

/**
 * Generates a cryptographically secure short code for QR URLs.
 * Uses crypto.randomBytes instead of Math.random().
 * Returns a URL-safe base64 string of specified length.
 */
export function generateShortCode(length: number = 7): string {
  // Generate enough random bytes and encode as URL-safe base64
  const bytes = crypto.randomBytes(Math.ceil((length * 3) / 4))
  return bytes.toString('base64url').substring(0, length)
}

/**
 * Validates a webhook URL to prevent SSRF attacks.
 * Rejects localhost, private IPs, link-local, and cloud metadata endpoints.
 */
export function validateWebhookUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('Webhook URL is required')
  }

  const trimmed = url.trim()

  let parsed: URL
  try {
    parsed = new URL(trimmed)
  } catch {
    throw new ValidationError('Invalid webhook URL format')
  }

  // Only HTTPS for webhook endpoints
  if (parsed.protocol !== 'https:') {
    throw new ValidationError('Webhook URL must use HTTPS')
  }

  const hostname = parsed.hostname.toLowerCase()

  // Block localhost variants
  const localhostPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1']
  if (localhostPatterns.includes(hostname)) {
    throw new ValidationError('Webhook URL cannot target localhost')
  }

  // Block private IP ranges
  if (isPrivateIP(hostname)) {
    throw new ValidationError('Webhook URL cannot target private IP addresses')
  }

  // Block cloud metadata endpoints
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    throw new ValidationError('Webhook URL cannot target cloud metadata endpoints')
  }

  return trimmed
}

/**
 * Checks if a hostname is a private/reserved IP address.
 */
function isPrivateIP(hostname: string): boolean {
  // IPv4 private ranges
  const ipv4Patterns = [
    /^10\./,                      // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,                // 192.168.0.0/16
    /^169\.254\./,                // Link-local
    /^127\./,                     // Loopback
    /^0\./,                       // Current network
    /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // Shared address space
  ]

  for (const pattern of ipv4Patterns) {
    if (pattern.test(hostname)) return true
  }

  // IPv6 private patterns (simplified check)
  if (hostname.startsWith('[fc') || hostname.startsWith('[fd') || hostname.startsWith('[fe80')) {
    return true
  }

  return false
}

/**
 * Validates pagination parameters.
 * Returns safe page and limit values.
 */
export function validatePagination(
  pageParam?: string | null,
  limitParam?: string | null,
  defaultLimit = 25,
  maxLimit = 100
): { page: number; limit: number; skip: number } {
  let page = parseInt(pageParam || '1', 10)
  let limit = parseInt(limitParam || String(defaultLimit), 10)

  if (isNaN(page) || page < 1) page = 1
  if (isNaN(limit) || limit < 1) limit = defaultLimit
  if (limit > maxLimit) limit = maxLimit

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  }
}
