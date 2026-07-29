import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    // Get all QR code IDs for this org
    const qrs = await db.qRCode.findMany({
      where: { organizationId: orgId },
      select: { id: true, title: true, shortCode: true },
    })

    const qrIds = qrs.map((q) => q.id)
    const qrMap = new Map(qrs.map((q) => [q.id, q]))

    // Fetch latest 50 scan events
    const scanEvents = await db.scanEvent.findMany({
      where: { qrCodeId: { in: qrIds } },
      orderBy: { timestamp: 'desc' },
      take: 50,
    })

    // Group metrics for top device, browser, location
    const topDeviceResult = await db.scanEvent.groupBy({
      by: ['device'],
      where: { qrCodeId: { in: qrIds } },
      _count: { device: true },
      orderBy: { _count: { device: 'desc' } },
      take: 1,
    })

    const topBrowserResult = await db.scanEvent.groupBy({
      by: ['browser'],
      where: { qrCodeId: { in: qrIds } },
      _count: { browser: true },
      orderBy: { _count: { browser: 'desc' } },
      take: 1,
    })

    const topCountryResult = await db.scanEvent.groupBy({
      by: ['country'],
      where: { qrCodeId: { in: qrIds } },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 1,
    })

    const formattedLogs = scanEvents.map((event) => {
      const qr = qrMap.get(event.qrCodeId)
      return {
        id: event.id,
        qrTitle: qr?.title || 'Dynamic QR',
        shortCode: qr?.shortCode || '',
        timestamp: event.timestamp.toISOString().replace('T', ' ').substring(0, 16),
        country: event.country || 'United States',
        city: event.city || 'New York',
        device: event.device || 'Mobile',
        browser: event.browser || 'Safari',
        ip: event.ipAddress || '127.0.0.1',
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        logs: formattedLogs,
        topDevice: topDeviceResult[0]?.device || 'Mobile',
        topBrowser: topBrowserResult[0]?.browser || 'Chrome',
        topCountry: topCountryResult[0]?.country || 'United States',
        totalScansRecorded: scanEvents.length,
      },
    })
  } catch (error) {
    console.error('GET /api/analytics Error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
