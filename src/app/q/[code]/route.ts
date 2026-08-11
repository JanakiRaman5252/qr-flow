import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { redis } from '@/lib/redis'
import { incrementScanCounter } from '@/lib/billing/usage'
import { dispatchWebhookEvent } from '@/lib/webhooks'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params
  const shortCode = params.code

  try {
    // 1. Check Redis Cache for ultra-fast destination lookup
    const cachedTarget = await redis.get<string>(`qr:short:${shortCode}`)

    if (cachedTarget) {
      // Record scan event and increment count synchronously before redirecting
      await recordScan(shortCode, req)
      return NextResponse.redirect(cachedTarget, { status: 307 })
    }

    // 2. Database Lookup if cache miss
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
      },
    })

    if (!qr || qr.isArchived || qr.isInTrash) {
      return NextResponse.json({ error: 'QR Code not found or inactive' }, { status: 404 })
    }

    // 3. Rule Checks
    const now = new Date()
    if (qr.expiresAt && now > qr.expiresAt) {
      return NextResponse.json({ error: 'This QR Code has expired' }, { status: 410 })
    }
    if (qr.startsAt && now < qr.startsAt) {
      return NextResponse.json({ error: 'This QR Code is not yet active' }, { status: 425 })
    }
    if (qr.maxScans && qr.scanCount >= qr.maxScans) {
      return NextResponse.json({ error: 'Scan limit reached for this QR Code' }, { status: 429 })
    }

    // 4. Cache valid destination in Redis for 10 minutes
    await redis.set(`qr:short:${shortCode}`, qr.destinationUrl, { ex: 600 })

    // 5. Update Scan Count & Record Event
    await recordScan(shortCode, req)

    return NextResponse.redirect(qr.destinationUrl, { status: 307 })
  } catch (error) {
    console.error('Redirect Error:', error)
    return NextResponse.redirect(new URL('/', req.url))
  }
}

async function recordScan(shortCode: string, req: NextRequest) {
  try {
    const qr = await db.qRCode.findUnique({
      where: { shortCode },
      select: { id: true, organizationId: true, title: true, type: true, destinationUrl: true },
    })

    if (!qr) return

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1'
    const userAgent = req.headers.get('user-agent') || ''
    const country = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry') || 'Local'
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
          region: req.headers.get('x-vercel-ip-country-region') || req.headers.get('cf-region') || 'Local',
          city: req.headers.get('x-vercel-ip-city') || req.headers.get('cf-ipcity') || 'Local',
        },
      }),
      // ── Billing: increment tenant-level scan counter ──
      incrementScanCounter(qr.organizationId, 1),
    ])

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
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edge')) return 'Edge'
  return 'Mobile Browser'
}

function parseUserAgentDevice(ua: string): string {
  if (/mobile/i.test(ua)) return 'Mobile'
  if (/ipad|tablet/i.test(ua)) return 'Tablet'
  return 'Desktop'
}
