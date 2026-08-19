import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { validateApiKey } from '@/lib/api-key-auth'
import { requireCapacity } from '@/lib/billing/usage'
import { BillingError, billingErrorToResponse } from '@/lib/billing/billing-errors'
import { redis } from '@/lib/redis'

export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req, 'qr:read')
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    const { requireFeature } = await import('@/lib/billing/entitlements')
    await requireFeature(auth.orgId!, 'API_ACCESS', 'pro')
    const qrCodes = await db.qRCode.findMany({
      where: { organizationId: auth.orgId, isInTrash: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        shortCode: true,
        type: true,
        destinationUrl: true,
        scanCount: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ success: true, data: qrCodes })
  } catch (error) {
    console.error('GET /api/v1/qr Error:', error)
    return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req, 'qr:write')
  if (!auth.authenticated) {
    return NextResponse.json({ error: auth.error }, { status: 401 })
  }

  try {
    // Check QR code capacity limit for organization
    await requireCapacity(auth.orgId!, 'QR_CODE', 1, 'pro')

    const body = await req.json()
    const { title, type, destinationUrl, fgColor, bgColor, description } = body

    if (!title || !destinationUrl) {
      return NextResponse.json({ error: 'title and destinationUrl are required fields' }, { status: 400 })
    }

    const shortCode = Math.random().toString(36).substring(2, 9)

    const qr = await db.qRCode.create({
      data: {
        title,
        type: type || 'WEBSITE',
        shortCode,
        destinationUrl,
        fgColor: fgColor || '#000000',
        bgColor: bgColor || '#FFFFFF',
        description: description || null,
        organizationId: auth.orgId!,
        creatorId: auth.userId!,
      },
    })

    // Pre-cache in Redis for instant redirect
    const cachePayload = {
      destinationUrl,
      isArchived: false,
      isInTrash: false,
      expiresAt: null,
      startsAt: null,
      maxScans: null,
      scanCount: 0,
    }
    await redis.set(`qr:short:${shortCode}`, JSON.stringify(cachePayload), { ex: 600 })

    return NextResponse.json({ success: true, data: qr }, { status: 201 })
  } catch (error) {
    if (error instanceof BillingError) {
      return NextResponse.json(billingErrorToResponse(error), { status: error.statusCode })
    }
    console.error('POST /api/v1/qr Error:', error)
    return NextResponse.json({ error: 'Failed to create QR code' }, { status: 500 })
  }
}
