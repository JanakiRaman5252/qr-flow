import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { hasFeature } from '@/lib/billing/entitlements'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()
    const { searchParams } = new URL(req.url)
    const timeframe = searchParams.get('timeframe') || '7d'

    // Check billing entitlement
    const isAdvancedAnalyticsAllowed = await hasFeature(orgId, 'ADVANCED_ANALYTICS')

    // Determine timeframe start date
    const now = new Date()
    let startDate = new Date()
    switch (timeframe) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '7d':
      default:
        startDate.setDate(startDate.getDate() - 7)
        break
    }

    // Get all QR codes belonging to this tenant
    const qrs = await db.qRCode.findMany({
      where: { organizationId: orgId, isInTrash: false },
      select: { id: true, title: true, shortCode: true, type: true, scanCount: true },
    })

    const qrIds = qrs.map((q) => q.id)
    const qrMap = new Map(qrs.map((q) => [q.id, q]))

    const lifetimeTotalScans = qrs.reduce((sum, q) => sum + (q.scanCount || 0), 0)

    if (qrIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalScans: 0,
          uniqueVisitors: 0,
          timeSeries: [],
          deviceBreakdown: [],
          browserBreakdown: [],
          locationBreakdown: [],
          topQRCodes: [],
          logs: [],
          hasAdvancedAnalytics: isAdvancedAnalyticsAllowed,
        },
      })
    }

    // Fetch scan events within timeframe
    const scanEventsInTimeframe = await db.scanEvent.findMany({
      where: {
        qrCodeId: { in: qrIds },
        timestamp: { gte: startDate },
      },
      orderBy: { timestamp: 'desc' },
      take: isAdvancedAnalyticsAllowed ? 500 : 50,
    })

    // If no scan events in current timeframe but lifetime scans > 0, fallback to all-time scan events
    let scanEvents = scanEventsInTimeframe
    if (scanEventsInTimeframe.length === 0 && lifetimeTotalScans > 0) {
      scanEvents = await db.scanEvent.findMany({
        where: { qrCodeId: { in: qrIds } },
        orderBy: { timestamp: 'desc' },
        take: isAdvancedAnalyticsAllowed ? 500 : 50,
      })
    }

    // Accurately compute total scans and unique visitors
    const totalScans = Math.max(scanEvents.length, lifetimeTotalScans)
    const uniqueIPs = new Set(scanEvents.map((e) => e.ipAddress).filter(Boolean))
    const uniqueVisitors = uniqueIPs.size || (totalScans > 0 ? 1 : 0)

    // ── Build Time Series Data ──
    const timeSeriesMap = new Map<string, { scans: number; unique: Set<string> }>()

    const daysCount = timeframe === '24h' ? 24 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 7
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date()
      if (timeframe === '24h') {
        d.setHours(d.getHours() - i)
        const label = `${String(d.getHours()).padStart(2, '0')}:00`
        timeSeriesMap.set(label, { scans: 0, unique: new Set() })
      } else {
        d.setDate(d.getDate() - i)
        const label = d.toISOString().split('T')[0]
        timeSeriesMap.set(label, { scans: 0, unique: new Set() })
      }
    }

    scanEvents.forEach((e) => {
      const d = new Date(e.timestamp)
      const label =
        timeframe === '24h'
          ? `${String(d.getHours()).padStart(2, '0')}:00`
          : d.toISOString().split('T')[0]

      if (timeSeriesMap.has(label)) {
        const item = timeSeriesMap.get(label)!
        item.scans += 1
        if (e.ipAddress) item.unique.add(e.ipAddress)
      }
    })

    const timeSeries = Array.from(timeSeriesMap.entries()).map(([date, val]) => ({
      date,
      scans: val.scans,
      unique: val.unique.size,
    }))

    // ── Aggregations from Real Scan Logs ──
    const deviceCounts = new Map<string, number>()
    const browserCounts = new Map<string, number>()
    const locationCounts = new Map<string, number>()
    const qrScanCounts = new Map<string, number>()

    scanEvents.forEach((e) => {
      const dev = e.device || 'Desktop'
      deviceCounts.set(dev, (deviceCounts.get(dev) || 0) + 1)

      const browser = e.browser || 'Chrome'
      browserCounts.set(browser, (browserCounts.get(browser) || 0) + 1)

      const loc = e.country ? `${e.city || 'Local'}, ${e.country}` : 'Local'
      locationCounts.set(loc, (locationCounts.get(loc) || 0) + 1)

      qrScanCounts.set(e.qrCodeId, (qrScanCounts.get(e.qrCodeId) || 0) + 1)
    })

    const buildBreakdown = (map: Map<string, number>) => {
      const totalSample = Array.from(map.values()).reduce((a, b) => a + b, 0) || totalScans
      return Array.from(map.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalSample > 0 ? Math.round((count / totalSample) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
    }

    const deviceBreakdown = buildBreakdown(deviceCounts)
    const browserBreakdown = buildBreakdown(browserCounts)
    const locationBreakdown = buildBreakdown(locationCounts)

    // Top performing QR codes — sort by timeframe scans, fallback to lifetime scanCount
    const topQRCodes = qrs
      .map((q) => ({
        id: q.id,
        title: q.title,
        shortCode: q.shortCode,
        type: q.type,
        periodScans: qrScanCounts.get(q.id) || q.scanCount,
        totalScans: q.scanCount,
      }))
      .sort((a, b) => b.periodScans - a.periodScans || b.totalScans - a.totalScans)
      .slice(0, 5)

    // Raw telemetry logs directly from db.scanEvent
    const formattedLogs = scanEvents.slice(0, 100).map((event) => {
      const qr = qrMap.get(event.qrCodeId)
      return {
        id: event.id,
        qrTitle: qr?.title || 'Dynamic QR',
        shortCode: qr?.shortCode || '',
        timestamp: event.timestamp.toISOString().replace('T', ' ').substring(0, 16),
        country: event.country || 'Local',
        city: event.city || 'Local',
        device: event.device || 'Desktop',
        browser: event.browser || 'Chrome',
        ip: event.ipAddress || '127.0.0.1',
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        totalScans,
        uniqueVisitors,
        timeSeries,
        deviceBreakdown,
        browserBreakdown,
        locationBreakdown,
        topQRCodes,
        logs: formattedLogs,
        hasAdvancedAnalytics: isAdvancedAnalyticsAllowed,
      },
    })
  } catch (error) {
    console.error('GET /api/analytics Error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
