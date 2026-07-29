import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    // Count total active QRs
    const activeQRsCount = await db.qRCode.count({
      where: { organizationId: orgId, isInTrash: false, isArchived: false },
    })

    // Count total dynamic QRs vs static QRs
    const dynamicQRsCount = await db.qRCode.count({
      where: { organizationId: orgId, type: { not: 'TEXT' } },
    })

    // Get all QR IDs for this org
    const qrIds = (
      await db.qRCode.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })
    ).map((q) => q.id)

    // Aggregate total scans
    const totalScans = await db.scanEvent.count({
      where: { qrCodeId: { in: qrIds } },
    })

    // Count unique visitors
    const uniqueVisitors = await db.scanEvent.count({
      where: { qrCodeId: { in: qrIds }, isUnique: true },
    })

    // Find top country
    const topCountryResult = await db.scanEvent.groupBy({
      by: ['country'],
      where: { qrCodeId: { in: qrIds } },
      _count: { country: true },
      orderBy: { _count: { country: 'desc' } },
      take: 1,
    })

    const topCountry = topCountryResult[0]?.country || 'No Scans Yet'

    // Fetch recent 5 QR codes
    const recentQRs = await db.qRCode.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    })

    return NextResponse.json({
      success: true,
      data: {
        totalScans,
        activeQRsCount,
        dynamicQRsCount,
        uniqueVisitors,
        topCountry,
        recentQRs,
      },
    })
  } catch (error) {
    console.error('GET /api/dashboard/stats Error:', error)
    return NextResponse.json({ error: 'Failed to aggregate statistics' }, { status: 500 })
  }
}
