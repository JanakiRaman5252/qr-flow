import { NextRequest, NextResponse, after } from 'next/server'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { incrementScanCounter } from '@/lib/billing/usage'
import { dispatchWebhookEvent } from '@/lib/webhooks'

// ─────────────────────────────────────────────
// QR Redirect — Critical Hot Path
// ─────────────────────────────────────────────
// This is the highest-traffic endpoint. It MUST be fast.
//
// Architecture:
// 1. Resolve QR (cache → DB fallback)
// 2. Validate business rules (active, not expired, scan limit)
// 3. Redirect IMMEDIATELY
// 4. Record analytics ASYNCHRONOUSLY via after()
//
// Analytics failure MUST NOT prevent the redirect.

interface CachedQR {
  destinationUrl: string
  isArchived: boolean
  isInTrash: boolean
  expiresAt: string | null
  startsAt: string | null
  maxScans: number | null
  scanCount: number
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params
  const shortCode = params.code

  try {
    // 1. Try Redis cache first
    const cachedData = await redis.get<CachedQR | string>(`qr:short:${shortCode}`)

    if (cachedData) {
      // Handle both old string cache format and new object format
      let qrData: CachedQR
      if (typeof cachedData === 'string') {
        // Legacy: cache only stored the URL
        qrData = {
          destinationUrl: cachedData,
          isArchived: false,
          isInTrash: false,
          expiresAt: null,
          startsAt: null,
          maxScans: null,
          scanCount: 0,
        }
        // Invalidate legacy cache entry — will be repopulated with full data on next miss
        await redis.del(`qr:short:${shortCode}`)
      } else {
        qrData = cachedData
      }

      // Enforce business rules even on cache hit
      const ruleResult = enforceRedirectRules(qrData)
      if (ruleResult) return ruleResult

      // Schedule analytics after response
      after(() => {
        recordScan(shortCode, req).catch((err) =>
          console.error('Async scan recording failed:', err)
        )
      })

      return NextResponse.redirect(qrData.destinationUrl, { status: 307 })
    }

    // 2. Database lookup on cache miss
    const qr = await db.qRCode.findUnique({
      where: { shortCode },
      select: {
        id: true,
        destinationUrl: true,
        isArchived: true,
        isInTrash: true,
        expiresAt: true,
        startsAt: true,
        maxScans: true,
        scanCount: true,
        organizationId: true,
      },
    })

    if (!qr || qr.isArchived || qr.isInTrash) {
      return NextResponse.json({ error: 'QR Code not found or inactive' }, { status: 404 })
    }

    // 3. Enforce business rules
    const ruleResult = enforceRedirectRules({
      destinationUrl: qr.destinationUrl,
      isArchived: qr.isArchived,
      isInTrash: qr.isInTrash,
      expiresAt: qr.expiresAt?.toISOString() || null,
      startsAt: qr.startsAt?.toISOString() || null,
      maxScans: qr.maxScans,
      scanCount: qr.scanCount,
    })
    if (ruleResult) return ruleResult

    // 4. Cache QR data with all rule-check fields
    const cachePayload: CachedQR = {
      destinationUrl: qr.destinationUrl,
      isArchived: qr.isArchived,
      isInTrash: qr.isInTrash,
      expiresAt: qr.expiresAt?.toISOString() || null,
      startsAt: qr.startsAt?.toISOString() || null,
      maxScans: qr.maxScans,
      scanCount: qr.scanCount,
    }
    await redis.set(`qr:short:${shortCode}`, JSON.stringify(cachePayload), { ex: 600 })

    // 5. Schedule analytics AFTER sending the redirect
    after(() => {
      recordScan(shortCode, req).catch((err) =>
        console.error('Async scan recording failed:', err)
      )
    })

    return NextResponse.redirect(qr.destinationUrl, { status: 307 })
  } catch (error) {
    console.error('Redirect Error:', error)
    // On error, show a proper error page instead of silently redirecting to homepage
    return NextResponse.json(
      { error: 'An error occurred while processing this QR code' },
      { status: 500 }
    )
  }
}

/**
 * Enforces QR redirect business rules.
 * Returns a NextResponse if the QR should NOT redirect, or null if OK.
 */
function enforceRedirectRules(qr: CachedQR): NextResponse | null {
  if (qr.isArchived || qr.isInTrash) {
    return NextResponse.json({ error: 'QR Code not found or inactive' }, { status: 404 })
  }

  const now = new Date()

  if (qr.expiresAt && now > new Date(qr.expiresAt)) {
    return NextResponse.json({ error: 'This QR Code has expired' }, { status: 410 })
  }

  if (qr.startsAt && now < new Date(qr.startsAt)) {
    return NextResponse.json({ error: 'This QR Code is not yet active' }, { status: 425 })
  }

  if (qr.maxScans && qr.scanCount >= qr.maxScans) {
    return NextResponse.json({ error: 'Scan limit reached for this QR Code' }, { status: 429 })
  }

  return null // All checks pass
}

/**
 * Records a scan event asynchronously.
 * Called via after() — runs after the response is sent.
 * Failures here do NOT affect the redirect.
 */
async function recordScan(shortCode: string, req: NextRequest) {
  try {
    const qr = await db.qRCode.findUnique({
      where: { shortCode },
      select: { id: true, organizationId: true, title: true, type: true, destinationUrl: true },
    })

    if (!qr) return

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || ''
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || 'Unknown'
    const browser = parseUserAgentBrowser(userAgent)
    const device = parseUserAgentDevice(userAgent)

    // Increment scanCount in database & log scan telemetry
    await Promise.all([
      db.qRCode.update({
        where: { id: qr.id },
        data: { scanCount: { increment: 1 } },
      }),
      db.scanEvent.create({
        data: {
          qrCodeId: qr.id,
          ipAddress: ip.split(',')[0].trim(),
          browser,
          device,
          country,
          region: req.headers.get('x-vercel-ip-country-region') || req.headers.get('cf-region') || 'Unknown',
          city: req.headers.get('x-vercel-ip-city') || req.headers.get('cf-ipcity') || 'Unknown',
        },
      }),
      // Billing: increment tenant-level scan counter
      incrementScanCounter(qr.organizationId, 1),
    ])

    // Also update cached scan count so rule checks stay accurate
    const cachedData = await redis.get<CachedQR>(`qr:short:${shortCode}`)
    if (cachedData && typeof cachedData === 'object') {
      cachedData.scanCount = (cachedData.scanCount || 0) + 1
      await redis.set(`qr:short:${shortCode}`, JSON.stringify(cachedData), { ex: 600 })
    }

    // Dispatch webhook event asynchronously
    dispatchWebhookEvent(qr.organizationId, 'qr.scanned', {
      qrCodeId: qr.id,
      shortCode,
      title: qr.title,
      type: qr.type,
      destinationUrl: qr.destinationUrl,
      ip: ip.split(',')[0].trim(),
      browser,
      device,
      country,
      timestamp: new Date().toISOString(),
    }).catch((err) => console.error('Webhook dispatch error:', err))
  } catch (error) {
    console.error('Error recording scan telemetry:', error)
  }
}

function parseUserAgentBrowser(ua: string): string {
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  return 'Other'
}

function parseUserAgentDevice(ua: string): string {
  if (/mobile/i.test(ua)) return 'Mobile'
  if (/ipad|tablet/i.test(ua)) return 'Tablet'
  return 'Desktop'
}
