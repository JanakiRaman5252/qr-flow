import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUserAndOrg } from '@/lib/get-session-user'
import { handleApiError } from '@/lib/errors'

export async function GET(req: NextRequest) {
  try {
    const { orgId } = await getCurrentUserAndOrg()

    // Get all QR IDs for this org (needed for scan queries)
    const qrIds = (
      await db.qRCode.findMany({
        where: { organizationId: orgId },
        select: { id: true },
      })
    ).map((q) => q.id)

    // Run all independent queries in parallel
    const [activeQRsCount, dynamicQRsCount, totalScans, uniqueVisitors, topCountryResult, recentQRs] =
      await Promise.all([
        db.qRCode.count({
          where: { organizationId: orgId, isInTrash: false, isArchived: false },
        }),
        db.qRCode.count({
          where: { organizationId: orgId, type: { not: 'TEXT' } },
        }),
        qrIds.length > 0
          ? db.scanEvent.count({ where: { qrCodeId: { in: qrIds } } })
          : Promise.resolve(0),
        qrIds.length > 0
          ? db.scanEvent.count({ where: { qrCodeId: { in: qrIds }, isUnique: true } })
          : Promise.resolve(0),
        qrIds.length > 0
          ? db.scanEvent.groupBy({
              by: ['country'],
              where: { qrCodeId: { in: qrIds } },
              _count: { country: true },
              orderBy: { _count: { country: 'desc' } },
              take: 1,
            })
          : Promise.resolve([]),
        db.qRCode.findMany({
          where: { organizationId: orgId },
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ])

    const topCountry = topCountryResult[0]?.country || 'No Scans Yet'

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
    return handleApiError(error)
  }
}
